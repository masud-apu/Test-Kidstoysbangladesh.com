/*
  Import products from trendy_toys.csv into the products table using Drizzle ORM.
  Usage: pnpm tsx scripts/import-csv.ts [--file path/to.csv]
*/

import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import dotenv from 'dotenv'
import { type NewProduct } from '@/lib/schema'

const DEFAULT_CSV = path.resolve(process.cwd(), 'trendy_toys.csv')

function parseMaybeJsonArray(input: string | null | undefined): string[] {
  if (!input) return []
  // CSV shows single-quoted array syntax. Convert to valid JSON then parse
  const normalized = input
    .replace(/^\s*None\s*$/i, '[]')
    .replace(/'/g, '"')
  try {
    const arr = JSON.parse(normalized)
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

function parseImagesField(input: string | null | undefined): string[] {
  if (!input) return []
  // If input looks like a URL, wrap in array; if it's json-ish, reuse parseMaybeJsonArray
  if (/^https?:\/\//i.test(input)) return [input]
  return parseMaybeJsonArray(input)
}

async function main() {
  // Load env from .env.local or .env if present
  const envLocal = path.resolve(process.cwd(), '.env.local')
  const envDefault = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
  else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault })

  const fileFlagIndex = process.argv.indexOf('--file')
  const csvPath = fileFlagIndex !== -1 ? path.resolve(process.cwd(), process.argv[fileFlagIndex + 1]) : DEFAULT_CSV

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at: ${csvPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(csvPath, 'utf8')
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>

  if (!rows.length) {
    console.log('No rows found in CSV.')
    process.exit(0)
  }

  // Map CSV rows to NewProduct[]
  const payload: NewProduct[] = rows.map((r) => {
    const title = String(r.name || r.title || '').trim()
    const description = r.description ? String(r.description) : null
    const handle = String(r.handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))

    return {
      handle,
      title,
      tags: parseMaybeJsonArray(r.tags),
      images: parseImagesField(r.images),
      description,
      status: 'active',
      // Note: Price and comparePrice are now stored in product variants, not products table
      // This script only imports basic product info. Use admin panel to add variants and pricing.
    }
  })

  // Upsert-like behavior: insert and ignore conflicts on unique handle
  // Neon/Postgres support ON CONFLICT DO NOTHING via drizzle .onConflictDoNothing
  try {
    // Ensure DATABASE_URL exists before importing db.
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set. Create .env.local with DATABASE_URL or export it in your shell.')
      process.exit(1)
    }

    // Import after env is loaded
    const { db } = await import('@/lib/db')
    const { products } = await import('@/lib/schema')
    const inserted = await db
      .insert(products)
      .values(payload)
      .onConflictDoNothing({ target: products.handle })
    console.log(`Import complete. Attempted: ${payload.length}. Inserted: ${Array.isArray(inserted) ? inserted.length : 'OK'}`)
  } catch (err) {
    console.error('Import failed:', err)
    process.exit(1)
  }
}

main().then(() => process.exit(0))

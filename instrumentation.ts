export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation (if needed)
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation (if needed)
  }

  if (typeof window !== 'undefined') {
    // Client-side instrumentation
    await import('./instrumentation-client')
  }
}
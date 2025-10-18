import { db } from '@/lib/db'
import {
  financialTransactions,
  cashBalance,
  inventoryBatches,
  boxInventoryBatches,
  packingMaterialBatches,
  type FinancialTransaction
} from '@/lib/schema'
import { eq, desc, and, gte, lte, sql, gt } from 'drizzle-orm'

export type TransactionType = 'CASH_IN' | 'EXPENSE' | 'INVENTORY_PURCHASE' | 'ORDER_REVENUE' | 'ORDER_EXPENSE' | 'INVENTORY_SYNC' | 'INVENTORY_USAGE'

export interface CreateTransactionParams {
  type: TransactionType
  amount: number
  description: string
  category?: string
  orderId?: number
  inventoryBatchId?: number
  boxBatchId?: number
  materialBatchId?: number
  createdBy?: number
}

export class FinanceService {
  /**
   * Get current cash balance
   */
  static async getCurrentBalance(): Promise<number> {
    const result = await db.select().from(cashBalance).limit(1)

    if (result.length === 0) {
      // Initialize if doesn't exist
      await db.insert(cashBalance).values({ balance: '0.00' })
      return 0
    }

    return parseFloat(result[0].balance)
  }

  /**
   * Get current asset balance from the last transaction
   */
  static async getCurrentAssetBalance(): Promise<number> {
    const [lastTransaction] = await db
      .select()
      .from(financialTransactions)
      .orderBy(desc(financialTransactions.createdAt))
      .limit(1)

    if (!lastTransaction) {
      return 0
    }

    return parseFloat(lastTransaction.assetBalanceAfter)
  }

  /**
   * Create a new financial transaction
   */
  static async createTransaction(params: CreateTransactionParams): Promise<FinancialTransaction> {
    const currentCashBalance = await this.getCurrentBalance()
    const currentAssetBalance = await this.getCurrentAssetBalance()

    // Calculate changes based on transaction type
    let cashChange = 0
    let assetChange = 0

    switch (params.type) {
      case 'CASH_IN':
        // Adding cash increases cash balance
        cashChange = Math.abs(params.amount)
        break

      case 'EXPENSE':
      case 'ORDER_EXPENSE':
        // Expenses decrease cash balance
        cashChange = -Math.abs(params.amount)
        break

      case 'INVENTORY_PURCHASE':
        // Buying inventory: cash decreases, assets increase
        cashChange = -Math.abs(params.amount)
        assetChange = Math.abs(params.amount)
        break

      case 'INVENTORY_SYNC':
        // Initial inventory sync: only record assets, don't touch cash
        // This is for recording existing inventory you already have
        cashChange = 0
        assetChange = Math.abs(params.amount)
        break

      case 'ORDER_REVENUE':
        // Revenue increases cash
        cashChange = Math.abs(params.amount)
        break

      case 'INVENTORY_USAGE':
        // Using inventory for orders: decreases assets, no cash change
        cashChange = 0
        assetChange = -Math.abs(params.amount)
        break

      default:
        throw new Error(`Unknown transaction type: ${params.type}`)
    }

    const newCashBalance = currentCashBalance + cashChange
    const newAssetBalance = currentAssetBalance + assetChange
    const newTotalBalance = newCashBalance + newAssetBalance

    // Determine the amount to display based on what changed
    let displayAmount: number
    if (cashChange !== 0) {
      // If cash changed, show the cash change (positive for income, negative for expenses)
      displayAmount = cashChange
    } else if (assetChange !== 0) {
      // If only assets changed, show the asset change
      displayAmount = assetChange
    } else {
      // No change (shouldn't happen, but just in case)
      displayAmount = 0
    }

    // Create transaction record
    const [transaction] = await db.insert(financialTransactions).values({
      transactionType: params.type,
      category: params.category,
      amount: displayAmount.toFixed(2),
      cashBalanceAfter: newCashBalance.toFixed(2),
      assetBalanceAfter: newAssetBalance.toFixed(2),
      balanceAfter: newTotalBalance.toFixed(2),
      description: params.description,
      orderId: params.orderId,
      inventoryBatchId: params.inventoryBatchId,
      boxBatchId: params.boxBatchId,
      materialBatchId: params.materialBatchId,
      createdBy: params.createdBy,
    }).returning()

    // Update cash balance (only cash, not assets)
    await db.update(cashBalance)
      .set({
        balance: newCashBalance.toFixed(2),
        updatedAt: new Date()
      })

    return transaction
  }

  /**
   * Get all transactions with optional filters
   */
  static async getTransactions(filters?: {
    type?: TransactionType
    category?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  }) {
    let query = db.select().from(financialTransactions)

    const conditions = []

    if (filters?.type) {
      conditions.push(eq(financialTransactions.transactionType, filters.type))
    }

    if (filters?.category) {
      conditions.push(eq(financialTransactions.category, filters.category))
    }

    if (filters?.dateFrom) {
      conditions.push(gte(financialTransactions.createdAt, filters.dateFrom))
    }

    if (filters?.dateTo) {
      conditions.push(lte(financialTransactions.createdAt, filters.dateTo))
    }

    if (conditions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.where(and(...conditions)) as any
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.orderBy(desc(financialTransactions.createdAt)) as any

    if (filters?.limit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.limit(filters.limit) as any
    }

    if (filters?.offset) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.offset(filters.offset) as any
    }

    const transactions = await query

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(financialTransactions)

    if (conditions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      countQuery = countQuery.where(and(...conditions)) as any
    }

    const [{ count }] = await countQuery

    return {
      transactions,
      total: Number(count),
    }
  }

  /**
   * Calculate total asset values
   */
  static async getAssetValues() {
    // Calculate product inventory value
    const [productInventoryResult] = await db
      .select({
        totalValue: sql<number>`SUM(${inventoryBatches.remainingQuantity}::numeric * ${inventoryBatches.purchasePrice}::numeric)`,
      })
      .from(inventoryBatches)
      .where(gt(inventoryBatches.remainingQuantity, 0))

    // Calculate box inventory value
    const [boxInventoryResult] = await db
      .select({
        totalValue: sql<number>`SUM(${boxInventoryBatches.remainingQuantity}::numeric * ${boxInventoryBatches.purchasePrice}::numeric)`,
      })
      .from(boxInventoryBatches)
      .where(gt(boxInventoryBatches.remainingQuantity, 0))

    // Calculate packing material value
    const [materialInventoryResult] = await db
      .select({
        totalValue: sql<number>`SUM(${packingMaterialBatches.remainingAmount}::numeric)`,
      })
      .from(packingMaterialBatches)
      .where(gt(packingMaterialBatches.remainingAmount, '0'))

    const productInventoryValue = parseFloat(productInventoryResult?.totalValue?.toString() || '0')
    const boxInventoryValue = parseFloat(boxInventoryResult?.totalValue?.toString() || '0')
    const materialInventoryValue = parseFloat(materialInventoryResult?.totalValue?.toString() || '0')

    return {
      productInventory: productInventoryValue,
      boxInventory: boxInventoryValue,
      materialInventory: materialInventoryValue,
      totalInventoryValue: productInventoryValue + boxInventoryValue + materialInventoryValue,
    }
  }

  /**
   * Get transaction summary/statistics
   */
  static async getTransactionSummary(filters?: {
    dateFrom?: Date
    dateTo?: Date
  }) {
    const conditions = []

    if (filters?.dateFrom) {
      conditions.push(gte(financialTransactions.createdAt, filters.dateFrom))
    }

    if (filters?.dateTo) {
      conditions.push(lte(financialTransactions.createdAt, filters.dateTo))
    }

    // Get totals by type
    let query = db.select({
      type: financialTransactions.transactionType,
      total: sql<number>`SUM(CASE WHEN ${financialTransactions.amount} > 0 THEN ${financialTransactions.amount} ELSE 0 END)`,
      totalExpense: sql<number>`SUM(CASE WHEN ${financialTransactions.amount} < 0 THEN ABS(${financialTransactions.amount}) ELSE 0 END)`,
      count: sql<number>`count(*)`,
    })
    .from(financialTransactions)
    .groupBy(financialTransactions.transactionType)

    if (conditions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.where(and(...conditions)) as any
    }

    const summary = await query
    const actualInventoryValues = await this.getAssetValues()
    const currentCashBalance = await this.getCurrentBalance()
    const currentAssetBalance = await this.getCurrentAssetBalance()

    return {
      byType: summary.map(s => ({
        type: s.type,
        totalIncome: parseFloat(s.total?.toString() || '0'),
        totalExpense: parseFloat(s.totalExpense?.toString() || '0'),
        count: Number(s.count),
      })),
      currentBalance: currentCashBalance,
      currentAssetBalance: currentAssetBalance,
      totalAssets: currentCashBalance + currentAssetBalance,
      // Also include actual inventory values for reference/debugging
      actualInventoryValues,
    }
  }

  /**
   * Record order revenue (called when order is created/paid)
   */
  static async recordOrderRevenue(orderId: number, amount: number, createdBy?: number) {
    return await this.createTransaction({
      type: 'ORDER_REVENUE',
      amount,
      description: `Revenue from order #${orderId}`,
      category: 'sales',
      orderId,
      createdBy,
    })
  }

  /**
   * Record order expenses (shipping, COD, packing costs)
   */
  static async recordOrderExpense(orderId: number, amount: number, description: string, createdBy?: number) {
    return await this.createTransaction({
      type: 'ORDER_EXPENSE',
      amount,
      description,
      category: 'order_costs',
      orderId,
      createdBy,
    })
  }

  /**
   * Record inventory usage when order is shipped (decreases assets)
   */
  static async recordInventoryUsage(orderId: number, inventoryCost: number, createdBy?: number) {
    return await this.createTransaction({
      type: 'INVENTORY_USAGE',
      amount: inventoryCost,
      description: `Inventory cost for shipped order #${orderId}`,
      category: 'inventory_usage',
      orderId,
      createdBy,
    })
  }

  /**
   * Record inventory purchase
   */
  static async recordInventoryPurchase(
    amount: number,
    description: string,
    batchId?: number,
    boxBatchId?: number,
    materialBatchId?: number,
    createdBy?: number
  ) {
    return await this.createTransaction({
      type: 'INVENTORY_PURCHASE',
      amount,
      description,
      category: 'inventory',
      inventoryBatchId: batchId,
      boxBatchId,
      materialBatchId,
      createdBy,
    })
  }
}

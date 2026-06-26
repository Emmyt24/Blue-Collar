import { db } from '../db.js'
import { AppError } from '../utils/AppError.js'

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
const FRIENDBOT_URL = 'https://friendbot-testnet.stellar.org/bump_sequence'

/**
 * Fetch account balance and sequence from Horizon.
 */
export async function getAccountInfo(publicKey: string) {
  const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)

  if (response.status === 404) {
    throw new AppError('Account not found on Stellar network', 404)
  }

  if (!response.ok) {
    throw new AppError(`Stellar network error: ${response.statusText}`, response.status)
  }

  const data = (await response.json()) as {
    balances: Array<{ balance: string; asset_type: string }>
    sequence: string
  }

  // Find native XLM balance
  const nativeBalance = data.balances.find((b) => b.asset_type === 'native')
  const balance = nativeBalance ? parseFloat(nativeBalance.balance) : 0

  return {
    publicKey,
    balance,
    sequence: BigInt(data.sequence),
  }
}

/**
 * Sync or create a Stellar account for a user.
 * Fetches current balance and sequence from Horizon.
 */
export async function syncStellarAccount(userId: string, publicKey: string) {
  const accountInfo = await getAccountInfo(publicKey)

  return db.stellarAccount.upsert({
    where: { publicKey },
    update: {
      balance: accountInfo.balance,
      sequences: accountInfo.sequence,
      lastSyncedAt: new Date(),
    },
    create: {
      publicKey,
      userId,
      balance: accountInfo.balance,
      sequences: accountInfo.sequence,
      lastSyncedAt: new Date(),
    },
  })
}

/**
 * Get cached balance for a user's Stellar account.
 */
export async function getUserBalance(userId: string) {
  const account = await db.stellarAccount.findFirst({
    where: { userId },
  })

  if (!account) {
    throw new AppError('Stellar account not linked', 404)
  }

  return {
    publicKey: account.publicKey,
    balance: account.balance,
    lastSyncedAt: account.lastSyncedAt,
  }
}

/**
 * Build an unsigned transaction XDR for a tip/payment.
 * Returns XDR that client signs and broadcasts.
 */
export async function buildUnsignedTx(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  memo?: string,
) {
  const account = await db.stellarAccount.findUnique({
    where: { publicKey: sourcePublicKey },
  })

  if (!account) {
    throw new AppError('Source account not found', 404)
  }

  // Fetch latest sequence to avoid gaps
  const current = await getAccountInfo(sourcePublicKey)
  const nextSequence = (current.sequence + BigInt(1)).toString()

  // Build transaction with SDK
  // For now, return mock transaction data - actual SDK integration depends on stellar-sdk
  return {
    sourcePublicKey,
    destinationPublicKey,
    amount,
    memo: memo || '',
    sequence: nextSequence,
    // xdr: (signed by client),
  }
}

/**
 * Submit a signed XDR transaction to Stellar network.
 */
export async function broadcastTransaction(signedXdr: string) {
  const response = await fetch(`${HORIZON_URL}/transactions`, {
    method: 'POST',
    body: new URLSearchParams({ tx: signedXdr }),
  })

  if (!response.ok) {
    const error = (await response.json()) as { title?: string; detail?: string }
    throw new AppError(`Broadcast failed: ${error.detail || error.title}`, response.status)
  }

  const result = (await response.json()) as { hash: string; id: string }
  return {
    txHash: result.hash,
    txId: result.id,
  }
}

/**
 * Poll transaction status from Horizon.
 */
export async function pollTransactionStatus(txHash: string) {
  const response = await fetch(`${HORIZON_URL}/transactions/${txHash}`)

  if (response.status === 404) {
    return { status: 'pending' }
  }

  if (!response.ok) {
    throw new AppError('Failed to fetch transaction status', response.status)
  }

  const tx = (await response.json()) as { successful: boolean; result_code: string }

  return {
    status: tx.successful ? 'confirmed' : 'failed',
    resultCode: tx.result_code,
  }
}

/**
 * Fund testnet account via friendbot.
 * Only works on testnet.
 */
export async function fundTestnetAccount(publicKey: string) {
  const response = await fetch(FRIENDBOT_URL, {
    method: 'POST',
    body: JSON.stringify({ account: publicKey }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = (await response.json()) as { error?: string }
    throw new AppError(
      `Friendbot failed: ${error.error || response.statusText}`,
      response.status,
    )
  }

  const result = (await response.json()) as { hash: string }
  return { txHash: result.hash, message: 'Account funded successfully' }
}

/**
 * Register a user's Stellar account for the first time.
 * Links wallet to user profile and syncs balance.
 */
export async function linkStellarAccount(userId: string, publicKey: string) {
  // Verify account exists on network
  await getAccountInfo(publicKey)

  // Check if already linked to another user
  const existing = await db.stellarAccount.findUnique({
    where: { publicKey },
  })

  if (existing && existing.userId !== userId) {
    throw new AppError('Wallet already linked to another account', 400)
  }

  return syncStellarAccount(userId, publicKey)
}

/**
 * Get all transactions for a Stellar account from Horizon.
 */
export async function getAccountTransactions(
  publicKey: string,
  limit = 50,
  order: 'asc' | 'desc' = 'desc',
) {
  const response = await fetch(
    `${HORIZON_URL}/accounts/${publicKey}/transactions?limit=${limit}&order=${order}`,
  )

  if (!response.ok) {
    throw new AppError('Failed to fetch transactions', response.status)
  }

  const data = (await response.json()) as {
    _embedded: { records: Array<{ hash: string; created_at: string }> }
  }

  return data._embedded.records
}

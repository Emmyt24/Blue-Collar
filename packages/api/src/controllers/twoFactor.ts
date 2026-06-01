import type { Request, Response } from 'express'
import * as twoFactorService from '../services/twoFactor.service.js'
import { handleError } from '../utils/handleError.js'

/** POST /api/auth/2fa/setup — generate secret + QR code */
export async function setup2FA(req: Request, res: Response) {
  try {
    const result = await twoFactorService.setupTwoFactor(req.user!.id)
    return res.status(200).json({ data: result, status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/** POST /api/auth/2fa/enable — verify token and activate 2FA */
export async function enable2FA(req: Request, res: Response) {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ status: 'error', message: 'token is required', code: 400 })
    const result = await twoFactorService.enableTwoFactor(req.user!.id, String(token))
    return res.status(200).json({ data: result, status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/** POST /api/auth/2fa/verify — verify TOTP during login */
export async function verify2FA(req: Request, res: Response) {
  try {
    const { userId, token } = req.body
    if (!userId || !token) {
      return res.status(400).json({ status: 'error', message: 'userId and token are required', code: 400 })
    }
    const valid = await twoFactorService.verifyTwoFactor(String(userId), String(token))
    if (!valid) return res.status(401).json({ status: 'error', message: 'Invalid TOTP token', code: 401 })
    return res.status(200).json({ status: 'success', message: '2FA verified', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/** POST /api/auth/2fa/verify-backup — verify a backup code */
export async function verifyBackupCode(req: Request, res: Response) {
  try {
    const { userId, code } = req.body
    if (!userId || !code) {
      return res.status(400).json({ status: 'error', message: 'userId and code are required', code: 400 })
    }
    const valid = await twoFactorService.verifyBackupCode(String(userId), String(code))
    if (!valid) return res.status(401).json({ status: 'error', message: 'Invalid backup code', code: 401 })
    return res.status(200).json({ status: 'success', message: 'Backup code accepted', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/** DELETE /api/auth/2fa — disable 2FA */
export async function disable2FA(req: Request, res: Response) {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ status: 'error', message: 'token is required', code: 400 })
    await twoFactorService.disableTwoFactor(req.user!.id, String(token))
    return res.status(200).json({ status: 'success', message: '2FA disabled', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/** POST /api/auth/2fa/backup-codes/regenerate — regenerate backup codes */
export async function regenerateBackupCodes(req: Request, res: Response) {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ status: 'error', message: 'token is required', code: 400 })
    const result = await twoFactorService.regenerateBackupCodes(req.user!.id, String(token))
    return res.status(200).json({ data: result, status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

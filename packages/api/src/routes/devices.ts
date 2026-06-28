import { Router } from 'express'
import { listDevices, revokeDevice, revokeAllOtherDevices } from '../controllers/devices.js'
import { authenticate } from '../middleware/auth.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = Router()

// List all active devices for the user
router.get('/devices', authenticate, catchAsync(listDevices))

// Revoke a specific device
router.delete('/devices/:deviceId', authenticate, catchAsync(revokeDevice))

// Revoke all other devices (logout from all other sessions)
router.post('/devices/revoke-others', authenticate, catchAsync(revokeAllOtherDevices))

export default router

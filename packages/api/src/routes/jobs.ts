import { Router } from 'express'
import {
  listJobs,
  showJob,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  listApplications,
  updateApplicationStatus,
  withdrawApplication,
} from '../controllers/jobs.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Job CRUD
router.get('/', listJobs)
router.get('/:id', showJob)
router.post('/', authenticate, createJob)
router.put('/:id', authenticate, updateJob)
router.delete('/:id', authenticate, deleteJob)

// Applications
router.post('/:id/apply', authenticate, applyToJob)
router.get('/:id/applications', authenticate, listApplications)
router.patch('/:id/applications/:applicationId', authenticate, updateApplicationStatus)
router.delete('/:id/apply', authenticate, withdrawApplication)

export default router

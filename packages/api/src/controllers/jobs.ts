import type { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync.js'
import * as jobService from '../services/job.service.js'
import { handleError } from '../utils/handleError.js'
import { validate } from '../middleware/validate.js'
import {
  createJobSchema,
  updateJobSchema,
  applyToJobSchema,
  updateApplicationStatusSchema,
  sendMessageSchema,
  listJobsQuerySchema,
} from '../validations/job.js'

// ── Exported validators for use in router ─────────────────────────────────────
export const validateCreateJob = validate(createJobSchema)
export const validateUpdateJob = validate(updateJobSchema)
export const validateApply = validate(applyToJobSchema)
export const validateAppStatus = validate(updateApplicationStatusSchema)
export const validateSendMessage = validate(sendMessageSchema)
export const validateListQuery = validate(listJobsQuerySchema, 'query')

// ── Jobs CRUD ─────────────────────────────────────────────────────────────────

export const listJobs = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, status, search, skills, urgency, minBudget, maxBudget, page, limit } = req.query as any
  const result = await jobService.listJobs({
    categoryId, status, search, urgency, minBudget, maxBudget,
    skills: skills ? String(skills).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
    page: Number(page ?? 1),
    limit: Number(limit ?? 20),
  })
  return res.json({ ...result, status: 'success', code: 200 })
})

export const showJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.getJob(req.params.id)
  return res.json({ data: job, status: 'success', code: 200 })
})

export const createJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.createJob(req.body, req.user!.id)
  return res.status(201).json({ data: job, status: 'success', code: 201 })
})

export const updateJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.updateJob(req.params.id, req.user!.id, req.body)
  return res.json({ data: job, status: 'success', code: 200 })
})

export const deleteJob = catchAsync(async (req: Request, res: Response) => {
  await jobService.deleteJob(req.params.id, req.user!.id)
  return res.status(204).send()
})

export const renewJob = catchAsync(async (req: Request, res: Response) => {
  const days = req.body.days ? Number(req.body.days) : 30
  const job = await jobService.renewJob(req.params.id, req.user!.id, days)
  return res.json({ data: job, status: 'success', code: 200 })
})

// ── Recommendations ───────────────────────────────────────────────────────────

export const recommendedJobs = catchAsync(async (req: Request, res: Response) => {
  const jobs = await jobService.recommendedJobs(req.params.workerId)
  return res.json({ data: jobs, status: 'success', code: 200 })
})

// ── My jobs / applications ────────────────────────────────────────────────────

export const myPostedJobs = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any
  const result = await jobService.myPostedJobs(req.user!.id, Number(page ?? 1), Number(limit ?? 20))
  return res.json({ ...result, status: 'success', code: 200 })
})

export const myApplications = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any
  // workerId comes from query — worker must pass their worker profile id
  const { workerId } = req.query as any
  if (!workerId) return res.status(400).json({ status: 'error', message: 'workerId is required', code: 400 })
  const result = await jobService.myApplications(String(workerId), Number(page ?? 1), Number(limit ?? 20))
  return res.json({ ...result, status: 'success', code: 200 })
})

// ── Applications ──────────────────────────────────────────────────────────────

export const applyToJob = catchAsync(async (req: Request, res: Response) => {
  const { workerId, coverLetter, proposedRate } = req.body
  const application = await jobService.applyToJob(req.params.id, String(workerId), coverLetter, proposedRate)
  return res.status(201).json({ data: application, status: 'success', code: 201 })
})

export const listApplications = catchAsync(async (req: Request, res: Response) => {
  const applications = await jobService.listApplications(req.params.id, req.user!.id)
  return res.json({ data: applications, status: 'success', code: 200 })
})

export const updateApplicationStatus = catchAsync(async (req: Request, res: Response) => {
  const application = await jobService.updateApplicationStatus(
    req.params.id,
    req.params.applicationId,
    req.user!.id,
    req.body.status,
  )
  return res.json({ data: application, status: 'success', code: 200 })
})

export const withdrawApplication = catchAsync(async (req: Request, res: Response) => {
  const { workerId } = req.body
  if (!workerId) return res.status(400).json({ status: 'error', message: 'workerId is required', code: 400 })
  const application = await jobService.withdrawApplication(req.params.id, String(workerId))
  return res.json({ data: application, status: 'success', code: 200 })
})

// ── Messaging ─────────────────────────────────────────────────────────────────

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { recipientId, body } = req.body
  const message = await jobService.sendMessage(req.params.id, req.user!.id, recipientId, body)
  return res.status(201).json({ data: message, status: 'success', code: 201 })
})

export const listMessages = catchAsync(async (req: Request, res: Response) => {
  const messages = await jobService.listMessages(req.params.id, req.user!.id)
  return res.json({ data: messages, status: 'success', code: 200 })
})

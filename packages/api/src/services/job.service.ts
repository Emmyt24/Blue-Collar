import { db } from '../db.js'
import { AppError } from '../services/AppError.js'

const jobInclude = {
  category: true,
  location: true,
  postedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { applications: true } },
} as const

/** Auto-expire jobs whose expiresAt has passed */
async function expireJobs() {
  await db.job.updateMany({
    where: { status: 'open', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  })
}

export async function listJobs(opts: {
  categoryId?: string
  status?: string
  page?: number
  limit?: number
}) {
  await expireJobs()
  const { categoryId, status = 'open', page = 1, limit = 20 } = opts
  const where: any = {
    ...(status !== 'all' ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
  }
  const [data, total] = await Promise.all([
    db.job.findMany({ where, skip: (page - 1) * limit, take: limit, include: jobInclude, orderBy: { createdAt: 'desc' } }),
    db.job.count({ where }),
  ])
  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function getJob(id: string) {
  await expireJobs()
  const job = await db.job.findUnique({ where: { id }, include: jobInclude })
  if (!job) throw new AppError('Job not found', 404)
  return job
}

export async function createJob(data: {
  title: string
  description: string
  budget?: number
  categoryId: string
  locationId?: string
  expiresAt?: string
}, postedById: string) {
  return db.job.create({
    data: {
      title: data.title,
      description: data.description,
      budget: data.budget,
      categoryId: data.categoryId,
      locationId: data.locationId,
      postedById,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
    include: jobInclude,
  })
}

export async function updateJob(id: string, userId: string, data: Partial<{
  title: string
  description: string
  budget: number
  categoryId: string
  locationId: string
  status: string
  expiresAt: string
}>) {
  const job = await db.job.findUnique({ where: { id } })
  if (!job) throw new AppError('Job not found', 404)
  if (job.postedById !== userId) throw new AppError('Forbidden', 403)

  return db.job.update({
    where: { id },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    } as any,
    include: jobInclude,
  })
}

export async function deleteJob(id: string, userId: string) {
  const job = await db.job.findUnique({ where: { id } })
  if (!job) throw new AppError('Job not found', 404)
  if (job.postedById !== userId) throw new AppError('Forbidden', 403)
  await db.job.delete({ where: { id } })
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function applyToJob(jobId: string, workerId: string, coverLetter?: string) {
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) throw new AppError('Job not found', 404)
  if (job.status !== 'open') throw new AppError('Job is not accepting applications', 400)

  const existing = await db.jobApplication.findUnique({ where: { jobId_workerId: { jobId, workerId } } })
  if (existing) throw new AppError('Already applied to this job', 409)

  return db.jobApplication.create({
    data: { jobId, workerId, coverLetter },
    include: { job: { select: { id: true, title: true } }, worker: { select: { id: true, name: true } } },
  })
}

export async function listApplications(jobId: string, userId: string) {
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) throw new AppError('Job not found', 404)
  if (job.postedById !== userId) throw new AppError('Forbidden', 403)

  return db.jobApplication.findMany({
    where: { jobId },
    include: { worker: { select: { id: true, name: true, avatar: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateApplicationStatus(
  jobId: string,
  applicationId: string,
  userId: string,
  status: 'accepted' | 'rejected'
) {
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) throw new AppError('Job not found', 404)
  if (job.postedById !== userId) throw new AppError('Forbidden', 403)

  const app = await db.jobApplication.findFirst({ where: { id: applicationId, jobId } })
  if (!app) throw new AppError('Application not found', 404)

  const updated = await db.jobApplication.update({ where: { id: applicationId }, data: { status } })

  // If accepted, mark job as filled
  if (status === 'accepted') {
    await db.job.update({ where: { id: jobId }, data: { status: 'filled' } })
  }

  return updated
}

export async function withdrawApplication(jobId: string, workerId: string) {
  const app = await db.jobApplication.findUnique({ where: { jobId_workerId: { jobId, workerId } } })
  if (!app) throw new AppError('Application not found', 404)
  if (app.status !== 'pending') throw new AppError('Cannot withdraw a non-pending application', 400)
  return db.jobApplication.update({ where: { id: app.id }, data: { status: 'withdrawn' } })
}

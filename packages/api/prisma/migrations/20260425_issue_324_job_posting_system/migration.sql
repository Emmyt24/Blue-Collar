-- Issue #324: Job posting system

-- CreateEnum: JobStatus
DO $$ BEGIN
  CREATE TYPE "JobStatus" AS ENUM ('open', 'closed', 'expired', 'filled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: ApplicationStatus
DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: Job
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "categoryId" TEXT NOT NULL,
    "locationId" TEXT,
    "postedById" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobApplication
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique application per worker per job
CREATE UNIQUE INDEX "JobApplication_jobId_workerId_key" ON "JobApplication"("jobId", "workerId");

-- AddForeignKey: Job -> Category
ALTER TABLE "Job" ADD CONSTRAINT "Job_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Job -> Location
ALTER TABLE "Job" ADD CONSTRAINT "Job_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Job -> User (poster)
ALTER TABLE "Job" ADD CONSTRAINT "Job_postedById_fkey"
    FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: JobApplication -> Job
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: JobApplication -> Worker
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

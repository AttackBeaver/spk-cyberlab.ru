-- CreateEnum
CREATE TYPE "SandboxTaskType" AS ENUM ('SQL_INJECTION', 'XSS', 'PHISHING', 'CODE', 'CUSTOM', 'DATABASE');

-- CreateEnum
CREATE TYPE "SandboxAttemptStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'TIME_EXPIRED');

-- CreateEnum
CREATE TYPE "SandboxEnvType" AS ENUM ('SQL', 'JS', 'PYTHON', 'CMD');

-- CreateEnum
CREATE TYPE "SandboxRunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SandboxTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "type" "SandboxTaskType" NOT NULL DEFAULT 'CUSTOM',
    "answerTemplate" TEXT,
    "htmlTemplate" TEXT,
    "expectedResult" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER,
    "attemptsLimit" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" INTEGER,
    "config" JSONB,
    "hint" TEXT,
    "expectedReport" TEXT,
    "isManualReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SandboxTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxTaskGroup" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxTaskGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxAttempt" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "answer" TEXT,
    "score" DOUBLE PRECISION,
    "status" "SandboxAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SandboxAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxEnvironment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "type" "SandboxEnvType" NOT NULL DEFAULT 'SQL',
    "image" TEXT,
    "parameters" JSONB,

    CONSTRAINT "SandboxEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxRunSession" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "containerId" TEXT,
    "status" "SandboxRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SandboxRunSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "SandboxTaskType" NOT NULL,
    "configSchema" JSONB NOT NULL,
    "defaultConfig" JSONB NOT NULL,
    "previewHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SandboxTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxStudentReport" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SandboxStudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SandboxTaskGroup_taskId_groupId_key" ON "SandboxTaskGroup"("taskId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxEnvironment_taskId_key" ON "SandboxEnvironment"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxRunSession_attemptId_key" ON "SandboxRunSession"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxTemplate_name_key" ON "SandboxTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxStudentReport_attemptId_key" ON "SandboxStudentReport"("attemptId");

-- AddForeignKey
ALTER TABLE "SandboxTask" ADD CONSTRAINT "SandboxTask_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxTask" ADD CONSTRAINT "SandboxTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SandboxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxTaskGroup" ADD CONSTRAINT "SandboxTaskGroup_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SandboxTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxTaskGroup" ADD CONSTRAINT "SandboxTaskGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxAttempt" ADD CONSTRAINT "SandboxAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SandboxTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxAttempt" ADD CONSTRAINT "SandboxAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxEnvironment" ADD CONSTRAINT "SandboxEnvironment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SandboxTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxRunSession" ADD CONSTRAINT "SandboxRunSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SandboxAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxStudentReport" ADD CONSTRAINT "SandboxStudentReport_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "SandboxAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxStudentReport" ADD CONSTRAINT "SandboxStudentReport_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

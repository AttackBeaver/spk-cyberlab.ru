/*
  Warnings:

  - The `category` column on the `Meme` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BugSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BugCategory" AS ENUM ('UI', 'SECURITY', 'PERFORMANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'WONTFIX', 'CLOSED');

-- CreateEnum
CREATE TYPE "MemeCategory" AS ENUM ('PHOTO', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable
ALTER TABLE "Meme" DROP COLUMN "category",
ADD COLUMN     "category" "MemeCategory" DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "BugReport" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT,
    "severity" "BugSeverity" NOT NULL DEFAULT 'MEDIUM',
    "category" "BugCategory",
    "status" "BugStatus" NOT NULL DEFAULT 'NEW',
    "userId" INTEGER NOT NULL,
    "adminResponse" TEXT,
    "respondedBy" INTEGER,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemeVote" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "memeId" INTEGER NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemeVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_userId_idx" ON "BugReport"("userId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_createdAt_idx" ON "BugReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemeVote_userId_memeId_key" ON "MemeVote"("userId", "memeId");

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemeVote" ADD CONSTRAINT "MemeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemeVote" ADD CONSTRAINT "MemeVote_memeId_fkey" FOREIGN KEY ("memeId") REFERENCES "Meme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

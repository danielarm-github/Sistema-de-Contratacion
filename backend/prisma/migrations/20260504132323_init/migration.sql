/*
  Warnings:

  - The `status` column on the `Contract` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status_id` on the `Request` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RequestStatusEnum" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentStatusEnum" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContractStatusEnum" AS ENUM ('DRAFT', 'GENERATED', 'SIGNED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_status_id_fkey";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "status",
ADD COLUMN     "status" "ContractStatusEnum" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "status",
ADD COLUMN     "status" "DocumentStatusEnum" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "status_id",
ADD COLUMN     "requestStatusId" INTEGER,
ADD COLUMN     "status" "RequestStatusEnum" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requestStatusId_fkey" FOREIGN KEY ("requestStatusId") REFERENCES "RequestStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

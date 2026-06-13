-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdBy_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

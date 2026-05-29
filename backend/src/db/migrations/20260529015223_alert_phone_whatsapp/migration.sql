/*
  Warnings:

  - You are about to drop the column `departureDate` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `flightNumber` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `pushSubscription` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `thresholdPrice` on the `alerts` table. All the data in the column will be lost.
  - Added the required column `departureDateFrom` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureDateTo` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxPriceIdr` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `alerts` table without a default value. This is not possible if the table is not empty.

*/
-- Wipe alerts lama (Web Push) — user setuju di plan migrasi
TRUNCATE "alerts" CASCADE;

-- DropIndex
DROP INDEX "alerts_isActive_departureDate_idx";

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "departureDate",
DROP COLUMN "flightNumber",
DROP COLUMN "pushSubscription",
DROP COLUMN "thresholdPrice",
ADD COLUMN     "departureDateFrom" DATE NOT NULL,
ADD COLUMN     "departureDateTo" DATE NOT NULL,
ADD COLUMN     "matchedDate" DATE,
ADD COLUMN     "maxPriceIdr" BIGINT NOT NULL,
ADD COLUMN     "phoneNumber" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE INDEX "alerts_isActive_departureDateFrom_departureDateTo_idx" ON "alerts"("isActive", "departureDateFrom", "departureDateTo");

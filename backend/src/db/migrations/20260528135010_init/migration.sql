-- CreateEnum
CREATE TYPE "FlightSource" AS ENUM ('AMADEUS', 'LIONAIR', 'CITILINK', 'AIRASIA', 'SUPERAIRJET');

-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateTable
CREATE TABLE "price_records" (
    "id" TEXT NOT NULL,
    "source" "FlightSource" NOT NULL,
    "origin" VARCHAR(3) NOT NULL,
    "destination" VARCHAR(3) NOT NULL,
    "date" DATE NOT NULL,
    "airlineCode" VARCHAR(10),
    "flightNumber" VARCHAR(10),
    "cabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "durationMin" INTEGER,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "priceIdr" BIGINT NOT NULL,
    "baggage" TEXT,
    "bookingUrl" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,

    CONSTRAINT "price_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "origin" VARCHAR(3) NOT NULL,
    "destination" VARCHAR(3) NOT NULL,
    "departureDate" DATE NOT NULL,
    "airlineCode" VARCHAR(10),
    "flightNumber" VARCHAR(10),
    "cabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "thresholdPrice" BIGINT NOT NULL,
    "pushSubscription" JSONB NOT NULL,
    "clientId" VARCHAR(64) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastPriceSeen" BIGINT,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "source" "FlightSource" NOT NULL,
    "priceTriggered" BIGINT NOT NULL,
    "flightNumber" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_records_origin_destination_date_airlineCode_idx" ON "price_records"("origin", "destination", "date", "airlineCode");

-- CreateIndex
CREATE INDEX "price_records_scrapedAt_idx" ON "price_records"("scrapedAt" DESC);

-- CreateIndex
CREATE INDEX "alerts_isActive_departureDate_idx" ON "alerts"("isActive", "departureDate");

-- CreateIndex
CREATE INDEX "alerts_clientId_idx" ON "alerts"("clientId");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

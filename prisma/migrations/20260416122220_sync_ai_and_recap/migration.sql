-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "DailyRecap" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_patients" INTEGER NOT NULL DEFAULT 0,
    "missing_sep_count" INTEGER NOT NULL DEFAULT 0,
    "staff_performance" JSONB NOT NULL DEFAULT '[]',
    "missing_sep_details" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRecap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastQueue" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "doctorName" TEXT,
    "clinicName" TEXT,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'PENDING',
    "messageText" TEXT NOT NULL,
    "log" TEXT,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "embedding" DOUBLE PRECISION[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "provider" TEXT NOT NULL DEFAULT 'local',
    "apiKey" TEXT DEFAULT '',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "systemPrompt" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecap_date_key" ON "DailyRecap"("date");

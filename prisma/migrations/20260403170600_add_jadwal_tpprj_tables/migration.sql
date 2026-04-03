-- CreateEnum
CREATE TYPE "DoctorStatus" AS ENUM ('TERJADWAL', 'PENDAFTARAN', 'PRAKTEK', 'PENUH', 'OPERASI', 'CUTI', 'SELESAI', 'LIBUR');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('Sakit', 'Liburan', 'Pribadi', 'Konferensi', 'Lainnya');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('Information', 'Warning', 'Critical');

-- CreateEnum
CREATE TYPE "TargetZone" AS ENUM ('All Zones', 'Lobby Only', 'ER & Wards');

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "status" "DoctorStatus" NOT NULL DEFAULT 'LIBUR',
    "image" TEXT,
    "category" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "queueCode" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "lastCall" TEXT,
    "registrationTime" TEXT,
    "lastManualOverride" BIGINT,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "dayIdx" INTEGER NOT NULL,
    "timeIdx" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "formattedTime" TEXT,
    "registrationTime" TEXT,
    "extra" TEXT,
    "disabledDates" TEXT[],
    "statusOverride" "DoctorStatus",
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "specialty" TEXT,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "avatar" TEXT,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastRule" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "alertLevel" "AlertLevel" NOT NULL,
    "targetZone" "TargetZone" NOT NULL,
    "duration" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "BroadcastRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "runTextMessage" TEXT,
    "emergencyMode" BOOLEAN DEFAULT false,
    "customMessages" JSONB,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffShiftConfig" (
    "id" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "cycle" JSONB NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShiftConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftOverride" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "shiftValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_doctorId_idx" ON "Shift"("doctorId");

-- CreateIndex
CREATE INDEX "Shift_dayIdx_doctorId_idx" ON "Shift"("dayIdx", "doctorId");

-- CreateIndex
CREATE INDEX "LeaveRequest_doctorId_idx" ON "LeaveRequest"("doctorId");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_resource_action_key" ON "RolePermission"("roleId", "resource", "action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "ShiftOverride_staffId_idx" ON "ShiftOverride"("staffId");

-- CreateIndex
CREATE INDEX "ShiftOverride_dateStr_idx" ON "ShiftOverride"("dateStr");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftOverride_staffId_dateStr_key" ON "ShiftOverride"("staffId", "dateStr");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftOverride" ADD CONSTRAINT "ShiftOverride_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffShiftConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

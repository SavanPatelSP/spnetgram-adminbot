-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'SESSION_CREATED', 'SESSION_EXPIRED', 'DEVICE_REGISTERED', 'DEVICE_UNREGISTERED', 'RISK_SCORE_CHANGED', 'FRAUD_DETECTED', 'SECURITY_INCIDENT', 'EMERGENCY', 'PANIC', 'LOCKDOWN', 'UNLOCKDOWN');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MonitoringMetric" AS ENUM ('HEALTH', 'LATENCY', 'UPTIME', 'CPU', 'MEMORY', 'DISK', 'DATABASE', 'CACHE', 'QUEUE', 'ERRORS');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('TICKET', 'MODERATION', 'PREMIUM', 'ECONOMY', 'SECURITY', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AnalyticsMetric" AS ENUM ('GROWTH', 'REVENUE', 'STAFF', 'MODERATION', 'SECURITY', 'ECONOMY');

-- CreateEnum
CREATE TYPE "PermissionSource" AS ENUM ('DEPARTMENT', 'ROLE', 'RANK', 'WHITELIST', 'TEMPORARY_ASSIGNMENT', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StaffRole" ADD VALUE 'OWNER';
ALTER TYPE "StaffRole" ADD VALUE 'SUPER_ADMINISTRATOR';
ALTER TYPE "StaffRole" ADD VALUE 'CEO';
ALTER TYPE "StaffRole" ADD VALUE 'CTO';
ALTER TYPE "StaffRole" ADD VALUE 'COO';
ALTER TYPE "StaffRole" ADD VALUE 'DEPARTMENT_HEAD';
ALTER TYPE "StaffRole" ADD VALUE 'MANAGER';
ALTER TYPE "StaffRole" ADD VALUE 'SENIOR_STAFF';
ALTER TYPE "StaffRole" ADD VALUE 'STAFF';
ALTER TYPE "StaffRole" ADD VALUE 'HELPER';
ALTER TYPE "StaffRole" ADD VALUE 'SECURITY_ANALYST';
ALTER TYPE "StaffRole" ADD VALUE 'SECURITY_LEAD';
ALTER TYPE "StaffRole" ADD VALUE 'MONITORING_OPERATOR';
ALTER TYPE "StaffRole" ADD VALUE 'INCIDENT_RESPONDER';
ALTER TYPE "StaffRole" ADD VALUE 'INCIDENT_COMMANDER';
ALTER TYPE "StaffRole" ADD VALUE 'COMPLIANCE_OFFICER';
ALTER TYPE "StaffRole" ADD VALUE 'ANALYTICS_VIEWER';
ALTER TYPE "StaffRole" ADD VALUE 'AUDIT_MANAGER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PermissionResource" ADD VALUE 'DEPARTMENTS';
ALTER TYPE "PermissionResource" ADD VALUE 'PREMIUM';
ALTER TYPE "PermissionResource" ADD VALUE 'ECONOMY';
ALTER TYPE "PermissionResource" ADD VALUE 'KPI';
ALTER TYPE "PermissionResource" ADD VALUE 'APPROVALS';
ALTER TYPE "PermissionResource" ADD VALUE 'SECURITY';
ALTER TYPE "PermissionResource" ADD VALUE 'MONITORING';
ALTER TYPE "PermissionResource" ADD VALUE 'INCIDENTS';
ALTER TYPE "PermissionResource" ADD VALUE 'ANALYTICS';
ALTER TYPE "PermissionResource" ADD VALUE 'SYNC';
ALTER TYPE "PermissionResource" ADD VALUE 'DASHBOARD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_EXPIRY';
ALTER TYPE "NotificationType" ADD VALUE 'ECONOMY_TRANSACTION';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'KPI_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_NEW';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_CLAIMED';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_ESCALATED';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_REOPENED';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_BAN';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_SUSPENSION';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_APPEAL';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_CRITICAL';
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_PURCHASE';
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_APPROVAL';
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_RENEWAL';
ALTER TYPE "NotificationType" ADD VALUE 'ECONOMY_LARGE_TRANSFER';
ALTER TYPE "NotificationType" ADD VALUE 'ECONOMY_COMPENSATION';
ALTER TYPE "NotificationType" ADD VALUE 'ECONOMY_REFUND';
ALTER TYPE "NotificationType" ADD VALUE 'ECONOMY_SUSPICIOUS';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_LOGIN_ANOMALY';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_MULTI_DEVICE';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_RISK';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_FRAUD';
ALTER TYPE "NotificationType" ADD VALUE 'SECURITY_BREACH';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_PROMOTION';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_DEMOTION';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_SUSPENSION';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_KPI_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_DEPARTMENT_TRANSFER';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_DOWNTIME';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_DATABASE';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_INFRASTRUCTURE';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_MAINTENANCE';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "category" "NotificationCategory";

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "metadata" JSONB,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "staffId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "metric" "MonitoringMetric",
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "message" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDownAt" TIMESTAMP(3),
    "isUp" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_alerts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "metric" TEXT,
    "value" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "message" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DETECTED',
    "priority" "IncidentPriority" NOT NULL DEFAULT 'P3',
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "source" TEXT,
    "assigneeId" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalatedAt" TIMESTAMP(3),
    "containedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_timeline" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "reportType" TEXT NOT NULL DEFAULT 'INITIAL',
    "authorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_rca" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "contributingFactors" JSONB,
    "impact" TEXT,
    "recommendation" TEXT,
    "actionItems" JSONB,
    "severity" TEXT,
    "authorId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_rca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_summaries" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summaryType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,
    "metadata" JSONB,
    "appliedById" TEXT,
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB,
    "widgets" JSONB,
    "filters" JSONB,
    "ownerId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_metric_records" (
    "id" TEXT NOT NULL,
    "metric" "AnalyticsMetric" NOT NULL,
    "category" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "period" TEXT,
    "label" TEXT,
    "tags" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_metric_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetModule" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "source" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxClicks" INTEGER,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deep_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'spnetgram',
    "target" TEXT NOT NULL DEFAULT 'adminbot',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_overrides" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "source" "PermissionSource" NOT NULL DEFAULT 'CUSTOM',
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_access_grants" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "scope" TEXT,
    "reason" TEXT,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_permissions" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "reason" TEXT,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporary_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_actions" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "approvalRoles" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensitive_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_exports" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "filters" JSONB,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_events_userId_idx" ON "security_events"("userId");

-- CreateIndex
CREATE INDEX "security_events_eventType_idx" ON "security_events"("eventType");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_timestamp_idx" ON "security_events"("timestamp");

-- CreateIndex
CREATE INDEX "device_sessions_userId_idx" ON "device_sessions"("userId");

-- CreateIndex
CREATE INDEX "device_sessions_isActive_idx" ON "device_sessions"("isActive");

-- CreateIndex
CREATE INDEX "device_sessions_deviceId_idx" ON "device_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");

-- CreateIndex
CREATE INDEX "login_history_staffId_idx" ON "login_history"("staffId");

-- CreateIndex
CREATE INDEX "login_history_timestamp_idx" ON "login_history"("timestamp");

-- CreateIndex
CREATE INDEX "login_history_success_idx" ON "login_history"("success");

-- CreateIndex
CREATE UNIQUE INDEX "service_statuses_name_key" ON "service_statuses"("name");

-- CreateIndex
CREATE INDEX "service_statuses_status_idx" ON "service_statuses"("status");

-- CreateIndex
CREATE INDEX "service_statuses_isUp_idx" ON "service_statuses"("isUp");

-- CreateIndex
CREATE INDEX "service_statuses_type_idx" ON "service_statuses"("type");

-- CreateIndex
CREATE INDEX "monitoring_alerts_serviceId_idx" ON "monitoring_alerts"("serviceId");

-- CreateIndex
CREATE INDEX "monitoring_alerts_severity_idx" ON "monitoring_alerts"("severity");

-- CreateIndex
CREATE INDEX "monitoring_alerts_acknowledged_idx" ON "monitoring_alerts"("acknowledged");

-- CreateIndex
CREATE INDEX "monitoring_alerts_createdAt_idx" ON "monitoring_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_referenceId_key" ON "incidents"("referenceId");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_priority_idx" ON "incidents"("priority");

-- CreateIndex
CREATE INDEX "incidents_assigneeId_idx" ON "incidents"("assigneeId");

-- CreateIndex
CREATE INDEX "incidents_referenceId_idx" ON "incidents"("referenceId");

-- CreateIndex
CREATE INDEX "incidents_createdAt_idx" ON "incidents"("createdAt");

-- CreateIndex
CREATE INDEX "incident_timeline_incidentId_idx" ON "incident_timeline"("incidentId");

-- CreateIndex
CREATE INDEX "incident_timeline_createdAt_idx" ON "incident_timeline"("createdAt");

-- CreateIndex
CREATE INDEX "incident_reports_incidentId_idx" ON "incident_reports"("incidentId");

-- CreateIndex
CREATE INDEX "incident_reports_reportType_idx" ON "incident_reports"("reportType");

-- CreateIndex
CREATE INDEX "incident_rca_incidentId_idx" ON "incident_rca"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "incident_rca_incidentId_key" ON "incident_rca"("incidentId");

-- CreateIndex
CREATE INDEX "ai_summaries_targetType_targetId_idx" ON "ai_summaries"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ai_summaries_summaryType_idx" ON "ai_summaries"("summaryType");

-- CreateIndex
CREATE INDEX "ai_summaries_createdAt_idx" ON "ai_summaries"("createdAt");

-- CreateIndex
CREATE INDEX "ai_recommendations_status_idx" ON "ai_recommendations"("status");

-- CreateIndex
CREATE INDEX "ai_recommendations_category_idx" ON "ai_recommendations"("category");

-- CreateIndex
CREATE INDEX "ai_recommendations_createdAt_idx" ON "ai_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_dashboards_ownerId_idx" ON "analytics_dashboards"("ownerId");

-- CreateIndex
CREATE INDEX "analytics_dashboards_isDefault_idx" ON "analytics_dashboards"("isDefault");

-- CreateIndex
CREATE INDEX "analytics_metric_records_metric_idx" ON "analytics_metric_records"("metric");

-- CreateIndex
CREATE INDEX "analytics_metric_records_category_idx" ON "analytics_metric_records"("category");

-- CreateIndex
CREATE INDEX "analytics_metric_records_recordedAt_idx" ON "analytics_metric_records"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "deep_links_code_key" ON "deep_links"("code");

-- CreateIndex
CREATE INDEX "deep_links_code_idx" ON "deep_links"("code");

-- CreateIndex
CREATE INDEX "deep_links_targetModule_targetId_idx" ON "deep_links"("targetModule", "targetId");

-- CreateIndex
CREATE INDEX "deep_links_expiresAt_idx" ON "deep_links"("expiresAt");

-- CreateIndex
CREATE INDEX "sync_events_status_idx" ON "sync_events"("status");

-- CreateIndex
CREATE INDEX "sync_events_entityType_entityId_idx" ON "sync_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "sync_events_createdAt_idx" ON "sync_events"("createdAt");

-- CreateIndex
CREATE INDEX "sync_events_eventType_idx" ON "sync_events"("eventType");

-- CreateIndex
CREATE INDEX "permission_overrides_staffId_idx" ON "permission_overrides"("staffId");

-- CreateIndex
CREATE INDEX "permission_overrides_expiresAt_idx" ON "permission_overrides"("expiresAt");

-- CreateIndex
CREATE INDEX "permission_overrides_source_idx" ON "permission_overrides"("source");

-- CreateIndex
CREATE UNIQUE INDEX "permission_overrides_staffId_resource_action_key" ON "permission_overrides"("staffId", "resource", "action");

-- CreateIndex
CREATE INDEX "special_access_grants_staffId_idx" ON "special_access_grants"("staffId");

-- CreateIndex
CREATE INDEX "special_access_grants_expiresAt_idx" ON "special_access_grants"("expiresAt");

-- CreateIndex
CREATE INDEX "temporary_permissions_staffId_idx" ON "temporary_permissions"("staffId");

-- CreateIndex
CREATE INDEX "temporary_permissions_expiresAt_idx" ON "temporary_permissions"("expiresAt");

-- CreateIndex
CREATE INDEX "sensitive_actions_actionType_idx" ON "sensitive_actions"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "sensitive_actions_actionType_key" ON "sensitive_actions"("actionType");

-- CreateIndex
CREATE INDEX "audit_exports_status_idx" ON "audit_exports"("status");

-- CreateIndex
CREATE INDEX "audit_exports_createdAt_idx" ON "audit_exports"("createdAt");

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_rca" ADD CONSTRAINT "incident_rca_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_overrides" ADD CONSTRAINT "permission_overrides_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_access_grants" ADD CONSTRAINT "special_access_grants_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_permissions" ADD CONSTRAINT "temporary_permissions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;


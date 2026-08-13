-- CreateEnum
CREATE TYPE "MarketingContactStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'INVALID', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketingSegmentType" AS ENUM ('STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "EmailTemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailAudienceRuleType" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'DEFERRED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SUPPRESSED', 'OPENED', 'CLICKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailSuppressionReason" AS ENUM ('UNSUBSCRIBED', 'BOUNCE', 'COMPLAINT', 'INVALID', 'MANUAL');

-- CreateEnum
CREATE TYPE "EmailAutomationTrigger" AS ENUM ('CONTACT_ADDED', 'TAG_ADDED', 'BIRTHDAY', 'DATE_BASED', 'SUBSCRIPTION_CONFIRMED');

-- CreateEnum
CREATE TYPE "EmailAutomationAction" AS ENUM ('SEND_EMAIL', 'WAIT', 'ADD_TAG', 'REMOVE_TAG', 'END');

-- CreateEnum
CREATE TYPE "EmailAutomationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailAutomationEnrollmentStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketingInboxStatus" AS ENUM ('UNREAD', 'OPEN', 'DONE', 'TRASHED');

-- CreateTable
CREATE TABLE "MarketingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "street" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal" TEXT,
    "country" TEXT,
    "status" "MarketingContactStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "consentSource" TEXT,
    "consentAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "providerContactId" TEXT,
    "sourceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContactTag" (
    "contactId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingContactTag_pkey" PRIMARY KEY ("contactId","tagId")
);

-- CreateTable
CREATE TABLE "MarketingSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MarketingSegmentType" NOT NULL DEFAULT 'STATIC',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingSegmentMember" (
    "segmentId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingSegmentMember_pkey" PRIMARY KEY ("segmentId","contactId")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "providerBroadcastId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "clientId" TEXT,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignContact" (
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "ruleType" "EmailAudienceRuleType" NOT NULL DEFAULT 'INCLUDE',

    CONSTRAINT "EmailCampaignContact_pkey" PRIMARY KEY ("campaignId","contactId")
);

-- CreateTable
CREATE TABLE "EmailCampaignTag" (
    "campaignId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "ruleType" "EmailAudienceRuleType" NOT NULL DEFAULT 'INCLUDE',

    CONSTRAINT "EmailCampaignTag_pkey" PRIMARY KEY ("campaignId","tagId")
);

-- CreateTable
CREATE TABLE "EmailCampaignSegment" (
    "campaignId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "ruleType" "EmailAudienceRuleType" NOT NULL DEFAULT 'INCLUDE',

    CONSTRAINT "EmailCampaignSegment_pkey" PRIMARY KEY ("campaignId","segmentId")
);

-- CreateTable
CREATE TABLE "EmailCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "EmailRecipientStatus" NOT NULL DEFAULT 'QUEUED',
    "providerEmailId" TEXT,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDeliveryEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "providerEmailId" TEXT,
    "recipientId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "eventAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "EmailSuppressionReason" NOT NULL,
    "source" TEXT NOT NULL,
    "details" TEXT,
    "suppressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "EmailAutomationTrigger" NOT NULL,
    "triggerConfig" JSONB NOT NULL DEFAULT '{}',
    "status" "EmailAutomationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomationStep" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "action" "EmailAutomationAction" NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAutomationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomationEnrollment" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "runKey" TEXT NOT NULL,
    "status" "EmailAutomationEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAutomationEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingInboundMessage" (
    "id" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "senderName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "subject" TEXT NOT NULL,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "status" "MarketingInboxStatus" NOT NULL DEFAULT 'UNREAD',
    "contactId" TEXT,
    "campaignId" TEXT,
    "assignedToId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingInboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingInboxNote" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingInboxNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingSettings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "provider" TEXT NOT NULL DEFAULT 'RESEND',
    "fromName" TEXT NOT NULL DEFAULT 'ARKO',
    "fromEmail" TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
    "replyTo" TEXT,
    "inboundAddress" TEXT,
    "trackOpens" BOOLEAN NOT NULL DEFAULT true,
    "trackClicks" BOOLEAN NOT NULL DEFAULT true,
    "companyName" TEXT NOT NULL DEFAULT 'ARKO',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingSource_name_key" ON "MarketingSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingSource_email_key" ON "MarketingSource"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContact_email_key" ON "MarketingContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContact_unsubscribeToken_key" ON "MarketingContact"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingContact_providerContactId_key" ON "MarketingContact"("providerContactId");

-- CreateIndex
CREATE INDEX "MarketingContact_status_createdAt_idx" ON "MarketingContact"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingContact_sourceId_idx" ON "MarketingContact"("sourceId");

-- CreateIndex
CREATE INDEX "MarketingContact_company_idx" ON "MarketingContact"("company");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingTag_name_key" ON "MarketingTag"("name");

-- CreateIndex
CREATE INDEX "MarketingContactTag_tagId_createdAt_idx" ON "MarketingContactTag"("tagId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingSegment_name_key" ON "MarketingSegment"("name");

-- CreateIndex
CREATE INDEX "MarketingSegmentMember_contactId_idx" ON "MarketingSegmentMember"("contactId");

-- CreateIndex
CREATE INDEX "EmailTemplate_status_updatedAt_idx" ON "EmailTemplate"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_providerBroadcastId_key" ON "EmailCampaign"("providerBroadcastId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_scheduledAt_idx" ON "EmailCampaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_clientId_idx" ON "EmailCampaign"("clientId");

-- CreateIndex
CREATE INDEX "EmailCampaign_projectId_idx" ON "EmailCampaign"("projectId");

-- CreateIndex
CREATE INDEX "EmailCampaignContact_contactId_idx" ON "EmailCampaignContact"("contactId");

-- CreateIndex
CREATE INDEX "EmailCampaignTag_tagId_idx" ON "EmailCampaignTag"("tagId");

-- CreateIndex
CREATE INDEX "EmailCampaignSegment_segmentId_idx" ON "EmailCampaignSegment"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignRecipient_providerEmailId_key" ON "EmailCampaignRecipient"("providerEmailId");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_campaignId_status_idx" ON "EmailCampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_email_idx" ON "EmailCampaignRecipient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignRecipient_campaignId_email_key" ON "EmailCampaignRecipient"("campaignId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDeliveryEvent_providerEventId_key" ON "EmailDeliveryEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailDeliveryEvent_providerEmailId_idx" ON "EmailDeliveryEvent"("providerEmailId");

-- CreateIndex
CREATE INDEX "EmailDeliveryEvent_type_eventAt_idx" ON "EmailDeliveryEvent"("type", "eventAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppression_email_key" ON "EmailSuppression"("email");

-- CreateIndex
CREATE INDEX "EmailSuppression_reason_suppressedAt_idx" ON "EmailSuppression"("reason", "suppressedAt");

-- CreateIndex
CREATE INDEX "EmailAutomation_status_trigger_idx" ON "EmailAutomation"("status", "trigger");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAutomationStep_automationId_position_key" ON "EmailAutomationStep"("automationId", "position");

-- CreateIndex
CREATE INDEX "EmailAutomationEnrollment_status_nextRunAt_idx" ON "EmailAutomationEnrollment"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "EmailAutomationEnrollment_contactId_idx" ON "EmailAutomationEnrollment"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAutomationEnrollment_automationId_contactId_runKey_key" ON "EmailAutomationEnrollment"("automationId", "contactId", "runKey");

-- CreateIndex
CREATE INDEX "EmailAutomationExecutionLog_enrollmentId_createdAt_idx" ON "EmailAutomationExecutionLog"("enrollmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingInboundMessage_providerMessageId_key" ON "MarketingInboundMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "MarketingInboundMessage_status_receivedAt_idx" ON "MarketingInboundMessage"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "MarketingInboundMessage_contactId_idx" ON "MarketingInboundMessage"("contactId");

-- CreateIndex
CREATE INDEX "MarketingInboundMessage_campaignId_idx" ON "MarketingInboundMessage"("campaignId");

-- CreateIndex
CREATE INDEX "MarketingInboxNote_messageId_createdAt_idx" ON "MarketingInboxNote"("messageId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketingContact" ADD CONSTRAINT "MarketingContact_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MarketingSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContact" ADD CONSTRAINT "MarketingContact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContactTag" ADD CONSTRAINT "MarketingContactTag_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingContactTag" ADD CONSTRAINT "MarketingContactTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MarketingTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingSegment" ADD CONSTRAINT "MarketingSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingSegmentMember" ADD CONSTRAINT "MarketingSegmentMember_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "MarketingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingSegmentMember" ADD CONSTRAINT "MarketingSegmentMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignContact" ADD CONSTRAINT "EmailCampaignContact_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignContact" ADD CONSTRAINT "EmailCampaignContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignTag" ADD CONSTRAINT "EmailCampaignTag_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignTag" ADD CONSTRAINT "EmailCampaignTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MarketingTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignSegment" ADD CONSTRAINT "EmailCampaignSegment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignSegment" ADD CONSTRAINT "EmailCampaignSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "MarketingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDeliveryEvent" ADD CONSTRAINT "EmailDeliveryEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "EmailCampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomation" ADD CONSTRAINT "EmailAutomation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationStep" ADD CONSTRAINT "EmailAutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "EmailAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationEnrollment" ADD CONSTRAINT "EmailAutomationEnrollment_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "EmailAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationEnrollment" ADD CONSTRAINT "EmailAutomationEnrollment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationExecutionLog" ADD CONSTRAINT "EmailAutomationExecutionLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "EmailAutomationEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAutomationExecutionLog" ADD CONSTRAINT "EmailAutomationExecutionLog_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "EmailAutomationStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingInboundMessage" ADD CONSTRAINT "MarketingInboundMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "MarketingContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingInboundMessage" ADD CONSTRAINT "MarketingInboundMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingInboundMessage" ADD CONSTRAINT "MarketingInboundMessage_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingInboxNote" ADD CONSTRAINT "MarketingInboxNote_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MarketingInboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingInboxNote" ADD CONSTRAINT "MarketingInboxNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingSettings" ADD CONSTRAINT "EmailMarketingSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

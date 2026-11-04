-- Execute UMA vez no Neon SQL Editor ANTES de publicar o código novo.
-- Comandos aditivos: nunca sobrescreve hasAccess nem accessSource dos assinantes atuais.
BEGIN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessStatus" TEXT NOT NULL DEFAULT 'SEM_ACESSO';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessReference" TEXT;
UPDATE "User" SET "accessStatus" = 'ATIVO', "accessType" = 'MANUAL', "activatedAt" = COALESCE("activatedAt", "createdAt") WHERE "hasAccess" = TRUE AND "isDemo" = FALSE AND "isPreview" = FALSE;
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" ("id" TEXT NOT NULL PRIMARY KEY,"provider" TEXT NOT NULL,"externalId" TEXT NOT NULL,"eventType" TEXT NOT NULL,"customerEmail" TEXT NOT NULL,"userId" TEXT,"outcome" TEXT NOT NULL,"receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PaymentWebhookEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhookEvent_provider_externalId_eventType_key" ON "PaymentWebhookEvent"("provider","externalId","eventType");
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_receivedAt_idx" ON "PaymentWebhookEvent"("receivedAt");
CREATE TABLE IF NOT EXISTS "PendingPurchase" ("id" TEXT NOT NULL PRIMARY KEY,"provider" TEXT NOT NULL,"externalId" TEXT NOT NULL,"email" TEXT NOT NULL,"status" TEXT NOT NULL,"claimedUserId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS "PendingPurchase_provider_externalId_key" ON "PendingPurchase"("provider","externalId");
CREATE INDEX IF NOT EXISTS "PendingPurchase_email_status_idx" ON "PendingPurchase"("email","status");
CREATE TABLE IF NOT EXISTS "SecurityThrottle" ("key" TEXT NOT NULL PRIMARY KEY,"attempts" INTEGER NOT NULL DEFAULT 0,"blockedUntil" TIMESTAMP(3),"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
COMMIT;

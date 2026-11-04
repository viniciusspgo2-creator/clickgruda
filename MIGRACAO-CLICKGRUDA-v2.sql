-- CLICK & GRUDA v2: executar uma vez no Postgres NEON de producao,
-- ANTES do primeiro deploy da versao que utiliza os novos campos.
-- Alteracoes aditivas: NAO altera nem apaga dados ja cadastrados.
BEGIN;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPreview" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "previewMaxSessions" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Art" ADD COLUMN IF NOT EXISTS "isRejected" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "Art_isRejected_createdAt_idx" ON "Art" ("isRejected", "createdAt");

CREATE TABLE IF NOT EXISTS "SiteEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SiteEvent_name_createdAt_idx" ON "SiteEvent" ("name", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteEvent_visitorId_createdAt_idx" ON "SiteEvent" ("visitorId", "createdAt");

COMMIT;

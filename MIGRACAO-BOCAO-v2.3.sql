-- Execute APENAS após um backup e no banco usado pela versão v2.2.
-- Na Vercel Query, rode os comandos UM A UM (sem BEGIN/COMMIT).

CREATE TABLE IF NOT EXISTS "Bocao" (
    "id" TEXT NOT NULL,
    "artId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalKey" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bocao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bocao_artId_key" UNIQUE ("artId"),
    CONSTRAINT "Bocao_artId_fkey" FOREIGN KEY ("artId") REFERENCES "Art"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Bocao_createdAt_idx" ON "Bocao" ("createdAt");

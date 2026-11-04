/**
 * Inicia um PostgreSQL embutido (embedded-postgres) para desenvolvimento local.
 * Porta fixa 5433. Os dados ficam em /home/z/my-project/db/pgdata.
 * Connection string: postgresql://postgres@localhost:5433/clickgruda
 *
 * Uso: bun run scripts/embedded-pg.ts
 * Mantém o processo rodando até receber SIGINT/SIGTERM.
 */
import EmbeddedPostgres from 'embedded-postgres'

const PORT = 5433
const DB_NAME = 'clickgruda'
const DATA_DIR = '/home/z/my-project/db/pgdata'

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: 'postgres',
    password: 'postgres',
    // evita inicializar configs de locale que exigem binários do sistema
    initDb: {
      encoding: 'UTF8',
      locale: 'C.UTF-8',
    },
  })

  const shutdown = async () => {
    try {
      console.log('[embedded-pg] shutting down...')
      await pg.stop()
    } catch (e) {
      console.error('[embedded-pg] stop error:', e)
    }
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  console.log(`[embedded-pg] starting on port ${PORT}...`)
  await pg.initialise()
  console.log('[embedded-pg] cluster initialised.')
  await pg.start()
  console.log('[embedded-pg] server started.')

  try {
    await pg.createDatabase(DB_NAME)
    console.log(`[embedded-pg] database "${DB_NAME}" created.`)
  } catch (e: any) {
    // database already exists — ignore
    if (String(e?.message || '').includes('already exists')) {
      console.log(`[embedded-pg] database "${DB_NAME}" already exists.`)
    } else {
      console.error('[embedded-pg] createDatabase error:', e?.message || e)
    }
  }

  console.log('[embedded-pg] READY')
  console.log(`[embedded-pg] DATABASE_URL=postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`)

  // keep alive
  setInterval(() => {}, 1 << 30)
}

main().catch((e) => {
  console.error('[embedded-pg] fatal:', e)
  process.exit(1)
})

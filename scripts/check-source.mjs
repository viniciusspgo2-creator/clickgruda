/** Verificação estática, sem precisar conectar ao banco ou executar migrações.
 * Execute após npm ci: npm run check:source
 */
import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
let checked = 0
let errors = 0
function walk(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, item.name)
    if (item.isDirectory()) { walk(filename); continue }
    if (!/\.tsx?$/.test(item.name)) continue
    checked++
    const contents = fs.readFileSync(filename, 'utf8')
    const source = ts.createSourceFile(filename, contents, ts.ScriptTarget.Latest, true, item.name.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    for (const diagnostic of source.parseDiagnostics) {
      errors++
      const lc = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0)
      console.error(`${path.relative(root, filename)}:${lc.line + 1}:${lc.character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
    }
    for (const stmt of source.statements) {
      if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
      const spec = stmt.moduleSpecifier.text
      if (!spec.startsWith('@/') && !spec.startsWith('./') && !spec.startsWith('../')) continue
      const target = spec.startsWith('@/') ? path.join(root, 'src', spec.substring(2)) : path.resolve(path.dirname(filename), spec)
      if (fs.existsSync(target) || ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '/index.ts', '/index.tsx'].some(suffix => fs.existsSync(target + suffix))) continue
      errors++
      console.error(`${path.relative(root, filename)}: import não resolvido (${spec})`)
    }
  }
}
walk(path.join(root, 'src'))
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
if (/\b(db\s+push|migrate\s+deploy|db:push)\b/.test(pkg.scripts.build || '')) { errors++; console.error('Build contém comando de mutação do banco.') }
if (errors) { console.error(`\n${checked} arquivos verificados, ${errors} problema(s).`); process.exit(1) }
console.log(`OK: ${checked} arquivos TS/TSX válidos, imports locais encontrados, build sem mutação de schema.`)

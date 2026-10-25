# Click & Gruda — deploy corrigido / projeto mais leve

**Problema anterior:** erros TS2339/TS2724 em `src/app/api/**/bocoes` ocorrem quando arquivos antigos continuam no repositório GitHub, embora não existam no ZIP de substituição.

**Correção:** `npm run build` agora executa `scripts/cleanup-legacy-bocao.cjs` antes de gerar o Prisma e compilar o Next.js. O script remove apenas os caminhos legados do Bocão do diretório de build. Também executa testes automatizados sobre a remoção.

**Para remoção permanente no GitHub:** além de atualizar os arquivos existentes, exclua os diretórios `src/app/api/bocoes` e `src/app/api/admin/bocoes` no repositório. Em uma cópia Git local, use `git add -A` antes do commit para registrar as exclusões. Apenas sobrepor arquivos do ZIP não apaga caminhos antigos.

**Arquivos removidos para reduzir o peso:** duplicatas PNG da pasta `public/uploads/rebrand` (o site já utiliza as versões `.webp`), hero antigo sem referência no código, documentos históricos, exemplos e artefatos de execução que não são utilizados no deploy Vercel. Preservei as artes estáticas restantes, áudios utilizados, todas as imagens `.webp` e o `package-lock.json`.

**Cuidado:** links externos antigos que apontassem diretamente para os PNG duplicados removidos poderão retornar 404, embora o site atual utilize as versões WebP. Não apague arquivos do banco Neon ou bucket R2.

**Validação:** os testes locais estáticos verificam a inexistência de Bocão e a consistência das principais APIs. Execute o deploy na Vercel para confirmar a compilação completa com dependências instaladas.

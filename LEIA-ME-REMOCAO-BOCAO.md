# Click & Gruda — correção de carregamento da biblioteca (sem Bocão)

Esta versão remove a funcionalidade Bocão inteiramente do código, incluindo:

- Modelo Bocao e vínculo no `schema.prisma`;
- Consultas ao Bocão nas APIs de artes, admin e catálogo;
- Rotas de Bocão para o portal e para o administrador;
- Menus, componentes, cards e botões relacionados ao Bocão;
- Tipos e testes exclusivos da funcionalidade removida.

## Publicação na Vercel

1. Publique este projeto como novo deploy no mesmo projeto Vercel existente.
2. **Não execute** SQL de migração Bocão, `prisma db push` ou `prisma migrate reset`. A remoção é apenas no código.
3. Mantenha as variáveis de ambiente, a integração Neon e o bucket Cloudflare R2 já configurados.
4. Após o deploy, confirme as listas em Admin > Artes e Portal > Todas, e verifique os logs `/api/arts`, `/api/admin/arts` e `/api/catalog`.

## Nota sobre dados

Nenhuma tabela ou arquivo foi removido diretamente do Neon ou Cloudflare R2. O ZIP não contém dados de produção. O erro P2021 devido à tabela `public.Bocao` deixa de acontecer nas consultas removidas. Outros erros independentes de produção ainda exigirão análise de logs.

# Click & Gruda — Correção do hero + contador de DEMO

## Hero da landing
- Corrigidas as duas imagens com faixas horizontais embutidas (desktop e celular), usando recortes da arte original sem faixas.
- Não foi alterada a estrutura, altura ou conteúdo da seção do hero; `object-fit: cover` existente continua funcionando.
- URLs das artes usam `?v=2` para evitar ver a imagem antiga em cache.

## Contador de DEMO
- O clique bem-sucedido que abre a demonstração pública agora grava `demo_entry` em `SiteEvent`, reutilizando a tabela já existente.
- As métricas aparecem em `Painel Master > Estatísticas da landing` nos filtros Hoje/7 dias/30 dias/personalizado:
  * Entradas na conta DEMO (inclui reentradas).
  * Visitantes distintos na DEMO (navegadores anônimos estimados).
  * Gráfico diário das entradas.
- O sistema ignora o administrador, os navegadores e IPs excluídos, não armazena endereço IP nos eventos e evita duplicar cliques simultâneos de um navegador.
- Nenhuma tabela nova, migração SQL ou mudança no `schema.prisma`.
- Contagem começa após a publicação; não é possível resgatar visitas antigas que não foram registradas.
- A falha do contador não bloqueia o acesso à DEMO.

## Deploy
Preserve `.env` e `.git`, substitua o restante pelo ZIP FULL e rode `npm ci` e `npm run build`. Faça backup previamente.

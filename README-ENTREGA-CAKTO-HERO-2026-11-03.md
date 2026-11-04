# CLICK & GRUDA — ENTREGA HERO, ARTE/BOCÃO E CAKTO

Data: 03/11/2026. Base de trabalho: arquivo fornecido `clickgruda-main(5).zip`.

## O que foi alterado no código

- **Landing:** nova composição HERO 1920 × 900 baseada no mascote original entregue, com cenário de sublimação ao fundo e área de copy à direita; imagem mobile dedicada. Carrossel original preservado e colocado imediatamente após o HERO. Seções reorganizadas em proposta comercial concisa, sem anunciar quantidade de artes. Oferta por **R$ 47,90** visível e indicação de pagamento seguro via **Cakto**. Imagens do carrossel não foram substituídas.
- **Arte/Bocão:** aba destacada em laranja, exibição da **Arte principal (01)** lado a lado com o **Bocão complementar (02)**, buscando a relação pelo marcador/tag já existente. Upload, banco da arte e fluxo de download não foram alterados. Se a arte original não existir, aparece aviso de peça não encontrada.
- **Cadastro e login:** novos textos para pagamento automático; honeypot, Turnstile e limitação persistente de tentativas; redirecionamento de usuário comum sem acesso para `/comprar`.
- **Checkout Cakto:** página `/comprar`, preço único em `src/lib/payments/config.ts`, validação do link oficial, exibição do e-mail da conta e logomarca da Cakto. Página `/obrigado` consulta `/api/access/status` a cada ~3 segundos até ~2 minutos. A URL de retorno **não** concede acesso.
- **Webhook Cakto:** `POST /api/webhooks/cakto`, secret obrigatório, validação HMAC quando os dois headers de assinatura estiverem presentes, corpo bruto, limite de tamanho, normalização de `data` objeto ou lista, registro de evento idempotente e tratamento de aprovação, refund e chargeback. Alterações de acesso com transação de banco. Reembolso/chargeback revogam sessões referentes à compra.
- **Prisma:** migração **aditiva**, preservando os clientes legados com `hasAccess=true`. Eventos de compra, compras anteriores ao cadastro e limitação de tentativas ficam em tabelas próprias.
- **Admin:** mantenha a liberação/revogação manual; inclusão de visão de últimos eventos Cakto e compras pendentes. Para exceções, existe rota de conciliação administrativa autenticada (`/api/admin/claim-purchase`) que exige confirmação de titularidade.
- **Segurança:** headers mais restritivos, proteção por servidor nas rotas novas, cookies e sessões atuais preservados.

## Limites importantes — não publicar sem verificar

1. **Não há URL definitiva de checkout da Cakto no material enviado.** Sem `CAKTO_CHECKOUT_URL`, o botão retorna orientação de checkout indisponível; não inventamos um link.
2. **Não há secrets reais e eles não devem entrar no ZIP.** Configure-os somente em Vercel.
3. **Turnstile é obrigatório em produção.** Sem as DUAS variáveis correspondentes, o cadastro/login falham de forma segura. Configure antes de implantar.
4. **Compra efetuada antes do cadastro:** a compra é registrada em `PendingPurchase` por e-mail. **A associação automática posterior NÃO foi ativada**, pois o projeto original não possui comprovação de posse do e-mail; uma pessoa poderia cadastrar e-mail alheio para reivindicar a compra. Por enquanto o admin deve confirmar titularidade e liberar ou conciliar; para automatizar com segurança, integrar verificação de e-mail (link/código de uso único) e só então reivindicar pagamento pendente.
5. **Studio Click — Mockup / Editor:** nomenclatura ajustada na landing, mas o editor/Studio específico parece estar em aplicação externa; seu código-fonte não está neste ZIP, portanto o cabeçalho dentro dela **não foi modificado**.
6. **Downloads:** a rota atual verifica acesso e assina URLs de arquivos privados no R2. Ela ainda inclui caminho legado de arquivos de prévia públicos; NÃO considere todos os arquivos existentes privados sem auditoria de cada origem. Nenhuma mudança no storage foi feita.
7. **Webhooks de produção:** confirme payloads e nomes exatos de eventos com a função "Testar webhook" da Cakto, em especial cabeçalhos, IDs de compra e eventos agrupados. Limite o webhook ao produto/oferta de acesso vitalício no painel Cakto.
8. **Build completo e integração:** não foi possível instalar dependências e executar Next/Prisma neste ambiente; não há garantia de `npm run build`, migração real, checkout ou webhook funcionando em produção. Faça teste na Vercel Preview com banco de TESTE antes de produção. **Nada foi aplicado ao Neon ou ao site publicado.**

## Ordem segura do deploy

1. Faça backup/snapshot do banco Neon e do projeto Vercel atual. Anote a contagem dos membros reais ativos:
   `SELECT COUNT(*) FROM "User" WHERE "hasAccess" = TRUE AND "isDemo" = FALSE AND "isPreview" = FALSE;`
2. Em ambiente **de teste** com cópia do banco, execute o script completo `prisma/CAKTO-MIGRACAO-SEGURA.sql` no Neon SQL Editor (uma vez) **ANTES** de publicar o código novo. Confirme que o número de membros com `hasAccess=true` não mudou.
3. Na Vercel, projeto da Click & Gruda > **Settings > Environment Variables**, configure:
   - `DATABASE_URL` (já existente, não trocar se atual estiver certo)
   - `AUTH_SECRET` (já existente, não regenerar: invalidaria sessões)
   - `NEXT_PUBLIC_SITE_URL=https://www.clickgruda.com.br`
   - `CAKTO_WEBHOOK_SECRET` (segredo do webhook configurado no painel Cakto; só servidor)
   - `CAKTO_CHECKOUT_URL=https://pay.cakto.com.br/SEU-LINK-REAL`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Cloudflare Turnstile, site key pública)
   - `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile, secret privada)
4. Configure no painel da Cakto um webhook destinado SOMENTE à oferta de **Acesso Vitalício**, disparo **Agrupado**, eventos compra aprovada, reembolso e chargeback, URL `https://www.clickgruda.com.br/api/webhooks/cakto`. Configure o retorno do checkout para `https://www.clickgruda.com.br/obrigado`.
5. Rode em CI/teste: `npm ci`, `npx prisma generate`, `npx tsc --noEmit`, `npm run build`, `npm audit --omit=dev`. Se houver erro, **não faça deploy em produção**.
6. Faça deploy em **Preview** e valide todos os cenários abaixo com webhook Cakto teste, DB de teste, e sem movimentar dinheiro real sem planejamento. Só depois repita a migração aditiva em produção (com backup), configure as mesmas variáveis no ambiente Production e publique.
7. Se a campanha acabar, revise texto/condições nos lugares definidos por `LIFETIME_CAMPAIGN_END` e conteúdo comercial. O preço aprovado é `LIFETIME_PRICE_CENTS = 4790` em `src/lib/payments/config.ts`.

## Checklist de testes antes do deploy final

- [ ] Conta atual paga manualmente continua ativa com mesma senha e sessão.
- [ ] Usuário DEMO e Preview não se transformam em clientes ativos.
- [ ] Cadastro mostra novo texto, exige e-mail e WhatsApp, e direciona para `/comprar`.
- [ ] Usuário sem acesso que faz login é direcionado para `/comprar`.
- [ ] Turnstile passa e falha conforme token; honeypot, Origin e limites por IP/conta funcionam.
- [ ] Checkout abre a URL correta da oferta e não divulga `CAKTO_WEBHOOK_SECRET`.
- [ ] `/obrigado` nunca concede acesso; só reconhece `hasAccess` recebido de API autenticada.
- [ ] `purchase_approved` real da Cakto concede acesso, inclusive lote agrupado.
- [ ] Webhook repetido registra/libera apenas uma vez.
- [ ] Secret/assinatura inválidos retornam 401; falha do banco retorna 500.
- [ ] Refund/chargeback revogam a compra correta e sessões vigentes.
- [ ] Pagamento anterior ao cadastro fica pendente; conciliação ADMIN exige verificação segura de identidade.
- [ ] Download e URL do arquivo original exigem acesso no servidor; nenhum arquivo de alta resolução está público fora da API.
- [ ] Regras de um dispositivo e dispositivos extras existentes mantidas.
- [ ] Múltiplos logins, mobile/desktop, carrossel original, filtros e uploads de Bocão testados.
- [ ] Verificar Lighthouse, contraste WCAG AA, foco de teclado, CSP e embeds (Vimeo/Meta) após deploy.

## Validação executada localmente nesta entrega

- 227 arquivos TS/TSX analisados por transpiler TypeScript: **zero erros de sintaxe**, mas isto **não** substitui a checagem de tipos ou build.
- 4 testes de preservação Bocão e uso das tabelas existentes: **aprovados**.
- 8 assertivas locais do normalizador/verificador Cakto (secret, HMAC, grouped/individual, refund/chargeback/ignorado): **aprovadas**.
- Testes existentes adicionais: parte passou, mas 2 falharam por dependências ausentes; execução do check-source parou pela mesma razão. **Nenhuma afirmação de suíte integral aprovada**.
- Migração SQL, Prisma Client e fluxos financeiros **não foram executados contra banco real**.

## Arquivos principais de atenção

- `src/components/views/LandingView.tsx`
- `src/app/globals.css`
- `public/uploads/rebrand/hero-clickgruda-premium-1920.webp`
- `public/uploads/rebrand/hero-clickgruda-premium-mobile.webp`
- `src/components/views/PortalView.tsx`
- `src/lib/arts.ts`
- `src/components/views/AuthView.tsx`
- `src/components/payments/CaktoPurchase.tsx`
- `src/components/payments/CaktoThanks.tsx`
- `src/app/comprar/page.tsx`
- `src/app/obrigado/page.tsx`
- `src/app/api/webhooks/cakto/route.ts`
- `src/app/api/access/status/route.ts`
- `src/lib/payments/*`
- `prisma/schema.prisma`
- `prisma/CAKTO-MIGRACAO-SEGURA.sql`
- `.env.example`

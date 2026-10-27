# CLICK & GRUDA — PROJETO FULL REFINADO — 27/10/2026

Este pacote é o **projeto inteiro**, já ajustado sobre a atualização visual anterior. Não é patch e não depende do ZIP original. O arquivo `package.json` está **na raiz do ZIP**, sem pasta `clickgruda-main` aninhada.

## Melhorias desta revisão

1. **Venda sem esconder demonstração:** a ação primária da Home leva ao checkout/cadastro real. A demo gratuita e o vídeo continuam disponíveis, mas em hierarquia secundária. O menu permanece acessível entre 1024 e 1279 px de largura.
2. **Preço e ofertas:** o valor apresentado vem de `/api/catalog`; caso a API falhe, a página manda conferir o checkout, sem divulgar valor potencialmente desatualizado. A oferta vitalícia é exibida apenas quando a condição já existente no projeto está ativa. Confirmar os termos comerciais cadastrados antes da campanha.
3. **Mobile:** botões de toque dos cards divididos em uma ação principal para mockup e uma linha de ações compactas (prévia, download e favoritos); download bloqueado não finge estar disponível. Nenhuma ação depende exclusivamente de hover.
4. **Tema claro:** cartões e seus textos, tags, botões e overlays passam a obedecer ao contraste adequado, preservando os painéis de prévia e filtros escuros onde intencional.
5. **Copy:** substituída a frase autorreferencial por uma promessa de utilidade sem números de vendas, depoimentos ou garantias inventadas. CTA adicional próximo aos benefícios.
6. **Studio externo:** permanece o fluxo real baixar arte → abrir Studio → enviar arquivo. Não há importação automática. O banner do dashboard não foi editado.

## O que não foi alterado

- Configuração de banco de dados, migrations Prisma, autenticação, APIs de pagamento, Mercado Pago, sistema de uploads e downloads, permissões, arquivos de mídia originais do repositório.
- Não inserimos provas sociais artificiais, fotos falsas, garantias inexistentes nem depoimentos.

## Verificações realizadas

- **206 arquivos TS/TSX:** sintaxe e caminhos de imports internos analisados com TypeScript; **0 erros de parser e imports**.
- **CSS:** estrutura analisada via parser PostCSS; sem erro de parse.
- **Testes unitários sem dependências externas:** executados e aprovados. Testes que precisam de bibliotecas não instaladas não puderam completar.
- **Limite:** npm não concluiu instalação das dependências neste ambiente. Portanto, `npm run build`, checagem completa de tipos, renderização responsiva e fluxos reais de pagamento/autenticação **não foram certificados**. Testar em preview na Vercel antes da promoção para produção.

## Como substituir a pasta antiga sem perder seus dados

1. **Faça backup** da pasta atual ou salve uma cópia do commit no GitHub para rollback.
2. **Preserve `.git` e todos os arquivos de configuração `.env*` que já existem** (`.env`, `.env.local`, `.env.production` etc.). Não publique esses arquivos. Guarde também quaisquer uploads não versionados que estejam na pasta antiga: apagar arquivos locais pode apagá-los definitivamente.
3. Na **raiz do repositório** (onde está o `.git`), remova os arquivos antigos da aplicação, **exceto os preservados acima**, e extraia o ZIP **direto nesta raiz**. Depois de extrair, você deve enxergar `package.json`, `src/`, `public/` e `prisma/` lado a lado com `.git/`.
4. Confira que `package.json` ficou **ao lado** de `.git` e **não dentro** de uma pasta `clickgruda-main/`.
5. No seu ambiente com Node 22 e acesso à internet, execute: `npm ci`, `npm run check:source`, `npm run check:types`, `npm run build`. Veja eventuais erros antes do deploy. Para atualizar pelo Git: `git add -A`, `git commit -m "Refina Home e dashboard premium"`, `git push`.
6. Aguarde a Vercel confirmar build. Abra o **Preview Deployment** e teste: Home em celular, compra, demo, login, luz/escuro, filtros, favoritos, download e abertura do Studio. Só depois promova para produção. Confirme oferta/preço no checkout.

**Atenção:** o ZIP não guarda registros Neon/Postgres nem arquivos existentes fora da pasta enviada. Não substitui backup de banco e armazenamento R2. Não contém `.git`, `.env` real, dependências `node_modules` ou cache `.next`.

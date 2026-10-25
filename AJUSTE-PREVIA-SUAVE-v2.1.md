# Click & Gruda v2.1 — Prévia mais visível para usuários Demo/Preview

## O que foi alterado

- **Servidor:** a rota `src/app/api/arts/[id]/preview/route.ts` agora gera uma amostra WebP de até **900 × 420 px**, desfoque discreto (**1.8**) e qualidade **62**. As marcas d’água são repetidas na imagem gerada.
- **Popup:** o desfoque CSS caiu de **8 px** para **1 px** e o brilho subiu de **0.70** para **0.98**. O selo de segurança passou a ficar na parte inferior para não tampar a arte.
- **Cards da biblioteca:** blur da Demo caiu de **7 px** para **0.5 px** e saiu a camada escura que cobria toda a miniatura. O aviso de prévia continua visível no canto.
- **Sem mudanças no login, no banco Neon ou nos downloads:** usuários normais continuam com a imagem original nas páginas permitidas; Demo/Preview recebem somente a versão transformada pelo servidor. Os endpoints de download continuam bloqueados para Demo/Preview.

## Como publicar

Envie os arquivos deste ZIP sobre a versão existente do projeto (ou faça commit no repositório GitHub conectado à Vercel) e aguarde a conclusão do build. **Não é necessário rodar SQL nem modificar o banco Neon.** Teste em uma janela anônima com a conta universal de Preview e atualize a página com `Ctrl + F5`.

## Importante sobre a proteção

A prévia fica propositalmente mais fácil de entender, mas **qualquer conteúdo visível na tela pode ser capturado por screenshot**. Marcas d’água, resolução limitada e ausência do original reduzem a utilidade profissional; não garantem proteção absoluta.

## Validação

Testes de código-fonte e regressão da prévia em `scripts/preview-features.test.mjs`. Para checar o funcionamento completo, execute `npm ci && npm run build` em ambiente com dependências disponíveis e teste a rota protegida logado como Preview.

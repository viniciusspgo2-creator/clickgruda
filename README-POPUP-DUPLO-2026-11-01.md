# Click & Gruda — Pop-up simples e duplo (01/11/2026)

## O que mudou

Em **Painel Master > Avisos / Pop-up** agora há o controle de formato:

- **Pop-up simples:** mantém exatamente o formato anterior, com um aviso, seus links sociais e o botão “Continuar navegando”.
- **Pop-up duplo:** aparecem campos independentes para dois avisos (tipo, título e mensagem). A prévia mostra os dois cards laranja/preto lado a lado no desktop, com o rodapé social e botão de continuar compartilhados. No celular, os cards são empilhados para preservar a leitura.

O Admin precisa preencher os dois avisos antes de publicar o modo duplo. Quando voltar ao formato simples, o segundo texto continua salvo e pode ser reutilizado posteriormente. Fechar com **X**, **Continuar navegando**, **Esc** ou clicando fora dispensa os dois avisos como uma única publicação. Um novo salvamento ativo gera uma nova revisão, exibindo de novo aos assinantes (uma vez por navegador/usuário).

Os links sociais continuam navegáveis:
- Instagram: https://www.instagram.com/clickgruda.digital/
- Facebook: https://www.facebook.com/artesparacanecasoficial/

## Banco de dados

**Nenhuma tabela, coluna ou migração foi alterada.** O modelo `Setting` e a chave `portal_announcement_v1` existentes passam a armazenar um JSON com campos opcionais `layout` e `secondary`. Registros antigos, sem essas propriedades, são interpretados como `layout: 'single'`. Sem migração Prisma ou SQL.

## Como atualizar

1. Preserve `.env` e `.git` e faça backup da versão em produção.
2. Extraia este ZIP FULL para substituir o restante do projeto, sem remover seus arquivos de ambiente.
3. Na sua máquina/Vercel, rode instalação das dependências e o build de produção antes de publicar.
4. Acesse **Painel Master > Avisos / Pop-up**, escolha “Pop-up duplo”, preencha os dois avisos, use Pré-visualizar e clique em Publicar dois avisos.
5. Teste o pop-up em tela desktop e no celular, incluindo os links do Instagram/Facebook e o fechamento.

## Validação disponível

- Sintaxe dos arquivos TypeScript/TSX modificados: aprovada no compilador TypeScript em modo isolado.
- Testes de regressão locais do Pop-up e Bocão: aprovados.
- Build Next.js integral não foi executado aqui por ausência de dependências locais completas. Execute `npm ci && npm run build` no ambiente de desenvolvimento antes de fazer deploy.

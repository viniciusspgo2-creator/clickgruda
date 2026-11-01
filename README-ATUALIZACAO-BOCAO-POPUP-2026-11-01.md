# Click & Gruda — Pop-up premium e Bocão (01/11/2026)

## Incluído neste ZIP completo

- As alterações anteriores de layout (mascote dos dois heros, modal Studio), seção "Avisos / Pop-up" no Admin e pop-up premium no portal, com Instagram e Facebook clicáveis e o botão "Continuar navegando".
- Na área **Admin > Artes**, novo botão **Bocão** ao lado de "Nova arte".
- Formulário próprio: selecione o arquivo complementar e informe **o código da arte principal**, por exemplo `CG-0042`; a descrição é opcional.
- A associação é verificada com a arte existente antes de publicar; não é possível relacionar a outro Bocão.
- Cada Bocão recebe seu próprio código de download e é identificado como `Bocão da arte CG-0042 — Descrição opcional`.
- **Portal > Bocão** é uma aba específica; busca nela também aceita o código da arte principal para localizar seu complemento. Os Bocões não se misturam com a biblioteca principal.
- No Admin, o atalho **Bocões cadastrados** ajuda a revisar e editar os complementos.

## Estrutura do banco — nenhum ajuste necessário

**Não há novas tabelas, campos nem migrações Prisma/SQL.** Usa apenas os modelos existentes `Art`, `Tag` e `ArtTag`:

- Tag técnica `bocao` identifica o arquivo complementar.
- Tag técnica `bocao-arte-42` vincula o complemento à arte principal com código `CG-0042`.
- As tags internas não são mostradas nos filtros públicos; a referência aparece no título da arte complementar.
- O upload continua passando pelo fluxo existente do Cloudflare R2, com limite de 15 MB, conforme a configuração instalada.

## Instalação

1. Faça backup do projeto atual.
2. Preserve seus arquivos `.env` e pasta `.git`; substitua os demais arquivos com o ZIP atualizado.
3. No projeto real com dependências instaladas, execute `npm ci && npm run build` antes de publicar.
4. Confirme no ambiente de teste: criação de um Bocão vinculado a `CG-xxxx`, publicação no Portal > Bocão, download e revisão do pop-up.

**Validação neste ambiente:** a sintaxe dos arquivos TS/TSX modificados e os testes locais das estruturas legadas foram validados. O build Next.js completo não pôde ser executado porque as dependências neste ambiente estão incompletas. A publicação só deve ocorrer após rodar o build no projeto de destino.

**Observação importante:** os endpoints legados `/api/bocoes` e `/api/admin/bocoes` continuam desativados. O novo recurso usa as rotas existentes de artes para não depender de modelos antigos que causavam falhas.

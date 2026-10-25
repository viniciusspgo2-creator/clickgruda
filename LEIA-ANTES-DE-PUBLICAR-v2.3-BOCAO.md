# Click & Gruda v2.3 — Bocão + Analytics v2.2

Esta versão **parte da v2.2**, incluindo visitantes únicos, filtros e exclusão das visitas do administrador. Acrescenta uma sub-biblioteca chamada BOCÃO e um cadastro separado no Admin Master.

## O que muda

- No Admin Master aparece o menu **Bocão**. Clique em "Cadastrar bocão", pesquise `CG-0042` (ou o título), selecione a arte principal e envie a imagem complementar. Pode incluir uma observação como "Aplicar na região inferior da caneca".
- O bocão usa o **mesmo código CG** da arte associada: esse código vem do registro da arte principal, sem um segundo gerador de códigos.
- Existe **um bocão por arte principal**. Para substituir a imagem, escolha Editar no cadastro do bocão. Não é permitido cadastrar dois complementos com o mesmo vínculo nesta versão.
- No Portal, a aba BOCÃO lista os complementos; é possível pesquisar pelo código CG e visualizar as duas imagens lado a lado. O cartão da estampa principal ganha o selo "Com bocão" e a prévia oferece o atalho para o complemento. O arquivo principal e o bocão podem ser baixados separadamente.
- O usuário Preview **não pode baixar bocões**. As imagens dele usam o endpoint de prévia protegida, com redução de qualidade e marca-d'água.
- Excluir um bocão **não exclui** a arte principal. Excluir uma arte principal também exclui o vínculo do bocão, sem remover objetos físicos já armazenados no Cloudflare R2.
- Downloads de bocões usam a mesma quota diária do código CG da arte principal e contam como download da arte vinculada. Não há ZIP automático com os dois arquivos nesta versão.

## Passo obrigatório ANTES do deploy: migrar o banco Neon

Você não precisa criar outro banco. Na **Vercel → Storage → Neon → Query**, selecione o banco de produção correto e DESATIVE a chave "Read-only".

1. Faça backup ou crie um branch de segurança no Neon antes de alterar a produção.
2. Abra o arquivo `MIGRACAO-BOCAO-v2.3.sql` incluído no ZIP.
3. Cole o **primeiro comando inteiro** (`CREATE TABLE IF NOT EXISTS "Bocao" (...)`) no Query e execute com Run.
4. Apague o comando anterior, cole **somente o segundo** (`CREATE INDEX IF NOT EXISTS...`) e clique Run.
5. Não execute os dois ao mesmo tempo: o editor pode responder `cannot insert multiple commands into a prepared statement`.
6. O SQL cria uma tabela e um índice. Não há comandos `DROP`, `TRUNCATE` nem exclusões de artes ou usuários.
7. Caso apareça erro, pare e verifique a mensagem antes de fazer o deploy.

Os sete comandos da migração v2 já foram executados em sua conversa anterior; NÃO repita os antigos. Esta v2.3 tem somente os **dois novos comandos**.

## Deploy

1. **Depois** de concluir os dois comandos SQL, publique **todos os arquivos desta v2.3** no repositório GitHub que está ligado à Vercel. Não publique só o novo componente.
2. Confirme que a Vercel utiliza as mesmas variáveis de ambiente e Neon que já funcionam com a v2.2. Nenhuma variável adicional é necessária para o Bocão; as imagens utilizam o upload da biblioteca já existente.
3. Execute/acompanhe o novo deploy na Vercel. O `npm run build` do projeto executa `prisma generate && next build`, gerando o cliente Prisma com a tabela Bocao.
4. Teste primeiro um deploy de Preview, depois publique em Production.

## Como testar

- Entre no Admin Master → **Bocão** → Cadastrar bocão. Pesquise um código de arte já existente e envie uma imagem pequena de teste.
- Acesse a biblioteca como assinante → abra a arte principal → clique **Ver bocão correspondente**. Confira se o mesmo código aparece em ambos.
- Na aba Bocão, pesquise `CG-XXXX`. Confira a arte, complemento e os botões **Ver arte principal** e **Baixar bocão**.
- Faça o download como assinante e confira o nome `CG-XXXX-bocao-...`. O original privado usa o R2 quando configurado.
- Entre com o usuário Preview e confirme que o botão de download permanece bloqueado e a visualização usa marca-d'água.
- Confira **Admin Master → Dashboard → Estatísticas da landing**: o Analytics da v2.2 foi preservado.
- Confira também a biblioteca principal, Selecionadas, Lançamentos e reprovadas para garantir que continuam sem bocões misturados nos resultados.

## Validações neste ambiente

Testes automatizados de controle de acesso, relação CG, API, downloads e analytics passaram. Todos os 188 arquivos TypeScript/TSX passaram na análise de sintaxe. Não foi possível rodar o build completo com dependências e Neon neste ambiente; a compilação da Vercel e o teste operacional continuam obrigatórios antes de considerar a implantação finalizada.

> Recomenda-se não apagar o deploy anterior até validar a nova versão. A reversão do código da Vercel não remove a tabela nova do banco; ela poderá permanecer sem afetar os registros existentes.

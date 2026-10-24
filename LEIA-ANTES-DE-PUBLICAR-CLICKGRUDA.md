# Click & Gruda — Biblioteca + Conta Preview + Analytics

## Aviso importante sobre o banco de dados

**É obrigatório atualizar o banco Neon ANTES de publicar este código na Vercel.**

Este projeto usa três campos novos (`User.isPreview`, `User.previewMaxSessions`, `Art.isRejected`) e uma nova tabela (`SiteEvent`). Se o código entrar em produção antes do esquema do banco estar atualizado, as páginas podem apresentar erros de banco de dados.

### Passo a passo simples (Vercel + Neon)

1. Faça um backup do seu banco de produção (Neon → Branches → crie uma branch de segurança; se disponível, faça também um backup separado).
2. Abra o painel Neon vinculado à Vercel e certifique-se de que está no banco **Production**, não no Preview. No **SQL Editor**, abra o arquivo `MIGRACAO-CLICKGRUDA-v2.sql`, copie todo o conteúdo e execute. A operação é aditiva e não remove seus cadastros atuais.
3. Aguarde a confirmação de sucesso da consulta SQL. Só depois atualize os arquivos no repositório GitHub que a Vercel publica.
4. Na Vercel, abra seu projeto → **Deployments** e acompanhe a publicação. Faça inicialmente um teste na URL de *Preview*, se possível.
5. Entre no **Admin Master** → **Usuários** → **Criar usuário Preview**, cadastre nome, e-mail, senha e limite simultâneo (ex.: 10 ou 20). **A nova conta não existe automaticamente**: ela deve ser criada pelo admin.
6. Teste em janela anônima: login Preview → popup de apresentação → navegar nas artes → bloquear download, salvar, favoritos e formulários → ampliar com borrão → conferir Mockup 3D e Loja Online. Confira também a categoria **Sem categorias**, a biblioteca **Artes reprovadas** e os indicadores do Admin Master.
7. Confira o relatório de analytics após visitar a landing e interagir com um botão. O relatório cobre os **últimos 30 dias a partir da publicação**: não recupera visitas antigas.

Alternativa técnica: com as variáveis corretas de conexão no ambiente, `npx prisma db push` sincroniza o esquema; não execute sobre o banco de produção sem antes verificar as alterações propostas pelo Prisma. Prefira o SQL aditivo incluído.

## Melhorias nesta versão

- **Exclusão em lote**: selecionar artes na gestão do Admin, inclusive resultados filtrados de várias páginas; digitar `EXCLUIR` para confirmar. Exclui **registros no PostgreSQL**, junto dos relacionamentos dependentes; arquivos armazenados em R2 permanecem e precisam de limpeza manual posterior, se desejado.
- **Biblioteca de artes reprovadas**: ao cadastrar, editar ou importar artes, marcar como "Design reprovado". Elas saem da biblioteca principal e entram em aba própria, sem se misturar aos lançamentos nem às selecionadas. No Admin há filtro e edição em lote para esta característica.
- **Tags durante o cadastro**: cadastrar uma tag inédita sem sair do editor de arte.
- **Voltar ao topo**: botão com seta fixa que aparece após a rolagem.
- **Sem categorias**: filtro virtual que reúne somente artes sem `categoryId` definido. Não cria registro de categoria artificial no banco, de modo que sempre reflete as artes realmente não categorizadas.
- **Métricas no Admin Master**: visualizações da landing, visitantes aproximados (identificador anônimo por navegador), cliques em CTA, interações FAQ e profundidade de rolagem nos últimos 30 dias. Métricas podem variar por bloqueadores de scripts/cookies e visitas em navegadores diferentes.
- **Conta universal Preview**: criação e configuração pelo Admin Master; máximo ajustável de 1 a 100 sessões ativas. Além do limite, sessões mais antigas são encerradas. A conta é apenas de navegação, com bloqueios no front-end e verificação de autorização no back-end. As imagens são servidas à conta Demo/Preview como arquivo WebP **reduzido, borrado e com marca-d'água**, por rota específica; o arquivo original não é devolvido no catálogo. O botão direito é interceptado na área do portal, e o botão de download é desativado.
- **Popup exclusivo Preview**: apresentação da biblioteca, novidades semanais e intenção de expandir com cursos/dicas. **15 mil artes na virada 2026/27 é uma meta, não um número atual.** CTA de navegação e contato para assinar.
- **Mockup e loja**: botões permanecem acessíveis na conta Preview, redirecionando às ferramentas externas já utilizadas; essa permissão de navegação **não libera** salvamento ou ações de terceiros feitas nos sites externos.

## Segurança e limitações

- Nenhum site pode impedir por completo uma **captura de tela**, fotografia da tela ou inspeção de dados já transmitidos ao navegador. Esta versão evita enviar o original para a conta Preview e usa amostra de baixa definição, borrada e marcada; não promete blindagem absoluta.
- O bloqueio de gravações se aplica aos serviços e endpoints **desta aplicação**. O Mockup 3D e a Loja Online abrem aplicações externas, cuja autenticação e permissões são independentes.
- A proteção de login simultâneo é por **sessão criada ao efetuar login**, não por pessoas únicas. Dispositivos desconectados fazem login novamente; o mais antigo pode ser derrubado ao superar a cota.
- Recomenda-se testar o gerenciamento de sessão, anexos grandes, preview remoto do R2, permissões, layout mobile/desktop e consultas de analytics na URL Preview e no banco de testes antes de publicar em produção.

## Validação disponível nesta entrega

O código foi analisado estaticamente e passou no conjunto de testes de regressão estática de funcionalidades. **Não foi possível executar um build real do Next.js/Prisma neste ambiente**, pois a instalação de dependências requer acesso ao registry que não estava disponível. Assim, a entrega é uma versão implementada que ainda requer confirmação final na Vercel; não é um certificado de funcionamento 100% em produção.

Rode `node --test scripts/preview-features.test.mjs` para repetir as checagens de cobertura estática. Para validação final rode `npm ci`, `npx prisma generate` e `npm run build` no ambiente com dependências e banco configurados.

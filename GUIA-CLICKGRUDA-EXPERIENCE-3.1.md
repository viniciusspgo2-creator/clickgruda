# Click&Gruda Experience 3.1 — refinamentos solicitados

## Origem
Esta versão **parte da Experience 3.0** e aplica ajustes aos pontos marcados nos screenshots de revisão. Projeto completo no ZIP; não é um patch parcial.

## Alterações entregues

1. **Faixa de backup**: removida do topo. O recurso de exportar o catálogo em ZIP continua disponível no menu lateral desktop e no painel de categorias no celular; nenhum endpoint de exportação foi removido.
2. **Barra de filtros**: esquema escuro consistente, textos e seleção de ordenação legíveis, botões com contraste melhorado, barra fixa sob o cabeçalho.
3. **Cabeçalho**: botão "Explorar" renomeado "Categorias"; continua abrindo a lista completa, não uma seleção parcial.
4. **Artes da biblioteca**: área visual ajustada para proporção mais próxima das estampas, sem padding branco adicional. **Sem crop e sem alteracão no arquivo original**. Artes com proporções diferentes ainda podem ter pequenas margens naturais, para não cortar conteúdo.
5. **Ferramentas**: cartela "Sua própria loja online" escurecida para manter contraste de título, descrição e ações; painel informativo também harmonizado.
6. **Hero**: galeria de imagens inclinadas substituída por **mascote de caneca em PNG com transparência**, trabalhada a partir de referência enviada pelo proprietário, com tratamento local de composição e sombra, sem dependência de carregamento externo.
7. **Prévia ampliada**: janela com largura máxima maior, coluna de imagem prioritária, controles de zoom de 100% a 300%, gesto de duplo clique para zoom, botão para abrir a imagem original em nova aba. O modo demonstração continua protegido.
8. **Ordenação padrão**: "Mais recentes" continua sendo o padrão de entrada; voltar para "Visão geral" reativa essa ordenação. "Mais baixadas" continua disponível explicitamente.
9. **Categorias duplicadas**: seção "Explorar por categoria" com apenas dez opções removida; todas as categorias continuam acessíveis no menu completo, sem apagar categoria alguma.

## Preservação de dados e funções
- **Não foram alterados**: schema Prisma, migrations, rotas da API, permissões, modelo das artes, uploads e lógica de usuários.
- **Preservados**: lançamentos, selecionadas, sazonais, busca, favoritos, downloads, limites, previews, compartilhamento, suporte, sugestões, gerador de mockups, loja online e administração.
- Artes já cadastradas usam suas URLs atuais, **sem recadastro e sem conversão automática do arquivo original**.

## Verificações neste ambiente
- `npm run check:source`: OK (172 arquivos TS/TSX)
- `npm run test:discovery`: OK (6/6)
- `npm run check:types`: **não concluído**, dependências/@types presentes como diretórios vazios neste ambiente; não indica erro do projeto.
- Build Next.js e teste visual em navegador com conta autenticada: **não realizados aqui**. Validar no Preview da Vercel.

## Segurança antes de publicar
1. Backup do repositório e banco de produção.
2. Crie uma branch e **Preview Deployment** na Vercel; preserve variáveis de ambiente.
3. Execute `npm ci`, `npm run check:source`, `npm run test:discovery`, `npm run check:types`, `npm run build`.
4. Teste portal desktop/celular, menu de categorias (lista completa), seleção de sazonal e lançamento, preview e zoom, download individual, ZIP opcional, favorito, loja, gerador de mockups, painel e conta demo.
5. Teste dados de escrita num banco separado se a Preview compartilhar o banco de produção.
6. Só promova à produção após confirmar essas funcionalidades.

**Atenção:** rollback da Vercel reverte código mas não alterações de banco — nesta revisão não há migração de schema.

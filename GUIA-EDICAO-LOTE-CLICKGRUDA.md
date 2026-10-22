# Click&Gruda — Administração de artes em lote

## Implementado

- **Seleção manual** por checkbox em cada arte, preservada entre páginas e filtros.
- **Selecionar página** (40 por vez) ou **todos os resultados da pesquisa/filtros** (até 10.000 por operação), com possibilidade de desmarcar exceções específicas.
- Filtros combináveis: título/código, categoria, data sazonal, lançamento e selecionadas.
- **Editar em lote:** trocar ou remover categoria e data sazonal; marcar/desmarcar lançamento e selecionada; adicionar ou remover tags.
- **Edição individual rápida:** nova ação `✨` ao lado de `⭐` para alternar o selo NOVO sem abrir o formulário.
- **Confirmação em duas etapas:** revisão das alterações solicitadas e quantidade afetada; mais de 100 artes ou seleção integral do catálogo exige digitar `ALTERAR`.
- **Proteção de dados:** campos em "Manter sem alterações" são preservados. Nomes, imagens, códigos, originais e downloads não são modificados na edição em lote.
- **Segurança:** endpoint exclusivo para ADMIN; valida IDs de categoria/data; confere a quantidade de artes antes de salvar; executa as alterações juntas dentro de uma transação.
- **Não exige migração** de esquema ou alteração de dados existentes.

## Como utilizar

1. Entre no painel administrativo, aba **Artes**.
2. Busque ou filtre, por exemplo, as artes com o título "Pai" e a categoria desejada.
3. Marque as artes individualmente, clique em **Selecionar página**, ou use **Selecionar todos os N resultados**. A seleção manual continua válida em outras páginas.
4. Clique em **Editar em lote**.
5. Escolha apenas os campos que deseja mudar. Exemplo: Categoria = `PAIS` e Data sazonal = `Dia dos Pais`; mantenha as outras opções em "Manter sem alterações".
6. Clique em **Revisar**, confira a quantidade e os campos e confirme. Se o lote for grande, digite `ALTERAR`.
7. A lista do admin e o catálogo são atualizados automaticamente após sucesso.

## Notas importantes

- O modo **Selecionar todos os resultados** corresponde aos filtros em vigor no momento em que se seleciona o conjunto. Mudanças de filtro saem desse modo para evitar edições indevidas.
- Alterações concorrentes ou itens removidos desde a seleção bloqueiam o lote: atualize a lista e selecione novamente.
- Se o lote tiver mais de 10.000 artes, divida por filtros; evita transações excessivas.
- O campo de tags aceita até 20 por operação, separadas por vírgulas, ponto e vírgula ou novas linhas.
- O endpoint da API é `PATCH /api/admin/arts/bulk` e mantém a autenticação por sessão ADMIN.

## Validação e publicação

- Executada verificação estática de sintaxe e imports locais em **168 arquivos TS/TSX**, sem erros.
- **Build completo não foi executado** neste ambiente porque o registro npm não estava acessível (EAI_AGAIN). Execute `npm ci`, `npm run check:types` e `npm run build` no seu ambiente ou no pipeline antes de publicar.
- A alteração não requer `prisma db push` ou qualquer migração; foi feita com as tabelas e relações já existentes.
- Faça backup do código antes de substituir os arquivos no seu repositório. O ZIP completo mantém a estrutura original do projeto fornecido.

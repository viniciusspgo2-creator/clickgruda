# Click & Gruda — Home + Dashboard Premium (27/10/2026)

## Entrega

Esta atualização incorpora o adendo de reposicionamento à Home pública e ao portal interno, utilizando os dados e fluxos que já existem no projeto. **Não foi criada nenhuma prova social**: sem depoimentos, estrelas, prints de WhatsApp ou fotografias de supostos clientes. Nada foi simulado.

### Home comercial — `src/components/views/LandingView.tsx`

- Headline, explicação e três benefícios orientados a trabalho real com canecas.
- CTA **Garantir meu acesso** (ou a modalidade do plano atual) passa a ser principal e conduz ao checkout/cadastro existente; **Conhecer as artes grátis** é a opção secundária, usando a demonstração já existente. Preço só é exibido quando confirmado pela API do catálogo. O CTA de compra também aparece no topo, em outras seções e na barra fixa mobile.
- Segundo CTA leva ao vídeo real do Vimeo já configurado. Não foi atribuído tempo de vídeo não confirmado.
- Contagem de artes vem da API `/api/catalog` (`counts.arts`). Se não houver resposta, a Home **não inventa um número**. Acervos menores que 100 são tratados como curadoria, não volume.
- Preço e condições continuam conectados ao fluxo de contratação e são exibidos conforme a campanha configurada. Foi evitada a promessa de cancelamento recorrente para a oferta vitalícia.
- Nova seção comparativa entre packs comuns e recursos de biblioteca organizada. Não há números de vendas, avaliações ou promessas de impressão perfeita.
- Seções existentes e material institucional foram preservados.

### Cards e filtros — `src/components/shared/ArtCard.tsx`, `src/components/views/PortalView.tsx`, `src/app/globals.css`

- Card sem botão laranja gigante sempre visível. No desktop, overlay com **Abrir Studio 3D**, prévia, download e favorito. Em dispositivos touch, as ações aparecem numa faixa compacta permanente para não depender de hover.
- Títulos totalmente em maiúsculas são apresentados em formato legível **somente no frontend**; cadastro original intacto.
- Um único badge principal por card: `Novo` prioritário, ou `Selecionada`.
- Filtros por categoria em pills horizontais, com contagens fornecidas pelo servidor, e busca sempre visível junto aos filtros.
- Grade: 3 colunas em desktop e 2 colunas em tablet e mobile; skeleton para 12 itens.
- Vazio com mascote existente e contagem de lançamentos somente se disponível na API.
- Gaveta de filtros com Dark Mode consistente, incluindo tags; modal de prévia mantém fundo claro somente na área visual da arte.
- Botão do gerador de mockups recebe maior destaque na barra de ferramentas.
- O banner de boas-vindas do dashboard **não foi alterado**.

### Atenção: integração com mockup

O Studio atualmente é um serviço externo e o projeto não possui um mecanismo comprovado de importação automática da arte para ele. Por isso, ao clicar em **Abrir Studio 3D** no card, o modal real informa o passo a passo **baixar arquivo → abrir Studio → fazer upload da arte**. Para assinantes, foi adicionado o botão *Baixar esta arte* no modal. Não foi falsamente prometida prévia 3D instantânea integrada ao card.

### Validações e publicação

- Os 206 arquivos TS/TSX do projeto foram analisados pelo parser TypeScript (sintaxe e imports locais): 0 erros.
- `src/app/globals.css` validado com parser PostCSS: sintaxe válida.
- **Limitação:** a instalação completa das dependências para `npm run build` não concluiu no ambiente disponível. Alguns testes não executam por falta de bibliotecas de terceiros. Por isso, **não há certificação de build final**. Executar `npm ci`, `npm run check:types` e `npm run build` em ambiente com npm funcional antes do deploy.
- Nenhuma migração de banco, variável de ambiente ou mudança de endpoint foi necessária.
- Para publicar: substitua os arquivos do projeto conservando seu `.git`, commit as alterações e acompanhe o deploy da Vercel; se necessário, use o rollback do projeto.

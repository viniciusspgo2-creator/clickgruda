# Click&Gruda Experience 3.8 — hero panorâmica sem cortes

## Correção principal

- O fundo da hero agora é uma **imagem limpa e única** (`public/uploads/cg-hero-fundo-limpo.webp`) com proporção nativa **2048 × 682 (aprox. 3:1)**.
- A imagem ocupa **100% da largura, sem `object-fit: cover` ou `background-size: cover`**. Não há duas colunas independentes, nem recorte da caneca, nem recorte da mensagem “Artes que inspiram negócios”.
- Textos e botões do lado esquerdo são componentes HTML funcionais. A imagem abaixo deles não contém textos antigos.
- O degradê da esquerda é suave e transparente, sem emenda sólida e sem escurecer a caneca.
- O contador de artes é dinâmico, obtido de `catalogQ.data?.counts?.arts`, e apresenta "…" durante o carregamento em vez de um número fixo.
- Em telas com espaço horizontal insuficiente, a imagem continua 100% visível e a área de texto fica abaixo, permitindo toque confortável nos botões e leitura sem cobrir a mascote.
- O modo Dark/Light e os demais recursos do portal continuam como na versão anterior.

## Verificações

Executadas verificações de fonte e os testes existentes do catálogo. Foi feita também uma visualização local do componente no Chromium em larguras de desktop e celular. Isso **não substitui** o teste completo do portal autenticado no Preview da Vercel.

## Publicação segura

1. Use uma branch para obter um Preview.
2. Confirme a hero em desktop e celular, incluindo os botões e o contador após o carregamento.
3. Confira os modais de Mockup 3D e Loja Online, navegação, filtros, prévia e download.
4. Publique em produção apenas após passar nos testes da sua conta.

Não foi modificado o esquema do banco, a estrutura de armazenamento nem o acervo cadastrado.

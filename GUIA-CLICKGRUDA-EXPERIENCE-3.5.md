# Click&Gruda Experience 3.5 — Hero completa + aviso de prévia

## Mudanças
- Substituída a montagem do hero por uma única imagem panorâmica de 2172 × 724, aprovada em conversa, renderizada inteira e sem `object-fit: cover`.
- Nova imagem otimizada WebP (`public/uploads/cg-hero-completo-aprovado.webp`, aproximadamente 255 KB).
- As regiões do hero para `Explorar artes` e `Ver lançamentos` continuam clicáveis no desktop (teclado e leitores de tela incluídos).
- No celular, devido à escala reduzida da imagem panorâmica, há texto e botões separados abaixo dela, sem cortar a imagem.
- Aviso do modal de prévia revisado: letra maior e orientação explícita contra usar a prévia para impressão/personalização.
- Funcionalidades, APIs e schema do banco mantidos.

## Atenção editorial
A imagem panorâmica contém os textos e o contador "3.571" embutidos. Eles são parte estática do arquivo e **não atualizam automaticamente** quando novas artes são cadastradas. Para atualização automática futura, recomenda-se gerar outra versão da arte sem textos dinâmicos e renderizá-los como HTML. Em celulares, uma contagem viva é mostrada abaixo do banner.

## Validações
- `npm run check:source` — aprovado (172 arquivos)
- `npm run test:discovery` — aprovado (6 testes)
- Build e validação visual em navegador ainda dependem de ambiente com dependências npm completas, Vercel Preview recomendado.

## Publicação
Faça backup/commit da versão anterior e deploy numa branch de Preview da Vercel. Revise o banner nas larguras 360/390/768/1280/1920, os botões e o aviso da prévia. Só então promova para produção.

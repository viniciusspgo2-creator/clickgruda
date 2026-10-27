# Correção visual da landing

A classe da landing nova coincidia com a da versão antiga. Uma regra antiga fora das camadas do Tailwind aplicava fundo creme e texto escuro, sobrescrevendo o fundo escuro planejado. Com isso, os parágrafos brancos ficavam ilegíveis sobre o fundo claro e alguns títulos escuros sumiam nas faixas escuras.

A landing atual agora tem seu próprio escopo `cg-sales-page`, com fundo e cor de texto definidos explicitamente. A alteração corrige a herança de cores em todas as seções da página.

## Publicar a correção

No projeto que você já atualizou, basta substituir estes dois arquivos pelos do ZIP e publicar novamente:

1. `src/app/globals.css`
2. `src/components/views/LandingView.tsx`

O ZIP contém o projeto completo com a correção. Não apague o projeto, não recrie o banco e preserve as variáveis de ambiente existentes. Os ajustes de Mercado Pago, cupons, categorias e SEO estão mantidos.

## Conferência

O problema foi confirmado no navegador em `https://www.clickgruda.com.br/`: o fundo calculado era `rgb(247, 243, 237)` e os títulos herdavam `rgb(17, 19, 25)`.

O verificador `node scripts/verify-landing-theme.cjs`, executado após o build, confere o HTML e o CSS compilados, a precedência de camadas e a herança de cor dos títulos em larguras de 360, 768 e 1440 pixels. Ele também reproduz a colisão antiga para verificar que o teste detecta o problema original. É uma verificação de CSS e contraste, não uma captura visual da versão nova em produção.

Resultado: as três larguras passaram, com 29 títulos em cor clara e contraste do texto secundário acima de 5:1. A compilação de produção e o TypeScript foram validados usando `next build --webpack`; o cache local do Turbopack apresentou uma falha de persistência, por isso a validação desta correção usou Webpack. Não foi necessário alterar o comando de publicação do projeto.

A correção só aparece no domínio após a publicação dos arquivos. A confirmação visual final no computador e no celular deve usar o novo deploy.

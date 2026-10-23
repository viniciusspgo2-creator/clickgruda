# Click&Gruda Experience 4.1 — Correção completa da página de vendas

## Base utilizada
Continuação da base 4.0 do projeto. **Somente a landing pública e informações editoriais da oferta foram alteradas.** Checkout, portal, blog, API e componentes administrativos foram preservados.

## Mudanças executadas

- Reescrita integral da copy comercial voltada ao **comprador**, sem textos sobre a construção do site.
- Hero com promessa objetiva, mais de **8 mil artes cuidadosamente selecionadas**, benefício da organização, novidades e recursos extras.
- Declaração editorial de quantidade atualizada conforme orientação do proprietário. O número vem do briefing comercial; a contagem exibida no portal continua sendo lida da API.
- Comparação persuasiva com packs de "200 mil artes", sem inventar dados de concorrentes específicos.
- Oferta com **R$ 47,90** quando a precificação do catálogo coincide com a oferta da campanha, incluindo acesso vitalício promocional até **31/12/2026**.
- Botões **Adquirir acesso**, **Comprar acesso vitalício** e **Comprar agora** que usam o fluxo existente de cadastro/checkout; usuários com acesso ativo recebem a ação **Acessar minha plataforma**.
- Novo layout do mascote sem balões ou textos sobrepostos à ilustração.
- O vídeo do Vimeo utiliza parâmetro **loop=1**, permitindo repetição automática ao terminar (dependente das permissões e configurações do player Vimeo).
- Layout mobile com menu retrátil, seções em uma coluna, imagens responsivas e CTA fixo no rodapé da tela.
- 8 imagens convertidas para **WebP** de alta qualidade: tamanho total aproximado de 1,7 MB, sem o custo de carregar vários PNGs grandes.
- Seções de biblioteca, vitrine de artes, mockups 3D, loja com WhatsApp, datas sazonais, ecossistema 45+ ferramentas, como funciona, preço, FAQ e CTA final.
- FAQ e transparência sobre cota eventual de downloads, formas de pagamento e artes não exclusivas.
- Ajuste nas descrições institucionais de SEO para informar o tamanho declarado do acervo.

## Arquivos principais alterados

- `src/components/views/LandingView.tsx`
- `src/components/landing/sales-content.ts` (fallback editorial para 8.000)
- `src/lib/site.ts` (descrições de marca)
- `src/app/layout.tsx` (descrições e cards de busca)
- `public/uploads/rebrand/*.webp` (8 artes do usuário)

## Validação e cuidados

**Sintaxe TSX validada** por compilador TypeScript em modo transpile.
**Todas as imagens citadas existem** na pasta `public/uploads/rebrand/`.
**Loop configurado** no iframe do Vimeo, mas não foi possível testar o comportamento do player hospedado.

O **build completo e o teste visual em navegador não foram possíveis aqui**: dependências como Next.js/Prisma não estão instaladas, e a instalação via npm encontrou erro de conectividade com o registry (`EAI_AGAIN`). Por isso, **não publique diretamente em produção sem testar**.

### Antes do deploy

1. Extraia o ZIP do projeto.
2. No terminal do projeto execute `npm ci` (ou `npm install`, conforme seu fluxo existente).
3. Rode `npm run build` e corrija eventuais mensagens.
4. Teste a home deslogado em celular e desktop, o vídeo em loop e os botões de compra.
5. Valide o acesso/checkout e a navegação para o portal antes de enviar ao domínio final.

O valor e a data da oferta podem ser alterados nas configurações do sistema. A copy mostra as condições conforme o preço retornado pela API.

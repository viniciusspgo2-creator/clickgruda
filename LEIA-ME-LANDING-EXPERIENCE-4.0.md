# ClickGruda Experience 4.0 — Repaginação total da landing

## O que foi feito

A landing page principal foi **reescrita com uma nova direção visual**, abandonando a estrutura anterior para assumir uma proposta muito mais premium e temática.

### Principais mudanças

- Hero totalmente novo, com narrativa mais comercial e visual premium.
- Uso do **mascote/caneca** como identidade central da nova landing.
- Integração das **8 ilustrações geradas** como base narrativa das seções.
- Vídeo do Vimeo mantido, agora dentro de uma moldura mais coerente com a nova estética.
- Reorganização das seções para vender a Click&Gruda como **ecossistema completo**.
- Reforço da comunicação de:
  - biblioteca organizada
  - mockups 3D
  - loja online + WhatsApp
  - coleções sazonais
  - proposta premium com preço acessível
- CTA's e oferta vitalícia mantidos na lógica comercial.
- FAQ e rodapé mantidos, porém reencaixados na nova experiência.

## Arquivos visuais incorporados

Foram adicionados em `public/uploads/rebrand/`:

- mascote-principal.png
- biblioteca-vitrine.png
- mockup-studio.png
- loja-whatsapp.png
- sazonais-calendario.png
- studio-escritorio.png
- busca-acervo.png
- ecossistema-completo.png

## Arquivo principal alterado

- `src/components/views/LandingView.tsx`

## Observação técnica

No ambiente atual, **não foi possível executar o build completo** porque as dependências do projeto não estão instaladas no container (por exemplo, `prisma` e os módulos do projeto). A estrutura e o código da nova landing foram aplicados, mas a validação final deve ser feita no ambiente do projeto com `npm install` e `npm run build`.


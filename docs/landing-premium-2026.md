# Click & Gruda — página de vendas

## Direção e conteúdo

Estúdio criativo em preto, âmbar e branco. Hero ilustrado com o mascote na cadeira gamer segurando uma caneca estampada, headline em HTML e composição distinta para celular. A sequência apresenta acervo real, ferramentas, aprendizado por perfil, materiais extras, demonstração, oferta e dúvidas.

O carrossel conserva as vinte artes originais e acrescenta filtros, pausa, ampliação em dialog nativo e alternativas para movimento reduzido. O vídeo Vimeo só é carregado após o clique. As imagens geradas são WebP locais, sem serviço externo em tempo de execução. Nenhuma dependência nova.

Copy: linguagem direta, benefícios concretos e orientação para iniciantes. Sem depoimentos fabricados, números inventados de alunos, promessa de faturamento ou cronômetro artificial. Preço, prazo da campanha, cota de teste e regras de acesso continuam ligados às fontes existentes. Os links de drives/cursos foram descritos conforme o escopo informado pelo proprietário; confirmar disponibilidade na conta antes de publicar.

## Integração

LandingView mantém os caminhos de cadastro, login, demo, hub e checkout. PremiumLanding contém a apresentação. premium.css usa escopo próprio, evitando colisões com o tema legado. A biblioteca, APIs, banco, pagamentos, schemas SEO e autenticação não foram modificados.

## Validação realizada

- TypeScript sem erros no conjunto de componentes e dependências recuperado.
- Build otimizado de uma aplicação local de verificação com os componentes reais: compilação, tipagem e HTML estático concluídos.
- 8 testes aprovados: caminhos de visitante/membro/teste/demo, oferta grátis desativada, assets responsivos e preferência de movimento reduzido.
- CSS compilado: fundo e contraste verificados em regras de 360, 768 e 1440 pixels; isolamento do tema legado validado.
- Hero desktop: 121.498 bytes. Hero mobile: 93.952 bytes. Ilustração de recursos: 83.630 bytes.

Limites: o checkout e as APIs de produção não foram executados. O ambiente local de verificação usou Next 16.4.6 já disponível; o projeto declara Next 16.1.1. O build completo com banco/Prisma deve ser executado no CI original. A ferramenta de navegador falhou ao iniciar, o acesso HTTP local foi bloqueado e a captura headless falhou no ambiente Windows. Portanto, inspeção visual real e testes de teclado/toque no navegador ainda são necessários no preview da PR antes do merge.

## Verificação no preview

1. Conferir 360, 390, 768 e 1440 pixels: hero, CTAs, oferta, rodapé e ausência de rolagem horizontal.
2. Filtrar, pausar, ampliar e fechar artes por Escape; conferir retorno do foco.
3. Navegar entre perfis por teclado e abrir perguntas frequentes.
4. Testar cadastro, demo e compra com contas de teste; validar a oferta efetiva.
5. Ativar movimento reduzido e conferir carrossel manual.

## Referências pesquisadas

- [Nielsen Norman Group — Be Succinct](https://www.nngroup.com/articles/be-succinct-writing-for-the-web/): organização e escaneabilidade da copy.
- [React Bits](https://github.com/DavidHDev/react-bits): referência de linguagem de movimento e superfícies.
- [Motion](https://github.com/motiondivision/motion): referência de animação para interfaces.

Os efeitos finais usam CSS e Web Animations API; não foi copiado código de terceiros dessas referências.

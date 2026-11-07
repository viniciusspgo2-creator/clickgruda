# Coerência do produto e organização — 07/11/2026

## Revisão e mudanças

- A oferta repetia as regras de 20 downloads/24h/7 dias em diversos blocos. A hero mantém a apresentação do teste; as regras detalhadas ficam no FAQ. Os demais blocos explicam os benefícios e o uso do pacote. A seleção do FAQ passa a nove perguntas úteis à decisão; o JSON-LD usa a mesma seleção.
- O pacote destaca futuras atualizações e novos produtos disponibilizados para membros, conforme solicitado pelo proprietário. A promessa de frequência semanal foi substituída por novos lançamentos, sem cronograma não confirmado. Foram retiradas afirmações absolutas de que todos os arquivos têm medida exata e dispensam conferir a impressão.
- O caminho antigo do portal pedia código ao suporte e apontava para clicktools. Agora os acessos existentes se chamam Studio · Mockup + Editor e usam o endereço do CLICKTESTE, em outra aba. Ver meu código do Studio leva ao Resumo do seu acesso; Copiar código continua no mesmo bloco. A expiração dos downloads não impede esse caminho durante o teste independente dos bônus.
- O Admin conserva as 16 seções, agrupadas em Visão geral, Acervo, Membros e vendas, Relacionamento e Configurações. O cabeçalho informa o grupo atual. A exportação CSV de artes aparece na seção de Artes.
- Arte/Bocão fica acima de Artes reprovadas, com a cor dos ícones corrigida. O layout principal do acervo foi preservado.
- O botão individual de download recebe brilho pulsante suave, sem movimentar ou redimensionar o botão. A animação desliga com movimento reduzido e quando o botão está desativado.
- O menu de contexto e o arraste ficam bloqueados nas superfícies das prévias. A opção de abrir a prévia em outra aba foi removida; a cópia de textos e do código do Studio permanece disponível. Isso é uma barreira de interface para as prévias, não uma promessa de impedir capturas ou toda cópia de conteúdo exibido no navegador.
- O atendimento Melhorar minha arte descreve pequenas adaptações, nitidez e redução de pixelização conforme o arquivo permitir. Formulário, confirmação, Admin e FAQ deixam claro que não inclui edição de conteúdo, troca de nomes/personagens ou criação/reconstrução da composição.

## Catálogo ZIP descontinuado

Removidos os botões no portal/filtros, estado/modal, BackupStrip, compactador cliente, API /api/arts/ids, modo via=zip, textos do Admin e dependência fflate. O cartão de mockup antigo sem importadores também foi removido. O download individual conserva a transação, o bloqueio por usuário e a cota.

O marcador histórico viaZip continua no banco/schema para preservar downloads anteriores sem migração destrutiva; não existe caminho ativo no aplicativo que gere o antigo catálogo ZIP. Nenhum original de arte, upload ou ilustração foi removido.

## Verificação

- Hero JSX e seus textos em SALES comparados com a base: idênticos. Arquivos públicos, preço, campanha, schema Prisma, autenticação, sessões e processamento de pagamentos não foram alterados.
- 31 cenários com dois PostgreSQL descartáveis e build real. Chromium verifica grupos do Admin, pagamentos existentes, bloqueio de contexto/arraste, download com bytes reais, pulso sem mudar posição/tamanho, preferência de movimento reduzido, zoom da prévia, API ZIP retornando 404 e acesso ao código do Studio inclusive após o prazo da Biblioteca. O fluxo de cadastro/compra continua convertendo o mesmo código por HTTPS/HMAC.
- Nove suítes de regressão passaram, incluindo conta, analytics, Cakto/comércio, cota, recuperação, SEO e interface. A regressão de backup foi substituída pela comprovação de sua remoção; a verificação de 550 downloads individuais e barreiras de acesso foi mantida.
- Landing conferida no Chromium em 1440 e 390 px, com oferta, FAQ, preço e CTA; sem criar contas ou pagamentos nessa conferência. Build, TypeScript, check:source (211 arquivos) e diff --check passaram.
- Lint comparado com a base nos componentes revisados: nenhum diagnóstico novo. Permanecem os dois avisos de navegação anteriores em LandingView e os três erros anteriores de efeitos que redefinem estado em ArtPreviewDialog/EnhanceRequestDialog; os dois erros anteriores em PortalView também não foram ampliados por este trabalho.

Evidências locais: /workspace/work/product-coherence-20261107/ e /tmp/library-benefits-wETWIp/.

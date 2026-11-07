# Acesso compacto e exclusão pelo portal — 07/11/2026

## Comportamento

O portal mostra a faixa **Meu acesso e código do Studio**, recolhida por padrão. Ela informa o saldo ou **Acesso completo**. Ao abrir, o membro consulta prazos, código salvo, cópia e acesso ao Studio. O comando **Ver meu código do Studio** também expande a faixa e leva o foco ao código. Primeiros passos fica recolhido. A mudança é de apresentação; emissão, persistência, prazos e conversão do mesmo código continuam no fluxo existente.

Na sessão Admin Master, o card da arte oferece **Excluir arte** ao passar o mouse ou navegar pelo teclado. Em dispositivos de toque a ação fica visível. Membros, demonstrações e previews não recebem o botão. A confirmação identifica título e código e explica que a remoção vale para todos os membros. Cancelar não envia a exclusão; falhas mantêm a confirmação aberta e permitem repetir.

A exclusão reutiliza DELETE /api/admin/arts/[id], com validação de sessão administrativa real e origem. As mesmas remoções de arte, tags, favoritos e downloads já feitas pelo Admin agora estão em uma transação, evitando vínculos removidos parcialmente em caso de falha. Um item já excluído retorna 404 e o portal limpa o card obsoleto. Lista, pareamentos e consultas do catálogo/Admin são atualizados. Não há nova rotina de remoção de arquivos do storage, migração de schema ou modificação de contas/pagamentos.

## Verificação

- Build de produção e TypeScript passaram; check:source conferiu 212 arquivos; diff --check passou.
- 33 cenários com dois PostgreSQL isolados, incluindo exclusão autenticada, bloqueio de membro/anônimo/origem externa, vínculos, item já removido e preservação do Master e dos pagamentos.
- Chromium exercitou cancelar, falha temporária e repetição com exclusão real no banco de teste; o card saiu do portal e a arte vizinha permaneceu. Nenhuma arte de produção foi excluída na verificação.
- Chromium verificou abertura pelo teclado, estado recolhido, comando direto ao código, largura móvel de 390 px, saldo após download e conversão por compra preservando o código original. A faixa recolhida ocupou menos de 140 px no desktop e 165 px no celular.
- Nove suítes de regressão passaram (conta, analytics, concorrência/webhook Cakto, comércio, cota, recuperação, SEO e interface). Lint dos componentes novos/revisados não introduz diagnósticos; os dois erros anteriores de efeitos em PortalView permanecem fora deste escopo.

Evidências locais: /tmp/library-benefits-Xcr7xA/ e /tmp/compact-access-{integration,regressions,eslint}.log.

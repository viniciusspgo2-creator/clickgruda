# Click & Gruda — contas de teste com limite individual de downloads

## O que mudou

- **Admin Master > Usuários > Novo usuário:** marque "Conta de teste — limitar downloads", defina o total de downloads (por exemplo, 5) e cadastre. O acesso ao portal é liberado para testes.
- **Admin Master > Usuários > Limite:** altere a cota de um usuário a qualquer momento ou desligue a limitação para liberar downloads ilimitados. O painel mostra a quantidade utilizada e indica contas esgotadas.
- **Portal do testador:** mostra quantidade utilizada/restante e um convite para adquirir acesso completo. Quando a cota acabar, passa a usar imagens de prévia protegidas, embaçadas e com marca-d'água; botões de download ficam bloqueados. Há um CTA **"Garanta seu acesso completo"** que abre uma conversa com o suporte pelo WhatsApp, sem alterar o checkout público.
- Cada pedido de download de uma arte conta como 1, inclusive repetições. A contagem utiliza o histórico já gravado no banco; ao aplicar uma cota a um usuário que já tinha histórico, esse histórico conta.
- Para contas de teste, **download em ZIP é desativado**, evitando que um teste de poucos downloads acione o backup completo. O bloqueio é aplicado no servidor, inclusive se tentarem chamar a API diretamente.
- O servidor utiliza **transação com bloqueio de linha do usuário** ao registrar um download, para que pedidos simultâneos não excedam a cota.
- **Contas normais e contas Preview originais continuam como estavam.** Sem cota configurada significa downloads ilimitados.
- **A integração Cakto permanece original:** checkout público, webhook, liberação automática e conciliação administrativa não foram alterados. Contas de teste são concedidas manualmente pelo Admin Master. A liberação definitiva dessas contas também é gerenciada pelo Admin Master, removendo o limite de downloads quando apropriado.

## Deploy

**Sem migração de banco:** o limite fica no registro `member-profile:<id>` da tabela `Setting` já existente. Não é necessário executar `prisma db push` apenas por esta função. O código foi feito para manter os perfis atuais compatíveis com o novo campo opcional.

Suba o código na Vercel normalmente. Confirme que as variáveis existentes de banco, autenticação, R2 e checkout Cakto estão corretas.

## Teste sugerido

1. Criar usuário manual com limite **2 downloads**.
2. Logar na conta, confirmar a faixa **0 de 2** e baixar uma arte: deve mostrar **1 de 2**.
3. Baixar mais uma vez: deve chegar a **2 de 2**, esconder os originais e travar os downloads.
4. Tentar abrir `/api/arts/<id>/download` diretamente: deve receber erro HTTP **403**, sem incrementar o histórico.
5. Voltar no Admin, aumentar limite para 3: o próximo download pode acontecer. Desligar limite: fica ilimitado.
6. Confirmar que uma conta assinante normal e a conta Preview universal mantêm o comportamento anterior.
7. Na conta de teste, o botão **Garanta seu acesso completo** deve abrir o atendimento no WhatsApp. O Admin pode remover a cota manualmente após a compra confirmada.
8. Testar separadamente o fluxo público de compra e o webhook Cakto: ambos devem continuar idênticos ao projeto original.

## Validação desta entrega

- Verificação de sintaxe TypeScript/TSX: concluída, sem erros de parsing.
- Testes automatizados do núcleo de cota (ilimitado, cota 2, zero, histórico): passaram.
- O build completo e o teste contra o banco real **não foram executados** nesta sessão porque a instalação de dependências não concluiu no ambiente de execução. Antes da publicação em produção, recomenda-se validar `npm ci`, `npx prisma generate`, `npm run check:types` e `npm run build` no ambiente de CI/Vercel.

> Nota de segurança: é impossível revogar arquivos que já foram baixados ou URLs assinadas que ainda estejam válidas. As prévias públicas eventualmente visualizadas antes do esgotamento também não podem ser "desvisualizadas" do navegador, mas o endpoint passa a entregar prévias protegidas após atingir a cota.

## Importante sobre a falha no deploy (module-not-found)

As sete falhas mostradas apontam para a ausência do arquivo `src/lib/download-quota.ts` no código enviado à Vercel. Esse arquivo **está incluído neste ZIP completo**. Certifique-se de publicar a pasta `src/lib` inteira e que o arquivo apareça no GitHub no commit/branch usado pela Vercel. Enviar só alguns arquivos alterados sem os arquivos novos faz o build falhar.

Não sobrescreva os arquivos de checkout, webhook nem processamento de pagamentos com versões de testes anteriores. Os cinco arquivos restaurados nesta entrega correspondem ao conteúdo do ZIP original anexado, inclusive os módulos de pagamento mencionados acima.

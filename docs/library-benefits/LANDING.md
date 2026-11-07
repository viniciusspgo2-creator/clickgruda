# Biblioteca como porta de entrada — 2026-11-07

A landing mantém a identidade visual e as imagens existentes, com a Biblioteca como produto principal. O botão principal abre o cadastro grátis; a demonstração sem cadastro continua disponível como prévia protegida.

A oferta distingue até 20 downloads em 24 horas, desde o cadastro, dos 7 dias independentes do Studio Mockup e do Editor. Os bônus acompanham o pacote da Biblioteca. O código é obtido na conta, com link para o Studio publicado em clickteste.vercel.app. Perguntas frequentes, descrição e dados estruturados seguem essas regras. O preço aprovado de R$ 47,90 e as condições da campanha foram preservados.

O botão de compra mantém a intenção de checkout após o cadastro, inclusive quando a conta criada recebe o teste grátis. Uma conta em teste pode comprar; um membro completo pode voltar à Biblioteca. Landing e formulário compartilham a consulta pública da oferta com cache de 60 segundos.

## Verificação

- Build de produção, TypeScript, fonte e diff check passaram.
- Chromium: 1440, 390 e 360 px, sem rolagem horizontal; navegação, cadastro pelo botão principal, compra após cadastro e compra por cliente em teste conferidos.
- As identidades, a resposta de cadastro e o destino de checkout desses testes foram simulados somente no navegador local. Nenhuma conta ou pagamento real foi criado. A API local de oferta foi exercitada.
- As duas verificações existentes do hero mobile passaram. A inspeção visual manteve as imagens, o tema e a hierarquia da Biblioteca.
- O verificador antigo de tema espera fundo #0c0b0e, mas a própria main já usa #0b0b0f desde o ajuste visual anterior. Esse verificador continua desatualizado; a cor de fundo não foi alterada nesta mudança. Lint sem erros nos arquivos alterados, com avisos do padrão existente de navegação completa para o checkout.

Não há alteração de schema, sessões, senhas, contas, integração HMAC, quotas ou processamento de pagamentos.

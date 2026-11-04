# Validação da página inicial — 30/10/2026

## Resultado técnico

| Verificação | Resultado |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | Dependências do lockfile instaladas |
| `npm run check:source` | 206 arquivos TS/TSX válidos; imports locais encontrados |
| `npm run build` | Compilação de produção aprovada; TypeScript aprovado; 60 páginas estáticas geradas |
| Testes de recuperação executados pelo build | 4 aprovados |
| `npm run test:account-experience` | 6 aprovados |
| `npm run test:seo` | 14 aprovados |
| Cabeçalho principal | Um único `h1` |
| Imagens da hero | Arquivos locais WebP, versões desktop e celular |
| Endereço na seção do Studio | `https://clickmockup.vercel.app/` |

A compilação final foi executada com cache limpo. Um cache de desenvolvimento anterior apresentou erro de persistência do compilador; foi removido e a compilação limpa concluiu normalmente. Não foi necessário alterar dependências, configuração de produção ou banco de dados.

## Verificação visual e de navegação

A página foi aberta no navegador de revisão usando a aplicação Next.js, incluindo uma execução da compilação de produção. A hero foi inspecionada no desktop e em janelas internas com larguras de celular de 390 e 320 pixels. O enquadramento móvel mostra o mascote completo abaixo do título. Também foi revisada a faixa de tablet, com ajuste para preservar a imagem inteira.

O menu de celular foi aberto e o botão principal encaminhou para a tela de cadastro, com os campos de nome, WhatsApp, e-mail e senha e a informação de ativação pendente. Nenhum formulário de cadastro foi submetido.

O menu reconhece a seção do Studio. O posicionamento da rolagem foi ajustado para ocorrer após o fechamento do menu móvel. Os links externos da seção e do rodapé apontam para o endereço solicitado e usam abertura em nova aba.

## Limites

- O ambiente de revisão não recebeu as credenciais do banco de produção. Não foi realizada compra, ativação ou demonstração autenticada real.
- O preço e o total de artes continuam dependentes do catálogo configurado. Quando esses dados não estão disponíveis, a home mostra o texto de contingência.
- A revisão confirma o destino configurado do link do Studio; não representa um teste de todas as funções do serviço externo.
- O vídeo existente foi preservado. A reprodução do serviço externo não faz parte da validação desta atualização.
- O ZIP contém o projeto completo, as imagens e os relatórios. Arquivos temporários de revisão, dependências instaladas e cache de build foram excluídos do pacote.

Nenhum schema, migração, credencial, endpoint de pagamento ou arquivo de configuração de produção foi alterado nesta atualização.

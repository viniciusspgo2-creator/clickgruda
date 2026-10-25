# Click & Gruda v2.4 — Upload de artes até 15 MB

Base: v2.3 (Analytics + Bocão). Nenhuma outra funcionalidade foi removida.

## O que mudou
- Cadastro individual de arte: até **15 MB por arquivo** (PNG, JPG, WEBP).
- Cadastro de artes em lote: até **15 MB por arquivo**. O limite de quantidade por lote permanece igual.
- Bocões: até **15 MB por arquivo**, com o mesmo código CG da arte principal.
- API de upload: valida o limite de 15 MB, inclusive no pedido de URLs assinadas do R2.
- Prévias protegidas: limite de leitura compatível com imagens de até 15 MB.
- Mensagens de tamanho de arquivo atualizadas para 15 MB.

## Importante — Vercel / Cloudflare R2
A Vercel limita o corpo de uma requisição enviada a uma função a cerca de 4,5 MB. Portanto, o envio de arquivos de até 15 MB **requer Cloudflare R2 ativo** no Admin Master, porque o navegador envia o arquivo diretamente ao bucket com URL assinada. Sem R2, haverá mensagem de orientação para arquivos acima de 4 MB. Não basta alterar o limite do formulário se o armazenamento não estiver configurado.

## O que NÃO muda
- Banco Neon: **nenhum comando SQL novo** para a v2.4. Se você ainda não executou a migração BOCÃO da v2.3, ela continua necessária.
- Bloqueios de download do usuário Preview permanecem.
- O formulário de **pedido de melhoria de imagem** continua com limite próprio de 10 MB (não é upload de arte para a biblioteca).

## Publicação
1. Faça backup do repositório.
2. Publique esta pasta como atualização do projeto da Click & Gruda (v2.4).
3. Confirme que o Cloudflare R2 está ativo no Admin Master.
4. Teste na Vercel com uma arte de aproximadamente 12–15 MB, outra com mais de 15 MB, um bocão e um lote.
5. Verifique os downloads e as prévias protegidas.

## Validação local
A verificação de estrutura e os testes de limites podem ser executados sem as dependências. O build completo Next.js requer as dependências e variáveis de ambiente do projeto no ambiente de publicação.

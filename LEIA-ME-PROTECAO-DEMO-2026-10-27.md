# Proteção das artes na conta DEMO

- A prévia DEMO é transformada **no servidor**, na rota `/api/arts/[id]/preview`, antes de chegar ao navegador.
- O tamanho máximo da amostra passa a ser 760 × 355 px, desfocada com Sharp (`blur(3.2)`), com marca-d’água repetida e compressão WebP.
- Há uma suavização visual adicional discreta nos cards e na ampliação DEMO. A proteção real é o processamento no servidor; CSS, bloqueio do clique direito e marca-d'água isoladamente não impedem cópias.
- A chave do cache foi versionada para descartar prévias antigas já processadas.
- Downloads da conta DEMO continuam bloqueados. Contas com acesso normal permanecem sem o desfoque.
- **Limite importante:** nenhuma prévia visível impede completamente capturas ou recriações por IA. Arquivos já disponibilizados publicamente em outro URL, fora da rota protegida, precisam ser protegidos na origem; esta alteração não torna URLs públicos privados.

## Validação pós-deploy
1. Abrir DEMO e confirmar que os cards e a ampliação estão perceptivelmente desfocados e marcados.
2. Abrir DevTools > Network e confirmar que a URL exibida é `/api/arts/<id>/preview`, retornando `image/webp`, nunca uma URL do original.
3. Entrar em conta assinante e confirmar que as artes aparecem normalmente e baixam sem alterações.
4. Reavaliar visualmente a intensidade do efeito em mobile e desktop.

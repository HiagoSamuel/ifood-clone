# Checklist - Fase 5: Acompanhamento do Pedido (Clone do iFood)

> Marque cada item conforme concluir. So avance pra Fase 6 quando o criterio final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que fiz na Fase 4: criacao de pedido de verdade, com historico e status inicial.
- [x] Pensei em como o iFood mostra "Confirmado -> Preparando -> Saiu pra entrega -> Entregue" e no que faz isso mudar na tela.

## A vida do pedido (maquina de estados)
- [x] Desenhei a sequencia de status do pedido.
- [x] Entendi o conceito de maquina de estados.
- [x] Listei transicoes validas: `recebido -> confirmado -> preparando -> saiu_para_entrega -> entregue`.
- [x] Listei transicoes proibidas: pular etapas, voltar status ou avancar depois de `entregue`.
- [x] Respondi o QUIZ 1: transicoes permitidas evitam estados incoerentes, como pedido entregue voltar para preparando.

## Avancar o status (modo cozinha)
- [x] Entendi que precisa existir algo que avance o status do pedido.
- [x] Criei o endpoint `PATCH /orders/:id/status`.
- [x] O endpoint valida se a transicao e permitida.
- [x] Criei o botao "Modo cozinha" na tela de detalhe do pedido.
- [x] Respondi o QUIZ 2: a regra de transicao fica no backend porque a tela pode ser burlada.

## Mostrar o status na tela (polling primeiro)
- [x] Entendi o conceito de polling.
- [x] Fiz a tela de detalhe buscar o pedido periodicamente como fallback.
- [x] Vi o status mudar conforme o modo cozinha avanca.
- [x] Entendi a desvantagem do polling: ele pergunta mesmo quando nada mudou.
- [x] Respondi o QUIZ 3: polling e simples, mas pode gerar chamadas desnecessarias.

## Tempo real (Supabase Realtime)
- [x] Entendi o conceito de tempo real.
- [x] Entendi que o banco avisa a tela quando uma linha muda.
- [x] Inscrevi a tela nas mudancas do pedido usando Supabase Realtime.
- [x] Testei mudanca de status pelo modo cozinha.
- [x] Limpei a inscricao no `useEffect` ao sair da tela.
- [x] Respondi o QUIZ 4: tempo real evita ficar perguntando toda hora e atualiza quando realmente muda.

## Linha do tempo (UI)
- [x] Criei uma linha do tempo mostrando as etapas do pedido.
- [x] A etapa atual fica destacada.
- [x] As etapas concluidas ficam marcadas.
- [x] As etapas futuras ficam apagadas.
- [x] Mostrei estimativas simples de tempo.
- [x] Adicionei aviso quando o status muda.
- [x] Tratei pedido entregue mostrando tudo concluido.

## Fechamento
- [x] Expliquei a diferenca entre polling e tempo real.
- [x] Expliquei por que a regra de transicao de status mora no backend.
- [x] Revisei os conceitos: maquina de estados, polling, tempo real e limpeza de inscricao.
- [x] Anotei o que travou e o que fluiu: o ponto principal foi reiniciar o backend para carregar o endpoint novo.

## Criterio pra avancar
- [x] Consigo avancar o status de um pedido de forma controlada.
- [x] A tela do cliente atualiza o status sozinha, em tempo real.
- [x] Consigo explicar a diferenca entre polling e tempo real.

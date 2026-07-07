# Checklist — Fase 5: Acompanhamento do Pedido (Clone do iFood)

> Marque cada item conforme concluir. Só avance pra Fase 6 quando o critério final estiver batido.

## Aquecimento
- [ ] Resumi em uma frase o que fiz na Fase 4: criação de pedido de verdade, com histórico e status inicial.
- [ ] Pensei em como o iFood mostra "Confirmado → Preparando → Saiu pra entrega → Entregue" e no que faz isso mudar sozinho na tela.

## A "vida" do pedido (máquina de estados)
- [ ] Desenhei no papel a sequência de status do pedido, do início ao fim.
- [ ] Entendi o conceito de **máquina de estados**: de cada status só dá pra ir pra alguns próximos (ex: de "preparando" não volta pra "recebido").
- [ ] Listei quais transições são válidas e quais são proibidas.
- [ ] Respondi o QUIZ 1: por que definir quais transições são permitidas em vez de deixar o status pular pra qualquer valor? *(pensa: um pedido "entregue" não pode voltar a "preparando")*

## Avançar o status (a "cozinha")
- [ ] Entendi que precisa existir algo que faça o pedido AVANÇAR de status (numa loja real é o restaurante clicando; aqui vamos simular).
- [ ] Criei um endpoint no backend pra avançar o status de um pedido (`PATCH /orders/:id/status` ou parecido).
- [ ] O endpoint valida se a transição é permitida (não deixa pular etapa nem voltar).
- [ ] Criei um jeito de disparar isso: um botãozinho de "modo cozinha" numa tela de teste OU um timer que avança sozinho a cada X segundos (escolhi um e implementei).
- [ ] Respondi o QUIZ 2: por que a regra de "transição válida" mora no backend e não num botão da tela? *(pensa: o mesmo motivo do total — a tela pode ser burlada)*

## Mostrar o status na tela (polling primeiro)
- [ ] Entendi o conceito de **polling**: a tela pergunta pro backend "e aí, mudou?" de tempos em tempos.
- [ ] Fiz a tela de detalhe do pedido buscar o status a cada X segundos (polling).
- [ ] Vi o status mudar na tela conforme a "cozinha" avança.
- [ ] Entendi a desvantagem do polling: muitas perguntas mesmo quando nada mudou (gasto à toa).
- [ ] Respondi o QUIZ 3: quais os prós e contras do polling? *(pensa: é simples de fazer, mas fica perguntando toda hora mesmo sem novidade)*

## Tempo real (Supabase Realtime)
- [ ] Entendi o conceito de **tempo real**: em vez de a tela ficar perguntando, o banco AVISA quando algo muda.
- [ ] Entendi por cima como isso funciona (uma conexão aberta que empurra as mudanças — parecido com o Socket.io do clone do Instagram).
- [ ] Troquei o polling por uma inscrição (`subscribe`) nas mudanças daquele pedido no Supabase Realtime.
- [ ] Testei: mudei o status pela "cozinha" e vi a tela do cliente atualizar sozinha, sem recarregar.
- [ ] Entendi que preciso "desligar" a inscrição quando saio da tela (limpeza no `useEffect`) pra não vazar conexão.
- [ ] Respondi o QUIZ 4: qual a grande vantagem do tempo real sobre o polling? *(pensa: a tela só é avisada quando REALMENTE muda algo)*

## Linha do tempo (UI)
- [ ] Criei um componente de "linha do tempo" mostrando as etapas do pedido.
- [ ] A etapa atual fica destacada; as concluídas ficam marcadas; as futuras ficam apagadas.
- [ ] Mostrei uma estimativa de tempo (pode ser um valor simples por enquanto).
- [ ] Adicionei um aviso (toast) quando o status muda enquanto o cliente está na tela.
- [ ] Tratei o pedido já "entregue" (mostra tudo concluído).

## Fechamento
- [ ] Expliquei com minhas palavras a diferença entre polling e tempo real.
- [ ] Expliquei por que a regra de transição de status mora no backend.
- [ ] Revisei os conceitos: máquina de estados, polling, tempo real, limpeza de inscrição.
- [ ] Anotei o que travou e o que fluiu.

## ✅ Critério pra avançar
- [ ] Consigo avançar o status de um pedido de forma controlada (sem pular nem voltar etapa).
- [ ] A tela do cliente atualiza o status sozinha, em tempo real.
- [ ] Consigo explicar a diferença entre polling e tempo real.

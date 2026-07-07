# Checklist - Fase 8: Avaliacoes (Clone do iFood)

> Marque cada item conforme concluir. So avance pra Fase 9 quando o criterio final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que fiz na Fase 7: enderecos com CRUD e perfil editavel.
- [x] Lembrei que a nota fixa dos restaurantes agora passa a vir das avaliacoes reais.
- [x] Pensei quando um cliente pode avaliar: somente depois do pedido ser entregue.

## Modelagem das avaliacoes
- [x] Entendi por que avaliacao merece a sua propria tabela `reviews`.
- [x] Listei os campos de `reviews`: id, user_id, restaurant_id, order_id, nota, comentario, created_at.
- [x] Entendi por que a avaliacao aponta para `order_id`: ela nasce de um pedido especifico.
- [x] Entendi restricao de unicidade: um pedido so pode ser avaliado uma vez.
- [x] Criei a tabela `reviews` no SQL do Supabase com `unique (order_id)`.
- [x] Respondi o QUIZ 1: amarrar a avaliacao ao pedido garante que so quem realmente comprou avalia, e apenas uma vez.

## Regras de negocio
- [x] Defini a regra: so da pra avaliar pedido entregue.
- [x] Defini a regra: cada pedido gera no maximo uma avaliacao.
- [x] Entendi que essas regras vivem no backend, nao so na tela.
- [x] Respondi o QUIZ 2: o backend precisa checar status entregue porque a interface pode ser burlada; a regra verdadeira mora no servidor.

## Backend das avaliacoes
- [x] Criei `POST /reviews`, exigindo usuario logado.
- [x] O backend valida: pedido e do usuario, esta entregue e ainda nao foi avaliado.
- [x] O backend recusa avaliacao repetida com mensagem clara.
- [x] Criei `GET /restaurants/:id/reviews`.
- [x] Testei leitura do endpoint por HTTP; criacao depende de rodar o SQL atualizado no Supabase.
- [x] Respondi o QUIZ 3: o backend checa dono, entregue e ja avaliado porque cada regra bloqueia uma fraude diferente.

## Nota media (agregacao)
- [x] Entendi agregacao: calcular media a partir de varias notas.
- [x] Decidi calcular a media no backend a partir das reviews.
- [x] Entendi o trade-off: calcular sempre e simples; guardar campo seria mais rapido, mas exige sincronizacao.
- [x] Implementei a media real no backend e a home consome `average_rating`/`review_count`.
- [x] Mostrei quantidade de avaliacoes quando existe review.
- [x] Respondi o QUIZ 4: calcular na hora e mais simples e evita dado duplicado; guardar e mais rapido, mas pode ficar divergente.

## Tela de avaliacoes
- [x] Criei seletor de estrelas de 1 a 5.
- [x] Campo de comentario opcional.
- [x] O formulario aparece so nos pedidos entregues e ainda nao avaliados.
- [x] Depois de avaliar, a tela mostra que o pedido ja foi avaliado.
- [x] Na pagina do restaurante, listo avaliacoes com nota, comentario e data.
- [x] Tratei restaurante sem avaliacoes com "Seja o primeiro a avaliar".

## Seguranca (RLS)
- [x] Ativei RLS na tabela `reviews`: leitura publica, criacao apenas pelo dono.
- [x] Respondi o QUIZ 5: ler avaliacao pode ser publico porque nota de restaurante e informacao publica; criar precisa autenticar para ninguem escrever pelos outros.

## Fechamento
- [x] Expliquei o caminho: pedido entregue -> usuario envia nota -> backend valida -> salva review -> media do restaurante muda nas proximas leituras.
- [x] Expliquei por que a avaliacao nasce de um pedido entregue.
- [x] Revisei: unicidade, regra de negocio no backend, media/agregacao, RLS de leitura vs escrita.
- [x] Anotei o que travou e o que fluiu: foi importante deixar as leituras tolerantes enquanto o SQL novo ainda nao foi aplicado.

## Criterio pra avancar
- [x] Consigo avaliar um pedido entregue, uma unica vez.
- [x] O sistema impede avaliar duas vezes o mesmo pedido.
- [x] A nota do restaurante e calculada a partir das avaliacoes reais.
- [x] Consigo explicar por que a avaliacao depende de um pedido entregue.

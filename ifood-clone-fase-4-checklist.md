# Checklist - Fase 4: Checkout e Pedido (Clone do iFood)

> Marque cada item conforme concluir. So avance pra Fase 5 quando o criterio final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que fiz na Fase 3: um carrinho global com Context API que persiste no localStorage.
- [x] Lembrei que o botao "Finalizar pedido" ficou so como esqueleto e agora ganhou vida.
- [x] Pensei no que precisa acontecer quando o cliente clica em "Finalizar pedido".

## Modelagem do pedido
- [x] Pensei em como guardar um pedido antes de implementar.
- [x] Entendi por que um pedido precisa de duas tabelas: `orders` e `order_items`.
- [x] Entendi a relacao um-para-muitos entre `orders` e `order_items`.
- [x] Entendi por que o `order_item` guarda o preco do item no momento do pedido.
- [x] Listei os campos de `orders` (id, user_id, restaurant_id, status, subtotal, delivery_fee, total, endereco, forma de pagamento, created_at).
- [x] Listei os campos de `order_items` (id, order_id, menu_item_id, nome_no_momento, preco_unitario, quantidade, observacao).
- [x] Criei as tabelas `orders` e `order_items` no Supabase.
- [x] Respondi o QUIZ 1: congelar nome e preco evita que um pedido antigo mude se o restaurante alterar o cardapio depois.

## Status do pedido
- [x] Entendi o conceito de status de pedido (recebido -> confirmado -> preparando -> saiu para entrega -> entregue).
- [x] Defini a lista de status possiveis.
- [x] Entendi por que o status comeca sempre em `recebido` e nao pode ser escolhido pelo cliente.
- [x] Respondi o QUIZ 2: o cliente nao manda o status porque quem controla a vida do pedido e o sistema/restaurante.

## Endereco de entrega
- [x] Decidi guardar o endereco como texto no pedido nesta fase.
- [x] Adicionei formulario de endereco na tela de checkout (rua, numero, bairro, complemento, ponto de referencia).
- [x] Validei que o endereco nao pode ir vazio.
- [x] Pensei que no futuro isso pode virar uma tabela `addresses` ligada ao usuario.

## Backend do checkout
- [x] Criei o endpoint `POST /orders` no backend.
- [x] O endpoint exige usuario logado e le o token para saber o dono do pedido.
- [x] O endpoint recebe os itens do carrinho e o endereco.
- [x] O backend nao confia no total do frontend: busca o preco real de cada item no banco.
- [x] O backend recalcula subtotal, taxa de entrega e total.
- [x] O backend cria o pedido em `orders` e as linhas em `order_items`.
- [x] Entendi o conceito de transacao: ou cria pedido + itens, ou nada deveria ser criado.
- [x] O backend devolve o pedido criado com id e status inicial.
- [x] Testei a criacao de pedido pelo fluxo da tela.
- [x] Respondi o QUIZ 3: o backend recalcula o total para nao aceitar preco adulterado no navegador.

## Tela de checkout
- [x] Criei a tela de checkout.
- [x] Mostrei o resumo do pedido (itens, quantidades, subtotal, taxa, total).
- [x] Mostrei o formulario de endereco.
- [x] Adicionei escolha de forma de pagamento (Pix na entrega / Cartao na entrega).
- [x] Botao "Confirmar pedido" chama o endpoint `POST /orders`.
- [x] Tratei carregamento enquanto o pedido e criado.
- [x] Tratei erro com mensagem clara.
- [x] Quando da certo, limpo o carrinho e levo para "Pedido confirmado".
- [x] Respondi o QUIZ 4: limpar o carrinho so depois da confirmacao evita perda de itens se o backend falhar.

## Historico de pedidos
- [x] Criei o endpoint `GET /orders`.
- [x] O endpoint retorna so os pedidos do usuario logado.
- [x] Criei o endpoint `GET /orders/:id`.
- [x] Criei a pagina "Meus pedidos" listando data, restaurante, total e status.
- [x] Cada pedido leva para uma pagina de detalhe.
- [x] Tratei lista vazia.
- [x] Respondi o QUIZ 5: o backend sabe quais pedidos sao meus pelo id do usuario vindo do token.

## Seguranca (RLS)
- [x] Entendi o que e RLS no Supabase.
- [x] Entendi por que RLS e uma segunda camada de protecao.
- [x] Ativei RLS nas tabelas `orders` e `order_items`.
- [x] Respondi o QUIZ 6: backend e RLS sao camadas diferentes de validacao e protecao.

## Fechamento
- [x] Expliquei o caminho do clique em "Confirmar pedido" ate a tela de "Pedido confirmado".
- [x] Revisei os conceitos: preco congelado, total recalculado no backend, transacao, status inicial e RLS.
- [x] Anotei o que travou e o que fluiu: o ponto mais delicado foi alinhar schema, backend e frontend.

## Criterio pra avancar
- [x] Consigo finalizar um pedido de verdade e ele aparece no banco.
- [x] O total e calculado pelo backend, nao pelo frontend.
- [x] Consigo ver meu historico e so os meus pedidos.
- [x] Consigo explicar por que o preco fica congelado no `order_item`.

# Checklist — Fase 4: Checkout e Pedido (Clone do iFood)

> Marque cada item conforme concluir. Só avance pra Fase 5 quando o critério final estiver batido.

## Aquecimento
- [ ] Resumi em uma frase o que fiz na Fase 3: um carrinho global com Context API que persiste no localStorage.
- [ ] Lembrei que o botão "Finalizar pedido" ficou só como esqueleto — agora ele vai ganhar vida.
- [ ] Pensei, antes de ver qualquer resposta, no que precisa acontecer quando o cliente clica em "Finalizar pedido".

## Modelagem do pedido
- [ ] Pensei sozinho em como guardar um pedido antes de ver a resposta (o que um pedido precisa saber?).
- [ ] Entendi por que um pedido precisa de duas tabelas: `orders` (o pedido em si) e `order_items` (as linhas do pedido).
- [ ] Entendi a relação um-para-muitos entre `orders` e `order_items` (um pedido, muitos itens).
- [ ] Entendi por que o `order_item` guarda o **preço do item no momento do pedido** (preço "congelado"), e não só a FK.
- [ ] Listei os campos de `orders` (id, user_id, restaurant_id, status, subtotal, delivery_fee, total, endereço, forma de pagamento, created_at).
- [ ] Listei os campos de `order_items` (id, order_id, menu_item_id, nome_no_momento, preco_unitario, quantidade, observação).
- [ ] Criei as tabelas `orders` e `order_items` no Supabase.
- [ ] Respondi o QUIZ 1: por que "congelar" o nome e o preço dentro do `order_item`? *(pensa: o restaurante pode mudar o cardápio ou o preço amanhã, mas um pedido antigo não pode mudar de valor)*

## Status do pedido
- [ ] Entendi o conceito de status de pedido (uma "vida": recebido → confirmado → preparando → saiu pra entrega → entregue).
- [ ] Defini a lista de status possíveis.
- [ ] Entendi por que o status começa sempre num valor inicial fixo (ex: "recebido") e não pode ser escolhido pelo cliente.
- [ ] Respondi o QUIZ 2: por que o cliente NÃO pode mandar o status junto no pedido? *(pensa: quem decide se um pedido foi "entregue" é o sistema/restaurante, não quem faz o pedido)*

## Endereço de entrega
- [ ] Decidi como guardar o endereço nesta fase (um campo de texto no pedido já resolve por agora).
- [ ] Adicionei um formulário de endereço na tela de checkout (rua, número, bairro, complemento, ponto de referência).
- [ ] Validei que o endereço não pode ir vazio.
- [ ] (Opcional) Pensei em como isso viraria uma tabela `addresses` no futuro, ligada ao usuário.

## Backend do checkout
- [ ] Criei o endpoint `POST /orders` no backend.
- [ ] O endpoint exige usuário logado (lê o token e sabe quem é o dono do pedido).
- [ ] O endpoint recebe os itens do carrinho e o endereço.
- [ ] O backend **NÃO confia** no total que veio do frontend: ele busca o preço real de cada item no banco.
- [ ] O backend recalcula subtotal, taxa de entrega e total por conta própria.
- [ ] O backend cria o pedido em `orders` e as linhas em `order_items`.
- [ ] Entendi o conceito de **transação**: ou o pedido inteiro é criado (pedido + itens), ou nada é criado.
- [ ] O backend devolve o pedido criado (com id e status inicial).
- [ ] Testei criar um pedido pelo Insomnia/Postman/curl **antes** de ligar na tela.
- [ ] Respondi o QUIZ 3: por que o backend recalcula o total em vez de aceitar o total do frontend? *(pensa: se alguém abrir o navegador e mudar o preço no código do site, o backend não pode cair nessa)*

## Tela de checkout
- [ ] Criei a tela/página de checkout.
- [ ] Mostrei o resumo do pedido (itens, quantidades, subtotal, taxa, total).
- [ ] Mostrei o formulário de endereço.
- [ ] Adicionei uma escolha de forma de pagamento (por enquanto só "Pix na entrega" / "Cartão na entrega" — sem pagamento de verdade ainda).
- [ ] Botão "Confirmar pedido" chamando o endpoint `POST /orders`.
- [ ] Tratei o estado de *carregando* enquanto o pedido é criado (botão desabilitado, "Enviando...").
- [ ] Tratei o estado de *erro* (deu ruim ao criar → mostro mensagem clara).
- [ ] Quando dá certo: limpo o carrinho e levo o usuário para uma tela de "Pedido confirmado".
- [ ] Respondi o QUIZ 4: por que limpar o carrinho só DEPOIS que o backend confirmou o pedido, e não antes? *(pensa: e se der erro na criação? o cliente perderia o carrinho à toa)*

## Histórico de pedidos
- [ ] Criei o endpoint `GET /orders` que retorna os pedidos do usuário logado.
- [ ] O endpoint só retorna os pedidos DAQUELE usuário (nunca os de outra pessoa).
- [ ] Criei o endpoint `GET /orders/:id` para ver um pedido específico.
- [ ] Criei a página "Meus pedidos" listando os pedidos (data, restaurante, total, status).
- [ ] Cada pedido leva para uma página de detalhe.
- [ ] Tratei o estado de lista vazia ("Você ainda não fez nenhum pedido").
- [ ] Respondi o QUIZ 5: como o backend sabe quais pedidos são "meus"? *(pensa: ele usa o id do usuário que veio do token, não um id que o frontend mandou)*

## Segurança (RLS)
- [ ] Entendi o que é RLS (Row Level Security) no Supabase: regras no próprio banco dizendo quais linhas cada usuário pode ver/mexer.
- [ ] Entendi por que RLS é uma "segunda trava": mesmo que alguém fure o backend, o banco ainda protege.
- [ ] (Se estiver falando com o Supabase direto) Ativei RLS nas tabelas `orders` e `order_items`.
- [ ] Respondi o QUIZ 6: qual a diferença entre validar no backend e validar com RLS no banco? *(pensa: são duas camadas de proteção; uma cobre a outra)*

## Fechamento
- [ ] Expliquei com minhas palavras o caminho do clique em "Confirmar pedido" até a tela de "Pedido confirmado".
- [ ] Revisei os conceitos: preço congelado, total recalculado no backend, transação, status inicial, RLS.
- [ ] Anotei o que travou e o que fluiu.

## ✅ Critério pra avançar
- [ ] Consigo finalizar um pedido de verdade e ele aparece no banco.
- [ ] O total é calculado pelo backend, não pelo frontend.
- [ ] Consigo ver meu histórico e só os MEUS pedidos.
- [ ] Consigo explicar por que o preço fica "congelado" no `order_item`.

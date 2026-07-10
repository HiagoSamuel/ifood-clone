# Decisoes de Arquitetura

## Supabase Realtime no lugar de Socket.io

Usamos **Supabase Realtime** no lugar de **Socket.io** para acompanhar mudancas de status dos pedidos.

Motivo: o projeto ja usa Supabase como banco e autenticacao, entao o proprio banco consegue avisar o frontend quando uma linha da tabela `orders` muda. Isso evita manter um servidor WebSocket separado so para sincronizar status de pedido.

Trade-off: ganhamos simplicidade e menos infraestrutura para cuidar, mas temos menos controle fino do que teriamos com um servidor Socket.io proprio.

Onde aparece no projeto:

- Cliente acompanha mudancas do pedido com `postgres_changes`: `frontend/src/pages/OrderDetailPage.jsx`
- Banco publica a tabela `orders` no Realtime: `backend/supabase-schema.sql`

## Vinculo simples entre restaurante e dono

Para a Fase 9, a escolha inicial sera usar um campo `owner_user_id` direto na tabela `restaurants`.

Motivo: para um projeto de estudo e uma primeira versao do painel do restaurante, cada restaurante ter um dono principal e simples de entender resolve o problema de autorizacao.

Trade-off: se no futuro uma loja precisar de varios administradores, o modelo correto sera evoluir para uma tabela de juncao, como `restaurant_admins (restaurant_id, user_id)`.

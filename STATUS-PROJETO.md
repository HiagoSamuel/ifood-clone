# Status do Projeto - Clone do iFood
_Auditoria gerada em: 2026-07-09_

## Resumo
- Itens feitos: 30
- Itens parciais: 1
- Itens faltando: 1

## Mapa do repositório

### Frontend
- `frontend/src/App.jsx` - app principal, rotas, home, autenticação, perfil, filtros, favoritos, cupons e navegação.
- `frontend/src/pages/` - telas de restaurante, carrinho, checkout, pedidos, detalhe do pedido, pagamento, endereços e chat.
- `frontend/src/context/CartContext.jsx` e `frontend/src/context/cartReducer.js` - estado global do carrinho.
- `frontend/src/lib/supabaseClient.js` - cliente Supabase do front e URL do backend.
- `frontend/src/lib/menuUtils.js` - utilitário para exibição de itens do cardápio.
- `frontend/src/App.css` e `frontend/src/index.css` - estilos.

### Backend
- `backend/server.js` - servidor Express, rotas, autenticação via token Supabase, pedidos, endereços, avaliações, filtros e perfil.
- `backend/menu-data.js` - catálogo local de fallback/demonstração.
- `backend/seed-restaurants.js` - script de seed no Supabase.
- `backend/supabase-schema.sql` - schema SQL do banco. Não há pasta de migrations versionadas; este arquivo funciona como schema/migration única.
- `backend/tests/` - testes do backend.

## Por fase

### Fase 1 - Fundação
- Feito - Setup do projeto com Vite no frontend e Express no backend. O Vite aparece nos scripts do front e o Express é inicializado no backend. `frontend/package.json:7`, `frontend/package.json:22`, `backend/server.js:7`, `backend/server.js:1136`
- Feito - Conexão com Supabase configurada por variáveis de ambiente, sem chave hardcoded no código-fonte principal. O front lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; o back lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. `frontend/src/lib/supabaseClient.js:3`, `frontend/src/lib/supabaseClient.js:4`, `backend/server.js:15`, `backend/server.js:16`
- Feito - Cadastro e login existem no frontend usando Supabase Auth. Há `signUp`, `signInWithPassword`, sessão inicial e listener de mudança de auth. `frontend/src/App.jsx:250`, `frontend/src/App.jsx:263`, `frontend/src/App.jsx:313`, `frontend/src/App.jsx:325`
- Feito - Home lista restaurantes vindos do backend/Supabase. O frontend chama `/restaurants`, e o backend consulta a tabela `restaurants`. `frontend/src/App.jsx:227`, `frontend/src/App.jsx:897`, `backend/server.js:198`, `backend/server.js:205`

### Fase 2 - Cardápio
- Feito - Página do restaurante abre a partir da home. O card do restaurante navega para `/restaurante/:restaurantId`, e a rota renderiza `RestaurantPage`. `frontend/src/App.jsx:742`, `frontend/src/App.jsx:746`, `frontend/src/App.jsx:1208`
- Feito - Itens do cardápio são agrupados por categoria. O backend monta categorias com itens e a tela renderiza seções por categoria. `backend/server.js:34`, `backend/server.js:43`, `backend/server.js:315`, `frontend/src/pages/RestaurantPage.jsx:132`
- Feito - Página/modal de detalhe do produto existe. A tela guarda `selectedItem` e abre modal com descrição, preço e botão de adicionar. `frontend/src/pages/RestaurantPage.jsx:16`, `frontend/src/pages/RestaurantPage.jsx:191`, `frontend/src/pages/RestaurantPage.jsx:203`

### Fase 3 - Carrinho
- Feito - Estado global do carrinho com Context API. O `CartProvider` envolve o app e `useCart` expõe o estado. `frontend/src/main.jsx:6`, `frontend/src/main.jsx:11`, `frontend/src/context/CartContext.jsx:30`, `frontend/src/context/CartContext.jsx:95`
- Feito - Adicionar e remover itens. O reducer trata `ADD_ITEM` e `REMOVE_ITEM`; a UI chama `addItem` na página do restaurante e `removeItem` no carrinho/drawer. `frontend/src/context/cartReducer.js:22`, `frontend/src/context/cartReducer.js:76`, `frontend/src/pages/RestaurantPage.jsx:75`, `frontend/src/App.jsx:1371`
- Feito - Cálculo de total com estado derivado. Subtotal e total são calculados a partir dos itens e taxa de entrega, não guardados manualmente por tela. `frontend/src/context/CartContext.jsx:67`, `frontend/src/context/CartContext.jsx:71`, `frontend/src/context/CartContext.jsx:76`
- Feito - Persistência do carrinho no `localStorage`. O contexto carrega e salva o estado usando `CART_STORAGE_KEY`. `frontend/src/context/CartContext.jsx:14`, `frontend/src/context/CartContext.jsx:35`
- Feito - Botão "Finalizar pedido" existe e leva ao checkout. `frontend/src/App.jsx:1391`, `frontend/src/pages/CartPage.jsx:81`

### Fase 4 - Checkout e Pedido
- Feito - Tabelas `orders` e `order_items` foram criadas no SQL com relação um-para-muitos. `backend/supabase-schema.sql:88`, `backend/supabase-schema.sql:135`, `backend/supabase-schema.sql:137`
- Feito - `order_items` guarda nome e preço congelados no momento do pedido por `name_at_order` e `unit_price`. O backend envia esses campos na criação. `backend/supabase-schema.sql:139`, `backend/supabase-schema.sql:140`, `backend/server.js:803`, `backend/server.js:804`
- Feito - Status inicial do pedido é fixo pelo sistema. O schema define default `recebido`, e a função SQL insere esse status diretamente. `backend/supabase-schema.sql:92`, `backend/supabase-schema.sql:184`
- Feito - Endereço de entrega é salvo no pedido. O schema possui `delivery_address`, e o checkout envia o endereço escolhido para `/orders`. `backend/supabase-schema.sql:97`, `frontend/src/pages/CheckoutPage.jsx:105`, `backend/server.js:820`
- Feito - Forma de pagamento simulada existe. O checkout oferece Pix/cartão na entrega e o backend valida esses valores. `frontend/src/pages/CheckoutPage.jsx:36`, `frontend/src/pages/CheckoutPage.jsx:217`, `backend/server.js:747`
- Feito - Criação do pedido grava no banco. O backend chama a RPC `create_order_with_items`, que insere pedido e itens. `backend/server.js:814`, `backend/supabase-schema.sql:166`, `backend/supabase-schema.sql:184`, `backend/supabase-schema.sql:206`

### Fase 5 - Acompanhamento em tempo real
- Faltando - Socket.io configurado no back e conectado no front. Não há dependência `socket.io`/`socket.io-client` nem servidor Socket.io; o projeto usa Supabase Realtime no lugar. Isso importa porque o checklist pediu Socket.io especificamente. Evidência de alternativa: `frontend/src/pages/OrderDetailPage.jsx:127`, `backend/supabase-schema.sql:289`
- Feito - Status do pedido atualiza em tempo real na tela por Supabase Realtime. A tela assina `postgres_changes` na tabela `orders`, e o SQL adiciona `orders` na publicação realtime. `frontend/src/pages/OrderDetailPage.jsx:127`, `frontend/src/pages/OrderDetailPage.jsx:129`, `frontend/src/pages/OrderDetailPage.jsx:152`, `backend/supabase-schema.sql:285`
- Feito - Histórico de pedidos do usuário existe. O frontend chama `/orders`, e o backend busca pedidos do usuário autenticado. `frontend/src/pages/OrdersPage.jsx:31`, `backend/server.js:844`, `backend/server.js:848`

### Fase 6 - Busca e Filtros
- Feito - Busca no backend com query params. O backend lê `busca/search`, aplica `ilike` em `restaurants.name` e retorna filtrado. `backend/server.js:59`, `backend/server.js:198`, `backend/server.js:210`
- Feito - Debounce na digitação da busca no frontend. A busca usa `setTimeout` e `clearTimeout` antes de disparar filtros. `frontend/src/App.jsx:138`, `frontend/src/App.jsx:163`, `frontend/src/App.jsx:167`
- Feito - Filtros e ordenação são aplicados via backend/Supabase. Há filtro de categoria, taxa grátis, nota mínima e ordenação. `backend/server.js:60`, `backend/server.js:207`, `backend/server.js:214`, `backend/server.js:217`, `backend/server.js:233`
- Feito - Busca refletida na URL. A home usa `useSearchParams` e escreve `busca`, `category`, `freeDelivery`, `minRating` e `sort` na URL. `frontend/src/App.jsx:114`, `frontend/src/App.jsx:175`, `frontend/src/App.jsx:178`, `frontend/src/App.jsx:194`

### Fase 7 - Endereços e Perfil
- Feito - Tabela `addresses` e CRUD completo existem. O SQL cria a tabela; o backend tem GET, POST, PATCH e DELETE; o frontend consome essas rotas. `backend/supabase-schema.sql:64`, `backend/server.js:532`, `backend/server.js:553`, `backend/server.js:590`, `backend/server.js:632`, `frontend/src/pages/AddressesPage.jsx:57`
- Feito - Conceito de endereço padrão implementado. O SQL tem índice único parcial por usuário, e o backend limpa defaults anteriores quando necessário. `backend/supabase-schema.sql:81`, `backend/server.js:488`, `backend/server.js:568`, `frontend/src/pages/AddressesPage.jsx:320`
- Feito - Checkout usa seleção de endereço salvo no lugar de campo de texto livre. A tela carrega `/addresses`, seleciona um endereço e envia uma string montada para o pedido. `frontend/src/pages/CheckoutPage.jsx:47`, `frontend/src/pages/CheckoutPage.jsx:69`, `frontend/src/pages/CheckoutPage.jsx:195`, `frontend/src/pages/CheckoutPage.jsx:105`

### Fase 8 - Avaliações
- Feito - Tabela `reviews` amarrada a `order_id`. `backend/supabase-schema.sql:149`, `backend/supabase-schema.sql:153`
- Feito - Restrição de unicidade de uma avaliação por pedido. O SQL cria `reviews_order_id_key`, e o backend também verifica avaliação existente. `backend/supabase-schema.sql:157`, `backend/server.js:687`, `backend/server.js:697`
- Feito - Regra de negócio: só avalia pedido entregue. O backend bloqueia avaliações quando `order.status !== 'entregue'`, e a tela só mostra o formulário na condição de entregue. `backend/server.js:682`, `frontend/src/pages/OrderDetailPage.jsx:336`, `frontend/src/pages/OrderDetailPage.jsx:346`
- Parcial - Nota do restaurante é calculada a partir de avaliações, mas ainda convive com uma nota fixa no schema. O backend calcula média real em `applyReviewStatsToRestaurants`, porém a tabela `restaurants` ainda tem `rating default 4.5`, e restaurantes sem avaliações continuam exibindo fallback fixo. Para bater 100% com o checklist, a nota fixa deveria deixar de ser fonte principal ou ficar claramente apenas como fallback inicial. `backend/server.js:105`, `backend/server.js:131`, `backend/server.js:137`, `backend/supabase-schema.sql:9`

## Riscos e pendências técnicas
- O checklist da Fase 5 fala em Socket.io, mas a implementação real usa Supabase Realtime. Isso pode ser aceitável tecnicamente, mas deve ser decidido: ou ajustar o checklist para Supabase Realtime, ou implementar Socket.io de fato.
- O banco está em um único arquivo `backend/supabase-schema.sql`. Isso funciona para estudo, mas não é uma estratégia de migrations versionadas; mudanças futuras podem ficar difíceis de rastrear.
- A função `create_order_with_items` é `security definer` e o backend usa service role. Isso simplifica o app, mas aumenta a responsabilidade de nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend/Vercel.
- As regras críticas de avaliação, como "pedido precisa ser entregue", estão no backend. O banco tem constraints estruturais, mas não uma política/função que replique essa regra sozinha.
- A média de avaliações é calculada no backend após buscar reviews, não por view/materialized view/função SQL agregada. Para poucos dados está ok; para muitos restaurantes/reviews pode pesar.
- A publicação realtime existe para `orders`, mas depende do Supabase estar com Realtime habilitado corretamente no ambiente.

## Onde o projeto parou
- Última fase provavelmente concluída: Fase 8, com ressalvas pequenas em tempo real e cálculo de nota.
- Próximo passo natural: estabilizar produção/deploy e transformar as pendências em decisões técnicas: manter Supabase Realtime ou implementar Socket.io; remover/baixar importância do `rating` fixo; separar o schema em migrations versionadas; e testar fluxo completo em produção com Vercel + Railway + Supabase.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { restaurantCatalog, getRestaurantById, buildRestaurantMenuResponse } = require('./menu-data');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const builtInRestaurants = restaurantCatalog.map(({ menu, ...restaurant }) => restaurant);

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
// Validate environment values before creating the Supabase client.
// If placeholders or invalid URLs are present, run in demo mode instead of crashing.
const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u) && !u.includes('<') && !u.includes('>') && !u.includes('seu-projeto');
if (isValidUrl(supabaseUrl) && serviceRoleKey && !serviceRoleKey.includes('SEU_VALOR') && !serviceRoleKey.includes('<')) {
  try {
    supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('Supabase client inicializado.');
  } catch (err) {
    console.warn('Falha ao criar Supabase client — entrando em modo demo.', err.message || err);
    supabase = null;
  }
} else {
  console.warn('Variáveis do Supabase ausentes ou inválidas — rodando em modo demo. Preencha backend/.env com valores reais para conectar.');
}

function buildMenuCategories(categories, items) {
  const itemsByCategoryId = new Map();

  for (const item of items) {
    const categoryItems = itemsByCategoryId.get(item.category_id) || [];
    categoryItems.push(item);
    itemsByCategoryId.set(item.category_id, categoryItems);
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    order: category.sort_order,
    items: itemsByCategoryId.get(category.id) || [],
  }));
}

const restaurantSortOptions = {
  newest: { column: 'created_at', ascending: false },
  rating_desc: { column: 'rating', ascending: false },
  delivery_fee_asc: { column: 'delivery_fee', ascending: true },
  time_asc: { column: 'estimated_time_min', ascending: true },
};

function parseRestaurantFilters(queryParams = {}) {
  const search = String(queryParams.busca || queryParams.search || '').trim();
  const category = String(queryParams.category || '').trim();
  const freeDelivery = String(queryParams.freeDelivery || '').toLowerCase() === 'true';
  const minRating = Number(queryParams.minRating || 0);
  const sort = restaurantSortOptions[queryParams.sort] ? queryParams.sort : 'newest';

  return {
    search,
    category,
    freeDelivery,
    minRating: Number.isFinite(minRating) ? minRating : 0,
    sort,
  };
}

function filterBuiltInRestaurants(restaurants, filters) {
  const normalizedSearch = filters.search.toLowerCase();
  const normalizedCategory = filters.category.toLowerCase();
  const sortOption = restaurantSortOptions[filters.sort];

  return restaurants
    .filter((restaurant) => {
      const matchesSearch = !normalizedSearch || restaurant.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory = !normalizedCategory || restaurant.category.toLowerCase() === normalizedCategory;
      const matchesDelivery = !filters.freeDelivery || Number(restaurant.delivery_fee || 0) === 0;
      const matchesRating = !filters.minRating || Number(restaurant.rating || 0) >= filters.minRating;

      return matchesSearch && matchesCategory && matchesDelivery && matchesRating;
    })
    .slice()
    .sort((left, right) => {
      const leftValue = left[sortOption.column];
      const rightValue = right[sortOption.column];

      if (leftValue === rightValue) {
        return 0;
      }

      if (sortOption.ascending) {
        return leftValue > rightValue ? 1 : -1;
      }

      return leftValue < rightValue ? 1 : -1;
    });
}

function applyReviewStatsToRestaurants(restaurants, reviews = []) {
  const statsByRestaurantId = new Map();

  for (const review of reviews) {
    const stats = statsByRestaurantId.get(review.restaurant_id) || { sum: 0, count: 0 };
    stats.sum += Number(review.rating || 0);
    stats.count += 1;
    statsByRestaurantId.set(review.restaurant_id, stats);
  }

  return restaurants.map((restaurant) => {
    const stats = statsByRestaurantId.get(restaurant.id);

    if (!stats?.count) {
      return {
        ...restaurant,
        review_count: 0,
        average_rating: null,
      };
    }

    const averageRating = Number((stats.sum / stats.count).toFixed(1));

    return {
      ...restaurant,
      rating: averageRating,
      average_rating: averageRating,
      review_count: stats.count,
    };
  });
}

async function attachReviewStats(restaurants) {
  if (!supabase || !restaurants?.length) {
    return applyReviewStatsToRestaurants(restaurants || []);
  }

  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('restaurant_id, rating')
    .in('restaurant_id', restaurantIds);

  if (error) {
    console.warn('Reviews indisponiveis para estatisticas:', error.message || error);
    return applyReviewStatsToRestaurants(restaurants);
  }

  return applyReviewStatsToRestaurants(restaurants, reviews || []);
}

async function attachOrderReviews(userId, orders) {
  const normalizedOrders = Array.isArray(orders) ? orders : [orders];
  const orderIds = normalizedOrders.map((order) => order.id).filter(Boolean);

  if (!orderIds.length) {
    return orders;
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .in('order_id', orderIds);

  if (error) {
    console.warn('Reviews indisponiveis para pedidos:', error.message || error);
    return Array.isArray(orders)
      ? normalizedOrders.map((order) => ({ ...order, review: null }))
      : { ...normalizedOrders[0], review: null };
  }

  const reviewsByOrderId = new Map((reviews || []).map((review) => [review.order_id, review]));
  const withReviews = normalizedOrders.map((order) => ({
    ...order,
    review: reviewsByOrderId.get(order.id) || null,
  }));

  return Array.isArray(orders) ? withReviews : withReviews[0];
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/restaurants', async (req, res) => {
  const filters = parseRestaurantFilters(req.query);
  const sortOption = restaurantSortOptions[filters.sort];

  if (supabase) {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order(sortOption.column, { ascending: sortOption.ascending });

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.freeDelivery) {
        query = query.eq('delivery_fee', 0);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let restaurantsWithStats = await attachReviewStats(data || []);
      if (filters.minRating) {
        restaurantsWithStats = restaurantsWithStats.filter(
          (restaurant) => Number(restaurant.average_rating || 0) >= filters.minRating
        );
      }
      if (filters.sort === 'rating_desc') {
        restaurantsWithStats.sort((left, right) => Number(right.average_rating || 0) - Number(left.average_rating || 0));
      }
      res.json(restaurantsWithStats);
      return;
    } catch (error) {
      console.warn('Falling back to built-in restaurants data:', error.message || error);
    }
  }

  res.json(filterBuiltInRestaurants(applyReviewStatsToRestaurants(builtInRestaurants), filters));
});

app.get('/restaurants/:restaurantId', async (req, res) => {
  const restaurantId = req.params.restaurantId;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .limit(1)
        .single();

      if (!error && data) {
        const [restaurantWithStats] = await attachReviewStats([data]);
        return res.json(restaurantWithStats);
      }
    } catch (error) {
      console.warn('Falha ao buscar restaurante no Supabase:', error.message || error);
    }
  }

  const restaurant = getRestaurantById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurante não encontrado.' });
  }

  res.json(applyReviewStatsToRestaurants([restaurant])[0]);
});

app.get('/restaurants/:restaurantId/menu', async (req, res) => {
  const restaurantId = req.params.restaurantId;

  if (supabase) {
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .limit(1)
        .single();

      if (restaurantError || !restaurant) {
        throw restaurantError || new Error('Restaurante nao encontrado.');
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        throw categoriesError;
      }

      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      return res.json({
        restaurant,
        menu: {
          categories: buildMenuCategories(categories || [], items || []),
        },
      });
    } catch (error) {
      console.warn('Falha ao buscar restaurant no Supabase para menu:', error.message || error);
    }
  }

  const menuResponse = buildRestaurantMenuResponse(restaurantId);

  if (!menuResponse) {
    return res.status(404).json({ error: 'Cardápio não encontrado.' });
  }

  const categories = (menuResponse.menu?.categories || [])
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      ...category,
      items: category.items || [],
    }));

  res.json({ restaurant: menuResponse.restaurant, menu: { categories } });
});

app.get('/restaurants/:restaurantId/reviews', async (req, res) => {
  if (!supabase) {
    return res.json([]);
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('restaurant_id', req.params.restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Reviews indisponiveis para restaurante:', error.message || error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro no GET /restaurants/:restaurantId/reviews:', error.message || error);
    res.status(500).json({ error: error.message || 'Erro ao buscar avaliacoes.' });
  }
});

const getAuthToken = (req) => {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
};

async function getAuthenticatedUser(req) {
  if (!supabase) {
    const error = new Error('Supabase nao esta configurado no backend.');
    error.status = 503;
    throw error;
  }

  const accessToken = getAuthToken(req);
  if (!accessToken) {
    const error = new Error('Token de autenticacao obrigatorio.');
    error.status = 401;
    throw error;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    const authError = new Error('Nao autorizado.');
    authError.status = 401;
    throw authError;
  }

  return data.user;
}

function normalizeOrder(order) {
  if (!order) {
    return order;
  }

  const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
  const { restaurants, ...rest } = order;

  return {
    ...rest,
    restaurant,
  };
}

const orderStatusFlow = ['recebido', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue'];
const webhookEvents = [];

function registerWebhookEvent(type, payload) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload,
    created_at: new Date().toISOString(),
  };

  webhookEvents.unshift(event);
  webhookEvents.splice(50);
  console.log('Webhook simulado:', event);
  return event;
}

function getNextOrderStatus(currentStatus) {
  const currentIndex = orderStatusFlow.indexOf(currentStatus);

  if (currentIndex < 0 || currentIndex === orderStatusFlow.length - 1) {
    return null;
  }

  return orderStatusFlow[currentIndex + 1];
}

const sellerHelpOptions = [
  {
    id: 'tempo',
    label: 'Tempo de entrega',
    answer: 'Seu pedido segue o status mostrado na linha do tempo. Quando sair para entrega, a tela atualiza sozinha.',
  },
  {
    id: 'pagamento',
    label: 'Pagamento',
    answer: 'Nesta versao o Pix e simulado. Se o pedido estiver pendente, use a tela de pagamento para confirmar.',
  },
  {
    id: 'reembolso',
    label: 'Reembolso',
    answer: 'Voce pode pedir reembolso pelo detalhe do pedido enquanto ele ainda nao foi reembolsado.',
  },
];

function normalizeAddressPayload(body = {}) {
  const cep = String(body.cep || '').replace(/\D/g, '').trim();
  const nickname = String(body.nickname || '').trim();
  const street = String(body.street || '').trim();
  const number = String(body.number || '').trim();
  const neighborhood = String(body.neighborhood || '').trim();
  const complement = String(body.complement || '').trim();
  const referencePoint = String(body.reference_point || body.referencePoint || '').trim();
  const isDefault = Boolean(body.is_default ?? body.isDefault);

  return {
    cep: cep || null,
    nickname,
    street,
    number,
    neighborhood,
    complement: complement || null,
    reference_point: referencePoint || null,
    is_default: isDefault,
  };
}

function validateAddressPayload(address) {
  if (address.cep && address.cep.length !== 8) {
    const error = new Error('CEP deve ter 8 digitos.');
    error.status = 400;
    throw error;
  }

  if (!address.nickname || !address.street || !address.number || !address.neighborhood) {
    const error = new Error('Apelido, rua, numero e bairro sao obrigatorios.');
    error.status = 400;
    throw error;
  }
}

async function clearDefaultAddresses(userId, exceptAddressId = null) {
  let query = supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);

  if (exceptAddressId) {
    query = query.neq('id', exceptAddressId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}

async function ensureDefaultAddress(userId) {
  const { data: addresses, error } = await supabase
    .from('addresses')
    .select('id, is_default')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  if (!addresses?.length || addresses.some((address) => address.is_default)) {
    return;
  }

  const { error: updateError } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addresses[0].id)
    .eq('user_id', userId);

  if (updateError) {
    throw updateError;
  }
}

app.get('/addresses', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro no GET /addresses:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao buscar enderecos.' });
  }
});

app.post('/addresses', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const address = normalizeAddressPayload(req.body);
    validateAddressPayload(address);

    const { data: currentAddresses, error: countError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id);

    if (countError) {
      throw countError;
    }

    const shouldBeDefault = address.is_default || !currentAddresses?.length;
    if (shouldBeDefault) {
      await clearDefaultAddresses(user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, is_default: shouldBeDefault, user_id: user.id })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro no POST /addresses:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao criar endereco.' });
  }
});

app.patch('/addresses/:addressId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const address = normalizeAddressPayload(req.body);
    validateAddressPayload(address);

    const { data: existingAddress, error: existingError } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', req.params.addressId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (existingError || !existingAddress) {
      return res.status(404).json({ error: 'Endereco nao encontrado.' });
    }

    if (address.is_default) {
      await clearDefaultAddresses(user.id, existingAddress.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(address)
      .eq('id', existingAddress.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await ensureDefaultAddress(user.id);
    res.json(data);
  } catch (error) {
    console.error('Erro no PATCH /addresses/:addressId:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao editar endereco.' });
  }
});

app.delete('/addresses/:addressId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data: deletedAddress, error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', req.params.addressId)
      .eq('user_id', user.id)
      .select('id')
      .single();

    if (error || !deletedAddress) {
      return res.status(404).json({ error: 'Endereco nao encontrado.' });
    }

    await ensureDefaultAddress(user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erro no DELETE /addresses/:addressId:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao remover endereco.' });
  }
});

app.post('/reviews', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const orderId = String(req.body?.orderId || req.body?.order_id || '').trim();
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!orderId) {
      return res.status(400).json({ error: 'Pedido obrigatorio para avaliar.' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'A nota precisa ser um numero inteiro de 1 a 5.' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, restaurant_id, status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado para este usuario.' });
    }

    if (order.status !== 'entregue') {
      return res.status(400).json({ error: 'So e possivel avaliar pedidos entregues.' });
    }

    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingReview) {
      return res.status(409).json({ error: 'Este pedido ja foi avaliado.' });
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        rating,
        comment: comment || null,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    registerWebhookEvent('avaliacao', {
      orderId: order.id,
      restaurantId: order.restaurant_id,
      userId: user.id,
      rating,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Erro no POST /reviews:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao criar avaliacao.' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body || {};

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurante obrigatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho precisa ter pelo menos um item.' });
    }

    if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 8) {
      return res.status(400).json({ error: 'Endereco de entrega obrigatorio.' });
    }

    if (!['pix_entrega', 'cartao_entrega'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Forma de pagamento invalida.' });
    }

    const itemQuantities = new Map();
    const itemObservations = new Map();

    for (const cartItem of items) {
      const quantity = Number(cartItem.quantity);
      if (!cartItem.id || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Itens do carrinho invalidos.' });
      }

      itemQuantities.set(cartItem.id, (itemQuantities.get(cartItem.id) || 0) + quantity);
      itemObservations.set(cartItem.id, cartItem.observation || '');
    }

    const itemIds = Array.from(itemQuantities.keys());
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', itemIds);

    if (menuItemsError) {
      throw menuItemsError;
    }

    if (!menuItems || menuItems.length !== itemIds.length) {
      return res.status(400).json({ error: 'Um ou mais itens nao existem mais no cardapio.' });
    }

    const hasInvalidRestaurant = menuItems.some((item) => item.restaurant_id !== restaurantId);
    if (hasInvalidRestaurant) {
      return res.status(400).json({ error: 'Todos os itens precisam pertencer ao mesmo restaurante.' });
    }

    const unavailableItem = menuItems.find((item) => item.available === false);
    if (unavailableItem) {
      return res.status(400).json({ error: `${unavailableItem.name} esta indisponivel.` });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .limit(1)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ error: 'Restaurante nao encontrado.' });
    }

    const orderItems = menuItems.map((item) => {
      const quantity = itemQuantities.get(item.id);
      return {
        menu_item_id: item.id,
        name_at_order: item.name,
        unit_price: Number(item.price),
        quantity,
        observation: itemObservations.get(item.id) || '',
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const deliveryFee = Number(restaurant.delivery_fee || 0);
    const total = subtotal + deliveryFee;

    const { data: createdOrder, error: orderError } = await supabase.rpc('create_order_with_items', {
      p_user_id: user.id,
      p_restaurant_id: restaurantId,
      p_subtotal: subtotal,
      p_delivery_fee: deliveryFee,
      p_total: total,
      p_delivery_address: deliveryAddress.trim(),
      p_payment_method: paymentMethod,
      p_items: orderItems,
    });

    if (orderError) {
      throw orderError;
    }

    registerWebhookEvent('pedido', { orderId: createdOrder.id, userId: user.id, status: createdOrder.status });

    res.status(201).json({
      order: {
        ...createdOrder,
        restaurant,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error('Erro no POST /orders:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao criar pedido.' });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data, error } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const normalizedOrders = (data || []).map(normalizeOrder);
    res.json(await attachOrderReviews(user.id, normalizedOrders));
  } catch (error) {
    console.error('Erro no GET /orders:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao buscar pedidos.' });
  }
});

app.get('/orders/:orderId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data, error } = await supabase
      .from('orders')
      .select('*, restaurants(name), order_items(*)')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    const normalizedOrder = normalizeOrder(data);
    res.json(await attachOrderReviews(user.id, normalizedOrder));
  } catch (error) {
    console.error('Erro no GET /orders/:orderId:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao buscar pedido.' });
  }
});

app.get('/webhooks', async (req, res) => {
  res.json(webhookEvents);
});

app.post('/webhooks/:type', async (req, res) => {
  const allowedTypes = ['pedido', 'chat', 'entrega', 'pagamento', 'reembolso', 'avaliacao'];
  const type = req.params.type;

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Tipo de webhook invalido.' });
  }

  const event = registerWebhookEvent(type, req.body || {});
  res.status(202).json(event);
});

app.get('/orders/:orderId/chat', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    res.json({
      greeting: 'Ola! Sou o vendedor deste pedido. Voce precisa de alguma ajuda?',
      options: sellerHelpOptions,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Erro ao abrir chat.' });
  }
});

app.post('/orders/:orderId/chat', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { optionId } = req.body || {};
    const option = sellerHelpOptions.find((item) => item.id === optionId);

    if (!option) {
      return res.status(400).json({ error: 'Opcao de ajuda invalida.' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    registerWebhookEvent('chat', { orderId: order.id, userId: user.id, optionId });
    res.json({ answer: option.answer, option });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Erro ao responder chat.' });
  }
});

app.patch('/orders/:orderId/payment', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    if (order.payment_status === 'reembolsado') {
      return res.status(400).json({ error: 'Pedido reembolsado nao pode receber pagamento.' });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'pago', paid_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*, restaurants(name)')
      .single();

    if (updateError) {
      throw updateError;
    }

    registerWebhookEvent('pagamento', { orderId: order.id, userId: user.id, status: 'pago' });
    res.json(normalizeOrder(updatedOrder));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Erro ao confirmar pagamento.' });
  }
});

app.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    const nextStatus = getNextOrderStatus(order.status);
    if (!nextStatus) {
      return res.status(400).json({ error: 'Este pedido nao pode avancar de status.' });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id)
      .eq('status', order.status)
      .select('*, restaurants(name)')
      .single();

    if (updateError) {
      throw updateError;
    }

    registerWebhookEvent('entrega', { orderId: order.id, userId: user.id, from: order.status, to: nextStatus });

    res.json(normalizeOrder(updatedOrder));
  } catch (error) {
    console.error('Erro no PATCH /orders/:orderId/status:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao avancar status.' });
  }
});

app.patch('/orders/:orderId/refund', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('id', req.params.orderId)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    if (order.status === 'reembolsado' || order.payment_status === 'reembolsado') {
      return res.status(400).json({ error: 'Este pedido ja foi reembolsado.' });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'reembolsado',
        payment_status: 'reembolsado',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('*, restaurants(name)')
      .single();

    if (updateError) {
      throw updateError;
    }

    registerWebhookEvent('reembolso', { orderId: order.id, userId: user.id, status: 'reembolsado' });
    res.json(normalizeOrder(updatedOrder));
  } catch (error) {
    console.error('Erro no PATCH /orders/:orderId/refund:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao pedir reembolso.' });
  }
});

app.get('/profile', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase não está configurado no backend.' });
  }

  const accessToken = getAuthToken(req);
  if (!accessToken) {
    return res.status(401).json({ error: 'Token de autenticação obrigatório.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      throw error;
    }

    if (!data?.user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const { id, email, user_metadata } = data.user;
    res.json({ id, email, metadata: user_metadata });
  } catch (error) {
    console.error('Erro no /profile:', error.message || error);
    res.status(401).json({ error: 'Não autorizado.' });
  }
});

app.patch('/profile', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const name = String(req.body?.name || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ error: 'Informe um nome com pelo menos 2 caracteres.' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: name,
      },
    });

    if (error) {
      throw error;
    }

    res.json({
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata,
    });
  } catch (error) {
    console.error('Erro no PATCH /profile:', error.message || error);
    res.status(error.status || 500).json({ error: error.message || 'Erro ao atualizar perfil.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

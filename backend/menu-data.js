const restaurantCatalog = [
  {
    id: 'demo-1',
    name: 'Pizzaria Napoli',
    description: 'Pizza artesanal e massa fermentada por 24 horas.',
    category: 'Pizza',
    delivery_fee: 4.9,
    estimated_time_min: 35,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    created_at: '2026-06-01T12:00:00.000Z',
    menu: {
      categories: [
        {
          id: 'entradas',
          name: 'Entradas',
          order: 1,
          items: [
            {
              id: 'napoli-entrada-1',
              name: 'Bruschetta de tomate',
              description: 'Pão tostado com tomate, alho e manjericão.',
              price: 18.9,
              image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
          ],
        },
        {
          id: 'principais',
          name: 'Pratos principais',
          order: 2,
          items: [
            {
              id: 'napoli-prato-1',
              name: 'Pizza Margherita',
              description: 'Molho de tomate, mussarela, manjericão e azeite.',
              price: 39.9,
              image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
            {
              id: 'napoli-prato-2',
              name: 'Pizza Pepperoni',
              description: 'Queijo mussarela e pepperoni em fatias.',
              price: 44.9,
              image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
              available: false,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'demo-2',
    name: 'Sushi House',
    description: 'Sushi fresco e combinações especiais todos os dias.',
    category: 'Japonesa',
    delivery_fee: 6.5,
    estimated_time_min: 40,
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    created_at: '2026-06-02T12:00:00.000Z',
    menu: {
      categories: [
        {
          id: 'sashimi',
          name: 'Sashimi',
          order: 1,
          items: [
            {
              id: 'sushi-sashimi-1',
              name: 'Sashimi Especial',
              description: 'Peixes frescos em 12 fatias.',
              price: 54.9,
              image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
          ],
        },
        {
          id: 'combinados',
          name: 'Combinados',
          order: 2,
          items: [
            {
              id: 'sushi-combinado-1',
              name: 'Combo Omakase',
              description: 'Seleção do dia com 8 peças.',
              price: 64.9,
              image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'demo-3',
    name: 'Burger Prime',
    description: 'Hambúrgueres artesanais com molho caseiro.',
    category: 'Lanches',
    delivery_fee: 3.5,
    estimated_time_min: 25,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    created_at: '2026-06-03T12:00:00.000Z',
    menu: {
      categories: [
        {
          id: 'lanches',
          name: 'Lanches',
          order: 1,
          items: [
            {
              id: 'burger-prime-1',
              name: 'Classic Burger',
              description: 'Pão brioche, hambúrguer artesanal e cheddar.',
              price: 29.9,
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'demo-4',
    name: 'Taco Mania',
    description: 'Tacos mexicanos com ingredientes frescos.',
    category: 'Mexicana',
    delivery_fee: 5.2,
    estimated_time_min: 30,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
    rating: 4.6,
    created_at: '2026-06-04T12:00:00.000Z',
    menu: {
      categories: [
        {
          id: 'tacos',
          name: 'Tacos',
          order: 1,
          items: [
            {
              id: 'taco-mania-1',
              name: 'Taco de carne',
              description: 'Carne assada, cebola roxa e salsa.',
              price: 24.9,
              image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
              available: true,
            },
          ],
        },
      ],
    },
  },
]

function getRestaurantById(restaurantId) {
  return restaurantCatalog.find((restaurant) => restaurant.id === restaurantId) || null
}

function buildRestaurantMenuResponse(restaurantId) {
  const restaurant = getRestaurantById(restaurantId)

  if (!restaurant) {
    return null
  }

  return {
    restaurant,
    menu: restaurant.menu,
  }
}

function groupMenuItemsByCategory(items = []) {
  const grouped = new Map()

  items.forEach((item) => {
    const categoryKey = item.category || 'Outros'
    if (!grouped.has(categoryKey)) {
      grouped.set(categoryKey, [])
    }
    grouped.get(categoryKey).push(item)
  })

  return Array.from(grouped.entries()).map(([name, values]) => ({ name, items: values }))
}

module.exports = {
  restaurantCatalog,
  getRestaurantById,
  buildRestaurantMenuResponse,
  groupMenuItemsByCategory,
}

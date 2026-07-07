require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { restaurantCatalog } = require('./menu-data');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em backend/.env antes de rodar o seed.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const restaurants = restaurantCatalog.map(({ menu, id, ...restaurant }) => restaurant);

async function saveRestaurant(restaurant) {
  const { data: existingRestaurants, error: findError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('name', restaurant.name)
    .order('created_at', { ascending: true });

  if (findError) {
    throw findError;
  }

  const existingRestaurant = existingRestaurants?.[0];

  if (!existingRestaurant) {
    const { data: insertedRestaurant, error: insertError } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    return insertedRestaurant;
  }

  const duplicateIds = (existingRestaurants || [])
    .slice(1)
    .map((item) => item.id);

  if (duplicateIds.length) {
    const { error: deleteDuplicatesError } = await supabase
      .from('restaurants')
      .delete()
      .in('id', duplicateIds);

    if (deleteDuplicatesError) {
      throw deleteDuplicatesError;
    }
  }

  const { data: updatedRestaurant, error: updateError } = await supabase
    .from('restaurants')
    .update(restaurant)
    .eq('id', existingRestaurant.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedRestaurant;
}

async function seedRestaurantMenu(restaurant, catalogRestaurant) {
  const { error: deleteItemsError } = await supabase
    .from('menu_items')
    .delete()
    .eq('restaurant_id', restaurant.id);

  if (deleteItemsError) {
    throw deleteItemsError;
  }

  const { error: deleteCategoriesError } = await supabase
    .from('menu_categories')
    .delete()
    .eq('restaurant_id', restaurant.id);

  if (deleteCategoriesError) {
    throw deleteCategoriesError;
  }

  const categories = (catalogRestaurant.menu?.categories || []).map((category, index) => ({
    restaurant_id: restaurant.id,
    name: category.name,
    sort_order: category.order ?? index,
  }));

  if (!categories.length) {
    return 0;
  }

  const { data: insertedCategories, error: categoriesError } = await supabase
    .from('menu_categories')
    .insert(categories)
    .select('*');

  if (categoriesError) {
    throw categoriesError;
  }

  const categoryByName = new Map(insertedCategories.map((category) => [category.name, category]));
  const items = [];

  for (const catalogCategory of catalogRestaurant.menu.categories || []) {
    const category = categoryByName.get(catalogCategory.name);

    for (const item of catalogCategory.items || []) {
      items.push({
        restaurant_id: restaurant.id,
        category_id: category?.id || null,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        available: item.available !== false,
      });
    }
  }

  if (!items.length) {
    return 0;
  }

  const { error: itemsError } = await supabase.from('menu_items').insert(items);

  if (itemsError) {
    throw itemsError;
  }

  return items.length;
}

(async () => {
  try {
    const savedRestaurants = [];

    let itemCount = 0;

    for (const restaurant of restaurants) {
      const savedRestaurant = await saveRestaurant(restaurant);
      savedRestaurants.push(savedRestaurant);

      const catalogRestaurant = restaurantCatalog.find((item) => item.name === savedRestaurant.name);

      if (catalogRestaurant) {
        itemCount += await seedRestaurantMenu(savedRestaurant, catalogRestaurant);
      }
    }

    console.log('Restaurantes inseridos/atualizados:', savedRestaurants.length);
    console.log('Itens de cardapio inseridos:', itemCount);
    process.exitCode = 0;
  } catch (err) {
    console.error('Erro desconhecido ao rodar seed:', err.message || err);
    process.exitCode = 1;
  }
})();

export const initialCartState = {
  items: [],
  restaurantId: null,
  restaurantName: '',
  deliveryFee: 0,
}

const normalizeItem = (item, restaurantId, restaurantName, deliveryFee) => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  price: Number(item.price || 0),
  image_url: item.image_url || '',
  quantity: 1,
  restaurantId,
  restaurantName,
  deliveryFee,
})

export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurantId, restaurantName, deliveryFee } = action.payload
      const normalizedItem = normalizeItem(item, restaurantId, restaurantName, deliveryFee)

      if (!state.items.length || state.restaurantId === null || state.restaurantId === restaurantId) {
        const existingItemIndex = state.items.findIndex(
          (cartItem) => cartItem.id === normalizedItem.id && cartItem.restaurantId === restaurantId
        )

        if (existingItemIndex >= 0) {
          const nextItems = [...state.items]
          nextItems[existingItemIndex] = {
            ...nextItems[existingItemIndex],
            quantity: nextItems[existingItemIndex].quantity + 1,
          }

          return {
            ...state,
            items: nextItems,
            restaurantId,
            restaurantName,
            deliveryFee,
          }
        }

        return {
          ...state,
          items: [...state.items, normalizedItem],
          restaurantId,
          restaurantName,
          deliveryFee,
        }
      }

      return {
        items: [normalizedItem],
        restaurantId,
        restaurantName,
        deliveryFee,
      }
    }

    case 'UPDATE_ITEM_QUANTITY': {
      const { itemId, quantity } = action.payload
      const nextItems = state.items
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)

      return {
        ...state,
        items: nextItems,
      }
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.itemId),
      }
    }

    case 'CLEAR_CART':
      return initialCartState

    default:
      return state
  }
}

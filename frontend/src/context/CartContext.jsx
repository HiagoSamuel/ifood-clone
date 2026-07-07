import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { cartReducer, initialCartState } from './cartReducer.js'

const CART_STORAGE_KEY = 'ifood-demo-cart'

const CartContext = createContext(null)

function getInitialCartState() {
  if (typeof window === 'undefined') {
    return initialCartState
  }

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!rawValue) {
      return initialCartState
    }

    const parsed = JSON.parse(rawValue)
    if (!parsed || !Array.isArray(parsed.items)) {
      return initialCartState
    }

    return parsed
  } catch {
    return initialCartState
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialCartState)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  const addItem = useCallback((item, restaurant) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        item,
        restaurantId: restaurant?.id || null,
        restaurantName: restaurant?.name || '',
        deliveryFee: Number(restaurant?.delivery_fee || 0),
      },
    })
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    dispatch({
      type: 'UPDATE_ITEM_QUANTITY',
      payload: { itemId, quantity },
    })
  }, [])

  const removeItem = useCallback((itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  )

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  )

  const total = subtotal + Number(state.deliveryFee || 0)

  const value = useMemo(
    () => ({
      ...state,
      itemCount,
      subtotal,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [state, itemCount, subtotal, total, addItem, removeItem, updateQuantity, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider')
  }

  return context
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { cartReducer, initialCartState } from './cartReducer.js'

test('adiciona um item novo e incrementa a quantidade do mesmo item', () => {
  const item = { id: 'p1', name: 'Hambúrguer', price: 24.9 }
  const first = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, restaurantId: 'r1', restaurantName: 'Burgueria', deliveryFee: 4.5 },
  })
  const second = cartReducer(first, {
    type: 'ADD_ITEM',
    payload: { item, restaurantId: 'r1', restaurantName: 'Burgueria', deliveryFee: 4.5 },
  })

  assert.equal(second.items.length, 1)
  assert.equal(second.items[0].quantity, 2)
  assert.equal(second.items[0].price, 24.9)
})

test('atualiza a quantidade e remove quando chega a zero', () => {
  const item = { id: 'p2', name: 'Batata', price: 8.5 }
  const added = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, restaurantId: 'r1', restaurantName: 'Burgueria', deliveryFee: 4.5 },
  })
  const updated = cartReducer(added, {
    type: 'UPDATE_ITEM_QUANTITY',
    payload: { itemId: 'p2', quantity: 3 },
  })
  const removed = cartReducer(updated, {
    type: 'UPDATE_ITEM_QUANTITY',
    payload: { itemId: 'p2', quantity: 0 },
  })

  assert.equal(updated.items[0].quantity, 3)
  assert.equal(removed.items.length, 0)
})

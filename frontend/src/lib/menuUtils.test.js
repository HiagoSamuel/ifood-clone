import test from 'node:test'
import assert from 'node:assert/strict'
import { getMenuItemsForDisplay } from './menuUtils.js'

test('marca itens indisponíveis sem perder os disponíveis', () => {
  const categories = [
    {
      id: 'principais',
      name: 'Principais',
      items: [
        { id: '1', name: 'Pizza', available: true },
        { id: '2', name: 'Salada', available: false },
      ],
    },
  ]

  const normalized = getMenuItemsForDisplay(categories)

  assert.equal(normalized[0].items[0].isUnavailable, false)
  assert.equal(normalized[0].items[1].isUnavailable, true)
  assert.equal(normalized[0].items[1].availabilityLabel, 'Indisponível')
})

const test = require('node:test');
const assert = require('node:assert/strict');
const { groupMenuItemsByCategory } = require('../menu-data');

test('agrupar itens de cardápio por categoria', () => {
  const items = [
    { id: 1, category: 'Entradas', name: 'Bruschetta' },
    { id: 2, category: 'Entradas', name: 'Pão de alho' },
    { id: 3, category: 'Pratos principais', name: 'Pizza Margherita' },
  ];

  const grouped = groupMenuItemsByCategory(items);

  assert.equal(grouped.length, 2);
  assert.deepEqual(grouped[0], {
    name: 'Entradas',
    items: [
      { id: 1, category: 'Entradas', name: 'Bruschetta' },
      { id: 2, category: 'Entradas', name: 'Pão de alho' },
    ],
  });
  assert.deepEqual(grouped[1], {
    name: 'Pratos principais',
    items: [{ id: 3, category: 'Pratos principais', name: 'Pizza Margherita' }],
  });
});

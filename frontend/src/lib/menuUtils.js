export function getMenuItemsForDisplay(categories = []) {
  return (categories || []).map((category) => ({
    ...category,
    items: (category.items || []).map((item) => ({
      ...item,
      isUnavailable: item.available === false,
      availabilityLabel: item.available === false ? 'Indisponível' : 'Disponível',
    })),
  }))
}

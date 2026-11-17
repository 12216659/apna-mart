export function filterHomeProducts(products, searchValue, activeCategory) {
  const query = searchValue.trim().toLowerCase();
  return products.filter(product => {
    const matchesCategory =
      !activeCategory || product.category === activeCategory;
    const matchesSearch =
      !query ||
      `${product.name} ${product.brand} ${product.category} ${product.store}`
        .toLowerCase()
        .includes(query);
    return matchesCategory && matchesSearch;
  });
}

export function filterStoreProducts(
  products,
  {
    query: searchValue,
    category,
    inStockOnly,
    onSaleOnly,
    brandFilter,
    priceFilter,
    sortOption,
  },
) {
  const query = searchValue.trim().toLowerCase();
  const items = [...products].filter(product => {
    const matchesQuery =
      !query ||
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(query);
    const matchesCategory =
      category === 'All Products' || product.category === category;
    const matchesStock = !inStockOnly || Number(product.stock ?? 0) > 0;
    const matchesSale =
      !onSaleOnly ||
      Number(product.originalPrice ?? product.price) > Number(product.price);
    const matchesBrand =
      brandFilter === 'All Brands' || product.brand === brandFilter;
    const price = Number(product.price);
    let matchesPrice = true;
    if (priceFilter === 'Under ₹100') matchesPrice = price < 100;
    if (priceFilter === '₹100 - ₹250') {
      matchesPrice = price >= 100 && price <= 250;
    }
    if (priceFilter === '₹250+') matchesPrice = price > 250;
    return (
      matchesQuery &&
      matchesCategory &&
      matchesStock &&
      matchesSale &&
      matchesBrand &&
      matchesPrice
    );
  });

  switch (sortOption) {
    case 'Price: Low to High':
      return items.sort((a, b) => a.price - b.price);
    case 'Price: High to Low':
      return items.sort((a, b) => b.price - a.price);
    case 'Popular Products':
      return items.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    case 'New Arrivals':
      return items.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return items;
  }
}

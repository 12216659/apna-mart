import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import CustomerBottomNavigation from "./CustomerBottomNavigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Clock3,
  Heart,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { previewStores } from "./storeData";
import "./Home.css";
import "./StoreShopping.css";

const EMPTY_PRODUCTS = [];
const productPopularity = {
  "sl-atta": 98, "sl-milk": 96, "sl-salt": 92, "sl-oil": 86, "sl-biscuits": 82, "sl-noodles": 78, "sl-tomatoes": 74, "sl-rice": 70,
  "fb-tomatoes": 98, "fb-milk": 94, "fb-apples": 88, "fb-bread": 82, "fb-juice": 76, "fb-eggs": 72,
  "sk-atta": 96, "sk-salt": 92, "sk-noodles": 88, "sk-oil": 84, "sk-soap": 76, "sk-notebook": 70,
  "dn-milk": 92, "dn-bread": 86, "dn-rice": 78,
};
const productArrival = {
  "sl-tomatoes": 8, "sl-rice": 7, "sl-atta": 6, "sl-milk": 5, "sl-oil": 4, "sl-salt": 3, "sl-noodles": 2, "sl-biscuits": 1,
  "fb-eggs": 6, "fb-juice": 5, "fb-apples": 4, "fb-bread": 3, "fb-tomatoes": 2, "fb-milk": 1,
  "sk-notebook": 6, "sk-soap": 5, "sk-oil": 4, "sk-noodles": 3, "sk-salt": 2, "sk-atta": 1,
  "dn-rice": 3, "dn-bread": 2, "dn-milk": 1,
};
const categories = [
  "All Products",
  "Groceries",
  "Fruits & Vegetables",
  "Rice & Atta",
  "Dairy & Eggs",
  "Snacks",
  "Beverages",
  "Bakery",
  "Personal Care",
  "Household",
  "Stationery",
];

const productsByStore = {
  "sri-lakshmi-general-store": [
    { id: "sl-atta", name: "Shudh Chakki Atta", brand: "Aashirvaad", size: "5 kg", price: 285, oldPrice: 310, stock: 12, category: "Rice & Atta", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85", description: "Soft, wholesome whole wheat flour for everyday rotis and home cooking." },
    { id: "sl-milk", name: "Taaza Toned Milk", brand: "Amul", size: "500 ml", price: 30, oldPrice: null, stock: 18, category: "Dairy & Eggs", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=85", description: "Fresh toned milk for your daily cup of chai and breakfast." },
    { id: "sl-salt", name: "Iodised Salt", brand: "Tata Salt", size: "1 kg", price: 28, oldPrice: null, stock: 22, category: "Groceries", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=700&q=85", description: "Everyday iodised salt for balanced family meals." },
    { id: "sl-oil", name: "Sunflower Refined Oil", brand: "Fortune", size: "1 L", price: 145, oldPrice: 159, stock: 8, category: "Groceries", image: "https://images.unsplash.com/photo-1474979266405-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85", description: "Light cooking oil for frying, sauteing and everyday recipes." },
    { id: "sl-biscuits", name: "Glucose Biscuits", brand: "Parle-G", size: "80 g", price: 10, oldPrice: null, stock: 30, category: "Snacks", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=700&q=85", description: "A familiar teatime biscuit, packed for a quick snack." },
    { id: "sl-noodles", name: "Masala Noodles", brand: "Maggi", size: "70 g", price: 14, oldPrice: null, stock: 0, category: "Snacks", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85", description: "Quick-cooking noodles with a savoury masala seasoning." },
    { id: "sl-tomatoes", name: "Fresh Tomatoes", brand: "Farm Fresh", size: "500 g", price: 32, oldPrice: null, stock: 14, category: "Fruits & Vegetables", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=85", description: "Juicy tomatoes selected for everyday curries and salads." },
    { id: "sl-rice", name: "Everyday Basmati Rice", brand: "India Gate", size: "1 kg", price: 119, oldPrice: null, stock: 9, category: "Rice & Atta", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85", description: "Aromatic long-grain rice for everyday meals." },
  ],
  "fresh-basket-mart": [
    { id: "fb-tomatoes", name: "Fresh Tomatoes", brand: "Farm Fresh", size: "500 g", price: 35, oldPrice: 42, stock: 20, category: "Fruits & Vegetables", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=85", description: "Juicy, locally selected tomatoes for everyday cooking." },
    { id: "fb-milk", name: "Taaza Toned Milk", brand: "Amul", size: "500 ml", price: 30, oldPrice: null, stock: 14, category: "Dairy & Eggs", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=85", description: "Fresh toned milk for your daily cup of chai and breakfast." },
    { id: "fb-apples", name: "Red Apples", brand: "Orchard Select", size: "4 pcs", price: 99, oldPrice: null, stock: 7, category: "Fruits & Vegetables", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=700&q=85", description: "Crisp red apples selected for freshness." },
    { id: "fb-bread", name: "Classic White Bread", brand: "Modern", size: "400 g", price: 42, oldPrice: null, stock: 9, category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85", description: "Soft sliced bread for toast, sandwiches and snacks." },
    { id: "fb-juice", name: "Mixed Fruit Juice", brand: "Real", size: "1 L", price: 110, oldPrice: 125, stock: 6, category: "Beverages", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=85", description: "A chilled fruit drink for a refreshing break." },
    { id: "fb-eggs", name: "Farm Eggs", brand: "Farm Fresh", size: "6 pcs", price: 48, oldPrice: null, stock: 0, category: "Dairy & Eggs", image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=700&q=85", description: "Farm eggs for breakfast and home cooking." },
  ],
  "sai-kirana-general-store": [
    { id: "sk-atta", name: "Shudh Chakki Atta", brand: "Aashirvaad", size: "5 kg", price: 289, oldPrice: null, stock: 8, category: "Rice & Atta", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85", description: "Whole wheat flour for soft rotis and everyday meals." },
    { id: "sk-salt", name: "Iodised Salt", brand: "Tata Salt", size: "1 kg", price: 28, oldPrice: null, stock: 15, category: "Groceries", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=700&q=85", description: "Iodised salt for everyday family cooking." },
    { id: "sk-noodles", name: "Masala Noodles", brand: "Maggi", size: "70 g", price: 14, oldPrice: null, stock: 24, category: "Snacks", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85", description: "Quick noodles with a savoury masala seasoning." },
    { id: "sk-oil", name: "Sunflower Refined Oil", brand: "Fortune", size: "1 L", price: 149, oldPrice: 160, stock: 4, category: "Groceries", image: "https://images.unsplash.com/photo-1474979266405-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85", description: "Light sunflower oil for everyday cooking." },
    { id: "sk-soap", name: "Moisturising Soap", brand: "Dove", size: "100 g", price: 58, oldPrice: null, stock: 10, category: "Personal Care", image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=700&q=85", description: "A gentle cleansing bar for daily care." },
    { id: "sk-notebook", name: "Single Line Notebook", brand: "Classmate", size: "172 pages", price: 55, oldPrice: null, stock: 0, category: "Stationery", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85", description: "A ruled notebook for school, work and notes." },
  ],
  "daily-needs-supermarket": [
    { id: "dn-milk", name: "Taaza Toned Milk", brand: "Amul", size: "500 ml", price: 30, oldPrice: null, stock: 0, category: "Dairy & Eggs", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=85", description: "Fresh toned milk for breakfast and chai." },
    { id: "dn-bread", name: "Classic White Bread", brand: "Modern", size: "400 g", price: 42, oldPrice: null, stock: 0, category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85", description: "Soft sliced bread for toast and sandwiches." },
    { id: "dn-rice", name: "Everyday Basmati Rice", brand: "India Gate", size: "1 kg", price: 125, oldPrice: null, stock: 0, category: "Rice & Atta", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85", description: "Aromatic long-grain rice for family meals." },
  ],
};

const storeInformation = {
  "sri-lakshmi-general-store": { address: "Near JNTU Metro Station, Kukatpally, Hyderabad", hours: "8:00 AM – 10:00 PM", deliveryCharge: 25, minimumOrder: 149 },
  "fresh-basket-mart": { address: "KPHB Main Road, Kukatpally, Hyderabad", hours: "7:00 AM – 9:30 PM", deliveryCharge: 20, minimumOrder: 99 },
  "sai-kirana-general-store": { address: "Vivekananda Nagar, Kukatpally, Hyderabad", hours: "8:30 AM – 10:00 PM", deliveryCharge: null, minimumOrder: null },
  "daily-needs-supermarket": { address: "Kukatpally Housing Board, Hyderabad", hours: "9:00 AM – 9:00 PM", deliveryCharge: 30, minimumOrder: 199 },
};

function ShoppingHeader({ onBack }) {
  const { cart } = useAppState();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  return (
    <header className="app-header shopping-header">
      <button className="shopping-back" type="button" onClick={onBack} aria-label="Back to nearby stores">
        <ArrowLeft size={19} />
      </button>
      <Link className="brand-lockup" to="/" aria-label="Apna Mart home">
        <span className="brand-mark"><ShoppingBasket size={19} strokeWidth={2.3} /></span>
        <span className="brand-copy"><strong>APNA <b>MART</b></strong><small>Apni Dukaan, Ab Aapke Paas.</small></span>
      </Link>
      <Link className="header-cart-link" to="/cart" aria-label={`View cart, ${cartCount} items`}>
        <ShoppingCart size={19} />
        {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
      </Link>
    </header>
  );
}

function ProductCard({ product, quantity, onChangeQuantity, onOpen, isClosed }) {
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;
  return (
    <article className={`shopping-product-card ${product.stock === 0 ? "out-of-stock" : ""}`}>
      <button className="shopping-product-image" type="button" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
        <img src={product.image} alt="" loading="lazy" />
        {discount && <span className="shopping-discount">{discount}% off</span>}
        {product.stock === 0 && <span className="shopping-stock-label">Out of stock</span>}
      </button>
      <div className="shopping-product-info">
        <span className="shopping-product-brand">{product.brand}</span>
        <button className="shopping-product-name" type="button" onClick={() => onOpen(product)}>{product.name}</button>
        <span className="shopping-product-size">{product.size}</span>
        <div className="shopping-product-price">
          <strong>₹{product.price}</strong>
          {product.oldPrice && <del>₹{product.oldPrice}</del>}
          <small>Preview price</small>
        </div>
        <div className="shopping-stock-note">
          {product.stock > 0 ? `${product.stock} available · preview stock` : "Currently unavailable"}
        </div>
        {quantity > 0 ? (
          <div className="shopping-quantity-control" aria-label={`Quantity of ${product.name}`}>
            <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => onChangeQuantity(product, -1)}><Minus size={14} /></button>
            <span>{quantity}</span>
            <button type="button" aria-label={`Add one ${product.name}`} disabled={quantity >= product.stock} onClick={() => onChangeQuantity(product, 1)}><Plus size={14} /></button>
          </div>
        ) : (
          <button className="shopping-add-button" type="button" disabled={product.stock === 0 || isClosed} onClick={() => onChangeQuantity(product, 1)}>
            {product.stock === 0 ? "Out of stock" : isClosed ? "Store closed" : <><Plus size={15} /> Add</>}
          </button>
        )}
      </div>
    </article>
  );
}

function ProductSheet({ product, ...props }) {
  if (!product) return null;
  return <ProductSheetContent key={product.id} product={product} {...props} />;
}

function ProductSheetContent({ product, quantity, onClose, onAdd, isClosed }) {
  const [selectedQuantity, setSelectedQuantity] = useState(quantity || (product.stock ? 1 : 0));
  return (
    <div className="shopping-sheet-backdrop" onMouseDown={onClose}>
      <section className="shopping-product-sheet" role="dialog" aria-modal="true" aria-labelledby="shopping-product-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="shopping-sheet-close" type="button" onClick={onClose} aria-label="Close product details"><X size={19} /></button>
        <img className="shopping-sheet-image" src={product.image} alt="" />
        <div className="shopping-sheet-content">
          <span className="shopping-preview-note">Illustrative store-specific preview</span>
          <span className="shopping-product-brand">{product.brand}</span>
          <h2 id="shopping-product-title">{product.name}</h2>
          <p>{product.description}</p>
          <div className="shopping-sheet-specs"><span>{product.size}</span><span>{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</span></div>
          <div className="shopping-sheet-price"><strong>₹{product.price}</strong>{product.oldPrice && <del>₹{product.oldPrice}</del>}<small>Store preview price</small></div>
          {product.stock > 0 && (
            <div className="shopping-sheet-quantity">
              <span>Quantity</span>
              <div className="shopping-quantity-control">
                <button type="button" aria-label="Decrease quantity" disabled={selectedQuantity <= 1} onClick={() => setSelectedQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button>
                <span>{selectedQuantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={selectedQuantity >= product.stock} onClick={() => setSelectedQuantity((value) => Math.min(product.stock, value + 1))}><Plus size={14} /></button>
              </div>
            </div>
          )}
          <button
            className="shopping-sheet-add"
            type="button"
            disabled={product.stock === 0 || isClosed}
            onClick={() => { onAdd(product, selectedQuantity - quantity); onClose(); }}
          >
            {product.stock === 0 ? "Out of stock" : isClosed ? "Store closed" : quantity ? "Update cart" : "Add to cart"} <Plus size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function StatePanel({ title, text, action, onAction }) {
  return (
    <div className="shopping-state-panel">
      <span><Store size={25} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && <button type="button" onClick={onAction}>{action} <ArrowRight size={15} /></button>}
    </div>
  );
}

function StoreShopping() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { cart, setCart, location } = useAppState();
  const store = previewStores.find((item) => item.id === storeId);
  const info = storeInformation[storeId];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Products");
  const [sort, setSort] = useState("Recommended");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState("All brands");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [service, setService] = useState(store?.delivery ? "Delivery" : "Pickup");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewState] = useState(() => new URLSearchParams(window.location.search).get("state") || "ready");

  const products = productsByStore[storeId] ?? EMPTY_PRODUCTS;
  const storeCart = store
    ? cart.filter((item) => item.storeId === storeId || item.storeName === store.name || item.store === store.name)
    : [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.quantity * item.price, 0);
  const brands = [...new Set(products.map((product) => product.brand))];
  const isClosed = previewState === "closed" || !store?.isOpen;

  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All Products" || product.category === category;
      const matchesStock = !inStockOnly || product.stock > 0;
      const matchesSale = !onSaleOnly || Boolean(product.oldPrice);
      const matchesBrand = brandFilter === "All brands" || product.brand === brandFilter;
      const matchesMin = minPrice === "" || product.price >= Number(minPrice);
      const matchesMax = maxPrice === "" || product.price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesStock && matchesSale && matchesBrand && matchesMin && matchesMax;
    });
    if (sort === "Price Low to High") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "Price High to Low") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "Popular Products") result = [...result].sort((a, b) => productPopularity[b.id] - productPopularity[a.id]);
    if (sort === "New Arrivals") result = [...result].sort((a, b) => productArrival[b.id] - productArrival[a.id]);
    return result;
  }, [brandFilter, category, inStockOnly, maxPrice, minPrice, onSaleOnly, products, search, sort]);

  const changeQuantity = (product, amount) => {
    if (amount > 0 && (isClosed || product.stock < 1)) return;
    const existingStoreName = cart[0]?.storeName || cart[0]?.store;
    if (amount > 0 && existingStoreName && existingStoreName !== store.name) {
      if (!window.confirm(`Your cart has items from ${existingStoreName}. Replace it with items from ${store.name}?`)) return;
      setCart([{ ...product, storeId, storeName: store.name, store: store.name, quantity: Math.min(product.stock, amount) }]);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id && (item.storeId === storeId || item.storeName === store.name || item.store === store.name));
      if (!existing && amount < 0) return current;
      if (!existing) return [...current, { ...product, storeId, storeName: store.name, store: store.name, quantity: Math.min(product.stock, amount) }];
      const nextQuantity = Math.max(0, Math.min(product.stock, existing.quantity + amount));
      return nextQuantity === 0
        ? current.filter((item) => !(item.id === product.id && (item.storeId === storeId || item.storeName === store.name || item.store === store.name)))
        : current.map((item) => item.id === product.id && (item.storeId === storeId || item.storeName === store.name || item.store === store.name) ? { ...item, storeId, storeName: store.name, store: store.name, quantity: nextQuantity } : item);
    });
  };

  if (!store) {
    return (
      <div className="store-shopping-page">
        <ShoppingHeader onBack={() => navigate("/stores")} />
        <main className="shopping-main"><StatePanel title="Store not found" text="This store is unavailable. Go back to nearby stores and choose a store from the list." action="Back to stores" onAction={() => navigate("/stores")} /></main>
        <CustomerBottomNavigation />
      </div>
    );
  }

  const deliveryEstimate = store.delivery ? `${store.deliveryMinutes}–${store.deliveryMinutes + 8} min` : null;

  return (
    <div className="store-shopping-page">
      <ShoppingHeader onBack={() => navigate("/stores")} />
      <main className="shopping-main">
        <button className="shopping-selected-location" type="button" onClick={() => navigate("/stores")} aria-label={`Delivery location: ${location.name}, ${location.address}. Change on Stores page.`}>
          <MapPin size={15} />
          <span><small>DELIVERING TO</small><strong>{location.name} · {location.address}</strong></span>
          <span>Change</span>
        </button>
        <section className="shopping-store-hero">
          <img className="shopping-cover" src={store.image} alt="" />
          <div className="shopping-cover-shade" />
          <button className={`shopping-favorite ${isFavorite ? "active" : ""}`} type="button" aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"} aria-pressed={isFavorite} onClick={() => setIsFavorite((value) => !value)}><Heart size={18} fill={isFavorite ? "currentColor" : "none"} /></button>
          <span className="shopping-store-avatar">{store.icon}</span>
          <div className="shopping-store-hero-copy">
            <span className="shopping-preview-tag">Illustrative store preview</span>
            <h1>{store.name}</h1>
            <p>{store.category}</p>
            <div className="shopping-store-rating">
              <span>★</span> {store.rating.toFixed(1)} <small>({store.reviews} reviews)</small>
              <i />
              <span className={isClosed ? "closed" : "open"}><b /> {isClosed ? "Closed now" : "Open now"}</span>
            </div>
            <span className="shopping-distance"><MapPin size={14} /> {store.distance} m from {location.name}</span>
          </div>
        </section>

        <div className="shopping-preview-disclaimer"><Check size={14} /> Store, rating, location and inventory details below are illustrative. Live store services are not connected.</div>

        <section className="shopping-store-info">
          <div className="shopping-info-heading"><div><span className="shopping-section-kicker">YOUR LOCAL SHOP</span><h2>Store information</h2></div><span className="shopping-radius"><MapPin size={13} /> 500 m service radius</span></div>
          <div className="shopping-info-grid">
            <div><MapPin size={16} /><span><small>Store address</small><strong>{info.address}</strong></span></div>
            <div><Clock3 size={16} /><span><small>Operating hours</small><strong>{info.hours}</strong></span></div>
            <div><NavigationIcon /><span><small>Distance to you</small><strong>{store.distance} m <em>from selected location</em></strong></span></div>
            <div><Store size={16} /><span><small>Maximum service distance</small><strong>500 m <em>store service radius</em></strong></span></div>
          </div>
          <div className="shopping-services">
            {store.delivery && <button type="button" className={service === "Delivery" ? "selected" : ""} onClick={() => setService("Delivery")}><Bike size={15} /><span><b>Home delivery</b><small>{deliveryEstimate || "Estimate unavailable"}</small></span>{service === "Delivery" && <Check size={15} />}</button>}
            {store.pickup && <button type="button" className={service === "Pickup" ? "selected" : ""} onClick={() => setService("Pickup")}><Store size={15} /><span><b>Store pickup</b><small>Takeaway from store</small></span>{service === "Pickup" && <Check size={15} />}</button>}
          </div>
          {service === "Delivery" && store.delivery && (
            <div className="shopping-charges">
              {deliveryEstimate && <span><Clock3 size={13} /> {deliveryEstimate} <small>preview estimate</small></span>}
              {info.deliveryCharge !== null && <span>Delivery ₹{info.deliveryCharge} <small>preview charge</small></span>}
              {info.minimumOrder !== null && <span>Minimum order ₹{info.minimumOrder} <small>preview amount</small></span>}
            </div>
          )}
        </section>

        <section className="shopping-products-section">
          <div className="shopping-products-heading">
            <div><span className="shopping-section-kicker">SHOP THIS STORE</span><h2>Products <span>{products.length}</span></h2><p>Only items from {store.name}</p></div>
            <label className="shopping-sort"><ArrowDown size={14} /><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option>Recommended</option><option>Price Low to High</option><option>Price High to Low</option><option>Popular Products</option><option>New Arrivals</option></select></label>
          </div>
          <label className="shopping-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products in this store..." aria-label="Search products in this store" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}</label>
          <div className="shopping-category-rail" aria-label="Product categories">
            {categories.map((item) => <button key={item} type="button" className={category === item ? "selected" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
          </div>
          <div className="shopping-filters">
            <label><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /> In stock</label>
            <label><input type="checkbox" checked={onSaleOnly} onChange={(event) => setOnSaleOnly(event.target.checked)} /> On sale</label>
            <select aria-label="Filter by brand" value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option>All brands</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select>
            <div className="shopping-price-range"><span>₹</span><input type="number" min="0" placeholder="Min" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} aria-label="Minimum price" /><span>–</span><input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} aria-label="Maximum price" /></div>
          </div>

          {previewState === "loading" ? (
            <div className="shopping-products-grid" aria-label="Loading products">{[0, 1, 2, 3].map((item) => <div className="shopping-product-skeleton" key={item}><span /><i /><i /><b /></div>)}</div>
          ) : previewState === "outside-radius" ? (
                <StatePanel title="Outside this store’s service area" text="This store serves customers within 500 metres. Choose a nearby delivery location to check service availability." action="Back to nearby stores" onAction={() => navigate("/stores")} />
              ) : isClosed ? (
                <StatePanel title="This store is temporarily closed" text="You can browse this illustrative catalogue, but products cannot be added until the store is open." />
          ) : previewState === "empty" || products.length === 0 ? (
            <StatePanel title="No products available yet" text="This store has not added products to its catalogue yet." />
          ) : visibleProducts.length ? (
            <div className="shopping-products-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={storeCart.find((item) => item.id === product.id)?.quantity || 0}
                  onChangeQuantity={changeQuantity}
                  onOpen={setSelectedProduct}
                  isClosed={isClosed}
                />
              ))}
            </div>
          ) : (
            <StatePanel title="No matching products" text="Try another search or adjust your filters." action="Clear filters" onAction={() => { setSearch(""); setCategory("All Products"); setInStockOnly(false); setOnSaleOnly(false); setBrandFilter("All brands"); setMinPrice(""); setMaxPrice(""); }} />
          )}
          <p className="shopping-inventory-note">Sample products and prices for UI demonstration only. Store-specific live inventory and pricing are not connected.</p>
        </section>
      </main>
      {cartCount > 0 && (
        <div className="shopping-cart-summary">
          <span><ShoppingBasket size={17} /><b>{cartCount} {cartCount === 1 ? "item" : "items"}</b><i />₹{cartTotal}</span>
          <Link to="/cart">View cart <ArrowRight size={16} /></Link>
        </div>
      )}
      <CustomerBottomNavigation />
      <ProductSheet
        product={selectedProduct}
        quantity={selectedProduct ? storeCart.find((item) => item.id === selectedProduct.id)?.quantity || 0 : 0}
        isClosed={isClosed}
        onClose={() => setSelectedProduct(null)}
        onAdd={(product, amount) => changeQuantity(product, amount)}
      />
    </div>
  );
}

function NavigationIcon() {
  return <MapPin size={16} />;
}

export function StoreCartPage() {
  const navigate = useNavigate();
  const { cart, setCart } = useAppState();
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const changeQuantity = (item, amount) => {
    setCart((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + amount } : entry).filter((entry) => entry.quantity > 0 && entry.quantity <= entry.stock));
  };

  return (
    <div className="store-shopping-page">
      <ShoppingHeader onBack={() => navigate(-1)} />
      <main className="shopping-main shopping-cart-page">
        <span className="shopping-section-kicker">YOUR BAG</span>
        <h1>Your cart <span>{count}</span></h1>
        {cart.length ? (
          <>
            <div className="shopping-cart-store"><Store size={16} /> {cart[0].storeName} <small>One store per cart</small></div>
            {cart.map((item) => (
              <article className="shopping-cart-line" key={item.id}>
                <img src={item.image} alt="" />
                <div><strong>{item.name}</strong><small>{item.brand} · {item.size}</small><b>₹{item.price}</b></div>
                <div className="shopping-quantity-control">
                  <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => changeQuantity(item, 1)}><Plus size={14} /></button>
                </div>
              </article>
            ))}
            <div className="shopping-cart-total"><span>Subtotal <small>Preview prices only</small></span><strong>₹{subtotal}</strong></div>
            <button className="shopping-checkout" type="button" onClick={() => setCheckoutMessage("Checkout is not connected yet. Live stock and prices must be validated before an order can be placed.")}>Continue to checkout <ArrowRight size={17} /></button>
            {checkoutMessage && <p className="shopping-checkout-message" role="status">{checkoutMessage}</p>}
            <p className="shopping-inventory-note">Cart prices and stock must be validated by the live backend before checkout.</p>
          </>
        ) : (
          <StatePanel title="Your cart is empty" text="Visit a nearby store to discover products for your cart." action="Browse nearby stores" onAction={() => navigate("/stores")} />
        )}
      </main>
      <CustomerBottomNavigation />
    </div>
  );
}

export default StoreShopping;

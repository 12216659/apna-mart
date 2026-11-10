import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bell,
  Bike,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crosshair,
  Heart,
  House,
  Leaf,
  MapPin,
  Minus,
  Navigation,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import "./Home.css";

const locations = [
  { name: "Home", address: "Kukatpally, Hyderabad", detail: "Near JNTU Metro Station" },
  { name: "Work", address: "Madhapur, Hyderabad", detail: "HITEC City, Hyderabad" },
  { name: "Add new address", address: "", detail: "Use GPS or enter an address" },
];

const categories = [
  { name: "Fruits &\nVegetables", icon: "🥑", tint: "mint", count: "Fresh picks" },
  { name: "Groceries", icon: "🌾", tint: "peach", count: "Daily staples" },
  { name: "Dairy &\nEggs", icon: "🥛", tint: "blue", count: "Farm fresh" },
  { name: "Snacks &\nBiscuits", icon: "🍪", tint: "lilac", count: "Little treats" },
  { name: "Beverages", icon: "🧃", tint: "yellow", count: "Sip something" },
  { name: "Bakery", icon: "🥐", tint: "peach", count: "Baked today" },
  { name: "Personal\nCare", icon: "🧴", tint: "blue", count: "Feel your best" },
  { name: "Household", icon: "🧹", tint: "mint", count: "Home essentials" },
  { name: "Baby Care", icon: "🧸", tint: "lilac", count: "For little ones" },
  { name: "Stationery", icon: "✏️", tint: "yellow", count: "Work & school" },
];

const stores = [
  {
    name: "Sri Lakshmi General Store",
    category: "Groceries · Daily essentials",
    distance: 180,
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=660&q=85",
    initials: "SL",
    tint: "store-green",
    tags: ["Delivery", "Pickup"],
  },
  {
    name: "Fresh Basket Mart",
    category: "Fresh produce · Supermarket",
    distance: 320,
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=660&q=85",
    initials: "FB",
    tint: "store-orange",
    tags: ["Delivery"],
  },
  {
    name: "Sai Kirana & Supermarket",
    category: "Kirana · Household",
    distance: 410,
    image:
      "https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=660&q=85",
    initials: "SK",
    tint: "store-blue",
    tags: ["Pickup"],
  },
  {
    name: "Daily Needs Store",
    category: "Everyday essentials",
    distance: 470,
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=660&q=85",
    initials: "DN",
    tint: "store-lilac",
    tags: ["Delivery", "Pickup"],
  },
];

const products = [
  {
    name: "Aashirvaad Atta",
    brand: "Aashirvaad",
    size: "5 kg",
    price: 289,
    oldPrice: null,
    store: "Sri Lakshmi General Store",
    category: "Groceries",
    image:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=620&q=85",
    tone: "product-wheat",
  },
  {
    name: "Amul Taaza Milk",
    brand: "Amul",
    size: "500 ml",
    price: 29,
    oldPrice: null,
    store: "Fresh Basket Mart",
    category: "Dairy & Eggs",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=620&q=85",
    tone: "product-milk",
  },
  {
    name: "Tata Salt",
    brand: "Tata",
    size: "1 kg",
    price: 28,
    oldPrice: null,
    store: "Sai Kirana & Supermarket",
    category: "Groceries",
    image:
      "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=620&q=85",
    tone: "product-salt",
  },
  {
    name: "Sunflower Oil",
    brand: "Fortune",
    size: "1 L",
    price: 149,
    oldPrice: null,
    store: "Sri Lakshmi General Store",
    category: "Groceries",
    image:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=620&q=85",
    tone: "product-oil",
  },
  {
    name: "Basmati Rice",
    brand: "India Gate",
    size: "5 kg",
    price: 549,
    oldPrice: null,
    store: "Fresh Basket Mart",
    category: "Groceries",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=620&q=85",
    tone: "product-rice",
  },
  {
    name: "Parle-G Biscuits",
    brand: "Parle",
    size: "250 g",
    price: 25,
    oldPrice: null,
    store: "Daily Needs Store",
    category: "Snacks & Biscuits",
    image:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=620&q=85",
    tone: "product-biscuit",
  },
];

const banners = [
  {
    eyebrow: "YOUR NEIGHBOURHOOD, DELIVERED",
    title: "Fresh finds,\ncloser than ever.",
    description: "Your favourite local shops, just a few taps away.",
    button: "Explore nearby",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90",
    theme: "banner-leafy",
  },
  {
    eyebrow: "GOOD FOOD. GREAT NEIGHBOURS.",
    title: "Make every day\na little fresher.",
    description: "Find seasonal produce from shops around you.",
    button: "Shop fresh",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=90",
    theme: "banner-citrus",
  },
  {
    eyebrow: "ALL YOUR DAILY ESSENTIALS",
    title: "The little things,\nright on time.",
    description: "Discover trusted stores in your neighbourhood.",
    button: "Find a store",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=1200&q=90",
    theme: "banner-market",
  },
];

const searchSuggestions = ["Tomatoes", "Amul milk", "Atta", "Fresh vegetables"];
const deals = [];

function SectionHeading({ title, subtitle, action, onAction }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="text-action" type="button" onClick={onAction}>
          {action} <ArrowRight size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

function LoadingSkeleton({ type = "product" }) {
  return (
    <div className={`loading-skeleton ${type}-skeleton`} aria-label="Loading">
      <span className="skeleton-image" />
      <span className="skeleton-line wide" />
      <span className="skeleton-line" />
      <span className="skeleton-line short" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="inline-empty">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="error-state" role="alert">
      <span><Navigation size={19} /></span>
      <div>
        <strong>We couldn't load nearby shops</strong>
        <p>Check your connection and try again.</p>
      </div>
      <button type="button" onClick={onRetry}>Retry</button>
    </div>
  );
}

function StoreCard({ store, onOpen }) {
  return (
    <article className="store-card">
      <button
        className="store-card-image"
        type="button"
        aria-label={`View ${store.name}`}
        onClick={() => onOpen(store)}
      >
        <img src={store.image} alt="" loading="lazy" />
        <span className="store-distance">
          <MapPin size={11} /> {store.distance} m
        </span>
      </button>
      <div className="store-card-body">
        <div className={`store-avatar ${store.tint}`}>{store.initials}</div>
        <div className="store-info">
          <h3>{store.name}</h3>
          <p>{store.category}</p>
        </div>
        <button
          type="button"
          className="store-arrow"
          aria-label={`Open ${store.name}`}
          onClick={() => onOpen(store)}
        >
          <ArrowRight size={17} />
        </button>
      </div>
      <div className="store-card-footer">
        <span className="store-nearby"><Navigation size={12} /> {store.distance} m away</span>
        <div className="store-tags">
          {store.tags.map((tag) => (
            <span key={tag} className="service-tag">
              {tag === "Delivery" ? <Bike size={11} /> : <Store size={11} />}
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button className="store-visit-button" type="button" onClick={() => onOpen(store)}>
        View store
      </button>
    </article>
  );
}

function ProductCard({ product, isFavourite, onFavourite, onAdd, onOpen, quantity = 0 }) {
  return (
    <article className="product-card">
      <button
        className={`product-favourite ${isFavourite ? "is-favourite" : ""}`}
        type="button"
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        onClick={() => onFavourite(product.name)}
      >
        <Heart size={16} fill={isFavourite ? "currentColor" : "none"} />
      </button>
      <button
        className={`product-image ${product.tone}`}
        type="button"
        aria-label={`View ${product.name}`}
        onClick={() => onOpen(product)}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
      </button>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <button className="product-name" type="button" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <span className="product-variant">{product.size}</span>
        <div className="product-source">
          <Store size={11} />
          <span>{product.store}</span>
        </div>
        <div className="product-buy-row">
          <div className="product-price">
            <span>₹{product.price}</span>
            <small>Preview price</small>
          </div>
          {quantity > 0 ? (
            <div className="quantity-control">
              <button type="button" aria-label="Remove one" onClick={() => onAdd(product, -1)}>
                <Minus size={13} />
              </button>
              <span>{quantity}</span>
              <button type="button" aria-label="Add one" onClick={() => onAdd(product, 1)}>
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              className="add-button"
              type="button"
              aria-label={`Add ${product.name} to cart`}
              onClick={() => onAdd(product, 1)}
            >
              <Plus size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function BottomNavigation({ active, cartCount, onSelect }) {
  const items = [
    { id: "Home", icon: House },
    { id: "Stores", icon: Store },
    { id: "Cart", icon: ShoppingCart },
    { id: "Orders", icon: PackageCheck },
    { id: "Profile", icon: UserRound },
  ];
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {items.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-item ${active === id ? "active" : ""}`}
          onClick={() => onSelect(id)}
        >
          <span className="nav-icon-wrap">
            <Icon size={20} strokeWidth={active === id ? 2.4 : 1.9} />
            {id === "Cart" && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </span>
          <span>{id}</span>
        </button>
      ))}
    </nav>
  );
}

function Home() {
  const [locationIndex, setLocationIndex] = useState(0);
  const [customLocation, setCustomLocation] = useState(null);
  const [addressInput, setAddressInput] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [favourites, setFavourites] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeNav, setActiveNav] = useState("Home");
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePanel, setActivePanel] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterPickup, setFilterPickup] = useState(false);
  const [filterDistance, setFilterDistance] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [previewState, setPreviewState] = useState(
    () => new URLSearchParams(window.location.search).get("state") || "ready",
  );

  const currentLocation = customLocation || locations[locationIndex];
  const previewLocationAvailable = !customLocation && locationIndex === 0;
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartStore = cart[0]?.store;
  const filteredStores = useMemo(
    () =>
      stores
        .filter(() => previewLocationAvailable)
        .filter((store) => store.distance <= 500)
        .filter((store) => !filterDelivery || store.tags.includes("Delivery"))
        .filter((store) => !filterPickup || store.tags.includes("Pickup"))
        .sort((a, b) => (filterDistance ? a.distance - b.distance : 0)),
    [filterDelivery, filterDistance, filterPickup, previewLocationAvailable],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!previewLocationAvailable) return false;
        const matchesCategory =
          !activeCategory || product.category.toLowerCase().includes(activeCategory.toLowerCase());
        const matchesSearch =
          !searchValue ||
          `${product.name} ${product.brand} ${product.category} ${product.store}`
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, previewLocationAvailable, searchValue],
  );
  const activeBanner = banners[bannerIndex];
  const searchResults = searchValue ? filteredProducts : [];

  const changeCart = (product, amount) => {
    const existingStore = cart[0]?.store;
    if (amount > 0 && existingStore && existingStore !== product.store) {
      const shouldReplace = window.confirm(
        `Your cart has items from ${existingStore}. Replace it with items from ${product.store}?`,
      );
      if (!shouldReplace) return;
      setCart([{ ...product, quantity: amount }]);
      return;
    }

    setCart((current) => {
      const currentItem = current.find((item) => item.name === product.name);
      if (!currentItem && amount < 0) return current;
      if (!currentItem) return [...current, { ...product, quantity: amount }];
      return current
        .map((item) =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const toggleFavourite = (name) => {
    setFavourites((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setRecentlyViewed((current) => [
      product,
      ...current.filter((item) => item.name !== product.name),
    ]);
  };

  const selectCategory = (name) => {
    setActiveCategory(activeCategory === name ? "" : name);
    setSearchValue("");
  };

  const handleNavigation = (tab) => {
    setActiveNav(tab);
    if (tab === "Home") {
      setActivePanel("");
    } else {
      setActivePanel(tab.toLowerCase());
    }
  };

  const chooseLocation = (index) => {
    if (index === 2) {
      setLocationOpen(false);
      setActivePanel("location-add");
      return;
    }
    setCustomLocation(null);
    setLocationIndex(index);
    setLocationOpen(false);
    setActiveCategory("");
    setPreviewState("ready");
  };

  return (
    <div className="market-app">
      <header className="app-header">
        <a className="brand-lockup" href="/" aria-label="Apna Mart home">
          <span className="brand-mark"><ShoppingBasket size={19} strokeWidth={2.3} /></span>
          <span className="brand-copy">
            <strong>APNA <b>MART</b></strong>
            <small>Apni Dukaan, Ab Aapke Paas.</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="preview-chip"><Sparkles size={12} /> Preview</span>
          <button
            className="header-icon-button notification-button"
            type="button"
            aria-label="Notifications"
            onClick={() => setActivePanel("notifications")}
          >
            <Bell size={20} />
            <i />
          </button>
          <button
            className="profile-button"
            type="button"
            aria-label="Your profile"
            onClick={() => setActivePanel("profile")}
          >
            <UserRound size={19} />
          </button>
        </div>
      </header>

      <main className="home-content">
        <div className="location-wrap">
          <button
            className="location-selector"
            type="button"
            aria-expanded={locationOpen}
            onClick={() => setLocationOpen((open) => !open)}
          >
            <span className="location-pin"><MapPin size={17} fill="currentColor" /></span>
            <span className="location-text">
              <span className="location-eyebrow">DELIVERING TO <ChevronDown size={12} /></span>
              <strong>{currentLocation.name} <i>·</i> {currentLocation.address || "Choose address"}</strong>
              <small>{currentLocation.detail}</small>
            </span>
            <ChevronDown className="location-chevron" size={18} />
          </button>
          {locationOpen && (
            <div className="location-menu">
              <div className="popover-heading">
                <div><strong>Your locations</strong><small>Choose where to shop</small></div>
                <button type="button" aria-label="Close locations" onClick={() => setLocationOpen(false)}><X size={17} /></button>
              </div>
              {locations.map((location, index) => (
                <button
                  type="button"
                  className={`saved-location ${index === locationIndex ? "selected" : ""}`}
                  key={location.name}
                  onClick={() => chooseLocation(index)}
                >
                  <span className="saved-location-icon">{index === 0 ? <House size={16} /> : index === 1 ? <Store size={16} /> : <Plus size={16} />}</span>
                  <span><strong>{location.name}</strong><small>{location.address || location.detail}</small></span>
                  {index === locationIndex && <Check size={16} />}
                </button>
              ))}
              <button
                type="button"
                className="gps-location"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setActivePanel("location-error");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    () => {
                      setCustomLocation({
                        name: "Current location",
                        address: "GPS location",
                        detail: "Using your current location",
                      });
                      setLocationOpen(false);
                      setActiveCategory("");
                      setPreviewState("ready");
                    },
                    () => setActivePanel("location-error"),
                  );
                }}
              >
                <Crosshair size={16} /> Use my current location
              </button>
            </div>
          )}
        </div>

        <div className="search-wrap">
          <div className={`search-bar ${searchOpen ? "search-focused" : ""}`}>
            <Search size={19} />
            <input
              type="search"
              value={searchValue}
              placeholder="Search products, stores and more"
              aria-label="Search products, stores and groceries"
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setActiveCategory("");
                setSearchOpen(true);
              }}
            />
            {searchValue ? (
              <button type="button" aria-label="Clear search" onClick={() => setSearchValue("")}><X size={17} /></button>
            ) : (
              <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)}><ArrowRight size={17} /></button>
            )}
          </div>
          {searchOpen && (
            <div className="search-suggestions">
              <div className="suggestion-topline">
                <span>{searchValue ? "SEARCH RESULTS" : "POPULAR SEARCHES"}</span>
                <button type="button" onClick={() => { setSearchOpen(false); setSearchValue(""); }}>Close</button>
              </div>
              {searchValue ? (
                searchResults.length ? searchResults.slice(0, 4).map((product) => (
                  <button
                    className="search-result"
                    type="button"
                    key={product.name}
                    onClick={() => { setSearchOpen(false); openProduct(product); }}
                  >
                    <span className="search-result-icon"><Search size={14} /></span>
                    <span>{product.name}<small>{product.brand} · {product.size}</small></span>
                    <ArrowRight size={15} />
                  </button>
                )) : <p className="search-empty">No matching products yet. Try another search.</p>
              ) : (
                <>
                  <div className="recent-search-row"><Clock3 size={14} /><span>Recent</span><button type="button" onClick={() => setSearchValue("Amul milk")}>Amul milk</button></div>
                  <div className="popular-searches">{searchSuggestions.map((term) => <button key={term} type="button" onClick={() => setSearchValue(term)}>{term}</button>)}</div>
                </>
              )}
            </div>
          )}
        </div>

        <section className={`hero-banner ${activeBanner.theme}`}>
          <div className="banner-image" style={{ backgroundImage: `url("${activeBanner.image}")` }} />
          <div className="banner-shade" />
          <div className="banner-content">
            <span className="banner-eyebrow"><Leaf size={12} /> {activeBanner.eyebrow}</span>
            <h1>{activeBanner.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
            <p>{activeBanner.description}</p>
            <button
              type="button"
              className="banner-cta"
              onClick={() => document.getElementById("nearby-stores")?.scrollIntoView({ behavior: "smooth" })}
            >
              {activeBanner.button} <ArrowRight size={15} />
            </button>
          </div>
          <div className="banner-controls">
            <div className="banner-dots">
              {banners.map((banner, index) => (
                <button
                  type="button"
                  key={banner.eyebrow}
                  aria-label={`Show banner ${index + 1}`}
                  className={index === bannerIndex ? "active" : ""}
                  onClick={() => setBannerIndex(index)}
                />
              ))}
            </div>
            <div className="banner-arrows">
              <button type="button" aria-label="Previous promotion" onClick={() => setBannerIndex((bannerIndex + banners.length - 1) % banners.length)}><ChevronLeft size={16} /></button>
              <button type="button" aria-label="Next promotion" onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>

        <div className="preview-notice">
          <Sparkles size={13} />
          <span>Design preview · Sample stores and prices shown for illustration. Live availability, pricing and offers come from each store.</span>
        </div>

        <section className="home-section category-section">
          <SectionHeading
            title="Shop by category"
            subtitle="Everything you need, just around the corner."
            action={activeCategory ? "Clear" : undefined}
            onAction={() => setActiveCategory("")}
          />
          <div className="category-scroller">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`category-card ${category.tint} ${activeCategory === category.name.split("\n")[0] ? "selected" : ""}`}
                onClick={() => selectCategory(category.name.split("\n")[0])}
              >
                <span className="category-illustration">{category.icon}</span>
                <span className="category-name">{category.name.split("\n").map((line) => <span key={line}>{line}</span>)}</span>
                <small>{category.count}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="home-section stores-section" id="nearby-stores">
          <SectionHeading
            title="Stores near you"
            subtitle="Explore shops around your location."
            action="View all"
            onAction={() => setActivePanel("stores")}
          />
          <div className="store-filter-row">
            <button type="button" className={`filter-button ${filtersOpen ? "filter-active" : ""}`} onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal size={14} /> Filters <ChevronDown size={13} />
            </button>
            <button type="button" className={`filter-chip ${filterDistance ? "selected" : ""}`} onClick={() => setFilterDistance((value) => !value)}>
              <ArrowDownUp size={13} /> Nearest
            </button>
            <button type="button" className={`filter-chip ${filterDelivery ? "selected" : ""}`} onClick={() => setFilterDelivery((value) => !value)}>
              <Bike size={13} /> Delivery
            </button>
            <button type="button" className={`filter-chip ${filterPickup ? "selected" : ""}`} onClick={() => setFilterPickup((value) => !value)}>
              <Store size={13} /> Pickup
            </button>
          </div>
          {filtersOpen && (
            <div className="filter-popover">
              <div><strong>Browse stores</strong><small>Only approved partners within 500 m</small></div>
              <label><input type="checkbox" checked={filterDelivery} onChange={(event) => setFilterDelivery(event.target.checked)} /> Delivery available</label>
              <label><input type="checkbox" checked={filterPickup} onChange={(event) => setFilterPickup(event.target.checked)} /> Pickup available</label>
              <label><input type="checkbox" checked={filterDistance} onChange={(event) => setFilterDistance(event.target.checked)} /> Sort by nearest</label>
            </div>
          )}
          {previewState === "loading" ? (
            <div className="store-scroller">
              {Array.from({ length: 3 }, (_, index) => <LoadingSkeleton key={index} type="store" />)}
            </div>
          ) : previewState === "error" ? (
            <ErrorState onRetry={() => setPreviewState("ready")} />
          ) : previewState === "empty" ? (
            <EmptyState icon={Store} title="No stores nearby yet" description="There aren't any partner stores in this area just yet." />
          ) : filteredStores.length ? (
            <div className="store-scroller">
              {filteredStores.map((store) => <StoreCard key={store.name} store={store} onOpen={setSelectedStore} />)}
            </div>
          ) : (
            <EmptyState icon={Store} title={previewLocationAvailable ? "No stores match these filters" : "No preview stores for this address"} description={previewLocationAvailable ? "Try changing a filter to see more nearby shops." : "Live nearby stores will appear here when connected."} />
          )}
        </section>

        <section className="home-section product-section">
          <SectionHeading
            title={activeCategory ? activeCategory : "Popular near you"}
            subtitle={activeCategory ? `Popular picks in ${activeCategory}.` : "Frequently picked from nearby stores."}
            action="See all"
            onAction={() => setActivePanel("products")}
          />
          {previewState === "loading" ? (
            <div className="product-grid">
              {Array.from({ length: 4 }, (_, index) => <LoadingSkeleton key={index} />)}
            </div>
          ) : previewState === "error" ? (
            <ErrorState onRetry={() => setPreviewState("ready")} />
          ) : previewState === "empty" ? (
            <EmptyState icon={Search} title="No products available yet" description="Products from nearby stores will appear here." />
          ) : filteredProducts.length ? (
            <div className="product-grid">
              {filteredProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.name}
                  product={product}
                  isFavourite={favourites.includes(product.name)}
                  onFavourite={toggleFavourite}
                  onAdd={changeCart}
                  onOpen={openProduct}
                  quantity={cart.find((item) => item.name === product.name)?.quantity || 0}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title={previewLocationAvailable ? "No products found" : "No product preview for this address"} description={previewLocationAvailable ? "Try a different search or category." : "Store-specific products will appear here when connected."} />
          )}
        </section>

        <section className="home-section deals-section">
          <SectionHeading title="Today's best deals" subtitle="Special prices from your neighbourhood stores." action="All offers" onAction={() => setActivePanel("offers")} />
          {deals.length ? (
            <div className="deal-grid">{deals.map((deal) => <div key={deal.name}>{deal.name}</div>)}</div>
          ) : (
            <div className="deals-placeholder">
              <div className="deal-icon"><Sparkles size={20} /></div>
              <div><strong>Good deals are worth the wait</strong><p>Verified offers from stores near you will show up here.</p></div>
              <ArrowRight className="deal-arrow" size={17} />
            </div>
          )}
        </section>

        <section className="home-section recommendations-section">
          <SectionHeading title="Recommended for you" subtitle="A few local favourites to get you started." action="Explore" onAction={() => setActivePanel("products")} />
          <div className="recommendation-callout">
            <span className="recommendation-icon"><Sparkles size={18} /></span>
            <div><strong>Popular picks, made local</strong><p>Recommendations get more personal as you shop.</p></div>
            <button type="button" aria-label="See recommended products" onClick={() => setActivePanel("products")}><ArrowRight size={17} /></button>
          </div>
          {previewLocationAvailable ? <div className="recommendation-products">
            {products.slice(1, 3).map((product) => (
              <button key={product.name} type="button" className="mini-product" onClick={() => openProduct(product)}>
                <img src={product.image} alt="" loading="lazy" />
                <span><strong>{product.name}</strong><small>{product.brand} · {product.size}</small><b>₹{product.price} <i>at {product.store}</i></b></span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div> : <p className="location-preview-note">Recommendations will update with stores near {currentLocation.name}.</p>}
        </section>

        {recentlyViewed.length > 0 && (
          <section className="home-section recently-section">
            <SectionHeading title="Recently viewed" subtitle="Pick up where you left off." />
            <div className="recently-scroller">
              {recentlyViewed.map((product) => (
                <button className="recently-card" key={product.name} type="button" onClick={() => setSelectedProduct(product)}>
                  <img src={product.image} alt="" loading="lazy" /><span><strong>{product.name}</strong><small>{product.brand} · {product.size}</small></span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="home-footer">
        <span className="footer-brand"><ShoppingBasket size={15} /> APNA MART</span>
        <span>Apni Dukaan, Ab Aapke Paas.</span>
      </footer>

      <BottomNavigation active={activeNav} cartCount={cartCount} onSelect={handleNavigation} />

      {(selectedStore || selectedProduct || activePanel) && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedStore(null);
            setSelectedProduct(null);
            setActivePanel("");
          }
        }}>
          <section className="detail-sheet" role="dialog" aria-modal="true" aria-label={selectedStore?.name || selectedProduct?.name || activePanel}>
            <button
              type="button"
              className="sheet-close"
              aria-label="Close"
              onClick={() => { setSelectedStore(null); setSelectedProduct(null); setActivePanel(""); }}
            ><X size={18} /></button>
            {selectedStore && (
              <div className="sheet-content">
                <img className="sheet-cover" src={selectedStore.image} alt="" />
                <span className="sheet-kicker">LOCAL STORE · {selectedStore.distance} M AWAY</span>
                <h2>{selectedStore.name}</h2>
                <p>{selectedStore.category}</p>
                <div className="sheet-tags">{selectedStore.tags.map((tag) => <span key={tag}><Check size={13} /> {tag} available</span>)}</div>
                <div className="verified-note"><MapPin size={15} /><span>Nearby partner store<br /><small>Store-specific prices and availability are confirmed at checkout.</small></span></div>
                <button className="sheet-primary" type="button" onClick={() => { setSelectedStore(null); setActivePanel("products"); }}>Browse store <ArrowRight size={16} /></button>
              </div>
            )}
            {selectedProduct && (
              <div className="sheet-content">
                <img className="sheet-product-image" src={selectedProduct.image} alt={selectedProduct.name} />
                <span className="sheet-kicker">{selectedProduct.brand} · {selectedProduct.size}</span>
                <h2>{selectedProduct.name}</h2>
                <p>Sold by {selectedProduct.store}</p>
                <div className="sheet-price">₹{selectedProduct.price}<small> Preview price · final store price may vary</small></div>
                <div className="verified-note"><Store size={15} /><span>Store-specific product<br /><small>Availability is confirmed by the selected store.</small></span></div>
                <button className="sheet-primary" type="button" onClick={() => { changeCart(selectedProduct, 1); setSelectedProduct(null); }}>Add to cart <Plus size={16} /></button>
              </div>
            )}
            {!selectedStore && !selectedProduct && (
              <div className="panel-content">
                <span className="panel-icon">
                  {activePanel === "cart" ? <ShoppingCart size={23} /> : activePanel === "profile" ? <UserRound size={23} /> : activePanel === "notifications" ? <Bell size={23} /> : activePanel === "location-error" || activePanel === "location-add" ? <MapPin size={23} /> : activePanel === "orders" ? <PackageCheck size={23} /> : <Store size={23} />}
                </span>
                <span className="sheet-kicker">APNA MART</span>
                <h2>{activePanel === "cart" ? "Your cart" : activePanel === "profile" ? "Your account" : activePanel === "notifications" ? "Notifications" : activePanel === "orders" ? "Your orders" : activePanel === "location-error" ? "Location unavailable" : activePanel === "location-add" ? "Add a delivery address" : activePanel === "offers" ? "Offers near you" : activePanel === "products" ? "Popular products" : "Stores near you"}</h2>
                {activePanel === "location-add" ? (
                  <div className="add-address-form">
                    <p className="panel-description">Add a delivery address to find nearby neighbourhood stores.</p>
                    <label htmlFor="new-address">Address or area</label>
                    <input
                      id="new-address"
                      value={addressInput}
                      placeholder="e.g. Hitech City, Hyderabad"
                      onChange={(event) => setAddressInput(event.target.value)}
                    />
                    <button
                      className="sheet-primary"
                      type="button"
                      disabled={!addressInput.trim()}
                      onClick={() => {
                        const address = addressInput.trim();
                        setCustomLocation({ name: "Other", address, detail: "Saved address" });
                        setAddressInput("");
                        setActivePanel("");
                        setActiveCategory("");
                        setPreviewState("ready");
                      }}
                    >
                      Save and continue <MapPin size={16} />
                    </button>
                  </div>
                ) : activePanel === "cart" && cart.length > 0 ? (
                  <div className="cart-panel">
                    <div className="cart-store-name"><Store size={15} /> {cartStore}</div>
                    {cart.map((item) => <div className="cart-line" key={item.name}><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.size} · ₹{item.price}</small></span><strong>₹{item.price * item.quantity}</strong></div>)}
                    <div className="cart-total"><span>Subtotal <small>Preview prices</small></span><strong>₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</strong></div>
                    <button className="sheet-primary" type="button" onClick={() => setActivePanel("checkout")}>Continue <ArrowRight size={16} /></button>
                  </div>
                ) : (
                  <p className="panel-description">
                    {activePanel === "cart" ? "Your cart is waiting for something good. Add a few local favourites to get started." :
                      activePanel === "profile" ? "Sign in to manage your addresses, saved items and account details." :
                        activePanel === "notifications" ? "You're all caught up. Store updates and order notifications will appear here." :
                          activePanel === "orders" ? "Your orders will appear here after you place one." :
                            activePanel === "location-error" ? "We couldn't access your location. Choose a saved address or try again." :
                              activePanel === "offers" ? "Verified offers from stores near you will appear here when available." :
                                activePanel === "checkout" ? "Checkout is coming soon. Your cart is saved on this device." :
                                  "Choose a nearby shop to explore products and store-specific prices."}
                  </p>
                )}
                {activePanel === "cart" && cart.length === 0 && <div className="empty-cart-art"><ShoppingBag size={36} /><span>Good things start here</span></div>}
                {activePanel === "profile" && <button className="sheet-primary" type="button" onClick={() => { window.location.href = "/login"; }}>Sign in or create account <ArrowRight size={16} /></button>}
                {activePanel === "location-error" && <button className="sheet-primary" type="button" onClick={() => { setActivePanel(""); setLocationOpen(true); }}>Choose saved address <MapPin size={16} /></button>}
                {activePanel === "stores" && <div className="panel-store-list">{filteredStores.slice(0, 3).map((store) => <button key={store.name} type="button" onClick={() => { setActivePanel(""); setSelectedStore(store); }}><span className={`store-avatar ${store.tint}`}>{store.initials}</span><span><strong>{store.name}</strong><small>{store.distance} m away · {store.tags.join(" · ")}</small></span><ArrowRight size={15} /></button>)}</div>}
                {activePanel === "products" && <div className="panel-store-list">{products.slice(0, 4).map((product) => <button key={product.name} type="button" onClick={() => { setActivePanel(""); openProduct(product); }}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.brand} · ₹{product.price} preview price</small></span><ArrowRight size={15} /></button>)}</div>}
                {activePanel !== "cart" && activePanel !== "products" && activePanel !== "stores" && activePanel !== "profile" && activePanel !== "location-error" && activePanel !== "location-add" && (
                  <button className="sheet-primary" type="button" onClick={() => setActivePanel("")}>Continue shopping <ArrowRight size={16} /></button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Home;

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import CustomerBottomNavigation from "./CustomerBottomNavigation";
import { previewStores } from "./storeData";
import {
  ArrowDownUp,
  ArrowRight,
  Apple,
  Bell,
  Bike,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Croissant,
  Heart,
  MapPin,
  Milk,
  Navigation,
  Search,
  ShoppingBasket,
  Sparkles,
  Store,
  UserRound,
  Wheat,
  Boxes,
  X,
} from "lucide-react";
import "./Home.css";
import "./StoreDiscovery.css";

const filters = ["All Stores", "Open Now", "Top Rated", "Fast Delivery", "Pickup Available"];
const categories = [
  { name: "All", Icon: ShoppingBasket, tint: "green" },
  { name: "Grocery", Icon: Wheat, tint: "wheat" },
  { name: "Rice & Atta", Icon: Boxes, tint: "wheat" },
  { name: "Fruits & Vegetables", Icon: Apple, tint: "fruit" },
  { name: "Dairy & Eggs", Icon: Milk, tint: "dairy" },
  { name: "Bakery", Icon: Croissant, tint: "bakery" },
  { name: "Snacks", Icon: Coffee, tint: "snacks" },
  { name: "Beverages", Icon: Coffee, tint: "beverages" },
  { name: "Household", Icon: Sparkles, tint: "household" },
  { name: "Personal Care", Icon: Sparkles, tint: "care" },
  { name: "Stationery", Icon: Wheat, tint: "stationery" },
];

const categoryAliases = {
  Grocery: ["Grocery", "Groceries"],
};

function Header({ onProfile }) {
  return (
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
        >
          <Bell size={20} />
          <i />
        </button>
        <button
          className="profile-button"
          type="button"
          aria-label="Your profile"
          onClick={onProfile}
        >
          <UserRound size={19} />
        </button>
      </div>
    </header>
  );
}

function FilterChips({ active, onChange }) {
  return (
    <div className="discovery-filter-scroll" aria-label="Store filters">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`discovery-filter-chip ${active === filter ? "selected" : ""}`}
          onClick={() => onChange(filter)}
          aria-pressed={active === filter}
        >
          {active === filter && filter !== "All Stores" && <Check size={13} />}
          {filter}
        </button>
      ))}
    </div>
  );
}

function CategoryRail({ selected, onChange }) {
  return (
    <div className="discovery-category-rail" aria-label="Store categories">
      {categories.map(({ name, Icon, tint }) => (
        <button
          type="button"
          className={`discovery-category ${selected === name ? "selected" : ""}`}
          key={name}
          onClick={() => onChange(name)}
          aria-pressed={selected === name}
        >
          <span className={`discovery-category-icon ${tint}`}><Icon size={20} strokeWidth={1.8} /></span>
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}

function StoreStatus({ isOpen }) {
  return (
    <span className={`discovery-status ${isOpen ? "open" : "closed"}`}>
      <i />
      {isOpen ? "Open now" : "Closed now"}
    </span>
  );
}

function StoreCard({ store, favorite, onFavorite, onOpen, forceClosed }) {
  const isOpen = forceClosed ? false : store.isOpen;
  return (
    <article className={`discovery-store-card ${!isOpen ? "store-is-closed" : ""}`}>
      <div className="discovery-store-cover">
        <img src={store.image} alt="" loading="lazy" />
        <span className="discovery-distance-pill"><Navigation size={12} /> {store.distance} m</span>
        <button
          type="button"
          className={`discovery-favorite ${favorite ? "favorited" : ""}`}
          aria-label={favorite ? `Remove ${store.name} from favourites` : `Add ${store.name} to favourites`}
          aria-pressed={favorite}
          onClick={() => onFavorite(store.name)}
        >
          <Heart size={17} fill={favorite ? "currentColor" : "none"} />
        </button>
        <span className={`discovery-store-logo ${store.accent}`}>{store.icon}</span>
      </div>
      <div className="discovery-store-content">
        <div className="discovery-store-heading">
          <div className="discovery-store-title">
            <h3>{store.name}</h3>
            <p>{store.category}</p>
          </div>
          <StoreStatus isOpen={isOpen} />
        </div>
        <div className="discovery-store-meta">
          <span className="discovery-rating"><span>★</span> {store.rating.toFixed(1)} <small>({store.reviews})</small></span>
          <span className="discovery-meta-dot" />
          <span><Clock3 size={14} /> {store.deliveryMinutes} min</span>
          <span className="discovery-meta-dot" />
          <span>{store.products.toLocaleString("en-IN")} products</span>
        </div>
        <div className="discovery-services">
          {store.delivery && (
            <span className="discovery-service delivery"><Bike size={13} /> Delivery</span>
          )}
          {store.pickup && (
            <span className="discovery-service pickup"><Store size={13} /> Pickup</span>
          )}
          {!store.delivery && !store.pickup && (
            <span className="discovery-service unavailable">Availability not listed</span>
          )}
        </div>
        <button
          type="button"
          className="discovery-view-store"
          onClick={() => onOpen(store)}
          disabled={!isOpen}
        >
          {isOpen ? "View store" : "Store is closed"}
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="discovery-store-grid" aria-label="Loading nearby stores">
      {[0, 1, 2, 3].map((item) => (
        <div className="discovery-skeleton-card" key={item} aria-hidden="true">
          <span className="discovery-skeleton-cover" />
          <span className="discovery-skeleton-line long" />
          <span className="discovery-skeleton-line medium" />
          <span className="discovery-skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

function MapPreview({ stores, onOpen }) {
  return (
    <div className="discovery-map" aria-label="Map preview of nearby stores">
      <div className="map-block map-block-one" />
      <div className="map-block map-block-two" />
      <div className="map-block map-block-three" />
      <div className="map-road road-horizontal" />
      <div className="map-road road-diagonal" />
      <div className="map-road road-vertical" />
      <span className="map-neighborhood">KUKATPALLY</span>
      <span className="map-neighborhood second">JNTU COLONY</span>
      <span className="map-you"><span /><small>You</small></span>
      {stores.slice(0, 4).map((store, index) => (
        <button
          type="button"
          key={store.name}
          className={`map-pin pin-${index + 1}`}
          onClick={() => onOpen(store)}
          aria-label={`Preview ${store.name}`}
        >
          <Store size={15} />
        </button>
      ))}
      <div className="map-caption"><MapPin size={14} /> Stores within 500 metres</div>
    </div>
  );
}

function EmptyState({ type, onLocation }) {
  const messages = {
    empty: {
      icon: <ShoppingBasket size={26} />,
      title: "No stores nearby yet!",
      text: "Try changing your delivery location.",
      action: "Change location",
    },
    "permission-denied": {
      icon: <MapPin size={26} />,
      title: "Location access is off",
      text: "Allow location access to discover approved stores near you.",
      action: "Choose location",
    },
    "location-needed": {
      icon: <Navigation size={26} />,
      title: "Choose a delivery location",
      text: "Select an address to see stores within 500 metres.",
      action: "Select location",
    },
    offline: {
      icon: <Bike size={26} />,
      title: "You’re offline",
      text: "Check your internet connection and try again.",
      action: "Try again",
    },
  };
  const message = messages[type] || messages.empty;
  return (
    <div className="discovery-empty-state">
      <span className="discovery-empty-illustration">
        <span className="empty-sun" />
        <span className="empty-bag"><ShoppingBasket size={33} /></span>
        <span className="empty-leaf">✦</span>
      </span>
      <h3>{message.title}</h3>
      <p>{message.text}</p>
      <button type="button" onClick={onLocation}>{message.action} <ArrowRight size={15} /></button>
    </div>
  );
}

function StoreDetails({ store, onClose, onBrowse, forceClosed = false }) {
  if (!store) return null;
  const isOpen = forceClosed ? false : store.isOpen;
  return (
    <div className="discovery-modal-backdrop" onMouseDown={onClose}>
      <section
        className="discovery-details-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="discovery-modal-close" type="button" onClick={onClose} aria-label="Close preview">
          <X size={20} />
        </button>
        <img className="discovery-details-image" src={store.image} alt="" />
        <div className="discovery-details-content">
          <span className="discovery-preview-tag"><Store size={12} /> Store preview</span>
          <h2 id="discovery-details-title">{store.name}</h2>
          <p>{store.category}</p>
          <div className="discovery-details-stats">
            <span><span className="rating-star">★</span> {store.rating.toFixed(1)} <small>({store.reviews} reviews)</small></span>
            <span><MapPin size={14} /> {store.distance} m away</span>
          </div>
          <div className="discovery-details-note">
            Store-specific products and prices appear after opening a store. These preview details are illustrative only.
          </div>
          <button className="discovery-view-store" type="button" disabled={!isOpen} onClick={onBrowse}>
            {isOpen ? "Browse store" : "Store is closed"} <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function StoreDiscovery() {
  const navigate = useNavigate();
  const { location: selectedLocation, setLocation } = useAppState();
  const initialState = new URLSearchParams(window.location.search).get("state") || "ready";
  const [previewState, setPreviewState] = useState(initialState);
  const [locationOpen, setLocationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All Stores");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Nearest First");
  const [view, setView] = useState("List");
  const [favorites, setFavorites] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

  const isClosedPreview = previewState === "closed";
  const stateType = ["empty", "permission-denied", "location-needed", "offline"].includes(previewState)
    ? previewState
    : null;
  const visibleStores = useMemo(() => {
    let result = previewStores.filter((store) => {
      const searchText = `${store.name} ${store.category} ${store.searchTerms.join(" ")}`.toLowerCase();
      const searchMatch = searchText.includes(query.toLowerCase());
      const filterMatch =
        filter === "All Stores" ||
        (filter === "Open Now" && (isClosedPreview ? false : store.isOpen)) ||
        (filter === "Top Rated" && store.rating >= 4.5) ||
        (filter === "Fast Delivery" && store.deliveryMinutes <= 25 && store.delivery) ||
        (filter === "Pickup Available" && store.pickup);
      const matchingCategories = categoryAliases[category] || [category];
      const categoryMatch = category === "All" || matchingCategories.some((item) => store.catalogCategories.includes(item));
      return searchMatch && filterMatch && categoryMatch && store.distance <= 500;
    });
    if (sort === "Nearest First") result = [...result].sort((a, b) => a.distance - b.distance);
    if (sort === "Highest Rated") result = [...result].sort((a, b) => b.rating - a.rating);
    if (sort === "Fastest Delivery") result = [...result].sort((a, b) => a.deliveryMinutes - b.deliveryMinutes);
    if (sort === "Popular Stores") result = [...result].sort((a, b) => b.reviews - a.reviews);
    return result;
  }, [category, filter, isClosedPreview, query, sort]);

  const stateLabel = {
    ready: "Design preview · sample stores and details are illustrative",
    loading: "Loading approved stores near you",
    closed: "Design preview · sample stores and details are illustrative",
    empty: "Live store data is not connected",
    "permission-denied": "Live location access is not connected",
    "location-needed": "Live location selection is not connected",
    offline: "Preview mode · connectivity state is simulated",
    details: "Design preview · sample stores and details are illustrative",
  }[previewState] || "Design preview · sample stores and details are illustrative";

  const toggleFavorite = (name) =>
    setFavorites((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  const locationAction = () => setLocationOpen((open) => !open);

  return (
    <div className="store-discovery-page">
      <Header
        onProfile={() => { window.location.href = "/login"; }}
      />
      <main className="discovery-main">
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
              <strong>{selectedLocation.name} <i>·</i> {selectedLocation.address}</strong>
              <small>{selectedLocation.detail}</small>
            </span>
            <ChevronDown className="location-chevron" size={18} />
          </button>
          {locationOpen && (
            <div className="discovery-location-popover">
              <strong>Choose your delivery location</strong>
              {[
                { name: "Home", address: "Kukatpally, Hyderabad", detail: "Near JNTU Metro Station" },
                { name: "Work", address: "Madhapur, Hyderabad", detail: "HITEC City, Hyderabad" },
                { name: "Current location", address: "GPS location", detail: "Live location is not connected" },
              ].map((location) => (
                <button type="button" key={location.name} onClick={() => { setLocation(location); setLocationOpen(false); }}>
                  <MapPin size={15} /> <span><b>{location.name}</b><small>{location.address}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="discovery-preview-banner">
          <span><Sparkles size={14} /></span>
          <p>{stateLabel}</p>
          <span className="preview-radius">500 m radius</span>
        </div>

        {stateType ? (
          <div className="discovery-state-page">
            <div className="discovery-page-heading">
              <div>
                <span className="discovery-eyebrow"><MapPin size={13} /> YOUR NEIGHBOURHOOD</span>
                <h1>Stores Near You</h1>
                <p>Discover your neighbourhood stores.</p>
              </div>
              <span className="discovery-radius"><Navigation size={13} /> Within 500 metres</span>
            </div>
            <EmptyState
              type={stateType}
              onLocation={
                stateType === "offline"
                  ? () => { window.location.href = "/stores"; }
                  : locationAction
              }
            />
          </div>
        ) : (
          <>
            <section className="discovery-intro">
              <div className="discovery-page-heading">
                <div>
                  <span className="discovery-eyebrow"><MapPin size={13} /> YOUR NEIGHBOURHOOD</span>
                  <h1>Stores Near You</h1>
                  <p>Discover your neighbourhood stores.</p>
                </div>
                <span className="discovery-radius"><Navigation size={13} /> Within 500 metres</span>
              </div>
              <div className="discovery-search">
                <Search size={19} />
                <input
                  type="search"
                  placeholder="Search stores or products..."
                  aria-label="Search stores or products"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}
              </div>
              <FilterChips active={filter} onChange={setFilter} />
            </section>

            <section className="discovery-categories-section">
              <div className="discovery-section-heading">
                <div><h2>Shop by category</h2><p>Choose a category to find nearby stores carrying it</p></div>
                <button type="button" aria-label="Scroll categories" onClick={() => document.querySelector(".discovery-category-rail")?.scrollBy({ left: 250, behavior: "smooth" })}>
                  <ArrowRight size={16} />
                </button>
              </div>
              <CategoryRail selected={category} onChange={setCategory} />
            </section>

            <section className="discovery-stores-section">
              <div className="discovery-section-heading store-results-heading">
                <div>
                  <h2>{query ? "Search results" : category !== "All" ? `Stores with ${category} items` : "Nearby stores"} <span className="discovery-count">{visibleStores.length}</span></h2>
                  <p>{query ? `Matching “${query}”` : category !== "All" ? `Nearby stores carrying ${category.toLowerCase()}` : "Local favourites, just around the corner"}</p>
                </div>
                <label className="discovery-sort">
                  <ArrowDownUp size={14} />
                  <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort stores">
                    <option>Nearest First</option>
                    <option>Highest Rated</option>
                    <option>Fastest Delivery</option>
                    <option>Popular Stores</option>
                  </select>
                </label>
              </div>
              <div className="discovery-results-toolbar">
                <span><strong>{visibleStores.length}</strong> stores found <i /> Within 500 metres</span>
                <div className="discovery-view-toggle" role="group" aria-label="Store view">
                  <button type="button" className={view === "List" ? "active" : ""} onClick={() => setView("List")} aria-pressed={view === "List"}>
                    <Store size={14} /> List
                  </button>
                  <button type="button" className={view === "Map" ? "active" : ""} onClick={() => setView("Map")} aria-pressed={view === "Map"}>
                    <MapPin size={14} /> Map
                  </button>
                </div>
              </div>
              {previewState === "loading" ? (
                <LoadingCards />
              ) : visibleStores.length === 0 ? (
                <EmptyState type="empty" onLocation={locationAction} />
              ) : view === "Map" ? (
                <MapPreview stores={visibleStores} onOpen={setSelectedStore} />
              ) : (
                <div key={`${category}-${filter}-${query}-${sort}`} className="discovery-store-grid" aria-live="polite">
                  {visibleStores.map((store) => (
                    <StoreCard
                      key={store.name}
                      store={store}
                      favorite={favorites.includes(store.name)}
                      onFavorite={toggleFavorite}
                      onOpen={() => navigate(`/stores/${store.id}`)}
                      forceClosed={isClosedPreview}
                    />
                  ))}
                </div>
              )}
              <div className="discovery-safety-note"><Check size={14} /> Only admin-approved, active stores appear in the live experience.</div>
            </section>
          </>
        )}
      </main>
      <CustomerBottomNavigation />
      {previewState === "details" && !selectedStore && (
        <StoreDetails
          store={previewStores[0]}
          onClose={() => {
            setPreviewState("ready");
            window.history.replaceState({}, "", "/stores");
          }}
          onBrowse={() => navigate(`/stores/${previewStores[0].id}`)}
        />
      )}
      <StoreDetails
        store={selectedStore}
        forceClosed={isClosedPreview}
        onClose={() => setSelectedStore(null)}
        onBrowse={() => {
          if (selectedStore) navigate(`/stores/${selectedStore.id}`);
        }}
      />
    </div>
  );
}

export default StoreDiscovery;

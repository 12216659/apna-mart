import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from './src/config';
const locations = [
  {
    name: 'Home',
    address: 'Kukatpally, Hyderabad',
    detail: 'Near JNTU Metro Station',
  },
  {
    name: 'Work',
    address: 'Madhapur, Hyderabad',
    detail: 'HITEC City, Hyderabad',
  },
];
const categories = [
  { name: 'All', icon: '✨' },
  { name: 'Fruits & Vegetables', icon: '🥑' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Rice & Atta', icon: '🌾' },
  { name: 'Dairy & Eggs', icon: '🥛' },
  { name: 'Snacks', icon: '🍪' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Bakery', icon: '🥐' },
  { name: 'Personal Care', icon: '🧴' },
  { name: 'Household', icon: '🧹' },
  { name: 'Stationery', icon: '✏️' },
];
const storeDetailCategories = [
  'All Products',
  'Fruits & Vegetables',
  'Groceries',
  'Rice & Atta',
  'Dairy & Eggs',
  'Snacks',
  'Beverages',
  'Bakery',
  'Personal Care',
  'Household',
  'Stationery',
];
const filterChips = ['All Stores', 'Open Now', 'Top Rated', 'Fast Delivery'];
const storeSortOptions = [
  'Recommended',
  'Price: Low to High',
  'Price: High to Low',
  'Popular Products',
  'New Arrivals',
];
const fallbackStores = [
  {
    id: 'store-1',
    name: 'Sri Lakshmi General Store',
    category: 'Grocery',
    distance: 180,
    image:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=660&q=85',
    logo: 'SL',
    rating: 4.8,
    reviews: 128,
    isOpen: true,
    deliveryTime: '20-30 min',
    deliveryAvailable: true,
    pickupAvailable: true,
    productCount: 240,
    lat: 17.4478,
    lon: 78.3897,
    tags: ['Delivery', 'Pickup'],
  },
  {
    id: 'store-2',
    name: 'Fresh Basket Mart',
    category: 'Fruits & Vegetables',
    distance: 320,
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=660&q=85',
    logo: 'FB',
    rating: 4.6,
    reviews: 96,
    isOpen: true,
    deliveryTime: '25-35 min',
    deliveryAvailable: true,
    pickupAvailable: false,
    productCount: 196,
    lat: 17.4457,
    lon: 78.3927,
    tags: ['Delivery'],
  },
  {
    id: 'store-3',
    name: 'Sai Kirana & Supermarket',
    category: 'Household',
    distance: 410,
    image:
      'https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=660&q=85',
    logo: 'SK',
    rating: 4.4,
    reviews: 74,
    isOpen: false,
    deliveryTime: '35-45 min',
    deliveryAvailable: false,
    pickupAvailable: true,
    productCount: 142,
    lat: 17.4514,
    lon: 78.3862,
    tags: ['Pickup'],
  },
  {
    id: 'store-4',
    name: 'Green Valley Dairy',
    category: 'Dairy & Eggs',
    distance: 270,
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=660&q=85',
    logo: 'GV',
    rating: 4.9,
    reviews: 215,
    isOpen: true,
    deliveryTime: '15-25 min',
    deliveryAvailable: true,
    pickupAvailable: true,
    productCount: 188,
    lat: 17.4436,
    lon: 78.3904,
    tags: ['Delivery', 'Pickup'],
  },
  {
    id: 'store-5',
    name: 'The Daily Basket',
    category: 'Bakery',
    distance: 460,
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=660&q=85',
    logo: 'DB',
    rating: 4.7,
    reviews: 152,
    isOpen: true,
    deliveryTime: '18-28 min',
    deliveryAvailable: true,
    pickupAvailable: true,
    productCount: 134,
    lat: 17.4492,
    lon: 78.3951,
    tags: ['Delivery', 'Pickup'],
  },
];
const products = [
  {
    name: 'Aashirvaad Atta',
    brand: 'Aashirvaad',
    size: '5 kg',
    price: 289,
    originalPrice: 335,
    stock: 12,
    store: 'Sri Lakshmi General Store',
    category: 'Rice & Atta',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Amul Taaza Milk',
    brand: 'Amul',
    size: '500 ml',
    price: 29,
    originalPrice: 34,
    stock: 18,
    store: 'Fresh Basket Mart',
    category: 'Dairy & Eggs',
    image:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Tata Salt',
    brand: 'Tata',
    size: '1 kg',
    price: 28,
    originalPrice: 34,
    stock: 24,
    store: 'Sai Kirana & Supermarket',
    category: 'Groceries',
    image:
      'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Sunflower Oil',
    brand: 'Fortune',
    size: '1 L',
    price: 149,
    originalPrice: 179,
    stock: 9,
    store: 'Sri Lakshmi General Store',
    category: 'Groceries',
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Basmati Rice',
    brand: 'India Gate',
    size: '5 kg',
    price: 549,
    originalPrice: 620,
    stock: 7,
    store: 'Fresh Basket Mart',
    category: 'Rice & Atta',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Parle-G Biscuits',
    brand: 'Parle',
    size: '250 g',
    price: 25,
    originalPrice: 32,
    stock: 26,
    store: 'Sri Lakshmi General Store',
    category: 'Snacks',
    image:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=620&q=85',
  },
];
const tabs = [
  { name: 'Home', icon: '⌂' },
  { name: 'Stores', icon: '▣' },
  { name: 'Cart', icon: '🛒' },
  { name: 'Orders', icon: '▤' },
  { name: 'Profile', icon: '♙' },
];
function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}
function ActionButton({ title, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}
function ProductCard({
  product,
  quantity,
  favourite,
  onAdd,
  onToggleFavourite,
  onOpen,
  showStoreName = true,
}) {
  return (
    <View style={styles.productCard}>
      <Pressable
        accessibilityLabel={
          favourite ? 'Remove from favourites' : 'Add to favourites'
        }
        onPress={() => onToggleFavourite(product.name)}
        style={styles.favouriteButton}
      >
        <Text
          style={[styles.favouriteText, favourite && styles.favouriteActive]}
        >
          {favourite ? '♥' : '♡'}
        </Text>
      </Pressable>
      <Pressable onPress={() => onOpen(product)}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
      </Pressable>
      <View style={styles.productDetails}>
        <Text style={styles.productBrand}>{product.brand}</Text>
        <Text numberOfLines={1} style={styles.productName}>
          {product.name}
        </Text>
        <Text style={styles.mutedText}>
          {product.size}
          {showStoreName ? ` · ${product.store}` : ''}
        </Text>
        <View style={styles.productBuyRow}>
          <View>
            <Text style={styles.productPrice}>₹{product.price}</Text>
            <Text style={styles.previewPrice}>Preview price</Text>
          </View>
          <View style={styles.quantityControl}>
            {quantity > 0 ? (
              <>
                <Pressable
                  accessibilityLabel="Remove one"
                  onPress={() => onAdd(product, -1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable
                  accessibilityLabel="Add one"
                  onPress={() => onAdd(product, 1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityLabel={`Add ${product.name} to cart`}
                onPress={() => onAdd(product, 1)}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
function StoreCard({ store, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.storeCard}>
      <Image source={{ uri: store.image }} style={styles.storeImage} />
      <View style={styles.storeDetails}>
        <View style={styles.storeInitials}>
          <Text style={styles.storeInitialsText}>{store.logo ?? store.initials ?? 'SL'}</Text>
        </View>
        <View style={styles.storeCopy}>
          <Text numberOfLines={1} style={styles.storeName}>
            {store.name}
          </Text>
          <Text numberOfLines={1} style={styles.mutedText}>
            {store.category}
          </Text>
          <Text style={styles.storeDistance}>
            ⌖ {store.distance} m away · {store.tags.join(' · ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
function StoreSearchBar({ value, onSearchChange }) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (!value) {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(inputValue), 250);
    return () => clearTimeout(timeout);
  }, [inputValue, onSearchChange]);

  return (
    <View style={styles.storeSearchBar}>
      <Text style={styles.storeSearchIcon}>⌕</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setInputValue}
        onSubmitEditing={() => onSearchChange(inputValue)}
        placeholder="Search stores or products..."
        placeholderTextColor={COLORS.muted}
        returnKeyType="search"
        spellCheck={false}
        style={styles.storeSearchInput}
        value={inputValue}
      />
      <Pressable
        accessibilityLabel="Clear store search"
        accessibilityRole="button"
        disabled={!inputValue}
        onPress={() => setInputValue('')}
        style={[
          styles.storeSearchClear,
          !inputValue && styles.storeSearchClearDisabled,
        ]}
      >
        <Text style={styles.storeSearchClearText}>×</Text>
      </Pressable>
    </View>
  );
}
function LoginScreen({ onBack, onSignedIn }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    setFormError('');
    setIsSubmitting(true);
    const endpoint = isRegistering ? 'register' : 'login';
    const payload = isRegistering
      ? { name, username, phone, password }
      : { identifier, password };
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.token || !result.user) {
        throw new Error(
          result.message || 'Unable to continue. Please try again.',
        );
      }
      await onSignedIn({ token: result.token, user: result.user });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to Apna Mart.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.loginPage}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ Back to shopping</Text>
        </Pressable>
        <View style={styles.loginCard}>
          <Text style={styles.loginBrand}>
            🛍 APNA <Text style={styles.brandHighlight}>MART</Text>
          </Text>
          <Text style={styles.loginTagline}>Apni Dukaan, Ab Aapke Paas.</Text>
          <Text style={styles.loginTitle}>
            {isRegistering ? 'Create your account' : 'Welcome back!'}
          </Text>
          <Text style={styles.loginSubtitle}>
            {isRegistering
              ? 'Create an account to continue shopping.'
              : 'Sign in with your username or mobile number.'}
          </Text>

          {isRegistering ? (
            <>
              <Text style={styles.inputLabel}>Full name</Text>
              <TextInput
                autoCapitalize="words"
                maxLength={80}
                onChangeText={setName}
                placeholder="Your name"
                style={styles.textInput}
                value={name}
              />
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                autoCapitalize="none"
                maxLength={30}
                onChangeText={setUsername}
                placeholder="Choose a username"
                style={styles.textInput}
                value={username}
              />
              <Text style={styles.inputLabel}>Mobile number (optional)</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                onChangeText={value => setPhone(value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                style={styles.textInput}
                value={phone}
              />
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Username or mobile number</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setIdentifier}
                placeholder="Enter username or 10-digit number"
                style={styles.textInput}
                value={identifier}
              />
            </>
          )}
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            autoCapitalize="none"
            maxLength={72}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            style={styles.textInput}
            value={password}
          />
          {formError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {formError}
            </Text>
          ) : null}
          <ActionButton
            disabled={
              isSubmitting ||
              !password ||
              (isRegistering ? !name || !username : !identifier)
            }
            onPress={submit}
            title={
              isSubmitting
                ? 'Please wait...'
                : isRegistering
                ? 'Create account'
                : 'Continue'
            }
          />
          {isSubmitting ? (
            <ActivityIndicator
              color={COLORS.green}
              style={styles.submitSpinner}
            />
          ) : null}
          <View style={styles.authSwitch}>
            <Text style={styles.mutedText}>
              {isRegistering
                ? 'Already have an account? '
                : 'New to Apna Mart? '}
            </Text>
            <Pressable
              onPress={() => {
                setIsRegistering(!isRegistering);
                setFormError('');
              }}
            >
              <Text style={styles.linkText}>
                {isRegistering ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.legalNote}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const COLORS = {
  green: '#1d6848',
  darkGreen: '#154b36',
  paleGreen: '#eaf4ed',
  cream: '#fbfaf6',
  text: '#24312a',
  muted: '#758078',
  border: '#e8ebe6',
  white: '#ffffff',
  storeGreen: '#159447',
  storeLightGreen: '#eef8f1',
};
function AppContent() {
  const [screen, setScreen] = useState('Home');
  const [cart, setCart] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedFulfillment, setSelectedFulfillment] = useState(null);
  const [fulfillmentPreferences, setFulfillmentPreferences] = useState({});
  const [locationIndex, setLocationIndex] = useState(0);
  const [locationsVisible, setLocationsVisible] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [addressDraft, setAddressDraft] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 17.385,
    longitude: 78.4867,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [stores, setStores] = useState(fallbackStores);
  const [storeSearchLoading, setStoreSearchLoading] = useState(false);
  const [activeStoreFilter, setActiveStoreFilter] = useState('All Stores');
  const [activeStoreCategory, setActiveStoreCategory] = useState('All');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [storeProductQuery, setStoreProductQuery] = useState('');
  const [storeProductCategory, setStoreProductCategory] = useState('All Products');
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [sortOption, setSortOption] = useState('Recommended');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [priceFilter, setPriceFilter] = useState('Any');
  const androidMapsApiKeyConfigured =
    Constants.expoConfig?.extra?.googleMapsAndroidApiKeyConfigured === true;
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getItem('apnaMartSession');
        if (saved) {
          setSession(JSON.parse(saved));
        }
      } catch {
        setSessionError('Your saved sign-in could not be restored.');
      } finally {
        setSessionLoading(false);
      }
    };
    restoreSession();
  }, []);
  const loadNearbyStores = useCallback(async () => {
    const currentLat = currentCoordinates?.latitude ?? 17.4474;
    const currentLng = currentCoordinates?.longitude ?? 78.3892;
    setStoreSearchLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stores?latitude=${currentLat}&longitude=${currentLng}&within=500&limit=20`,
      );
      if (!response.ok) {
        throw new Error('Unable to load nearby stores');
      }
      const payload = await response.json();
      if (Array.isArray(payload.stores) && payload.stores.length > 0) {
        setStores(payload.stores);
        return;
      }
    } catch {
      // Fallback to local sample data when the API is unavailable.
    } finally {
      setStoreSearchLoading(false);
    }
    setStores(fallbackStores);
  }, [currentCoordinates]);
  useEffect(() => {
    loadNearbyStores();
  }, [loadNearbyStores]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const selectedLocation = customLocation || locations[locationIndex].address;
  const locateMe = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError(
          'Location permission is needed to show your position on the map.',
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCurrentCoordinates(coordinates);
      setMapRegion({
        ...coordinates,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setCustomLocation('Current location');
      setLocationsVisible(false);
    } catch {
      setLocationError(
        "Couldn't get your location. Check device location services and try again.",
      );
    } finally {
      setLocationLoading(false);
    }
  };
  const filteredProducts = useMemo(() => {
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
  }, [activeCategory, searchValue]);
  const filteredStores = useMemo(() => {
    const query = storeSearchQuery.trim().toLowerCase();
    const matchesSearch = store => {
      if (!query) return true;
      const tags = Array.isArray(store.tags) ? store.tags.join(' ') : '';
      return `${store.name} ${store.category} ${tags}`
        .toLowerCase()
        .includes(query);
    };
    const matchesCategory = store =>
      activeStoreCategory === 'All' || store.category === activeStoreCategory;
    const matchesFilter = store => {
      switch (activeStoreFilter) {
        case 'Open Now':
          return store.isOpen;
        case 'Top Rated':
          return store.rating >= 4.6;
        case 'Fast Delivery':
          return Number.parseInt(store.deliveryTime, 10) <= 25;
        default:
          return true;
      }
    };
    return [...stores]
      .filter(store => matchesSearch(store) && matchesCategory(store) && matchesFilter(store))
      .sort((a, b) => a.distance - b.distance);
  }, [activeStoreCategory, activeStoreFilter, storeSearchQuery, stores]);
  const selectedStoreProducts = useMemo(
    () =>
      products.filter(product => product.store === selectedStore?.name),
    [selectedStore],
  );
  const availableStoreCategories = useMemo(() => {
    const set = new Set(['All Products']);
    selectedStoreProducts.forEach(product => {
      set.add(product.category);
    });
    return storeDetailCategories.filter(category => set.has(category));
  }, [selectedStoreProducts]);
  const filteredStoreProducts = useMemo(() => {
    const query = storeProductQuery.trim().toLowerCase();
    const normalizedCategory = product => product.category;
    const matchesQuery = product =>
      !query ||
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(query);
    const matchesCategory = product =>
      storeProductCategory === 'All Products' ||
      normalizedCategory(product) === storeProductCategory;
    const matchesStock = product =>
      !inStockOnly || Number(product.stock ?? 0) > 0;
    const matchesSale = product =>
      !onSaleOnly ||
      Number(product.originalPrice ?? product.price) > Number(product.price);
    const matchesBrand = product =>
      brandFilter === 'All Brands' || product.brand === brandFilter;
    const matchesPrice = product => {
      if (priceFilter === 'Any') return true;
      const price = Number(product.price);
      if (priceFilter === 'Under ₹100') return price < 100;
      if (priceFilter === '₹100 - ₹250') return price >= 100 && price <= 250;
      if (priceFilter === '₹250+') return price > 250;
      return true;
    };
    const items = [...selectedStoreProducts].filter(
      product =>
        matchesQuery(product) &&
        matchesCategory(product) &&
        matchesStock(product) &&
        matchesSale(product) &&
        matchesBrand(product) &&
        matchesPrice(product),
    );
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
  }, [
    brandFilter,
    inStockOnly,
    onSaleOnly,
    priceFilter,
    selectedStoreProducts,
    sortOption,
    storeProductCategory,
    storeProductQuery,
  ]);
  const selectedStoreCartItems = useMemo(
    () =>
      selectedStore
        ? cart.filter(item => item.store === selectedStore.name)
        : [],
    [cart, selectedStore],
  );
  const selectedStoreCartCount = selectedStoreCartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const selectedStoreCartTotal = selectedStoreCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const getDefaultFulfillment = store => {
    if (store?.deliveryAvailable) return 'delivery';
    if (store?.pickupAvailable) return 'pickup';
    return null;
  };
  const isFulfillmentAvailable = (store, method) =>
    method === 'delivery'
      ? Boolean(store?.deliveryAvailable)
      : method === 'pickup'
        ? Boolean(store?.pickupAvailable)
        : false;
  const openStore = store => {
    const key = String(store.id ?? store.name);
    const cartMethod = cart.find(item => item.store === store.name)
      ?.fulfillmentMethod;
    const preferredMethod =
      cartMethod || fulfillmentPreferences[key] || getDefaultFulfillment(store);
    const method = isFulfillmentAvailable(store, preferredMethod)
      ? preferredMethod
      : getDefaultFulfillment(store);
    setSelectedFulfillment(method);
    setFulfillmentPreferences(current => ({ ...current, [key]: method }));
    if (method) {
      setCart(current =>
        current.map(item =>
          item.store === store.name
            ? { ...item, fulfillmentMethod: method }
            : item,
        ),
      );
    }
    setSelectedStore(store);
  };
  const selectFulfillment = method => {
    if (!selectedStore || !isFulfillmentAvailable(selectedStore, method)) return;
    const key = String(selectedStore.id ?? selectedStore.name);
    setSelectedFulfillment(method);
    setFulfillmentPreferences(current => ({ ...current, [key]: method }));
    setCart(current =>
      current.map(item =>
        item.store === selectedStore.name
          ? { ...item, fulfillmentMethod: method }
          : item,
      ),
    );
  };
  const cartStore = cart.length
    ? stores.find(store => store.name === cart[0].store)
    : null;
  const cartFulfillmentMethod = cart[0]?.fulfillmentMethod ?? null;
  const cartFulfillmentAvailable = isFulfillmentAvailable(
    cartStore,
    cartFulfillmentMethod,
  );
  const cartMinimumOrderValue =
    cartStore?.minimumOrder ?? cartStore?.minimum_order;
  const hasCartMinimumOrder =
    cartMinimumOrderValue !== null &&
    cartMinimumOrderValue !== undefined &&
    cartMinimumOrderValue !== '' &&
    Number.isFinite(Number(cartMinimumOrderValue));
  const cartMinimumOrderMet =
    !hasCartMinimumOrder || subtotal >= Number(cartMinimumOrderValue);
  const cartCheckoutEligible =
    cartFulfillmentAvailable && cartMinimumOrderMet;
  const cartDeliveryFee =
    cartFulfillmentMethod === 'delivery' &&
    cartStore?.deliveryFee !== null &&
    cartStore?.deliveryFee !== undefined &&
    cartStore?.deliveryFee !== '' &&
    Number.isFinite(Number(cartStore.deliveryFee))
      ? Number(cartStore.deliveryFee)
      : null;
  const cartPickupFeeValue = cartStore?.pickupFee ?? cartStore?.pickup_fee;
  const cartPickupFee =
    cartPickupFeeValue !== null &&
    cartPickupFeeValue !== undefined &&
    cartPickupFeeValue !== '' &&
    Number.isFinite(Number(cartPickupFeeValue))
      ? Number(cartPickupFeeValue)
      : null;
  const selectedStoreDeliveryFee = selectedStore?.deliveryFee;
  const hasSelectedStoreDeliveryFee =
    selectedStoreDeliveryFee !== null &&
    selectedStoreDeliveryFee !== undefined &&
    selectedStoreDeliveryFee !== '' &&
    Number.isFinite(Number(selectedStoreDeliveryFee));
  const selectedStorePickupFee =
    selectedStore?.pickupFee ?? selectedStore?.pickup_fee;
  const hasSelectedStorePickupFee =
    selectedStorePickupFee !== null &&
    selectedStorePickupFee !== undefined &&
    selectedStorePickupFee !== '' &&
    Number.isFinite(Number(selectedStorePickupFee));
  const selectedStorePickupTime =
    selectedStore?.pickupPreparationTime ??
    selectedStore?.pickup_preparation_time ??
    selectedStore?.pickupTime;
  const selectedStoreMinimumOrder =
    selectedStore?.minimumOrder ?? selectedStore?.minimum_order;
  const changeCart = (product, amount) => {
    const productStore = stores.find(store => store.name === product.store);
    const defaultMethod = getDefaultFulfillment(productStore);
    const fulfillmentMethod =
      selectedStore?.name === product.store && selectedFulfillment
        ? selectedFulfillment
        : cart[0]?.store === product.store
          ? cart[0].fulfillmentMethod ?? defaultMethod
          : defaultMethod;
    const existingStore = cart[0]?.store;
    if (amount > 0 && existingStore && existingStore !== product.store) {
      Alert.alert(
        'Your cart contains items from another store. Do you want to clear your existing cart and add products from this store?',
        '',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Cart & Continue',
            onPress: () =>
              setCart([
                { ...product, fulfillmentMethod, quantity: amount },
              ]),
          },
        ],
      );
      return;
    }
    setCart(current => {
      const item = current.find(entry => entry.name === product.name);
      if (!item && amount < 0) return current;
      if (!item) {
        return [
          ...current,
          { ...product, fulfillmentMethod, quantity: amount },
        ];
      }
      return current
        .map(entry =>
          entry.name === product.name
            ? {
                ...entry,
                fulfillmentMethod:
                  entry.fulfillmentMethod ?? fulfillmentMethod,
                quantity: entry.quantity + amount,
              }
            : entry,
        )
        .filter(entry => entry.quantity > 0);
    });
  };
  const toggleFavourite = name => {
    setFavourites(current =>
      current.includes(name)
        ? current.filter(item => item !== name)
        : [...current, name],
    );
  };
  const signIn = async value => {
    await AsyncStorage.setItem('apnaMartSession', JSON.stringify(value));
    setSession(value);
    setSessionError('');
    setScreen('Profile');
  };
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('apnaMartSession');
      setSession(null);
    } catch {
      Alert.alert(
        'Sign out failed',
        'Your saved sign-in could not be removed. Please try again.',
      );
    }
  };
  const renderProduct = product => (
    <ProductCard
      favourite={favourites.includes(product.name)}
      key={product.name}
      onAdd={changeCart}
      onOpen={setSelectedProduct}
      onToggleFavourite={toggleFavourite}
      product={product}
      quantity={cart.find(item => item.name === product.name)?.quantity ?? 0}
    />
  );
  const renderStore = store => (
    <StoreCard
      key={store.name}
      onPress={() => openStore(store)}
      store={store}
    />
  );
  const renderHome = () => (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => setLocationsVisible(true)}
        style={styles.locationCard}
      >
        <Text style={styles.locationPin}>⌖</Text>
        <View style={styles.locationCopy}>
          <Text style={styles.locationEyebrow}>DELIVERING TO ▾</Text>
          <Text numberOfLines={1} style={styles.locationAddress}>
            {customLocation === 'Current location'
              ? 'Current location'
              : customLocation
                ? 'Other'
                : locations[locationIndex].name}{' '}
            · {selectedLocation}
          </Text>
          <Text style={styles.locationDetail}>
            {customLocation === 'Current location'
              ? 'Using device GPS'
              : customLocation
                ? 'Saved address'
                : locations[locationIndex].detail}
          </Text>
        </View>
        <Text style={styles.locationChevron}>⌄</Text>
      </Pressable>

      <TextInput
        onChangeText={value => {
          setSearchValue(value);
          setActiveCategory('');
        }}
        placeholder="Search products, stores and more"
        placeholderTextColor={COLORS.muted}
        returnKeyType="search"
        style={styles.searchInput}
        value={searchValue}
      />

      <View style={styles.heroBanner}>
        <Text style={styles.heroEyebrow}>✦ YOUR NEIGHBOURHOOD, DELIVERED</Text>
        <Text style={styles.heroTitle}>
          Fresh finds,{`\n`}closer than ever.
        </Text>
        <Text style={styles.heroDescription}>
          Your favourite local shops, just a few taps away.
        </Text>
        <Pressable
          onPress={() => setScreen('Stores')}
          style={styles.heroButton}
        >
          <Text style={styles.heroButtonText}>Explore nearby ›</Text>
        </Pressable>
      </View>

      <SectionTitle
        title="Shop by category"
        subtitle="Everyday essentials, all in one place."
      />
      <ScrollView
        horizontal
        contentContainerStyle={styles.categoryRow}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(category => {
          const selected = activeCategory === category.name;
          return (
            <Pressable
              key={category.name}
              onPress={() => {
                setActiveCategory(selected ? '' : category.name);
                setSearchValue('');
              }}
              style={[styles.categoryItem, selected && styles.categorySelected]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selected && styles.categoryNameSelected,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionBlock}>
        <SectionTitle
          title="Stores near you"
          subtitle={`Local favourites around ${
            customLocation ? 'your area' : 'Kukatpally'
          }.`}
        />
        <ScrollView
          horizontal
          contentContainerStyle={styles.storeRow}
          showsHorizontalScrollIndicator={false}
        >
          {stores.map(renderStore)}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <SectionTitle
          title={
            searchValue
              ? 'Search results'
              : activeCategory || 'Popular products'
          }
          subtitle="Sample prices shown for preview."
        />
        <View style={styles.productGrid}>
          {filteredProducts.length ? (
            filteredProducts.map(renderProduct)
          ) : (
            <Text style={styles.emptyText}>
              No matching products yet. Try another search or category.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ✦ Preview · Sample stores and prices shown for illustration.
        </Text>
      </View>
    </ScrollView>
  );
  const renderStores = () => (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => setLocationsVisible(true)}
        style={styles.locationCard}
      >
        <Text style={styles.locationPin}>⌖</Text>
        <View style={styles.locationCopy}>
          <Text style={styles.locationEyebrow}>DELIVERING TO ▾</Text>
          <Text numberOfLines={1} style={styles.locationAddress}>
            {customLocation === 'Current location'
              ? 'Current location'
              : customLocation
                ? 'Other'
                : locations[locationIndex].name}{' '}
            · {selectedLocation}
          </Text>
          <Text style={styles.locationDetail}>
            {customLocation === 'Current location'
              ? 'Using device GPS'
              : customLocation
                ? 'Saved address'
                : locations[locationIndex].detail}
          </Text>
        </View>
        <Text style={styles.locationChevron}>⌄</Text>
      </Pressable>

      <StoreSearchBar
        onSearchChange={setStoreSearchQuery}
        value={storeSearchQuery}
      />

      <View style={styles.storeDiscoveryHeader}>
        <Text style={styles.storeDiscoveryTitle}>Stores Near You</Text>
        <Text style={styles.storeDiscoverySubtitle}>
          Discover trusted stores around your location.
        </Text>
        <Text style={styles.storeDiscoveryMeta}>
          Showing {filteredStores.length} stores within 500 metres
        </Text>
      </View>

      {storeSearchLoading ? (
        <ActivityIndicator color={COLORS.green} style={styles.storeLoading} />
      ) : null}

      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        {filterChips.map(filter => {
          const selected = filter === activeStoreFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveStoreFilter(filter)}
              style={[
                styles.filterChip,
                selected && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        contentContainerStyle={styles.categoryRow}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(category => {
          const selected = activeStoreCategory === category.name;
          return (
            <Pressable
              key={category.name}
              onPress={() => setActiveStoreCategory(category.name)}
              style={[
                styles.categoryItem,
                selected && styles.categorySelected,
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selected && styles.categoryNameSelected,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.viewToggleRow}>
        <View style={styles.viewToggleWrap}>
          {['list', 'map'].map(option => {
            const selected = option === viewMode;
            return (
              <Pressable
                key={option}
                onPress={() => setViewMode(option)}
                style={[
                  styles.viewToggleButton,
                  selected && styles.viewToggleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.viewToggleText,
                    selected && styles.viewToggleTextActive,
                  ]}
                >
                  {option === 'list' ? 'List View' : 'Map View'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {Platform.OS === 'android' && !androidMapsApiKeyConfigured ? (
            <View style={styles.mapUnavailable}>
              <Text style={styles.mapUnavailableText}>
                Add GOOGLE_MAPS_ANDROID_API_KEY to .env to enable the map.
              </Text>
            </View>
          ) : (
            <MapView
              initialRegion={mapRegion}
              onRegionChangeComplete={setMapRegion}
              region={mapRegion}
              showsMyLocationButton={Boolean(currentCoordinates)}
              showsUserLocation={Boolean(currentCoordinates)}
              style={styles.map}
            >
              {currentCoordinates ? (
                <Marker
                  coordinate={currentCoordinates}
                  title="Your current location"
                />
              ) : null}
              {filteredStores.map(store => (
                <Marker
                  coordinate={{ latitude: store.lat, longitude: store.lon }}
                  key={store.id}
                  onPress={() => openStore(store)}
                  pinColor={store.isOpen ? '#159447' : '#8c9792'}
                  title={store.name}
                />
              ))}
            </MapView>
          )}
        </View>
      ) : null}

      <View style={styles.storeActionsRow}>
        <ActionButton
          disabled={locationLoading}
          onPress={locateMe}
          title={
            locationLoading
              ? 'Finding your location...'
              : 'Use my current location'
          }
        />
      </View>

      {locationError ? (
        <Text style={styles.errorText}>{locationError}</Text>
      ) : null}

      {viewMode === 'list' ? (
        <View style={styles.storeList}>
          {filteredStores.length ? (
            filteredStores.map(store => (
              <Pressable
                key={store.id}
                onPress={() => openStore(store)}
                style={styles.discoveryStoreCard}
              >
                <Image source={{ uri: store.image }} style={styles.discoveryStoreImage} />
                <View style={styles.discoveryStoreBody}>
                  <View style={styles.discoveryStoreHeaderRow}>
                    <View style={styles.discoveryStoreBadge}>
                      <Text style={styles.discoveryStoreBadgeText}>{store.logo}</Text>
                    </View>
                    <View style={styles.discoveryStoreInfo}>
                      <Text style={styles.discoveryStoreName}>{store.name}</Text>
                      <Text style={styles.discoveryStoreCategory}>{store.category}</Text>
                      <Text style={styles.discoveryStoreMetaRow}>
                        {store.distance} m away · {store.rating.toFixed(1)} ★
                      </Text>
                    </View>
                  </View>
                  <View style={styles.discoveryStorePillRow}>
                    <Text
                      style={[
                        styles.discoveryStorePill,
                        store.isOpen && styles.discoveryStorePillActive,
                      ]}
                    >
                      {store.isOpen ? 'Open Now' : 'Closed'}
                    </Text>
                    <Text style={styles.discoveryStorePill}>Delivery: {store.deliveryTime}</Text>
                  </View>
                  <Text style={styles.discoveryStoreDetail}>
                    {store.deliveryAvailable ? 'Delivery available' : 'Delivery unavailable'} ·{' '}
                    {store.pickupAvailable ? 'Pickup available' : 'Pickup unavailable'}
                  </Text>
                  <View style={styles.discoveryStoreFooter}>
                    <Text style={styles.discoveryStoreFooterText}>
                      {store.productCount} products
                    </Text>
                    <Pressable
                      onPress={() => openStore(store)}
                      style={styles.discoveryActionButton}
                    >
                      <Text style={styles.discoveryActionText}>View Store</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No stores match your search or current filters. Try clearing filters.
            </Text>
          )}
        </View>
      ) : null}

      {viewMode === 'map' && filteredStores.length === 0 ? (
        <Text style={styles.emptyText}>
          No stores match your search or current filters. Try clearing filters.
        </Text>
      ) : null}
      {activeStoreFilter !== 'All Stores' ||
      activeStoreCategory !== 'All' ||
      storeSearchQuery ? (
        <Pressable
          onPress={() => {
            setActiveStoreFilter('All Stores');
            setActiveStoreCategory('All');
            setStoreSearchQuery('');
          }}
          style={styles.clearFilterButton}
        >
          <Text style={styles.clearFilterText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
  const renderCart = () => (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <SectionTitle
        title="Your cart"
        subtitle={
          cart.length ? `From ${cart[0].store}` : 'Good things start here.'
        }
      />
      {cart.length ? (
        <>
          {cart.map(item => (
            <View key={item.name} style={styles.cartRow}>
              <Image source={{ uri: item.image }} style={styles.cartImage} />
              <View style={styles.cartCopy}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.mutedText}>
                  {item.size} · ₹{item.price}
                </Text>
                <View style={styles.cartQuantity}>
                  <Pressable
                    onPress={() => changeCart(item, -1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => changeCart(item, 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.productPrice}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
          <View style={styles.cartFulfillmentCard}>
            <View style={styles.cartFulfillmentHeader}>
              <Text style={styles.cartFulfillmentTitle}>
                {cartFulfillmentMethod === 'delivery'
                  ? '🚚 Home Delivery'
                  : cartFulfillmentMethod === 'pickup'
                    ? '🏬 Store Pickup'
                    : 'Fulfilment not selected'}
              </Text>
              {cartStore ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    openStore(cartStore);
                    setScreen('Stores');
                  }}
                  style={styles.changeFulfillmentButton}
                >
                  <Text style={styles.changeFulfillmentText}>Change</Text>
                </Pressable>
              ) : null}
            </View>
            {cartFulfillmentMethod === 'delivery' ? (
              <>
                <Text style={styles.cartFulfillmentText}>
                  Deliver to: {selectedLocation}
                </Text>
                {cartStore?.deliveryTime ? (
                  <Text style={styles.cartFulfillmentText}>
                    Estimated time: {cartStore.deliveryTime}
                  </Text>
                ) : null}
                {cartDeliveryFee !== null ? (
                  <Text style={styles.cartFulfillmentText}>
                    Delivery fee:{' '}
                    {cartDeliveryFee === 0
                      ? 'FREE DELIVERY'
                      : `₹${cartDeliveryFee}`}
                  </Text>
                ) : (
                  <Text style={styles.cartFulfillmentText}>
                    Delivery fee has not been provided by the store.
                  </Text>
                )}
              </>
            ) : cartFulfillmentMethod === 'pickup' ? (
              <>
                <Text style={styles.cartFulfillmentText}>
                  Pickup at: {cartStore?.address || 'Store address not provided'}
                </Text>
                {cartStore?.pickupPreparationTime ||
                cartStore?.pickup_preparation_time ||
                cartStore?.pickupTime ? (
                  <Text style={styles.cartFulfillmentText}>
                    Preparation time:{' '}
                    {cartStore.pickupPreparationTime ??
                      cartStore.pickup_preparation_time ??
                      cartStore.pickupTime}
                  </Text>
                ) : null}
                {cartPickupFee !== null ? (
                  <Text style={styles.cartFulfillmentText}>
                    Pickup fee:{' '}
                    {cartPickupFee === 0
                      ? 'No pickup fee'
                      : `₹${cartPickupFee}`}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.cartFulfillmentText}>
                Select an available fulfilment option in the store page before
                checkout.
              </Text>
            )}
            {!cartFulfillmentAvailable ? (
              <Text style={styles.errorText}>
                This fulfilment option is no longer available. Return to the
                store and select another option.
              </Text>
            ) : null}
            {hasCartMinimumOrder && !cartMinimumOrderMet ? (
              <Text style={styles.errorText}>
                This store requires a minimum order of ₹
                {cartMinimumOrderValue}.
              </Text>
            ) : null}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.sectionHeading}>Items subtotal</Text>
            <Text style={styles.sectionHeading}>₹{subtotal}</Text>
          </View>
          {cartFulfillmentMethod === 'delivery' &&
          cartDeliveryFee !== null ? (
            <View style={styles.totalRow}>
              <Text style={styles.mutedText}>Delivery fee</Text>
              <Text style={styles.mutedText}>
                {cartDeliveryFee === 0
                  ? 'FREE'
                  : `₹${cartDeliveryFee}`}
              </Text>
            </View>
          ) : null}
          {cartFulfillmentMethod === 'pickup' && cartPickupFee !== null ? (
            <View style={styles.totalRow}>
              <Text style={styles.mutedText}>Pickup fee</Text>
              <Text style={styles.mutedText}>
                {cartPickupFee === 0 ? 'No pickup fee' : `₹${cartPickupFee}`}
              </Text>
            </View>
          ) : null}
          {cartFulfillmentAvailable &&
          (cartFulfillmentMethod === 'pickup'
            ? cartPickupFee !== null
            : cartDeliveryFee !== null) ? (
            <View style={styles.totalRow}>
              <Text style={styles.sectionHeading}>Estimated total</Text>
              <Text style={styles.sectionHeading}>
                ₹
                {subtotal +
                  (cartFulfillmentMethod === 'pickup'
                    ? cartPickupFee
                    : cartDeliveryFee)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.previewPrice}>
            Estimate only · final product prices, fees and order total must be
            confirmed by the store at checkout.
          </Text>
          <ActionButton
            disabled={!cartCheckoutEligible}
            onPress={() => {
              if (!cartFulfillmentAvailable) {
                Alert.alert(
                  'Choose an available fulfilment option',
                  'Return to the store page and select delivery or pickup before checkout.',
                );
                return;
              }
              Alert.alert(
                'Checkout coming soon',
                'Your selected fulfilment option is saved with this cart. Checkout and final server-side order validation are not connected yet.',
              );
            }}
            title={
              !cartFulfillmentAvailable
                ? 'Fulfilment unavailable'
                : cartMinimumOrderMet
                  ? 'Continue to checkout'
                  : 'Minimum order not met'
            }
          />
        </>
      ) : (
        <Text style={styles.emptyText}>
          Your cart is waiting for something good. Add a few local favourites to
          get started.
        </Text>
      )}
    </ScrollView>
  );
  const renderOrders = () => (
    <View style={styles.centeredContent}>
      <Text style={styles.largeEmoji}>📦</Text>
      <Text style={styles.sectionHeading}>Your orders</Text>
      <Text style={styles.emptyText}>
        Your orders will appear here after you place one.
      </Text>
    </View>
  );
  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <SectionTitle
        title="Your account"
        subtitle="Manage your Apna Mart account."
      />
      {sessionLoading ? (
        <ActivityIndicator color={COLORS.green} />
      ) : session ? (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {session.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sectionHeading}>
            Welcome, {session.user.name}
          </Text>
          <Text style={styles.mutedText}>
            {session.user.username || session.user.phone || session.user.email}
          </Text>
          <ActionButton onPress={signOut} title="Sign out" />
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Text style={styles.largeEmoji}>👋</Text>
          <Text style={styles.sectionHeading}>Welcome to Apna Mart</Text>
          <Text style={styles.mutedText}>
            Sign in to manage your addresses, saved items and account details.
          </Text>
          {sessionError ? (
            <Text style={styles.errorText}>{sessionError}</Text>
          ) : null}
          <ActionButton
            onPress={() => setScreen('Login')}
            title="Sign in or create account"
          />
        </View>
      )}
    </ScrollView>
  );
  const renderCurrentScreen = () => {
    switch (screen) {
      case 'Home':
        return renderHome();
      case 'Stores':
        return renderStores();
      case 'Cart':
        return renderCart();
      case 'Orders':
        return renderOrders();
      case 'Profile':
        return renderProfile();
      case 'Login':
        return (
          <LoginScreen
            onBack={() => setScreen('Profile')}
            onSignedIn={signIn}
          />
        );
    }
  };
  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar barStyle="dark-content" />
      {screen === 'Login' ? (
        renderCurrentScreen()
      ) : (
        <>
          <View style={styles.appHeader}>
            <Pressable
              onPress={() => setScreen('Home')}
              style={styles.brandLockup}
            >
              <Text style={styles.brandIcon}>🛍</Text>
              <View>
                <Text style={styles.brandName}>
                  APNA <Text style={styles.brandHighlight}>MART</Text>
                </Text>
                <Text style={styles.brandTagline}>
                  Apni Dukaan, Ab Aapke Paas.
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Your profile"
              onPress={() => setScreen('Profile')}
              style={styles.headerProfile}
            >
              <Text style={styles.headerProfileText}>
                {session ? session.user.name.charAt(0).toUpperCase() : '♙'}
              </Text>
            </Pressable>
          </View>
          {renderCurrentScreen()}
          <View style={styles.bottomNavigation}>
            {tabs.map(tab => (
              <Pressable
                key={tab.name}
                onPress={() => setScreen(tab.name)}
                style={styles.navItem}
              >
                <View>
                  <Text
                    style={[
                      styles.navIcon,
                      screen === tab.name && styles.navIconActive,
                    ]}
                  >
                    {tab.icon}
                  </Text>
                  {tab.name === 'Cart' && cartCount > 0 ? (
                    <Text style={styles.cartBadge}>{cartCount}</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.navLabel,
                    screen === tab.name && styles.navLabelActive,
                  ]}
                >
                  {tab.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Modal
        animationType="slide"
        onRequestClose={() => setLocationsVisible(false)}
        transparent
        visible={locationsVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a delivery address</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setLocationsVisible(false)}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            {locations.map(location => (
              <Pressable
                key={location.name}
                onPress={() => {
                  setLocationIndex(locations.indexOf(location));
                  setCustomLocation('');
                  setLocationsVisible(false);
                }}
                style={styles.locationOption}
              >
                <Text style={styles.locationOptionIcon}>
                  {location.name === 'Home' ? '⌂' : '▣'}
                </Text>
                <View>
                  <Text style={styles.productName}>{location.name}</Text>
                  <Text style={styles.mutedText}>{location.address}</Text>
                </View>
              </Pressable>
            ))}
            <Text style={styles.inputLabel}>Add another address</Text>
            <TextInput
              onChangeText={setAddressDraft}
              placeholder="Area or address"
              style={styles.textInput}
              value={addressDraft}
            />
            <ActionButton
              disabled={!addressDraft.trim()}
              onPress={() => {
                setCustomLocation(addressDraft.trim());
                setAddressDraft('');
                setLocationsVisible(false);
              }}
              title="Save address"
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setSelectedProduct(null);
          setSelectedStore(null);
        }}
        transparent
        visible={Boolean(selectedProduct || selectedStore)}
      >
        <View style={styles.modalBackdrop}>
          {selectedProduct ? (
            <View style={styles.productSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Pressable
                  accessibilityLabel="Close"
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.modalClose}>×</Text>
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.productSheetContent}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.detailImage}
                />
                <Text style={styles.productSheetBrand}>
                  {selectedProduct.brand} · {selectedProduct.size}
                </Text>
                <Text style={styles.productSheetDescription}>
                  Freshly stocked and delivered by {selectedProduct.store}. This
                  premium grocery item is chosen for everyday convenience and
                  quality.
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>₹{selectedProduct.price}</Text>
                  {Number(selectedProduct.originalPrice ?? 0) > Number(selectedProduct.price) ? (
                    <Text style={styles.originalPriceText}>
                      ₹{selectedProduct.originalPrice}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockText}>
                    {Number(selectedProduct.stock ?? 0) > 0
                      ? `${selectedProduct.stock} in stock`
                      : 'Out of stock'}
                  </Text>
                  {Number(selectedProduct.originalPrice ?? 0) > Number(selectedProduct.price) ? (
                    <Text style={styles.discountBadge}>
                      {Math.round(
                        ((Number(selectedProduct.originalPrice) - Number(selectedProduct.price)) /
                          Number(selectedProduct.originalPrice)) *
                          100,
                      )}
                      % OFF
                    </Text>
                  ) : null}
                </View>
                <View style={styles.qtySelectorLarge}>
                  <Pressable
                    disabled={
                      (cart.find(item => item.name === selectedProduct.name)
                        ?.quantity ?? 0) <= 0 ||
                      !selectedProduct ||
                      Number(selectedProduct.stock ?? 0) <= 0
                    }
                    onPress={() => changeCart(selectedProduct, -1)}
                    style={styles.quantityButtonLarge}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.quantityTextLarge}>
                    {cart.find(item => item.name === selectedProduct.name)
                      ?.quantity ?? 0}
                  </Text>
                  <Pressable
                    disabled={Number(selectedProduct.stock ?? 0) <= 0}
                    onPress={() => changeCart(selectedProduct, 1)}
                    style={styles.quantityButtonLarge}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
                <ActionButton
                  disabled={Number(selectedProduct.stock ?? 0) <= 0}
                  onPress={() => {
                    changeCart(selectedProduct, 1);
                    setSelectedProduct(null);
                  }}
                  title={
                    Number(selectedProduct.stock ?? 0) <= 0
                      ? 'Out of Stock'
                      : 'Add to Cart'
                  }
                />
              </ScrollView>
            </View>
          ) : selectedStore ? (
            <View style={styles.storeDetailSheet}>
              <ScrollView
                contentContainerStyle={styles.storeDetailScroll}
                showsVerticalScrollIndicator={false}
                style={styles.storeDetailContent}
              >
                <View style={styles.storePageHeader}>
                  <Pressable
                    accessibilityLabel="Go back"
                    onPress={() => setSelectedStore(null)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.backButtonCircle,
                      pressed && styles.backButtonPressed,
                    ]}
                  >
                    <Text style={styles.backButtonText}>←</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Add to favourites"
                    onPress={() => setSelectedStore({ ...selectedStore, isFavourite: !selectedStore.isFavourite })}
                    style={styles.headerIconButton}
                  >
                    <Text style={styles.headerIconText}>
                      {selectedStore.isFavourite ? '♥' : '♡'}
                    </Text>
                  </Pressable>
                </View>
                <Image
                  source={{ uri: selectedStore.image }}
                  style={styles.storeCoverImage}
                />
                <View style={styles.storeHeaderCard}>
                  <Text style={styles.storeCategoryText}>{selectedStore.category}</Text>
                  <Text style={styles.storeHeaderName}>{selectedStore.name}</Text>
                  <View style={styles.storeRatingRow}>
                    <Text style={styles.storeRatingBadge}>
                      ★ {selectedStore.rating?.toFixed(1) ?? '4.5'}
                    </Text>
                    <Text style={styles.storeReviewText}>
                      {selectedStore.reviews ?? 128} reviews
                    </Text>
                    <Text style={styles.storeDistancePill}>
                      {selectedStore.distance ?? 250} metres away
                    </Text>
                  </View>
                  <View style={styles.storeStatusRow}>
                    <Text
                      style={[
                        styles.storeStatusBadge,
                        selectedStore.isOpen
                          ? styles.storeStatusOpen
                          : styles.storeStatusClosed,
                      ]}
                    >
                      {selectedStore.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowStoreDetails(!showStoreDetails)}
                  style={styles.infoCard}
                >
                  <View style={styles.infoCardHeader}>
                    <Text style={styles.infoCardTitle}>Store Information</Text>
                    <Text style={styles.infoCardToggle}>
                      {showStoreDetails ? 'Hide' : 'Show'}
                    </Text>
                  </View>
                  {showStoreDetails ? (
                    <View style={styles.infoGrid}>
                      <Text style={styles.infoRowText}>
                        Address: {selectedStore.address || 'Address not provided'}
                      </Text>
                      <Text style={styles.infoRowText}>
                        Distance: {selectedStore.distance ?? 'Unavailable'}
                        {selectedStore.distance != null ? ' metres' : ''}
                      </Text>
                      {selectedStore.openingTime || selectedStore.closingTime ? (
                        <Text style={styles.infoRowText}>
                          Opening hours:{' '}
                          {[selectedStore.openingTime, selectedStore.closingTime]
                            .filter(Boolean)
                            .join(' - ')}
                        </Text>
                      ) : null}
                      <Text style={styles.infoRowText}>
                        Services:{' '}
                        {[
                          selectedStore.deliveryAvailable && 'Home Delivery',
                          selectedStore.pickupAvailable && 'Store Pickup',
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'No fulfilment options available'}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <View style={styles.fulfilmentSection}>
                  <Text style={styles.fulfilmentHeading}>
                    How would you like to get your order?
                  </Text>
                  <View style={styles.fulfilmentOptionsRow}>
                    {[
                      {
                        method: 'delivery',
                        icon: '🚚',
                        title: 'Home Delivery',
                        description:
                          'Get your order delivered to your doorstep.',
                        available: Boolean(selectedStore.deliveryAvailable),
                        unavailableText:
                          'Home delivery is not available at this store.',
                      },
                      {
                        method: 'pickup',
                        icon: '🏬',
                        title: 'Store Pickup',
                        description:
                          'Order online and collect from the store.',
                        available: Boolean(selectedStore.pickupAvailable),
                        unavailableText:
                          'Store pickup is not available at this store.',
                      },
                    ].map(option => {
                      const isSelected =
                        selectedFulfillment === option.method &&
                        option.available;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: isSelected,
                            disabled: !option.available,
                          }}
                          disabled={!option.available}
                          key={option.method}
                          onPress={() => selectFulfillment(option.method)}
                          style={({ pressed }) => [
                            styles.fulfilmentOption,
                            isSelected && styles.fulfilmentOptionSelected,
                            !option.available && styles.fulfilmentOptionDisabled,
                            pressed && option.available && styles.optionPressed,
                          ]}
                        >
                          <View style={styles.fulfilmentOptionTop}>
                            <Text
                              style={[
                                styles.fulfilmentIcon,
                                !isSelected && styles.fulfilmentIconMuted,
                              ]}
                            >
                              {option.icon}
                            </Text>
                            <View
                              style={[
                                styles.fulfilmentCheck,
                                isSelected && styles.fulfilmentCheckSelected,
                              ]}
                            >
                              {isSelected ? (
                                <Text style={styles.fulfilmentCheckText}>✓</Text>
                              ) : null}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.fulfilmentOptionTitle,
                              isSelected && styles.fulfilmentOptionTitleSelected,
                              !option.available && styles.fulfilmentMutedText,
                            ]}
                          >
                            {option.title}
                          </Text>
                          <Text
                            style={[
                              styles.fulfilmentOptionDescription,
                              !option.available && styles.fulfilmentMutedText,
                            ]}
                          >
                            {option.available
                              ? option.description
                              : option.unavailableText}
                          </Text>
                          {option.available &&
                          option.method === 'delivery' ? (
                            <View>
                              {selectedStore.deliveryTime ? (
                                <Text style={styles.fulfilmentOptionMeta}>
                                  {selectedStore.deliveryTime}
                                </Text>
                              ) : null}
                              <Text style={styles.fulfilmentOptionMeta}>
                                {hasSelectedStoreDeliveryFee
                                  ? Number(selectedStoreDeliveryFee) === 0
                                    ? 'FREE DELIVERY'
                                    : `Delivery ₹${Number(selectedStoreDeliveryFee)}`
                                  : 'Delivery fee unavailable'}
                              </Text>
                            </View>
                          ) : null}
                          {option.available &&
                          option.method === 'pickup' ? (
                            <View>
                              <Text style={styles.fulfilmentOptionMeta}>
                                No delivery fee
                              </Text>
                              {selectedStorePickupTime ? (
                                <Text style={styles.fulfilmentOptionMeta}>
                                  Ready in {selectedStorePickupTime}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  {!selectedStore.deliveryAvailable &&
                  !selectedStore.pickupAvailable ? (
                    <View style={styles.fulfilmentUnavailableNotice}>
                      <Text style={styles.fulfilmentUnavailableText}>
                        Neither delivery nor pickup is currently available at
                        this store. Checkout is unavailable.
                      </Text>
                    </View>
                  ) : null}
                  {selectedFulfillment === 'delivery' &&
                  selectedStore.deliveryAvailable ? (
                    <View style={styles.fulfilmentDetailsCard}>
                      <View style={styles.fulfilmentDetailsHeader}>
                        <Text style={styles.fulfilmentDetailsIcon}>🚚</Text>
                        <Text style={styles.fulfilmentDetailsTitle}>
                          Home Delivery Details
                        </Text>
                      </View>
                      <Text style={styles.fulfilmentDetailsDescription}>
                        Your order will be delivered to your selected address
                        by the available delivery service.
                      </Text>
                      {hasSelectedStoreDeliveryFee ? (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Delivery fee
                          </Text>
                          <Text
                            style={[
                              styles.fulfilmentDetailValue,
                              Number(selectedStoreDeliveryFee) === 0 &&
                                styles.freeDeliveryText,
                            ]}
                          >
                            {Number(selectedStoreDeliveryFee) === 0
                              ? 'FREE DELIVERY'
                              : `₹${Number(selectedStoreDeliveryFee)}`}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Delivery fee
                          </Text>
                          <Text style={styles.fulfilmentDetailValue}>
                            Not provided by the store
                          </Text>
                        </View>
                      )}
                      {selectedStore.deliveryTime ? (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Estimated time
                          </Text>
                          <Text style={styles.fulfilmentDetailValue}>
                            {selectedStore.deliveryTime}
                          </Text>
                        </View>
                      ) : null}
                      {selectedStoreMinimumOrder != null ? (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Minimum order
                          </Text>
                          <Text style={styles.fulfilmentDetailValue}>
                            ₹{selectedStoreMinimumOrder}
                          </Text>
                        </View>
                      ) : null}
                      {selectedStore.deliveryDescription ||
                      selectedStore.delivery_description ||
                      selectedStore.deliveryInfo ? (
                        <Text style={styles.fulfilmentAdditionalInfo}>
                          {selectedStore.deliveryDescription ||
                            selectedStore.delivery_description ||
                            selectedStore.deliveryInfo}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {selectedFulfillment === 'pickup' &&
                  selectedStore.pickupAvailable ? (
                    <View style={styles.fulfilmentDetailsCard}>
                      <View style={styles.fulfilmentDetailsHeader}>
                        <Text style={styles.fulfilmentDetailsIcon}>🏬</Text>
                        <Text style={styles.fulfilmentDetailsTitle}>
                          Store Pickup Details
                        </Text>
                      </View>
                      <Text style={styles.fulfilmentDetailsDescription}>
                        Place your order online and collect it directly from the
                        store when it is ready.
                      </Text>
                      <View style={styles.fulfilmentDetailRow}>
                        <Text style={styles.fulfilmentDetailLabel}>
                          Pickup location
                        </Text>
                        <Text style={styles.fulfilmentDetailValue}>
                          {selectedStore.address || 'Address not provided'}
                        </Text>
                      </View>
                      <View style={styles.fulfilmentDetailRow}>
                        <Text style={styles.fulfilmentDetailLabel}>
                          Pickup method
                        </Text>
                        <Text style={styles.fulfilmentDetailValue}>
                          Collect your order directly from the store.
                        </Text>
                      </View>
                      {selectedStorePickupTime ? (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Preparation time
                          </Text>
                          <Text style={styles.fulfilmentDetailValue}>
                            {selectedStorePickupTime}
                          </Text>
                        </View>
                      ) : null}
                      {hasSelectedStorePickupFee ? (
                        <View style={styles.fulfilmentDetailRow}>
                          <Text style={styles.fulfilmentDetailLabel}>
                            Pickup fee
                          </Text>
                          <Text style={styles.fulfilmentDetailValue}>
                            {Number(selectedStorePickupFee) === 0
                              ? 'No pickup fee'
                              : `₹${Number(selectedStorePickupFee)}`}
                          </Text>
                        </View>
                      ) : null}
                      {selectedStore.pickupInstructions ||
                      selectedStore.pickup_instructions ? (
                        <Text style={styles.fulfilmentAdditionalInfo}>
                          {selectedStore.pickupInstructions ||
                            selectedStore.pickup_instructions}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <View style={styles.storeSearchBlock}>
                  <View style={styles.storeSearchBar}>
                    <Text style={styles.storeSearchIcon}>⌕</Text>
                    <TextInput
                      onChangeText={text => {
                        setStoreProductQuery(text);
                        setStoreProductCategory('All Products');
                      }}
                      placeholder="Search products in this store..."
                      placeholderTextColor={COLORS.muted}
                      style={styles.storeSearchInput}
                      value={storeProductQuery}
                    />
                    {storeProductQuery ? (
                      <Pressable
                        accessibilityLabel="Clear store product search"
                        onPress={() => setStoreProductQuery('')}
                        style={styles.storeSearchClear}
                      >
                        <Text style={styles.storeSearchClearText}>×</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                <ScrollView
                  contentContainerStyle={styles.categoryRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.storeCategoryScroller}
                >
                  {availableStoreCategories.map(category => {
                    const selected = storeProductCategory === category;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => setStoreProductCategory(category)}
                        style={[
                          styles.storeCategoryChip,
                          selected && styles.storeCategoryChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.storeCategoryChipText,
                            selected && styles.storeCategoryChipTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.sortBar}>
                  <Text style={styles.sortLabel}>
                    {filteredStoreProducts.length} items
                  </Text>
                  <Pressable
                    onPress={() => setFilterSheetVisible(true)}
                    style={styles.filterButton}
                  >
                    <Text style={styles.filterButtonText}>Filters</Text>
                  </Pressable>
                </View>
                <View style={[styles.productGrid, styles.storeProductGrid]}>
                  {filteredStoreProducts.length ? (
                    filteredStoreProducts.map(product => (
                      <ProductCard
                        favourite={favourites.includes(product.name)}
                        key={product.name}
                        onAdd={changeCart}
                        onOpen={setSelectedProduct}
                        onToggleFavourite={toggleFavourite}
                        showStoreName={false}
                        product={{
                          ...product,
                          originalPrice:
                            product.originalPrice ?? product.price + 25,
                        }}
                        quantity={
                          cart.find(item => item.name === product.name)?.quantity ?? 0
                        }
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No matching products in this store. Try another search or
                      category.
                    </Text>
                  )}
                </View>
              </ScrollView>
              {selectedStoreCartCount > 0 ? (
                <View style={styles.storeCartBar}>
                  <View>
                    <Text style={styles.storeCartText}>
                      {selectedStoreCartCount}{' '}
                      {selectedStoreCartCount === 1 ? 'item' : 'items'} · ₹
                      {selectedStoreCartTotal}
                    </Text>
                    <Text style={styles.storeCartSubtext}>
                      From {selectedStore.name}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedStore(null);
                      setScreen('Cart');
                    }}
                    style={styles.storeCartButton}
                  >
                    <Text style={styles.storeCartButtonText}>View Cart</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
        transparent
        visible={filterSheetVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <Pressable
                accessibilityLabel="Close filters"
                onPress={() => setFilterSheetVisible(false)}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.filterSectionTitle}>Sorting</Text>
            {storeSortOptions.map(option => (
              <Pressable
                key={option}
                onPress={() => {
                  setSortOption(option);
                  setFilterSheetVisible(false);
                }}
                style={[
                  styles.filterOption,
                  sortOption === option && styles.filterOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    sortOption === option && styles.filterOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.filterSectionTitle}>Filters</Text>
            <View style={styles.checkRow}>
              <Pressable onPress={() => setInStockOnly(!inStockOnly)} style={styles.checkBox}>
                <Text style={styles.checkBoxText}>{inStockOnly ? '✓' : ''}</Text>
              </Pressable>
              <Text style={styles.filterOptionText}>In Stock</Text>
            </View>
            <View style={styles.checkRow}>
              <Pressable onPress={() => setOnSaleOnly(!onSaleOnly)} style={styles.checkBox}>
                <Text style={styles.checkBoxText}>{onSaleOnly ? '✓' : ''}</Text>
              </Pressable>
              <Text style={styles.filterOptionText}>On Sale</Text>
            </View>
            <Text style={styles.filterSectionTitle}>Brand</Text>
            <View style={styles.inlineChips}>
              {['All Brands', 'Aashirvaad', 'Amul', 'Fortune', 'Parle', 'Tata'].map(item => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setBrandFilter(item);
                    setFilterSheetVisible(false);
                  }}
                  style={[
                    styles.inlineChip,
                    brandFilter === item && styles.inlineChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.inlineChipText,
                      brandFilter === item && styles.inlineChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.inlineChips}>
              {['Any', 'Under ₹100', '₹100 - ₹250', '₹250+'].map(item => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setPriceFilter(item);
                    setFilterSheetVisible(false);
                  }}
                  style={[
                    styles.inlineChip,
                    priceFilter === item && styles.inlineChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.inlineChipText,
                      priceFilter === item && styles.inlineChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => {
                setSortOption('Recommended');
                setInStockOnly(false);
                setOnSaleOnly(false);
                setBrandFilter('All Brands');
                setPriceFilter('Any');
                setFilterSheetVisible(false);
              }}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear All</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  appHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  brandIcon: { fontSize: 24 },
  brandName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandHighlight: { color: COLORS.green },
  brandTagline: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
  headerProfile: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 22,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerProfileText: { color: COLORS.green, fontSize: 18, fontWeight: '700' },
  pageContent: { paddingBottom: 24, paddingHorizontal: 16 },
  storeSearchBar: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    marginTop: 14,
    paddingHorizontal: 13,
  },
  storeSearchIcon: {
    color: COLORS.green,
    fontSize: 23,
    marginRight: 9,
  },
  storeSearchInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  storeSearchClear: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 16,
    height: 30,
    justifyContent: 'center',
    marginLeft: 8,
    width: 30,
  },
  storeSearchClearDisabled: {
    opacity: 0,
  },
  storeSearchClearText: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: '700',
  },
  storeLoading: { marginTop: 8 },
  storeDiscoveryHeader: { marginTop: 20 },
  storeDiscoveryTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
  },
  storeDiscoverySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  storeDiscoveryMeta: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  filterRow: { gap: 10, marginTop: 16, paddingBottom: 4 },
  filterChip: {
    backgroundColor: '#F2F5F2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: COLORS.green,
  },
  filterChipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: { color: COLORS.white },
  viewToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  viewToggleWrap: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.green,
  },
  viewToggleText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  viewToggleTextActive: { color: COLORS.white },
  mapContainer: {
    borderRadius: 15,
    height: 230,
    marginBottom: 12,
    marginTop: 18,
    overflow: 'hidden',
  },
  storeActionsRow: { marginTop: 6 },
  storeList: { marginTop: 10 },
  discoveryStoreCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  discoveryStoreImage: {
    backgroundColor: COLORS.paleGreen,
    height: 160,
    width: '100%',
  },
  discoveryStoreBody: { padding: 14 },
  discoveryStoreHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  discoveryStoreBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  discoveryStoreBadgeText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '800',
  },
  discoveryStoreInfo: { flex: 1, marginLeft: 10 },
  discoveryStoreName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  discoveryStoreCategory: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  discoveryStoreMetaRow: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  discoveryStorePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  discoveryStorePill: {
    backgroundColor: '#F3F1EC',
    borderRadius: 999,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  discoveryStorePillActive: {
    backgroundColor: '#DFF4E7',
    color: COLORS.green,
  },
  discoveryStoreDetail: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 10,
  },
  discoveryStoreFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  discoveryStoreFooterText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  discoveryActionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  discoveryActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  clearFilterButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFilterText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  mapUnavailable: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mapUnavailableText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  map: { flex: 1 },
  locationCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    padding: 13,
  },
  locationPin: { color: COLORS.green, fontSize: 23, marginRight: 11 },
  locationCopy: { flex: 1 },
  locationEyebrow: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  locationAddress: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  locationDetail: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  locationChevron: { color: COLORS.muted, fontSize: 19, paddingHorizontal: 3 },
  searchInput: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 14,
    marginTop: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  heroBanner: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    marginTop: 16,
    overflow: 'hidden',
    padding: 20,
  },
  heroEyebrow: {
    color: '#c5e7d4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 14,
  },
  heroDescription: {
    color: '#e4f0e9',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 245,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroButtonText: { color: COLORS.darkGreen, fontSize: 13, fontWeight: '700' },
  sectionTitle: { marginBottom: 13, marginTop: 23 },
  sectionHeading: { color: COLORS.text, fontSize: 19, fontWeight: '800' },
  sectionSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  categoryRow: { gap: 10, paddingBottom: 2 },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 93,
    paddingHorizontal: 10,
    width: 105,
  },
  categorySelected: {
    backgroundColor: COLORS.paleGreen,
    borderColor: COLORS.green,
  },
  categoryIcon: { fontSize: 25 },
  categoryName: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 7,
    textAlign: 'center',
  },
  categoryNameSelected: { color: COLORS.green },
  sectionBlock: { marginTop: 5 },
  storeRow: { gap: 12 },
  storeCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    width: 270,
  },
  storeImage: { backgroundColor: COLORS.paleGreen, height: 112, width: '100%' },
  storeDetails: { alignItems: 'center', flexDirection: 'row', padding: 11 },
  storeInitials: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  storeInitialsText: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  storeCopy: { flex: 1, marginLeft: 9 },
  storeName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  mutedText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  storeDistance: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 2,
    overflow: 'hidden',
    width: '48.5%',
  },
  favouriteButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 31,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    top: 9,
    width: 31,
    zIndex: 1,
  },
  favouriteText: { color: COLORS.muted, fontSize: 20 },
  favouriteActive: { color: '#d55252' },
  productImage: {
    backgroundColor: COLORS.paleGreen,
    height: 122,
    width: '100%',
  },
  productDetails: { padding: 10 },
  productBrand: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  productName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  productBuyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  productPrice: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  previewPrice: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  quantityControl: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 9,
    flexDirection: 'row',
  },
  quantityButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 29,
  },
  quantityButtonText: { color: COLORS.green, fontSize: 19, fontWeight: '700' },
  quantityText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 9,
    height: 31,
    justifyContent: 'center',
    width: 34,
  },
  addButtonText: { color: COLORS.white, fontSize: 21, lineHeight: 24 },
  notice: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 11,
    marginTop: 22,
    padding: 12,
  },
  noticeText: { color: COLORS.green, fontSize: 10, lineHeight: 16 },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  bottomNavigation: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 5 : 8,
    paddingTop: 8,
  },
  navItem: { alignItems: 'center', minWidth: 52 },
  navIcon: { color: COLORS.muted, fontSize: 21, textAlign: 'center' },
  navIconActive: { color: COLORS.green },
  navLabel: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  navLabelActive: { color: COLORS.green, fontWeight: '700' },
  cartBadge: {
    backgroundColor: '#e05252',
    borderRadius: 8,
    color: COLORS.white,
    fontSize: 8,
    minWidth: 15,
    overflow: 'hidden',
    paddingHorizontal: 3,
    position: 'absolute',
    right: -9,
    textAlign: 'center',
    top: -4,
  },
  centeredContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  largeEmoji: { fontSize: 44, marginBottom: 14 },
  cartRow: {
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 13,
  },
  cartImage: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    height: 67,
    width: 67,
  },
  cartCopy: { flex: 1, marginLeft: 11 },
  cartFulfillmentCard: {
    backgroundColor: COLORS.storeLightGreen,
    borderColor: '#d8ebde',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 13,
  },
  cartFulfillmentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartFulfillmentTitle: {
    color: COLORS.storeGreen,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },
  changeFulfillmentButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  changeFulfillmentText: {
    color: COLORS.storeGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  cartFulfillmentText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  cartQuantity: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 9,
    flexDirection: 'row',
    marginTop: 7,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    padding: 20,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginBottom: 12,
    width: 60,
  },
  profileAvatarText: { color: COLORS.green, fontSize: 24, fontWeight: '800' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 11,
    justifyContent: 'center',
    marginTop: 17,
    minHeight: 47,
    paddingHorizontal: 16,
    width: '100%',
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8 },
  loginPage: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  backLink: { marginBottom: 16, paddingVertical: 8 },
  backLinkText: { color: COLORS.green, fontSize: 14, fontWeight: '600' },
  loginCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 21,
  },
  loginBrand: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  loginTagline: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  loginTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 25,
  },
  loginSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    marginTop: 5,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 13,
  },
  textInput: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { color: '#b42318', fontSize: 12, lineHeight: 18, marginTop: 12 },
  submitSpinner: { marginTop: 10 },
  authSwitch: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  linkText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  legalNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  productSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    padding: 18,
    paddingBottom: 26,
  },
  productSheetContent: { paddingBottom: 16 },
  productSheetBrand: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  productSheetDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  originalPriceText: {
    color: COLORS.muted,
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  stockText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#e9f7ef',
    borderRadius: 999,
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  qtySelectorLarge: {
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    paddingVertical: 8,
  },
  quantityButtonLarge: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 42,
  },
  quantityTextLarge: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  storeDetailSheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'column',
    height: '92%',
    overflow: 'hidden',
  },
  storeDetailContent: { flex: 1 },
  storeDetailScroll: { paddingBottom: 20 },
  storePageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 2,
  },
  backButtonCircle: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: 'rgba(29,104,72,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  backButtonPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  backButtonText: {
    color: COLORS.storeGreen,
    fontSize: 23,
    fontWeight: '600',
    marginRight: 2,
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerIconText: { color: COLORS.text, fontSize: 18 },
  storeCoverImage: {
    backgroundColor: COLORS.paleGreen,
    height: 205,
    width: '100%',
  },
  storeHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: -24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  storeCategoryText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  storeHeaderName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  storeRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  storeRatingBadge: {
    backgroundColor: '#f4f7ec',
    borderRadius: 999,
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  storeReviewText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  storeDistancePill: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 999,
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  storeStatusRow: { marginTop: 12 },
  storeStatusBadge: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
  storeStatusOpen: { backgroundColor: '#dff6e8', color: COLORS.green },
  storeStatusClosed: { backgroundColor: '#f3f1ee', color: COLORS.muted },
  infoCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
  },
  infoCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  infoCardToggle: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
  },
  infoGrid: { marginTop: 12 },
  infoRowText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 20,
  },
  fulfilmentSection: { marginHorizontal: 16, marginTop: 18 },
  fulfilmentHeading: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  fulfilmentOptionsRow: { flexDirection: 'row', gap: 10 },
  fulfilmentOption: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    minHeight: 154,
    padding: 12,
  },
  fulfilmentOptionSelected: {
    backgroundColor: COLORS.storeLightGreen,
    borderColor: COLORS.storeGreen,
    borderWidth: 1.5,
  },
  fulfilmentOptionDisabled: { opacity: 0.68 },
  optionPressed: { opacity: 0.82 },
  fulfilmentOptionTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fulfilmentIcon: { fontSize: 22 },
  fulfilmentIconMuted: { opacity: 0.65 },
  fulfilmentCheck: {
    alignItems: 'center',
    borderColor: '#cbd3cc',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  fulfilmentCheckSelected: {
    backgroundColor: COLORS.storeGreen,
    borderColor: COLORS.storeGreen,
  },
  fulfilmentCheckText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  fulfilmentOptionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  fulfilmentOptionTitleSelected: { color: COLORS.storeGreen },
  fulfilmentOptionDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  fulfilmentOptionMeta: {
    color: COLORS.storeGreen,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 7,
  },
  fulfilmentMutedText: { color: COLORS.muted },
  fulfilmentUnavailableNotice: {
    backgroundColor: '#fff7ed',
    borderColor: '#f1d8b8',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 11,
  },
  fulfilmentUnavailableText: {
    color: '#855a27',
    fontSize: 11,
    lineHeight: 16,
  },
  fulfilmentDetailsCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  fulfilmentDetailsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  fulfilmentDetailsIcon: { fontSize: 19 },
  fulfilmentDetailsTitle: {
    color: COLORS.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  fulfilmentDetailsDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 7,
  },
  fulfilmentDetailRow: {
    alignItems: 'flex-start',
    borderTopColor: '#f0f2ef',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  fulfilmentDetailLabel: {
    color: COLORS.muted,
    flex: 0.9,
    fontSize: 11,
    lineHeight: 16,
  },
  fulfilmentDetailValue: {
    color: COLORS.text,
    flex: 1.1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
  },
  freeDeliveryText: { color: COLORS.storeGreen },
  fulfilmentAdditionalInfo: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  storeSearchBlock: { marginHorizontal: 16, marginTop: 18 },
  storeCategoryScroller: { marginHorizontal: 16, marginTop: 14 },
  storeCategoryChip: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
  },
  storeCategoryChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  storeCategoryChipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  storeCategoryChipTextActive: { color: COLORS.white },
  storeProductGrid: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  sortBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  sortLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterButton: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterButtonText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
  },
  filterSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    padding: 18,
    paddingBottom: 28,
  },
  filterSectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 10,
  },
  filterOption: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterOptionActive: {
    backgroundColor: COLORS.paleGreen,
    borderColor: COLORS.green,
  },
  filterOptionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  filterOptionTextActive: { color: COLORS.green },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  checkBox: {
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderColor: COLORS.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkBoxText: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  inlineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineChip: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  inlineChipActive: {
    backgroundColor: COLORS.paleGreen,
    borderColor: COLORS.green,
  },
  inlineChipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  inlineChipTextActive: { color: COLORS.green },
  storeCartBar: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  storeCartText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  storeCartSubtext: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },
  storeCartButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  storeCartButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  modalTitle: { color: COLORS.text, flex: 1, fontSize: 18, fontWeight: '800' },
  modalClose: { color: COLORS.muted, fontSize: 28, paddingHorizontal: 7 },
  locationOption: {
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
  },
  locationOptionIcon: { color: COLORS.green, fontSize: 22 },
  detailImage: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 13,
    height: 190,
    marginBottom: 12,
    width: '100%',
  },
});

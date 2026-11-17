import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from '../theme/styles';
import AddressScreen from '../screens/address/AddressScreen';
import ProductDetailsScreen from '../screens/products/ProductDetailsScreen';
import {
  locations,
  categories,
  storeDetailCategories,
  filterChips,
  storeSortOptions,
  fallbackStores,
  products,
  tabs,
} from '../constants/appData';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import StoreCard from '../components/StoreCard';
import CartScreen from '../screens/cart/CartScreen';
import HomeScreen from '../screens/home/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import StoresScreen from '../screens/stores/StoresScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrderConfirmationScreen from '../screens/orders/OrderConfirmationScreen';
import { fetchNearbyStores } from '../services/storeService';
import {
  filterHomeProducts,
  filterStoreProducts,
} from '../services/productService';
import { getOrderDetails } from '../services/checkoutService';
import { getCurrentCustomer } from '../services/authService';
export default function AppNavigator() {
  const [screen, setScreen] = useState('AuthLoading');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [checkoutAuthReturn, setCheckoutAuthReturn] = useState(false);
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
  const [storeProductCategory, setStoreProductCategory] =
    useState('All Products');
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
        let saved = await SecureStore.getItemAsync('apnaMartSession');
        if (!saved) {
          const legacy = await AsyncStorage.getItem('apnaMartSession');
          if (legacy) {
            const previousSession = JSON.parse(legacy);
            if (previousSession.token) {
              await SecureStore.setItemAsync(
                'apnaMartSession',
                JSON.stringify(previousSession),
              );
              saved = JSON.stringify(previousSession);
            }
            await AsyncStorage.removeItem('apnaMartSession');
          }
        }

        if (!saved) {
          setScreen('Login');
          return;
        }

        const previousSession = JSON.parse(saved);
        if (!previousSession.token || !previousSession.user) {
          await SecureStore.deleteItemAsync('apnaMartSession');
          await AsyncStorage.removeItem('apnaMartSession');
          setScreen('Login');
          return;
        }
        try {
          const user = await getCurrentCustomer(previousSession.token);
          setSession({ token: previousSession.token, user });
          setScreen('Home');
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            await SecureStore.deleteItemAsync('apnaMartSession');
            await AsyncStorage.removeItem('apnaMartSession');
            setSessionError(error.message);
            setScreen('Login');
          } else {
            setSession({ token: previousSession.token, user: previousSession.user });
            setSessionError(
              'Your saved session could not be verified right now. Try again when you are online.',
            );
            setScreen('Home');
          }
        }
      } catch {
        setSessionError(
          'Your saved sign-in could not be restored. Please sign in again.',
        );
        setScreen('Login');
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
      const nearbyStores = await fetchNearbyStores(currentLat, currentLng);
      if (nearbyStores.length > 0) {
        setStores(nearbyStores);
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
  const filteredProducts = useMemo(
    () => filterHomeProducts(products, searchValue, activeCategory),
    [activeCategory, searchValue],
  );
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
      .filter(
        store =>
          matchesSearch(store) &&
          matchesCategory(store) &&
          matchesFilter(store),
      )
      .sort((a, b) => a.distance - b.distance);
  }, [activeStoreCategory, activeStoreFilter, storeSearchQuery, stores]);
  const selectedStoreProducts = useMemo(
    () => products.filter(product => product.store === selectedStore?.name),
    [selectedStore],
  );
  const availableStoreCategories = useMemo(() => {
    const set = new Set(['All Products']);
    selectedStoreProducts.forEach(product => {
      set.add(product.category);
    });
    return storeDetailCategories.filter(category => set.has(category));
  }, [selectedStoreProducts]);
  const filteredStoreProducts = useMemo(
    () =>
      filterStoreProducts(selectedStoreProducts, {
        query: storeProductQuery,
        category: storeProductCategory,
        inStockOnly,
        onSaleOnly,
        brandFilter,
        priceFilter,
        sortOption,
      }),
    [
      brandFilter,
      inStockOnly,
      onSaleOnly,
      priceFilter,
      selectedStoreProducts,
      sortOption,
      storeProductCategory,
      storeProductQuery,
    ],
  );
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
    const cartMethod = cart.find(
      item => item.store === store.name,
    )?.fulfillmentMethod;
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
    if (!selectedStore || !isFulfillmentAvailable(selectedStore, method))
      return;
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
  const cartCheckoutEligible = cartFulfillmentAvailable && cartMinimumOrderMet;
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
              setCart([{ ...product, fulfillmentMethod, quantity: amount }]),
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
                fulfillmentMethod: entry.fulfillmentMethod ?? fulfillmentMethod,
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
    await SecureStore.setItemAsync('apnaMartSession', JSON.stringify(value));
    await AsyncStorage.removeItem('apnaMartSession');
    setSession(value);
    setSessionError('');
    setScreen(checkoutAuthReturn ? 'Checkout' : 'Home');
    setCheckoutAuthReturn(false);
  };
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('apnaMartSession');
      await SecureStore.deleteItemAsync('apnaMartSession');
      setSession(null);
      setSessionError('');
      setScreen('Login');
    } catch {
      Alert.alert(
        'Sign out failed',
        'Your saved sign-in could not be removed. Please try again.',
      );
    }
  };
  const trackOrder = async () => {
    try {
      const order = await getOrderDetails(session.token, createdOrder.id);
      setCreatedOrder(order);
      Alert.alert(
        'Order status',
        `${order.orderId}: ${order.status}. Payment is ${order.paymentStatus}.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to refresh order',
        error instanceof Error ? error.message : 'Please try again later.',
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
  const renderCurrentScreen = () => {
    switch (screen) {
      case 'AuthLoading':
        return (
          <View style={styles.centeredContent}>
            <ActivityIndicator color={COLORS.green} />
          </View>
        );
      case 'Home':
        return (
          <HomeScreen
            {...{
              locations,
              setLocationsVisible,
              customLocation,
              locationIndex,
              selectedLocation,
              setSearchValue,
              setActiveCategory,
              searchValue,
              setScreen,
              categories,
              activeCategory,
              stores,
              renderStore,
              filteredProducts,
              renderProduct,
            }}
          />
        );
      case 'Stores':
        return (
          <StoresScreen
            {...{
              locations,
              setLocationsVisible,
              customLocation,
              locationIndex,
              selectedLocation,
              setStoreSearchQuery,
              storeSearchQuery,
              filteredStores,
              storeSearchLoading,
              filterChips,
              activeStoreFilter,
              setActiveStoreFilter,
              categories,
              activeStoreCategory,
              setActiveStoreCategory,
              viewMode,
              setViewMode,
              mapRegion,
              setMapRegion,
              androidMapsApiKeyConfigured,
              currentCoordinates,
              openStore,
              locationLoading,
              locateMe,
              locationError,
            }}
          />
        );
      case 'Cart':
        return (
          <CartScreen
            {...{
              cart,
              changeCart,
              cartFulfillmentMethod,
              openStore,
              cartStore,
              setScreen,
              selectedLocation,
              cartDeliveryFee,
              cartPickupFee,
              cartFulfillmentAvailable,
              hasCartMinimumOrder,
              cartMinimumOrderMet,
              cartMinimumOrderValue,
              subtotal,
              cartCheckoutEligible,
              onCheckout: () => setScreen('Checkout'),
            }}
          />
        );
      case 'Checkout':
        return (
          <CheckoutScreen
            cart={cart}
            currentCoordinates={currentCoordinates}
            fulfilmentMethod={cartFulfillmentMethod}
            locationError={locationError}
            onBack={() => setScreen('Cart')}
            onLocateAddress={locateMe}
            onOrderPlaced={order => {
              setCreatedOrder(order);
              setCart([]);
              setSelectedProduct(null);
              setSelectedStore(null);
              setScreen('OrderConfirmation');
            }}
            onSignIn={() => {
              setCheckoutAuthReturn(true);
              setScreen('Login');
            }}
            session={session}
            store={cartStore}
          />
        );
      case 'Orders':
        return session ? (
          <OrdersScreen />
        ) : (
          <LoginScreen
            initialError={sessionError}
            onBack={() => setScreen('Home')}
            onModeChange={setScreen}
            onSignedIn={async value => {
              await signIn(value);
              setScreen('Orders');
            }}
          />
        );
      case 'OrderConfirmation':
        return (
          <OrderConfirmationScreen
            onContinueShopping={() => setScreen('Home')}
            onTrackOrder={trackOrder}
            order={createdOrder}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            {...{ sessionLoading, session, signOut, sessionError, setScreen }}
          />
        );
      case 'Login':
        return (
          <LoginScreen
            initialError={sessionError}
            onBack={() => {
              setCheckoutAuthReturn(false);
              setScreen('Home');
            }}
            onModeChange={setScreen}
            onSignedIn={signIn}
          />
        );
      case 'Register':
        return (
          <RegisterScreen
            onBack={() => {
              setCheckoutAuthReturn(false);
              setScreen('Home');
            }}
            onModeChange={setScreen}
            onSignedIn={signIn}
          />
        );
    }
  };
  return (
    <SafeAreaView
      edges={
        screen === 'Checkout'
          ? ['top', 'left', 'right']
          : ['top', 'left', 'right', 'bottom']
      }
      style={styles.safeArea}
    >
      <StatusBar barStyle="dark-content" />
      {['AuthLoading', 'Login', 'Register', 'Checkout', 'OrderConfirmation'].includes(
        screen,
      ) ? (
        renderCurrentScreen()
      ) : (
        <>
          <Header
            onHomePress={() => setScreen('Home')}
            onProfilePress={() => setScreen('Profile')}
            session={session}
          />
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

      <AddressScreen
        addressDraft={addressDraft}
        locations={locations}
        onAddressDraftChange={setAddressDraft}
        onClose={() => setLocationsVisible(false)}
        onSaveAddress={() => {
          setCustomLocation(addressDraft.trim());
          setAddressDraft('');
          setLocationsVisible(false);
        }}
        onSelectLocation={location => {
          setLocationIndex(locations.indexOf(location));
          setCustomLocation('');
          setLocationsVisible(false);
        }}
        visible={locationsVisible}
      />

      <ProductDetailsScreen
        onChangeCart={changeCart}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        quantity={
          cart.find(item => item.name === selectedProduct?.name)?.quantity ?? 0
        }
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedStore(null)}
        transparent
        visible={Boolean(selectedStore)}
      >
        <View style={styles.modalBackdrop}>
          {selectedStore ? (
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
                    onPress={() =>
                      setSelectedStore({
                        ...selectedStore,
                        isFavourite: !selectedStore.isFavourite,
                      })
                    }
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
                  <Text style={styles.storeCategoryText}>
                    {selectedStore.category}
                  </Text>
                  <Text style={styles.storeHeaderName}>
                    {selectedStore.name}
                  </Text>
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
                        Address:{' '}
                        {selectedStore.address || 'Address not provided'}
                      </Text>
                      <Text style={styles.infoRowText}>
                        Distance: {selectedStore.distance ?? 'Unavailable'}
                        {selectedStore.distance != null ? ' metres' : ''}
                      </Text>
                      {selectedStore.openingTime ||
                      selectedStore.closingTime ? (
                        <Text style={styles.infoRowText}>
                          Opening hours:{' '}
                          {[
                            selectedStore.openingTime,
                            selectedStore.closingTime,
                          ]
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
                        description: 'Order online and collect from the store.',
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
                            !option.available &&
                              styles.fulfilmentOptionDisabled,
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
                                <Text style={styles.fulfilmentCheckText}>
                                  ✓
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.fulfilmentOptionTitle,
                              isSelected &&
                                styles.fulfilmentOptionTitleSelected,
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
                          {option.available && option.method === 'delivery' ? (
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
                                    : `Delivery ₹${Number(
                                        selectedStoreDeliveryFee,
                                      )}`
                                  : 'Delivery fee unavailable'}
                              </Text>
                            </View>
                          ) : null}
                          {option.available && option.method === 'pickup' ? (
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
                        Your order will be delivered to your selected address by
                        the available delivery service.
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
                          cart.find(item => item.name === product.name)
                            ?.quantity ?? 0
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
              <Pressable
                onPress={() => setInStockOnly(!inStockOnly)}
                style={styles.checkBox}
              >
                <Text style={styles.checkBoxText}>
                  {inStockOnly ? '✓' : ''}
                </Text>
              </Pressable>
              <Text style={styles.filterOptionText}>In Stock</Text>
            </View>
            <View style={styles.checkRow}>
              <Pressable
                onPress={() => setOnSaleOnly(!onSaleOnly)}
                style={styles.checkBox}
              >
                <Text style={styles.checkBoxText}>{onSaleOnly ? '✓' : ''}</Text>
              </Pressable>
              <Text style={styles.filterOptionText}>On Sale</Text>
            </View>
            <Text style={styles.filterSectionTitle}>Brand</Text>
            <View style={styles.inlineChips}>
              {[
                'All Brands',
                'Aashirvaad',
                'Amul',
                'Fortune',
                'Parle',
                'Tata',
              ].map(item => (
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

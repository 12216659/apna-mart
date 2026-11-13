import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
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
  { name: 'Fruits & Vegetables', icon: '🥑' },
  { name: 'Groceries', icon: '🌾' },
  { name: 'Dairy & Eggs', icon: '🥛' },
  { name: 'Snacks & Biscuits', icon: '🍪' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Bakery', icon: '🥐' },
  { name: 'Personal Care', icon: '🧴' },
  { name: 'Household', icon: '🧹' },
];
const stores = [
  {
    name: 'Sri Lakshmi General Store',
    category: 'Groceries · Daily essentials',
    distance: 180,
    image:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=660&q=85',
    initials: 'SL',
    tags: ['Delivery', 'Pickup'],
  },
  {
    name: 'Fresh Basket Mart',
    category: 'Fresh produce · Supermarket',
    distance: 320,
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=660&q=85',
    initials: 'FB',
    tags: ['Delivery'],
  },
  {
    name: 'Sai Kirana & Supermarket',
    category: 'Kirana · Household',
    distance: 410,
    image:
      'https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=660&q=85',
    initials: 'SK',
    tags: ['Pickup'],
  },
];
const products = [
  {
    name: 'Aashirvaad Atta',
    brand: 'Aashirvaad',
    size: '5 kg',
    price: 289,
    store: 'Sri Lakshmi General Store',
    category: 'Groceries',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Amul Taaza Milk',
    brand: 'Amul',
    size: '500 ml',
    price: 29,
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
    store: 'Fresh Basket Mart',
    category: 'Groceries',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=620&q=85',
  },
  {
    name: 'Parle-G Biscuits',
    brand: 'Parle',
    size: '250 g',
    price: 25,
    store: 'Sri Lakshmi General Store',
    category: 'Snacks & Biscuits',
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
          {product.size} · {product.store}
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
          <Text style={styles.storeInitialsText}>{store.initials}</Text>
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
};
function AppContent() {
  const [screen, setScreen] = useState('Home');
  const [cart, setCart] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
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
  const changeCart = (product, amount) => {
    const existingStore = cart[0]?.store;
    if (amount > 0 && existingStore && existingStore !== product.store) {
      Alert.alert(
        'Replace your cart?',
        `Your cart has items from ${existingStore}. Replace it with items from ${product.store}?`,
        [
          { text: 'Keep cart', style: 'cancel' },
          {
            text: 'Replace',
            onPress: () => setCart([{ ...product, quantity: amount }]),
          },
        ],
      );
      return;
    }
    setCart(current => {
      const item = current.find(entry => entry.name === product.name);
      if (!item && amount < 0) return current;
      if (!item) return [...current, { ...product, quantity: amount }];
      return current
        .map(entry =>
          entry.name === product.name
            ? { ...entry, quantity: entry.quantity + amount }
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
      onPress={() => setSelectedStore(store)}
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
    <ScrollView contentContainerStyle={styles.pageContent}>
      <SectionTitle
        title="Neighbourhood stores"
        subtitle="Trusted local shops around you."
      />
      <View style={styles.mapContainer}>
        <MapView
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
        </MapView>
      </View>
      <ActionButton
        disabled={locationLoading}
        onPress={locateMe}
        title={
          locationLoading
            ? 'Finding your location...'
            : 'Use my current location'
        }
      />
      {locationError ? (
        <Text style={styles.errorText}>{locationError}</Text>
      ) : null}
      <Text style={styles.mutedText}>
        Store pins will appear when real store coordinates are added.
      </Text>
      {stores.map(renderStore)}
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
          <View style={styles.totalRow}>
            <Text style={styles.sectionHeading}>Subtotal</Text>
            <Text style={styles.sectionHeading}>₹{subtotal}</Text>
          </View>
          <Text style={styles.previewPrice}>
            Preview prices · final store price may vary
          </Text>
          <ActionButton
            onPress={() =>
              Alert.alert(
                'Checkout coming soon',
                'Your cart is saved on this device.',
              )
            }
            title="Continue to checkout"
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduct?.name || selectedStore?.name}
              </Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => {
                  setSelectedProduct(null);
                  setSelectedStore(null);
                }}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            {selectedProduct ? (
              <>
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.detailImage}
                />
                <Text style={styles.mutedText}>
                  {selectedProduct.brand} · {selectedProduct.size}
                </Text>
                <Text style={styles.productPrice}>
                  ₹{selectedProduct.price}
                </Text>
                <Text style={styles.mutedText}>
                  Sold by {selectedProduct.store}. Preview price may vary.
                </Text>
                <ActionButton
                  onPress={() => {
                    changeCart(selectedProduct, 1);
                    setSelectedProduct(null);
                  }}
                  title="Add to cart"
                />
              </>
            ) : selectedStore ? (
              <>
                <Image
                  source={{ uri: selectedStore.image }}
                  style={styles.detailImage}
                />
                <Text style={styles.mutedText}>
                  {selectedStore.category} · {selectedStore.distance} m away
                </Text>
                <Text style={styles.storeDistance}>
                  {selectedStore.tags.join(' · ')} available
                </Text>
                <ActionButton
                  onPress={() => {
                    setSelectedStore(null);
                    setScreen('Stores');
                  }}
                  title="Browse store"
                />
              </>
            ) : null}
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
  mapContainer: {
    borderRadius: 15,
    height: 230,
    marginBottom: 12,
    marginTop: 6,
    overflow: 'hidden',
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

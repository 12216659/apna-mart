import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import CustomButton from '../../components/CustomButton';
import SearchBar from '../../components/SearchBar';
import { COLORS, styles } from '../../theme/styles';
export default function StoresScreen({
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
}) {
  return (
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

      <SearchBar
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
              style={[styles.filterChip, selected && styles.filterChipActive]}
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
        <CustomButton
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
                <Image
                  source={{ uri: store.image }}
                  style={styles.discoveryStoreImage}
                />
                <View style={styles.discoveryStoreBody}>
                  <View style={styles.discoveryStoreHeaderRow}>
                    <View style={styles.discoveryStoreBadge}>
                      <Text style={styles.discoveryStoreBadgeText}>
                        {store.logo}
                      </Text>
                    </View>
                    <View style={styles.discoveryStoreInfo}>
                      <Text style={styles.discoveryStoreName}>
                        {store.name}
                      </Text>
                      <Text style={styles.discoveryStoreCategory}>
                        {store.category}
                      </Text>
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
                    <Text style={styles.discoveryStorePill}>
                      Delivery: {store.deliveryTime}
                    </Text>
                  </View>
                  <Text style={styles.discoveryStoreDetail}>
                    {store.deliveryAvailable
                      ? 'Delivery available'
                      : 'Delivery unavailable'}{' '}
                    ·{' '}
                    {store.pickupAvailable
                      ? 'Pickup available'
                      : 'Pickup unavailable'}
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
              No stores match your search or current filters. Try clearing
              filters.
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
}

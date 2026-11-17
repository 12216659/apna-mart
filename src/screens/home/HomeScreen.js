import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import SectionTitle from '../../components/SectionTitle';
import { COLORS, styles } from '../../theme/styles';
import ProductListScreen from '../products/ProductListScreen';
export default function HomeScreen({
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
}) {
  return (
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

      <ProductListScreen
        products={filteredProducts}
        renderProduct={renderProduct}
        subtitle="Sample prices shown for preview."
        title={
          searchValue ? 'Search results' : activeCategory || 'Popular products'
        }
      />

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ✦ Preview · Sample stores and prices shown for illustration.
        </Text>
      </View>
    </ScrollView>
  );
}

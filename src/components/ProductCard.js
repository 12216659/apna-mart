import { Image, Pressable, Text, View } from 'react-native';
import { styles } from '../theme/styles';

export default function ProductCard({
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

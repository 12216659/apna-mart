import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { styles } from '../../theme/styles';

export default function ProductDetailsScreen({
  product,
  quantity,
  onClose,
  onChangeCart,
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(product)}
    >
      <View style={styles.modalBackdrop}>
        {product ? (
          <View style={styles.productSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Pressable accessibilityLabel="Close" onPress={onClose}>
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.productSheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: product.image }}
                style={styles.detailImage}
              />
              <Text style={styles.productSheetBrand}>
                {product.brand} · {product.size}
              </Text>
              <Text style={styles.productSheetDescription}>
                Freshly stocked and delivered by {product.store}. This premium
                grocery item is chosen for everyday convenience and quality.
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{product.price}</Text>
                {Number(product.originalPrice ?? 0) > Number(product.price) ? (
                  <Text style={styles.originalPriceText}>
                    ₹{product.originalPrice}
                  </Text>
                ) : null}
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockText}>
                  {Number(product.stock ?? 0) > 0
                    ? `${product.stock} in stock`
                    : 'Out of stock'}
                </Text>
                {Number(product.originalPrice ?? 0) > Number(product.price) ? (
                  <Text style={styles.discountBadge}>
                    {Math.round(
                      ((Number(product.originalPrice) - Number(product.price)) /
                        Number(product.originalPrice)) *
                        100,
                    )}
                    % OFF
                  </Text>
                ) : null}
              </View>
              <View style={styles.qtySelectorLarge}>
                <Pressable
                  disabled={quantity <= 0 || Number(product.stock ?? 0) <= 0}
                  onPress={() => onChangeCart(product, -1)}
                  style={styles.quantityButtonLarge}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </Pressable>
                <Text style={styles.quantityTextLarge}>{quantity}</Text>
                <Pressable
                  disabled={Number(product.stock ?? 0) <= 0}
                  onPress={() => onChangeCart(product, 1)}
                  style={styles.quantityButtonLarge}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
              </View>
              <CustomButton
                disabled={Number(product.stock ?? 0) <= 0}
                onPress={() => {
                  onChangeCart(product, 1);
                  onClose();
                }}
                title={
                  Number(product.stock ?? 0) <= 0
                    ? 'Out of Stock'
                    : 'Add to Cart'
                }
              />
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

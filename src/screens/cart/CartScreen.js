import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import SectionTitle from '../../components/SectionTitle';
import { styles } from '../../theme/styles';
export default function CartScreen({
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
  onCheckout,
}) {
  return (
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
                  Pickup at:{' '}
                  {cartStore?.address || 'Store address not provided'}
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
                This store requires a minimum order of ₹{cartMinimumOrderValue}.
              </Text>
            ) : null}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.sectionHeading}>Items subtotal</Text>
            <Text style={styles.sectionHeading}>₹{subtotal}</Text>
          </View>
          {cartFulfillmentMethod === 'delivery' && cartDeliveryFee !== null ? (
            <View style={styles.totalRow}>
              <Text style={styles.mutedText}>Delivery fee</Text>
              <Text style={styles.mutedText}>
                {cartDeliveryFee === 0 ? 'FREE' : `₹${cartDeliveryFee}`}
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
          <CustomButton
            disabled={!cartCheckoutEligible}
            onPress={onCheckout}
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
}

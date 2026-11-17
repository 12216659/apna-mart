import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import { styles as appStyles } from '../../theme/styles';
import { checkoutColors as colors } from '../checkout/checkoutStyles';

const money = amount =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const paymentStatusLabels = {
  pending: 'Pending',
  failed: 'Payment failed',
  cancelled: 'Payment cancelled',
  paid: 'Paid',
  collected: 'Collected',
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F7F5', flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  successIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E8F6EC',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 16,
    width: 72,
  },
  successCheck: { color: colors.green, fontSize: 36, fontWeight: '900' },
  heading: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderColor: '#E4EAE4',
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 13,
    padding: 15,
  },
  label: { color: colors.secondary, fontSize: 11 },
  value: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 4 },
  detail: { color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  row: {
    alignItems: 'center',
    borderBottomColor: '#E8ECE8',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: 9,
  },
  image: {
    backgroundColor: '#F5F7F5',
    borderRadius: 10,
    height: 48,
    marginRight: 10,
    width: 48,
  },
  item: { color: colors.text, flex: 1, fontSize: 12, fontWeight: '700' },
  itemDetail: { color: colors.secondary, fontSize: 10, marginTop: 3 },
  amount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  action: { marginTop: 3 },
  sectionMargin: { marginTop: 14 },
  total: { color: colors.green, fontSize: 19 },
  itemInfo: { flex: 1 },
});

export default function OrderConfirmationScreen({
  order,
  onTrackOrder,
  onContinueShopping,
}) {
  if (!order) {
    return (
      <View style={[styles.screen, appStyles.centeredContent]}>
        <Text style={styles.heading}>Order details unavailable</Text>
        <Text style={styles.subtitle}>
          Return to shopping to continue.
        </Text>
        <CustomButton onPress={onContinueShopping} title="Continue Shopping" />
      </View>
    );
  }

  const isPickup = order.fulfilmentMethod === 'pickup';
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.heading}>Order placed successfully</Text>
        <Text style={styles.subtitle}>
          Your order has been sent to {order.store?.name}.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>ORDER ID</Text>
          <Text style={styles.value}>{order.orderId}</Text>
          <Text style={[styles.label, styles.sectionMargin]}>ORDER STATUS</Text>
          <Text style={styles.value}>
            {order.status?.replace(/_/g, ' ') || 'Unavailable'}
          </Text>
          <Text style={[styles.label, styles.sectionMargin]}>
            PAYMENT STATUS
          </Text>
          <Text style={styles.value}>
            {order.paymentStatus === 'pending' &&
            order.paymentMethod === 'cash_on_delivery'
              ? 'Pending · Cash on Delivery due on receipt'
              : paymentStatusLabels[order.paymentStatus] ||
                order.paymentStatus ||
                'Unavailable'}
          </Text>
          <Text style={[styles.label, styles.sectionMargin]}>ORDER TOTAL</Text>
          <Text style={[styles.value, styles.total]}>
            {money(order.grandTotal)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={appStyles.sectionHeading}>Store</Text>
          <Text style={styles.value}>{order.store?.name}</Text>
          <Text style={styles.detail}>
            {isPickup
              ? order.store?.address
              : `${order.store?.address || ''}${
                  order.store?.address && order.store?.city ? ', ' : ''
                }${order.store?.city || ''}`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={appStyles.sectionHeading}>
            {isPickup ? 'Store Pickup' : 'Delivery'}
          </Text>
          {isPickup ? (
            <Text style={styles.detail}>
              Collect your order from the store. Estimated preparation time:{' '}
              {order.estimatedTimeMin === order.estimatedTimeMax
                ? `${order.estimatedTimeMin} min`
                : `${order.estimatedTimeMin}-${order.estimatedTimeMax} min`}
            </Text>
          ) : (
            <>
              <Text style={styles.detail}>
                {order.address?.name}
                {order.address?.phone ? ` · ${order.address.phone}` : ''}
              </Text>
              <Text style={styles.detail}>
                {order.address?.houseNumber}, {order.address?.street},{' '}
                {order.address?.city}, {order.address?.state}{' '}
                {order.address?.pinCode}
              </Text>
              <Text style={styles.detail}>
                Estimated delivery:{' '}
                {order.estimatedTimeMin === order.estimatedTimeMax
                  ? `${order.estimatedTimeMin} min`
                  : `${order.estimatedTimeMin}-${order.estimatedTimeMax} min`}
              </Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={appStyles.sectionHeading}>Ordered Products</Text>
          {order.items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.row}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : null}
              <View style={styles.itemInfo}>
                <Text style={styles.item}>{item.name}</Text>
                <Text style={styles.itemDetail}>
                  {[item.brand, item.size, `Qty ${item.quantity}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={styles.amount}>{money(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.action}>
          <CustomButton onPress={onTrackOrder} title="Track Order" />
        </View>
        <View style={styles.action}>
          <CustomButton
            onPress={onContinueShopping}
            title="Continue Shopping"
          />
        </View>
      </ScrollView>
    </View>
  );
}

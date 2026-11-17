import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomButton from '../../components/CustomButton';
import AddressScreen from '../address/AddressScreen';
import {
  applyCoupon as applyCouponRequest,
  buildCheckoutPayload,
  createOrder,
  createSavedAddress,
  getAvailablePaymentMethods,
  getCheckoutOptions,
  getOrderDetails,
  removeCoupon as removeCouponRequest,
  getSavedAddresses,
  validateAddress,
  validateCheckout,
} from '../../services/checkoutService';
import {
  initiatePayment,
  isPaymentMethodReady,
} from '../../services/paymentService';
import { checkoutColors, checkoutStyles as styles } from './checkoutStyles';

const paymentOptions = {
  upi: { icon: '📲', title: 'UPI' },
  card: { icon: '💳', title: 'Credit / Debit Card' },
  net_banking: { icon: '🏦', title: 'Net Banking' },
  cash_on_delivery: { icon: '💵', title: 'Cash on Delivery' },
};

const money = amount =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const createIdempotencyKey = () =>
  `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;

function Section({ title, action, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function FulfilmentCard({
  icon,
  title,
  description,
  detail,
  selected,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.fulfilmentCard, selected && styles.fulfilmentSelected]}
    >
      <View style={styles.fulfilmentTop}>
        <View style={styles.fulfilmentIdentity}>
          <View
            style={[
              styles.fulfilmentIcon,
              selected && styles.fulfilmentIconSelected,
            ]}
          >
            <Text style={styles.fulfilmentEmoji}>{icon}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.fulfilmentTitle}>{title}</Text>
            <Text style={styles.fulfilmentDescription}>{description}</Text>
          </View>
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Text style={styles.checkText}>✓</Text> : null}
        </View>
      </View>
      {detail ? <Text style={styles.fulfilmentDetail}>{detail}</Text> : null}
    </Pressable>
  );
}

export default function CheckoutScreen({
  cart,
  store,
  fulfilmentMethod: initialFulfilmentMethod,
  session,
  currentCoordinates,
  locationError,
  onLocateAddress,
  onBack,
  onSignIn,
  onOrderPlaced,
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [fulfilmentMethod, setFulfilmentMethod] = useState(
    initialFulfilmentMethod || cart[0]?.fulfillmentMethod || 'delivery',
  );
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [addressBookVisible, setAddressBookVisible] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [priceConfirmed, setPriceConfirmed] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const quoteSequence = useRef(0);
  const quoteRef = useRef(null);
  const idempotencyKey = useRef(createIdempotencyKey());
  const token = session?.token;

  useEffect(() => {
    quoteRef.current = quote;
  }, [quote]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      setLoadError('Sign in before placing an order.');
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setLoadError('');
    Promise.allSettled([
      getCheckoutOptions(token, store?.id),
      getSavedAddresses(token),
    ]).then(([optionsResult, addressesResult]) => {
      if (!active) return;
      if (optionsResult.status === 'fulfilled') {
        const nextOptions = optionsResult.value;
        setOptions(nextOptions);
        const availablePaymentMethods =
          getAvailablePaymentMethods(nextOptions).filter(
            isPaymentMethodReady,
          );
        setPaymentMethod(current =>
          availablePaymentMethods.includes(current)
            ? current
            : availablePaymentMethods[0] || null,
        );
        const available = [
          nextOptions.store.deliveryAvailable && 'delivery',
          nextOptions.store.pickupAvailable && 'pickup',
        ].filter(Boolean);
        const preferred =
          initialFulfilmentMethod || cart[0]?.fulfillmentMethod;
        setFulfilmentMethod(
          available.includes(preferred)
            ? preferred
            : available.includes('delivery')
              ? 'delivery'
              : available[0] || null,
        );
      } else {
        setLoadError(optionsResult.reason?.message || 'Unable to load this store.');
      }

      if (addressesResult.status === 'fulfilled') {
        const savedAddresses = addressesResult.value;
        setAddresses(savedAddresses);
        setSelectedAddressId(current =>
          savedAddresses.some(address => String(address.id) === String(current))
            ? current
            : savedAddresses[0]?.id ?? null,
        );
      } else {
        setLoadError(
          current =>
            current ||
            addressesResult.reason?.message ||
            'Unable to load saved addresses.',
        );
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [token, store?.id, initialFulfilmentMethod, cart, loadAttempt]);

  const buildCheckoutRequest = useCallback(() => {
    return buildCheckoutPayload({
      storeId: store?.id,
      items: cart,
      quotedItems: quoteRef.current?.items,
      fulfilmentMethod,
      addressId: selectedAddressId,
      paymentMethod,
      couponCode,
    });
  }, [
    cart,
    couponCode,
    fulfilmentMethod,
    paymentMethod,
    selectedAddressId,
    store?.id,
  ]);

  const refreshQuote = useCallback(() => {
    if (
      !token ||
      !options ||
      !cart.length ||
      !fulfilmentMethod ||
      (fulfilmentMethod === 'delivery' && !selectedAddressId)
    ) {
      quoteRef.current = null;
      setQuote(null);
      setQuoteError('');
      setQuoteLoading(false);
      return undefined;
    }

    const requestId = ++quoteSequence.current;
    setQuoteLoading(true);
    setQuoteError('');
    const request = buildCheckoutRequest();
    const quoteRequest = couponCode
      ? applyCouponRequest(token, request, couponCode)
      : quoteRef.current?.coupon
        ? removeCouponRequest(token, request)
        : fulfilmentMethod === 'delivery'
          ? validateAddress(token, request)
          : validateCheckout(token, request);
    return quoteRequest
      .then(nextQuote => {
        if (requestId !== quoteSequence.current) return;
        quoteRef.current = nextQuote;
        setQuote(nextQuote);
        setPriceConfirmed(
          !nextQuote.items.some(item => item.priceChanged),
        );
      })
      .catch(error => {
        if (requestId !== quoteSequence.current) return;
        quoteRef.current = null;
        setQuote(null);
        if (error.code === 'INVALID_COUPON' && couponCode) {
          setCouponError(error.message);
          setCouponCode('');
          return;
        }
        setQuoteError(
          error instanceof Error
            ? error.message
            : 'Unable to validate your order.',
        );
      })
      .finally(() => {
        if (requestId === quoteSequence.current) setQuoteLoading(false);
      });
  }, [
    token,
    options,
    cart,
    fulfilmentMethod,
    selectedAddressId,
    buildCheckoutRequest,
    couponCode,
  ]);

  useEffect(() => {
    refreshQuote();
    return () => {
      quoteSequence.current += 1;
    };
  }, [refreshQuote]);

  const addAddress = async address => {
    const created = await createSavedAddress(token, address);
    setAddresses(current => [created, ...current]);
    setSelectedAddressId(created.id);
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponCode(code);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponError('');
  };

  const submitOrder = async () => {
    if (!quote || placingOrder || !priceConfirmed || !cart.length) return;
    const currentQuote = quoteRef.current;
    if (!currentQuote) {
      setQuoteError('Recheck your order before placing it.');
      return;
    }
    setPlacingOrder(true);
    setQuoteError('');
    try {
      const request = buildCheckoutPayload({
        storeId: store?.id,
        items: cart,
        quotedItems: currentQuote.items,
        fulfilmentMethod,
        addressId: selectedAddressId,
        paymentMethod,
        couponCode,
      });
      const createdOrder = await createOrder(
        token,
        request,
        idempotencyKey.current,
      );
      let order = createdOrder;
      if (paymentMethod !== 'cash_on_delivery') {
        await initiatePayment({
          orderId: createdOrder.id,
          paymentMethod,
        });
        order = await getOrderDetails(token, createdOrder.id);
      }
      onOrderPlaced(order);
    } catch (error) {
      setQuoteError(
        error instanceof Error
          ? error.message
          : 'Your order could not be placed. Please try again.',
      );
      if (
        ['PRICE_CHANGED', 'OUT_OF_STOCK', 'PRODUCT_UNAVAILABLE'].includes(
          error.code,
        )
      ) {
        refreshQuote();
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const selectedAddress = addresses.find(
    address => String(address.id) === String(selectedAddressId),
  );
  const supportedFulfilments = [
    options?.store.deliveryAvailable && 'delivery',
    options?.store.pickupAvailable && 'pickup',
  ].filter(Boolean);
  const paymentMethods = getAvailablePaymentMethods(options).filter(
    isPaymentMethodReady,
  );
  const canPlaceOrder =
    Boolean(quote) &&
    !quoteLoading &&
    !placingOrder &&
    !quoteError &&
    priceConfirmed &&
    cart.length > 0;
  const visibleItems = showAllItems ? cart : cart.slice(0, 3);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable
              accessibilityLabel="Back to cart"
              onPress={onBack}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.secure}>
            <Text style={styles.secureIcon}>🔒</Text>
            <Text style={styles.secureText}>Secure Checkout</Text>
          </View>
        </View>
        <Text style={styles.intro}>
          Review your order and fulfilment details before placing it.
        </Text>

        {!cart.length ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Add products to your cart before checking out.
            </Text>
            <CustomButton onPress={onBack} title="Return to Cart" />
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            {!token ? (
              <Pressable onPress={onSignIn} style={styles.retry}>
                <Text style={styles.actionText}>Sign in</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setLoadAttempt(value => value + 1)}
                style={styles.retry}
              >
                <Text style={styles.actionText}>Retry</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.card}>
            <ActivityIndicator color={checkoutColors.green} />
            <Text style={[styles.emptyText, styles.centeredText]}>
              Loading secure checkout…
            </Text>
          </View>
        ) : null}

        {!loading && cart.length ? (
          <>
            <Section
              action={
                fulfilmentMethod === 'delivery' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAddressBookVisible(true)}
                  >
                    <Text style={styles.actionText}>
                      {selectedAddress ? 'Change Address' : 'Add Address'}
                    </Text>
                  </Pressable>
                ) : null
              }
              title={
                fulfilmentMethod === 'pickup'
                  ? 'Store Pickup Address'
                  : 'Delivery Address'
              }
            >
              {fulfilmentMethod === 'pickup' ? (
                <View style={styles.addressRow}>
                  <View style={styles.addressIcon}>
                    <Text style={styles.addressIconText}>🏬</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.addressName}>
                      {options?.store.name || store?.name || 'Selected store'}
                    </Text>
                    <Text style={styles.addressLine}>
                      {options?.store.address || 'Pickup address unavailable'}
                      {options?.store.city ? `, ${options.store.city}` : ''}
                    </Text>
                  </View>
                </View>
              ) : selectedAddress ? (
                <View style={styles.addressRow}>
                  <View style={styles.addressIcon}>
                    <Text style={styles.addressIconText}>⌂</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.addressName}>{selectedAddress.name}</Text>
                    <Text style={styles.addressLine}>
                      {selectedAddress.houseNumber}, {selectedAddress.street}
                    </Text>
                    <Text style={styles.addressLine}>
                      {selectedAddress.city}, {selectedAddress.state}{' '}
                      {selectedAddress.pinCode}
                    </Text>
                    <Text style={styles.addressPhone}>
                      {selectedAddress.phone}
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.emptyTitle}>No saved address</Text>
                  <Text style={styles.emptyText}>
                    Add an address and use your location to verify delivery coverage.
                  </Text>
                  <CustomButton
                    onPress={() => setAddressBookVisible(true)}
                    title="Add Address"
                  />
                </View>
              )}
            </Section>

            <Section title="How would you like to receive your order?">
              {supportedFulfilments.includes('delivery') ? (
                <FulfilmentCard
                  description="Get your order delivered to your doorstep."
                  detail={
                    options
                      ? `${options.store.deliveryFee === 0 ? 'FREE DELIVERY' : `${money(options.store.deliveryFee)} delivery fee`}${
                          options.store.deliveryTimeMin != null
                            ? ` · ${options.store.deliveryTimeMin}-${options.store.deliveryTimeMax} min`
                            : ''
                        }`
                      : 'Delivery details will be verified by the store.'
                  }
                  icon="🚚"
                  onPress={() => {
                    setFulfilmentMethod('delivery');
                    setQuoteError('');
                  }}
                  selected={fulfilmentMethod === 'delivery'}
                  title="Home Delivery"
                />
              ) : null}
              {supportedFulfilments.includes('pickup') ? (
                <FulfilmentCard
                  description="Order online and collect your items from the store."
                  detail={`${options?.store.address || 'Pickup address unavailable'}${
                    options?.store.pickupPreparationMinutes != null
                      ? ` · Ready in about ${options.store.pickupPreparationMinutes} min`
                      : ''
                  } · ${
                    options?.store.pickupFee
                      ? `${money(options.store.pickupFee)} pickup fee`
                      : 'No pickup fee'
                  }`}
                  icon="🏬"
                  onPress={() => {
                    setFulfilmentMethod('pickup');
                    setQuoteError('');
                  }}
                  selected={fulfilmentMethod === 'pickup'}
                  title="Store Pickup"
                />
              ) : null}
              {!supportedFulfilments.length && !loadError ? (
                <Text style={styles.emptyText}>
                  This store has no configured fulfilment options.
                </Text>
              ) : null}
            </Section>

            <Section
              action={
                cart.length > 3 ? (
                  <Pressable onPress={() => setShowAllItems(value => !value)}>
                    <Text style={styles.actionText}>
                      {showAllItems ? 'Show Less' : 'View All Items'}
                    </Text>
                  </Pressable>
                ) : null
              }
              title="Your Order"
            >
              {visibleItems.map(cartItem => {
                const currentItem = quote?.items.find(
                  item => item.name === cartItem.name,
                );
                return (
                  <View key={cartItem.name} style={styles.productRow}>
                    <Image
                      source={{
                        uri: currentItem?.image || cartItem.image,
                      }}
                      style={styles.productImage}
                    />
                    <View style={styles.productBody}>
                      <Text numberOfLines={2} style={styles.productName}>
                        {currentItem?.name || cartItem.name}
                      </Text>
                      <Text style={styles.productMeta}>
                        {currentItem?.brand || cartItem.brand || ''}
                        {(currentItem?.brand || cartItem.brand) &&
                        (currentItem?.size || cartItem.size)
                          ? ' · '
                          : ''}
                        {currentItem?.size || cartItem.size || ''}
                      </Text>
                      <Text style={styles.productUnit}>
                        {currentItem
                          ? `${money(currentItem.unitPrice)} each`
                          : 'Price pending server validation'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.productTotal}>
                        {currentItem ? money(currentItem.lineTotal) : '—'}
                      </Text>
                      <Text style={styles.productQuantity}>
                        Qty {currentItem?.quantity ?? cartItem.quantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {quoteLoading ? (
                <ActivityIndicator
                  color={checkoutColors.green}
                  style={styles.spinner}
                />
              ) : null}
            </Section>

            <Section title="Select Payment Method">
              {paymentMethods.length ? (
                paymentMethods.map(method => {
                  const option = paymentOptions[method];
                  if (!option) return null;
                  const selected = paymentMethod === method;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                      style={[
                        styles.paymentOption,
                        selected && styles.paymentSelected,
                      ]}
                    >
                      <Text style={styles.paymentIcon}>{option.icon}</Text>
                      <Text style={styles.paymentTitle}>{option.title}</Text>
                      <View style={[styles.check, selected && styles.checkSelected]}>
                        {selected ? (
                          <Text style={styles.checkText}>✓</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  No payment method is currently available for this store.
                </Text>
              )}
              <Text style={styles.note}>
                Cash on Delivery is the only available option. No payment is collected in the app.
              </Text>
            </Section>

            <Section title="Offers & Coupons">
              {quote?.coupon ? (
                <View style={styles.appliedCoupon}>
                  <View>
                    <Text style={styles.appliedCouponCode}>
                      {quote.coupon.code} applied
                    </Text>
                    <Text style={styles.appliedCouponInfo}>
                      {quote.coupon.description} · {money(quote.coupon.discount)} off
                    </Text>
                  </View>
                  <Pressable onPress={removeCoupon}>
                    <Text style={styles.actionText}>Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponRow}>
                  <TextInput
                    autoCapitalize="characters"
                    onChangeText={setCouponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor={checkoutColors.secondary}
                    style={styles.couponInput}
                    value={couponInput}
                  />
                  <Pressable onPress={applyCoupon} style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </Pressable>
                </View>
              )}
              {couponError ? (
                <Text style={[styles.note, { color: checkoutColors.danger }]}>
                  {couponError}
                </Text>
              ) : null}
              {options?.offers?.length ? (
                options.offers.map(offer => (
                  <Pressable
                    key={offer.code}
                    onPress={() => {
                      setCouponInput(offer.code);
                      setCouponError('');
                      setCouponCode(offer.code);
                    }}
                    style={styles.couponOffer}
                  >
                    <Text style={styles.couponOfferTitle}>{offer.code}</Text>
                    <Text style={styles.couponOfferDetail}>
                      {offer.description}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.note}>
                  No offers are available for this store right now.
                </Text>
              )}
            </Section>

            <Section title="Bill Details">
              {quote ? (
                <>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>{money(quote.itemTotal)}</Text>
                  </View>
                  {quote.productDiscount > 0 ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Product Discount</Text>
                      <Text style={[styles.billValue, { color: checkoutColors.green }]}>
                        −{money(quote.productDiscount)}
                      </Text>
                    </View>
                  ) : null}
                  {fulfilmentMethod === 'delivery' ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Delivery Fee</Text>
                      {quote.deliveryFee === 0 ? (
                        <Text style={[styles.billValue, styles.freeText]}>
                          FREE DELIVERY
                        </Text>
                      ) : (
                        <Text style={styles.billValue}>
                          {money(quote.deliveryFee)}
                        </Text>
                      )}
                    </View>
                  ) : quote.pickupFee > 0 ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Pickup Fee</Text>
                      <Text style={styles.billValue}>{money(quote.pickupFee)}</Text>
                    </View>
                  ) : null}
                  {quote.handlingFee > 0 ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Handling Fee</Text>
                      <Text style={styles.billValue}>{money(quote.handlingFee)}</Text>
                    </View>
                  ) : null}
                  {quote.taxes > 0 ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Taxes</Text>
                      <Text style={styles.billValue}>{money(quote.taxes)}</Text>
                    </View>
                  ) : null}
                  {quote.couponDiscount > 0 ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Coupon Discount</Text>
                      <Text style={[styles.billValue, { color: checkoutColors.green }]}>
                        −{money(quote.couponDiscount)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.grandLabel}>Grand Total</Text>
                    <Text style={styles.grandValue}>
                      {money(quote.grandTotal)}
                    </Text>
                  </View>
                </>
              ) : quoteLoading ? (
                <ActivityIndicator color={checkoutColors.green} />
              ) : (
                <Text style={styles.emptyText}>
                  A verified bill will appear after the server checks your cart and fulfilment details.
                </Text>
              )}
            </Section>
          </>
        ) : null}

        {quoteError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{quoteError}</Text>
            <Pressable onPress={refreshQuote} style={styles.retry}>
              <Text style={styles.actionText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}
        {quote?.items.some(item => item.priceChanged) && !priceConfirmed ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              One or more prices changed. Review the updated server total before continuing.
            </Text>
            <Pressable
              onPress={() => setPriceConfirmed(true)}
              style={styles.retry}
            >
              <Text style={styles.actionText}>Use Updated Prices</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {cart.length ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canPlaceOrder }}
            disabled={!canPlaceOrder}
            onPress={submitOrder}
            style={[
              styles.footerButton,
              !canPlaceOrder && styles.footerButtonDisabled,
            ]}
          >
            {placingOrder ? (
              <ActivityIndicator color={checkoutColors.white} />
            ) : (
              <>
                <Text style={styles.footerIcon}>🛍</Text>
                <Text style={styles.footerButtonText}>
                  {quote
                    ? `Place Order · ${money(quote.grandTotal)}`
                    : 'Place Order'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      <AddressScreen
        addressBook
        addresses={addresses}
        currentCoordinates={currentCoordinates}
        customer={session?.user}
        locationError={locationError}
        onClose={() => setAddressBookVisible(false)}
        onCreateAddress={addAddress}
        onLocateAddress={onLocateAddress}
        onSelectAddress={address => setSelectedAddressId(address.id)}
        selectedAddressId={selectedAddressId}
        visible={addressBookVisible}
      />
    </View>
  );
}

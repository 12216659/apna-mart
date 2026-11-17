import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import { styles } from '../../theme/styles';

export default function AddressScreen({
  visible,
  locations,
  addressDraft,
  onClose,
  onSelectLocation,
  onAddressDraftChange,
  onSaveAddress,
  addressBook = false,
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onCreateAddress,
  onLocateAddress,
  currentCoordinates,
  locationError,
  customer,
}) {
  const [addingAddress, setAddingAddress] = useState(false);
  const [fields, setFields] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [formError, setFormError] = useState('');
  const updateField = (field, value) =>
    setFields(current => ({ ...current, [field]: value }));
  const addressIsValid =
    Object.values(fields).every(value => value.trim()) &&
    /^[6-9]\d{9}$/.test(fields.phone) &&
    /^\d{6}$/.test(fields.pinCode) &&
    Boolean(currentCoordinates);
  const saveAddress = async () => {
    setFormError('');
    try {
      await onCreateAddress({
        ...fields,
        latitude: currentCoordinates.latitude,
        longitude: currentCoordinates.longitude,
      });
      setAddingAddress(false);
      setFields({
        name: customer?.name || '',
        phone: customer?.phone || '',
        houseNumber: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to save this address.',
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {addressBook ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.flex}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {addingAddress ? 'Add New Address' : 'Delivery Addresses'}
                </Text>
                <Pressable accessibilityLabel="Close" onPress={onClose}>
                  <Text style={styles.modalClose}>{'\u00d7'}</Text>
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {addingAddress ? (
                  <>
                    {[
                      ['name', 'Full name'],
                      ['phone', 'Phone number'],
                      ['houseNumber', 'House / Flat number'],
                      ['street', 'Street / Area'],
                      ['city', 'City'],
                      ['state', 'State'],
                      ['pinCode', 'PIN code'],
                    ].map(([field, label]) => (
                      <TextInput
                        key={field}
                        autoCapitalize={field === 'phone' || field === 'pinCode' ? 'none' : 'words'}
                        keyboardType={
                          field === 'phone' || field === 'pinCode'
                            ? 'number-pad'
                            : 'default'
                        }
                        maxLength={
                          field === 'phone'
                            ? 10
                            : field === 'pinCode'
                              ? 6
                              : undefined
                        }
                        onChangeText={value =>
                          updateField(
                            field,
                            field === 'phone' || field === 'pinCode'
                              ? value.replace(/\D/g, '')
                              : value,
                          )
                        }
                        placeholder={label}
                        style={styles.textInput}
                        value={fields[field]}
                      />
                    ))}
                    <CustomButton
                      onPress={onLocateAddress}
                      title={
                        currentCoordinates
                          ? 'Location attached ✓'
                          : 'Use current location for delivery'
                      }
                    />
                    {locationError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {locationError}
                      </Text>
                    ) : null}
                    <Text style={styles.mutedText}>
                      A location pin is required to verify delivery coverage.
                    </Text>
                    {formError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {formError}
                      </Text>
                    ) : null}
                    <CustomButton
                      disabled={!addressIsValid}
                      onPress={saveAddress}
                      title="Save address"
                    />
                    <Pressable
                      onPress={() => setAddingAddress(false)}
                      style={styles.changeFulfillmentButton}
                    >
                      <Text style={styles.changeFulfillmentText}>Cancel</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {addresses.length ? (
                      addresses.map(address => (
                        <Pressable
                          key={address.id}
                          onPress={() => {
                            onSelectAddress(address);
                            onClose();
                          }}
                          style={[
                            styles.locationOption,
                            String(address.id) === String(selectedAddressId) &&
                              styles.fulfilmentOptionSelected,
                          ]}
                        >
                          <Text style={styles.locationOptionIcon}>
                            {'\u2302'}
                          </Text>
                          <View style={styles.flex}>
                            <Text style={styles.productName}>{address.name}</Text>
                            <Text style={styles.mutedText}>
                              {address.houseNumber}, {address.street}
                            </Text>
                            <Text style={styles.mutedText}>
                              {address.city}, {address.state} {address.pinCode}
                            </Text>
                            <Text style={styles.mutedText}>{address.phone}</Text>
                          </View>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No saved delivery address yet.
                      </Text>
                    )}
                    <CustomButton
                      onPress={() => setAddingAddress(true)}
                      title="Add New Address"
                    />
                  </>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a delivery address</Text>
                <Pressable accessibilityLabel="Close" onPress={onClose}>
                  <Text style={styles.modalClose}>{'\u00d7'}</Text>
                </Pressable>
              </View>
              {locations.map(location => (
                <Pressable
                  key={location.name}
                  onPress={() => onSelectLocation(location)}
                  style={styles.locationOption}
                >
                  <Text style={styles.locationOptionIcon}>
                    {location.name === 'Home' ? '\u2302' : '\u25a3'}
                  </Text>
                  <View>
                    <Text style={styles.productName}>{location.name}</Text>
                    <Text style={styles.mutedText}>{location.address}</Text>
                  </View>
                </Pressable>
              ))}
              <Text style={styles.inputLabel}>Add another address</Text>
              <TextInput
                onChangeText={onAddressDraftChange}
                placeholder="Area or address"
                style={styles.textInput}
                value={addressDraft}
              />
              <CustomButton
                disabled={!addressDraft.trim()}
                onPress={onSaveAddress}
                title="Save address"
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

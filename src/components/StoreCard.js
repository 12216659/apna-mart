import { Image, Pressable, Text, View } from 'react-native';
import { styles } from '../theme/styles';

export default function StoreCard({ store, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.storeCard}>
      <Image source={{ uri: store.image }} style={styles.storeImage} />
      <View style={styles.storeDetails}>
        <View style={styles.storeInitials}>
          <Text style={styles.storeInitialsText}>
            {store.logo ?? store.initials ?? 'SL'}
          </Text>
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

import { Pressable, Text, View } from 'react-native';
import { styles } from '../theme/styles';

export default function Header({ session, onProfilePress, onHomePress }) {
  return (
    <View style={styles.appHeader}>
      <Pressable onPress={onHomePress} style={styles.brandLockup}>
        <Text style={styles.brandIcon}>🛍</Text>
        <View>
          <Text style={styles.brandName}>
            APNA <Text style={styles.brandHighlight}>MART</Text>
          </Text>
          <Text style={styles.brandTagline}>Apni Dukaan, Ab Aapke Paas.</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Your profile"
        onPress={onProfilePress}
        style={styles.headerProfile}
      >
        <Text style={styles.headerProfileText}>
          {session ? session.user.name.charAt(0).toUpperCase() : '♙'}
        </Text>
      </Pressable>
    </View>
  );
}

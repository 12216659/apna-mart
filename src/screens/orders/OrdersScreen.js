import { Text, View } from 'react-native';
import { styles } from '../../theme/styles';
export default function OrdersScreen() {
  return (
    <View style={styles.centeredContent}>
      <Text style={styles.largeEmoji}>📦</Text>
      <Text style={styles.sectionHeading}>Your orders</Text>
      <Text style={styles.emptyText}>
        Your orders will appear here after you place one.
      </Text>
    </View>
  );
}

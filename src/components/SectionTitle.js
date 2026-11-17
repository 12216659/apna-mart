import { Text, View } from 'react-native';
import { styles } from '../theme/styles';

export default function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

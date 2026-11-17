import { Text, View } from 'react-native';
import SectionTitle from '../../components/SectionTitle';
import { styles } from '../../theme/styles';

export default function ProductListScreen({
  title,
  subtitle,
  products,
  renderProduct,
}) {
  return (
    <View style={styles.sectionBlock}>
      <SectionTitle title={title} subtitle={subtitle} />
      <View style={styles.productGrid}>
        {products.length ? (
          products.map(renderProduct)
        ) : (
          <Text style={styles.emptyText}>
            No matching products yet. Try another search or category.
          </Text>
        )}
      </View>
    </View>
  );
}

import { Pressable, Text } from 'react-native';
import { styles } from '../theme/styles';

export default function CustomButton({ title, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

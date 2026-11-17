import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { COLORS, styles } from '../theme/styles';

export default function SearchBar({ value, onSearchChange }) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (!value) {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(inputValue), 250);
    return () => clearTimeout(timeout);
  }, [inputValue, onSearchChange]);

  return (
    <View style={styles.storeSearchBar}>
      <Text style={styles.storeSearchIcon}>⌕</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setInputValue}
        onSubmitEditing={() => onSearchChange(inputValue)}
        placeholder="Search stores or products..."
        placeholderTextColor={COLORS.muted}
        returnKeyType="search"
        spellCheck={false}
        style={styles.storeSearchInput}
        value={inputValue}
      />
      <Pressable
        accessibilityLabel="Clear store search"
        accessibilityRole="button"
        disabled={!inputValue}
        onPress={() => setInputValue('')}
        style={[
          styles.storeSearchClear,
          !inputValue && styles.storeSearchClearDisabled,
        ]}
      >
        <Text style={styles.storeSearchClearText}>×</Text>
      </Pressable>
    </View>
  );
}

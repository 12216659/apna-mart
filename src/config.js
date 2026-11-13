import { Platform } from 'react-native';

const defaultApiUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;

const locationPermission =
  'Allow Apna Mart to use your location to show nearby shops and delivery areas.';

const appEnvironment =
  process.env.EXPO_PUBLIC_APP_ENV || process.env.APP_ENV || 'development';

module.exports = ({ config }) => ({
  ...config,
  name: 'Apna Mart',
  slug: 'apna-mart',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'apnamart',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.apnamart',
    infoPlist: {
      ...config.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription: locationPermission,
    },
  },
  android: {
    ...config.android,
    package: 'com.apnamart',
  },
  extra: {
    ...(config.extra ?? {}),
    appEnvironment,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      {
        development: process.env.EXPO_PUBLIC_API_URL_DEVELOPMENT || 'https://dev-api.apnamart.example.com',
        preview: process.env.EXPO_PUBLIC_API_URL_PREVIEW || 'https://preview-api.apnamart.example.com',
        production: process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://api.apnamart.example.com',
      }[appEnvironment],
    googleMapsAndroidApiKeyConfigured: Boolean(
      process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    ),
    googleAuth: {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    './plugins/with-development-cleartext.js',
    'expo-secure-store',
    'expo-web-browser',
    [
      'expo-location',
      {
        locationWhenInUsePermission: locationPermission,
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
      },
    ],
  ],
});

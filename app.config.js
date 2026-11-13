const locationPermission =
  'Allow Apna Mart to use your location to show nearby shops and delivery areas.';

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
  plugins: [
    ...(config.plugins ?? []),
    './plugins/with-development-cleartext.js',
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

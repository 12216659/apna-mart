import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import COLORS from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 13,
    minHeight: 47,
    paddingHorizontal: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  icon: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 9,
  },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  setupNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    textAlign: 'center',
  },
});

function ConfiguredGoogleButton({
  clientIds,
  disabled,
  onCredential,
  onError,
  onPromptingChange,
}) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: clientIds.androidClientId,
    iosClientId: clientIds.iosClientId,
    webClientId: clientIds.webClientId,
    selectAccount: true,
  });

  const signInWithGoogle = async () => {
    if (!request || disabled || isPrompting) return;
    setIsPrompting(true);
    onPromptingChange?.(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const credential =
          result.params?.id_token || result.authentication?.idToken;
        if (!credential) {
          throw new Error('Google did not return an ID token. Please try again.');
        }
        await onCredential(credential);
      } else if (result.type === 'error') {
        throw new Error(
          result.error?.message || 'Google sign-in could not be completed.',
        );
      }
    } catch (error) {
      onError(error);
    } finally {
      setIsPrompting(false);
      onPromptingChange?.(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || !request || isPrompting }}
      disabled={disabled || !request || isPrompting}
      onPress={signInWithGoogle}
      style={[
        styles.button,
        (disabled || !request || isPrompting) && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.icon}>G</Text>
      <Text style={styles.label}>
        {isPrompting ? 'Connecting to Google…' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}

export default function GoogleSignInButton(props) {
  const clientIds = Constants.expoConfig?.extra?.googleAuth || {};
  const platformClientId =
    Platform.OS === 'android'
      ? clientIds.androidClientId
      : Platform.OS === 'ios'
        ? clientIds.iosClientId
        : clientIds.webClientId;

  if (!platformClientId) {
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={[styles.button, styles.buttonDisabled]}
        >
          <Text style={styles.icon}>G</Text>
          <Text style={styles.label}>Continue with Google</Text>
        </Pressable>
        <Text style={styles.setupNote}>
          Google sign-in needs the OAuth client ID for this platform.
        </Text>
      </View>
    );
  }

  return <ConfiguredGoogleButton clientIds={clientIds} {...props} />;
}

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import {
  authenticateWithGoogle,
  checkPhoneAvailability,
  checkUsernameAvailability,
  loginCustomer,
  registerCustomer,
} from '../../services/authService';
import { COLORS, styles } from '../../theme/styles';
import GoogleSignInButton from './GoogleSignInButton';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const isValidPassword = password =>
  password.length >= 8 &&
  password.length <= 72 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

function availabilityMessage(status, kind) {
  if (status === 'checking') return `Checking ${kind} availability…`;
  if (status === 'available') return `${kind} is available.`;
  if (status === 'error') {
    return `Could not check ${kind.toLowerCase()} availability. The server will verify it during registration.`;
  }
  if (status === 'taken' && kind === 'Username') {
    return 'Username already taken. Please choose another username.';
  }
  if (status === 'taken' && kind === 'Mobile number') {
    return 'You already have an account with this mobile number. Please login instead.';
  }
  return '';
}

export default function AuthForm({
  isRegistering,
  onModeChange,
  onBack,
  onSignedIn,
  initialError = '',
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [googleCredential, setGoogleCredential] = useState('');
  const [googlePhoneRequired, setGooglePhoneRequired] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(null);
  const usernameCheck = useRef(0);
  const phoneCheck = useRef(0);

  const normalizedUsername = username.trim().toLowerCase();
  const validUsername = USERNAME_PATTERN.test(normalizedUsername);
  const validPhone = PHONE_PATTERN.test(phone);

  useEffect(() => {
    const requestId = ++usernameCheck.current;
    if (!isRegistering || googlePhoneRequired || !normalizedUsername) {
      setUsernameStatus('idle');
      return () => {
        usernameCheck.current += 1;
      };
    }
    if (!validUsername) {
      setUsernameStatus('idle');
      return () => {
        usernameCheck.current += 1;
      };
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(normalizedUsername);
        if (requestId === usernameCheck.current) {
          setUsernameStatus(available ? 'available' : 'taken');
        }
      } catch {
        if (requestId === usernameCheck.current) setUsernameStatus('error');
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      usernameCheck.current += 1;
    };
  }, [googlePhoneRequired, isRegistering, normalizedUsername, validUsername]);

  useEffect(() => {
    const shouldCheck = isRegistering || googlePhoneRequired;
    const requestId = ++phoneCheck.current;
    if (!shouldCheck || !phone) {
      setPhoneStatus('idle');
      return () => {
        phoneCheck.current += 1;
      };
    }
    if (!validPhone) {
      setPhoneStatus('idle');
      return () => {
        phoneCheck.current += 1;
      };
    }

    setPhoneStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkPhoneAvailability(phone);
        if (requestId === phoneCheck.current) {
          setPhoneStatus(available ? 'available' : 'taken');
        }
      } catch {
        if (requestId === phoneCheck.current) setPhoneStatus('error');
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      phoneCheck.current += 1;
    };
  }, [googlePhoneRequired, isRegistering, phone, validPhone]);

  const handleAuthError = error => {
    if (error?.code === 'USERNAME_TAKEN') setUsernameStatus('taken');
    if (error?.code === 'PHONE_TAKEN') setPhoneStatus('taken');
    setFormError(
      error instanceof Error ? error.message : 'Unable to connect to APNA MART.',
    );
  };

  const validateRegistration = () => {
    if (!name.trim()) return 'Enter your full name.';
    if (!validUsername) {
      return 'Username must be 3-30 letters, numbers, dots, underscores or hyphens.';
    }
    if (!validPhone) return 'Enter a valid 10-digit mobile number.';
    if (usernameStatus === 'checking' || usernameStatus === 'idle') {
      return 'Wait for the username availability check to finish.';
    }
    if (usernameStatus === 'taken') {
      return 'Username already taken. Please choose another username.';
    }
    if (phoneStatus === 'checking' || phoneStatus === 'idle') {
      return 'Wait for the mobile number availability check to finish.';
    }
    if (phoneStatus === 'taken') {
      return 'You already have an account with this mobile number. Please login instead.';
    }
    if (!isValidPassword(password)) {
      return 'Use 8-72 characters with at least one letter and one number.';
    }
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const completeGoogleSignIn = async (credential, phoneNumber) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      const result = await authenticateWithGoogle(credential, phoneNumber);
      if (result.requiresPhone) {
        setGoogleCredential(credential);
        setGooglePhoneRequired(true);
        setGoogleProfile(result.profile);
        setFormError(
          'Add a valid mobile number before completing Google sign-in.',
        );
        return;
      }
      await onSignedIn(result);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = credential =>
    completeGoogleSignIn(
      credential,
      isRegistering && validPhone && phoneStatus === 'available'
        ? phone
        : undefined,
    );

  const showSuccessAndContinue = (title, session) => {
    Alert.alert(title, '', [
      {
        text: 'Continue',
        onPress: () => {
          Promise.resolve(onSignedIn(session)).catch(handleAuthError);
        },
      },
    ]);
  };

  const submit = async () => {
    setFormError('');
    if (googlePhoneRequired) {
      if (!validPhone) {
        setFormError('Enter a valid 10-digit mobile number.');
        return;
      }
      if (phoneStatus === 'checking' || phoneStatus === 'idle') {
        setFormError('Wait for the mobile number availability check to finish.');
        return;
      }
      if (phoneStatus === 'taken') {
        setFormError(
          'You already have an account with this mobile number. Please login instead.',
        );
        return;
      }
      if (!googleCredential) {
        setFormError('Restart Google sign-in to continue.');
        return;
      }
    } else if (isRegistering) {
      const validationError = validateRegistration();
      if (validationError) {
        setFormError(validationError);
        return;
      }
    } else if (!identifier.trim() || !password) {
      setFormError('Enter your username or phone number and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (googlePhoneRequired) {
        const result = await authenticateWithGoogle(googleCredential, phone);
        if (result.requiresPhone) {
          setFormError('A mobile number is required to complete registration.');
          return;
        }
        showSuccessAndContinue(
          'Google account connected successfully. Welcome to APNA MART!',
          result,
        );
      } else if (isRegistering) {
        const session = await registerCustomer({
          name: name.trim(),
          username: normalizedUsername,
          phone,
          password,
        });
        showSuccessAndContinue(
          'Account created successfully. Welcome to APNA MART!',
          session,
        );
      } else {
        await onSignedIn(
          await loginCustomer({
            identifier: identifier.trim(),
            password,
          }),
        );
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameMessage = availabilityMessage(usernameStatus, 'Username');
  const phoneMessage = availabilityMessage(phoneStatus, 'Mobile number');
  const phoneTaken =
    phoneStatus === 'taken' || formError.includes('already have an account');
  const registrationPending =
    usernameStatus === 'checking' ||
    (validUsername && usernameStatus === 'idle') ||
    phoneStatus === 'checking' ||
    (validPhone && phoneStatus === 'idle');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.loginPage}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ Back to shopping</Text>
        </Pressable>
        <View style={styles.loginCard}>
          <Text style={styles.loginBrand}>
            🛍 APNA <Text style={styles.brandHighlight}>MART</Text>
          </Text>
          <Text style={styles.loginTagline}>Apni Dukaan, Ab Aapke Paas.</Text>
          <Text style={styles.loginTitle}>
            {googlePhoneRequired
              ? 'Complete your Google account'
              : isRegistering
                ? 'Create your account'
                : 'Welcome back!'}
          </Text>
          <Text style={styles.loginSubtitle}>
            {googlePhoneRequired
              ? `Welcome${googleProfile?.name ? `, ${googleProfile.name}` : ''}. Add a mobile number to finish setting up your account.`
              : isRegistering
                ? 'Create an account to continue shopping.'
                : 'Sign in with your username or mobile number.'}
          </Text>

          {googlePhoneRequired ? (
            <>
              <Text style={styles.inputLabel}>Mobile number</Text>
              <TextInput
                autoComplete="tel"
                keyboardType="number-pad"
                maxLength={10}
                onChangeText={value => {
                  setPhone(value.replace(/\D/g, ''));
                  setFormError('');
                }}
                placeholder="10-digit mobile number"
                style={styles.textInput}
                value={phone}
              />
              {phoneMessage ? (
                <Text
                  style={[
                    styles.authStatus,
                    phoneStatus === 'available' && styles.authStatusSuccess,
                    phoneStatus === 'taken' && styles.errorText,
                  ]}
                >
                  {phoneMessage}
                </Text>
              ) : null}
              {phoneTaken ? (
                <Pressable onPress={() => onModeChange('Login')}>
                  <Text style={styles.authInlineLink}>Go to Login</Text>
                </Pressable>
              ) : null}
              {formError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {formError}
                </Text>
              ) : null}
              <CustomButton
                disabled={
                  isSubmitting ||
                  !validPhone ||
                  phoneStatus === 'checking' ||
                  phoneStatus === 'idle' ||
                  phoneStatus === 'taken'
                }
                onPress={submit}
                title={isSubmitting ? 'Please wait…' : 'Continue with Google'}
              />
            </>
          ) : (
            <>
              {isRegistering ? (
                <>
                  <Text style={styles.inputLabel}>Full name</Text>
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    maxLength={80}
                    onChangeText={setName}
                    placeholder="Your name"
                    style={styles.textInput}
                    value={name}
                  />
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="username-new"
                    maxLength={30}
                    onChangeText={value => {
                      setUsername(value);
                      setFormError('');
                    }}
                    placeholder="Choose a username"
                    style={styles.textInput}
                    value={username}
                  />
                  {usernameMessage ? (
                    <Text
                      style={[
                        styles.authStatus,
                        usernameStatus === 'available' &&
                          styles.authStatusSuccess,
                        usernameStatus === 'taken' && styles.errorText,
                      ]}
                    >
                      {usernameMessage}
                    </Text>
                  ) : null}
                  <Text style={styles.inputLabel}>Mobile number</Text>
                  <TextInput
                    autoComplete="tel"
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={value => {
                      setPhone(value.replace(/\D/g, ''));
                      setFormError('');
                    }}
                    placeholder="10-digit mobile number"
                    style={styles.textInput}
                    value={phone}
                  />
                  {phoneMessage ? (
                    <Text
                      style={[
                        styles.authStatus,
                        phoneStatus === 'available' && styles.authStatusSuccess,
                        phoneStatus === 'taken' && styles.errorText,
                      ]}
                    >
                      {phoneMessage}
                    </Text>
                  ) : null}
                  {phoneTaken ? (
                    <Pressable onPress={() => onModeChange('Login')}>
                      <Text style={styles.authInlineLink}>Go to Login</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>
                    Username or mobile number
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="username"
                    onChangeText={setIdentifier}
                    placeholder="Enter username or 10-digit number"
                    style={styles.textInput}
                    value={identifier}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete={isRegistering ? 'new-password' : 'password'}
                  maxLength={72}
                  onChangeText={setPassword}
                  placeholder={isRegistering ? 'Create a password' : 'Enter your password'}
                  secureTextEntry={!passwordVisible}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={
                    passwordVisible ? 'Hide password' : 'Show password'
                  }
                  accessibilityRole="button"
                  onPress={() => setPasswordVisible(value => !value)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.passwordToggleText}>
                    {passwordVisible ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>

              {isRegistering ? (
                <>
                  <Text style={styles.authStatus}>
                    Use 8-72 characters with at least one letter and one number.
                  </Text>
                  <Text style={styles.inputLabel}>Confirm password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="new-password"
                      maxLength={72}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      secureTextEntry={!confirmPasswordVisible}
                      style={styles.passwordInput}
                      value={confirmPassword}
                    />
                    <Pressable
                      accessibilityLabel={
                        confirmPasswordVisible
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      accessibilityRole="button"
                      onPress={() =>
                        setConfirmPasswordVisible(value => !value)
                      }
                      style={styles.passwordToggle}
                    >
                      <Text style={styles.passwordToggleText}>
                        {confirmPasswordVisible ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : null}

              {formError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {formError}
                </Text>
              ) : null}
              <CustomButton
                disabled={
                  isSubmitting ||
                  (isRegistering
                    ? !name.trim() ||
                      !validUsername ||
                      !validPhone ||
                      !isValidPassword(password) ||
                      password !== confirmPassword ||
                      registrationPending ||
                      usernameStatus === 'taken' ||
                      phoneStatus === 'taken'
                    : !password || !identifier.trim())
                }
                onPress={submit}
                title={
                  isSubmitting
                    ? 'Please wait…'
                    : isRegistering
                      ? 'Create account'
                      : 'Login'
                }
              />
            </>
          )}

          {isSubmitting ? (
            <ActivityIndicator
              color={COLORS.green}
              style={styles.submitSpinner}
            />
          ) : null}

          {!googlePhoneRequired ? (
            <>
              <View style={styles.authDivider}>
                <View style={styles.authDividerLine} />
                <Text style={styles.authDividerText}>OR</Text>
                <View style={styles.authDividerLine} />
              </View>
              <GoogleSignInButton
                disabled={isSubmitting}
                onCredential={handleGoogleCredential}
                onError={handleAuthError}
                onPromptingChange={setIsSubmitting}
              />
            </>
          ) : null}

          <View style={styles.authSwitch}>
            <Text style={styles.mutedText}>
              {isRegistering
                ? 'Already have an account? '
                : "Don't have an account? "}
            </Text>
            <Pressable
              onPress={() => {
                onModeChange(isRegistering ? 'Login' : 'Register');
                setFormError('');
              }}
            >
              <Text style={styles.linkText}>
                {isRegistering ? 'Login' : 'Sign Up'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.legalNote}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import SectionTitle from '../../components/SectionTitle';
import { COLORS, styles } from '../../theme/styles';
export default function ProfileScreen({
  sessionLoading,
  session,
  signOut,
  sessionError,
  setScreen,
}) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <SectionTitle
        title="Your account"
        subtitle="Manage your Apna Mart account."
      />
      {sessionLoading ? (
        <ActivityIndicator color={COLORS.green} />
      ) : session ? (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {session.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sectionHeading}>
            Welcome, {session.user.name}
          </Text>
          <Text style={styles.mutedText}>
            {session.user.username || session.user.phone || session.user.email}
          </Text>
          {sessionError ? (
            <Text style={styles.errorText}>{sessionError}</Text>
          ) : null}
          <CustomButton onPress={signOut} title="Sign out" />
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Text style={styles.largeEmoji}>👋</Text>
          <Text style={styles.sectionHeading}>Welcome to Apna Mart</Text>
          <Text style={styles.mutedText}>
            Sign in to manage your addresses, saved items and account details.
          </Text>
          {sessionError ? (
            <Text style={styles.errorText}>{sessionError}</Text>
          ) : null}
          <CustomButton
            onPress={() => setScreen('Login')}
            title="Sign in or create account"
          />
        </View>
      )}
    </ScrollView>
  );
}

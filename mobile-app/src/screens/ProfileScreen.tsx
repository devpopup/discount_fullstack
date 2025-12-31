import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  SignIn: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Favorites: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Redemption: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleHelpSupport = () => {
    const email = 'info@popupreach.com';
    const subject = 'PopupReach Support Request';
    const body = `Hi PopupReach Support Team,\n\nI need help with:\n\n[Please describe your issue here]\n\n---\nUser: ${user?.email || 'Not signed in'}\nApp Version: 1.0.0`;

    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch((err) => {
      Alert.alert('Error', 'Unable to open email client. Please email us at info@popupreach.com');
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.notSignedInContainer}>
          <Text style={styles.notSignedInTitle}>You're not signed in</Text>
          <Text style={styles.notSignedInText}>
            Sign in to access your profile and saved offers.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(user.full_name || user.email)}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.full_name || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Profile Options */}
      <View style={styles.section}>
        {/* Business-only option */}
        {user.is_business && (
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate('Redemption')}
          >
            <Text style={styles.optionText}>Redeem Offers</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Edit Profile - Temporarily hidden
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        */}

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Text style={styles.optionText}>Favorites</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Text style={styles.optionText}>Notifications</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.option}
          onPress={handleHelpSupport}
        >
          <Text style={styles.optionText}>Help & Support</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <Text style={styles.optionText}>Terms of Service</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.optionText}>Privacy Policy</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notSignedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notSignedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notSignedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#e94e1b',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e94e1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  signInButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 0,
  },
  signOutButtonText: {
    color: '#e94e1b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginVertical: 20,
  },
});

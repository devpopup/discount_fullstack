import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  NotificationSettings,
} from '../services/notificationService';
import {
  requestGeofencingPermissions,
  isGeofencingActive,
  stopGeofencing,
} from '../services/geofencingService';
import {
  registerBackgroundOfferCheck,
  unregisterBackgroundOfferCheck,
  isBackgroundCheckActive,
} from '../services/offerMonitoringService';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    proximityAlerts: false,
    expiringAlerts: false,
    limitedQuantityAlerts: false,
    lastChanceAlerts: false,
  });
  const [loading, setLoading] = useState(true);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [backgroundCheckActive, setBackgroundCheckActive] = useState(false);
  const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getNotificationSettings();
      setSettings(savedSettings);

      const geoActive = await isGeofencingActive();
      setGeofencingActive(geoActive);

      const bgActive = await isBackgroundCheckActive();
      setBackgroundCheckActive(bgActive);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    try {
      const newValue = !settings[key];
      const newSettings = { ...settings, [key]: newValue };

      // Request permissions if enabling any notification
      if (newValue) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive alerts.'
          );
          return;
        }

        // Show prominent disclosure before requesting background location
        if (key === 'proximityAlerts') {
          setShowLocationDisclosure(true);
          return; // Permission request continues after user accepts disclosure
        }
      }

      // Save new settings
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);

      // Start/stop background monitoring based on settings
      if (newSettings.expiringAlerts || newSettings.limitedQuantityAlerts || newSettings.lastChanceAlerts) {
        await registerBackgroundOfferCheck();
        setBackgroundCheckActive(true);
      } else {
        await unregisterBackgroundOfferCheck();
        setBackgroundCheckActive(false);
      }

      // Stop geofencing if proximity alerts are disabled
      if (key === 'proximityAlerts' && !newValue) {
        await stopGeofencing();
        setGeofencingActive(false);
      }

      Alert.alert('Success', 'Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLocationDisclosureAccept = async () => {
    setShowLocationDisclosure(false);
    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive alerts.'
        );
        return;
      }

      const hasGeoPermission = await requestGeofencingPermissions();
      if (!hasGeoPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable "Allow all the time" location access in your device settings to receive proximity alerts.'
        );
        return;
      }

      const newSettings = { ...settings, proximityAlerts: true };
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);
      Alert.alert('Success', 'Notification settings updated');
    } catch (error) {
      console.error('Error enabling proximity alerts:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose which notifications you want to receive
        </Text>

        {/* Proximity Alerts */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <Text style={styles.settingTitle}>Proximity Alerts</Text>
            </View>
            <Text style={styles.settingDescription}>
              Get notified when you're near active offers
            </Text>
          </View>
          <Switch
            value={settings.proximityAlerts}
            onValueChange={() => handleToggle('proximityAlerts')}
            trackColor={{ false: '#ddd', true: '#e94e1b' }}
            thumbColor="#fff"
          />
        </View>

        {/* Expiring Alerts */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <Ionicons name="time" size={24} color="#FFA726" />
              <Text style={styles.settingTitle}>Expiring Soon</Text>
            </View>
            <Text style={styles.settingDescription}>
              Alerts when your saved offers are expiring soon (2 hours or less)
            </Text>
          </View>
          <Switch
            value={settings.expiringAlerts}
            onValueChange={() => handleToggle('expiringAlerts')}
            trackColor={{ false: '#ddd', true: '#e94e1b' }}
            thumbColor="#fff"
          />
        </View>

        {/* Limited Quantity */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <Ionicons name="flame" size={24} color="#e74c3c" />
              <Text style={styles.settingTitle}>Limited Quantity</Text>
            </View>
            <Text style={styles.settingDescription}>
              Get notified when offers you saved have limited claims left (5 or fewer)
            </Text>
          </View>
          <Switch
            value={settings.limitedQuantityAlerts}
            onValueChange={() => handleToggle('limitedQuantityAlerts')}
            trackColor={{ false: '#ddd', true: '#e94e1b' }}
            thumbColor="#fff"
          />
        </View>

        {/* Last Chance */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.settingHeader}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={styles.settingTitle}>Last Chance</Text>
            </View>
            <Text style={styles.settingDescription}>
              Reminder the day before your saved offers expire
            </Text>
          </View>
          <Switch
            value={settings.lastChanceAlerts}
            onValueChange={() => handleToggle('lastChanceAlerts')}
            trackColor={{ false: '#ddd', true: '#e94e1b' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Background Monitoring:</Text>
            <Text style={[styles.statusValue, backgroundCheckActive && styles.statusActive]}>
              {backgroundCheckActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Geofencing:</Text>
            <Text style={[styles.statusValue, geofencingActive && styles.statusActive]}>
              {geofencingActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View> */}

      <View style={styles.infoSection}>
        <Ionicons name="information-circle-outline" size={24} color="#666" />
        <Text style={styles.infoText}>
          When enabled, background alerts allow PopupReach to check for offer updates and
          send notifications even when the app is closed. This may affect battery life.
          You can turn off any alert type here at any time.
        </Text>
      </View>

      {/* Prominent Background Location Disclosure Modal */}
      <Modal
        visible={showLocationDisclosure}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationDisclosure(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconRow}>
              <Ionicons name="location" size={32} color="#e94e1b" />
            </View>
            <Text style={styles.modalTitle}>Background Location Access</Text>
            <Text style={styles.modalBody}>
              To send you proximity alerts when you're near active deals, <Text style={styles.modalBold}>PopupReach needs access to your location at all times</Text>, including when the app is closed or not in use.
            </Text>
            <Text style={styles.modalBody}>
              Your location is used <Text style={styles.modalBold}>only</Text> to detect when you are near a deal and trigger a notification. It is never sold or shared with third parties.
            </Text>
            <Text style={styles.modalNote}>
              On the next screen, select <Text style={styles.modalBold}>"Allow all the time"</Text> to enable this feature.
            </Text>
            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={handleLocationDisclosureAccept}
            >
              <Text style={styles.modalAcceptText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeclineButton}
              onPress={() => setShowLocationDisclosure(false)}
            >
              <Text style={styles.modalDeclineText}>No thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  statusActive: {
    color: '#4CAF50',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalIconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  modalBold: {
    fontWeight: '700',
    color: '#222',
  },
  modalNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  modalAcceptButton: {
    backgroundColor: '#e94e1b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalAcceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDeclineButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalDeclineText: {
    color: '#888',
    fontSize: 14,
  },
});

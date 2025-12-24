import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  BusinessOffers: { businessId: string };
};

type QRScannerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;

interface QRScannerScreenProps {
  navigation: QRScannerNavigationProp;
}

export default function QRScannerScreen({ navigation }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true);

    // Parse the QR code data to determine if it's a business URL or offer ID
    // Business QR codes contain: https://www.popupreach.com/shoppers/business/{businessId}
    // Or deep link: popupreach://business/{businessId}

    try {
      // Check if it's a business URL
      const businessUrlMatch = data.match(/\/shoppers\/business\/([a-f0-9-]+)/i) ||
                              data.match(/popupreach:\/\/business\/([a-f0-9-]+)/i);

      if (businessUrlMatch && businessUrlMatch[1]) {
        // It's a business QR code
        const businessId = businessUrlMatch[1];
        setTimeout(() => {
          navigation.navigate('BusinessOffers', { businessId });
        }, 100);
      } else {
        // Assume it's an offer ID
        setTimeout(() => {
          navigation.navigate('DiscountDetails', { offerId: data });
        }, 100);
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      // Default to offer details
      setTimeout(() => {
        try {
          navigation.navigate('DiscountDetails', { offerId: data });
        } catch (navError) {
          console.error('Navigation error:', navError);
          setScanned(false); // Allow scanning again
        }
      }, 100);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission not granted</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan QR Code</Text>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#fff',
  },
  topLeft: {
    top: '30%',
    left: '20%',
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: '30%',
    right: '20%',
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: '30%',
    left: '20%',
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: '30%',
    right: '20%',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

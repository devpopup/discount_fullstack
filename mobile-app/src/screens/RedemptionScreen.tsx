import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { verifyClaimCode, redeemClaim, ClaimDetails } from '../services/redemptionService';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  MainTabs: undefined;
  SignIn: undefined;
};

type RedemptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RedemptionScreenProps {
  navigation: RedemptionScreenNavigationProp;
}

export default function RedemptionScreen({ navigation }: RedemptionScreenProps) {
  const { user, isAuthenticated } = useAuth();
  const [claimCode, setClaimCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [claimDetails, setClaimDetails] = useState<ClaimDetails | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Check if user is authenticated and is a business
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.notSignedInContainer}>
          <Text style={styles.notSignedInTitle}>Authentication Required</Text>
          <Text style={styles.notSignedInText}>
            Please sign in as a business to access redemption features.
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

  // Check if user is a business
  if (!user.is_business) {
    return (
      <View style={styles.container}>
        <View style={styles.notSignedInContainer}>
          <Text style={styles.notSignedInTitle}>Business Account Required</Text>
          <Text style={styles.notSignedInText}>
            This feature is only available for business accounts.
          </Text>
        </View>
      </View>
    );
  }

  const handleVerify = async () => {
    if (!claimCode.trim()) {
      setError('Please enter a claim code');
      return;
    }

    setError('');
    setIsVerifying(true);
    setClaimDetails(null);
    setIsVerified(false);

    try {
      const result = await verifyClaimCode(claimCode.trim());

      if (result.is_valid && result.claim_details) {
        setIsVerified(true);
        setClaimDetails(result.claim_details);

        // Check if already redeemed
        if (result.claim_details.is_redeemed) {
          Alert.alert(
            'Already Redeemed',
            'This claim has already been redeemed.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setError(result.error_message || result.error || 'Invalid claim code');
        Alert.alert(
          'Verification Failed',
          result.error_message || result.error || 'Invalid claim code',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      setError('Failed to verify claim code. Please try again.');
      Alert.alert('Error', 'Failed to verify claim code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!claimCode.trim() || !isVerified) {
      return;
    }

    if (claimDetails?.is_redeemed) {
      Alert.alert('Already Redeemed', 'This claim has already been redeemed.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem this offer for ${claimDetails?.customer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setIsRedeeming(true);
            setError('');

            try {
              const result = await redeemClaim(claimCode.trim(), notes.trim());

              if (result.success) {
                Alert.alert(
                  'Success',
                  result.message || 'Offer redeemed successfully!',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Reset form
                        setClaimCode('');
                        setNotes('');
                        setClaimDetails(null);
                        setIsVerified(false);
                      },
                    },
                  ]
                );
              } else {
                setError(result.error || 'Failed to redeem claim');
                Alert.alert('Error', result.error || 'Failed to redeem claim');
              }
            } catch (err: any) {
              setError('Failed to redeem claim. Please try again.');
              Alert.alert('Error', 'Failed to redeem claim. Please try again.');
            } finally {
              setIsRedeeming(false);
            }
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setClaimCode('');
    setNotes('');
    setClaimDetails(null);
    setIsVerified(false);
    setError('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Redeem Offer</Text>
          <Text style={styles.subtitle}>
            Enter the customer's claim code to verify and redeem their offer
          </Text>
        </View>

        {/* Claim Code Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Claim Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter claim code"
            value={claimCode}
            onChangeText={setClaimCode}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isVerified}
          />
          {error && !isVerified ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        {/* Verify Button */}
        {!isVerified && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isVerifying || !claimCode.trim()) && styles.disabledButton,
            ]}
            onPress={handleVerify}
            disabled={isVerifying || !claimCode.trim()}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Claim</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Claim Details */}
        {isVerified && claimDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Claim Details</Text>
              {claimDetails.is_redeemed && (
                <View style={styles.redeemedBadge}>
                  <Text style={styles.redeemedText}>REDEEMED</Text>
                </View>
              )}
            </View>

            {/* Product Image */}
            {claimDetails.product_image && (
              <Image
                source={{ uri: claimDetails.product_image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}

            {/* Offer Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Offer:</Text>
              <Text style={styles.detailValue}>{claimDetails.offer_title}</Text>
            </View>

            {claimDetails.product_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product:</Text>
                <Text style={styles.detailValue}>{claimDetails.product_name}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailValue}>{claimDetails.customer_name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{claimDetails.customer_email}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{claimDetails.quantity}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount:</Text>
              <Text style={styles.detailValue}>
                {claimDetails.discount_type === 'percentage'
                  ? `${claimDetails.discount_value}%`
                  : `$${typeof claimDetails.discount_value === 'number' ? claimDetails.discount_value.toFixed(2) : '0.00'}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Claimed:</Text>
              <Text style={styles.detailValue}>
                {new Date(claimDetails.claimed_at).toLocaleDateString()} at{' '}
                {new Date(claimDetails.claimed_at).toLocaleTimeString()}
              </Text>
            </View>

            {/* Notes Input */}
            {!claimDetails.is_redeemed && (
              <View style={styles.notesSection}>
                <Text style={styles.label}>Redemption Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add any notes about this redemption..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              {!claimDetails.is_redeemed ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isRedeeming && styles.disabledButton,
                    ]}
                    onPress={handleRedeem}
                    disabled={isRedeeming}
                  >
                    {isRedeeming ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Complete Redemption</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleReset}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleReset}
                >
                  <Text style={styles.secondaryButtonText}>Verify Another Code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
  },
  errorText: {
    color: '#e94e1b',
    fontSize: 14,
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: '#e94e1b',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e94e1b',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e94e1b',
    fontSize: 16,
    fontWeight: '600',
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
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  redeemedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  redeemedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  notesSection: {
    marginTop: 20,
  },
  buttonGroup: {
    marginTop: 25,
  },
});

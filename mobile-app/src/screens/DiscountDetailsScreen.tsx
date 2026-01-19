import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getOfferById, claimOffer, unclaimOffer, saveOfferToFavorites, removeOfferFromFavorites, getFavoritedOfferIds, getClaimedOfferIds, setOfferReminder, removeOfferReminder, getTotalQuantityClaimed, canClaimMore, getRemainingQuota } from '../services/offersService';
import { Offer } from '../types/offer';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
};

type DiscountDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiscountDetails'
>;

type DiscountDetailsRouteProp = RouteProp<RootStackParamList, 'DiscountDetails'>;

interface DiscountDetailsScreenProps {
  navigation: DiscountDetailsNavigationProp;
  route: DiscountDetailsRouteProp;
}

export default function DiscountDetailsScreen({
  navigation,
  route,
}: DiscountDetailsScreenProps) {
  const { offerId } = route.params;
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [hasReminder, setHasReminder] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(100);
  const [totalClaimed, setTotalClaimed] = useState(0);

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  // Calculate min/max quantity based on offer constraints
  useEffect(() => {
    const fetchClaimedQuantity = async () => {
      if (offer && isAuthenticated) {
        const min = offer.min_claims_per_customer || 1;
        const claimed = await getTotalQuantityClaimed(offer.id);
        setTotalClaimed(claimed);

        const max = offer.max_claims_per_user
          ? Math.max(min, offer.max_claims_per_user - claimed)
          : 100;

        setMinQuantity(min);
        setMaxQuantity(max);
        setQuantity(min); // Initialize to minimum
      }
    };

    fetchClaimedQuantity();
  }, [offer, isAuthenticated]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOfferById(offerId);

      if (result.error) {
        setError(result.error);
      } else if (result.offer) {
        setOffer(result.offer);
        setHasReminder(result.offer.hasReminder || false);

        // Check if offer is claimed and favorited (in parallel for better performance)
        if (isAuthenticated) {
          Promise.all([checkIfClaimed(), checkIfFavorited()]);
        }
      } else {
        setError('Offer not found');
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfClaimed = async () => {
    try {
      const claimedIds = await getClaimedOfferIds();
      setIsClaimed(claimedIds.has(offerId));
    } catch (err) {
      console.error('Error checking claim status:', err);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const favoritedIds = await getFavoritedOfferIds();
      setIsFavorited(favoritedIds.has(offerId));
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleClaimOffer = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to claim offers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
        ]
      );
      return;
    }

    if (!offer) return;

    setClaiming(true);
    try {
      if (isClaimed) {
        const result = await unclaimOffer(offer.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setIsClaimed(false);
          // Refresh total claimed
          const claimed = await getTotalQuantityClaimed(offer.id);
          setTotalClaimed(claimed);
          Alert.alert('Success', 'Offer unclaimed successfully!');
        }
      } else {
        // Check if user can claim more based on quantity available
        if (offer.max_claims_per_user) {
          const userCanClaim = await canClaimMore(offer.id, offer.max_claims_per_user);
          if (!userCanClaim) {
            const totalClaimed = await getTotalQuantityClaimed(offer.id);
            Alert.alert(
              'Limit Reached',
              `You've reached your limit (${totalClaimed}/${offer.max_claims_per_user}) for this offer.`
            );
            setClaiming(false);
            return;
          }
        }

        // Validate minimum quantity
        if (offer.min_claims_per_customer && quantity < offer.min_claims_per_customer) {
          Alert.alert(
            'Invalid Quantity',
            `Minimum claim quantity is ${offer.min_claims_per_customer}.`
          );
          setClaiming(false);
          return;
        }

        // Validate total after claim won't exceed limit
        if (offer.max_claims_per_user) {
          const totalClaimed = await getTotalQuantityClaimed(offer.id);
          if (totalClaimed + quantity > offer.max_claims_per_user) {
            const remaining = offer.max_claims_per_user - totalClaimed;
            Alert.alert(
              'Insufficient Quantity',
              remaining > 0
                ? `Only ${remaining} quantity available. You've already claimed ${totalClaimed}/${offer.max_claims_per_user}.`
                : `You've reached the maximum quantity (${offer.max_claims_per_user}) for this offer.`
            );
            setClaiming(false);
            return;
          }
        }

        const result = await claimOffer(offer.id, 'in_store', quantity);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setIsClaimed(true);
          // Reset quantity to minimum after successful claim
          setQuantity(minQuantity);
          // Refresh total claimed
          const claimed = await getTotalQuantityClaimed(offer.id);
          setTotalClaimed(claimed);
          // Show quantity info in success message if applicable
          if (offer.max_claims_per_user) {
            Alert.alert(
              'Success',
              `Claimed ${quantity}! Quota used: ${claimed}/${offer.max_claims_per_user}. Check the Claims tab for next steps.`
            );
          } else {
            Alert.alert('Success', `Claimed ${quantity}! Check the Claims tab for next steps in redeeming your claim.`);
          }
        }
      }
    } catch (err) {
      Alert.alert('Claim Failed', 'Unable to process this claim. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to save favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
        ]
      );
      return;
    }

    setTogglingFavorite(true);
    try {
      if (isFavorited) {
        const result = await removeOfferFromFavorites(offerId);
        if (result.success) {
          setIsFavorited(false);
          Alert.alert('Success', 'Removed from favorites');
        } else {
          Alert.alert('Error', result.error || 'Failed to remove from favorites');
        }
      } else {
        const result = await saveOfferToFavorites(offerId);
        if (result.success) {
          setIsFavorited(true);
          Alert.alert('Success', 'Added to favorites');
        } else {
          Alert.alert('Error', result.error || 'Failed to save to favorites');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleReminderToggle = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to set reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
          { text: 'Sign Up', onPress: () => navigation.navigate('SignUp') },
        ]
      );
      return;
    }

    setTogglingReminder(true);
    try {
      if (hasReminder) {
        const result = await removeOfferReminder(offerId);
        if (result.success) {
          setHasReminder(false);
          Alert.alert('Reminder Removed', 'You will no longer be notified about this offer.');
        } else {
          Alert.alert('Error', result.error || 'Failed to remove reminder');
        }
      } else {
        const result = await setOfferReminder(offerId);
        if (result.success) {
          setHasReminder(true);
          Alert.alert('Reminder Set!', "You'll be notified when this offer goes live.");
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminder');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update reminder');
    } finally {
      setTogglingReminder(false);
    }
  };

  const handleShare = async () => {
    if (!offer) return;

    try {
      await Share.share({
        message: `Check out this offer: ${offer.title} - ${offer.discount}% OFF at ${offer.businessName}`,
        title: offer.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGoToWebsite = () => {
    const website = offer?.business?.business_website || offer?.business?.website;
    if (website) {
      Linking.openURL(website);
    } else {
      Alert.alert('No Website', 'This business does not have a website listed.');
    }
  };

  const handleCall = () => {
    const phone = offer?.business?.phone_number || offer?.business?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const calculateTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return 'No expiry';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Ending soon';
  };

  const calculateTimeUntilStart = (startDate?: string): string => {
    if (!startDate) return 'Coming Soon';

    const now = new Date();
    const start = new Date(startDate);
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) return ''; // Already started

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Starts soon';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading offer details...</Text>
      </View>
    );
  }

  if (error || !offer) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error || 'Offer not found'}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Defensive checks for offer properties
  const images = Array.isArray(offer.images) ? offer.images : [];
  const imageUrl = images.length > 0 ? images[selectedImage] : 'https://via.placeholder.com/400x200?text=No+Image';
  const website = offer.business?.business_website || offer.business?.website;
  const phone = offer.business?.phone_number || offer.business?.phone;
  const hasWebsite = website && typeof website === 'string' && website.trim() !== '';
  const isUpcoming = offer?.startDate ? new Date(offer.startDate) > new Date() : false;
  const offerDiscount = typeof offer.discount === 'number' ? offer.discount : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.headerImage}
          resizeMode="cover"
        />

        {/* Discount Badge on Image */}
        <View style={styles.discountBadgeOverlay}>
          <Text style={styles.badgeDiscountText}>{offerDiscount}%</Text>
          <Text style={styles.badgeOffText}>OFF</Text>
        </View>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.thumbnail,
                  selectedImage === index && styles.thumbnailActive
                ]}
              >
                <Image
                  source={{ uri: img }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.content}>
        {/* Title and Basic Info */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{offer.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{calculateTimeRemaining(offer.expiresAt)}</Text>
            </View>
            {offer.claimedCount !== undefined && offer.maxClaims && (
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{offer.claimedCount}/{offer.maxClaims} claimed</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.discountedPrice}>
              ${typeof offer.discountedPrice === 'number' ? offer.discountedPrice.toFixed(2) : '0.00'}
            </Text>
            {offer.originalPrice && typeof offer.originalPrice === 'number' && offer.originalPrice > 0 && (
              <>
                <Text style={styles.originalPrice}>${offer.originalPrice.toFixed(2)}</Text>
                <Text style={styles.savings}>
                  Save ${(offer.originalPrice - (offer.discountedPrice || 0)).toFixed(2)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isUpcoming ? (
            <>
              <TouchableOpacity
                style={[styles.claimButton, styles.disabledButton]}
                disabled={true}
              >
                <Ionicons name="hourglass-outline" size={20} color="#999" />
                <Text style={[styles.claimButtonText, styles.disabledButtonText]}>
                  {calculateTimeUntilStart(offer.startDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reminderButton, hasReminder && styles.reminderButtonActive]}
                onPress={handleReminderToggle}
                disabled={togglingReminder}
              >
                {togglingReminder ? (
                  <ActivityIndicator color={hasReminder ? "#e94e1b" : "#fff"} />
                ) : (
                  <>
                    <Ionicons
                      name={hasReminder ? "notifications" : "notifications-outline"}
                      size={20}
                      color={hasReminder ? "#e94e1b" : "#fff"}
                    />
                    <Text style={[styles.reminderButtonText, hasReminder && styles.reminderButtonTextActive]}>
                      {hasReminder ? 'Reminder Set' : 'Remind Me'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Quantity Selector - only show when not claimed */}
              {!isClaimed && isAuthenticated && (
                <View style={styles.quantitySection}>
                  <Text style={styles.quantitySectionTitle}>Quantity to Claim</Text>

                  {/* Quota Info */}
                  {offer.max_claims_per_user && (
                    <View style={styles.quotaInfo}>
                      <Text style={styles.quotaText}>
                        Quota: {totalClaimed}/{offer.max_claims_per_user} used
                      </Text>
                      <Text style={styles.quotaText}>
                        Remaining: {offer.max_claims_per_user - totalClaimed}
                      </Text>
                    </View>
                  )}

                  {/* Quantity Stepper */}
                  <View style={styles.quantityStepper}>
                    <TouchableOpacity
                      style={[styles.stepperButton, quantity <= minQuantity && styles.stepperButtonDisabled]}
                      onPress={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                      disabled={quantity <= minQuantity}
                    >
                      <Ionicons name="remove" size={24} color={quantity <= minQuantity ? "#ccc" : "#e94e1b"} />
                    </TouchableOpacity>

                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityValue}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.stepperButton, quantity >= maxQuantity && styles.stepperButtonDisabled]}
                      onPress={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                    >
                      <Ionicons name="add" size={24} color={quantity >= maxQuantity ? "#ccc" : "#e94e1b"} />
                    </TouchableOpacity>
                  </View>

                  {/* Min/Max Info */}
                  <Text style={styles.quantityConstraints}>
                    Min: {minQuantity} • Max: {maxQuantity === 100 ? 'No limit' : maxQuantity}
                  </Text>
                </View>
              )}

              {/* Claim Button */}
              <TouchableOpacity
                style={[styles.claimButton, isClaimed && styles.claimedButton]}
                onPress={handleClaimOffer}
                disabled={claiming}
              >
                {claiming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isClaimed ? "checkmark-circle" : "storefront"} size={20} color="#fff" />
                    <Text style={styles.claimButtonText}>
                      {isClaimed ? 'Unclaim Offer' : 'Claim In Store'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {website && (
            <TouchableOpacity style={styles.websiteButton} onPress={handleGoToWebsite}>
              <Ionicons name="globe-outline" size={20} color="#e94e1b" />
              <Text style={styles.websiteButtonText}>Go to Website</Text>
            </TouchableOpacity>
          )}

          <View style={styles.iconButtonRow}>
            <TouchableOpacity
              style={[styles.iconButton, isFavorited && styles.iconButtonFavorited]}
              onPress={handleFavoriteToggle}
              disabled={togglingFavorite}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={24}
                color={isFavorited ? "#e74c3c" : "#666"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this offer</Text>
          <Text style={styles.description}>
            {offer.description || 'No description available.'}
          </Text>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <View style={styles.termsList}>
            <View style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>
              <Text style={styles.termText}>
                Offer valid until {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            {offer.maxClaims && (
              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>Limited to {offer.maxClaims} total claims</Text>
              </View>
            )}
            <View style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>
              <Text style={styles.termText}>Must be presented at time of purchase</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>
              <Text style={styles.termText}>Cannot be combined with other offers</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termBullet}>•</Text>
              <Text style={styles.termText}>Subject to availability</Text>
            </View>
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{offer.businessName}</Text>

            {/* Address */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>{offer.location}</Text>
                {offer.distance && (
                  <Text style={styles.distanceText}>
                    {offer.distance < 1
                      ? `${Math.round(offer.distance * 1000)}m away`
                      : `${offer.distance.toFixed(1)}km away`}
                  </Text>
                )}
              </View>
            </View>

            {/* Phone */}
            {phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <Text style={[styles.infoText, styles.linkText]}>{phone}</Text>
              </TouchableOpacity>
            )}

            {/* Website */}
            {website && (
              <TouchableOpacity style={styles.infoRow} onPress={handleGoToWebsite}>
                <Ionicons name="globe-outline" size={20} color="#666" />
                <Text style={[styles.infoText, styles.linkText]} numberOfLines={1}>
                  {website}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category */}
        {offer.category && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{offer.category}</Text>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 300,
  },
  discountBadgeOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#e74c3c',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeDiscountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 28,
  },
  badgeOffText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 14,
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  thumbnailContent: {
    paddingHorizontal: 10,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#e94e1b',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  priceSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 10,
  },
  discountedPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94e1b',
  },
  originalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
  },
  actionSection: {
    marginBottom: 20,
  },
  claimButton: {
    backgroundColor: '#e94e1b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  claimedButton: {
    backgroundColor: '#27ae60',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  disabledButtonText: {
    color: '#999',
  },
  reminderButton: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  reminderButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e94e1b',
  },
  reminderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reminderButtonTextActive: {
    color: '#e94e1b',
  },
  websiteButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e94e1b',
    gap: 8,
  },
  websiteButtonText: {
    color: '#e94e1b',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  iconButtonFavorited: {
    backgroundColor: '#fee',
    borderColor: '#e74c3c',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  termsList: {
    gap: 8,
  },
  termItem: {
    flexDirection: 'row',
    gap: 8,
  },
  termBullet: {
    fontSize: 15,
    color: '#666',
    width: 10,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  businessInfo: {
    gap: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  linkText: {
    color: '#e94e1b',
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quantitySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quotaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  quotaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  quantityStepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 20,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94e1b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperButtonDisabled: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  quantityDisplay: {
    minWidth: 60,
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityConstraints: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

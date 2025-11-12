import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import DealCard from '../components/DealCard';

type RootStackParamList = {
  SignIn: undefined;
  DiscountDetails: { offerId: string };
};

type ClaimsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClaimsScreenProps {
  navigation: ClaimsScreenNavigationProp;
}

export default function ClaimsScreen({ navigation }: ClaimsScreenProps) {
  const { isAuthenticated, user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to get claimed offers
      // const result = await getClaimedOffers();
      // setClaims(result.claims);
      setClaims([]);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
  };

  const handleClaimPress = (claim: any) => {
    navigation.navigate('DiscountDetails', { offerId: claim.offer_id });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to view your claims</Text>
          <Text style={styles.emptyText}>
            You need to be signed in to view your claimed offers.
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading your claims...</Text>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No claims yet</Text>
      <Text style={styles.emptyText}>
        When you claim offers, they will appear here.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.claimCard}>
      <TouchableOpacity onPress={() => handleClaimPress(item)}>
        <View style={styles.claimInfo}>
          <Text style={styles.claimTitle}>{item.offer?.title || 'Claimed Offer'}</Text>
          <Text style={styles.claimBusiness}>{item.offer?.businessName}</Text>
          <View style={styles.claimStatus}>
            <Text style={[
              styles.statusText,
              item.is_redeemed ? styles.statusRedeemed : styles.statusPending
            ]}>
              {item.is_redeemed ? 'Redeemed' : 'Pending'}
            </Text>
            <Text style={styles.claimDate}>
              {new Date(item.claimed_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={claims}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimInfo: {
    gap: 8,
  },
  claimTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  claimBusiness: {
    fontSize: 14,
    color: '#666',
  },
  claimStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRedeemed: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  claimDate: {
    fontSize: 12,
    color: '#999',
  },
});

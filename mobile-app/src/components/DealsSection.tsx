import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DealCard from './DealCard';
import { Offer } from '../types/offer';

interface DealsSectionProps {
  title: string;
  description: string;
  deals: Offer[];
  loading: boolean;
  iconName: string;
  iconColor?: string;
  onDealPress: (deal: Offer) => void;
  onLike: (offerId: string) => void;
  onClaim: (offerId: string) => void;
  onViewMore?: () => void;
}

function DealsSection({
  title,
  description,
  deals,
  loading,
  iconName,
  iconColor = '#e94e1b',
  onDealPress,
  onLike,
  onClaim,
  onViewMore,
}: DealsSectionProps) {
  const renderDealCard = ({ item }: { item: Offer }) => (
    <DealCard
      deal={item}
      onPress={() => onDealPress(item)}
      onLike={onLike}
      onClaim={onClaim}
    />
  );

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name={iconName as any} size={28} color={iconColor} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#e94e1b" />
        </View>
      </View>
    );
  }

  if (deals.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name={iconName as any} size={28} color={iconColor} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {title.toLowerCase()} available at the moment.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name={iconName as any} size={28} color={iconColor} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionDescription}>{description}</Text>
          </View>
        </View>
        {onViewMore && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Replaced ScrollView with FlatList for better performance */}
      <FlatList
        horizontal
        data={deals}
        renderItem={renderDealCard}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dealsScrollContainer}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </View>
  );
}

export default React.memo(DealsSection);

const styles = StyleSheet.create({
  section: {
    marginBottom: 30,
    paddingBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  sectionIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  viewMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e94e1b',
  },
  viewMoreText: {
    color: '#e94e1b',
    fontSize: 12,
    fontWeight: '600',
  },
  dealsScrollContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

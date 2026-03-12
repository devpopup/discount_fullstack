import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DealCard from './DealCard';
import DealCardLandscape from './DealCardLandscape';
import { Offer } from '../types/offer';

// Card dimensions for getItemLayout optimization
const SCREEN_WIDTH = Dimensions.get('window').width;
const DEAL_CARD_WIDTH = SCREEN_WIDTH * 0.385 + 12; // Card width + marginRight
const DEAL_CARD_LANDSCAPE_HEIGHT = 155; // Card height (140) + marginBottom (15)

interface DealsSectionProps {
  title: string;
  description: string;
  deals: Offer[];
  loading: boolean;
  iconName: string;
  iconColor?: string;
  onDealPress: (deal: Offer) => void;
  onLike?: (offerId: string) => void;
  favoritedIds?: Set<string>;
  onClaim: (offerId: string) => void;
  onRemind?: (offerId: string, hasReminder: boolean) => void;
  onViewMore?: () => void;
  useLandscapeCards?: boolean;
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
  favoritedIds,
  onClaim,
  onRemind,
  onViewMore,
  useLandscapeCards = false,
}: DealsSectionProps) {
  const renderDealCard = ({ item }: { item: Offer }) => {
    if (!item || !item.id) return null;

    if (useLandscapeCards) {
      return (
        <DealCardLandscape
          deal={item}
          onPress={() => onDealPress(item)}
          onLike={onLike}
          isLiked={favoritedIds ? favoritedIds.has(item.id) : false}
        />
      );
    }
    return (
      <DealCard
        deal={item}
        onPress={() => onDealPress(item)}
        onLike={onLike}
        isLiked={favoritedIds ? favoritedIds.has(item.id) : false}
        onClaim={onClaim}
        onRemind={onRemind}
      />
    );
  };

  // Performance optimization: getItemLayout helps FlatList calculate item positions faster
  const getItemLayout = (_: any, index: number) => {
    if (useLandscapeCards) {
      // Vertical list with landscape cards
      return {
        length: DEAL_CARD_LANDSCAPE_HEIGHT,
        offset: DEAL_CARD_LANDSCAPE_HEIGHT * index,
        index,
      };
    }
    // Horizontal list with standard cards
    return {
      length: DEAL_CARD_WIDTH,
      offset: DEAL_CARD_WIDTH * index,
      index,
    };
  };

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
        horizontal={!useLandscapeCards}
        data={deals}
        renderItem={renderDealCard}
        keyExtractor={(item, index) => item?.id || `deal-${index}`}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={useLandscapeCards ? styles.dealsListContainer : styles.dealsScrollContainer}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
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
  dealsListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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

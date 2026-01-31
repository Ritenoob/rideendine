/**
 * Chef Card Component - Displays chef summary in lists
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useFavoritesStore } from '@/store';

interface ChefCardProps {
  chef: {
    id: string;
    businessName: string;
    cuisineTypes: string[];
    profileImageUrl?: string;
    rating: number;
    reviewCount: number;
    averagePrepTime: number;
    minimumOrder: number;
    deliveryRadius: number;
    distance?: number;
  };
  onPress: () => void;
  showFavorite?: boolean;
}

export default function ChefCard({ chef, onPress, showFavorite = true }: ChefCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorite = isFavorite(chef.id);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDistance = (miles: number) => {
    return miles < 1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;
  };

  const handleFavoritePress = () => {
    toggleFavorite(chef);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{
          uri: chef.profileImageUrl || 'https://via.placeholder.com/120x120?text=Chef',
        }}
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {chef.businessName}
          </Text>
          {showFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.favoriteIcon}>{favorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.cuisines} numberOfLines={1}>
          {chef.cuisineTypes.slice(0, 3).join(' • ')}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>
              {chef.rating.toFixed(1)} ({chef.reviewCount})
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statText}>{chef.averagePrepTime} min</Text>
          </View>
          {chef.distance !== undefined && (
            <View style={styles.stat}>
              <Text style={styles.statIcon}>📍</Text>
              <Text style={styles.statText}>{formatDistance(chef.distance)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.minimum}>Min. order {formatCurrency(chef.minimumOrder)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  cuisines: {
    fontSize: 13,
    color: '#5f5f5f',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  minimum: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 4,
  },
});

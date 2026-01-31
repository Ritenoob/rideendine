/**
 * Chef Card Component - Displays chef summary in lists
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

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
}

export default function ChefCard({ chef, onPress }: ChefCardProps) {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDistance = (miles: number) => {
    return miles < 1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;
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
        <Text style={styles.name} numberOfLines={1}>
          {chef.businessName}
        </Text>
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
        <Text style={styles.minimum}>
          Min. order {formatCurrency(chef.minimumOrder)}
        </Text>
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
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 4,
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

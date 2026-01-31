/**
 * Menu Item Card Component
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable: boolean;
    preparationTime: number;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    spiceLevel: number;
  };
  onPress: () => void;
  onAddToCart?: () => void;
}

export default function MenuItemCard({ item, onPress, onAddToCart }: MenuItemCardProps) {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getDietaryBadges = () => {
    const badges = [];
    if (item.isVegetarian) badges.push('🥬');
    if (item.isVegan) badges.push('🌱');
    if (item.isGlutenFree) badges.push('🌾');
    if (item.spiceLevel > 0) badges.push('🌶️'.repeat(Math.min(item.spiceLevel, 3)));
    return badges.join(' ');
  };

  return (
    <TouchableOpacity
      style={[styles.container, !item.isAvailable && styles.unavailable]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!item.isAvailable}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.badges}>
          <Text style={styles.badgeText}>{getDietaryBadges()}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          <Text style={styles.prepTime}>{item.preparationTime} min</Text>
        </View>
        {!item.isAvailable && <Text style={styles.soldOut}>Sold Out</Text>}
      </View>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      {item.isAvailable && onAddToCart && (
        <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  unavailable: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#5f5f5f',
    lineHeight: 18,
    marginBottom: 8,
  },
  badges: {
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  prepTime: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  soldOut: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
    marginTop: 4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  addButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

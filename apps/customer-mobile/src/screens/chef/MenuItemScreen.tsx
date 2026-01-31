/**
 * Menu Item Screen - Item detail with add to cart
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Button } from '@/components/ui';
import { useCartStore } from '@/store';

export default function MenuItemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MenuItem'>>();
  const { item, chef } = route.params;

  const { setChef, addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleAddToCart = () => {
    if (chef) {
      setChef({
        id: chef.id,
        businessName: chef.businessName,
        profileImageUrl: chef.profileImageUrl,
        address: chef.address,
        city: chef.city,
        deliveryRadius: chef.deliveryRadius,
        minimumOrder: chef.minimumOrder,
        averagePrepTime: chef.averagePrepTime,
      });
    }
    addItem(item, quantity, specialInstructions.trim() || undefined);
    navigation.goBack();
  };

  const getDietaryBadges = () => {
    const badges = [];
    if (item.isVegetarian) badges.push({ label: 'Vegetarian', emoji: '🥬' });
    if (item.isVegan) badges.push({ label: 'Vegan', emoji: '🌱' });
    if (item.isGlutenFree) badges.push({ label: 'Gluten-Free', emoji: '🌾' });
    return badges;
  };

  const totalPrice = item.price * quantity;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>

          {item.description && <Text style={styles.description}>{item.description}</Text>}

          {/* Dietary Badges */}
          {getDietaryBadges().length > 0 && (
            <View style={styles.badges}>
              {getDietaryBadges().map((badge) => (
                <View key={badge.label} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Spice Level */}
          {item.spiceLevel > 0 && (
            <View style={styles.spiceLevel}>
              <Text style={styles.spiceLabel}>Spice Level:</Text>
              <Text style={styles.spiceValue}>{'🌶️'.repeat(item.spiceLevel)}</Text>
            </View>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <View style={styles.allergens}>
              <Text style={styles.allergensLabel}>Contains:</Text>
              <Text style={styles.allergensList}>{item.allergens.join(', ')}</Text>
            </View>
          )}

          {/* Prep Time */}
          <View style={styles.prepTime}>
            <Text style={styles.prepTimeIcon}>⏱️</Text>
            <Text style={styles.prepTimeText}>{item.preparationTime} min prep time</Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsLabel}>Special Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Any allergies or preferences?"
              placeholderTextColor="#9e9e9e"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View style={styles.footer}>
        <Button
          title={`Add to Cart - ${formatCurrency(totalPrice)}`}
          onPress={handleAddToCart}
          size="large"
          disabled={!item.isAvailable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff9800',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#5f5f5f',
    lineHeight: 24,
    marginBottom: 20,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeLabel: {
    fontSize: 13,
    color: '#388e3c',
    fontWeight: '600',
  },
  spiceLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spiceLabel: {
    fontSize: 14,
    color: '#5f5f5f',
    marginRight: 8,
  },
  spiceValue: {
    fontSize: 16,
  },
  allergens: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  allergensLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 4,
  },
  allergensList: {
    fontSize: 13,
    color: '#e65100',
  },
  prepTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  prepTimeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  prepTimeText: {
    fontSize: 14,
    color: '#5f5f5f',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#151515',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 22,
    color: '#ff9800',
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
    minWidth: 40,
    textAlign: 'center',
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 8,
  },
  instructionsInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#151515',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

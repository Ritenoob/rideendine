/**
 * Chef Detail Screen - Chef profile with menu
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MenuItemCard } from '@/components/chef';
import { Button } from '@/components/ui';
import { api } from '@/services';
import { useCartStore } from '@/store';

interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number;
}

interface Chef {
  id: string;
  businessName: string;
  description?: string;
  cuisineTypes: string[];
  profileImageUrl?: string;
  bannerImageUrl?: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  averagePrepTime: number;
  minimumOrder: number;
  deliveryRadius: number;
  operatingHours?: any[];
}

export default function ChefDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chefId } = route.params;

  const { setChef, addItem, itemCount, chef: cartChef, total } = useCartStore();

  const [chef, setChefData] = useState<Chef | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chefData, menusData] = await Promise.all([
          api.getChef(chefId),
          api.getChefMenus(chefId),
        ]);

        setChefData(chefData);

        // Flatten menu items from all menus
        const allItems = menusData.flatMap((menu: any) => menu.items || []);
        setMenuItems(allItems);
      } catch (error) {
        console.error('Failed to fetch chef data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chefId]);

  const handleAddToCart = (item: MenuItem) => {
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
      addItem(item);
    }
  };

  const handleItemPress = (item: MenuItem) => {
    navigation.navigate('MenuItem', { item, chef });
  };

  // Group items by category
  const sections = menuItems.reduce((acc: { title: string; data: MenuItem[] }[], item) => {
    const existing = acc.find((s) => s.title === item.category);
    if (existing) {
      existing.data.push(item);
    } else {
      acc.push({ title: item.category, data: [item] });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  if (!chef) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chef not found</Text>
      </View>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            onPress={() => handleItemPress(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListHeaderComponent={
          <View>
            {/* Banner */}
            <Image
              source={{
                uri: chef.bannerImageUrl || chef.profileImageUrl || 'https://via.placeholder.com/400x200',
              }}
              style={styles.banner}
            />

            {/* Chef Info */}
            <View style={styles.chefInfo}>
              <Image
                source={{
                  uri: chef.profileImageUrl || 'https://via.placeholder.com/80',
                }}
                style={styles.avatar}
              />
              <View style={styles.infoContent}>
                <Text style={styles.name}>{chef.businessName}</Text>
                <Text style={styles.cuisines}>
                  {chef.cuisineTypes.join(' • ')}
                </Text>
                <View style={styles.stats}>
                  <Text style={styles.stat}>⭐ {chef.rating.toFixed(1)} ({chef.reviewCount})</Text>
                  <Text style={styles.stat}>⏱️ {chef.averagePrepTime} min</Text>
                  <Text style={styles.stat}>📍 {chef.city}</Text>
                </View>
              </View>
            </View>

            {chef.description && (
              <Text style={styles.description}>{chef.description}</Text>
            )}

            <View style={styles.minimumOrder}>
              <Text style={styles.minimumOrderText}>
                Minimum order: {formatCurrency(chef.minimumOrder)}
              </Text>
            </View>

            <Text style={styles.menuTitle}>Menu</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      {/* Cart Footer */}
      {cartChef?.id === chef.id && itemCount > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{itemCount} items</Text>
            <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
          </View>
          <Button
            title="View Cart"
            onPress={() => navigation.navigate('Cart')}
            size="medium"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9e9e9e',
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  chefInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: -40,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
  },
  cuisines: {
    fontSize: 13,
    color: '#5f5f5f',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  stat: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  description: {
    fontSize: 14,
    color: '#5f5f5f',
    lineHeight: 22,
    padding: 16,
  },
  minimumOrder: {
    backgroundColor: '#fff3e0',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  minimumOrderText: {
    fontSize: 13,
    color: '#ff9800',
    fontWeight: '600',
    textAlign: 'center',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
    backgroundColor: '#f7f4ee',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cartInfo: {},
  cartItemCount: {
    fontSize: 13,
    color: '#5f5f5f',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
  },
});

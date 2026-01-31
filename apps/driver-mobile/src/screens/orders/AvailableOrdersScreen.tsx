import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDeliveryStore } from '@/store';
import { api } from '@/services';

interface Order {
  id: string;
  chefBusinessName: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  estimatedDuration: number;
  deliveryFee: number;
  tip: number;
  itemCount: number;
}

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const { availableOrders, setAvailableOrders, isOnline, setActiveDelivery } =
    useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isOnline) return;

    try {
      const orders = await api.getAvailableOrders();
      setAvailableOrders(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const order = await api.acceptDelivery(orderId);
      setActiveDelivery(order);
      navigation.navigate('ActiveDelivery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept order');
    } finally {
      setAccepting(null);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDistance = (miles: number) =>
    miles < 1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;

  const renderOrder = ({ item }: { item: Order }) => {
    const totalEarning = item.deliveryFee + item.tip;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderChef}>{item.chefBusinessName}</Text>
          <Text style={styles.orderEarning}>{formatCurrency(totalEarning)}</Text>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🏠</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Delivery</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={styles.orderStats}>
          <Text style={styles.orderStat}>
            📦 {item.itemCount} items
          </Text>
          <Text style={styles.orderStat}>
            📏 {formatDistance(item.estimatedDistance)}
          </Text>
          <Text style={styles.orderStat}>
            ⏱️ {item.estimatedDuration} min
          </Text>
        </View>

        {item.tip > 0 && (
          <View style={styles.tipBadge}>
            <Text style={styles.tipText}>💰 {formatCurrency(item.tip)} tip included</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.acceptButton,
            accepting === item.id && styles.acceptButtonDisabled,
          ]}
          onPress={() => handleAcceptOrder(item.id)}
          disabled={accepting !== null}
        >
          <Text style={styles.acceptButtonText}>
            {accepting === item.id ? 'Accepting...' : 'Accept Delivery'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {isOnline ? 'No orders available' : 'You are offline'}
      </Text>
      <Text style={styles.emptyText}>
        {isOnline
          ? 'New orders will appear here. Pull to refresh.'
          : 'Go online to see available orders'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Orders</Text>
        <View
          style={[
            styles.statusBadge,
            isOnline ? styles.statusOnline : styles.statusOffline,
          ]}
        >
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <FlatList
        data={isOnline ? availableOrders : []}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff9800"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151515',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: '#e8f5e9',
  },
  statusOffline: {
    backgroundColor: '#fafafa',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#151515',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderChef: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
  },
  orderEarning: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4caf50',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#151515',
  },
  orderStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  orderStat: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  tipBadge: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#ff9800',
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#5f5f5f',
    textAlign: 'center',
  },
});

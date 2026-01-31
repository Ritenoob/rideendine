/**
 * Orders Screen - Order history and active orders
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Card } from '@/components/ui';
import { OrderStatusTimeline } from '@/components/order';
import { api } from '@/services';

interface Order {
  id: string;
  chefId: string;
  chefName?: string;
  status: string;
  total: number;
  itemCount?: number;
  createdAt: string;
}

export default function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.getOrders({ limit: 50 });
      const orders = response.data || [];

      const active = orders.filter((o: Order) =>
        [
          'pending',
          'payment_pending',
          'payment_confirmed',
          'accepted',
          'preparing',
          'ready_for_pickup',
          'assigned_to_driver',
          'picked_up',
          'in_transit',
        ].includes(o.status),
      );

      const past = orders.filter((o: Order) =>
        ['delivered', 'cancelled', 'refunded', 'rejected'].includes(o.status),
      );

      setActiveOrders(active);
      setPastOrders(past);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderPress = (order: Order) => {
    if (activeTab === 'active') {
      navigation.navigate('OrderTracking', { orderId: order.id });
    } else {
      navigation.navigate('OrderDetail', { orderId: order.id });
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard} onPress={() => handleOrderPress(item)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderChef}>{item.chefName || 'Chef'}</Text>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
      </View>

      <OrderStatusTimeline currentStatus={item.status} compact />

      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        {activeTab === 'active' && <Text style={styles.trackLink}>Track Order →</Text>}
        {activeTab === 'past' && item.status === 'delivered' && (
          <TouchableOpacity onPress={() => navigation.navigate('Review', { orderId: item.id })}>
            <Text style={styles.reviewLink}>Leave Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No active orders' : 'No past orders'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'active'
          ? 'Start ordering from local chefs!'
          : 'Your completed orders will appear here'}
      </Text>
    </View>
  );

  const orders = activeTab === 'active' ? activeOrders : pastOrders;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff9800" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff9800" />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#151515',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f5f5f',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderChef: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderDate: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  trackLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
  },
  reviewLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

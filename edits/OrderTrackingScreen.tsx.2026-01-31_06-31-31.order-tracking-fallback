/**
 * Order Tracking Screen - Live order tracking with map
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Card } from '@/components/ui';
import { OrderStatusTimeline } from '@/components/order';
import { api, websocket } from '@/services';
import { useOrderStore } from '@/store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OrderTrackingScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderTracking'>>();
  const { orderId } = route.params;

  const mapRef = useRef<MapView>(null);
  const etaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { activeOrder, driverLocation, etaMinutes, setActiveOrder, setEta } = useOrderStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const order = await api.getOrder(orderId);
        setActiveOrder(order);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Connect to WebSocket for real-time updates
    websocket.connect(orderId);

    // Poll for ETA updates
    etaIntervalRef.current = setInterval(async () => {
      try {
        const eta = await api.getOrderEta(orderId);
        if (eta) {
          setEta(eta.etaMinutes);
        }
      } catch (error) {
        // Ignore ETA errors
      }
    }, 8000);

    return () => {
      websocket.disconnect();
      if (etaIntervalRef.current) {
        clearInterval(etaIntervalRef.current);
      }
    };
  }, [orderId]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && activeOrder && driverLocation) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: activeOrder.deliveryAddress.lat,
            longitude: activeOrder.deliveryAddress.lng,
          },
          {
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        },
      );
    }
  }, [driverLocation]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getStatusMessage = () => {
    const status = activeOrder?.status || '';
    const messages: Record<string, string> = {
      pending: 'Order placed, waiting for confirmation...',
      payment_confirmed: 'Payment received, waiting for chef...',
      accepted: 'Chef has accepted your order!',
      preparing: 'Chef is preparing your food...',
      ready_for_pickup: 'Food is ready for pickup!',
      assigned_to_driver: 'Driver is on the way to pick up...',
      picked_up: 'Driver has picked up your order!',
      in_transit: 'Your order is on the way!',
      delivered: 'Order delivered! Enjoy!',
    };
    return messages[status] || 'Processing...';
  };

  if (loading || !activeOrder) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: activeOrder.deliveryAddress.lat,
            longitude: activeOrder.deliveryAddress.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Customer/Delivery marker */}
          <Marker
            coordinate={{
              latitude: activeOrder.deliveryAddress.lat,
              longitude: activeOrder.deliveryAddress.lng,
            }}
            title="Delivery Location"
          >
            <View style={styles.markerCustomer}>
              <Text style={styles.markerEmoji}>📍</Text>
            </View>
          </Marker>

          {/* Driver marker */}
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.lat,
                longitude: driverLocation.lng,
              }}
              title="Driver"
              rotation={driverLocation.heading}
            >
              <View style={styles.markerDriver}>
                <Text style={styles.markerEmoji}>🚗</Text>
              </View>
            </Marker>
          )}

          {/* Route line (simplified) */}
          {driverLocation && (
            <Polyline
              coordinates={[
                { latitude: driverLocation.lat, longitude: driverLocation.lng },
                {
                  latitude: activeOrder.deliveryAddress.lat,
                  longitude: activeOrder.deliveryAddress.lng,
                },
              ]}
              strokeColor="#ff9800"
              strokeWidth={3}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* ETA Overlay */}
        {etaMinutes && (
          <View style={styles.etaOverlay}>
            <Text style={styles.etaValue}>{etaMinutes}</Text>
            <Text style={styles.etaLabel}>min</Text>
          </View>
        )}
      </View>

      {/* Order Info */}
      <View style={styles.infoContainer}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
          <OrderStatusTimeline currentStatus={activeOrder.status} />
        </Card>

        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderLabel}>Order</Text>
            <Text style={styles.orderTotal}>{formatCurrency(activeOrder.total)}</Text>
          </View>
          <Text style={styles.orderChef}>{activeOrder.chefName || 'Chef'}</Text>
          <Text style={styles.orderAddress}>
            📍 {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.city}
          </Text>
        </Card>
      </View>
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
  loadingText: {
    fontSize: 16,
    color: '#5f5f5f',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.4,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerCustomer: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  markerDriver: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  markerEmoji: {
    fontSize: 20,
  },
  etaOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  etaValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff9800',
  },
  etaLabel: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 16,
  },
  orderCard: {},
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  orderChef: {
    fontSize: 16,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 13,
    color: '#5f5f5f',
  },
});

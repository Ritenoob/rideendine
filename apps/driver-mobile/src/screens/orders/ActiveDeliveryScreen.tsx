import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDeliveryStore } from '@/store';
import { api } from '@/services';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const { activeDelivery, currentLocation, updateDeliveryStatus, setActiveDelivery } =
    useDeliveryStore();

  useEffect(() => {
    if (!activeDelivery) {
      navigation.goBack();
    }
  }, [activeDelivery]);

  useEffect(() => {
    // Fit map to show all points
    if (mapRef.current && activeDelivery && currentLocation) {
      const coords = [
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: activeDelivery.pickupLat, longitude: activeDelivery.pickupLng },
        { latitude: activeDelivery.deliveryLat, longitude: activeDelivery.deliveryLng },
      ];

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [currentLocation, activeDelivery]);

  const handlePickedUp = async () => {
    if (!activeDelivery) return;

    try {
      const updated = await api.markPickedUp(activeDelivery.id);
      updateDeliveryStatus('picked_up');
      Alert.alert('Order Picked Up', 'Now head to the customer location');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const handleDelivered = async () => {
    if (!activeDelivery) return;

    try {
      await api.markDelivered(activeDelivery.id);
      setActiveDelivery(null);
      Alert.alert('Delivery Complete!', 'Great job!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete delivery');
    }
  };

  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = `maps:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`;
    Linking.openURL(url);
  };

  if (!activeDelivery) {
    return null;
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const isPickedUp = ['picked_up', 'in_transit'].includes(activeDelivery.status);
  const destination = isPickedUp
    ? { lat: activeDelivery.deliveryLat, lng: activeDelivery.deliveryLng }
    : { lat: activeDelivery.pickupLat, lng: activeDelivery.pickupLng };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.lat || 43.2207,
            longitude: currentLocation?.lng || -79.7651,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {/* Pickup Marker */}
          <Marker
            coordinate={{
              latitude: activeDelivery.pickupLat,
              longitude: activeDelivery.pickupLng,
            }}
            title="Pickup"
            description={activeDelivery.pickupAddress}
          >
            <View style={styles.markerPickup}>
              <Text style={styles.markerEmoji}>👨‍🍳</Text>
            </View>
          </Marker>

          {/* Delivery Marker */}
          <Marker
            coordinate={{
              latitude: activeDelivery.deliveryLat,
              longitude: activeDelivery.deliveryLng,
            }}
            title="Delivery"
            description={activeDelivery.deliveryAddress}
          >
            <View style={styles.markerDelivery}>
              <Text style={styles.markerEmoji}>🏠</Text>
            </View>
          </Marker>

          {/* Route Line */}
          {currentLocation && (
            <Polyline
              coordinates={[
                { latitude: currentLocation.lat, longitude: currentLocation.lng },
                { latitude: destination.lat, longitude: destination.lng },
              ]}
              strokeColor="#ff9800"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.orderHeader}>
          <Text style={styles.chefName}>{activeDelivery.chefBusinessName}</Text>
          <Text style={styles.earning}>
            {formatCurrency(activeDelivery.deliveryFee + activeDelivery.tip)}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {isPickedUp ? '🚗 Heading to customer' : '👨‍🍳 Heading to pickup'}
          </Text>
        </View>

        {/* Destination Card */}
        <TouchableOpacity
          style={styles.destinationCard}
          onPress={() =>
            openNavigation(
              destination.lat,
              destination.lng,
              isPickedUp ? 'Customer' : 'Restaurant'
            )
          }
        >
          <View style={styles.destinationContent}>
            <Text style={styles.destinationLabel}>
              {isPickedUp ? 'Deliver to' : 'Pick up from'}
            </Text>
            <Text style={styles.destinationAddress} numberOfLines={2}>
              {isPickedUp ? activeDelivery.deliveryAddress : activeDelivery.pickupAddress}
            </Text>
          </View>
          <View style={styles.navigateButton}>
            <Text style={styles.navigateText}>🧭</Text>
          </View>
        </TouchableOpacity>

        {/* Action Button */}
        {!isPickedUp ? (
          <TouchableOpacity style={styles.actionButton} onPress={handlePickedUp}>
            <Text style={styles.actionButtonText}>Picked Up</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveredButton]}
            onPress={handleDelivered}
          >
            <Text style={styles.actionButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.5,
  },
  map: {
    flex: 1,
  },
  markerPickup: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  markerDelivery: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  markerEmoji: {
    fontSize: 20,
  },
  infoPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chefName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
  },
  earning: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4caf50',
  },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  destinationContent: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
  },
  navigateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateText: {
    fontSize: 20,
  },
  actionButton: {
    backgroundColor: '#ff9800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  deliveredButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

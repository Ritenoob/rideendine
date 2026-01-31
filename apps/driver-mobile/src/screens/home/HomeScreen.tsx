import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { useAuthStore, useDeliveryStore } from '@/store';
import { api, location } from '@/services';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, driver, setDriver } = useAuthStore();
  const {
    isOnline,
    setOnlineStatus,
    currentLocation,
    setCurrentLocation,
    activeDelivery,
    setActiveDelivery,
    todayEarnings,
    todayDeliveries,
    setTodayStats,
  } = useDeliveryStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeLocation();
    fetchActiveDelivery();
    fetchTodayStats();
  }, []);

  const initializeLocation = async () => {
    const coords = await location.getCurrentLocation();
    if (coords) {
      setCurrentLocation(coords.lat, coords.lng);
    }
  };

  const fetchActiveDelivery = async () => {
    try {
      const delivery = await api.getActiveDelivery();
      if (delivery) {
        setActiveDelivery(delivery);
      }
    } catch {
      // No active delivery
    }
  };

  const fetchTodayStats = async () => {
    try {
      const earnings = await api.getEarnings('today');
      setTodayStats(earnings.total, earnings.deliveries);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    setLoading(true);
    try {
      const newStatus = isOnline ? 'offline' : 'online';
      const updatedDriver = await api.updateDriverStatus(newStatus);
      setDriver(updatedDriver);
      setOnlineStatus(!isOnline);

      if (!isOnline) {
        // Going online - start location tracking
        const started = await location.startBackgroundTracking();
        if (!started) {
          Alert.alert(
            'Location Required',
            'Please enable location permissions to go online'
          );
          return;
        }
      } else {
        // Going offline - stop tracking
        await location.stopBackgroundTracking();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.lat || 43.2207,
            longitude: currentLocation?.lng || -79.7651,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              }}
              title="You"
            />
          )}
        </MapView>

        {/* Status Overlay */}
        <View style={styles.statusOverlay}>
          <View
            style={[
              styles.statusBadge,
              isOnline ? styles.statusOnline : styles.statusOffline,
            ]}
          >
            <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(todayEarnings)}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
        </View>

        {/* Active Delivery Banner */}
        {activeDelivery && (
          <TouchableOpacity
            style={styles.activeDeliveryBanner}
            onPress={() => navigation.navigate('ActiveDelivery')}
          >
            <View>
              <Text style={styles.activeDeliveryTitle}>Active Delivery</Text>
              <Text style={styles.activeDeliveryText}>
                {activeDelivery.chefBusinessName} → {activeDelivery.deliveryAddress}
              </Text>
            </View>
            <Text style={styles.activeDeliveryArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Go Online/Offline Button */}
        <TouchableOpacity
          style={[
            styles.onlineButton,
            isOnline ? styles.onlineButtonActive : styles.onlineButtonInactive,
          ]}
          onPress={toggleOnlineStatus}
          disabled={loading}
        >
          <Text style={styles.onlineButtonText}>
            {loading ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>

        {!driver?.isVerified && (
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationText}>
              ⚠️ Complete your profile verification to start accepting deliveries
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.45,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusOnline: {
    backgroundColor: '#e8f5e9',
  },
  statusOffline: {
    backgroundColor: '#fafafa',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9e9e9e',
  },
  statusDotOnline: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151515',
  },
  statLabel: {
    fontSize: 12,
    color: '#5f5f5f',
    marginTop: 4,
  },
  activeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196f3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeDeliveryTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  activeDeliveryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activeDeliveryArrow: {
    fontSize: 24,
    color: '#fff',
  },
  onlineButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  onlineButtonActive: {
    backgroundColor: '#f44336',
  },
  onlineButtonInactive: {
    backgroundColor: '#4caf50',
  },
  onlineButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  verificationBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  verificationText: {
    fontSize: 13,
    color: '#e65100',
    textAlign: 'center',
  },
});

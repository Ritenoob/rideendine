import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { api } from './api';
import { useDeliveryStore } from '@/store';

const LOCATION_TASK_NAME = 'driver-location-tracking';

// Define background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location) {
      const { latitude: lat, longitude: lng } = location.coords;
      const heading = location.coords.heading || undefined;

      // Update store
      useDeliveryStore.getState().setCurrentLocation(lat, lng);

      // Send to server
      try {
        await api.updateDriverLocation(lat, lng, heading ?? undefined);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }
  }
});

class LocationService {
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status: foreground } = await Location.requestForegroundPermissionsAsync();

      if (foreground !== 'granted') {
        return false;
      }

      const { status: background } = await Location.requestBackgroundPermissionsAsync();
      this.hasPermission = background === 'granted';

      return this.hasPermission;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async startBackgroundTracking(): Promise<boolean> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (!isRunning) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'RideNDine Driver',
            notificationBody: 'Tracking your location for active deliveries',
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Start tracking error:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (error) {
      console.error('Stop tracking error:', error);
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const location = new LocationService();

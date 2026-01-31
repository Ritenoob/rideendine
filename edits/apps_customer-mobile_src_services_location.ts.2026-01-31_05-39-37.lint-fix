/**
 * Location Service - Get user's location
 */
import * as Location from 'expo-location';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationResult {
  coords: Coordinates;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

class LocationService {
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationResult | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Try to get address from coordinates
      const address = await this.reverseGeocode(coords);

      return {
        coords,
        address,
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async reverseGeocode(
    coords: Coordinates
  ): Promise<LocationResult['address'] | undefined> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      if (results.length > 0) {
        const result = results[0];
        return {
          street: `${result.streetNumber || ''} ${result.street || ''}`.trim(),
          city: result.city || result.subregion || '',
          state: result.region || '',
          zipCode: result.postalCode || '',
        };
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
    return undefined;
  }

  async geocode(
    address: string
  ): Promise<Coordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        return {
          lat: results[0].latitude,
          lng: results[0].longitude,
        };
      }
    } catch (error) {
      console.error('Geocode error:', error);
    }
    return null;
  }

  calculateDistance(
    from: Coordinates,
    to: Coordinates
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
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

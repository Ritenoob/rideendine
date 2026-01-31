import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface DistanceResult {
  distanceKm: number;
  distanceMiles: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly googleMapsClient: Client;
  private readonly apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not configured. Geocoding will fail.');
    }

    this.googleMapsClient = new Client({});
  }

  /**
   * Convert address string to coordinates
   * @param address Full address string (e.g., "123 Main St, Hamilton, ON L8P 1A1")
   * @returns Coordinates and formatted address
   */
  async geocode(address: string): Promise<GeocodeResponse> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      this.logger.debug(`Geocoding address: ${address}`);

      const response = await this.googleMapsClient.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        this.logger.error(`Geocoding failed: ${response.data.status}`);
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      if (response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
      };
    } catch (error: any) {
      this.logger.error(`Geocoding error: ${error.message}`, error.stack);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  /**
   * Convert coordinates to address
   * @param lat Latitude
   * @param lng Longitude
   * @returns Formatted address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      this.logger.debug(`Reverse geocoding: ${lat}, ${lng}`);

      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        this.logger.error(`Reverse geocoding failed: ${response.data.status}`);
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }

      if (response.data.results.length === 0) {
        throw new Error('Location not found');
      }

      return response.data.results[0].formatted_address;
    } catch (error: any) {
      this.logger.error(`Reverse geocoding error: ${error.message}`, error.stack);
      throw new Error(`Failed to reverse geocode: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Start latitude
   * @param lng1 Start longitude
   * @param lat2 End latitude
   * @param lng2 End longitude
   * @returns Distance in km and miles
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): DistanceResult {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    return {
      distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimals
      distanceMiles: Math.round(distanceKm * 0.621371 * 100) / 100, // Convert to miles
    };
  }

  /**
   * Check if delivery address is within chef's delivery radius
   * @param chefLat Chef location latitude
   * @param chefLng Chef location longitude
   * @param deliveryLat Delivery location latitude
   * @param deliveryLng Delivery location longitude
   * @param radiusMiles Chef's delivery radius in miles
   * @returns true if within radius
   */
  validateDeliveryZone(
    chefLat: number,
    chefLng: number,
    deliveryLat: number,
    deliveryLng: number,
    radiusMiles: number,
  ): { valid: boolean; distance: DistanceResult } {
    const distance = this.calculateDistance(chefLat, chefLng, deliveryLat, deliveryLng);

    return {
      valid: distance.distanceMiles <= radiusMiles,
      distance,
    };
  }

  /**
   * Calculate dynamic delivery fee based on distance
   * Base fee: $5.00
   * Additional: $1.50 per mile after 3 miles
   * @param distanceMiles Distance in miles
   * @returns Delivery fee in cents
   */
  calculateDeliveryFee(distanceMiles: number): number {
    const BASE_FEE = 500; // $5.00 in cents
    const FREE_MILES = 3;
    const ADDITIONAL_RATE = 150; // $1.50 per mile in cents

    if (distanceMiles <= FREE_MILES) {
      return BASE_FEE;
    }

    const additionalMiles = distanceMiles - FREE_MILES;
    const additionalFee = Math.ceil(additionalMiles * ADDITIONAL_RATE);

    return BASE_FEE + additionalFee;
  }

  /**
   * Get estimated travel time and distance from Google Maps Distance Matrix API
   * @param originLat Origin latitude (chef location)
   * @param originLng Origin longitude
   * @param destLat Destination latitude (customer location)
   * @param destLng Destination longitude
   * @returns Travel time in minutes and distance in km
   */
  async getRouteInfo(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ durationMinutes: number; distanceKm: number }> {
    if (!this.apiKey) {
      // Fallback to Haversine calculation if no API key
      const distance = this.calculateDistance(originLat, originLng, destLat, destLng);
      // Assume average speed of 30 mph = 48 km/h
      const durationMinutes = Math.ceil((distance.distanceKm / 48) * 60);
      return {
        durationMinutes,
        distanceKm: distance.distanceKm,
      };
    }

    try {
      const response = await this.googleMapsClient.distancematrix({
        params: {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destLat, lng: destLng }],
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Distance Matrix API failed: ${response.data.status}`);
      }

      const element = response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Route calculation failed: ${element.status}`);
      }

      return {
        durationMinutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
        distanceKm: element.distance.value / 1000, // Convert meters to km
      };
    } catch (error: any) {
      this.logger.error(`Route info error: ${error.message}`, error.stack);
      // Fallback to Haversine
      const distance = this.calculateDistance(originLat, originLng, destLat, destLng);
      const durationMinutes = Math.ceil((distance.distanceKm / 48) * 60);
      return {
        durationMinutes,
        distanceKm: distance.distanceKm,
      };
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

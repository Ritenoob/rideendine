/**
 * Address Input Component
 * Allows users to enter or select delivery address
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onUseCurrentLocation?: () => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function AddressInput({
  value,
  onChange,
  onUseCurrentLocation,
  placeholder = 'Enter delivery address',
  disabled = false,
  loading = false,
}: AddressInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleUseCurrentLocation = async () => {
    if (!onUseCurrentLocation) return;

    setIsGettingLocation(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use your current location.',
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const addressResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResults.length > 0) {
        const address = addressResults[0];
        const formattedAddress = [address.street, address.city, address.region, address.postalCode]
          .filter(Boolean)
          .join(', ');

        onChange(formattedAddress);
      }
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter your address manually.',
      );
      console.error('Location error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Delivery Address</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9e9e9e"
          editable={!disabled && !loading}
          multiline
          numberOfLines={2}
        />
        {loading && <ActivityIndicator style={styles.loadingIndicator} color="#ff9800" />}
      </View>
      {onUseCurrentLocation && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleUseCurrentLocation}
          disabled={isGettingLocation || disabled}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#ff9800" />
          ) : (
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#151515',
    minHeight: 50,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#9e9e9e',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff5e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
  },
});

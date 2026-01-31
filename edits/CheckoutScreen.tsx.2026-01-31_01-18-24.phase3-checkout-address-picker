/**
 * Checkout Screen - Address entry and payment
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Card } from '@/components/ui';
import { api, location } from '@/services';
import { useCartStore, useOrderStore } from '@/store';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { chef, items, tip, total, clearCart, setDeliveryAddress } = useCartStore();
  const { setActiveOrder } = useOrderStore();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const result = await location.getCurrentLocation();
        if (result) {
          setCoords(result.coords);
          if (result.address) {
            setStreet(result.address.street);
            setCity(result.address.city);
            setState(result.address.state);
            setZipCode(result.address.zipCode);
          }
        }
      } catch (error) {
        console.error('Failed to get location:', error);
      } finally {
        setGettingLocation(false);
      }
    };

    fetchLocation();
  }, []);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const validate = () => {
    if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      Alert.alert('Missing Address', 'Please fill in all address fields.');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate() || !chef) return;

    setLoading(true);

    try {
      // Get coordinates if not available
      let orderCoords = coords;
      if (!orderCoords) {
        const fullAddress = `${street}, ${city}, ${state} ${zipCode}`;
        const geocoded = await location.geocode(fullAddress);
        if (geocoded) {
          orderCoords = geocoded;
        } else {
          orderCoords = { lat: 43.2207, lng: -79.7651 }; // Default
        }
      }

      const deliveryAddress = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        lat: orderCoords.lat,
        lng: orderCoords.lng,
        instructions: instructions.trim() || undefined,
      };

      setDeliveryAddress(deliveryAddress);

      // Create order
      const order = await api.createOrder({
        chefId: chef.id,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress,
        tip,
      });

      // Create payment intent
      const paymentIntent = await api.createPaymentIntent(order.id);

      // For now, simulate successful payment (in production, use Stripe SDK)
      // In a real app, you'd use the Stripe payment sheet here

      // Update order store
      setActiveOrder({
        ...order,
        chefName: chef.businessName,
      });

      // Clear cart and navigate to confirmation
      clearCart();
      navigation.replace('OrderConfirmation', { orderId: order.id });
    } catch (error: any) {
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (gettingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>

          <Input
            label="Street Address"
            placeholder="123 Main St, Apt 4B"
            value={street}
            onChangeText={setStreet}
            autoCapitalize="words"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="City"
                placeholder="Hamilton"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="State"
                placeholder="ON"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Input
            label="ZIP Code"
            placeholder="L8P 1A1"
            value={zipCode}
            onChangeText={setZipCode}
            autoCapitalize="characters"
          />

          <Input
            label="Delivery Instructions (optional)"
            placeholder="Gate code, building entrance, etc."
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </Card>

        {/* Payment */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>💳 Payment</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentIcon}>💳</Text>
            <View>
              <Text style={styles.paymentLabel}>Pay with Stripe</Text>
              <Text style={styles.paymentDesc}>
                Secure payment powered by Stripe
              </Text>
            </View>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📋 Order Summary</Text>
          <Text style={styles.chefName}>{chef?.businessName}</Text>
          <Text style={styles.itemCount}>
            {items.reduce((sum, i) => sum + i.quantity, 0)} items
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Place Order Footer */}
      <View style={styles.footer}>
        <Button
          title={loading ? 'Placing Order...' : `Place Order - ${formatCurrency(total)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          size="large"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#5f5f5f',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
  },
  paymentDesc: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  chefName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 13,
    color: '#5f5f5f',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

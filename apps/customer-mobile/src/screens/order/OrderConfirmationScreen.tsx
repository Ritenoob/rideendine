/**
 * Order Confirmation Screen - Success screen after placing order
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { Button } from '@/components/ui';

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✓</Text>
        </View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order has been successfully placed and is being prepared.
        </Text>

        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>{orderId}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>👨‍🍳</Text>
          <Text style={styles.infoText}>
            The chef will start preparing your food once they accept the order.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔔</Text>
          <Text style={styles.infoText}>
            You'll receive notifications as your order progresses.
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Track Order"
          onPress={() => navigation.replace('OrderTracking', { orderId })}
          size="large"
        />
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Main')}
          variant="ghost"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 48,
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#151515',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f5f5f',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  orderIdContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f5f5f',
    fontFamily: 'monospace',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5f5f5f',
    lineHeight: 20,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
});

/**
 * Order Status Timeline Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'payment_confirmed', label: 'Payment Confirmed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
  { key: 'assigned_to_driver', label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'On the Way' },
  { key: 'delivered', label: 'Delivered' },
];

interface OrderStatusTimelineProps {
  currentStatus: string;
  compact?: boolean;
}

export default function OrderStatusTimeline({
  currentStatus,
  compact = false,
}: OrderStatusTimelineProps) {
  const currentIndex = STATUS_STEPS.findIndex((step) => step.key === currentStatus);

  if (compact) {
    // Show only current status for compact view
    const currentStep = STATUS_STEPS.find((s) => s.key === currentStatus);
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.dot, styles.dotActive]} />
        <Text style={styles.compactText}>{currentStep?.label || currentStatus}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STATUS_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.indicator}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isActive && styles.dotActive,
                  isFuture && styles.dotFuture,
                ]}
              >
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              {index < STATUS_STEPS.length - 1 && (
                <View
                  style={[styles.line, isDone && styles.lineDone, isFuture && styles.lineFuture]}
                />
              )}
            </View>
            <Text
              style={[
                styles.label,
                isDone && styles.labelDone,
                isActive && styles.labelActive,
                isFuture && styles.labelFuture,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicator: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: {
    backgroundColor: '#4caf50',
  },
  dotActive: {
    backgroundColor: '#ff9800',
    transform: [{ scale: 1.2 }],
  },
  dotFuture: {
    backgroundColor: '#e0e0e0',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: '#4caf50',
  },
  lineFuture: {
    backgroundColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#151515',
    paddingTop: 2,
    paddingBottom: 28,
  },
  labelDone: {
    color: '#4caf50',
  },
  labelActive: {
    fontWeight: '700',
    color: '#ff9800',
  },
  labelFuture: {
    color: '#9e9e9e',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
  },
});

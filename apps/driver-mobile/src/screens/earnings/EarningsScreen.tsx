import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services';

interface Earnings {
  total: number;
  deliveries: number;
  tips: number;
}

export default function EarningsScreen() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings, setEarnings] = useState<Earnings>({
    total: 0,
    deliveries: 0,
    tips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const data = await api.getEarnings(period);
      setEarnings(data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Earnings</Text>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Earnings */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalValue}>{formatCurrency(earnings.total)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{earnings.deliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{formatCurrency(earnings.tips)}</Text>
            <Text style={styles.statLabel}>Tips</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚗</Text>
            <Text style={styles.statValue}>
              {formatCurrency(earnings.total - earnings.tips)}
            </Text>
            <Text style={styles.statLabel}>Delivery Fees</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>
              {earnings.deliveries > 0
                ? formatCurrency(earnings.total / earnings.deliveries)
                : '$0.00'}
            </Text>
            <Text style={styles.statLabel}>Avg per Delivery</Text>
          </View>
        </View>

        {/* Payout Info */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>💳 Payouts</Text>
          <Text style={styles.payoutText}>
            Your earnings are paid out weekly via direct deposit. Payments are processed
            every Monday for the previous week's deliveries.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#151515',
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#ff9800',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f5f5f',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#4caf50',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#5f5f5f',
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 8,
  },
  payoutText: {
    fontSize: 14,
    color: '#5f5f5f',
    lineHeight: 22,
  },
});

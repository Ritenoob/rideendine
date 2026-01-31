'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Settings,
  DollarSign,
  Percent,
  Clock,
  MapPin,
  Bell,
  Shield,
  Save,
  AlertCircle,
} from 'lucide-react';

interface PlatformSettings {
  // Commission Settings
  chef_commission_rate: number;
  driver_commission_rate: number;
  platform_fee_rate: number;

  // Delivery Settings
  min_delivery_fee: number;
  max_delivery_fee: number;
  base_delivery_fee: number;
  per_km_rate: number;
  max_delivery_radius_km: number;

  // Order Settings
  min_order_amount: number;
  max_prep_time_minutes: number;
  order_timeout_minutes: number;

  // Driver Settings
  min_driver_rating: number;
  max_concurrent_deliveries: number;

  // Platform Status
  maintenance_mode: boolean;
  new_registrations_enabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    chef_commission_rate: 15,
    driver_commission_rate: 85,
    platform_fee_rate: 0,

    min_delivery_fee: 299,
    max_delivery_fee: 999,
    base_delivery_fee: 299,
    per_km_rate: 50,
    max_delivery_radius_km: 15,

    min_order_amount: 1500,
    max_prep_time_minutes: 60,
    order_timeout_minutes: 5,

    min_driver_rating: 4.0,
    max_concurrent_deliveries: 3,

    maintenance_mode: false,
    new_registrations_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Platform Settings</h1>
          <p className="text-muted text-sm">
            Configure platform-wide settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700">
          <AlertCircle className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Percent className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Commission Rates</h3>
              <p className="text-sm text-muted">
                Set commission percentages
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Chef Commission Rate (%)
              </label>
              <input
                type="number"
                value={settings.chef_commission_rate}
                onChange={(e) =>
                  updateSetting('chef_commission_rate', Number(e.target.value))
                }
                min={0}
                max={100}
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Platform takes {settings.chef_commission_rate}% from chef
                earnings
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Driver Earnings Rate (%)
              </label>
              <input
                type="number"
                value={settings.driver_commission_rate}
                onChange={(e) =>
                  updateSetting('driver_commission_rate', Number(e.target.value))
                }
                min={0}
                max={100}
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Drivers receive {settings.driver_commission_rate}% of delivery
                fees
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Delivery Settings</h3>
              <p className="text-sm text-muted">Configure delivery fees</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Min Delivery Fee
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="number"
                    value={(settings.min_delivery_fee / 100).toFixed(2)}
                    onChange={(e) =>
                      updateSetting(
                        'min_delivery_fee',
                        Math.round(Number(e.target.value) * 100)
                      )
                    }
                    step="0.01"
                    className="input pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Max Delivery Fee
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="number"
                    value={(settings.max_delivery_fee / 100).toFixed(2)}
                    onChange={(e) =>
                      updateSetting(
                        'max_delivery_fee',
                        Math.round(Number(e.target.value) * 100)
                      )
                    }
                    step="0.01"
                    className="input pl-8"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Per KM Rate (cents)
              </label>
              <input
                type="number"
                value={settings.per_km_rate}
                onChange={(e) =>
                  updateSetting('per_km_rate', Number(e.target.value))
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Max Delivery Radius (km)
              </label>
              <input
                type="number"
                value={settings.max_delivery_radius_km}
                onChange={(e) =>
                  updateSetting('max_delivery_radius_km', Number(e.target.value))
                }
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Order Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Order Settings</h3>
              <p className="text-sm text-muted">Configure order parameters</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Minimum Order Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="number"
                  value={(settings.min_order_amount / 100).toFixed(2)}
                  onChange={(e) =>
                    updateSetting(
                      'min_order_amount',
                      Math.round(Number(e.target.value) * 100)
                    )
                  }
                  step="0.01"
                  className="input pl-8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Max Prep Time (minutes)
              </label>
              <input
                type="number"
                value={settings.max_prep_time_minutes}
                onChange={(e) =>
                  updateSetting('max_prep_time_minutes', Number(e.target.value))
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Order Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.order_timeout_minutes}
                onChange={(e) =>
                  updateSetting('order_timeout_minutes', Number(e.target.value))
                }
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Time for chef to accept before auto-cancel
              </p>
            </div>
          </div>
        </div>

        {/* Driver Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Driver Settings</h3>
              <p className="text-sm text-muted">Configure driver parameters</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Minimum Driver Rating
              </label>
              <input
                type="number"
                value={settings.min_driver_rating}
                onChange={(e) =>
                  updateSetting('min_driver_rating', Number(e.target.value))
                }
                min={0}
                max={5}
                step="0.1"
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Drivers below this rating are deactivated
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Max Concurrent Deliveries
              </label>
              <input
                type="number"
                value={settings.max_concurrent_deliveries}
                onChange={(e) =>
                  updateSetting(
                    'max_concurrent_deliveries',
                    Number(e.target.value)
                  )
                }
                min={1}
                max={10}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Platform Status</h3>
              <p className="text-sm text-muted">Control platform operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-ink">Maintenance Mode</p>
                <p className="text-sm text-muted">
                  Disable all platform operations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) =>
                    updateSetting('maintenance_mode', e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-ink">New Registrations</p>
                <p className="text-sm text-muted">
                  Allow new chef/driver signups
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.new_registrations_enabled}
                  onChange={(e) =>
                    updateSetting('new_registrations_enabled', e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

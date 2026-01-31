'use client';

import { useState } from 'react';
import { Save, Lock, Bell, MapPin, Clock, DollarSign } from 'lucide-react';

interface OperatingHours {
  [day: string]: {
    open: string;
    close: string;
  } | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'hours' | 'payment' | 'notifications'>('business');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Chef Antonio\'s Kitchen',
    phone: '+1 (555) 123-4567',
    email: 'chef@example.com',
    address: '123 Main St, New York, NY 10001',
    deliveryRadius: 5,
    minOrderValue: 25,
    description: 'Authentic Italian cuisine prepared fresh daily',
  });

  // Operating Hours State
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: { open: '09:00', close: '21:00' },
    tuesday: { open: '09:00', close: '21:00' },
    wednesday: null,
    thursday: { open: '09:00', close: '21:00' },
    friday: { open: '09:00', close: '23:00' },
    saturday: { open: '10:00', close: '23:00' },
    sunday: { open: '10:00', close: '21:00' },
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    bankName: 'Chase Bank',
    accountHolderName: 'Antonio Rossi',
    accountLast4: '4242',
    payoutFrequency: 'daily',
    minimumPayout: 100,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewOrder: true,
    smsOnNewOrder: true,
    emailOnStatusChange: true,
    smsOnStatusChange: false,
    promotionalEmails: true,
    weeklyReports: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveMessage('Settings saved successfully!');
    setIsSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your restaurant profile and preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'business', label: 'Business Info', icon: MapPin },
          { id: 'hours', label: 'Operating Hours', icon: Clock },
          { id: 'payment', label: 'Payment Method', icon: DollarSign },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              \{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Address
              </label>
              <input
                type="text"
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Delivery Radius (km)
                </label>
                <input
                  type="number"
                  value={businessInfo.deliveryRadius}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, deliveryRadius: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Minimum Order Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={businessInfo.minOrderValue}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, minOrderValue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Restaurant Description
              </label>
              <textarea
                value={businessInfo.description}
                onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Operating Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>

            {dayKeys.map((dayKey, idx) => (
              <div key={dayKey} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <span className="w-24 font-medium text-gray-900">{days[idx]}</span>

                {operatingHours[dayKey] ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={operatingHours[dayKey]?.open || ''}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [dayKey]: { ...operatingHours[dayKey]!, open: e.target.value },
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span className="text-gray-600">to</span>
                      <input
                        type="time"
                        value={operatingHours[dayKey]?.close || ''}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [dayKey]: { ...operatingHours[dayKey]!, close: e.target.value },
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <button
                      onClick={() => setOperatingHours({ ...operatingHours, [dayKey]: null })}
                      className="ml-auto px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                    >
                      Mark Closed
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">Closed</span>
                    <button
                      onClick={() =>
                        setOperatingHours({
                          ...operatingHours,
                          [dayKey]: { open: '09:00', close: '21:00' },
                        })
                      }
                      className="ml-auto px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                    >
                      Add Hours
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payment Method Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Your payout account is verified and active. Earnings are transferred to your bank account.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={paymentSettings.bankName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={paymentSettings.accountHolderName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={`••••••••${paymentSettings.accountLast4}`}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Payout Frequency
                </label>
                <select
                  value={paymentSettings.payoutFrequency}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, payoutFrequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Minimum Payout ($)
                </label>
                <input
                  type="number"
                  value={paymentSettings.minimumPayout}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumPayout: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">
              <Lock className="w-4 h-4" />
              Change Bank Account
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnNewOrder}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, emailOnNewOrder: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Email notifications for new orders
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.smsOnNewOrder}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, smsOnNewOrder: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  SMS notifications for new orders
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnStatusChange}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, emailOnStatusChange: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Email when order status changes
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.smsOnStatusChange}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, smsOnStatusChange: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  SMS when order status changes
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.promotionalEmails}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, promotionalEmails: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Promotional and marketing emails
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) =>
                    setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Weekly earnings and performance report
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

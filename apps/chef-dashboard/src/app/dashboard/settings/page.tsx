'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { ExternalLink, Check, AlertCircle } from 'lucide-react';

const CUISINE_OPTIONS = [
  'American',
  'Chinese',
  'Indian',
  'Italian',
  'Japanese',
  'Korean',
  'Mexican',
  'Thai',
  'Vietnamese',
  'Mediterranean',
  'Caribbean',
  'Soul Food',
  'BBQ',
  'Vegan',
  'Other',
];

export default function SettingsPage() {
  const { chef, setChef, user } = useAuthStore();

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cuisineTypes: [] as string[],
    minimumOrder: '',
    deliveryRadius: '',
    averagePrepTime: '',
  });

  const [stripeStatus, setStripeStatus] = useState<{
    complete: boolean;
    payoutsEnabled: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    if (chef) {
      setFormData({
        businessName: chef.businessName || '',
        description: (chef as any).description || '',
        address: (chef as any).address || '',
        city: (chef as any).city || '',
        state: (chef as any).state || '',
        zipCode: (chef as any).zipCode || '',
        cuisineTypes: (chef as any).cuisineTypes || [],
        minimumOrder: ((chef as any).minimumOrder / 100).toString() || '',
        deliveryRadius: (chef as any).deliveryRadius?.toString() || '',
        averagePrepTime: (chef as any).averagePrepTime?.toString() || '',
      });

      // Fetch Stripe status
      api.getStripeStatus(chef.id).then(setStripeStatus).catch(() => {});
    }
  }, [chef]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCuisineToggle = (cuisine: string) => {
    const cuisines = formData.cuisineTypes.includes(cuisine)
      ? formData.cuisineTypes.filter((c) => c !== cuisine)
      : [...formData.cuisineTypes, cuisine];
    setFormData({ ...formData, cuisineTypes: cuisines });
  };

  const handleSave = async () => {
    if (!formData.businessName || !formData.address || !formData.city) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      if (chef) {
        const updated = await api.updateChefProfile(chef.id, {
          businessName: formData.businessName,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          cuisineTypes: formData.cuisineTypes,
          minimumOrder: Math.round(parseFloat(formData.minimumOrder || '10') * 100),
          deliveryRadius: parseInt(formData.deliveryRadius || '10'),
          averagePrepTime: parseInt(formData.averagePrepTime || '30'),
        });
        setChef(updated);
        toast.success('Profile updated!');
      } else {
        const created = await api.applyAsChef({
          businessName: formData.businessName,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          cuisineTypes: formData.cuisineTypes,
          minimumOrder: Math.round(parseFloat(formData.minimumOrder || '10') * 100),
          deliveryRadius: parseInt(formData.deliveryRadius || '10'),
          averagePrepTime: parseInt(formData.averagePrepTime || '30'),
          lat: 43.2207,
          lng: -79.7651,
        });
        setChef(created);
        toast.success('Chef profile created!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeOnboarding = async () => {
    if (!chef) return;

    setStripeLoading(true);
    try {
      const { url } = await api.getStripeOnboardingLink(chef.id);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start Stripe onboarding');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleVacationToggle = async () => {
    if (!chef) return;

    try {
      const updated = await api.toggleVacationMode(chef.id);
      setChef(updated);
      toast.success(updated.isOnVacation ? 'Vacation mode enabled' : 'Vacation mode disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle vacation mode');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-muted mt-1">Manage your chef profile and preferences</p>
      </div>

      {/* Business Info */}
      <div className="card">
        <h2 className="text-lg font-bold text-ink mb-6">Business Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="businessName"
              className="input"
              placeholder="Chef John's Kitchen"
              value={formData.businessName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Description</label>
            <textarea
              name="description"
              className="input"
              rows={3}
              placeholder="Tell customers about your cooking..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Address *</label>
            <input
              type="text"
              name="address"
              className="input"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">City *</label>
              <input
                type="text"
                name="city"
                className="input"
                placeholder="Hamilton"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">State</label>
              <input
                type="text"
                name="state"
                className="input"
                placeholder="ON"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">ZIP</label>
              <input
                type="text"
                name="zipCode"
                className="input"
                placeholder="L8P 1A1"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Cuisine Types</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.cuisineTypes.includes(cuisine)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Min Order ($)</label>
              <input
                type="number"
                name="minimumOrder"
                className="input"
                placeholder="10"
                value={formData.minimumOrder}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Radius (mi)</label>
              <input
                type="number"
                name="deliveryRadius"
                className="input"
                placeholder="10"
                value={formData.deliveryRadius}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Prep Time (min)</label>
              <input
                type="number"
                name="averagePrepTime"
                className="input"
                placeholder="30"
                value={formData.averagePrepTime}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary mt-6" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Stripe Connect */}
      {chef && (
        <div className="card">
          <h2 className="text-lg font-bold text-ink mb-4">Payment Setup</h2>

          {stripeStatus?.complete ? (
            <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-xl">
              <Check size={20} />
              <span className="font-medium">Stripe Connect is set up and payouts are enabled</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 text-orange-600 bg-orange-50 p-4 rounded-xl mb-4">
                <AlertCircle size={20} />
                <span className="font-medium">
                  Complete Stripe setup to receive payments
                </span>
              </div>
              <button
                onClick={handleStripeOnboarding}
                className="btn-primary flex items-center gap-2"
                disabled={stripeLoading}
              >
                {stripeLoading ? 'Loading...' : 'Set Up Stripe Connect'}
                <ExternalLink size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vacation Mode */}
      {chef && (
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">Vacation Mode</h2>
              <p className="text-sm text-muted mt-1">
                Temporarily stop receiving orders
              </p>
            </div>
            <button
              onClick={handleVacationToggle}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                (chef as any).isOnVacation
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              {(chef as any).isOnVacation ? 'Disable Vacation' : 'Enable Vacation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

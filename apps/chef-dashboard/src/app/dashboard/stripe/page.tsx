'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { ExternalLink, CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';

interface StripeStatus {
  accountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requiresInformation: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export default function StripePage() {
  const router = useRouter();
  const { chef, user } = useAuthStore();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    if (!chef) return;
    fetchStripeStatus();
  }, [chef]);

  const fetchStripeStatus = async () => {
    if (!chef?.id) return;

    try {
      setLoading(true);
      const response = await api.getStripeStatus(chef.id);
      setStatus(response as any);
    } catch (error: any) {
      console.error('Failed to fetch Stripe status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!chef?.id) return;

    try {
      setOnboarding(true);
      const response = await api.getStripeOnboardingLink(chef.id);
      window.location.href = response.url;
    } catch (error: any) {
      console.error('Failed to start onboarding:', error);
      alert(error.message || 'Failed to start Stripe onboarding');
    } finally {
      setOnboarding(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (!chef?.id) return;

    try {
      setDashboardLoading(true);
      const response = await api.getStripeOnboardingLink(chef.id);
      window.open(response.url, '_blank');
    } catch (error: any) {
      console.error('Failed to open Stripe dashboard:', error);
      alert(error.message || 'Failed to open Stripe dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  if (!chef) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-6">👨‍🍳</div>
          <h2 className="text-2xl font-bold text-ink mb-4">Complete Your Profile First</h2>
          <p className="text-muted mb-8">
            You need to complete your chef profile before setting up payments
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="btn-primary"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted">Loading Stripe status...</p>
        </div>
      </div>
    );
  }

  const isFullyOnboarded = status?.onboardingComplete && status?.chargesEnabled && status?.payoutsEnabled;
  const requiresAction = status?.requiresInformation || (status && !status.onboardingComplete);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">💳 Stripe Payments</h1>
        <p className="text-muted">
          Connect your Stripe account to receive payments from customers
        </p>
      </div>

      <div className="card">
        {!status ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-orange-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Connect with Stripe</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              To receive payments, you'll need to connect a Stripe account. This takes about 5-10 minutes.
            </p>
            <button
              onClick={handleStartOnboarding}
              disabled={onboarding}
              className="btn-primary"
            >
              {onboarding ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Redirecting to Stripe...
                </span>
              ) : (
                'Start Stripe Onboarding'
              )}
            </button>
          </div>
        ) : isFullyOnboarded ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">✅ You're All Set!</h2>
            <p className="text-muted mb-6">
              Your Stripe account is fully connected and ready to receive payments.
            </p>
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm text-muted">Charges Enabled</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">💸</div>
                <p className="text-sm text-muted">Payouts Enabled</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📋</div>
                <p className="text-sm text-muted">Details Complete</p>
              </div>
            </div>

            <button
              onClick={handleOpenDashboard}
              disabled={dashboardLoading}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ExternalLink size={16} />
              {dashboardLoading ? 'Opening...' : 'Open Stripe Dashboard'}
            </button>
          </div>
        ) : requiresAction ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Action Required</h2>
            <p className="text-muted mb-6">
              Your Stripe onboarding is incomplete. Please complete the remaining steps.
            </p>

            {status.requirements && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                <p className="font-semibold text-ink mb-2">Missing Information:</p>
                <ul className="space-y-1">
                  {status.requirements.currently_due.length > 0 && (
                    <>
                      {status.requirements.currently_due.map((req, idx) => (
                        <li key={idx} className="text-sm text-muted flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{req.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={handleStartOnboarding}
              disabled={onboarding}
              className="btn-primary"
            >
              {onboarding ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Redirecting...
                </span>
              ) : (
                'Complete Onboarding'
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-blue-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Onboarding In Progress</h2>
            <p className="text-muted mb-6">
              Your Stripe account is being verified. This may take a few minutes.
            </p>
            <button
              onClick={fetchStripeStatus}
              className="btn-secondary"
            >
              Refresh Status
            </button>
          </div>
        )}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-ink mb-3">ℹ️ About Stripe Connect</h3>
        <div className="space-y-2 text-sm text-muted">
          <p>
            <strong>What is Stripe?</strong> Stripe is a secure payment processor that handles all
            customer payments. You'll receive payments directly to your bank account.
          </p>
          <p>
            <strong>How long does onboarding take?</strong> About 5-10 minutes. You'll need your
            business details, bank account information, and a valid ID.
          </p>
          <p>
            <strong>When do I get paid?</strong> Payments are transferred to your bank account
            on a rolling 2-day basis after each successful delivery.
          </p>
          <p>
            <strong>Platform fee:</strong> RideNDine takes a 15% platform fee on each order.
            You receive 85% of the order subtotal.
          </p>
        </div>
      </div>

      {status && (
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-muted">Account ID</span>
              <span className="font-mono text-sm text-ink">{status.accountId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-muted">Onboarding Complete</span>
              <span className={status.onboardingComplete ? 'text-green-600' : 'text-yellow-600'}>
                {status.onboardingComplete ? '✅ Yes' : '⏳ In Progress'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-muted">Charges Enabled</span>
              <span className={status.chargesEnabled ? 'text-green-600' : 'text-red-600'}>
                {status.chargesEnabled ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted">Payouts Enabled</span>
              <span className={status.payoutsEnabled ? 'text-green-600' : 'text-red-600'}>
                {status.payoutsEnabled ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

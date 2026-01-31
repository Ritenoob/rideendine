/**
 * Payment test fixtures
 * Provides consistent test data for Stripe payment testing
 */

/**
 * Valid Stripe test card tokens
 * See: https://stripe.com/docs/testing
 */
export const stripeTestCards = {
  // Success cards
  visa: {
    number: '4242424242424242',
    token: 'tok_visa',
    paymentMethod: 'pm_card_visa',
  },
  visaDebit: {
    number: '4000056655665556',
    token: 'tok_visa_debit',
    paymentMethod: 'pm_card_visa_debit',
  },
  mastercard: {
    number: '5555555555554444',
    token: 'tok_mastercard',
    paymentMethod: 'pm_card_mastercard',
  },
  amex: {
    number: '378282246310005',
    token: 'tok_amex',
    paymentMethod: 'pm_card_amex',
  },

  // Decline cards
  declinedCard: {
    number: '4000000000000002',
    token: 'tok_chargeDeclined',
    paymentMethod: 'pm_card_chargeDeclined',
  },
  insufficientFunds: {
    number: '4000000000009995',
    token: 'tok_chargeDeclinedInsufficientFunds',
    paymentMethod: 'pm_card_chargeDeclinedInsufficientFunds',
  },
  lostCard: {
    number: '4000000000009987',
    token: 'tok_chargeDeclinedLostCard',
    paymentMethod: 'pm_card_chargeDeclinedLostCard',
  },
  stolenCard: {
    number: '4000000000009979',
    token: 'tok_chargeDeclinedStolenCard',
    paymentMethod: 'pm_card_chargeDeclinedStolenCard',
  },

  // Error cards
  expiredCard: {
    number: '4000000000000069',
    token: 'tok_chargeDeclinedExpiredCard',
    paymentMethod: 'pm_card_chargeDeclinedExpiredCard',
  },
  incorrectCvc: {
    number: '4000000000000127',
    token: 'tok_chargeDeclinedIncorrectCvc',
    paymentMethod: 'pm_card_chargeDeclinedIncorrectCvc',
  },
  processingError: {
    number: '4000000000000119',
    token: 'tok_chargeDeclinedProcessingError',
    paymentMethod: 'pm_card_chargeDeclinedProcessingError',
  },

  // 3D Secure cards (requires authentication)
  requires3DSecure: {
    number: '4000002500003155',
    token: 'tok_threeDSecure2Required',
    paymentMethod: 'pm_card_threeDSecure2Required',
  },
};

/**
 * Valid payment intent test data
 */
export const validPaymentIntent = {
  id: 'pi_test1234567890',
  object: 'payment_intent',
  amount: 3300, // $33.00 in cents
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_test1234567890_secret_testclientsecret',
  payment_method: 'pm_card_visa',
  customer: 'cus_test123',
  description: 'Order payment for order-uuid-1',
  metadata: {
    order_id: 'order-uuid-1',
    customer_id: 'customer-uuid-1',
  },
};

export const pendingPaymentIntent = {
  ...validPaymentIntent,
  id: 'pi_test0987654321',
  status: 'requires_payment_method',
};

export const failedPaymentIntent = {
  ...validPaymentIntent,
  id: 'pi_testfailed123',
  status: 'canceled',
};

/**
 * Valid Stripe customer test data
 */
export const validStripeCustomer = {
  id: 'cus_test123',
  object: 'customer',
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  default_source: 'pm_card_visa',
  metadata: {
    user_id: 'customer-uuid-1',
  },
};

/**
 * Valid refund test data
 */
export const validRefund = {
  id: 'ref_test123',
  object: 'refund',
  amount: 3300, // Full refund
  currency: 'usd',
  payment_intent: 'pi_test1234567890',
  reason: 'requested_by_customer',
  status: 'succeeded',
  metadata: {
    order_id: 'order-uuid-1',
  },
};

export const partialRefund = {
  ...validRefund,
  id: 'ref_testpartial456',
  amount: 1500, // Partial refund of $15
};

/**
 * Valid payout test data (for chef payouts)
 */
export const validPayout = {
  id: 'po_test123',
  object: 'payout',
  amount: 2125, // $21.25 in cents
  currency: 'usd',
  status: 'paid',
  arrival_date: Math.floor(new Date('2026-02-03T00:00:00Z').getTime() / 1000),
  destination: 'acct_test123',
  metadata: {
    order_id: 'order-uuid-1',
    chef_id: 'chef-uuid-1',
  },
};

/**
 * Payment processing scenarios for testing
 */
export const paymentScenarios = [
  {
    description: 'Successful payment',
    amount: 3300,
    paymentMethod: 'pm_card_visa',
    expectedStatus: 'succeeded',
    shouldSucceed: true,
  },
  {
    description: 'Declined card',
    amount: 3300,
    paymentMethod: 'pm_card_chargeDeclined',
    expectedStatus: 'canceled',
    shouldSucceed: false,
    expectedError: 'Your card was declined',
  },
  {
    description: 'Insufficient funds',
    amount: 3300,
    paymentMethod: 'pm_card_chargeDeclinedInsufficientFunds',
    expectedStatus: 'canceled',
    shouldSucceed: false,
    expectedError: 'Your card has insufficient funds',
  },
  {
    description: 'Expired card',
    amount: 3300,
    paymentMethod: 'pm_card_chargeDeclinedExpiredCard',
    expectedStatus: 'canceled',
    shouldSucceed: false,
    expectedError: 'Your card has expired',
  },
];

/**
 * Refund scenarios for testing
 */
export const refundScenarios = [
  {
    description: 'Full refund',
    originalAmount: 3300,
    refundAmount: 3300,
    reason: 'requested_by_customer',
    shouldSucceed: true,
  },
  {
    description: 'Partial refund',
    originalAmount: 3300,
    refundAmount: 1500,
    reason: 'duplicate',
    shouldSucceed: true,
  },
  {
    description: 'Refund exceeds original amount',
    originalAmount: 3300,
    refundAmount: 5000,
    reason: 'requested_by_customer',
    shouldSucceed: false,
    expectedError: 'Refund amount exceeds original payment',
  },
];

/**
 * Commission split calculations for testing
 */
export const commissionSplitScenarios = [
  {
    description: '15% commission on $25 order',
    subtotal: 2500,
    commissionRate: 15,
    expectedCommission: 375, // $3.75
    expectedChefPayout: 2125, // $21.25
  },
  {
    description: '20% commission on $50 order',
    subtotal: 5000,
    commissionRate: 20,
    expectedCommission: 1000, // $10
    expectedChefPayout: 4000, // $40
  },
  {
    description: '10% commission on $100 order',
    subtotal: 10000,
    commissionRate: 10,
    expectedCommission: 1000, // $10
    expectedChefPayout: 9000, // $90
  },
];

/**
 * Webhook event test data
 */
export const stripeWebhookEvents = {
  paymentIntentSucceeded: {
    id: 'evt_test123',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: validPaymentIntent,
    },
  },
  paymentIntentFailed: {
    id: 'evt_testfailed456',
    object: 'event',
    type: 'payment_intent.payment_failed',
    data: {
      object: failedPaymentIntent,
    },
  },
  refundCreated: {
    id: 'evt_testrefund789',
    object: 'event',
    type: 'refund.created',
    data: {
      object: validRefund,
    },
  },
  payoutPaid: {
    id: 'evt_testpayout012',
    object: 'event',
    type: 'payout.paid',
    data: {
      object: validPayout,
    },
  },
};

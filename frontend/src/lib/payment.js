/** Mock provider boundary. Add Paystack or Flutterwave by implementing initializeCheckout(). */
export const paymentProvider = 'mock';
export async function initializeCheckout({ orderId, amount }) {
  // Intentionally no real charge in demo mode. Persist orders as pending payment.
  return { provider: paymentProvider, reference: `mock_${orderId}`, amount, status: 'pending' };
}

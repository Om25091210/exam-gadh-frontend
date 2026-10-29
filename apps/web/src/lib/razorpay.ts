/** Minimal types for Razorpay Standard Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/). */
export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', cb: (r: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('razorpay-script'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type CheckoutResult = { status: 'paid'; payment: RazorpaySuccess } | { status: 'dismissed' } | { status: 'failed' };

/** Opens the Razorpay window for an order created by our server. Resolves once the student pays, closes it, or the payment fails. */
export async function openCheckout(o: { keyId: string; orderId: string; amountPaise: number; currency: string; description: string; name?: string; email?: string }): Promise<CheckoutResult> {
  await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: o.keyId,
      amount: o.amountPaise,
      currency: o.currency,
      name: 'ExamGadh',
      description: o.description,
      order_id: o.orderId,
      prefill: { name: o.name, email: o.email },
      theme: { color: '#0e6350' },
      handler: (r) => resolve({ status: 'paid', payment: r }),
      modal: { ondismiss: () => resolve({ status: 'dismissed' }) },
    });
    rzp.on('payment.failed', () => resolve({ status: 'failed' }));
    rzp.open();
  });
}

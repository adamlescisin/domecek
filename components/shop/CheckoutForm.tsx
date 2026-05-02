'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Button from '@/components/ui/Button';
import { formatCZK } from '@/lib/utils';

interface CheckoutFormProps {
  total: number;
  onSuccess: () => void;
}

export default function CheckoutForm({ total, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Chyba platby');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Platba se nezdařila');
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement />
      {error && <p className="font-body text-sm text-error">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={processing} disabled={!stripe}>
        Zaplatit {formatCZK(total)}
      </Button>
    </form>
  );
}

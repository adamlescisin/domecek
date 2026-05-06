'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useBasket } from '@/lib/basket-context';
import { formatCZK } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ItemCard from '@/components/shop/ItemCard';
import BasketDrawer from '@/components/shop/BasketDrawer';
import CheckoutForm from '@/components/shop/CheckoutForm';
import SuccessScreen from '@/components/shop/SuccessScreen';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const stripeAppearance: Appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#1C1C1A',
    colorBackground: '#FDFAF6',
    colorText: '#1C1C1A',
    colorDanger: '#B94040',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '8px',
  },
};

interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sectionId: number | null;
}

interface Section {
  id: number;
  name: string;
  sortOrder: number;
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    return (Array.isArray(fallback) ? (Array.isArray(data) ? data : fallback) : data) as T;
  } catch {
    return fallback;
  }
}

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [basketOpen, setBasketOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const { count, items: basketItems, clearBasket } = useBasket();

  useEffect(() => {
    setFetchError(false);
    Promise.all([
      fetchJson<Item[]>('/api/items', []),
      fetchJson<Section[]>('/api/sections', []),
    ])
      .then(([fetchedItems, fetchedSections]) => {
        setItems(fetchedItems);
        setSections(fetchedSections);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleCheckout() {
    setBasketOpen(false);
    setClientSecret(null);
    setCheckoutOpen(true);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Zadejte platnou e-mailovou adresu');
      return;
    }
    setEmailError('');
    try {
      const res = await fetch('/api/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: basketItems.map((i) => ({ id: i.id, quantity: i.quantity })),
          email: trimmed,
        }),
      });
      if (!res.ok) {
        setEmailError('Chyba při vytváření platby. Zkuste to znovu.');
        return;
      }
      const data = await res.json();
      if (!data.clientSecret) {
        setEmailError('Chyba při vytváření platby. Zkuste to znovu.');
        return;
      }
      setClientSecret(data.clientSecret);
      setCheckoutTotal(data.total);
    } catch {
      setEmailError('Chyba připojení. Zkuste to znovu.');
    }
  }

  function handleSuccess() {
    clearBasket();
    setCheckoutOpen(false);
    setClientSecret(null);
    setEmail('');
    setSuccess(true);
  }

  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: Array<{ sectionId: number | null; label: string | null; items: Item[] }> = [
    ...sortedSections.map((s) => ({
      sectionId: s.id,
      label: s.name,
      items: items.filter((i) => i.sectionId === s.id),
    })),
    {
      sectionId: null,
      label: sortedSections.length > 0 ? 'Ostatní' : null,
      items: items.filter((i) => i.sectionId == null),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo height={36} />
          <button
            onClick={() => setBasketOpen(true)}
            className="flex items-center gap-2 font-body text-sm font-medium text-charcoal hover:text-brown transition-colors"
            aria-label={`Košík (${count} položek)`}
          >
            <div className="relative">
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brown text-cream text-[10px] font-medium flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Košík {count > 0 ? `(${count})` : ''}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">Vyberte si služby</h1>
          <p className="font-body text-charcoal/60">
            Přidejte položky do košíku a plaťte kartou, Apple Pay nebo Google Pay.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <p className="font-body text-charcoal/60">Nepodařilo se načíst položky. Zkuste obnovit stránku.</p>
            <Button variant="ghost" onClick={() => window.location.reload()}>Obnovit</Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="font-body text-charcoal/50 py-16 text-center">Momentálně nejsou k dispozici žádné položky.</p>
        ) : groups.length === 1 && groups[0].label === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups[0].items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map((group) => (
              <section key={group.sectionId ?? 'unsectioned'}>
                {group.label && (
                  <h2 className="font-display text-xl font-semibold text-charcoal mb-4">
                    {group.label}
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Basket drawer */}
      <BasketDrawer
        open={basketOpen}
        onClose={() => setBasketOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-charcoal">Platba</h2>

            {/* Order summary */}
            <div className="border border-border rounded-xl p-4">
              <p className="font-body text-sm text-charcoal/60 mb-3">Shrnutí objednávky</p>
              {basketItems.map((i) => (
                <div key={i.id} className="flex justify-between font-body text-sm text-charcoal py-1">
                  <span>{i.name} × {i.quantity}</span>
                  <span>{formatCZK(i.priceCzk * i.quantity)}</span>
                </div>
              ))}
              {clientSecret && (
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-body font-medium text-charcoal">
                  <span>Celkem</span>
                  <span>{formatCZK(checkoutTotal)}</span>
                </div>
              )}
            </div>

            {/* Step 1: email */}
            {!clientSecret && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <Input
                  id="checkout-email"
                  type="email"
                  label="E-mail pro potvrzení objednávky"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  error={emailError}
                  autoFocus
                  autoComplete="email"
                />
                <Button type="submit" size="lg" className="w-full">
                  Pokračovat k platbě
                </Button>
              </form>
            )}

            {/* Step 2: Stripe payment */}
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                <CheckoutForm total={checkoutTotal} onSuccess={handleSuccess} />
              </Elements>
            )}

            <button
              onClick={() => { setCheckoutOpen(false); setClientSecret(null); }}
              className="font-body text-sm text-charcoal/50 hover:text-charcoal transition-colors text-center"
            >
              Zpět do košíku
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {success && <SuccessScreen onClose={() => setSuccess(false)} />}
    </div>
  );
}

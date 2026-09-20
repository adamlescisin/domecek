'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Globe } from 'lucide-react';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useBasket } from '@/lib/basket-context';
import { formatCZK } from '@/lib/utils';
import { DEFAULT_STRINGS, type UiStrings } from '@/lib/ui-text';
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

interface Language {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  rateFromCzk: number;
}

interface Translation {
  entityType: string;
  entityId: number;
  langCode: string;
  field: string;
  value: string;
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

function formatForeign(priceCzk: string, lang: Language): string {
  const foreign = parseFloat(priceCzk) * lang.rateFromCzk;
  return `${foreign.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${lang.symbol}`;
}

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeLang, setActiveLang] = useState<string>('cs');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [uiTranslations, setUiTranslations] = useState<Record<string, Partial<UiStrings>>>({});
  const [langOpen, setLangOpen] = useState(false);
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
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFetchError(false);
    Promise.all([
      fetchJson<Item[]>('/api/items', []),
      fetchJson<Section[]>('/api/sections', []),
      fetchJson<{ key: string; value: Language[] | null }>('/api/settings?key=languages', { key: 'languages', value: null }),
      fetchJson<{ key: string; value: Record<string, Partial<UiStrings>> | null }>('/api/settings?key=ui_translations', { key: 'ui_translations', value: null }),
    ])
      .then(([fetchedItems, fetchedSections, settingsData, uiTransData]) => {
        setItems(fetchedItems);
        setSections(fetchedSections);
        const langVal = typeof settingsData?.value === 'string' ? JSON.parse(settingsData.value) : settingsData?.value;
        setLanguages(Array.isArray(langVal) ? langVal : []);
        const uiVal = typeof uiTransData?.value === 'string' ? JSON.parse(uiTransData.value) : uiTransData?.value;
        if (uiVal && typeof uiVal === 'object' && !Array.isArray(uiVal)) {
          setUiTranslations(uiVal);
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langOpen]);

  // Load item/section translations when language changes
  useEffect(() => {
    if (activeLang === 'cs') { setTranslations([]); return; }
    fetchJson<Translation[]>(`/api/translations?lang=${activeLang}`, []).then(setTranslations);
  }, [activeLang]);

  function t(key: keyof UiStrings): string {
    if (activeLang !== 'cs') {
      const val = uiTranslations[activeLang]?.[key];
      if (val) return val;
    }
    return DEFAULT_STRINGS[key];
  }

  function getTranslation(entityType: string, entityId: number, field: string): string | null {
    if (activeLang === 'cs') return null;
    const tr = translations.find(
      (tr) => tr.entityType === entityType && tr.entityId === entityId && tr.field === field
    );
    return tr?.value ?? null;
  }

  function translateItem(item: Item) {
    return {
      ...item,
      name: getTranslation('item', item.id, 'name') ?? item.name,
      description: getTranslation('item', item.id, 'description') ?? item.description,
    };
  }

  function translateSection(section: Section) {
    return { ...section, name: getTranslation('section', section.id, 'name') ?? section.name };
  }

  function handleCheckout() {
    setBasketOpen(false);
    setClientSecret(null);
    setCheckoutOpen(true);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t('email_error'));
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
          lang: activeLang,
        }),
      });
      if (!res.ok) { setEmailError(t('connection_error')); return; }
      const data = await res.json();
      if (!data.clientSecret) { setEmailError(t('connection_error')); return; }
      setClientSecret(data.clientSecret);
      setCheckoutTotal(data.total);
    } catch {
      setEmailError(t('connection_error'));
    }
  }

  function handleSuccess() {
    clearBasket();
    setCheckoutOpen(false);
    setClientSecret(null);
    setEmail('');
    setSuccess(true);
  }

  function selectLang(code: string) {
    setActiveLang(code);
    setLangOpen(false);
  }

  const activeLangObj = languages.find((l) => l.code === activeLang) ?? null;

  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const translatedSections = sortedSections.map(translateSection);
  const groups: Array<{ sectionId: number | null; label: string | null; items: Item[] }> = [
    ...translatedSections.map((s) => ({
      sectionId: s.id,
      label: s.name,
      items: items.filter((i) => i.sectionId === s.id).map(translateItem),
    })),
    {
      sectionId: null,
      label: sortedSections.length > 0 ? t('other_section') : null,
      items: items.filter((i) => i.sectionId == null).map(translateItem),
    },
  ].filter((g) => g.items.length > 0);

  const priceDisplay = (item: Item) =>
    activeLangObj ? formatForeign(item.priceCzk, activeLangObj) : formatCZK(item.priceCzk);

  const currentStrings: Partial<UiStrings> = activeLang !== 'cs' ? (uiTranslations[activeLang] ?? {}) : {};

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo height={36} />
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            {languages.length > 0 && (
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center gap-1.5 font-body text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                  aria-label="Změnit jazyk"
                  aria-expanded={langOpen}
                >
                  <Globe size={16} />
                  <span className="hidden sm:inline uppercase text-xs">{activeLang}</span>
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-warm-white border border-border rounded-xl shadow-lg min-w-[140px] py-1">
                    <button
                      onClick={() => selectLang('cs')}
                      className={`w-full text-left px-3 py-2 font-body text-sm transition-colors ${
                        activeLang === 'cs' ? 'text-charcoal font-medium' : 'text-charcoal/60 hover:bg-cream'
                      }`}
                    >
                      Čeština (CZK)
                    </button>
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => selectLang(lang.code)}
                        className={`w-full text-left px-3 py-2 font-body text-sm transition-colors ${
                          activeLang === lang.code ? 'text-charcoal font-medium' : 'text-charcoal/60 hover:bg-cream'
                        }`}
                      >
                        {lang.name} ({lang.currency})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setBasketOpen(true)}
              className="flex items-center gap-2 font-body text-sm font-medium text-charcoal hover:text-brown transition-colors"
              aria-label={`${t('basket_btn')} (${count})`}
            >
              <div className="relative">
                <ShoppingBag size={22} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brown text-cream text-[10px] font-medium flex items-center justify-center">
                    {count}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{t('basket_btn')} {count > 0 ? `(${count})` : ''}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-charcoal mb-2">{t('page_title')}</h1>
          <p className="font-body text-charcoal/60">{t('page_subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <p className="font-body text-charcoal/60">{t('load_error')}</p>
            <Button variant="ghost" onClick={() => window.location.reload()}>{t('refresh_btn')}</Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="font-body text-charcoal/50 py-16 text-center">{t('no_items')}</p>
        ) : groups.length === 1 && groups[0].label === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups[0].items.map((item) => (
              <ItemCard key={item.id} item={item} priceDisplay={priceDisplay(item)} addLabel={t('add_btn')} />
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
                    <ItemCard key={item.id} item={item} priceDisplay={priceDisplay(item)} addLabel={t('add_btn')} />
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
        strings={currentStrings}
      />

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-charcoal">{t('payment_title')}</h2>

            {/* Order summary */}
            <div className="border border-border rounded-xl p-4">
              <p className="font-body text-sm text-charcoal/60 mb-3">{t('order_summary')}</p>
              {basketItems.map((i) => (
                <div key={i.id} className="flex justify-between font-body text-sm text-charcoal py-1">
                  <span>{i.name} × {i.quantity}</span>
                  <span>{formatCZK(i.priceCzk * i.quantity)}</span>
                </div>
              ))}
              {clientSecret && (
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-body font-medium text-charcoal">
                  <span>{t('total')}</span>
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
                  label={t('email_label')}
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  error={emailError}
                  autoFocus
                  autoComplete="email"
                />
                <Button type="submit" size="lg" className="w-full">
                  {t('continue_btn')}
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
              {t('back_to_basket')}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {success && <SuccessScreen onClose={() => setSuccess(false)} strings={currentStrings} />}
    </div>
  );
}

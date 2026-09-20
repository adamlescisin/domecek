'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { formatCZK } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ItemTable from '@/components/admin/ItemTable';
import ItemModal from '@/components/admin/ItemModal';

interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
  sectionId: number | null;
}

interface Section {
  id: number;
  name: string;
  sortOrder: number;
}

interface Order {
  id: number;
  stripePaymentId: string;
  stripeStatus: string;
  totalCzk: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
}

interface Language {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  rateFromCzk: number;
}

type Tab = 'polozky' | 'objednavky' | 'nastaveni';
type SalesPeriod = '7d' | '30d' | 'all';

const PERIODS: { key: SalesPeriod; label: string }[] = [
  { key: '7d', label: 'Posledních 7 dní' },
  { key: '30d', label: 'Poslední měsíc' },
  { key: 'all', label: 'Celkem' },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  succeeded:       { label: 'Zaplaceno',   cls: 'bg-green-100 text-green-800' },
  payment_failed:  { label: 'Selhalo',     cls: 'bg-red-100 text-red-800' },
  requires_action: { label: 'Čeká',        cls: 'bg-yellow-100 text-yellow-800' },
  canceled:        { label: 'Zrušeno',     cls: 'bg-gray-100 text-gray-600' },
};

function statusBadge(s: string) {
  const info = STATUS_LABELS[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
}

function computeRevenue(orders: Order[], period: SalesPeriod): number {
  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400_000 : period === '30d' ? now - 30 * 86400_000 : 0;
  return orders
    .filter((o) => o.stripeStatus === 'succeeded' && new Date(o.createdAt).getTime() >= cutoff)
    .reduce((sum, o) => sum + parseFloat(o.totalCzk), 0);
}

const emptyLang: Language = { code: '', name: '', currency: '', symbol: '', rateFromCzk: 1 };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('polozky');
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('7d');

  // Section editing
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<number | null>(null);

  // Language editing
  const [editLang, setEditLang] = useState<Language>(emptyLang);
  const [editLangIdx, setEditLangIdx] = useState<number | null>(null);
  const [showLangForm, setShowLangForm] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [deleteLangConfirm, setDeleteLangConfirm] = useState<number | null>(null);

  const redirectToLogin = useCallback(() => { router.push('/admin/login'); }, [router]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items?admin=true');
      if (res.status === 401) { redirectToLogin(); return; }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
  }, [redirectToLogin]);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch('/api/sections');
      if (res.status === 401) { redirectToLogin(); return; }
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch { setSections([]); }
  }, [redirectToLogin]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) { setOrders([]); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
  }, []);

  const fetchLanguages = useCallback(async () => {
    try {
      const res = await fetch('/api/settings?key=languages');
      if (!res.ok) return;
      const data = await res.json();
      setLanguages(Array.isArray(data.value) ? data.value : []);
    } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchItems(), fetchSections(), fetchOrders(), fetchLanguages()]);
    } finally {
      setLoading(false);
    }
  }, [fetchItems, fetchSections, fetchOrders, fetchLanguages]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  // ── Section handlers ──────────────────────────────────────────────────────

  async function handleAddSection() {
    const name = newSectionName.trim();
    if (!name) return;
    setAddingSection(true);
    try {
      await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sortOrder: sections.length }),
      });
      setNewSectionName('');
      await fetchSections();
    } finally { setAddingSection(false); }
  }

  async function handleUpdateSection(id: number) {
    const name = editingSectionName.trim();
    if (!name) return;
    await fetch(`/api/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setEditingSectionId(null);
    await fetchSections();
  }

  async function handleDeleteSection(id: number) {
    const sectionItems = items.filter((i) => i.sectionId === id);
    await Promise.all(
      sectionItems.map((item) =>
        fetch(`/api/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId: null }),
        })
      )
    );
    await fetch(`/api/sections/${id}`, { method: 'DELETE' });
    setDeleteSectionConfirm(null);
    await fetchAll();
  }

  // ── Language handlers ─────────────────────────────────────────────────────

  function openAddLang() {
    setEditLang(emptyLang);
    setEditLangIdx(null);
    setShowLangForm(true);
  }

  function openEditLang(idx: number) {
    setEditLang({ ...languages[idx] });
    setEditLangIdx(idx);
    setShowLangForm(true);
  }

  async function handleSaveLang() {
    if (!editLang.code.trim() || !editLang.name.trim() || !editLang.currency.trim()) return;
    setSavingLang(true);
    try {
      const updated = [...languages];
      if (editLangIdx === null) {
        updated.push(editLang);
      } else {
        updated[editLangIdx] = editLang;
      }
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'languages', value: updated }),
      });
      setLanguages(updated);
      setEditLangIdx(null);
      setEditLang(emptyLang);
      setShowLangForm(false);
    } finally { setSavingLang(false); }
  }

  async function handleDeleteLang(idx: number) {
    const updated = languages.filter((_, i) => i !== idx);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'languages', value: updated }),
    });
    setLanguages(updated);
    setDeleteLangConfirm(null);
  }

  const active = items.filter((i) => i.isActive === 1).length;
  const revenue = computeRevenue(orders, salesPeriod);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'polozky',    label: 'Položky' },
    { key: 'objednavky', label: 'Objednávky' },
    { key: 'nastaveni',  label: 'Nastavení' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-warm-white border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo height={32} />
            <h1 className="font-display text-lg font-semibold text-charcoal hidden sm:block">
              Správa
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`font-body text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    tab === t.key
                      ? 'bg-charcoal text-cream'
                      : 'text-charcoal/60 hover:text-charcoal hover:bg-cream'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-body text-sm text-charcoal/60 hover:text-charcoal transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Odhlásit</span>
            </button>
          </div>
        </div>
        {/* Mobile tab bar */}
        <div className="sm:hidden flex border-t border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 font-body text-xs py-2 transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-charcoal text-charcoal font-medium'
                  : 'text-charcoal/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Stats bar (always visible) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-warm-white rounded-xl border border-border p-4">
            <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Aktivní položky</p>
            <p className="font-display text-3xl text-charcoal mt-1">{active}</p>
          </div>
          <div className="bg-warm-white rounded-xl border border-border p-4">
            <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Objednávky celkem</p>
            <p className="font-display text-3xl text-charcoal mt-1">{orders.length}</p>
          </div>
          <div className="bg-warm-white rounded-xl border border-border p-4 col-span-2 sm:col-span-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Tržby</p>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSalesPeriod(p.key)}
                    className={`font-body text-[10px] px-2 py-1 transition-colors ${
                      salesPeriod === p.key
                        ? 'bg-charcoal text-cream'
                        : 'text-charcoal/50 hover:text-charcoal hover:bg-cream'
                    }`}
                  >
                    {p.key === '7d' ? '7 dní' : p.key === '30d' ? '30 dní' : 'Celkem'}
                  </button>
                ))}
              </div>
            </div>
            <p className="font-display text-3xl text-charcoal">
              {loading ? <span className="text-charcoal/30">—</span> : formatCZK(revenue)}
            </p>
            <p className="font-body text-xs text-charcoal/40">
              {PERIODS.find((p) => p.key === salesPeriod)?.label}
            </p>
          </div>
        </div>

        {/* ── TAB: Položky ── */}
        {tab === 'polozky' && (
          <>
            {/* Section management */}
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-semibold text-charcoal">Sekce</h2>
              <div className="bg-warm-white rounded-xl border border-border p-4 flex flex-col gap-3">
                {sections.length === 0 && (
                  <p className="font-body text-sm text-charcoal/40">Zatím žádné sekce.</p>
                )}
                {[...sections].sort((a, b) => a.sortOrder - b.sortOrder).map((section) => (
                  <div key={section.id} className="flex items-center gap-2">
                    {editingSectionId === section.id ? (
                      <>
                        <input
                          autoFocus
                          value={editingSectionName}
                          onChange={(e) => setEditingSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSection(section.id);
                            if (e.key === 'Escape') setEditingSectionId(null);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-cream font-body text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                        />
                        <button onClick={() => handleUpdateSection(section.id)} className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal"><Check size={16} /></button>
                        <button onClick={() => setEditingSectionId(null)} className="p-1.5 rounded-lg hover:bg-cream text-charcoal/50"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-body text-sm text-charcoal">{section.name}</span>
                        <span className="font-body text-xs text-charcoal/30">{items.filter((i) => i.sectionId === section.id).length} pol.</span>
                        <button onClick={() => { setEditingSectionId(section.id); setEditingSectionName(section.name); }} className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteSectionConfirm(section.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-error"><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); }}
                    placeholder="Název nové sekce…"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-cream font-body text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                  <Button size="sm" onClick={handleAddSection} loading={addingSection} disabled={!newSectionName.trim()}>
                    <Plus size={15} className="mr-1" />Přidat
                  </Button>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-charcoal">Položky</h2>
                <Button onClick={() => setAddOpen(true)} size="sm">
                  <Plus size={16} className="mr-1" />Přidat položku
                </Button>
              </div>
              {loading ? (
                <div className="bg-warm-white rounded-xl border border-border h-48 flex items-center justify-center">
                  <p className="font-body text-charcoal/40">Načítám…</p>
                </div>
              ) : (
                <ItemTable items={items} sections={sections} onRefresh={fetchAll} languages={languages} />
              )}
            </div>
          </>
        )}

        {/* ── TAB: Objednávky ── */}
        {tab === 'objednavky' && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold text-charcoal">Objednávky</h2>
            {loading ? (
              <div className="bg-warm-white rounded-xl border border-border h-48 flex items-center justify-center">
                <p className="font-body text-charcoal/40">Načítám…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-warm-white rounded-xl border border-border p-8 text-center">
                <p className="font-body text-charcoal/40">Zatím žádné objednávky.</p>
              </div>
            ) : (
              <div className="bg-warm-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body">
                    <thead>
                      <tr className="border-b border-border bg-cream/60">
                        <th className="text-left px-4 py-3 text-charcoal/50 font-medium">Datum</th>
                        <th className="text-left px-4 py-3 text-charcoal/50 font-medium">Zákazník</th>
                        <th className="text-left px-4 py-3 text-charcoal/50 font-medium">Status</th>
                        <th className="text-right px-4 py-3 text-charcoal/50 font-medium">Celkem</th>
                        <th className="text-left px-4 py-3 text-charcoal/50 font-medium">Stripe ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                          <td className="px-4 py-3 text-charcoal/60 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-charcoal font-medium">{order.customerName || '—'}</div>
                            <div className="text-charcoal/50 text-xs">{order.customerEmail || '—'}</div>
                          </td>
                          <td className="px-4 py-3">{statusBadge(order.stripeStatus)}</td>
                          <td className="px-4 py-3 text-right text-charcoal font-medium whitespace-nowrap">
                            {formatCZK(parseFloat(order.totalCzk))}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://dashboard.stripe.com/payments/${order.stripePaymentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-charcoal/40 hover:text-charcoal transition-colors font-mono"
                            >
                              {order.stripePaymentId.slice(0, 18)}…
                              <ExternalLink size={11} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Nastavení ── */}
        {tab === 'nastaveni' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold text-charcoal">Jazyky a měny</h2>
              <p className="font-body text-sm text-charcoal/50">
                Přidejte cizí jazyky, ve kterých se zobrazí přeložené popisky a ceny. Kurz zadávejte jako 1 Kč = X jednotek cizí měny.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {languages.length === 0 && !showLangForm && (
                <div className="bg-warm-white rounded-xl border border-border p-6 text-center">
                  <p className="font-body text-sm text-charcoal/40">Zatím žádné cizí jazyky.</p>
                </div>
              )}

              {languages.map((lang, idx) => (
                <div key={lang.code} className="bg-warm-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="flex-1 flex flex-wrap gap-4">
                    <div>
                      <p className="font-body text-xs text-charcoal/40">Kód</p>
                      <p className="font-body text-sm font-medium text-charcoal">{lang.code}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-charcoal/40">Jazyk</p>
                      <p className="font-body text-sm text-charcoal">{lang.name}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-charcoal/40">Měna</p>
                      <p className="font-body text-sm text-charcoal">{lang.currency} ({lang.symbol})</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-charcoal/40">1 Kč =</p>
                      <p className="font-body text-sm text-charcoal">{lang.rateFromCzk} {lang.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditLang(idx)} className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteLangConfirm(idx)} className="p-1.5 rounded-lg hover:bg-error/10 text-error"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}

              {/* Add / edit language form */}
              {showLangForm ? (
                <div className="bg-warm-white rounded-xl border border-charcoal/20 p-5 flex flex-col gap-4">
                  <h3 className="font-body text-sm font-semibold text-charcoal">
                    {editLangIdx !== null ? 'Upravit jazyk' : 'Přidat jazyk'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="lang-code"
                      label="Kód jazyka (např. en, de)"
                      value={editLang.code}
                      onChange={(e) => setEditLang((l) => ({ ...l, code: e.target.value.toLowerCase() }))}
                      placeholder="en"
                      disabled={editLangIdx !== null}
                    />
                    <Input
                      id="lang-name"
                      label="Název jazyka"
                      value={editLang.name}
                      onChange={(e) => setEditLang((l) => ({ ...l, name: e.target.value }))}
                      placeholder="English"
                    />
                    <Input
                      id="lang-currency"
                      label="Kód měny (ISO 4217)"
                      value={editLang.currency}
                      onChange={(e) => setEditLang((l) => ({ ...l, currency: e.target.value.toUpperCase() }))}
                      placeholder="EUR"
                    />
                    <Input
                      id="lang-symbol"
                      label="Symbol měny"
                      value={editLang.symbol}
                      onChange={(e) => setEditLang((l) => ({ ...l, symbol: e.target.value }))}
                      placeholder="€"
                    />
                    <Input
                      id="lang-rate"
                      label="1 Kč ="
                      type="number"
                      min="0.000001"
                      step="0.000001"
                      value={String(editLang.rateFromCzk)}
                      onChange={(e) => setEditLang((l) => ({ ...l, rateFromCzk: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.04"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => { setEditLang(emptyLang); setEditLangIdx(null); setShowLangForm(false); }}>Zrušit</Button>
                    <Button onClick={handleSaveLang} loading={savingLang}
                      disabled={!editLang.code.trim() || !editLang.name.trim() || !editLang.currency.trim()}>
                      Uložit jazyk
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openAddLang}
                  className="flex items-center gap-2 font-body text-sm text-charcoal/60 hover:text-charcoal transition-colors py-2"
                >
                  <Plus size={16} />Přidat jazyk
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {addOpen && (
        <ItemModal
          sections={sections}
          languages={languages}
          onClose={() => setAddOpen(false)}
          onSave={() => { setAddOpen(false); fetchAll(); }}
        />
      )}

      {deleteSectionConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <h3 className="font-display text-lg font-semibold text-charcoal">Smazat sekci?</h3>
            <p className="font-body text-sm text-charcoal/60">Položky budou přesunuty do &ldquo;Bez sekce&rdquo;. Tato akce je nevratná.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteSectionConfirm(null)} className="font-body text-sm px-4 py-2 rounded-xl border border-border hover:bg-cream transition-colors">Zrušit</button>
              <button onClick={() => handleDeleteSection(deleteSectionConfirm)} className="font-body text-sm px-4 py-2 rounded-xl bg-error text-white hover:bg-red-700 transition-colors">Smazat sekci</button>
            </div>
          </div>
        </div>
      )}

      {deleteLangConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <h3 className="font-display text-lg font-semibold text-charcoal">Smazat jazyk?</h3>
            <p className="font-body text-sm text-charcoal/60">Odstraní konfiguraci jazyka {languages[deleteLangConfirm]?.name}. Překlady položek zůstanou v databázi.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteLangConfirm(null)} className="font-body text-sm px-4 py-2 rounded-xl border border-border hover:bg-cream transition-colors">Zrušit</button>
              <button onClick={() => handleDeleteLang(deleteLangConfirm)} className="font-body text-sm px-4 py-2 rounded-xl bg-error text-white hover:bg-red-700 transition-colors">Smazat jazyk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

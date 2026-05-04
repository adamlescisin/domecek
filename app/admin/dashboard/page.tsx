'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Pencil, Trash2, Check, X } from 'lucide-react';
import { formatCZK } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
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
  stripeStatus: string;
  totalCzk: string;
  createdAt: string;
}

type SalesPeriod = '7d' | '30d' | 'all';

const PERIODS: { key: SalesPeriod; label: string }[] = [
  { key: '7d', label: 'Posledních 7 dní' },
  { key: '30d', label: 'Poslední měsíc' },
  { key: 'all', label: 'Celkem' },
];

function computeRevenue(orders: Order[], period: SalesPeriod): number {
  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400_000 : period === '30d' ? now - 30 * 86400_000 : 0;
  return orders
    .filter((o) => o.stripeStatus === 'succeeded' && new Date(o.createdAt).getTime() >= cutoff)
    .reduce((sum, o) => sum + parseFloat(o.totalCzk), 0);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('7d');

  // Section management state
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items?admin=true');
    setItems(await res.json());
  }, []);

  const fetchSections = useCallback(async () => {
    const res = await fetch('/api/sections');
    setSections(await res.json());
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    setOrders(await res.json());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchItems(), fetchSections(), fetchOrders()]);
    } finally {
      setLoading(false);
    }
  }, [fetchItems, fetchSections, fetchOrders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

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
    } finally {
      setAddingSection(false);
    }
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
    // Move items in this section to null
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

  const active = items.filter((i) => i.isActive === 1).length;
  const revenue = computeRevenue(orders, salesPeriod);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-warm-white border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo height={32} />
            <h1 className="font-display text-lg font-semibold text-charcoal hidden sm:block">
              Správa položek
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-body text-sm text-charcoal/60 hover:text-charcoal transition-colors"
          >
            <LogOut size={16} />
            Odhlásit
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-warm-white rounded-xl border border-border p-4">
            <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Aktivní položky</p>
            <p className="font-display text-3xl text-charcoal mt-1">{active}</p>
          </div>
          <div className="bg-warm-white rounded-xl border border-border p-4">
            <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Celkem položek</p>
            <p className="font-display text-3xl text-charcoal mt-1">{items.length}</p>
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

        {/* Section management */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold text-charcoal">Sekce</h2>
          <div className="bg-warm-white rounded-xl border border-border p-4 flex flex-col gap-3">
            {sections.length === 0 && (
              <p className="font-body text-sm text-charcoal/40">
                Zatím žádné sekce. Přidejte první sekci níže.
              </p>
            )}
            {sections.sort((a, b) => a.sortOrder - b.sortOrder).map((section) => (
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
                    <button
                      onClick={() => handleUpdateSection(section.id)}
                      className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="p-1.5 rounded-lg hover:bg-cream text-charcoal/50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-body text-sm text-charcoal">{section.name}</span>
                    <span className="font-body text-xs text-charcoal/30">
                      {items.filter((i) => i.sectionId === section.id).length} pol.
                    </span>
                    <button
                      onClick={() => { setEditingSectionId(section.id); setEditingSectionName(section.name); }}
                      className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal transition-colors"
                      aria-label="Přejmenovat"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteSectionConfirm(section.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                      aria-label="Smazat sekci"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add new section */}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); }}
                placeholder="Název nové sekce…"
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-cream font-body text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
              <Button
                size="sm"
                onClick={handleAddSection}
                loading={addingSection}
                disabled={!newSectionName.trim()}
              >
                <Plus size={15} className="mr-1" />
                Přidat
              </Button>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-charcoal">Položky</h2>
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus size={16} className="mr-1" />
              Přidat položku
            </Button>
          </div>

          {loading ? (
            <div className="bg-warm-white rounded-xl border border-border h-48 flex items-center justify-center">
              <p className="font-body text-charcoal/40">Načítám…</p>
            </div>
          ) : (
            <ItemTable items={items} sections={sections} onRefresh={fetchAll} />
          )}
        </div>
      </main>

      {addOpen && (
        <ItemModal
          sections={sections}
          onClose={() => setAddOpen(false)}
          onSave={() => { setAddOpen(false); fetchAll(); }}
        />
      )}

      {/* Confirm delete section */}
      {deleteSectionConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <h3 className="font-display text-lg font-semibold text-charcoal">Smazat sekci?</h3>
            <p className="font-body text-sm text-charcoal/60">
              Položky v této sekci budou přesunuty do &ldquo;Bez sekce&rdquo;. Tato akce je nevratná.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteSectionConfirm(null)}
                className="font-body text-sm px-4 py-2 rounded-xl border border-border hover:bg-cream transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={() => handleDeleteSection(deleteSectionConfirm)}
                className="font-body text-sm px-4 py-2 rounded-xl bg-error text-white hover:bg-red-700 transition-colors"
              >
                Smazat sekci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

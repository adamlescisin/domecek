'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut } from 'lucide-react';
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
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items?admin=true');
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const active = items.filter((i) => i.isActive === 1).length;

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
          <div className="bg-warm-white rounded-xl border border-border p-4 col-span-2 sm:col-span-1">
            <p className="font-body text-xs text-charcoal/50 uppercase tracking-wide">Tržby dnes</p>
            <p className="font-display text-3xl text-charcoal/30 mt-1">—</p>
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
            <ItemTable items={items} onRefresh={fetchItems} />
          )}
        </div>
      </main>

      {addOpen && (
        <ItemModal
          onClose={() => setAddOpen(false)}
          onSave={() => { setAddOpen(false); fetchItems(); }}
        />
      )}
    </div>
  );
}

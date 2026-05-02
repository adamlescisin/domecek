'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import ItemModal from './ItemModal';
import { formatCZK } from '@/lib/utils';

interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
}

interface ItemTableProps {
  items: Item[];
  onRefresh: () => void;
}

export default function ItemTable({ items, onRefresh }: ItemTableProps) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggle(item: Item) {
    setTogglingId(item.id);
    await fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: item.isActive !== 1 }),
    });
    setTogglingId(null);
    onRefresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
    onRefresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-cream border-b border-border">
              <th className="font-body text-xs font-medium text-charcoal/60 text-left px-4 py-3">Název</th>
              <th className="font-body text-xs font-medium text-charcoal/60 text-right px-4 py-3">Cena</th>
              <th className="font-body text-xs font-medium text-charcoal/60 text-center px-4 py-3">Aktivní</th>
              <th className="font-body text-xs font-medium text-charcoal/60 text-center px-4 py-3">Akce</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-body text-sm font-medium text-charcoal">{item.name}</p>
                  {item.description && (
                    <p className="font-body text-xs text-charcoal/50 mt-0.5 truncate max-w-xs">{item.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-display text-sm text-charcoal">{formatCZK(item.priceCzk)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleSwitch
                    checked={item.isActive === 1}
                    onChange={() => handleToggle(item)}
                    disabled={togglingId === item.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditing(item)}
                      className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal transition-colors"
                      aria-label="Upravit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                      aria-label="Smazat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={() => { setEditing(null); onRefresh(); }}
        />
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
          <div className="bg-warm-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <h3 className="font-display text-lg font-semibold text-charcoal">Opravdu smazat?</h3>
            <p className="font-body text-sm text-charcoal/60">Tato akce je nevratná.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="font-body text-sm px-4 py-2 rounded-xl border border-border hover:bg-cream transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="font-body text-sm px-4 py-2 rounded-xl bg-error text-white hover:bg-red-700 transition-colors"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

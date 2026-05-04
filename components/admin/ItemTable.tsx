'use client';

import { useState } from 'react';
import { Pencil, Trash2, FolderInput } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import ItemModal from './ItemModal';
import { formatCZK } from '@/lib/utils';

interface Section {
  id: number;
  name: string;
  sortOrder: number;
}

interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
  sectionId: number | null;
}

interface ItemTableProps {
  items: Item[];
  sections: Section[];
  onRefresh: () => void;
}

export default function ItemTable({ items, sections, onRefresh }: ItemTableProps) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

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

  async function handleMoveToSection(item: Item, sectionId: number | null) {
    setMovingId(item.id);
    await fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId }),
    });
    setMovingId(null);
    onRefresh();
  }

  // Group items: sections in sortOrder, then unsectioned at end
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: Array<{ sectionId: number | null; label: string; items: Item[] }> = [
    ...sortedSections.map((s) => ({
      sectionId: s.id,
      label: s.name,
      items: items.filter((i) => i.sectionId === s.id).sort((a, b) => a.sortOrder - b.sortOrder),
    })),
    {
      sectionId: null,
      label: 'Bez sekce',
      items: items.filter((i) => i.sectionId == null).sort((a, b) => a.sortOrder - b.sortOrder),
    },
  ].filter((g) => g.items.length > 0);

  function renderRow(item: Item) {
    return (
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
          <div className="flex items-center justify-center gap-1">
            {/* Move to section dropdown */}
            {sections.length > 0 && (
              <div className="relative group">
                <button
                  className="p-1.5 rounded-lg hover:bg-sand/20 text-charcoal/50 hover:text-charcoal transition-colors"
                  aria-label="Přesunout do sekce"
                  title="Přesunout do sekce"
                  disabled={movingId === item.id}
                >
                  <FolderInput size={16} />
                </button>
                <div className="absolute right-0 top-full mt-1 z-10 hidden group-focus-within:block group-hover:block bg-warm-white border border-border rounded-xl shadow-lg min-w-[160px] py-1">
                  {item.sectionId !== null && (
                    <button
                      onClick={() => handleMoveToSection(item, null)}
                      className="w-full text-left px-3 py-2 font-body text-sm text-charcoal/60 hover:bg-cream transition-colors"
                    >
                      — Bez sekce —
                    </button>
                  )}
                  {sortedSections
                    .filter((s) => s.id !== item.sectionId)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleMoveToSection(item, s.id)}
                        className="w-full text-left px-3 py-2 font-body text-sm text-charcoal hover:bg-cream transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
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
    );
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
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-charcoal/40">
                  Žádné položky
                </td>
              </tr>
            ) : groups.length === 1 && groups[0].sectionId === null ? (
              // No sections defined – flat list
              groups[0].items.map(renderRow)
            ) : (
              groups.map((group) => (
                <>
                  <tr key={`section-${group.sectionId}`} className="bg-cream/70 border-b border-border">
                    <td
                      colSpan={4}
                      className="px-4 py-2 font-body text-xs font-semibold text-charcoal/50 uppercase tracking-widest"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.items.map(renderRow)}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ItemModal
          item={editing}
          sections={sections}
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

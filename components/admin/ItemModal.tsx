'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ToggleSwitch from './ToggleSwitch';

interface ItemFormData {
  name: string;
  description: string;
  priceCzk: string;
  isActive: boolean;
  sortOrder: string;
}

interface Item {
  id?: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
}

interface ItemModalProps {
  item?: Item | null;
  onClose: () => void;
  onSave: () => void;
}

const empty: ItemFormData = { name: '', description: '', priceCzk: '', isActive: true, sortOrder: '0' };

export default function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState<ItemFormData>(empty);
  const [errors, setErrors] = useState<Partial<ItemFormData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description ?? '',
        priceCzk: item.priceCzk,
        isActive: item.isActive === 1,
        sortOrder: String(item.sortOrder),
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [item]);

  function validate(): boolean {
    const e: Partial<ItemFormData> = {};
    if (!form.name.trim()) e.name = 'Název je povinný';
    if (!form.priceCzk || Number(form.priceCzk) <= 0) e.priceCzk = 'Cena musí být větší než 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = item?.id ? `/api/items/${item.id}` : '/api/items';
      const method = item?.id ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          priceCzk: parseFloat(form.priceCzk),
          isActive: form.isActive,
          sortOrder: parseInt(form.sortOrder) || 0,
        }),
      });
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {item?.id ? 'Upravit položku' : 'Přidat položku'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="name"
            label="Název *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
            placeholder="Snídaně v košíku"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desc" className="font-body text-sm font-medium text-charcoal">Popis</label>
            <textarea
              id="desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="px-3 py-2.5 rounded-lg border border-border bg-warm-white font-body text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition-colors resize-none"
              placeholder="Volitelný popis..."
            />
          </div>
          <Input
            id="price"
            label="Cena v Kč *"
            type="number"
            min="1"
            step="0.01"
            value={form.priceCzk}
            onChange={(e) => setForm((f) => ({ ...f, priceCzk: e.target.value }))}
            error={errors.priceCzk}
            placeholder="250"
          />
          <Input
            id="sortOrder"
            label="Pořadí"
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            placeholder="0"
          />
          <div className="flex items-center justify-between">
            <span className="font-body text-sm font-medium text-charcoal">Aktivní</span>
            <ToggleSwitch
              checked={form.isActive}
              onChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Zrušit</Button>
          <Button onClick={handleSave} loading={saving}>Uložit</Button>
        </div>
      </div>
    </div>
  );
}

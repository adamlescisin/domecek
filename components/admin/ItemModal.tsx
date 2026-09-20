'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ToggleSwitch from './ToggleSwitch';

interface Section {
  id: number;
  name: string;
}

interface Language {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  rateFromCzk: number;
}

interface ItemFormData {
  name: string;
  description: string;
  priceCzk: string;
  isActive: boolean;
  sortOrder: string;
  sectionId: string;
}

interface Item {
  id?: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
  sectionId: number | null;
}

interface ItemModalProps {
  item?: Item | null;
  sections: Section[];
  languages?: Language[];
  onClose: () => void;
  onSave: () => void;
}

const empty: ItemFormData = {
  name: '',
  description: '',
  priceCzk: '',
  isActive: true,
  sortOrder: '0',
  sectionId: '',
};

type Translations = Record<string, Record<string, string>>;

export default function ItemModal({ item, sections, languages = [], onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState<ItemFormData>(empty);
  const [errors, setErrors] = useState<Partial<ItemFormData>>({});
  const [saving, setSaving] = useState(false);
  const [translations, setTranslations] = useState<Translations>({});
  const [activeTab, setActiveTab] = useState<'cs' | string>('cs');

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description ?? '',
        priceCzk: item.priceCzk,
        isActive: item.isActive === 1,
        sortOrder: String(item.sortOrder),
        sectionId: item.sectionId != null ? String(item.sectionId) : '',
      });
      // Load existing translations for this item
      if (item.id && languages.length > 0) {
        Promise.all(
          languages.map((lang) =>
            fetch(`/api/translations?lang=${lang.code}`)
              .then((r) => r.json())
              .then((rows: Array<{ entityType: string; entityId: number; langCode: string; field: string; value: string }>) => {
                const itemRows = rows.filter((r) => r.entityType === 'item' && r.entityId === item.id);
                return { code: lang.code, rows: itemRows };
              })
              .catch(() => ({ code: lang.code, rows: [] }))
          )
        ).then((results) => {
          const t: Translations = {};
          for (const { code, rows } of results) {
            t[code] = {};
            for (const row of rows) {
              t[code][row.field] = row.value;
            }
          }
          setTranslations(t);
        });
      }
    } else {
      setForm(empty);
      setTranslations({});
    }
    setErrors({});
    setActiveTab('cs');
  }, [item, languages]);

  function validate(): boolean {
    const e: Partial<ItemFormData> = {};
    if (!form.name.trim()) e.name = 'Název je povinný';
    if (!form.priceCzk || Number(form.priceCzk) <= 0) e.priceCzk = 'Cena musí být větší než 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function setTranslationField(langCode: string, field: string, value: string) {
    setTranslations((t) => ({
      ...t,
      [langCode]: { ...(t[langCode] ?? {}), [field]: value },
    }));
  }

  async function saveTranslations(itemId: number) {
    const promises: Promise<unknown>[] = [];
    for (const lang of languages) {
      const t = translations[lang.code] ?? {};
      for (const field of ['name', 'description']) {
        if (t[field] !== undefined) {
          promises.push(
            fetch('/api/translations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entityType: 'item',
                entityId: itemId,
                langCode: lang.code,
                field,
                value: t[field],
              }),
            })
          );
        }
      }
    }
    await Promise.all(promises);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = item?.id ? `/api/items/${item.id}` : '/api/items';
      const method = item?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          priceCzk: parseFloat(form.priceCzk),
          isActive: form.isActive,
          sortOrder: parseInt(form.sortOrder) || 0,
          sectionId: form.sectionId ? parseInt(form.sectionId) : null,
        }),
      });
      const savedItem = await res.json();
      const itemId = item?.id ?? savedItem?.id;
      if (itemId && languages.length > 0) {
        await saveTranslations(itemId);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  }

  const tabs = ['cs', ...languages.map((l) => l.code)];
  const langByCode = Object.fromEntries(languages.map((l) => [l.code, l]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {item?.id ? 'Upravit položku' : 'Přidat položku'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Language tabs */}
        {languages.length > 0 && (
          <div className="flex gap-1 border-b border-border pb-2">
            {tabs.map((code) => (
              <button
                key={code}
                onClick={() => setActiveTab(code)}
                className={`font-body text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === code
                    ? 'bg-charcoal text-cream'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-cream'
                }`}
              >
                {code === 'cs' ? 'Čeština' : (langByCode[code]?.name ?? code)}
              </button>
            ))}
          </div>
        )}

        {/* Czech fields */}
        {activeTab === 'cs' && (
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="section" className="font-body text-sm font-medium text-charcoal">Sekce</label>
              <select
                id="section"
                value={form.sectionId}
                onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                className="px-3 py-2.5 rounded-lg border border-border bg-warm-white font-body text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition-colors"
              >
                <option value="">— Bez sekce —</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
        )}

        {/* Foreign language translation fields */}
        {activeTab !== 'cs' && (
          <div className="flex flex-col gap-4">
            <p className="font-body text-xs text-charcoal/40">
              Překlad do jazyka: <strong>{langByCode[activeTab]?.name ?? activeTab}</strong>. Nechte prázdné pro použití výchozího (českého) textu.
            </p>
            <Input
              id={`trans-name-${activeTab}`}
              label="Název"
              value={translations[activeTab]?.name ?? ''}
              onChange={(e) => setTranslationField(activeTab, 'name', e.target.value)}
              placeholder={form.name}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`trans-desc-${activeTab}`} className="font-body text-sm font-medium text-charcoal">Popis</label>
              <textarea
                id={`trans-desc-${activeTab}`}
                rows={3}
                value={translations[activeTab]?.description ?? ''}
                onChange={(e) => setTranslationField(activeTab, 'description', e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-border bg-warm-white font-body text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition-colors resize-none"
                placeholder={form.description || 'Volitelný přeložený popis...'}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Zrušit</Button>
          <Button onClick={handleSave} loading={saving}>Uložit</Button>
        </div>
      </div>
    </div>
  );
}

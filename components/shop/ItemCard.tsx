'use client';

import { useBasket } from '@/lib/basket-context';
import { formatCZK } from '@/lib/utils';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
}

export default function ItemCard({ item }: { item: Item }) {
  const { items, addItem, updateQuantity } = useBasket();
  const basketItem = items.find((i) => i.id === item.id);
  const qty = basketItem?.quantity ?? 0;

  return (
    <div className="bg-warm-white rounded-xl shadow-sm border border-border p-5 flex flex-col gap-3">
      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold text-charcoal leading-tight">
          {item.name}
        </h3>
        {item.description && (
          <p className="font-body text-sm text-charcoal/60 mt-1 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-2xl text-charcoal">
          {formatCZK(item.priceCzk)}
        </span>
        {qty === 0 ? (
          <button
            onClick={() => addItem({ id: item.id, name: item.name, priceCzk: parseFloat(item.priceCzk) })}
            className="flex items-center gap-2 bg-charcoal text-cream font-body text-sm font-medium px-4 py-2 rounded-xl hover:bg-brown transition-colors"
          >
            <Plus size={16} />
            Přidat
          </button>
        ) : (
          <div className="flex items-center gap-2 border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, qty - 1)}
              className="p-2 hover:bg-cream transition-colors text-charcoal"
              aria-label="Ubrat"
            >
              <Minus size={16} />
            </button>
            <span className="font-body text-sm font-medium w-7 text-center text-charcoal">{qty}</span>
            <button
              onClick={() => updateQuantity(item.id, qty + 1)}
              className="p-2 hover:bg-cream transition-colors text-charcoal"
              aria-label="Přidat"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

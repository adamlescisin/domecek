'use client';

import { useBasket } from '@/lib/basket-context';
import { formatCZK } from '@/lib/utils';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BasketDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function BasketDrawer({ open, onClose, onCheckout }: BasketDrawerProps) {
  const { items, updateQuantity, total } = useBasket();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-charcoal/30 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-warm-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-charcoal">Košík</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-cream transition-colors text-charcoal"
            aria-label="Zavřít"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} className="text-border" />
              <p className="font-body text-charcoal/50">Košík je prázdný</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-charcoal truncate">{item.name}</p>
                    <p className="font-body text-xs text-charcoal/50">
                      {formatCZK(item.priceCzk)} × {item.quantity} = {formatCZK(item.priceCzk * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-cream transition-colors"
                      aria-label="Ubrat"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-cream transition-colors"
                      aria-label="Přidat"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-border flex flex-col gap-3">
            <div className="flex justify-between font-body text-base font-medium text-charcoal">
              <span>Celkem</span>
              <span>{formatCZK(total)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={onCheckout}>
              Zaplatit {formatCZK(total)}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import Button from '@/components/ui/Button';
import { DEFAULT_STRINGS, type UiStrings } from '@/lib/ui-text';

interface SuccessScreenProps {
  onClose: () => void;
  strings?: Partial<UiStrings>;
}

export default function SuccessScreen({ onClose, strings }: SuccessScreenProps) {
  const s = { ...DEFAULT_STRINGS, ...strings };
  return (
    <div className="fixed inset-0 bg-cream z-50 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-sage/15 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-sage"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" />
          <path
            d="M14 27l8 8 16-16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[dash_0.6s_ease-in-out_forwards]"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'dash 0.6s ease-in-out 0.2s forwards' }}
          />
        </svg>
        <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
      </div>
      <div>
        <h2 className="font-display text-3xl font-semibold text-charcoal mb-2">
          {s.success_title}
        </h2>
        <p className="font-body text-charcoal/60">{s.success_subtitle}</p>
      </div>
      <Button onClick={onClose} variant="ghost" size="lg">
        {s.back_to_shop}
      </Button>
    </div>
  );
}

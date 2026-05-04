'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Nesprávné heslo');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Logo height={48} />
        <div className="w-full bg-warm-white rounded-2xl shadow-sm border border-border p-8 flex flex-col gap-6">
          <h1 className="font-display text-2xl font-semibold text-charcoal text-center">
            Přihlášení správce
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="password"
              type="password"
              label="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              placeholder="••••••••"
              autoFocus
              autoComplete="current-password"
            />
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Přihlásit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

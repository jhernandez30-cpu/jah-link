import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadPayPalSdk } from '../../lib/loadPayPalSdk';

type PayPalHostedButtonProps = {
  hostedButtonId: string;
  plan: 'pro' | 'business';
  className?: string;
};

function sanitizeContainerId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export default function PayPalHostedButton({
  hostedButtonId,
  plan,
  className = '',
}: PayPalHostedButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const containerId = useMemo(() => {
    if (plan === 'business') return 'paypal-container-3DP34KZHDUYFG';
    return `paypal-container-${sanitizeContainerId(hostedButtonId)}`;
  }, [hostedButtonId, plan]);

  useEffect(() => {
    let cancelled = false;
    renderedRef.current = false;
    setLoading(true);
    setLoadError(false);
    if (containerRef.current) containerRef.current.innerHTML = '';

    const renderButton = async () => {
      try {
        const paypal = await loadPayPalSdk();
        if (cancelled || renderedRef.current || !containerRef.current) return;

        containerRef.current.innerHTML = '';
        await paypal.HostedButtons({ hostedButtonId }).render(`#${containerId}`);

        if (!cancelled) {
          renderedRef.current = true;
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setLoadError(true);
        }
      }
    };

    void renderButton();

    return () => {
      cancelled = true;
      renderedRef.current = false;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [containerId, hostedButtonId]);

  return (
    <div className={className}>
      {loading && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
          Cargando PayPal...
        </p>
      )}
      {loadError && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          No se pudo cargar PayPal. Inténtalo nuevamente.
        </p>
      )}
      <div
        id={containerId}
        ref={containerRef}
        className="min-h-[48px] rounded-xl bg-black"
      />
    </div>
  );
}

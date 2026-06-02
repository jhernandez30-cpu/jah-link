import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadPayPalSdk } from '../../lib/loadPayPalSdk';
import type { PaidPlanId } from '../../lib/payments';
import { getSession } from '../../lib/storage';

type CaptureResult = {
  success: boolean;
  plan: PaidPlanId;
  userId: string;
  captureID?: string | null;
};

type PayPalCheckoutButtonProps = {
  plan: PaidPlanId;
  userId?: string;
  onApproved: (result: CaptureResult) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (message: string) => void;
  className?: string;
};

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const session = await getSession();
  const token = session?.access_token;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || 'No se pudo procesar el pago.');
  }
  return payload as T;
}

export default function PayPalCheckoutButton({
  plan,
  userId,
  onApproved,
  onCancel,
  onError,
  className = '',
}: PayPalCheckoutButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonInstanceRef = useRef<{ close?: () => Promise<void> | void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState('');

  const containerId = useMemo(() => `paypal-buttons-${plan}`, [plan]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLocalError('');

    const renderButtons = async () => {
      if (!userId) {
        setLoading(false);
        setLocalError('No se pudo identificar tu usuario para crear el pago.');
        return;
      }

      try {
        if (buttonInstanceRef.current?.close) {
          await buttonInstanceRef.current.close();
        }
        if (containerRef.current) containerRef.current.innerHTML = '';

        const paypal = await loadPayPalSdk();
        if (cancelled || !containerRef.current) return;

        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: async () => {
            const created = await postJson<{ orderID: string }>('/api/paypal/create-order', {
              plan,
              userId,
            });
            return created.orderID;
          },
          onApprove: async (data) => {
            const orderID = data.orderID;
            if (!orderID) throw new Error('PayPal no devolvió orderID.');
            const captured = await postJson<CaptureResult>('/api/paypal/capture-order', { orderID });
            await onApproved(captured);
          },
          onCancel: () => {
            onCancel?.();
          },
          onError: (error) => {
            const message = error instanceof Error
              ? error.message
              : 'PayPal no pudo completar el pago.';
            setLocalError(message);
            onError?.(message);
          },
        });

        buttonInstanceRef.current = buttons;
        await buttons.render(`#${containerId}`);
        if (!cancelled) setLoading(false);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : 'No se pudo cargar PayPal. Inténtalo nuevamente.';
          setLocalError(message);
          onError?.(message);
          setLoading(false);
        }
      }
    };

    void renderButtons();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (buttonInstanceRef.current?.close) void buttonInstanceRef.current.close();
      buttonInstanceRef.current = null;
    };
  }, [containerId, onApproved, onCancel, onError, plan, userId]);

  return (
    <div className={className}>
      {loading && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
          Cargando PayPal...
        </p>
      )}
      {localError && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {localError}
        </p>
      )}
      <div id={containerId} ref={containerRef} className="min-h-[48px] rounded-xl bg-black" />
    </div>
  );
}

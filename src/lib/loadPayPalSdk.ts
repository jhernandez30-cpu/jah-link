import { PAYPAL_SDK_URL } from './paypal';

const PAYPAL_SCRIPT_ID = 'paypal-sdk-hosted-buttons';

let sdkPromise: Promise<NonNullable<Window['paypal']>> | null = null;

function getLoadedPayPal(): NonNullable<Window['paypal']> | null {
  return window.paypal?.HostedButtons ? window.paypal : null;
}

export function loadPayPalSdk(): Promise<NonNullable<Window['paypal']>> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('PayPal solo puede cargarse en el navegador.'));
  }

  const loaded = getLoadedPayPal();
  if (loaded) return Promise.resolve(loaded);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const resolveIfReady = () => {
      const paypal = getLoadedPayPal();
      if (paypal) {
        resolve(paypal);
        return;
      }
      sdkPromise = null;
      reject(new Error('El SDK de PayPal no expuso HostedButtons.'));
    };

    const rejectLoad = () => {
      sdkPromise = null;
      reject(new Error('No se pudo cargar el SDK de PayPal.'));
    };

    const existing = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', resolveIfReady, { once: true });
      existing.addEventListener('error', rejectLoad, { once: true });
      if (existing.dataset.loaded === 'true') window.setTimeout(resolveIfReady, 0);
      return;
    }

    const script = document.createElement('script');
    script.id = PAYPAL_SCRIPT_ID;
    script.src = PAYPAL_SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolveIfReady();
    };
    script.onerror = rejectLoad;
    document.head.appendChild(script);
  });

  return sdkPromise;
}

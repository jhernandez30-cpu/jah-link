import { Link, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

const LEGAL_PAGES: Record<string, { title: string; body: string[] }> = {
  'privacy-policy': {
    title: 'Política de privacidad',
    body: [
      'JAH Link procesa datos de cuenta, enlaces y analítica para prestar el servicio y proteger la plataforma.',
      'Cuando un usuario solicita un plan Pro o Business, podemos guardar datos de transacción como plan solicitado, provider_order_id, provider_capture_id, estado del pago, fecha, proveedor y URL de pago.',
      'PayPal procesa la información de pago conforme a sus propias políticas. JAH Link no almacena datos completos de tarjetas.',
    ],
  },
  'cookie-policy': {
    title: 'Política de cookies',
    body: [
      'JAH Link puede usar almacenamiento local y cookies técnicas necesarias para mantener sesión y preferencias.',
    ],
  },
  'terms-of-service': {
    title: 'Términos de servicio',
    body: [
      'El uso de JAH Link requiere respetar las leyes aplicables, derechos de terceros y reglas de seguridad.',
      'Los pagos de planes Pro y Business se procesan mediante PayPal. JAH Link no almacena datos completos de tarjetas.',
      'Los planes Pro y Business se activan automáticamente después de confirmación real del pago por PayPal y backend seguro.',
      'Si PayPal deniega, revierte o reembolsa un pago, JAH Link puede suspender, revisar o ajustar el plan asociado.',
      'Hacer clic en un enlace de PayPal, iniciar un pago o volver desde PayPal no activa funciones pagadas por sí solo.',
    ],
  },
  'acceptable-use-policy': {
    title: 'Uso aceptable',
    body: [
      'No se permite usar JAH Link para phishing, malware, fraude, spam, abuso o contenido ilegal.',
    ],
  },
  'code-of-conduct': {
    title: 'Código de conducta',
    body: [
      'Los usuarios deben mantener un comportamiento responsable y no abusar de las funciones públicas de enlaces.',
    ],
  },
  'transparency-report': {
    title: 'Reporte de transparencia',
    body: [
      'JAH Link mantiene esta sección para reportes operativos, seguridad y solicitudes relevantes.',
    ],
  },
};

export default function LegalPage() {
  const params = useParams();
  const slug = params['*']?.replace(/^\/+/, '') || 'privacy-policy';
  const page = LEGAL_PAGES[slug];

  if (!page) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <BrandLogo size="md" />
        <h1 className="text-2xl font-bold">Página legal no encontrada</h1>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <article className="max-w-3xl mx-auto space-y-6">
        <Link to="/" className="inline-flex">
          <BrandLogo size="md" />
        </Link>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-4">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <div className="space-y-3 text-[var(--text-secondary)] leading-relaxed">
            {page.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Esta página forma parte de las rutas legales públicas de JAH Link.
          </p>
        </section>
      </article>
    </main>
  );
}

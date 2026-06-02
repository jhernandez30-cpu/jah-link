import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ShortLink } from '../types';
import type { QrCodeRecord } from '../lib/storage';
import { QrCode, Download, Copy, Check, Trash2, Plus } from 'lucide-react';

interface QRCodeViewProps {
  links: ShortLink[];
  qrCodes: QrCodeRecord[];
  onCreateQr: (input: {
    entityType: string;
    entityId?: string;
    targetUrl: string;
    title?: string;
  }) => Promise<void>;
  onDeleteQr: (id: string) => Promise<void>;
}

export default function QRCodeView({ links, qrCodes, onCreateQr, onDeleteQr }: QRCodeViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(links[0]?.id ?? '');
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('Mi código QR');

  const selected = links.find((l) => l.id === selectedId) ?? links[0];
  const targetUrl = selected ? `https://${selected.shortUrl}` : '';

  const previewQr = useMemo(() => qrCodes.find((q) => q.targetUrl === targetUrl), [qrCodes, targetUrl]);

  const handleCopy = () => {
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `jah-link-qr-${selected?.slug ?? 'codigo'}.png`;
    a.click();
  };

  const handleSaveQr = async () => {
    if (!targetUrl) return;
    await onCreateQr({
      entityType: 'short_link',
      entityId: selected?.id,
      targetUrl,
      title,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Códigos QR</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Genera QR para enlaces cortos o tu página bio. Guarda y descarga en PNG.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <QrCode className="h-12 w-12 text-brand-cyan mx-auto mb-4 opacity-50" />
          <p className="text-white font-semibold">Aún no hay enlaces</p>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            Crea un enlace corto primero para generar su código QR.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase block">
              Seleccionar enlace corto
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-2 w-full py-3 px-4 rounded-xl bg-black border border-[var(--border)] text-white text-sm"
              >
                {links.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortUrl}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase block">
              Título del QR
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full py-3 px-4 rounded-xl bg-black border border-[var(--border)] text-white text-sm"
              />
            </label>

            <p className="text-xs text-[var(--text-secondary)] break-all font-mono">{targetUrl}</p>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleCopy} className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-[var(--border)] text-sm flex items-center justify-center gap-2 hover:bg-white/5">
                {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
                Copiar URL
              </button>
              <button type="button" onClick={handleDownload} className="flex-1 min-w-[120px] btn-brand py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Descargar PNG
              </button>
              <button type="button" onClick={handleSaveQr} className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-brand-cyan/40 text-brand-cyan text-sm flex items-center justify-center gap-2 hover:bg-brand-cyan/10">
                <Plus className="h-4 w-4" /> Guardar QR
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center glass-panel-glow-cyan rounded-2xl p-10" ref={canvasRef}>
            {targetUrl ? (
              <QRCodeCanvas value={targetUrl} size={220} bgColor="#000000" fgColor="#00CFFF" level="M" includeMargin />
            ) : (
              <QrCode className="h-24 w-24 text-brand-cyan/30" />
            )}
            <p className="text-[10px] text-[var(--text-secondary)] mt-6 uppercase tracking-widest">Vista previa QR</p>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">QR guardados ({qrCodes.length})</h2>
        {qrCodes.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No hay códigos QR guardados todavía.</p>
        ) : (
          <ul className="space-y-3">
            {qrCodes.map((qr) => (
              <li
                key={qr.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-[var(--border)] bg-black/40"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{qr.title ?? 'QR sin título'}</p>
                  <p className="text-xs text-brand-cyan font-mono truncate">{qr.targetUrl}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{qr.scansCount} escaneos</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteQr(qr.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {previewQr && (
          <p className="text-xs text-brand-green mt-4">Este enlace ya tiene un QR guardado en la lista.</p>
        )}
      </div>
    </div>
  );
}

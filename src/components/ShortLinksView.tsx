/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShortLink } from '../types';
import { isValidSlug, isValidUrl, normalizeUrl } from '../lib/validation';
import { useApp } from '../context/AppContext';
import {
  FREE_PLAN_LIMIT_MESSAGE,
  getPlanDefinition,
  getRemainingShortLinks,
  PRO_PENDING_MESSAGE,
} from '../lib/plans';
import { 
  Link2, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  Lock, 
  Sparkles, 
  Globe, 
  Plus,
  Share2,
  Tags,
  QrCode,
  Layout,
  Crown,
  ChevronDown,
  Info,
  CalendarDays,
  X,
  PlusCircle,
  TrendingUp
} from 'lucide-react';

interface ShortLinksViewProps {
  links: ShortLink[];
  onAddLink: (link: Omit<ShortLink, 'id' | 'clicks' | 'createdAt'>) => Promise<ShortLink | null>;
  onDeleteLink: (id: string) => void;
  onUpdateLink?: (id: string, patch: Partial<ShortLink>) => void;
}

export default function ShortLinksView({ 
  links, 
  onAddLink, 
  onDeleteLink,
  onUpdateLink,
}: ShortLinksViewProps) {
  const { user } = useApp();
  const planInfo = getPlanDefinition(user?.plan ?? 'gratis');
  const remainingLinks = getRemainingShortLinks(user?.plan ?? 'gratis', links.length);

  // Form input states
  const [destinationUrl, setDestinationUrl] = useState('');
  const [domain, setDomain] = useState('jah.link');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sharing features checkboxes
  const [generateQR, setGenerateQR] = useState(false);
  const [addToBioPage, setAddToBioPage] = useState(false);

  // Advanced settings switches
  const [utmEnabled, setUtmEnabled] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [passwordProtection, setPasswordProtection] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const [expirationDate, setExpirationDate] = useState(false);
  const [expirationDateValue, setExpirationDateValue] = useState('');

  const [errorMess, setErrorMess] = useState('');
  const [successMess, setSuccessMess] = useState('');

  // Slogans and suggestions
  const presetTags = ['marketing', 'promo', 'social-media', 'newsletter', 'organic'];

  // Safe slug generator
  const handleGenerateSlug = () => {
    const prefixes = ['promo', 'deal', 'vip', 'summer', 'launch', 'hot', 'exclusive'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900);
    setCustomSlug(`${randomPrefix}-${randomNumber}`);
  };

  const toggleProFeature = (enabled: boolean, setter: (value: boolean) => void) => {
    if (!planInfo.limits.advancedCustomization) {
      setErrorMess(PRO_PENDING_MESSAGE);
      return;
    }
    setter(!enabled);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');
    setSuccessMess('');

    if (!destinationUrl) {
      setErrorMess('Por favor, indica una URL de destino válida.');
      return;
    }

    const destination = normalizeUrl(destinationUrl);
    if (!isValidUrl(destination)) {
      setErrorMess('La URL de destino debe ser válida (http o https).');
      return;
    }

    const slugToUse = customSlug.trim() || Math.random().toString(36).substring(2, 8);
    if (!isValidSlug(slugToUse)) {
      setErrorMess('El slug no es válido o está reservado. Usa letras, números y guiones.');
      return;
    }

    if (remainingLinks !== null && remainingLinks <= 0) {
      setErrorMess(FREE_PLAN_LIMIT_MESSAGE);
      return;
    }

    const shortUrl = `${domain}/${slugToUse}`;

    const created = await onAddLink({
      shortUrl,
      slug: slugToUse,
      destination,
      status: 'Active',
      passwordProtected: passwordProtection,
      expirationEnabled: expirationDate,
      title: title.trim() || `Link a ${new URL(destinationUrl).hostname}`,
      domain,
      tags: selectedTags,
      qrCodeGenerated: generateQR,
      addedToBioPage: addToBioPage,
      utmSource: utmEnabled ? utmSource : undefined,
      utmMedium: utmEnabled ? utmMedium : undefined,
      utmCampaign: utmEnabled ? utmCampaign : undefined,
      expirationDateValue: expirationDate ? expirationDateValue : undefined,
      active: true,
    });

    if (!created) {
      setErrorMess('No se pudo crear el enlace. Revisa URL y slug.');
      return;
    }

    // Reset Form inputs
    setDestinationUrl('');
    setCustomSlug('');
    setTitle('');
    setSelectedTags([]);
    setGenerateQR(false);
    setAddToBioPage(false);
    setUtmEnabled(false);
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setPasswordProtection(false);
    setPasswordValue('');
    setExpirationDate(false);
    setExpirationDateValue('');
    
    setSuccessMess('¡Enlace corto creado con éxito!');
    setTimeout(() => setSuccessMess(''), 3000);
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags([...selectedTags, cleanTag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="bg-transparent text-slate-100 min-h-screen space-y-8 animate-fadeIn select-none">
      
      {/* Upper context breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-wide">Enlaces cortos</h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
            Crea, edita y gestiona tus enlaces cortos con slugs personalizados y QR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Creator Panel: Fully compatible with Bitly look */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCreate} className="space-y-6">
            
            {/* Form Box 1: Detalles del link */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0d] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">
                  Detalles del link
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">Gratis</span>
              </div>

              {/* Banner note matching user screenshots details */}
              <div className="text-[11px] bg-sky-950/20 text-sky-400 border border-sky-500/20 px-4 py-3 rounded-xl flex items-start gap-2.5">
                <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="font-light leading-normal">
                  {remainingLinks === null ? (
                    <>Tu plan {planInfo.label} permite enlaces ilimitados.</>
                  ) : (
                    <>
                      Te quedan <strong className="font-bold">{remainingLinks} enlaces</strong> del plan Gratis.
                      {' '}<a href="#planes" className="underline text-sky-300 hover:text-white font-medium">Actualiza a Pro para continuar.</a>
                    </>
                  )}
                </p>
              </div>

              {errorMess && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                  {errorMess}
                </div>
              )}

              {successMess && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  {successMess}
                </div>
              )}

              {/* URL de destino */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
                  URL de destino <span className="text-[#00CFFF] font-bold">*</span>
                </label>
                <input 
                  type="url"
                  required
                  placeholder="https://ejemplo.com/mi-url-larga"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-[#00CFFF] focus:outline-none text-[#ffffff] text-xs font-mono transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Dominio y Slug side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
                    Dominio del link corto
                  </label>
                  <div className="relative">
                    <select 
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-[#00CFFF] focus:outline-none text-[#ffffff] text-xs appearance-none cursor-pointer"
                    >
                      <option value="jah.link">jah.link</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-355 uppercase tracking-wider block">
                      Segunda mitad (opcional)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[10px] text-[#00CFFF] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Generar
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-[#050505]/60 border border-r-0 border-white/10 rounded-l-xl px-3.5 py-3 text-slate-500 font-mono text-xs select-none h-[42px] flex items-center">
                      {domain}/
                    </span>
                    <input 
                      type="text"
                      placeholder="custom"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                      className="w-full px-3 py-3 bg-[#050505] border border-white/10 rounded-r-xl focus:border-[#00CFFF] focus:outline-none text-[#ffffff] text-xs font-mono h-[42px]"
                    />
                  </div>
                </div>
              </div>

              {/* Título opcional */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
                  Título (opcional)
                </label>
                <input 
                  type="text"
                  placeholder="Escribe un título descriptivo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-[#00CFFF] focus:outline-none text-[#ffffff] text-xs transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Etiquetas */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#050505] border border-white/10 rounded-xl min-h-[46px] items-center">
                  {selectedTags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 bg-[#00CFFF]/15 border border-[#00CFFF]/25 text-[#00CFFF] text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#00CFFF] hover:text-white cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    placeholder="Escribe etiqueta y pulsa Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          handleAddTag(tagInput);
                          setTagInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white p-1 min-w-[120px]"
                  />
                </div>

                {/* Preset suggestions */}
                <div className="flex gap-1.5 items-center flex-wrap pt-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Presets:</span>
                  {presetTags.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTag(t)}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/5 hover:border-[#00CFFF] text-[10px] text-slate-450 transition cursor-pointer"
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Box 2: Opciones para compartir */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0d] p-6 shadow-sm space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h2 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">
                  Opciones para compartir
                </h2>
              </div>

              {/* Generar código QR option */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                generateQR 
                  ? 'bg-amber-950/5 border-[#00CFFF]/30' 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00CFFF]/10 text-[#00CFFF] rounded-lg">
                      <QrCode className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white">Generar un código QR</h4>
                      <p className="text-[10px] text-slate-500 font-light">
                        Crea un código QR dinámico sincronizado para tus materiales impresos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Free count indicator */}
                    <span className="text-[9px] text-slate-400 font-bold border-b border-dashed border-slate-500 pb-0.5">
                      Te quedan 2
                    </span>
                    <button
                      type="button"
                      onClick={() => setGenerateQR(!generateQR)}
                      className="w-10 h-5.5 flex items-center rounded-full p-0.5 border cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: generateQR ? '#00CFFF' : 'rgba(255,255,255,0.05)',
                        borderColor: generateQR ? '#00CFFF' : 'rgba(255,255,255,0.1)' 
                      }}
                    >
                      <div 
                        className="w-4.5 h-4.5 rounded-full shadow-sm transform transition-all duration-200"
                        style={{ 
                          transform: generateQR ? 'translateX(18px)' : 'translateX(0px)',
                          backgroundColor: generateQR ? '#050505' : '#ffffff' 
                        }}
                      />
                    </button>
                  </div>
                </div>

                {generateQR && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-white/5 flex items-center gap-4"
                  >
                    <div className="h-16 w-16 p-1.5 bg-[#050505] border border-[#00CFFF]/25 rounded-lg flex items-center justify-center shrink-0">
                      {/* Dynamic simulation of mini preview */}
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <rect x="5" y="5" width="25" height="25" stroke="#00CFFF" strokeWidth="6" rx="2" />
                        <rect x="70" y="5" width="25" height="25" stroke="#00CFFF" strokeWidth="6" rx="2" />
                        <rect x="5" y="70" width="25" height="25" stroke="#00CFFF" strokeWidth="6" rx="2" />
                        <circle cx="50" cy="50" r="14" fill="#00CFFF" fillOpacity="0.4" />
                        <rect x="42" y="10" width="10" height="15" fill="#00CFFF" />
                        <rect x="75" y="80" width="15" height="10" fill="#00CFFF" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-slate-400 font-light space-y-1">
                      <span className="text-white font-semibold block">QR configurado</span>
                      <p>Se generará con los colores de marca JAH Link.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bitly Page addition option */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                addToBioPage 
                  ? 'bg-slate-950/10 border-sky-505/30' 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Layout className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white">Añadir a página Bio</h4>
                      <p className="text-[10px] text-slate-500 font-light">
                        Agrega este enlace directamente en tu micro-sitio móvil de presentación.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddToBioPage(!addToBioPage)}
                    className="w-10 h-5.5 flex items-center rounded-full p-0.5 border cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: addToBioPage ? '#38BDF8' : 'rgba(255,255,255,0.05)',
                      borderColor: addToBioPage ? '#38BDF8' : 'rgba(255,255,255,0.1)' 
                    }}
                  >
                    <div 
                      className="w-4.5 h-4.5 rounded-full shadow-sm transform transition-all duration-200"
                      style={{ 
                        transform: addToBioPage ? 'translateX(18px)' : 'translateX(0px)',
                        backgroundColor: addToBioPage ? '#050505' : '#ffffff' 
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Form Box 3: Configuración avanzada (Premium crowned features) */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0d] p-6 shadow-sm space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h2 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">
                  Configuración avanzada
                </h2>
              </div>

              {/* UTM parameters switcher */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                utmEnabled 
                  ? 'bg-indigo-950/5 border-indigo-505/20' 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Share2 className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Parámetros UTM</span>
                        <Crown className="h-3 w-3 text-[#00CFFF] fill-[#00CFFF]" title="Función Pro" />
                      </h4>
                      <p className="text-[10px] text-slate-500 font-light">
                        Sincroniza y detecta orígenes de tráfico en tus reportes de Google Analytics.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleProFeature(utmEnabled, setUtmEnabled)}
                    className="w-10 h-5.5 flex items-center rounded-full p-0.5 border cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: utmEnabled ? '#00CFFF' : 'rgba(255,255,255,0.05)',
                      borderColor: utmEnabled ? '#00CFFF' : 'rgba(255,255,255,0.1)' 
                    }}
                  >
                    <div 
                      className="w-4.5 h-4.5 rounded-full shadow-sm transform transition-all duration-200"
                      style={{ 
                        transform: utmEnabled ? 'translateX(18px)' : 'translateX(0px)',
                        backgroundColor: utmEnabled ? '#050505' : '#ffffff' 
                      }}
                    />
                  </button>
                </div>

                {utmEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#00CFFF] font-bold uppercase tracking-wider block">UTM Source</span>
                      <input 
                        type="text" 
                        placeholder="Google, newsletter, etc."
                        value={utmSource}
                        onChange={(e) => setUtmSource(e.target.value)}
                        className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-white text-[11px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-[#00CFFF] font-bold uppercase tracking-wider block">UTM Medium</span>
                      <input 
                        type="text" 
                        placeholder="email, banner, cpc"
                        value={utmMedium}
                        onChange={(e) => setUtmMedium(e.target.value)}
                        className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-white text-[11px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-[#00CFFF] font-bold uppercase tracking-wider block">UTM Campaign</span>
                      <input 
                        type="text" 
                        placeholder="summer_promo_2026"
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value)}
                        className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-white text-[11px]"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Caducidad del link switcher */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                expirationDate 
                  ? 'bg-rose-950/5 border-rose-505/20' 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                      <CalendarDays className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Caducidad del link</span>
                        <Crown className="h-3 w-3 text-[#00CFFF] fill-[#00CFFF]" title="Función Pro" />
                      </h4>
                      <p className="text-[10px] text-slate-500 font-light">
                        Establece un límite de fecha y hora tras el cual la URL redirigirá a una página alternativa.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleProFeature(expirationDate, setExpirationDate)}
                    className="w-10 h-5.5 flex items-center rounded-full p-0.5 border cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: expirationDate ? '#00CFFF' : 'rgba(255,255,255,0.05)',
                      borderColor: expirationDate ? '#00CFFF' : 'rgba(255,255,255,0.1)' 
                    }}
                  >
                    <div 
                      className="w-4.5 h-4.5 rounded-full shadow-sm transform transition-all duration-200"
                      style={{ 
                        transform: expirationDate ? 'translateX(18px)' : 'translateX(0px)',
                        backgroundColor: expirationDate ? '#050505' : '#ffffff' 
                      }}
                    />
                  </button>
                </div>

                {expirationDate && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-white/5 space-y-1.5"
                  >
                    <span className="text-[9px] text-[#00CFFF] font-bold uppercase tracking-wider block">Fecha de expiración</span>
                    <input 
                      type="datetime-local" 
                      value={expirationDateValue}
                      onChange={(e) => setExpirationDateValue(e.target.value)}
                      className="py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-white text-[11px] font-mono cursor-pointer"
                    />
                  </motion.div>
                )}
              </div>

              {/* Password protection */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                passwordProtection 
                  ? 'bg-amber-955/5 border-amber-505/20' 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white">Protección con contraseña</h4>
                      <p className="text-[10px] text-slate-500 font-light">
                        Solicita una clave antes de redirigir al destino.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPasswordProtection(!passwordProtection)}
                    className="w-10 h-5.5 flex items-center rounded-full p-0.5 border cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: passwordProtection ? '#00CFFF' : 'rgba(255,255,255,0.05)',
                      borderColor: passwordProtection ? '#00CFFF' : 'rgba(255,255,255,0.1)' 
                    }}
                  >
                    <div 
                      className="w-4.5 h-4.5 rounded-full shadow-sm transform transition-all duration-200"
                      style={{ 
                        transform: passwordProtection ? 'translateX(18px)' : 'translateX(0px)',
                        backgroundColor: passwordProtection ? '#050505' : '#ffffff' 
                      }}
                    />
                  </button>
                </div>

                {passwordProtection && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-white/5 space-y-1.5"
                  >
                    <span className="text-[9px] text-[#00CFFF] font-bold uppercase tracking-wider block">Contraseña de acceso</span>
                    <input 
                      type="password" 
                      placeholder="Indica un password exclusivo"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-white text-[11px]"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Submit / actions buttons matches */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDestinationUrl('');
                  setCustomSlug('');
                  setGenerateQR(false);
                  setAddToBioPage(false);
                }}
                className="flex-1 py-3 px-5 border border-white/10 rounded-xl font-medium text-xs text-center text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-5 bg-[#3b5998] hover:bg-[#2b4478] text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg text-center"
              >
                Crear enlace
              </button>
            </div>

          </form>
        </div>

        {/* Right Active Table Registry */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0c0c0d] border border-white/10 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h2 className="font-serif font-light text-sm uppercase tracking-wider text-[#00CFFF] flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Enlaces ({links.length})</span>
            </h2>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-blue/10 border border-brand-blue/20 px-2 py-0.5 text-brand-cyan rounded font-mono">
              En vivo
            </span>
          </div>

          <div className="space-y-4">
            {links.map((link) => (
              <div 
                key={link.id}
                className="p-4 rounded-xl border border-white/5 bg-[#050505] space-y-3 group relative hover:border-[#00CFFF]/20 transition-all duration-300"
              >
                {/* Title & Stats */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-semibold leading-snug group-hover:text-[#00CFFF] transition">
                      {link.title || link.shortUrl}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono break-all line-clamp-1">{link.destination}</p>
                    
                    {/* Render tag chips if configured */}
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {link.tags.map(tag => (
                          <span key={tag} className="text-[8px] bg-white/5 text-slate-400 px-1 py-0.2 rounded border border-white/5 font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0">
                    {link.clicks} clics
                  </span>
                </div>

                {/* Integration Badges */}
                <div className="flex items-center gap-1.5">
                  {link.qrCodeGenerated && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <QrCode className="h-2.5 w-2.5" /> QR básico
                    </span>
                  )}
                  {link.addedToBioPage && (
                    <span className="text-[8px] bg-sky-500/10 text-sky-450 border border-sky-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Layout className="h-2.5 w-2.5" /> Página Bio
                    </span>
                  )}
                  {link.passwordProtected && (
                    <span className="text-[8px] bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                      <Lock className="h-2.5 w-2.5" /> Protegido
                    </span>
                  )}
                </div>

                {/* Clipboard actions & deletion */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-slate-500 font-light">
                  <span className="font-mono text-[9px] text-[#00CFFF] bg-[#00CFFF]/5 px-2 py-0.5 rounded border border-[#00CFFF]/10">
                    {link.shortUrl}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(`https://${link.shortUrl}`, link.id)}
                      className="p-1 px-2.5 bg-white/5 border border-white/5 hover:border-[#00CFFF] hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer text-slate-350"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar enlace
                        </>
                      )}
                    </button>

                    {onUpdateLink && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateLink(link.id, {
                            active: link.active === false,
                            status: link.active === false ? 'Active' : 'Draft',
                          })
                        }
                        className="p-1 px-2 text-[10px] border border-white/10 rounded hover:border-brand-cyan text-slate-400"
                      >
                        {link.active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Eliminar este enlace?')) {
                          onDeleteLink(link.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {links.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-light border border-dashed border-white/10 rounded-2xl">
                No hay enlaces todavía. Usa el formulario para crear el primero.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

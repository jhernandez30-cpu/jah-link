/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BioPageConfig, BioLink } from '../types';
import InitialsAvatar from './InitialsAvatar';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Eye, 
  Check, 
  ArrowUpRight,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Settings,
  Palette,
  Calendar,
  Compass,
  Sliders,
  User,
  FileText,
  Image as ImageIcon,
  Monitor,
  Tablet,
  Copy,
  ArrowRight,
  Globe,
  DollarSign,
  TrendingUp,
  Award,
  Link2
} from 'lucide-react';

interface ExtendedBioBlock {
  id: string;
  type: 'link' | 'image';
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  sampleContent?: boolean;
}

interface BioPageBuilderViewProps {
  initialConfig: BioPageConfig;
  onSaveConfig: (config: BioPageConfig) => void | Promise<boolean>;
}

export default function BioPageBuilderView({ initialConfig, onSaveConfig }: BioPageBuilderViewProps) {
  // Core tab state: 'crear' | 'disenar' | 'rastrear'
  const [activeSubTab, setActiveSubTab] = useState<'crear' | 'disenar' | 'rastrear'>('crear');

  // Multi-state configuration
  const [displayName, setDisplayName] = useState(initialConfig.displayName);
  const [username, setUsername] = useState(initialConfig.username || 'miperfil');
  const [bio, setBio] = useState(initialConfig.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialConfig.avatarUrl);
  const [whatsapp, setWhatsapp] = useState(initialConfig.whatsapp || '');
  const [email, setEmail] = useState(initialConfig.email || '');

  // Custom rich blocks state
  const [blocks, setBlocks] = useState<ExtendedBioBlock[]>([
    {
      id: 'blk-1',
      type: 'link',
      title: 'Sitio web oficial',
      url: 'https://ejemplo.com',
      description: 'Conecta a tus visitantes con tu pagina principal.',
      active: true,
      sampleContent: true
    },
    {
      id: 'blk-2',
      type: 'link',
      title: 'Contacto directo',
      url: 'https://wa.me/50500000000',
      description: 'Abre una conversacion o canal de venta.',
      active: true,
      sampleContent: true
    },
    {
      id: 'blk-3',
      type: 'image',
      title: 'Banner de marca',
      url: 'https://ejemplo.com/galeria',
      imageUrl: '/brand/jah-link-logo.png',
      active: true,
      sampleContent: true
    }
  ]);

  // Social media integration state
  const [activeSocials, setActiveSocials] = useState<{ [key: string]: string }>({
    instagram: 'instagram.com/tu_marca',
    youtube: 'youtube.com/@tu_marca',
    email: 'hola@tu-marca.com'
  });

  const [socialIconColor, setSocialIconColor] = useState<'original' | 'negro' | 'blanco'>('blanco');
  const [socialPlacement, setSocialPlacement] = useState<'principio' | 'final'>('final');

  // Aesthetics state
  const [themeName, setThemeName] = useState<'luxury' | 'obsidian' | 'sunset' | 'jade' | 'minimal'>('luxury');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1c');
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('color');
  const [bgGradient, setBgGradient] = useState('linear-gradient(to bottom, #1a1a1c, #0d0d0f)');
  const [bgImageUrl, setBgImageUrl] = useState('');

  const [titleColor, setTitleColor] = useState('#FFFAF6');
  const [bioColor, setBioColor] = useState('#C5A880');
  const [fontFamily, setFontFamily] = useState('Georgia');

  // Blocks styling state
  const [blockBgColor, setBlockBgColor] = useState('#ecdccd');
  const [blockTextColor, setBlockTextColor] = useState('#1a1a1c');
  const [buttonRoundness, setButtonRoundness] = useState<'pill' | 'medium' | 'squared' | 'outline'>('medium');
  const [buttonShadow, setButtonShadow] = useState<'none' | 'delgado' | '3D'>('3D');

  // Editor interaction state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Switch custom sample presets
  const stockAvatars = [
    { name: 'Usar iniciales', url: '' },
    { name: 'Avatar JAH Link', url: '' },
    { name: 'Sin foto', url: '' }
  ];

  const stockBannerBlocks = [
    { label: 'Logo JAH Link', url: '/brand/jah-link-logo.png' },
    { label: 'Icono JAH Link', url: '/brand/jah-link-logo-icon.png' },
    { label: 'Sin imagen', url: '' }
  ];

  // Apply beautiful color presets on clicks
  const applyThemePreset = (preset: 'luxury' | 'obsidian' | 'sunset' | 'jade' | 'minimal') => {
    setThemeName(preset);
    if (preset === 'luxury') {
      setBackgroundColor('#1a1a1c');
      setBgType('color');
      setTitleColor('#FFFAF6');
      setBioColor('#C5A880');
      setFontFamily('Georgia');
      setBlockBgColor('#ecdccd');
      setBlockTextColor('#1a1a1c');
      setButtonRoundness('medium');
      setButtonShadow('3D');
      setSocialIconColor('blanco');
    } else if (preset === 'obsidian') {
      setBackgroundColor('#050505');
      setBgType('color');
      setTitleColor('#FFFFFF');
      setBioColor('#A1A1AA');
      setFontFamily('Inter');
      setBlockBgColor('#0c0c0d');
      setBlockTextColor('#00CFFF');
      setButtonRoundness('squared');
      setButtonShadow('none');
      setSocialIconColor('blanco');
    } else if (preset === 'sunset') {
      setBackgroundColor('#7c5f11');
      setBgType('gradient');
      setBgGradient('linear-gradient(135deg, #db2777 0%, #006BFF 100%)');
      setTitleColor('#FFFFFF');
      setBioColor('#FFF1E6');
      setFontFamily('Outfit');
      setBlockBgColor('#FFFFFF');
      setBlockTextColor('#006BFF');
      setButtonRoundness('pill');
      setButtonShadow('delgado');
      setSocialIconColor('original');
    } else if (preset === 'jade') {
      setBackgroundColor('#022c22');
      setBgType('color');
      setTitleColor('#F0FDF4');
      setBioColor('#34D399');
      setFontFamily('Georgia');
      setBlockBgColor('#059669');
      setBlockTextColor('#FFFFFF');
      setButtonRoundness('medium');
      setButtonShadow('delgado');
      setSocialIconColor('blanco');
    } else if (preset === 'minimal') {
      setBackgroundColor('#F8FAFC');
      setBgType('color');
      setTitleColor('#0F172A');
      setBioColor('#475569');
      setFontFamily('Inter');
      setBlockBgColor('#FFFFFF');
      setBlockTextColor('#0F172A');
      setButtonRoundness('squared');
      setButtonShadow('delgado');
      setSocialIconColor('negro');
    }
  };

  // Add block
  const handleAddBlock = (type: 'link' | 'image') => {
    const newBlock: ExtendedBioBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: type === 'link' ? 'Nuevo enlace destacado' : 'Nuevo banner de marca',
      url: 'https://',
      active: true,
      description: type === 'link' ? 'Toca para abrir este recurso.' : '',
      imageUrl: type === 'image' ? '/brand/jah-link-logo.png' : undefined
    };

    setBlocks(prev => [...prev, newBlock]);
    setEditingBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  // Delete block
  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  // Update specific block item
  const handleUpdateBlockField = (id: string, field: keyof ExtendedBioBlock, value: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Reorder sorting blocks
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const reordered = [...blocks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setBlocks(reordered);
  };

  // Edit social handles
  const handleSocialChange = (key: string, value: string) => {
    setActiveSocials(prev => {
      const updated = { ...prev };
      if (!value) {
        delete updated[key];
      } else {
        updated[key] = value;
      }
      return updated;
    });
  };

  // Save integration to parent state config
  const handleSaveAndPublish = () => {
    setSaving(true);
    setTimeout(() => {
      // Package details into parent standard types structure cleanly
      const mappedLinks: BioLink[] = blocks
        .filter(b => b.active)
        .map(b => ({
          id: b.id,
          label: b.title,
          url: b.url,
          platform: b.type === 'image' ? 'Website' : 'Website'
        }));

      const finalConfig: BioPageConfig = {
        displayName,
        username,
        bio,
        avatarUrl,
        whatsapp,
        email,
        socialLinks: Object.entries(activeSocials).map(([platform, url]) => ({
          id: platform,
          platform,
          url: String(url),
        })),
        links: mappedLinks.map((l) => ({ ...l, active: true })),
        theme: themeName === 'minimal' ? 'Classic' : 'Modern',
        backgroundColor: bgType === 'gradient' ? '#050816' : backgroundColor,
        primaryColor: blockTextColor || '#006BFF',
        buttonStyle: buttonRoundness === 'pill' ? 'pill' : buttonRoundness === 'squared' ? 'square' : buttonRoundness === 'outline' ? 'bordered' : 'rounded',
        font: fontFamily,
      };

      void Promise.resolve(onSaveConfig(finalConfig)).then(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      });
    }, 800);
  };

  // Helper selectors for social icons layout inside phone simulator
  const availableSocialTypes = [
    { id: 'instagram', label: 'Instagram', placeholder: 'instagram.com/user', icon: Instagram },
    { id: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/channel', icon: Youtube },
    { id: 'email', label: 'Email', placeholder: 'user@domain.com', icon: Mail },
    { id: 'facebook', label: 'Facebook', placeholder: 'facebook.com/page', icon: Facebook },
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100 font-sans selection:bg-[#00CFFF]/25 select-none">
      {/* Header telemetry filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-serif font-light text-2xl sm:text-3xl text-white tracking-wide">Constructor de pagina bio</h1>
          <p className="text-slate-400 text-xs sm:text-sm font-light">
            Crea enlaces, banners, redes sociales y revisa la actividad de tu perfil publico.
          </p>
        </div>

        {/* Global Save Action */}
        <button 
          onClick={handleSaveAndPublish}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00CFFF] hover:bg-[#006BFF] text-[#050505] font-semibold text-xs tracking-widest uppercase rounded-lg shadow-lg cursor-pointer transition-all duration-300 disabled:opacity-40"
        >
          {saving ? 'Guardando cambios...' : 'Guardar cambios'}
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Modular configuration builder space */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sub Tab selection Menu (Crear | Diseñar | Rastrear) */}
          <div className="grid grid-cols-3 gap-2 bg-[#0c0c0d] p-1.5 rounded-xl border border-white/10 shadow-sm">
            <button
              onClick={() => setActiveSubTab('crear')}
              className={`py-3 px-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeSubTab === 'crear' 
                  ? 'bg-[#00CFFF] text-black shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Crear</span>
            </button>

            <button
              onClick={() => setActiveSubTab('disenar')}
              className={`py-3 px-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeSubTab === 'disenar' 
                  ? 'bg-[#00CFFF] text-black shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Diseñar</span>
            </button>

            <button
              onClick={() => setActiveSubTab('rastrear')}
              className={`py-3 px-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeSubTab === 'rastrear' 
                  ? 'bg-[#00CFFF] text-black shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Rastrear</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB 1: CREAR (BLOCKS LIST) */}
            {activeSubTab === 'crear' && (
              <motion.div
                key="crear-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Add new elements button widget */}
                <div className="relative">
                  <div className="flex items-center justify-between bg-[#0c0c0d] border border-white/10 rounded-xl p-4 shadow">
                    <div className="space-y-0.5">
                      <h3 className="font-serif font-light text-sm text-white">Agregar contenido</h3>
                      <p className="text-[10px] text-slate-500 font-light">Inserta enlaces, banners de marca o redes sociales.</p>
                    </div>

                    <button
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="px-4 py-2 bg-[#00CFFF]/10 hover:bg-[#00CFFF]/20 border border-[#00CFFF]/30 text-[#00CFFF] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" /> Agregar bloque
                    </button>
                  </div>

                  {/* Dropdown selectors */}
                  {showAddMenu && (
                    <div className="absolute right-4 top-16 bg-[#0c0c0d] border border-white/15 rounded-xl p-2 w-48 shadow-2xl z-20 space-y-1">
                      <button
                        onClick={() => handleAddBlock('link')}
                        className="w-full text-left font-sans text-xs font-medium text-slate-250 hover:bg-white/5 p-2 rounded-lg flex items-center gap-2.5 cursor-pointer"
                      >
                        <Link2 className="h-4 w-4 text-[#00CFFF]" />
                        <span>Enlace</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('image')}
                        className="w-full text-left font-sans text-xs font-medium text-slate-250 hover:bg-white/5 p-2 rounded-lg flex items-center gap-2.5 cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4 text-emerald-400" />
                        <span>Banner de imagen</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Blocks List */}
                <div className="space-y-4">
                  {blocks.map((block, index) => {
                    const isEditing = editingBlockId === block.id;

                    return (
                      <div 
                        key={block.id} 
                        className={`rounded-xl border transition-all duration-300 ${
                          block.active 
                            ? 'border-white/10 bg-[#0c0c0d] shadow-sm' 
                            : 'border-white/5 bg-[#080809] hover:border-white/10 opacity-75'
                        }`}
                      >
                        {/* Header card area */}
                        <div className="p-4 flex items-center justify-between gap-3">
                          {/* Left handle + type icon */}
                          <div className="flex items-center gap-3">
                            {/* Up / Down movers */}
                            <div className="flex flex-col gap-1 shrink-0">
                              <button 
                                onClick={() => handleMoveBlock(index, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-slate-500 hover:text-[#00CFFF] disabled:opacity-20 cursor-pointer"
                                title="Mover arriba"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleMoveBlock(index, 'down')}
                                disabled={index === blocks.length - 1}
                                className="p-0.5 text-slate-500 hover:text-[#00CFFF] disabled:opacity-20 cursor-pointer"
                                title="Mover abajo"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Block visual icon */}
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              block.type === 'image' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                                : 'bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/15'
                            }`}>
                              {block.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                            </div>

                            {/* Text labels */}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-sans font-medium text-xs text-white">{block.title || 'Bloque sin titulo'}</span>
                                {block.sampleContent && (
                                  <span className="text-[8px] bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 px-1 rounded uppercase tracking-wider font-bold">
                                    Ejemplo
                                  </span>
                                )}
                                {!block.active && (
                                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase tracking-wider font-bold">
                                    Desactivado
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-light max-w-xs truncate">
                                {block.type === 'image' ? 'Banner de imagen' : block.url}
                              </p>
                            </div>
                          </div>

                          {/* Right triggers and status toggles */}
                          <div className="flex items-center gap-3">
                            {/* Toggle active switch display */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={block.active}
                                onChange={(e) => handleUpdateBlockField(block.id, 'active', e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00CFFF]" />
                            </label>

                            {/* Edit toggle button */}
                            <button
                              onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 cursor-pointer"
                            >
                              {isEditing ? 'Listo' : 'Editar'}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible editing details */}
                        {isEditing && (
                          <div className="p-4 bg-[#050505] border-t border-white/10 rounded-b-xl space-y-4 animate-slideDown">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Title editing */}
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Título y descripción</label>
                                <input 
                                  type="text"
                                  value={block.title}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'title', e.target.value)}
                                  className="w-full py-1.5 px-3 bg-[#0c0c0d] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#00CFFF]"
                                  placeholder="Escribir título"
                                />
                              </div>

                              {/* Target redirection url */}
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">URL de destino</label>
                                <input 
                                  type="text"
                                  value={block.url}
                                  onChange={(e) => handleUpdateBlockField(block.id, 'url', e.target.value)}
                                  className="w-full py-1.5 px-3 bg-[#0c0c0d] border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#00CFFF]"
                                  placeholder="https://"
                                />
                              </div>

                              {/* Special fields for image block or link description */}
                              {block.type === 'link' ? (
                                <div className="sm:col-span-2 space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Subtitulo o descripcion (opcional)</label>
                                  <input 
                                    type="text"
                                    value={block.description || ''}
                                    onChange={(e) => handleUpdateBlockField(block.id, 'description', e.target.value)}
                                    className="w-full py-1.5 px-3 bg-[#0c0c0d] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#00CFFF]"
                                    placeholder="Escribir una descripción breve"
                                  />
                                </div>
                              ) : (
                                <div className="sm:col-span-2 space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">URL de imagen del banner</label>
                                    <input 
                                      type="text"
                                      value={block.imageUrl || ''}
                                      onChange={(e) => handleUpdateBlockField(block.id, 'imageUrl', e.target.value)}
                                      className="w-full py-1.5 px-3 bg-[#0c0c0d] border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#00CFFF]"
                                      placeholder="https://"
                                    />
                                  </div>

                                  {/* Custom luxury select image preset buttons */}
                                  <div className="space-y-1">
                                    <span className="text-[8px] uppercase tracking-widest text-[#00CFFF]/80 block font-bold">Presets de lujo rápidos:</span>
                                    <div className="grid grid-cols-3 gap-2">
                                      {stockBannerBlocks.map((banner) => (
                                        <button
                                          key={banner.label}
                                          type="button"
                                          onClick={() => handleUpdateBlockField(block.id, 'imageUrl', banner.url)}
                                          className={`py-1 px-1.5 rounded bg-[#0c0c0d] border text-[9px] truncate text-slate-350 cursor-pointer ${
                                            block.imageUrl === banner.url ? 'border-[#00CFFF] text-white' : 'border-white/5 hover:bg-white/5'
                                          }`}
                                        >
                                          {banner.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Remove button panel */}
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="px-3 py-1.5 bg-red-950/20 text-red-400 border border-red-900/40 rounded-lg hover:bg-red-950/40 text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar bloque
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {blocks.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 font-light border border-dashed border-white/10 rounded-xl">
                      No hay bloques agregados. Usa "Agregar bloque" para crear el primer enlace.
                    </div>
                  )}
                </div>

                {/* Footnote matching screenshot warning */}
                <div className="p-3.5 rounded-lg bg-white/5 text-[10px] text-slate-400 font-light border border-white/5">
                  ⚠️ Los links que marques como desactivados no se muestran en el teléfono de vista previa en tiempo real.
                </div>
              </motion.div>
            )}

            {/* TAB 2: DISEÑAR (STYLING AND CONFIGS) */}
            {activeSubTab === 'disenar' && (
              <motion.div
                key="disenar-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 1. PERFIL EDITING */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2 flex items-center justify-between">
                    <span>Perfil (Quiéces somos)</span>
                    <User className="h-4 w-4 text-slate-400" />
                  </h3>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Circle Avatar review */}
                    <div className="relative shrink-0 group">
                      <div className="h-16 w-16 rounded-full border border-white/20 bg-slate-950 overflow-hidden relative shadow">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Avatar select" 
                            className="h-full w-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-serif italic text-white font-bold bg-[#00CFFF]/10 text-[#00CFFF]">
                            GH
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Avatar URL de Imagen</label>
                        <input 
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs leading-relaxed font-mono focus:outline-none focus:border-[#00CFFF]"
                          placeholder="Ninguno / Monograma"
                        />
                      </div>

                      {/* Stock Avatars selectors */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {stockAvatars.map((stock) => (
                          <button
                            key={stock.name}
                            type="button"
                            onClick={() => setAvatarUrl(stock.url)}
                            className="text-[9px] bg-[#050505] hover:bg-white/5 text-slate-350 px-2 py-1 rounded border border-white/5 cursor-pointer"
                          >
                            {stock.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-[9px] bg-red-950/10 text-red-400 hover:bg-red-950/20 px-2 py-1 rounded border border-red-900/10 cursor-pointer"
                        >
                          Usar iniciales
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nombre publico</label>
                      <input 
                        type="text"
                        maxLength={32}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#00CFFF]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Descripción (bio / slogan)</label>
                      <input 
                        type="text"
                        maxLength={80}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#00CFFF]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. TEMAS PALETTES PRESETS */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2">Temas directos</h3>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { id: 'luxury', label: 'Luxury Gold & Slate', colors: ['bg-[#1a1a1c]', 'bg-[#ecdccd]'] },
                      { id: 'obsidian', label: 'Dark Obsidian', colors: ['bg-[#050505]', 'bg-[#00CFFF]'] },
                      { id: 'sunset', label: 'Amber Sunset', colors: ['bg-pink-600', 'bg-[#006BFF]'] },
                      { id: 'jade', label: 'Jade Palace', colors: ['bg-emerald-950', 'bg-emerald-500'] },
                      { id: 'minimal', label: 'Minimalist Slate', colors: ['bg-slate-150', 'bg-[#0f172a]'] }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyThemePreset(t.id as any)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                          themeName === t.id ? 'bg-[#00CFFF]/10 border-[#00CFFF]' : 'border-white/5 hover:bg-white/5 bg-[#050505]'
                        }`}
                      >
                        <div className="flex gap-0.5 justify-center">
                          <span className={`h-4.5 w-4.5 rounded-full ${t.colors[0]} border border-white/10`} />
                          <span className={`h-4.5 w-4.5 rounded-full ${t.colors[1]} border border-white/10`} />
                        </div>
                        <span className="text-[8px] text-slate-400 font-medium text-center truncate w-full">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. BACKGROUND CUSTOM AND FONTS */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2">Estilos de Fondo & Texto</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Background selector choice type */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tipo de fondo</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#050505] p-0.5 rounded-lg border border-white/10">
                        {(['color', 'gradient', 'image'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setBgType(opt)}
                            className={`py-1 text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
                              bgType === opt ? 'bg-[#00CFFF] text-[#050505]' : 'text-slate-400'
                            }`}
                          >
                            {opt === 'color' ? 'Color' : opt === 'gradient' ? 'Gradiante' : 'Imagen'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font picker */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tipo de letra (Tipografía)</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full py-1.5 px-2 bg-[#050505] border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="Georgia">Georgia Elegant Serif</option>
                        <option value="Playfair Display">Playfair Display Luxury</option>
                        <option value="Inter">Inter Clean Sans</option>
                        <option value="Outfit">Outfit Modern Sans</option>
                        <option value="Courier Prime">Courier Monospace</option>
                      </select>
                    </div>

                    {/* Conditional inputs */}
                    {bgType === 'color' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Color de fondo</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-8 w-10 p-0 border border-white/10 rounded cursor-pointer bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="flex-1 py-1 px-2.5 h-8 bg-[#050505] border border-white/10 rounded text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {bgType === 'gradient' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">CSS Gradiante</label>
                        <input 
                          type="text" 
                          value={bgGradient}
                          onChange={(e) => setBgGradient(e.target.value)}
                          className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs font-mono"
                        />
                      </div>
                    )}

                    {bgType === 'image' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Wallpaper URL de fondo</label>
                        <input 
                          type="text" 
                          value={bgImageUrl}
                          onChange={(e) => setBgImageUrl(e.target.value)}
                          className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs font-mono"
                          placeholder="https://ejemplo.com/fondo.png"
                        />
                      </div>
                    )}

                    {/* Text visual colors */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Color Título</label>
                        <input 
                          type="color" 
                          value={titleColor}
                          onChange={(e) => setTitleColor(e.target.value)}
                          className="h-7 w-full p-0 border border-white/10 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Color Bio</label>
                        <input 
                          type="color" 
                          value={bioColor}
                          onChange={(e) => setBioColor(e.target.value)}
                          className="h-7 w-full p-0 border border-white/10 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. REDES SOCIALES INTEGRATION */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2">Redes sociales</h3>
                  
                  {/* Select handles listed */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Configurar enlaces sociales</span>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {availableSocialTypes.map((soc) => {
                        const IconComponent = soc.icon;
                        const isActive = activeSocials[soc.id] !== undefined;

                        return (
                          <div key={soc.id} className="flex items-center gap-3">
                            <span className="p-2 bg-[#050505] rounded-lg border border-white/10 text-slate-350 shrink-0">
                              <IconComponent className="h-4 w-4" />
                            </span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={activeSocials[soc.id] || ''}
                                onChange={(e) => handleSocialChange(soc.id, e.target.value)}
                                placeholder={soc.placeholder}
                                className="w-full py-1.5 px-3 bg-[#050505] border border-white/10 rounded-lg text-xs focus:outline-none text-slate-200 focus:border-[#00CFFF]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Icon aesthetics selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-3 flex-wrap">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Color del icono</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#050505] p-0.5 rounded-lg border border-white/10">
                        {(['original', 'negro', 'blanco'] as const).map((colOpt) => (
                          <button
                            key={colOpt}
                            type="button"
                            onClick={() => setSocialIconColor(colOpt)}
                            className={`py-1 text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer capitalize ${
                              socialIconColor === colOpt ? 'bg-[#00CFFF] text-black shadow' : 'text-slate-400'
                            }`}
                          >
                            {colOpt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Colocación en el perfil</label>
                      <div className="grid grid-cols-2 gap-1 bg-[#050505] p-0.5 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => setSocialPlacement('principio')}
                          className={`py-1 text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
                            socialPlacement === 'principio' ? 'bg-[#00CFFF] text-black shadow' : 'text-slate-400'
                          }`}
                        >
                          Principio (Top)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSocialPlacement('final')}
                          className={`py-1 text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
                            socialPlacement === 'final' ? 'bg-[#00CFFF] text-black shadow' : 'text-slate-400'
                          }`}
                        >
                          Final (Bottom)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. BLOQUES BUTTON CUSTOM STYLING */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2">Ajustes visuales de Bloques</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shape block option */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Forma / Bloque</label>
                      <div className="grid grid-cols-4 gap-1 bg-[#050505] p-0.5 rounded-lg border border-white/10">
                        {(['pill', 'medium', 'squared', 'outline'] as const).map((rOpt) => (
                          <button
                            key={rOpt}
                            type="button"
                            onClick={() => setButtonRoundness(rOpt)}
                            className={`py-1 text-[8px] uppercase font-bold tracking-wider rounded cursor-pointer ${
                              buttonRoundness === rOpt ? 'bg-[#00CFFF] text-black shadow' : 'text-slate-400'
                            }`}
                            title={rOpt}
                          >
                            {rOpt === 'pill' ? 'Pill' : rOpt === 'medium' ? 'Round' : rOpt === 'squared' ? 'Recto' : 'Outline'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shadow options */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Sombreado / Borde</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#050505] p-0.5 rounded-lg border border-white/10">
                        {(['none', 'delgado', '3D'] as const).map((sOpt) => (
                          <button
                            key={sOpt}
                            type="button"
                            onClick={() => setButtonShadow(sOpt)}
                            className={`py-1 text-[8px] uppercase font-bold tracking-wider rounded cursor-pointer ${
                              buttonShadow === sOpt ? 'bg-[#00CFFF] text-black shadow' : 'text-slate-400'
                            }`}
                          >
                            {sOpt === 'none' ? 'None' : sOpt === 'delgado' ? 'Check' : '3D Retro'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Block custom background and text color inputs */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Color de botón / bloques</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={blockBgColor}
                          onChange={(e) => setBlockBgColor(e.target.value)}
                          className="h-8 w-10 p-0 border border-white/10 rounded cursor-pointer bg-transparent animate-none"
                        />
                        <input 
                          type="text" 
                          value={blockBgColor}
                          onChange={(e) => setBlockBgColor(e.target.value)}
                          className="flex-1 py-1 px-2.5 h-8 bg-[#050505] border border-white/10 rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Color de texto de botón</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={blockTextColor}
                          onChange={(e) => setBlockTextColor(e.target.value)}
                          className="h-8 w-10 p-0 border border-white/10 rounded cursor-pointer bg-transparent animate-none"
                        />
                        <input 
                          type="text" 
                          value={blockTextColor}
                          onChange={(e) => setBlockTextColor(e.target.value)}
                          className="flex-1 py-1 px-2.5 h-8 bg-[#050505] border border-white/10 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: RASTREAR (SIMULATED AUDIT SUMMARY) */}
            {activeSubTab === 'rastrear' && (
              <motion.div
                key="rastrear-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Traffic summary card */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2 flex items-center justify-between">
                    <span>Telemetria de rendimiento</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-[#050505] border border-white/10 rounded-lg space-y-1 shadow">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tasa de escaneo</span>
                      <span className="text-sm font-mono font-bold text-white block">48,250</span>
                    </div>
                    <div className="p-3 bg-[#050505] border border-white/10 rounded-lg space-y-1 shadow">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">CTR de clics</span>
                      <span className="text-sm font-mono font-bold text-emerald-400 block">14.2%</span>
                    </div>
                    <div className="p-3 bg-[#050505] border border-white/10 rounded-lg space-y-1 shadow">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Conversiones</span>
                      <span className="text-sm font-mono font-bold text-white block">1,820</span>
                    </div>
                  </div>

                  {/* Device breakdown mock charts */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Dispositivos Utilizados</span>
                    
                    <div className="space-y-2">
                      {[
                        { name: 'Móvil', percent: 68, color: 'bg-[#00CFFF]' },
                        { name: 'Computadora', percent: 27, color: 'bg-white/40' },
                        { name: 'Tablet', percent: 5, color: 'bg-slate-700' }
                      ].map((dev) => (
                        <div key={dev.name} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-350">{dev.name}</span>
                            <span className="font-mono text-slate-500">{dev.percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#050505] rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full rounded-full ${dev.color}`} style={{ width: `${dev.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated Click stream log audits */}
                <div className="rounded-xl border border-white/10 bg-[#0c0c0d] p-5 space-y-4">
                  <h3 className="font-serif font-light text-sm text-[#00CFFF] border-b border-white/10 pb-2">Actividad de Acceso Reciente</h3>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { id: '1', date: 'Justo ahora', loc: 'Managua, NI', label: 'Clic en enlace principal', icon: Smartphone },
                      { id: '2', date: '2 min atras', loc: 'San Jose, CR', label: 'Clic en sitio web', icon: Monitor },
                      { id: '3', date: '5 min atras', loc: 'Panama, PA', label: 'Vista de banner', icon: Tablet },
                      { id: '4', date: '11 min atras', loc: 'Miami, US', label: 'Clic en sitio web', icon: Smartphone }
                    ].map((log) => {
                      const IconLog = log.icon;
                      return (
                        <div key={log.id} className="p-2.5 rounded bg-[#050505] border border-white/10 flex items-center justify-between gap-3 text-xs leading-none">
                          <div className="flex items-center gap-2">
                            <IconLog className="h-3.5 w-3.5 text-[#00CFFF]" />
                            <div>
                              <span className="text-white block font-medium">{log.label}</span>
                              <span className="text-[9px] text-slate-500 font-mono block mt-1">{log.loc}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-550 font-mono shrink-0">{log.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Notification save */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 text-xs font-semibold flex items-center gap-2"
              >
                <Check className="h-4 w-4 stroke-[3]" /> Página bio guardada y publicada correctamente.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: High Fidelity interactive iPhone Device simulator preview */}
        <div className="lg:col-span-5 flex justify-center sticky top-24">
          <div className="space-y-4 w-full max-w-[340px]">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4 text-[#00CFFF]" /> Vista previa</span>
              <span className="font-mono text-[10px]">Vista movil</span>
            </div>

            {/* Mobile Outer device shell case */}
            <div 
              className="relative aspect-[9/19] w-full rounded-[48px] bg-black ring-8 ring-[#1c1c1e] p-2 border border-white/15 shadow-2xl flex flex-col select-none overflow-hidden"
              style={{
                fontFamily: 
                  fontFamily === 'Playfair Display' ? '"Playfair Display", serif' : 
                  fontFamily === 'Inter' ? '"Inter", sans-serif' : 
                  fontFamily === 'Outfit' ? '"Outfit", sans-serif' : 
                  fontFamily === 'Courier Prime' ? '"Courier New", Courier, monospace' : 
                  'Georgia, serif'
              }}
            >
              {/* Dynamic camera notch cutout */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black z-30 flex items-center justify-center border border-white/5">
                <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-slate-900 border border-slate-800/10" />
                <div className="absolute right-8 h-1 w-1 rounded-full bg-slate-900 border border-slate-800/10" />
              </div>

              {/* Live Preview Container wrapper */}
              <div 
                className="flex-1 w-full rounded-[42px] px-5 py-9 flex flex-col justify-between overflow-y-auto relative z-10 scrollbar-none"
                style={{ 
                  backgroundColor: bgType === 'gradient' ? 'transparent' : backgroundColor,
                  backgroundImage: bgType === 'gradient' ? bgGradient : bgType === 'image' ? `url(${bgImageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Decorative overlay blur for luxury theme if color preset */}
                {themeName === 'luxury' && bgType === 'color' && (
                  <>
                    <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[50%] rounded-full bg-[#00CFFF]/15 blur-[55px] pointer-events-none" />
                    <div className="absolute bottom-[-1%] right-[-10%] w-[100%] h-[40%] rounded-full bg-[#006BFF]/10 blur-[60px] pointer-events-none" />
                  </>
                )}

                {/* Profile contents stack */}
                <div className="space-y-4 mt-3 flex flex-col items-center">
                  
                  {/* Top Social Handles placement if selected */}
                  {socialPlacement === 'principio' && (
                    <div className="flex items-center gap-3 py-1 flex-wrap justify-center mb-1">
                      {availableSocialTypes.map((soc) => {
                        const IconComponent = soc.icon;
                        const hasHandle = activeSocials[soc.id];
                        if (!hasHandle) return null;

                        return (
                          <motion.a 
                            key={soc.id}
                            href="#" 
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full ${
                              socialIconColor === 'negro' 
                                ? 'bg-black text-white' 
                                : socialIconColor === 'blanco' 
                                  ? 'bg-white/10 text-white hover:bg-white/20' 
                                  : 'bg-[#00CFFF]/10 text-[#00CFFF]'
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </motion.a>
                        );
                      })}
                    </div>
                  )}

                  {/* Avatar wrapper */}
                  <div className="flex justify-center">
                    <InitialsAvatar
                      name={displayName}
                      email={email}
                      imageUrl={avatarUrl}
                      size="lg"
                    />
                  </div>

                  {/* Profile title & slogan */}
                  <div className="space-y-1 text-center">
                    <h4 
                      className="font-bold text-sm tracking-wide leading-tight"
                      style={{ color: titleColor }}
                    >
                      {displayName || 'Mi perfil JAH Link'}
                    </h4>
                    <p 
                      className="text-[10px] font-light leading-relaxed max-w-[210px] mx-auto opacity-90"
                      style={{ color: bioColor }}
                    >
                      {bio || 'Conecta tus enlaces, redes y recursos en un solo lugar.'}
                    </p>
                  </div>
                </div>

                {/* Middle Section: Links list and nested Image blocks rendering */}
                <div className="space-y-3 pt-6 pb-6 flex-1 flex flex-col justify-start">
                  
                  {blocks.filter(b => b.active).map((block) => {
                    // Border settings based on button roundness
                    const roundnessClass = 
                      buttonRoundness === 'pill' ? 'rounded-full' :
                      buttonRoundness === 'squared' ? 'rounded-none' :
                      buttonRoundness === 'outline' ? 'rounded-lg' : 'rounded-xl';

                    // Shadow class based on aesthetics configuration
                    const shadowStyle = 
                      buttonShadow === 'delgado' ? 'border border-white/10 shadow-sm' :
                      buttonShadow === '3D' ? 'border border-black shadow-[4px_4px_0px_#000000]' : 'none';

                    // Style image banner block vs text redirect links
                    if (block.type === 'image') {
                      return (
                        <motion.a
                          key={block.id}
                          href="#"
                          whileTap={{ scale: 0.98 }}
                          className={`block overflow-hidden relative group/banner ${roundnessClass} border border-white/10 focus:outline-none`}
                        >
                          <div className="aspect-[21/9] w-full relative">
                            <img 
                              src={block.imageUrl || '/brand/jah-link-logo.png'} 
                              alt={block.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/banner:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2.5">
                              <span className="font-sans font-bold text-[10px] text-white tracking-wide block truncate">
                                {block.title}
                              </span>
                            </div>
                          </div>
                        </motion.a>
                      );
                    }

                    return (
                      <motion.a
                        key={block.id}
                        href="#"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-3.5 text-center cursor-pointer select-none transition-all block relative ${roundnessClass}`}
                        style={{
                          backgroundColor: buttonRoundness === 'outline' ? 'transparent' : blockBgColor,
                          border: buttonRoundness === 'outline' ? `1.5px solid ${blockTextColor}` : 'none',
                          color: blockTextColor,
                          boxShadow: buttonShadow === '3D' ? `3px 3px 0px ${backgroundColor === '#1a1a1c' ? '#000000' : '#1e1a10'}` : buttonShadow === 'delgado' ? '0px 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        <span className="flex items-center justify-between">
                          <span className="w-3" /> {/* Empty buffer */}
                          <span className="text-[11px] font-semibold tracking-wide truncate max-w-[150px]">
                            {block.title || 'Destino de marca'}
                          </span>
                          <ArrowUpRight className="h-3 w-3 opacity-60 shrink-0" />
                        </span>
                        
                        {block.description && (
                          <span className="text-[8px] opacity-75 block text-center mt-1 truncate">
                            {block.description}
                          </span>
                        )}
                      </motion.a>
                    );
                  })}

                  {blocks.filter(b => b.active).length === 0 && (
                    <p className="text-[10px] text-slate-500 font-light select-none italic text-center py-4">
                      No hay enlaces activos actualmente.
                    </p>
                  )}
                </div>

                {/* Bottom section: social networks + watermark */}
                <div className="space-y-4">
                  {/* Bottom Social Handles placement if selected */}
                  {socialPlacement === 'final' && (
                    <div className="flex items-center gap-3 py-1 flex-wrap justify-center">
                      {availableSocialTypes.map((soc) => {
                        const IconComponent = soc.icon;
                        const hasHandle = activeSocials[soc.id];
                        if (!hasHandle) return null;

                        return (
                          <motion.a 
                            key={soc.id}
                            href="#" 
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full ${
                              socialIconColor === 'negro' 
                                ? 'bg-black text-white' 
                                : socialIconColor === 'blanco' 
                                  ? 'bg-white/10 text-white hover:bg-white/20' 
                                  : 'bg-[#00CFFF]/10 text-[#00CFFF]'
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </motion.a>
                        );
                      })}
                    </div>
                  )}

                  {/* Powered stamp watermark */}
                  <div className="text-center text-[9px] uppercase tracking-wider opacity-60">
                    <span className="text-slate-400 font-light">Creado con </span>
                    <span className="font-bold text-[#00CFFF]">JAH Link</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

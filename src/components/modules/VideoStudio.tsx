import { useState, useCallback } from 'react';
import { Film, Image, Music, Upload, Search, Save, Play, Sparkles, Trash2, Type, Mic, Monitor, Smartphone, RefreshCw, AlertTriangle, Check, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getPlatformConfig, formatNumber, generateId } from '@/lib/utils';
import type { PlatformId, VideoAspectRatio } from '@/types';

interface VideoTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  views: string;
  description: string;
}

const TEMPLATES: VideoTemplate[] = [
  { id: 'growth', name: 'Croissance', icon: '📈', color: 'from-emerald-500 to-cyan-400', views: '5.2M', description: 'Parle de ta progression' },
  { id: 'money', name: 'Argent', icon: '💰', color: 'from-yellow-400 to-orange-500', views: '3.8M', description: 'Astuces et revenus' },
  { id: 'tuto', name: 'Tutoriel', icon: '🎓', color: 'from-blue-500 to-purple-500', views: '2.9M', description: 'Enseigne quelque chose' },
  { id: 'humor', name: 'Humour', icon: '😂', color: 'from-amber-400 to-red-500', views: '4.5M', description: 'Vidéo drôle et légère' },
  { id: 'motivation', name: 'Motivation', icon: '🔥', color: 'from-orange-400 to-pink-500', views: '3.1M', description: 'Discours inspirant' },
  { id: 'daylife', name: 'Quotidien', icon: '☀️', color: 'from-cyan-400 to-blue-500', views: '2.2M', description: 'Montre ton daily life' },
];

const FORMATS: { id: VideoAspectRatio; label: string; icon: string; platforms: string }[] = [
  { id: '9:16', label: '9:16 TikTok', icon: '📱', platforms: 'TikTok, Instagram Reels, Shorts' },
  { id: '16:9', label: '16:9 YouTube', icon: '🖥️', platforms: 'YouTube, Facebook' },
  { id: '1:1', label: '1:1 Instagram', icon: '📐', platforms: 'Instagram Feed' },
  { id: '4:5', label: '4:5 Portrait', icon: '📱', platforms: 'Facebook, LinkedIn' },
];

export default function VideoStudio() {
  const { connectedAccounts, videoProjects, addProject } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [videoText, setVideoText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ url: string; title: string; author: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [audioFile, setAudioFile] = useState<{ name: string; size: string } | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const tiktokAccount = connectedAccounts.find(a => a.platform === 'tiktok');
  const cfg = tiktokAccount ? getPlatformConfig(tiktokAccount.platform) : getPlatformConfig('tiktok');

  const handleSearchPexels = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    try {
      const { PexelsService } = await import('@/services/nexusApi');
      const results = await PexelsService.searchVideos(searchQuery);
      setSearchResults(results.slice(0, 8).map((r: any) => ({
        url: r.video_files?.[0]?.link ?? String(r.image ?? ''),
        title: String(r.url ?? searchQuery),
        author: String(r.user?.name ?? 'Pexels'),
      })));
    } catch {
      setSearchResults(Array.from({ length: 4 }, (_, i) => ({
        url: '',
        title: `${searchQuery} - Résultat ${i + 1}`,
        author: 'Pexels',
      })));
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleFileUpload = useCallback((type: 'video' | 'audio') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    if (type === 'video') setVideoFile({ name: file.name, size });
    else setAudioFile({ name: file.name, size });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!tiktokAccount) { setError('Connecte d\'abord ton compte TikTok'); return; }
    setGenerating(true);
    setError('');
    try {
      const project = {
        id: generateId(),
        name: selectedTemplate ? `Template ${selectedTemplate}` : `Vidéo ${new Date().toLocaleDateString()}`,
        platform: 'tiktok' as PlatformId,
        aspectRatio,
        duration: 30,
        tracks: [
          { id: generateId(), type: 'video' as any, clips: [{ id: generateId(), assetId: generateId(), startTime: 0, endTime: 30, text: videoText }], label: 'Piste vidéo' },
          ...(audioFile ? [{ id: generateId(), type: 'audio' as any, clips: [{ id: generateId(), assetId: generateId(), startTime: 0, endTime: 30 }], label: 'Audio' }] : []),
        ],
        assets: [],
        thumbnailUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProject(project);
      setSuccess(`✅ Projet "${project.name}" créé avec succès ! Prêt à être exporté.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Erreur lors de la création du projet');
    } finally {
      setGenerating(false);
    }
  }, [tiktokAccount, selectedTemplate, aspectRatio, videoText, audioFile, addProject]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio vidéo</h1>
          <p className="text-sm text-gray-400 mt-1">Crée des vidéos pour TON compte TikTok</p>
        </div>
        {tiktokAccount && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
            <span className="text-base">{cfg.icon}</span>
            <span className="text-xs font-medium text-white">@{tiktokAccount.username}</span>
          </div>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <Check size={14} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {!tiktokAccount ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-lg font-semibold text-white mb-2">Connecte ton compte TikTok</h3>
          <p className="text-sm text-gray-500">Va dans "Connexion" pour ajouter ton compte</p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">🎬 Templates populaires</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
                  className={`rounded-xl border p-4 text-center transition-all ${selectedTemplate === t.id ? `border-white/30 bg-gradient-to-br ${t.color} bg-opacity-20` : 'border-white/5 bg-gray-900/60 hover:border-white/10'}`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-xs text-white font-medium">{t.name}</div>
                  <div className={`text-2xs mt-1 ${selectedTemplate === t.id ? 'text-white/70' : 'text-gray-600'}`}>{t.views}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Film size={14} /> Ma vidéo</h3>

                <div className="w-full aspect-[9/16] max-w-[250px] mx-auto rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex flex-col items-center justify-center gap-3 p-6">
                  {videoFile ? (
                    <div className="text-center">
                      <Film size={32} className="text-cyan-400 mx-auto mb-2" />
                      <div className="text-xs text-white">{videoFile.name}</div>
                      <div className="text-2xs text-gray-500">{videoFile.size}</div>
                      <button onClick={() => setVideoFile(null)} className="mt-2 text-2xs text-red-400 hover:underline">Supprimer</button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-600" />
                      <label className="flex flex-col items-center gap-1 cursor-pointer">
                        <span className="text-xs text-gray-400">Importe ta vidéo</span>
                        <span className="text-2xs text-gray-600">MP4, MOV, AVI</span>
                        <input type="file" accept="video/*" onChange={handleFileUpload('video')} className="hidden" />
                      </label>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Texte à afficher</label>
                  <textarea value={videoText} onChange={e => setVideoText(e.target.value)} rows={3} placeholder="Le texte qui apparaîtra sur ta vidéo..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Rechercher des assets vidéo (Pexels)</label>
                  <div className="flex gap-2">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Ex: marketing, nature, tech..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleSearchPexels()}
                    />
                    <button onClick={handleSearchPexels} disabled={searching}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <Search size={14} className={searching ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {searchResults.map((r, i) => (
                        <div key={i} className="aspect-[9/16] rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center">
                          <span className="text-2xs text-gray-500 text-center px-1">{r.title.slice(0, 25)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Music size={14} /> Audio</h3>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 p-3 rounded-xl border ${audioFile ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/5'} text-center`}>
                    {audioFile ? (
                      <div>
                        <Music size={16} className="text-emerald-400 mx-auto mb-1" />
                        <div className="text-xs text-white">{audioFile.name}</div>
                        <button onClick={() => setAudioFile(null)} className="text-2xs text-red-400 hover:underline mt-1">Retirer</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-1">
                        <Music size={16} className="text-gray-500" />
                        <span className="text-2xs text-gray-500">Importer un fichier</span>
                        <input type="file" accept="audio/*" onChange={handleFileUpload('audio')} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 p-3 rounded-xl border border-white/5 bg-white/5 text-center cursor-not-allowed opacity-50">
                    <Mic size={16} className="text-gray-500 mx-auto mb-1" />
                    <span className="text-2xs text-gray-500">Enregistrer voix</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">📐 Format d'export</h3>
                <div className="space-y-2">
                  {FORMATS.map(f => (
                    <button key={f.id} onClick={() => setAspectRatio(f.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${aspectRatio === f.id ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <div>
                        <div className="text-xs text-white font-medium">{f.label}</div>
                        <div className="text-2xs text-gray-500">{f.platforms}</div>
                      </div>
                      {aspectRatio === f.id && <Check size={14} className="text-cyan-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-cyan-500/10 border border-white/5 p-5">
                <h3 className="text-xs font-semibold text-white mb-3">💾 Projets sauvegardés</h3>
                {videoProjects.length === 0 ? (
                  <p className="text-2xs text-gray-500 text-center py-4">Aucun projet pour le moment</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {videoProjects.slice().reverse().map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <Film size={12} className="text-cyan-400" />
                        <span className="text-2xs text-gray-300 truncate flex-1">{p.name}</span>
                        <span className="text-2xs text-gray-600">{p.aspectRatio}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleGenerate} disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-pink-500/20"
              >
                <Sparkles size={16} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Création...' : '🎬 Créer ma vidéo'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

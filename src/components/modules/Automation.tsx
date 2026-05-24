import { useState, useCallback, useEffect, useRef } from 'react';
import { Heart, Eye, Upload, Play, Pause, RefreshCw, Settings, Users, ThumbsUp, Activity, Zap, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getPlatformConfig, formatNumber } from '@/lib/utils';

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl bg-gray-900/60 border border-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function BoostControls({ onStart, onStop, onSync, isBoosting }: { onStart: () => void; onStop: () => void; onSync: () => void; isBoosting: boolean }) {
  const [intervalSec, setIntervalSec] = useState(5);
  const [viewsPerVideo, setViewsPerVideo] = useState(10);
  const [autoLikeNew, setAutoLikeNew] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-400" />
          <span className="text-sm font-semibold text-white">Actions de boost</span>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
          <Settings size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-all">
          <Heart size={20} className="text-pink-400" />
          <span className="text-xs text-gray-300 font-medium">Auto-Like</span>
          <span className="text-2xs text-gray-500">Mes vidéos</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all">
          <Eye size={20} className="text-cyan-400" />
          <span className="text-xs text-gray-300 font-medium">Auto-Vue</span>
          <span className="text-2xs text-gray-500">Incrémente vues</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
          <Upload size={20} className="text-emerald-400" />
          <span className="text-xs text-gray-300 font-medium">Auto-Publie</span>
          <span className="text-2xs text-gray-500">Programmer</span>
        </button>
      </div>

      {showSettings && (
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Intervalle entre vues</label>
            <select value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value))} className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white">
              <option value={3}>3 secondes</option>
              <option value={5}>5 secondes</option>
              <option value={10}>10 secondes</option>
              <option value={30}>30 secondes</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Vues par vidéo</label>
            <select value={viewsPerVideo} onChange={e => setViewsPerVideo(Number(e.target.value))} className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white">
              <option value={5}>5 vues</option>
              <option value={10}>10 vues</option>
              <option value={25}>25 vues</option>
              <option value={50}>50 vues</option>
            </select>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400">Auto-like des nouvelles vidéos</span>
            <button onClick={() => setAutoLikeNew(!autoLikeNew)} className={`w-10 h-5 rounded-full transition-colors ${autoLikeNew ? 'bg-pink-500' : 'bg-white/10'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoLikeNew ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button onClick={onStart} disabled={isBoosting} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
          <Play size={14} /> Lancer
        </button>
        <button onClick={onStop} disabled={!isBoosting} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium disabled:opacity-30 hover:opacity-90 transition-opacity">
          <Pause size={14} /> Pause
        </button>
        <button onClick={onSync} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors">
          <RefreshCw size={14} /> Sync
        </button>
      </div>
    </div>
  );
}

export default function Automation() {
  const { connectedAccounts, liveMetrics, updateLiveMetrics } = useAppStore();
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostLog, setBoostLog] = useState<string[]>([]);
  const boostInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState('');

  const tiktokAccount = connectedAccounts.find(a => a.platform === 'tiktok');
  const cfg = tiktokAccount ? getPlatformConfig(tiktokAccount.platform) : getPlatformConfig('tiktok');

  const handleStartBoost = useCallback(async () => {
    if (!tiktokAccount) { setError('Connecte d\'abord ton compte TikTok'); return; }

    if (!tiktokAccount.accessToken) {
      setError('Autorisation OAuth requise. Clique sur "Connecter TikTok OAuth" pour autoriser l\'application.');
      return;
    }

    setIsBoosting(true);
    setError('');
    setBoostLog(prev => [...prev, '🚀 Boost TikTok activé avec OAuth']);

    try {
      const { TikTokAPI } = await import('@/services/nexusApi');
      await TikTokAPI.like('', tiktokAccount.accessToken);
      setBoostLog(prev => [...prev.slice(-19), '✅ Action OAuth TikTok exécutée']);
    } catch (err) {
      setBoostLog(prev => [...prev.slice(-19), `❌ Erreur OAuth: ${err instanceof Error ? err.message.slice(0, 80) : 'inconnue'}`]);
      setIsBoosting(false);
    }
  }, [tiktokAccount]);

  const handleStopBoost = useCallback(() => {
    if (boostInterval.current) clearInterval(boostInterval.current);
    setIsBoosting(false);
  }, []);

  const handleSync = useCallback(async () => {
    if (!tiktokAccount) return;
    setBoostLog(prev => [...prev, '🔄 Synchronisation des métriques...']);
    try {
      const { SocialDataService } = await import('@/services/nexusApi');
      const fresh = await SocialDataService.getUserInfo('tiktok', tiktokAccount.username);
      updateLiveMetrics({ followers: fresh.followers, likes: fresh.likes, following: fresh.following, posts: fresh.posts });
      setBoostLog(prev => [...prev.slice(-19), `✅ Sync terminée : ${formatNumber(fresh.followers)} followers`]);
    } catch {
      setBoostLog(prev => [...prev.slice(-19), '❌ Erreur de synchronisation']);
    }
  }, [tiktokAccount, updateLiveMetrics]);

  useEffect(() => {
    return () => { if (boostInterval.current) clearInterval(boostInterval.current); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Booster mon compte</h1>
          <p className="text-sm text-gray-400 mt-1">Automatise les actions sur TES vidéos TikTok</p>
        </div>
        {tiktokAccount && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isBoosting ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
            <div className={`w-2 h-2 rounded-full ${isBoosting ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className={`text-xs font-medium ${isBoosting ? 'text-emerald-400' : 'text-gray-500'}`}>{isBoosting ? 'Boost actif' : 'Inactif'}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {!tiktokAccount ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold text-white mb-2">Connecte ton compte TikTok</h3>
          <p className="text-sm text-gray-500">Va dans l'onglet "Connexion" pour ajouter ton compte TikTok</p>
        </div>
      ) : !tiktokAccount.accessToken ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔑</div>
          <h3 className="text-lg font-semibold text-white mb-2">Autorisation OAuth requise</h3>
          <p className="text-sm text-gray-400 mb-6">Pour utiliser le boost automatique, tu dois autoriser l'application via TikTok.</p>
          <button
            onClick={async () => {
              try {
                const { TikTokOAuthService } = await import('@/services/nexusApi');
                const authUrl = await TikTokOAuthService.getAuthUrl();
                window.open(authUrl, '_blank', 'width=600,height=800');
              } catch (e) {
                setError('Impossible de contacter le serveur OAuth. Vérifie que server.py est lancé.');
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={16} /> Connecter TikTok OAuth
          </button>
          <p className="text-2xs text-gray-600 mt-4">Une fenêtre TikTok s'ouvrira pour autoriser l'application.<br/>(Nécessite server.py lancé sur le port 8000)</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Followers" value={formatNumber(tiktokAccount.followers)} icon={<Users size={16} />} color="bg-pink-500/20 text-pink-400" />
            <StatCard label="Likes reçus" value={formatNumber(liveMetrics?.likes ?? tiktokAccount.likes)} icon={<ThumbsUp size={16} />} color="bg-cyan-500/20 text-cyan-400" />
            <StatCard label="Vues totales" value={formatNumber(tiktokAccount.likes * 3)} icon={<Eye size={16} />} color="bg-emerald-500/20 text-emerald-400" />
            <StatCard label="Vidéos" value={formatNumber(tiktokAccount.posts)} icon={<Activity size={16} />} color="bg-purple-500/20 text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <p className="text-sm text-gray-400">Connecte-toi via OAuth TikTok pour accéder à la liste de tes vidéos et activer le boost automatique.</p>
              <BoostControls onStart={handleStartBoost} onStop={handleStopBoost} onSync={handleSync} isBoosting={isBoosting} />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">Journal de synchronisation</span>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {boostLog.length === 0 ? (
                    <p className="text-2xs text-gray-600 text-center py-8">Aucune action pour le moment.<br />Utilise le bouton Sync pour actualiser tes métriques.</p>
                  ) : (
                    boostLog.map((log, i) => (
                      <div key={i} className="text-2xs text-gray-400 py-1 border-b border-white/5 last:border-0">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

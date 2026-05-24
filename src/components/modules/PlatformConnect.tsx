import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Trash2, CheckCircle, XCircle, ExternalLink, Search, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SocialDataService } from '@/services/nexusApi';
import { getPlatformConfig, formatNumber, timeAgo, calculateEngagementRate, generateId } from '@/lib/utils';
import type { PlatformId, ConnectedAccount, SocialUserInfo } from '@/types';
import type { FallbackAttempt } from '@/services/fallback/FallbackEngine';

const PLATFORMS: PlatformId[] = ['tiktok', 'instagram', 'twitter', 'youtube', 'facebook', 'linkedin'];

// ─── Add Account Modal ────────────────────────────────────────────────────────

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: (account: ConnectedAccount) => void;
}

function FallbackProgress({ attempts }: { attempts: FallbackAttempt[] }) {
  return (
    <div className="space-y-1.5">
      {attempts.map((a, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {a.status === 'pending' ? (
            <Loader2 size={12} className="text-cyan-400 animate-spin flex-shrink-0" />
          ) : a.status === 'success' ? (
            <Check size={12} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <X size={12} className="text-red-400 flex-shrink-0" />
          )}
          <span className={a.status === 'success' ? 'text-emerald-300' : a.status === 'pending' ? 'text-cyan-300' : 'text-gray-500'}>
            {a.method}
          </span>
          {a.error && <span className="text-gray-600 truncate max-w-[200px]">— {a.error}</span>}
        </div>
      ))}
    </div>
  );
}

function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
  const [platform, setPlatform] = useState<PlatformId>('tiktok');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('CM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<FallbackAttempt[]>([]);

  const handleConnect = async () => {
    if (!username.trim()) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }
    setLoading(true);
    setError('');
    setAttempts([]);
    try {
      const clean = username.replace(/^@/, '').trim();
      const info = await SocialDataService.getUserInfo(platform, clean, (att) => {
        setAttempts(prev => {
          const idx = prev.findIndex(a => a.level === att.level && a.method === att.method);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = att;
            return next;
          }
          return [...prev, att];
        });
      });
      const engagement = calculateEngagementRate(info.likes, info.followers, info.posts);

      const account: ConnectedAccount = {
        id: generateId(),
        platform,
        username: info.username,
        displayName: info.displayName,
        avatarUrl: info.avatarUrl,
        followers: info.followers,
        following: info.following,
        likes: info.likes,
        posts: info.posts,
        verified: info.verified,
        profileUrl: info.profileUrl,
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        region,
        engagement,
        historicalFollowers: [{ date: new Date().toISOString().split('T')[0], count: info.followers }],
      };

      onSuccess(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const cfg = getPlatformConfig(platform);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Connecter un compte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Plateforme</label>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(p => {
              const c = getPlatformConfig(p);
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    platform === p
                      ? `border-white/30 bg-gradient-to-br ${c.gradient} bg-opacity-20`
                      : 'border-white/5 bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="text-xl mb-1">{c.icon}</div>
                  <div className="text-xs text-white font-medium">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Nom d'utilisateur</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder={`username ${cfg.name}`}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Région (pour le CPM)</label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          >
            <option value="CM">🇨🇲 Cameroun (CM)</option>
            <option value="FR">🇫🇷 France (FR)</option>
            <option value="US">🇺🇸 États-Unis (US)</option>
            <option value="GB">🇬🇧 Royaume-Uni (GB)</option>
            <option value="DE">🇩🇪 Allemagne (DE)</option>
          </select>
        </div>

        {loading && attempts.length > 0 && (
          <div className="p-3 rounded-xl bg-gray-800 border border-white/10">
            <p className="text-xs text-gray-400 mb-2">🔍 Recherche de compte en cours...</p>
            <FallbackProgress attempts={attempts} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle size={12} />
          Le compte doit être public pour être analysé via l'API.
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${cfg.gradient} text-white text-sm font-medium transition-opacity disabled:opacity-60 flex items-center justify-center gap-2`}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? 'Recherche...' : 'Connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: ConnectedAccount;
  onSync: (id: string) => void;
  onRemove: (id: string) => void;
  syncingId: string | null;
}

function AccountCard({ account, onSync, onRemove, syncingId }: AccountCardProps) {
  const cfg = getPlatformConfig(account.platform);
  const isSyncing = syncingId === account.id;

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-white/10 transition-all overflow-hidden">
      {/* Header gradient */}
      <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt={account.displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-2xl`}>
                {cfg.icon}
              </div>
            )}
            {account.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <CheckCircle size={10} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">{account.displayName}</span>
              <div className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} bg-opacity-20 text-white font-medium`}>
                {cfg.icon} {cfg.name}
              </div>
            </div>
            <div className="text-sm text-gray-400">@{account.username}</div>
            <div className="text-xs text-gray-600 mt-1">Connecté {timeAgo(account.connectedAt)}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={() => onSync(account.id)}
              disabled={isSyncing}
              className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => onRemove(account.id)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Abonnés', value: formatNumber(account.followers) },
            { label: 'Suivis', value: formatNumber(account.following) },
            { label: 'Likes', value: formatNumber(account.likes) },
            { label: 'Posts', value: formatNumber(account.posts) },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="text-sm font-bold text-white">{m.value}</div>
              <div className="text-xs text-gray-600">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Engagement bar */}
        {account.engagement !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Taux d'engagement</span>
              <span className={`font-medium ${account.engagement >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {account.engagement.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all`}
                style={{ width: `${Math.min(account.engagement * 10, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Last sync */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
          <span>Région: {account.region || 'CM'}</span>
          <span>Sync: {timeAgo(account.lastSyncAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlatformConnect() {
  const { connectedAccounts, addAccount, removeAccount, syncAccount } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<PlatformId | 'all'>('all');
  const [error, setError] = useState('');

  const handleSuccess = useCallback(async (account: ConnectedAccount) => {
    await addAccount(account);
    setShowModal(false);
  }, [addAccount]);

  const handleSync = useCallback(async (id: string) => {
    setSyncingId(id);
    setError('');
    try {
      await syncAccount(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
    } finally {
      setSyncingId(null);
    }
  }, [syncAccount]);

  const handleRemove = useCallback(async (id: string) => {
    if (!window.confirm('Supprimer ce compte ? Cette action est irréversible.')) return;
    await removeAccount(id);
  }, [removeAccount]);

  const filtered = filterPlatform === 'all'
    ? connectedAccounts
    : connectedAccounts.filter(a => a.platform === filterPlatform);

  const platformCounts = PLATFORMS.reduce((acc, p) => {
    acc[p] = connectedAccounts.filter(a => a.platform === p).length;
    return acc;
  }, {} as Record<PlatformId, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comptes connectés</h1>
          <p className="text-sm text-gray-400 mt-1">
            {connectedAccounts.length} compte{connectedAccounts.length !== 1 ? 's' : ''} sur {PLATFORMS.length} plateformes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
        >
          <Plus size={14} />
          Connecter
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Platform filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterPlatform('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filterPlatform === 'all'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tous ({connectedAccounts.length})
        </button>
        {PLATFORMS.map(p => {
          const cfg = getPlatformConfig(p);
          const count = platformCounts[p] ?? 0;
          return (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filterPlatform === p
                  ? `bg-gradient-to-r ${cfg.gradient} text-white`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cfg.icon} {cfg.name}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterPlatform === p ? 'bg-white/20' : 'bg-white/10'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Accounts Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucun compte connecté</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Connectez vos comptes sociaux pour commencer à gérer, automatiser et monétiser votre présence en ligne.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Connecter mon premier compte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onSync={handleSync}
              onRemove={handleRemove}
              syncingId={syncingId}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <AddAccountModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
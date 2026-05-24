import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, Target, Zap, RefreshCw, CheckCircle, Circle, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AIService, SupabaseService } from '@/services/nexusApi';
import { getPlatformConfig, formatNumber, formatDate, calculateGrowthRate, projectFollowers, generateId } from '@/lib/utils';
import type { PlatformId, GrowthMilestone } from '@/types';

// ─── Milestone progress bar ────────────────────────────────────────────────────

function MilestoneCard({ milestone }: { milestone: GrowthMilestone }) {
  const cfg = getPlatformConfig(milestone.platform);
  const pct = Math.min(100, Math.round((milestone.current / milestone.target) * 100));

  return (
    <div className={`rounded-2xl border p-4 transition-all ${milestone.achieved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-900/60 border-white/5'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.icon}</span>
          <div>
            <div className="text-sm font-semibold text-white">{formatNumber(milestone.target)} abonnés</div>
            <div className="text-xs text-gray-500">{cfg.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {milestone.achieved ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle size={10} />
              Atteint
            </span>
          ) : (
            <span className="text-xs text-gray-500">{pct}%</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatNumber(milestone.current)}</span>
          <span>{formatNumber(milestone.target)}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${cfg.gradient}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {milestone.achieved && milestone.achievedAt && (
        <div className="mt-2 text-xs text-emerald-400">Atteint le {formatDate(milestone.achievedAt)}</div>
      )}
      {!milestone.achieved && (
        <div className="mt-2 text-xs text-gray-600">
          {formatNumber(milestone.target - milestone.current)} restants
        </div>
      )}
    </div>
  );
}

// ─── Projection Card ──────────────────────────────────────────────────────────

function ProjectionCard({
  platform,
  current,
  dailyRate,
  username,
}: {
  platform: PlatformId;
  current: number;
  dailyRate: number;
  username: string;
}) {
  const cfg = getPlatformConfig(platform);
  const in30 = projectFollowers(current, dailyRate, 30)[29] ?? current;
  const in90 = projectFollowers(current, dailyRate, 90)[89] ?? current;
  const in365 = projectFollowers(current, dailyRate, 365)[364] ?? current;

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm`}>
          {cfg.icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">@{username}</div>
          <div className="text-xs text-gray-500">{cfg.name} · Taux: {dailyRate >= 0 ? '+' : ''}{dailyRate.toFixed(2)}%/j</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '+30 jours', value: in30, diff: in30 - current },
          { label: '+90 jours', value: in90, diff: in90 - current },
          { label: '+1 an', value: in365, diff: in365 - current },
        ].map((p, i) => (
          <div key={i} className="text-center p-2 rounded-xl bg-white/5">
            <div className={`text-sm font-bold ${cfg.textColor}`}>{formatNumber(p.value)}</div>
            <div className="text-xs text-gray-500">{p.label}</div>
            <div className={`text-xs mt-0.5 ${p.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {p.diff >= 0 ? '+' : ''}{formatNumber(p.diff)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Strategy Recommendation ───────────────────────────────────────────────────

interface Strategy {
  id: string;
  title: string;
  description: string;
  platform: PlatformId | 'all';
  impact: 'high' | 'medium' | 'low';
  enabled: boolean;
}

const BASE_STRATEGIES: Omit<Strategy, 'id' | 'enabled'>[] = [
  { title: 'Publier aux heures de pointe', description: 'Postez entre 18h–21h et 7h–9h pour maximiser la portée organique.', platform: 'all', impact: 'high' },
  { title: 'Reels Instagram quotidiens', description: 'Publiez 1 Reel par jour avec des hashtags ciblés pour booster l\'algorithme.', platform: 'instagram', impact: 'high' },
  { title: 'Shorts YouTube réguliers', description: 'Créez des Shorts de 30–60 secondes 3×/semaine pour attirer de nouveaux abonnés.', platform: 'youtube', impact: 'high' },
  { title: 'Collaborations croisées', description: 'Faites des duos/collabs avec des créateurs dans votre niche (+20% reach moyen).', platform: 'all', impact: 'medium' },
  { title: 'Répliquer les tendances TikTok', description: 'Identifiez les sons viraux et adaptez-les à votre niche dans les 48h.', platform: 'tiktok', impact: 'high' },
  { title: 'Threads Twitter réguliers', description: 'Publiez des threads éducatifs 3×/semaine pour maximiser les impressions.', platform: 'twitter', impact: 'medium' },
  { title: 'LinkedIn le mardi et jeudi', description: 'Postez en B2B les mardi et jeudi entre 8h–10h pour un meilleur engagement.', platform: 'linkedin', impact: 'medium' },
  { title: 'Engage avec les commentaires', description: 'Répondez à tous les commentaires dans les 2 premières heures après publication.', platform: 'all', impact: 'high' },
  { title: 'Stories interactives', description: 'Utilisez les sondages, quiz et questions pour booster l\'engagement des Stories.', platform: 'instagram', impact: 'medium' },
  { title: 'Groupes Facebook actifs', description: 'Partagez votre contenu dans 3–5 groupes thématiques Facebook par semaine.', platform: 'facebook', impact: 'low' },
];

function StrategyItem({
  strategy,
  onToggle,
}: {
  strategy: Strategy;
  onToggle: (id: string) => void;
}) {
  const cfg = strategy.platform !== 'all' ? getPlatformConfig(strategy.platform as PlatformId) : null;
  const impactColors = { high: 'text-emerald-400 bg-emerald-500/10', medium: 'text-amber-400 bg-amber-500/10', low: 'text-blue-400 bg-blue-500/10' };
  const impactLabels = { high: 'Impact élevé', medium: 'Impact moyen', low: 'Impact faible' };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${strategy.enabled ? 'border-white/10 bg-gray-900/60' : 'border-white/5 bg-gray-900/30 opacity-60'}`}>
      <button onClick={() => onToggle(strategy.id)} className="mt-0.5 flex-shrink-0">
        {strategy.enabled
          ? <CheckCircle size={18} className="text-cyan-400" />
          : <Circle size={18} className="text-gray-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{strategy.title}</span>
          {cfg && <span className="text-xs">{cfg.icon}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full ${impactColors[strategy.impact]}`}>
            {impactLabels[strategy.impact]}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{strategy.description}</p>
      </div>
    </div>
  );
}

// ─── AI Strategy Panel ─────────────────────────────────────────────────────────

function AIStrategyPanel({ platform, followers, growthRate }: { platform: PlatformId; followers: number; growthRate: number }) {
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AIService.generateStrategy(platform, followers, growthRate);
      setStrategy(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">Stratégie IA personnalisée</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
          {loading ? 'Génération...' : 'Générer'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-3">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {strategy ? (
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/5 rounded-xl p-4">
          {strategy}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-600 text-sm">
          Cliquez sur "Générer" pour obtenir une stratégie personnalisée basée sur vos métriques réelles.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Growth() {
  const { connectedAccounts, milestones, addMilestone, updateMilestone, loadMilestones } = useAppStore();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | 'all'>('all');
  const [strategies, setStrategies] = useState<Strategy[]>(() =>
    BASE_STRATEGIES.map(s => ({ ...s, id: generateId(), enabled: s.impact === 'high' }))
  );

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  // Auto-create milestones for each connected account
  useEffect(() => {
    const createMilestones = async () => {
      for (const acc of connectedAccounts) {
        const cfg = getPlatformConfig(acc.platform);
        for (const target of cfg.milestones) {
          const existing = milestones.find(
            m => m.accountId === acc.id && m.target === target
          );
          if (!existing) {
            const milestone: GrowthMilestone = {
              id: generateId(),
              platform: acc.platform,
              accountId: acc.id,
              target,
              current: acc.followers,
              achieved: acc.followers >= target,
              achievedAt: acc.followers >= target ? new Date().toISOString() : undefined,
            };
            await addMilestone(milestone);
          } else if (existing.current !== acc.followers) {
            await updateMilestone(existing.id, {
              current: acc.followers,
              achieved: acc.followers >= target,
              achievedAt: acc.followers >= target ? (existing.achievedAt ?? new Date().toISOString()) : undefined,
            });
          }
        }
      }
    };
    if (connectedAccounts.length > 0) createMilestones();
  }, [connectedAccounts]);

  const filteredAccounts = selectedPlatform === 'all'
    ? connectedAccounts
    : connectedAccounts.filter(a => a.platform === selectedPlatform);

  const filteredMilestones = useMemo(() => {
    if (selectedPlatform === 'all') return milestones;
    return milestones.filter(m => m.platform === selectedPlatform);
  }, [milestones, selectedPlatform]);

  const projections = useMemo(() => {
    return filteredAccounts.map(acc => {
      const history = acc.historicalFollowers ?? [];
      const last = history.length > 0 ? history[history.length - 1].count : 0;
      const first = history.length > 1 ? history[0].count : last;
      const dailyRate = calculateGrowthRate(last, first);
      return { account: acc, dailyRate };
    });
  }, [filteredAccounts]);

  const filteredStrategies = useMemo(() => {
    if (selectedPlatform === 'all') return strategies;
    return strategies.filter(s => s.platform === 'all' || s.platform === selectedPlatform);
  }, [strategies, selectedPlatform]);

  const toggleStrategy = useCallback((id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const uniquePlatforms = [...new Set(connectedAccounts.map(a => a.platform))];
  const achievedCount = milestones.filter(m => m.achieved).length;

  // Best account for AI strategy
  const bestAccount = connectedAccounts.reduce((best, acc) =>
    acc.followers > (best?.followers ?? 0) ? acc : best,
    connectedAccounts[0]
  );

  const bestGrowthRate = bestAccount
    ? (() => {
        const h = bestAccount.historicalFollowers ?? [];
        const l = h.length > 0 ? h[h.length - 1].count : 0;
        const f = h.length > 1 ? h[0].count : l;
        return calculateGrowthRate(l, f);
      })()
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Croissance</h1>
          <p className="text-sm text-gray-400 mt-1">
            {achievedCount} jalons atteints · {milestones.length - achievedCount} en cours
          </p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPlatform === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Toutes
        </button>
        {uniquePlatforms.map(p => {
          const cfg = getPlatformConfig(p);
          return (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPlatform === p ? `bg-gradient-to-r ${cfg.gradient} text-white` : 'text-gray-500 hover:text-gray-300'}`}
            >
              {cfg.icon} {cfg.name}
            </button>
          );
        })}
      </div>

      {connectedAccounts.length === 0 ? (
        <div className="text-center py-20">
          <Target size={40} className="text-gray-700 mx-auto mb-3" />
          <div className="text-gray-500">Connectez des comptes pour voir vos jalons de croissance</div>
        </div>
      ) : (
        <>
          {/* Milestones */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Jalons</h2>
            </div>
            {filteredMilestones.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">Aucun jalon pour cette plateforme</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMilestones
                  .sort((a, b) => a.target - b.target)
                  .map(m => <MilestoneCard key={m.id} milestone={m} />)}
              </div>
            )}
          </div>

          {/* Projections */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Projections de croissance</h2>
            </div>
            <div className="space-y-3">
              {projections.map(({ account, dailyRate }) => (
                <ProjectionCard
                  key={account.id}
                  platform={account.platform}
                  current={account.followers}
                  dailyRate={dailyRate}
                  username={account.username}
                />
              ))}
            </div>
          </div>

          {/* AI Strategy */}
          {bestAccount && (
            <AIStrategyPanel
              platform={bestAccount.platform}
              followers={bestAccount.followers}
              growthRate={bestGrowthRate}
            />
          )}

          {/* Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Recommandations</h2>
              </div>
              <span className="text-xs text-gray-500">
                {filteredStrategies.filter(s => s.enabled).length}/{filteredStrategies.length} activées
              </span>
            </div>
            <div className="space-y-2">
              {filteredStrategies.map(s => (
                <StrategyItem key={s.id} strategy={s} onToggle={toggleStrategy} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
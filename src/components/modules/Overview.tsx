import React, { useEffect, useMemo, useState } from 'react';
import { Users, Heart, Eye, TrendingUp, Zap, RefreshCw, Clock, BarChart3, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getPlatformConfig, formatNumber, formatCurrency, estimateMonthlyRevenue, getCPM, timeAgo, formatDateTime } from '@/lib/utils';
import type { PlatformId } from '@/types';

// ─── Sparkline mini chart ────────────────────────────────────────────────────

function Sparkline({ data, color = '#22d3ee' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
}

function KPICard({ label, value, sub, icon, gradient, trend, sparkData, sparkColor }: KPICardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900/60 border border-white/5 p-5 flex flex-col gap-3 backdrop-blur-sm hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-sm text-gray-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="opacity-60">
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

// ─── Platform summary row ─────────────────────────────────────────────────────

function PlatformRow({ platform, followers, engagement, posts }: {
  platform: PlatformId;
  followers: number;
  engagement: number;
  posts: number;
}) {
  const cfg = getPlatformConfig(platform);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/40 border border-white/5 hover:border-white/10 transition-colors">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{cfg.name}</div>
        <div className="text-xs text-gray-500">{posts} publications</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">{formatNumber(followers)}</div>
        <div className="text-xs text-gray-500">abonnés</div>
      </div>
      <div className="text-right w-16">
        <div className={`text-sm font-semibold ${engagement >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {engagement.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">engage</div>
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  const logs = useAppStore(s => s.automationLogs);
  const recent = logs.slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        Aucune activité récente. Configurez vos automations pour commencer.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map(log => {
        const cfg = getPlatformConfig(log.platform);
        return (
          <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/40 border border-white/5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div className="text-sm mr-1">{cfg.icon}</div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-300 truncate block">{log.message}</span>
              <span className="text-xs text-gray-600">{log.ruleName}</span>
            </div>
            <div className="text-xs text-gray-600 flex-shrink-0">{timeAgo(log.executedAt)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Overview() {
  const { connectedAccounts, syncAccount, lastSyncAt, isInitialized, automationRules, contentHistory, settings } = useAppStore();
  const [syncing, setSyncing] = useState(false);

  // Aggregate metrics across all platforms
  const totals = useMemo(() => {
    const totalFollowers = connectedAccounts.reduce((s, a) => s + a.followers, 0);
    const totalLikes = connectedAccounts.reduce((s, a) => s + a.likes, 0);
    const totalPosts = connectedAccounts.reduce((s, a) => s + a.posts, 0);
    const avgEngagement = connectedAccounts.length > 0
      ? connectedAccounts.reduce((s, a) => s + (a.engagement ?? 3), 0) / connectedAccounts.length
      : 0;
    const totalMonthlyRevenue = connectedAccounts.reduce((s, a) => {
      const cpm = getCPM(a.platform, a.region || 'CM');
      return s + estimateMonthlyRevenue(a.platform as any, a.followers, a.engagement ?? 3);
    }, 0);
    const totalViews = connectedAccounts.reduce((s, a) => s + Math.round(a.followers * 4 * (a.engagement ?? 3) / 100), 0);
    return { totalFollowers, totalLikes, totalPosts, avgEngagement, totalMonthlyRevenue, totalViews };
  }, [connectedAccounts]);

  // Follower history sparkline (sum across all accounts)
  const sparkFollowers = useMemo(() => {
    const allHistories = connectedAccounts.map(a => a.historicalFollowers ?? []);
    if (allHistories.every(h => h.length === 0)) {
      // Synthetic: last 7 points
      const base = totals.totalFollowers;
      return Array.from({ length: 7 }, (_, i) => Math.round(base * (0.9 + i * 0.015)));
    }
    return Array.from({ length: 7 }, (_, i) => {
      return allHistories.reduce((s, h) => {
        const idx = Math.floor(i * h.length / 7);
        return s + (h[idx]?.count ?? 0);
      }, 0);
    });
  }, [connectedAccounts, totals.totalFollowers]);

  const platformGroups = useMemo(() => {
    const groups: Record<PlatformId, { followers: number; engagement: number; posts: number }> = {} as Record<PlatformId, { followers: number; engagement: number; posts: number }>;
    for (const acc of connectedAccounts) {
      if (!groups[acc.platform]) {
        groups[acc.platform] = { followers: 0, engagement: 0, posts: 0 };
      }
      groups[acc.platform].followers += acc.followers;
      groups[acc.platform].engagement = acc.engagement ?? 3;
      groups[acc.platform].posts += acc.posts;
    }
    return groups;
  }, [connectedAccounts]);

  const handleSyncAll = async () => {
    if (syncing || connectedAccounts.length === 0) return;
    setSyncing(true);
    try {
      await Promise.allSettled(connectedAccounts.map(a => syncAccount(a.id)));
    } finally {
      setSyncing(false);
    }
  };

  const activeRules = automationRules.filter(r => r.isActive).length;
  const totalExecutions = automationRules.reduce((s, r) => s + r.executionCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-1">
            {connectedAccounts.length} compte{connectedAccounts.length !== 1 ? 's' : ''} connecté{connectedAccounts.length !== 1 ? 's' : ''}
            {lastSyncAt && <span> · Sync {timeAgo(lastSyncAt)}</span>}
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncing || connectedAccounts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-sm text-cyan-400 font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sync...' : 'Synchroniser tout'}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Abonnés totaux"
          value={formatNumber(totals.totalFollowers)}
          sub={`${connectedAccounts.length} plateformes`}
          icon={<Users size={18} className="text-white" />}
          gradient="from-cyan-500 to-blue-500"
          trend={2.4}
          sparkData={sparkFollowers}
          sparkColor="#22d3ee"
        />
        <KPICard
          label="Vues estimées / mois"
          value={formatNumber(totals.totalViews)}
          sub="Basé sur l'engagement"
          icon={<Eye size={18} className="text-white" />}
          gradient="from-purple-500 to-pink-500"
          trend={5.1}
        />
        <KPICard
          label="Engagement moyen"
          value={`${totals.avgEngagement.toFixed(1)}%`}
          sub="Toutes plateformes"
          icon={<Heart size={18} className="text-white" />}
          gradient="from-pink-500 to-rose-500"
          trend={totals.avgEngagement - 3}
        />
        <KPICard
          label="Revenus estimés / mois"
          value={formatCurrency(totals.totalMonthlyRevenue, settings.currency)}
          sub="CPM régional"
          icon={<TrendingUp size={18} className="text-white" />}
          gradient="from-emerald-500 to-teal-500"
          trend={8.3}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{activeRules}</div>
          <div className="text-sm text-gray-400 mt-1">Automations actives</div>
          <div className="text-xs text-gray-600">{totalExecutions} exécutions</div>
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{contentHistory.length}</div>
          <div className="text-sm text-gray-400 mt-1">Contenus générés</div>
          <div className="text-xs text-gray-600">{contentHistory.filter(c => c.isFavorite).length} favoris</div>
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{totals.totalPosts}</div>
          <div className="text-sm text-gray-400 mt-1">Publications</div>
          <div className="text-xs text-gray-600">Toutes plateformes</div>
        </div>
      </div>

      {/* Platforms + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platforms */}
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Par plateforme</h2>
          </div>
          {Object.keys(platformGroups).length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              Aucun compte connecté. Allez dans <span className="text-cyan-400">Comptes</span> pour commencer.
            </div>
          ) : (
            <div className="space-y-2">
              {(Object.entries(platformGroups) as [PlatformId, { followers: number; engagement: number; posts: number }][]).map(
                ([platform, data]) => (
                  <PlatformRow key={platform} platform={platform} {...data} />
                )
              )}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Activité récente</h2>
          </div>
          <ActivityFeed />
        </div>
      </div>

      {/* Last sync info */}
      {lastSyncAt && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock size={12} />
          Dernière synchronisation : {formatDateTime(lastSyncAt)}
          <CheckCircle size={12} className="text-emerald-500" />
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Award, Info, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getPlatformConfig, formatCurrency, formatNumber, getCPM, estimateMonthlyRevenue, getNexusCommissionRate, convertCurrency } from '@/lib/utils';
import type { PlatformId, MonetizationProgram } from '@/types';

// ─── Program definitions per platform ─────────────────────────────────────────

const PROGRAMS: Record<PlatformId, Omit<MonetizationProgram, 'currentFollowers' | 'eligible' | 'estimatedRevenue'>[]> = {
  tiktok: [
    { id: 'tt_creator_fund', name: 'Creator Fund', platform: 'tiktok', minFollowers: 10000, requirements: ['10 000+ abonnés', '100 000+ vues/30j', 'Contenu original', '18+ ans'] },
    { id: 'tt_live', name: 'Gifts LIVE', platform: 'tiktok', minFollowers: 1000, requirements: ['1 000+ abonnés', 'Compte vérifié', '18+ ans', 'Aucune violation'] },
    { id: 'tt_shop', name: 'TikTok Shop', platform: 'tiktok', minFollowers: 5000, requirements: ['5 000+ abonnés', 'Compte business', 'ID vérifié'] },
    { id: 'tt_series', name: 'TikTok Series', platform: 'tiktok', minFollowers: 10000, requirements: ['10 000+ abonnés', 'Contenu exclusif payant'] },
  ],
  instagram: [
    { id: 'ig_bonuses', name: 'Instagram Bonuses', platform: 'instagram', minFollowers: 10000, requirements: ['10 000+ abonnés', 'Compte creator/business', 'Éligible par invitation'] },
    { id: 'ig_badges', name: 'Badges LIVE', platform: 'instagram', minFollowers: 5000, requirements: ['5 000+ abonnés', 'Compte professionnel'] },
    { id: 'ig_subscriptions', name: 'Abonnements payants', platform: 'instagram', minFollowers: 10000, requirements: ['10 000+ abonnés', 'Contenu exclusif'] },
    { id: 'ig_collab', name: 'Brand Collabs', platform: 'instagram', minFollowers: 1000, requirements: ['1 000+ abonnés', 'Niche définie'] },
  ],
  youtube: [
    { id: 'yt_partner', name: 'YouTube Partner Program', platform: 'youtube', minFollowers: 1000, requirements: ['1 000 abonnés', '4 000h de watch time', 'Aucune violation', '18+ ans'] },
    { id: 'yt_memberships', name: 'Membres de la chaîne', platform: 'youtube', minFollowers: 30000, requirements: ['30 000 abonnés', 'YPP actif'] },
    { id: 'yt_superchat', name: 'Super Chat & Thanks', platform: 'youtube', minFollowers: 1000, requirements: ['YPP actif', 'Lives réguliers'] },
    { id: 'yt_merch', name: 'Merchandising', platform: 'youtube', minFollowers: 10000, requirements: ['10 000 abonnés', 'YPP actif'] },
  ],
  twitter: [
    { id: 'tw_blue', name: 'Twitter Blue Revenue', platform: 'twitter', minFollowers: 500, requirements: ['500+ abonnés', 'Compte vérifié', '3 mois d\'ancienneté'] },
    { id: 'tw_superfollows', name: 'Super Follows', platform: 'twitter', minFollowers: 10000, requirements: ['10 000+ abonnés', 'Contenu exclusif'] },
    { id: 'tw_spaces', name: 'Spaces Monétisés', platform: 'twitter', minFollowers: 1000, requirements: ['1 000+ abonnés', 'Ticketed Spaces actif'] },
  ],
  facebook: [
    { id: 'fb_instream', name: 'In-Stream Ads', platform: 'facebook', minFollowers: 10000, requirements: ['10 000+ abonnés', '600 000 min de visionnage', '5 vidéos actives'] },
    { id: 'fb_stars', name: 'Facebook Stars', platform: 'facebook', minFollowers: 1000, requirements: ['1 000+ abonnés', 'Lives réguliers'] },
    { id: 'fb_fan_subs', name: 'Fan Subscriptions', platform: 'facebook', minFollowers: 10000, requirements: ['10 000+ abonnés', 'Page Facebook'] },
  ],
  linkedin: [
    { id: 'li_premium', name: 'Creator Mode', platform: 'linkedin', minFollowers: 1000, requirements: ['1 000+ abonnés', 'Contenu professionnel'] },
    { id: 'li_newsletters', name: 'Newsletters LinkedIn', platform: 'linkedin', minFollowers: 500, requirements: ['500+ relations', 'Audience engagée'] },
    { id: 'li_events', name: 'Événements payants', platform: 'linkedin', minFollowers: 5000, requirements: ['5 000+ abonnés', 'Expertise reconnue'] },
  ],
};

// ─── Revenue Card ────────────────────────────────────────────────────────────

function RevenueCard({
  platform,
  followers,
  engagement,
  region,
}: {
  platform: PlatformId;
  followers: number;
  engagement: number;
  region: string;
}) {
  const { settings } = useAppStore();
  const cfg = getPlatformConfig(platform);
  const cpm = getCPM(platform, region);
  const monthlyRevenue = estimateMonthlyRevenue(platform as any, followers, engagement);
  const annualRevenue = monthlyRevenue * 12;
  const nexusRate = getNexusCommissionRate(followers as any);
  const nexusCommission = monthlyRevenue * nexusRate;
  const netRevenue = monthlyRevenue - nexusCommission;

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-lg`}>
            {cfg.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{cfg.name}</div>
            <div className="text-xs text-gray-500">{formatNumber(followers)} abonnés · CPM {cpm.toFixed(2)} USD ({region})</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-white/5">
            <div className={`text-lg font-bold ${cfg.textColor}`}>{formatCurrency(monthlyRevenue, settings.currency)}</div>
            <div className="text-xs text-gray-500">Revenus / mois</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-lg font-bold text-white">{formatCurrency(annualRevenue, settings.currency)}</div>
            <div className="text-xs text-gray-500">Revenus / an</div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Revenu brut estimé</span>
            <span className="text-white font-medium">{formatCurrency(monthlyRevenue, settings.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Commission Nexus ({(nexusRate * 100).toFixed(0)}%)</span>
            <span className="text-amber-400 font-medium">- {formatCurrency(nexusCommission, settings.currency)}</span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-semibold">Revenu net</span>
            <span className="text-emerald-400 font-bold text-sm">{formatCurrency(netRevenue, settings.currency)}</span>
          </div>
        </div>

        <div className="mt-3 p-2 rounded-lg bg-white/5 text-xs text-gray-500 flex items-start gap-1.5">
          <Info size={11} className="mt-0.5 flex-shrink-0" />
          <span>Basé sur {engagement.toFixed(1)}% d'engagement · {formatNumber(Math.round(followers * 4 * engagement / 100))} vues/mois estimées</span>
        </div>
      </div>
    </div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({ program }: { program: MonetizationProgram }) {
  const { settings } = useAppStore();
  const cfg = getPlatformConfig(program.platform);
  const pct = Math.min(100, Math.round(((program.currentFollowers ?? 0) / program.minFollowers) * 100));
  const remaining = Math.max(0, program.minFollowers - (program.currentFollowers ?? 0));

  return (
    <div className={`rounded-xl border p-4 transition-all ${program.eligible ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-gray-900/40'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.icon}</span>
          <span className="text-sm font-medium text-white">{program.name}</span>
        </div>
        {program.eligible ? (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Award size={10} />
            Éligible
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            -{formatNumber(remaining)} abonnés
          </span>
        )}
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {(program.requirements ?? []).map((req, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${program.eligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
            {req}
          </span>
        ))}
      </div>

      {(program.estimatedRevenue ?? 0) > 0 && program.eligible && (
        <div className="mt-2 text-xs text-emerald-400 font-medium">
          ~{formatCurrency(program.estimatedRevenue ?? 0, settings.currency)}/mois estimé
        </div>
      )}
    </div>
  );
}

// ─── Commission rate table ────────────────────────────────────────────────────

function CommissionRateTable() {
  const tiers = [
    { range: '0 – 999', rate: 25 },
    { range: '1 000 – 4 999', rate: 20 },
    { range: '5 000 – 9 999', rate: 18 },
    { range: '10 000 – 49 999', rate: 15 },
    { range: '50 000 – 99 999', rate: 12 },
    { range: '100 000+', rate: 10 },
  ];

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Grille de commissions Nexus</h3>
      </div>
      <div className="space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
            <div className="flex-1 text-xs text-gray-400">{tier.range} abonnés</div>
            <div className="w-24">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${tier.rate}%` }} />
              </div>
            </div>
            <div className="text-xs font-bold text-amber-400 w-8 text-right">{tier.rate}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Monetization() {
  const { connectedAccounts, settings } = useAppStore();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | 'all'>('all');

  const filteredAccounts = selectedPlatform === 'all'
    ? connectedAccounts
    : connectedAccounts.filter(a => a.platform === selectedPlatform);

  const uniquePlatforms = [...new Set(connectedAccounts.map(a => a.platform))];

  // Build program list with real follower data
  const programs: MonetizationProgram[] = useMemo(() => {
    const result: MonetizationProgram[] = [];
    for (const acc of filteredAccounts) {
      const defs = PROGRAMS[acc.platform] ?? [];
      const cpm = getCPM(acc.platform, acc.region || 'CM');
      for (const def of defs) {
        const eligible = acc.followers >= def.minFollowers;
        const estimatedRevenue = eligible
          ? estimateMonthlyRevenue(acc.platform as any, acc.followers, acc.engagement ?? 3) * 0.3
          : 0;
        result.push({
          ...def,
          currentFollowers: acc.followers,
          eligible,
          estimatedRevenue,
        });
      }
    }
    return result;
  }, [filteredAccounts]);

  const totals = useMemo(() => {
    const monthly = filteredAccounts.reduce((s, acc) => {
      const cpm = getCPM(acc.platform, acc.region || 'CM');
      return s + estimateMonthlyRevenue(acc.platform as any, acc.followers, acc.engagement ?? 3);
    }, 0);
    const nexus = filteredAccounts.reduce((s, acc) => {
      const cpm = getCPM(acc.platform, acc.region || 'CM');
      const rev = estimateMonthlyRevenue(acc.platform as any, acc.followers, acc.engagement ?? 3);
      return s + rev * getNexusCommissionRate(acc.followers as any);
    }, 0);
    return { monthly, annual: monthly * 12, nexus, net: monthly - nexus };
  }, [filteredAccounts]);

  const eligibleCount = programs.filter(p => p.eligible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monétisation</h1>
          <p className="text-sm text-gray-400 mt-1">
            {eligibleCount} programme{eligibleCount !== 1 ? 's' : ''} éligible{eligibleCount !== 1 ? 's' : ''}
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
          <DollarSign size={40} className="text-gray-700 mx-auto mb-3" />
          <div className="text-gray-500">Connectez des comptes pour estimer vos revenus</div>
        </div>
      ) : (
        <>
          {/* Global summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenus / mois', value: formatCurrency(totals.monthly, settings.currency), color: 'text-white' },
              { label: 'Revenus / an', value: formatCurrency(totals.annual, settings.currency), color: 'text-white' },
              { label: 'Commission Nexus', value: formatCurrency(totals.nexus, settings.currency), color: 'text-amber-400' },
              { label: 'Net mensuel', value: formatCurrency(totals.net, settings.currency), color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-gray-900/60 border border-white/5 p-4">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue cards per account */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Estimation par compte</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAccounts.map(acc => (
                <RevenueCard
                  key={acc.id}
                  platform={acc.platform}
                  followers={acc.followers}
                  engagement={acc.engagement ?? 3}
                  region={acc.region || 'CM'}
                />
              ))}
            </div>
          </div>

          {/* Commission rate table */}
          <CommissionRateTable />

          {/* Programs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Programmes de monétisation</h2>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{eligibleCount} éligibles</span>
            </div>
            {programs.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">Aucun programme disponible</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {programs
                  .sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0))
                  .map(p => <ProgramCard key={p.id} program={p} />)}
              </div>
            )}
          </div>

          {/* CPM info */}
          <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Taux CPM par région</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['CM', 'FR', 'US', 'GB', 'DE'].map(region => (
                <div key={region} className="p-2 rounded-xl bg-white/5">
                  <div className="text-xs font-semibold text-white">🌍 {region}</div>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {uniquePlatforms.slice(0, 3).map(p => {
                      const cfg = getPlatformConfig(p);
                      const cpm = getCPM(p, region);
                      return (
                        <div key={p} className="flex justify-between">
                          <span>{cfg.icon}</span>
                          <span className="text-gray-400">{cpm.toFixed(2)}$</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PlatformId, Currency } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function platformConfigs() {
  return {
    tiktok: {
      id: 'tiktok' as PlatformId,
      name: 'TikTok',
      icon: '🎵',
      gradient: 'from-pink-500 to-cyan-400',
      color: '#ff0050',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/30',
      cpm: { XAF: 1500, USD: 2.5, EUR: 2.1 },
      programs: ['Creator Fund', 'TikTok Pulse', 'Live Gifts'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm'],
      defaultAspectRatio: '9:16',
    },
    instagram: {
      id: 'instagram' as PlatformId,
      name: 'Instagram',
      icon: '📷',
      gradient: 'from-purple-500 to-orange-400',
      color: '#e1306c',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      cpm: { XAF: 2000, USD: 3.5, EUR: 3.0 },
      programs: ['Badges', 'Subscriptions', 'Bonuses'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm'],
      defaultAspectRatio: '1:1',
    },
    youtube: {
      id: 'youtube' as PlatformId,
      name: 'YouTube',
      icon: '▶️',
      gradient: 'from-red-500 to-orange-400',
      color: '#ff0000',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      cpm: { XAF: 3000, USD: 5.0, EUR: 4.2 },
      programs: ['Partner Program', 'Channel Memberships', 'Super Chat'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm'],
      defaultAspectRatio: '16:9',
    },
    facebook: {
      id: 'facebook' as PlatformId,
      name: 'Facebook',
      icon: '👍',
      gradient: 'from-blue-500 to-cyan-400',
      color: '#1877f2',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      cpm: { XAF: 1200, USD: 2.0, EUR: 1.7 },
      programs: ['In-Stream Ads', 'Fan Subscriptions', 'Stars'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm'],
      defaultAspectRatio: '16:9',
    },
    twitter: {
      id: 'twitter' as PlatformId,
      name: 'Twitter',
      icon: '🐦',
      gradient: 'from-blue-400 to-indigo-500',
      color: '#1da1f2',
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-400/30',
      cpm: { XAF: 800, USD: 1.5, EUR: 1.2 },
      programs: ['Super Follows', 'Tips', 'Media Studio'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm', 'thread'],
      defaultAspectRatio: '16:9',
    },
    linkedin: {
      id: 'linkedin' as PlatformId,
      name: 'LinkedIn',
      icon: '💼',
      gradient: 'from-blue-600 to-blue-400',
      color: '#0a66c2',
      bgColor: 'bg-blue-600/10',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-600/30',
      cpm: { XAF: 5000, USD: 8.0, EUR: 6.5 },
      programs: ['Creator Mode', 'Newsletter', 'Live Events'],
      milestones: [1000, 10000, 100000, 1000000],
      contentTypes: ['caption', 'hashtags', 'script', 'bio', 'dm', 'ad_copy'],
      defaultAspectRatio: '16:9',
    },
  };
}

export function getPlatformConfig(platform: string | PlatformId) {
  return platformConfigs()[platform as PlatformId] ?? platformConfigs().tiktok;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString();
}

export function formatCurrency(amount: number, currency: string | Currency = 'XAF'): string {
  if (currency === 'XAF') return `${Math.round(amount).toLocaleString()} FCFA`;
  if (currency === 'EUR') return `${amount.toFixed(2)} €`;
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  return formatDate(date);
}

export function formatRelativeDate(date: string): string {
  return timeAgo(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateInvoiceNumber(): string {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
}

export function calculateEngagementRate(followers: number, likes: number, posts: number): number {
  if (followers === 0 || posts === 0) return 0;
  return ((likes / posts) / followers) * 100;
}

export function calcEngagementRate(followers: number, likes: number, posts: number): number {
  return calculateEngagementRate(followers, likes, posts);
}

export function getCPM(platform: string | PlatformId, currency: string | Currency = 'XAF', _region: string = 'CM'): number {
  const config = platformConfigs()[platform as PlatformId];
  return config ? (config.cpm[currency as Currency] ?? config.cpm.XAF) : 0;
}

export function getNexusCommissionRate(platform: string | PlatformId): number {
  const rates: Record<string, number> = { tiktok: 0.1, instagram: 0.15, youtube: 0.2, facebook: 0.08, twitter: 0.05, linkedin: 0.25 };
  return rates[platform] ?? 0.1;
}

export function estimateMonthlyRevenue(platform: string | PlatformId, followers: number, engagement: number, currency: string | Currency = 'XAF'): number {
  const cpm = getCPM(platform as PlatformId, currency as Currency);
  const engagementRate = engagement / 100;
  const estimatedImpressions = followers * engagementRate * 30;
  return (estimatedImpressions / 1000) * cpm;
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function projectFollowers(current: number, growthRate: number, months: number): number[] {
  return Array.from({ length: months }, (_, i) => Math.round(current * Math.pow(1 + growthRate / 100, i + 1)));
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => String(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function convertCurrency(amount: number, from: string | Currency, to: string | Currency): number {
  const rates: Record<string, number> = { 'XAF_USD': 0.0016, 'XAF_EUR': 0.0015, 'USD_XAF': 621, 'USD_EUR': 0.92, 'EUR_XAF': 655.96, 'EUR_USD': 1.09 };
  if (from === to) return amount;
  const key = `${from}_${to}`;
  return amount * (rates[key] || 1);
}

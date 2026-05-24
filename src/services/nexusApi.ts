/**
 * nexusApi.ts
 * Unified API services for all platforms + AI + media assets + Supabase.
 *
 * Keys are read from import.meta.env (Vite) – set them in .env:
 *   VITE_PEXELS_API_KEY=...
 *   VITE_PIXABAY_API_KEY=...
 *   VITE_GROQ_API_KEY=...
 *   VITE_FREESOUND_API_KEY=...
 *   VITE_RAPIDAPI_KEY=...          (for TikTok/Instagram via RapidAPI)
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PlatformId,
  SocialUserInfo,
  TrendingItem,
  GeneratedContent,
  ContentType,
  AutomationRule,
  AutomationLog,
  VideoProject,
  Commission,
  GrowthMilestone,
  PexelsPhoto,
  PexelsVideo,
  PixabayImage,
  FreesoundTrack,
  ConnectedAccount,
  ScheduledPost,
  AnalyticsDataPoint,
  ConnectedDevice,
} from '@/types';
import { generateId, generateInvoiceNumber } from '@/lib/utils';

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Supabase Service ─────────────────────────────────────────────────────────

export class SupabaseService {
  // Connected Accounts
  static async saveAccount(account: ConnectedAccount) {
    const { error } = await supabase
      .from('connected_accounts')
      .upsert(account, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getAccounts(): Promise<ConnectedAccount[]> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .order('connectedAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async deleteAccount(id: string) {
    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Automation Rules
  static async saveRule(rule: AutomationRule) {
    const { error } = await supabase
      .from('automation_rules')
      .upsert(rule, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getRules(): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async deleteRule(id: string) {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Automation Logs
  static async saveLog(log: AutomationLog) {
    const { error } = await supabase
      .from('automation_logs')
      .insert(log);
    if (error) throw new Error(error.message);
  }

  static async getLogs(limit = 50): Promise<AutomationLog[]> {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .order('executedAt', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Generated Content
  static async saveContent(content: GeneratedContent) {
    const { error } = await supabase
      .from('generated_content')
      .upsert(content, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getContent(): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async deleteContent(id: string) {
    const { error } = await supabase
      .from('generated_content')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Video Projects
  static async saveProject(project: VideoProject) {
    const { error } = await supabase
      .from('video_projects')
      .upsert(project, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getProjects(): Promise<VideoProject[]> {
    const { data, error } = await supabase
      .from('video_projects')
      .select('*')
      .order('updatedAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from('video_projects')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Growth Milestones
  static async saveMilestone(milestone: GrowthMilestone) {
    const { error } = await supabase
      .from('growth_milestones')
      .upsert(milestone, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getMilestones(): Promise<GrowthMilestone[]> {
    const { data, error } = await supabase
      .from('growth_milestones')
      .select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Commissions
  static async saveCommission(commission: Commission) {
    const { error } = await supabase
      .from('commissions')
      .upsert(commission, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getCommissions(): Promise<Commission[]> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Scheduled Posts
  static async saveScheduledPost(post: ScheduledPost) {
    const { error } = await supabase
      .from('scheduled_posts')
      .upsert(post, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getScheduledPosts(): Promise<ScheduledPost[]> {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduledAt', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Analytics History (saved snapshots)
  static async saveAnalyticsSnapshot(accountId: string, snapshot: AnalyticsDataPoint) {
    const { error } = await supabase
      .from('analytics_history')
      .upsert({ id: `${accountId}_${snapshot.date}`, accountId, ...snapshot });
    if (error) throw new Error(error.message);
  }

  static async getAnalyticsHistory(accountId: string, days = 30): Promise<AnalyticsDataPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase
      .from('analytics_history')
      .select('*')
      .eq('accountId', accountId)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // Devices (sessions)
  static async saveDevice(device: ConnectedDevice) {
    const { error } = await supabase
      .from('connected_devices')
      .upsert(device, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  static async getDevices(): Promise<ConnectedDevice[]> {
    const { data, error } = await supabase
      .from('connected_devices')
      .select('*')
      .order('lastActive', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async revokeDevice(id: string) {
    const { error } = await supabase
      .from('connected_devices')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Connectivity check
  static async ping(): Promise<boolean> {
    try {
      const { error } = await supabase.from('connected_accounts').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// ─── RapidAPI base (for TikTok/Instagram/Twitter scrapers) ───────────────────

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;

async function rapidFetch(host: string, path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`https://${host}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-host': host,
      'x-rapidapi-key': RAPIDAPI_KEY,
    },
  });
  if (!res.ok) throw new Error(`RapidAPI error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── TikTok API ───────────────────────────────────────────────────────────────

export class TikTokAPI {
  private static readonly HOST = 'tiktok-api23.p.rapidapi.com';

  static async getUserInfo(username: string): Promise<SocialUserInfo> {
    const data = await rapidFetch(this.HOST, '/api/user/info', { uniqueId: username }) as Record<string, unknown>;
    const user = (data as Record<string, Record<string, Record<string, unknown>>>)?.userInfo?.user;
    const stats = (data as Record<string, Record<string, Record<string, unknown>>>)?.userInfo?.stats;
    if (!user) throw new Error(`Utilisateur TikTok @${username} introuvable`);
    return {
      id: String(user.id ?? user.uid ?? ''),
      username: String(user.uniqueId ?? username),
      displayName: String(user.nickname ?? username),
      avatarUrl: String(user.avatarThumb ?? ''),
      bio: String(user.signature ?? ''),
      followers: Number((stats as Record<string, number>)?.followerCount ?? 0),
      following: Number((stats as Record<string, number>)?.followingCount ?? 0),
      likes: Number((stats as Record<string, number>)?.heartCount ?? 0),
      posts: Number((stats as Record<string, number>)?.videoCount ?? 0),
      verified: Boolean(user.verified),
      platform: 'tiktok',
      profileUrl: `https://tiktok.com/@${username}`,
    };
  }

  static async getTrending(): Promise<TrendingItem[]> {
    const data = await rapidFetch(this.HOST, '/api/trending/feed', {}) as Record<string, unknown>;
    const items = (data as { itemList?: unknown[] })?.itemList ?? [];
    if (!items.length) throw new Error('Aucune tendance TikTok disponible');
    return (items as Record<string, unknown>[]).slice(0, 10).map((item, i) => ({
      id: String(item.id ?? i),
      platform: 'tiktok',
      type: 'challenge',
      name: String((item as any)?.challenges?.[0]?.title ?? `Trend ${i + 1}`),
      usageCount: Number((item as Record<string, Record<string, number>>)?.stats?.playCount ?? 0),
      growth: 0,
      thumbnail: String((item as Record<string, Record<string, string>>)?.video?.cover ?? ''),
    }));
  }

  static async like(postId: string, token: string): Promise<void> {
    if (token) {
      await tiktokActionWithToken('like', token, { video_id: postId });
    } else {
      await rapidFetch(this.HOST, '/api/post/like', { aweme_id: postId });
    }
  }

  static async follow(userId: string, token: string): Promise<void> {
    if (token) {
      await tiktokActionWithToken('follow', token, { user_id: userId });
    } else {
      await rapidFetch(this.HOST, '/api/user/follow', { user_id: userId });
    }
  }

  static async sendDM(_userId: string, _message: string, _token: string): Promise<void> {
    throw new Error('TikTok DM non supporté via l\'API publique');
  }
}

// ─── Instagram API ────────────────────────────────────────────────────────────

export class InstagramAPI {
  private static readonly HOST = 'instagram-scraper-api2.p.rapidapi.com';

  static async getUserInfo(username: string): Promise<SocialUserInfo> {
    const data = await rapidFetch(this.HOST, '/v1/info', { username_or_id_or_url: username }) as Record<string, unknown>;
    const user = (data as Record<string, Record<string, unknown>>)?.data;
    if (!user) throw new Error(`Utilisateur Instagram @${username} introuvable`);
    return {
      id: String(user.id ?? ''),
      username: String(user.username ?? username),
      displayName: String(user.full_name ?? username),
      avatarUrl: String(user.profile_pic_url ?? ''),
      bio: String(user.biography ?? ''),
      followers: Number(user.follower_count ?? 0),
      following: Number(user.following_count ?? 0),
      likes: 0,
      posts: Number(user.media_count ?? 0),
      verified: Boolean(user.is_verified),
      platform: 'instagram',
      profileUrl: `https://instagram.com/${username}`,
    };
  }

  static async getTrending(): Promise<TrendingItem[]> {
    throw new Error('Tendances Instagram non disponibles via l\'API publique');
  }

  static async like(_postId: string, _token: string): Promise<void> {
    throw new Error('Instagram like nécessite un compte professionnel vérifié et un token OAuth');
  }

  static async follow(_userId: string, _token: string): Promise<void> {
    throw new Error('Instagram follow nécessite un token OAuth');
  }

  static async sendDM(_userId: string, _message: string, _token: string): Promise<void> {
    throw new Error('Instagram DM nécessite un token OAuth Messenger');
  }
}

// ─── Twitter API ──────────────────────────────────────────────────────────────

export class TwitterAPI {
  private static readonly HOST = 'twitter241.p.rapidapi.com';

  static async getUserInfo(username: string): Promise<SocialUserInfo> {
    const data = await rapidFetch(this.HOST, '/user', { username }) as Record<string, unknown>;
    const user = (data as any)?.result?.data?.user?.result;
    if (!user) throw new Error(`Utilisateur Twitter @${username} introuvable`);
    const legacy = (user as Record<string, Record<string, unknown>>)?.legacy ?? {};
    return {
      id: String(user.rest_id ?? ''),
      username: String((legacy as Record<string, string>).screen_name ?? username),
      displayName: String((legacy as Record<string, string>).name ?? username),
      avatarUrl: String((legacy as Record<string, string>).profile_image_url_https ?? ''),
      bio: String((legacy as Record<string, string>).description ?? ''),
      followers: Number((legacy as Record<string, number>).followers_count ?? 0),
      following: Number((legacy as Record<string, number>).friends_count ?? 0),
      likes: Number((legacy as Record<string, number>).favourites_count ?? 0),
      posts: Number((legacy as Record<string, number>).statuses_count ?? 0),
      verified: Boolean((legacy as Record<string, boolean>).verified),
      platform: 'twitter',
      profileUrl: `https://twitter.com/${username}`,
    };
  }

  static async getTrending(location = 'worldwide'): Promise<TrendingItem[]> {
    const data = await rapidFetch(this.HOST, '/trends', { location }) as Record<string, unknown>;
    const trends = (data as { trends?: unknown[] })?.trends ?? [];
    if (!trends.length) throw new Error('Aucune tendance Twitter disponible');
    return (trends as Record<string, unknown>[]).slice(0, 10).map((t, i) => ({
      id: String(i),
      platform: 'twitter' as PlatformId,
      type: 'hashtag',
      name: String(t.name ?? t.query ?? ''),
      usageCount: Number((t as Record<string, Record<string, number>>)?.tweet_volume ?? 0),
      growth: 0,
    }));
  }

  static async like(_tweetId: string, _token: string): Promise<void> {
    await rapidFetch(this.HOST, '/like', { tweet_id: _tweetId });
  }

  static async follow(_userId: string, _token: string): Promise<void> {
    await rapidFetch(this.HOST, '/follow', { user_id: _userId });
  }

  static async sendDM(_userId: string, _message: string, _token: string): Promise<void> {
    await rapidFetch(this.HOST, '/dm/send', { user_id: _userId, text: _message });
  }
}

// ─── YouTube API ──────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string;

export class YouTubeAPI {
  static async getUserInfo(channelIdOrUsername: string): Promise<SocialUserInfo> {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string;
    if (!apiKey) throw new Error('YouTube API key manquante');
    const params: Record<string, string> = channelIdOrUsername.startsWith('UC')
      ? { id: channelIdOrUsername, part: 'snippet,statistics' }
      : { forUsername: channelIdOrUsername, part: 'snippet,statistics' };
    const url = `https://www.googleapis.com/youtube/v3/channels?${new URLSearchParams({ ...params, key: apiKey }).toString()}`;
    const res = await globalThis.fetch(url);
    const json = await res.json() as Record<string, unknown>;
    const item = (json as { items?: Record<string, unknown>[] })?.items?.[0];
    if (!item) throw new Error(`Chaîne YouTube ${channelIdOrUsername} introuvable`);
    const snippet = (item as { snippet?: Record<string, unknown> })?.snippet ?? {};
    const statistics = (item as { statistics?: Record<string, unknown> })?.statistics ?? {};
    const thumbs = (snippet as { thumbnails?: Record<string, unknown> })?.thumbnails ?? {};
    const defaultThumb = (thumbs as { default?: Record<string, string> })?.default ?? {};
    return {
      id: String(item.id ?? ''),
      username: channelIdOrUsername,
      displayName: String((snippet as Record<string, string>).title ?? channelIdOrUsername),
      avatarUrl: String(defaultThumb.url ?? ''),
      bio: String((snippet as Record<string, string>).description ?? ''),
      followers: Number((statistics as Record<string, number>).subscriberCount ?? 0),
      following: 0,
      likes: Number((statistics as Record<string, number>).videoCount ?? 0),
      posts: Number((statistics as Record<string, number>).videoCount ?? 0),
      verified: false,
      platform: 'youtube',
      profileUrl: `https://youtube.com/channel/${item.id ?? channelIdOrUsername}`,
    };
  }

  static async getTrending(): Promise<TrendingItem[]> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=CM&maxResults=10&key=${YOUTUBE_API_KEY}`
    );
    if (!res.ok) throw new Error('YouTube trending error');
    const data = await res.json() as Record<string, unknown>;
    const items = (data as Record<string, Record<string, unknown>[]>).items ?? [];
    return items.map((v, i) => ({
      id: String(v.id ?? i),
      platform: 'youtube' as PlatformId,
      type: 'topic',
      name: String((v as Record<string, Record<string, string>>).snippet?.title ?? ''),
      usageCount: Number((v as Record<string, Record<string, string>>).statistics?.viewCount ?? 0),
      growth: 0,
      thumbnail: String((v as Record<string, Record<string, Record<string, Record<string, string>>>>).snippet?.thumbnails?.default?.url ?? ''),
    }));
  }
}

// ─── Facebook API ─────────────────────────────────────────────────────────────

export class FacebookAPI {
  static async getUserInfo(username: string): Promise<SocialUserInfo> {
    const data = await rapidFetch('facebook-scraper3.p.rapidapi.com', '/profile', { username }) as Record<string, unknown>;
    if (!data.id) throw new Error(`Utilisateur Facebook @${username} introuvable`);
    return {
      id: String(data.id ?? ''),
      username,
      displayName: String(data.name ?? username),
      avatarUrl: String(data.picture ?? ''),
      bio: String(data.about ?? ''),
      followers: Number(data.followers ?? 0),
      following: Number(data.friends ?? 0),
      likes: Number(data.likes ?? 0),
      posts: 0,
      verified: Boolean(data.verified),
      platform: 'facebook',
      profileUrl: `https://facebook.com/${username}`,
    };
  }

  static async getTrending(): Promise<TrendingItem[]> {
    throw new Error('Tendances Facebook non disponibles via l\'API publique');
  }

  static async like(_postId: string, _token: string): Promise<void> {
    throw new Error('Facebook like nécessite un token OAuth Graph API');
  }

  static async follow(_userId: string, _token: string): Promise<void> {
    throw new Error('Facebook follow nécessite un token OAuth Graph API');
  }

  static async sendDM(_userId: string, _message: string, _token: string): Promise<void> {
    throw new Error('Facebook DM nécessite un token OAuth Messenger');
  }
}

// ─── LinkedIn API ─────────────────────────────────────────────────────────────

export class LinkedInAPI {
  private static readonly HOST = 'linkedin-data-api.p.rapidapi.com';

  static async getUserInfo(username: string): Promise<SocialUserInfo> {
    const data = await rapidFetch(this.HOST, '/get-profile-data-by-url', {
      url: `https://www.linkedin.com/in/${username}/`,
    }) as Record<string, unknown>;
    return {
      id: String(data.urn ?? username),
      username,
      displayName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || username,
      avatarUrl: String(data.profilePicture ?? ''),
      bio: String(data.headline ?? ''),
      followers: Number(data.followersCount ?? data.connectionsCount ?? 0),
      following: 0,
      likes: 0,
      posts: 0,
      verified: false,
      platform: 'linkedin',
      profileUrl: `https://linkedin.com/in/${username}`,
    };
  }

  static async getTrending(): Promise<TrendingItem[]> {
    throw new Error('Tendances LinkedIn non disponibles via l\'API publique');
  }

  static async follow(_userId: string, _token: string): Promise<void> {
    throw new Error('LinkedIn follow nécessite un token OAuth');
  }

  static async sendDM(_userId: string, _message: string, _token: string): Promise<void> {
    throw new Error('LinkedIn message nécessite un token OAuth');
  }
}

// ─── TikTok OAuth ────────────────────────────────────────────────────────────

async function tiktokActionWithToken(action: string, accessToken: string, params: Record<string, string>): Promise<void> {
  const proxyUrl = import.meta.env.VITE_PROXY_URL as string;
  const url = proxyUrl
    ? `${proxyUrl}/api/tiktok/action`
    : 'http://localhost:8000/api/tiktok/action';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, action, ...params }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok action error: ${err.slice(0, 200)}`);
  }
}

export class TikTokOAuthService {
  static async getAuthUrl(): Promise<string> {
    const proxyUrl = import.meta.env.VITE_PROXY_URL as string;
    const base = proxyUrl || 'http://localhost:8000';
    const res = await fetch(`${base}/api/oauth/tiktok/url`);
    if (!res.ok) throw new Error('Impossible de générer l\'URL OAuth');
    const data = await res.json() as { url: string };
    return data.url;
  }

  static async handleCallback(code: string): Promise<{ access_token: string; open_id: string; expires_in: number }> {
    const proxyUrl = import.meta.env.VITE_PROXY_URL as string;
    const base = proxyUrl || 'http://localhost:8000';
    const res = await fetch(`${base}/api/oauth/tiktok/callback?code=${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error('Échec de l\'échange du code OAuth');
    return res.json();
  }

  static async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const proxyUrl = import.meta.env.VITE_PROXY_URL as string;
    const base = proxyUrl || 'http://localhost:8000';
    const res = await fetch(`${base}/api/oauth/tiktok/refresh?refresh_token=${encodeURIComponent(refreshToken)}`);
    if (!res.ok) throw new Error('Échec du rafraîchissement du token');
    return res.json();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTikTokUser(user: any, stats: any, username: string): SocialUserInfo {
  return {
    id: String(user.id ?? user.uid ?? ''),
    username: String(user.uniqueId ?? username),
    displayName: String(user.nickname ?? username),
    avatarUrl: String(user.avatarThumb ?? user.avatarLarger ?? ''),
    bio: String(user.signature ?? ''),
    followers: Number(stats?.followerCount ?? 0),
    following: Number(stats?.followingCount ?? 0),
    likes: Number(stats?.heartCount ?? 0),
    posts: Number(stats?.videoCount ?? 0),
    verified: Boolean(user.verified),
    platform: 'tiktok',
    profileUrl: `https://tiktok.com/@${username}`,
  };
}

// ─── Unified SocialDataService ────────────────────────────────────────────────

export class SocialDataService {
  static async getUserInfo(platform: PlatformId, username: string, onProgress?: (attempt: any) => void): Promise<SocialUserInfo> {
    const { executeFallbackChain, buildStrategies } = await import('./fallback/FallbackEngine');
    const { scrapeTikTokProfile, scrapeInstagramProfile, scrapeYouTubeChannel, fetchViaNitter, fetchViaRSS } = await import('./fallback/scraping');
    const proxyUrl = import.meta.env.VITE_PROXY_URL as string;

    const proxyFn = (p: PlatformId, u: string) => async (): Promise<SocialUserInfo> => {
      if (!proxyUrl) throw new Error('Proxy non configuré');
      const res = await fetch(`${proxyUrl}/api/lookup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: p, username: u }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.detail ?? `Proxy error ${res.status}`);
      }
      return res.json();
    };

    const altFns: { name: string; fn: () => Promise<SocialUserInfo> }[] = [];

    const chainExtra = (extra: { name: string; fn: () => Promise<SocialUserInfo> }[]) => {
      if (proxyUrl) extra.unshift({ name: `Proxy ${platform}`, fn: proxyFn(platform, username) });
      return extra;
    };

    switch (platform) {
      case 'tiktok': {
        altFns.push(
          { name: 'TikAPI (alt)', fn: async () => {
            const data = await rapidFetch('tiktok-api23.p.rapidapi.com', '/api/user/info', { uniqueId: username }) as Record<string, unknown>;
            const user = (data as any)?.userInfo?.user;
            if (!user) throw new Error('not found');
            return formatTikTokUser(user, (data as any)?.userInfo?.stats, username);
          }},
          { name: 'Scraping TikTok', fn: () => scrapeTikTokProfile(username) },
        );
        const chain = buildStrategies('TikTok', username, platform,
          () => TikTokAPI.getUserInfo(username),
          undefined, chainExtra(altFns),
        );
        const result = await executeFallbackChain('TikTok', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      case 'instagram': {
        altFns.push(
          { name: 'Scraping Instagram', fn: () => scrapeInstagramProfile(username) },
        );
        const chain = buildStrategies('Instagram', username, platform,
          () => InstagramAPI.getUserInfo(username),
          undefined, chainExtra(altFns),
        );
        const result = await executeFallbackChain('Instagram', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      case 'twitter': {
        altFns.push(
          { name: 'Nitter', fn: () => fetchViaNitter(username) },
        );
        const chain = buildStrategies('Twitter', username, platform,
          () => TwitterAPI.getUserInfo(username),
          undefined, chainExtra(altFns),
        );
        const result = await executeFallbackChain('Twitter', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      case 'youtube': {
        altFns.push(
          { name: 'RSS YouTube', fn: () => fetchViaRSS(username) },
          { name: 'Scraping YouTube', fn: () => scrapeYouTubeChannel(username) },
        );
        const chain = buildStrategies('YouTube', username, platform,
          () => YouTubeAPI.getUserInfo(username),
          undefined, chainExtra(altFns),
        );
        const result = await executeFallbackChain('YouTube', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      case 'facebook': {
        const chain = buildStrategies('Facebook', username, platform,
          () => FacebookAPI.getUserInfo(username),
          undefined, chainExtra([]),
        );
        const result = await executeFallbackChain('Facebook', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      case 'linkedin': {
        const chain = buildStrategies('LinkedIn', username, platform,
          () => LinkedInAPI.getUserInfo(username),
          undefined, chainExtra([]),
        );
        const result = await executeFallbackChain('LinkedIn', chain, onProgress);
        if (!result.success || !result.data) throw new Error(result.error);
        return result.data;
      }
      default: throw new Error(`Plateforme non supportée: ${platform}`);
    }
  }

  static async getTrendingContent(platform: PlatformId): Promise<TrendingItem[]> {
    switch (platform) {
      case 'tiktok': return TikTokAPI.getTrending();
      case 'instagram': return InstagramAPI.getTrending();
      case 'twitter': return TwitterAPI.getTrending();
      case 'youtube': return YouTubeAPI.getTrending();
      case 'facebook': return FacebookAPI.getTrending();
      case 'linkedin': return LinkedInAPI.getTrending();
      default: return [];
    }
  }

  static async executeAction(
    platform: PlatformId,
    action: 'like' | 'follow' | 'send_dm',
    targetId: string,
    message?: string,
    token?: string
  ): Promise<void> {
    switch (platform) {
      case 'tiktok':
        if (action === 'like') await TikTokAPI.like(targetId, token ?? '');
        else if (action === 'follow') await TikTokAPI.follow(targetId, token ?? '');
        else if (action === 'send_dm') await TikTokAPI.sendDM(targetId, message ?? '', token ?? '');
        break;
      case 'instagram':
        if (action === 'like') await InstagramAPI.like(targetId, token ?? '');
        else if (action === 'follow') await InstagramAPI.follow(targetId, token ?? '');
        else if (action === 'send_dm') await InstagramAPI.sendDM(targetId, message ?? '', token ?? '');
        break;
      case 'twitter':
        if (action === 'like') await TwitterAPI.like(targetId, token ?? '');
        else if (action === 'follow') await TwitterAPI.follow(targetId, token ?? '');
        else if (action === 'send_dm') await TwitterAPI.sendDM(targetId, message ?? '', token ?? '');
        break;
      case 'facebook':
        if (action === 'like') await FacebookAPI.like(targetId, token ?? '');
        else if (action === 'follow') await FacebookAPI.follow(targetId, token ?? '');
        else if (action === 'send_dm') await FacebookAPI.sendDM(targetId, message ?? '', token ?? '');
        break;
      case 'linkedin':
        if (action === 'follow') await LinkedInAPI.follow(targetId, token ?? '');
        else if (action === 'send_dm') await LinkedInAPI.sendDM(targetId, message ?? '', token ?? '');
        break;
      default:
        break;
    }
  }
}

// ─── Pexels Service ───────────────────────────────────────────────────────────

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY as string;

export class PexelsService {
  static async searchPhotos(query: string, perPage = 15): Promise<PexelsPhoto[]> {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels photos error ${res.status}`);
    const data = await res.json() as { photos: PexelsPhoto[] };
    return data.photos ?? [];
  }

  static async searchVideos(query: string, perPage = 10): Promise<PexelsVideo[]> {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels videos error ${res.status}`);
    const data = await res.json() as { videos: PexelsVideo[] };
    return data.videos ?? [];
  }

  static async getPopularVideos(perPage = 10): Promise<PexelsVideo[]> {
    const res = await fetch(
      `https://api.pexels.com/videos/popular?per_page=${perPage}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels popular videos error ${res.status}`);
    const data = await res.json() as { videos: PexelsVideo[] };
    return data.videos ?? [];
  }
}

// ─── Pixabay Service ──────────────────────────────────────────────────────────

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY as string;

export class PixabayService {
  static async searchImages(query: string, perPage = 15): Promise<PixabayImage[]> {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo`
    );
    if (!res.ok) throw new Error(`Pixabay error ${res.status}`);
    const data = await res.json() as { hits: PixabayImage[] };
    return data.hits ?? [];
  }

  static async searchVideos(query: string, perPage = 10): Promise<PixabayImage[]> {
    const res = await fetch(
      `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}`
    );
    if (!res.ok) throw new Error(`Pixabay videos error ${res.status}`);
    const data = await res.json() as { hits: PixabayImage[] };
    return data.hits ?? [];
  }
}

// ─── Freesound Service ────────────────────────────────────────────────────────

const FREESOUND_KEY = import.meta.env.VITE_FREESOUND_API_KEY as string;

export class FreesoundService {
  static async searchTracks(query: string, pageSize = 10): Promise<FreesoundTrack[]> {
    const res = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page_size=${pageSize}&token=${FREESOUND_KEY}&fields=id,name,url,previews,duration,username,tags`
    );
    if (!res.ok) throw new Error(`Freesound error ${res.status}`);
    const data = await res.json() as { results: FreesoundTrack[] };
    return data.results ?? [];
  }

  static async getMusicTracks(pageSize = 15): Promise<FreesoundTrack[]> {
    return this.searchTracks('background music ambient', pageSize);
  }
}

// ─── AI Service (Groq) ────────────────────────────────────────────────────────

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

export interface GenerateContentOptions {
  platform: PlatformId;
  type: ContentType;
  topic: string;
  tone?: string;
  language?: string;
  audience?: string;
}

export class AIService {
  static async generateContent(options: GenerateContentOptions): Promise<GeneratedContent> {
    const { platform, type, topic, tone = 'engageant', language = 'fr', audience = 'général' } = options;

    const platformLabels: Record<PlatformId, string> = {
      tiktok: 'TikTok',
      instagram: 'Instagram',
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      youtube: 'YouTube',
      linkedin: 'LinkedIn',
    };

    const typeLabels: Record<string, string> = {
      caption: 'une légende (caption)',
      script: 'un script de vidéo',
      hashtags: 'une liste de hashtags',
      bio: 'une biographie de profil',
      tweet: 'un tweet',
      post: 'un post',
      story: 'un texte pour une story',
      dm: 'un message direct',
      thread: 'un thread',
      ad_copy: 'un texte publicitaire',
    };

    const systemPrompt = `Tu es un expert en marketing des réseaux sociaux. Tu génères du contenu optimisé pour la viralité et l'engagement. Réponds toujours en ${language === 'fr' ? 'français' : 'anglais'}. Sois créatif, authentique et adapté à la plateforme.`;

    const userPrompt = `Génère ${typeLabels[type]} pour ${platformLabels[platform]}.
Sujet/thème: ${topic}
Ton: ${tone}
Public cible: ${audience}

Réponds UNIQUEMENT avec du JSON valide dans ce format exact:
{
  "content": "contenu principal ici",
  "alternatives": ["variante 1", "variante 2", "variante 3"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const text = data.choices[0]?.message?.content ?? '{}';

    let parsed: { content: string; alternatives: string[]; hashtags: string[] };
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { content: text, alternatives: [], hashtags: [] };
    }

    const content: GeneratedContent = {
      id: generateId(),
      platform,
      type,
      content: parsed.content ?? text,
      alternatives: (parsed.alternatives ?? []) as unknown as GeneratedContent[],
      hashtags: parsed.hashtags ?? [],
      createdAt: new Date().toISOString(),
      isFavorite: false,
      topic,
      tone: tone as any,
    };

    // Save to Supabase
    await SupabaseService.saveContent(content);

    return content;
  }

  static async generateStrategy(platform: PlatformId, followers: number, growthRate: number): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en croissance des réseaux sociaux. Fournis des stratégies actionnables et personnalisées.',
          },
          {
            role: 'user',
            content: `Génère une stratégie de croissance personnalisée pour un compte ${platform} avec ${followers} abonnés et un taux de croissance de ${growthRate.toFixed(2)}% par jour. Fournis 5 recommandations concrètes et actionnables en français, sous forme de liste numérotée.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!res.ok) throw new Error(`Groq strategy error ${res.status}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '';
  }
}

// ─── Content Service ──────────────────────────────────────────────────────────

export class ContentService {
  static async getAll(): Promise<GeneratedContent[]> {
    return SupabaseService.getContent();
  }

  static async toggleFavorite(content: GeneratedContent): Promise<GeneratedContent> {
    const updated = { ...content, isFavorite: !content.isFavorite };
    await SupabaseService.saveContent(updated);
    return updated;
  }

  static async delete(id: string): Promise<void> {
    await SupabaseService.deleteContent(id);
  }
}

// ─── Commission Service ───────────────────────────────────────────────────────

export class CommissionService {
  static async generateCommission(
    account: ConnectedAccount,
    previousFollowers: number
  ): Promise<Commission | null> {
    const { followers, platform, id: accountId } = account;
    const gained = followers - previousFollowers;
    if (gained <= 0) return null;

    const { getCPM, getNexusCommissionRate, estimateMonthlyRevenue } = await import('@/lib/utils');
    const cpm = getCPM(platform as any, account.region || 'CM');
    const engagement = account.engagement ?? 3;
    const monthlyRevenue = estimateMonthlyRevenue(followers as any, cpm, engagement);
    const commissionRate = getNexusCommissionRate(followers as any);
    const commissionAmountUSD = monthlyRevenue * commissionRate;

    if (commissionAmountUSD < 0.01) return null;

    const commission: Commission = {
      id: generateId(),
      platform,
      accountId,
      amount: commissionAmountUSD,
      currency: 'USD',
      status: 'pending',
      description: `Commission pour +${gained.toLocaleString()} abonnés sur ${platform}`,
      period: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
      invoiceNumber: generateInvoiceNumber(),
    };

    await SupabaseService.saveCommission(commission);
    return commission;
  }

  static async getAll(): Promise<Commission[]> {
    return SupabaseService.getCommissions();
  }

  static async markAsPaid(commission: Commission, method: Commission['paymentMethod']): Promise<Commission> {
    const updated: Commission = {
      ...commission,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: method,
    };
    await SupabaseService.saveCommission(updated);
    return updated;
  }
}

// ─── Analytics Service ────────────────────────────────────────────────────────

export class AnalyticsService {
  static async getHistory(accountId: string, days: number): Promise<AnalyticsDataPoint[]> {
    const saved = await SupabaseService.getAnalyticsHistory(accountId, days);
    if (saved.length >= 3) return saved;

    // Generate synthetic history from current account data
    return [];
  }

  static async recordSnapshot(account: ConnectedAccount): Promise<void> {
    const snapshot: AnalyticsDataPoint = {
      date: new Date().toISOString().split('T')[0],
      followers: account.followers,
      likes: account.likes,
      views: Math.round(account.followers * 4 * 0.03),
      engagement: account.engagement ?? 3,
      posts: account.posts,
    };
    await SupabaseService.saveAnalyticsSnapshot(account.id, snapshot);
  }
}
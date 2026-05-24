import type { SocialUserInfo, PlatformId } from '@/types';

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 1000));
}

function extractByRegex(html: string, patterns: [RegExp, number][]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [regex, group] of patterns) {
    const match = html.match(regex);
    if (match) result[regex.source] = match[group]?.trim() ?? '';
  }
  return result;
}

export async function scrapeTikTokProfile(username: string): Promise<SocialUserInfo> {
  await delay(2000);
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`TikTok scraping error ${res.status}`);
  const html = await res.text();

  const sigMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/);
  if (sigMatch) {
    const data = JSON.parse(sigMatch[1]);
    const user = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
    const stats = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
    if (user && stats) {
      return {
        id: String(user.id ?? user.uid ?? ''),
        username: String(user.uniqueId ?? username),
        displayName: String(user.nickname ?? username),
        avatarUrl: String(user.avatarLarger ?? user.avatarThumb ?? ''),
        bio: String(user.signature ?? ''),
        followers: Number(stats.followerCount ?? 0),
        following: Number(stats.followingCount ?? 0),
        likes: Number(stats.heartCount ?? 0),
        posts: Number(stats.videoCount ?? 0),
        verified: Boolean(user.verified),
        platform: 'tiktok',
        profileUrl: `https://tiktok.com/@${username}`,
      };
    }
  }

  const metaMatch = extractByRegex(html, [
    [/"followerCount"\s*:\s*(\d+)/g, 1],
    [/"followingCount"\s*:\s*(\d+)/g, 1],
    [/"heartCount"\s*:\s*(\d+)/g, 1],
    [/"videoCount"\s*:\s*(\d+)/g, 1],
    [/"uniqueId"\s*:\s*"([^"]+)"/g, 1],
    [/"nickname"\s*:\s*"([^"]+)"/g, 1],
    [/"avatarLarger"\s*:\s*"([^"]+)"/g, 1],
    [/"signature"\s*:\s*"([^"]+)"/g, 1],
  ]);

  if (Object.keys(metaMatch).length > 0) {
    return {
      id: username,
      username,
      displayName: metaMatch[/"nickname"\s*:\s*"([^"]+)"/g.source] ?? username,
      avatarUrl: metaMatch[/"avatarLarger"\s*:\s*"([^"]+)"/g.source] ?? '',
      bio: metaMatch[/"signature"\s*:\s*"([^"]+)"/g.source] ?? '',
      followers: Number(metaMatch[/"followerCount"\s*:\s*(\d+)/g.source] ?? 0),
      following: Number(metaMatch[/"followingCount"\s*:\s*(\d+)/g.source] ?? 0),
      likes: Number(metaMatch[/"heartCount"\s*:\s*(\d+)/g.source] ?? 0),
      posts: Number(metaMatch[/"videoCount"\s*:\s*(\d+)/g.source] ?? 0),
      verified: false,
      platform: 'tiktok',
      profileUrl: `https://tiktok.com/@${username}`,
    };
  }

  throw new Error('Scraping TikTok : impossible d\'extraire les données');
}

export async function scrapeInstagramProfile(username: string): Promise<SocialUserInfo> {
  await delay(1500);
  const res = await fetch(`https://www.instagram.com/${username}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Instagram scraping error ${res.status}`);
  const html = await res.text();

  const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});\s*<\/script>/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const user = data?.metadata?.[username] ?? data?.profilePage?.[username];
      if (user) {
        return {
          id: String(user.id ?? username),
          username,
          displayName: String(user.full_name ?? username),
          avatarUrl: String(user.profile_pic_url_hd ?? user.profile_pic_url ?? ''),
          bio: String(user.biography ?? ''),
          followers: Number(user.follower_count ?? user.edge_followed_by?.count ?? 0),
          following: Number(user.following_count ?? user.edge_follow?.count ?? 0),
          likes: 0,
          posts: Number(user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0),
          verified: Boolean(user.is_verified),
          platform: 'instagram',
          profileUrl: `https://instagram.com/${username}`,
          isPrivate: Boolean(user.is_private),
        };
      }
    } catch { /* continue */ }
  }

  const ogMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
  if (ogMatch) {
    const parts = ogMatch[1].split(', ');
    return {
      id: username,
      username,
      displayName: username,
      avatarUrl: '',
      bio: parts.slice(3).join(', '),
      followers: Number(parts[1]?.replace(/\D/g, '') ?? 0),
      following: Number(parts[2]?.replace(/\D/g, '') ?? 0),
      likes: 0,
      posts: Number(parts[0]?.replace(/\D/g, '') ?? 0),
      verified: false,
      platform: 'instagram',
      profileUrl: `https://instagram.com/${username}`,
      isPrivate: true,
    };
  }

  throw new Error('Scraping Instagram : impossible d\'extraire les données');
}

export async function scrapeYouTubeChannel(channelId: string): Promise<SocialUserInfo> {
  await delay(1000);
  const res = await fetch(`https://www.youtube.com/@${channelId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`YouTube scraping error ${res.status}`);
  const html = await res.text();

  const ytMatch = html.match(/var\s+ytInitialData\s*=\s*({.*?});/);
  if (ytMatch) {
    try {
      const data = JSON.parse(ytMatch[1]);
      const header = data?.header?.c4TabbedHeaderRenderer;
      if (header) {
        return {
          id: String(header.channelId ?? channelId),
          username: channelId,
          displayName: String(header.title ?? channelId),
          avatarUrl: String(header.avatar?.thumbnails?.[0]?.url ?? ''),
          bio: String(header.subtitle ?? ''),
          followers: Number(String(header.subscriberCountText?.simpleText ?? '0').replace(/\D/g, '')),
          following: 0,
          likes: 0,
          posts: 0,
          verified: Boolean(header.badge?.length),
          platform: 'youtube',
          profileUrl: `https://youtube.com/@${channelId}`,
        };
      }
    } catch { /* continue */ }
  }

  const subCount = html.match(/"subscriberCountText"\s*:\s*{[^}]*"simpleText"\s*:\s*"([^"]+)"/);
  const channelName = html.match(/<title>([^<]+)<\/title>/);
  return {
    id: channelId,
    username: channelId,
    displayName: channelName?.[1]?.replace(' - YouTube', '') ?? channelId,
    avatarUrl: '',
    bio: '',
    followers: Number(String(subCount?.[1] ?? '0').replace(/\D/g, '')),
    following: 0,
    likes: 0,
    posts: 0,
    verified: false,
    platform: 'youtube',
    profileUrl: `https://youtube.com/@${channelId}`,
  };
}

export async function fetchViaNitter(username: string): Promise<SocialUserInfo> {
  await delay(1000);
  const res = await fetch(`https://nitter.net/${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Nitter scraping error ${res.status}`);
  const html = await res.text();

  const nameMatch = html.match(/<a\s+class="profile-card-fullname"\s+href="[^"]*">([^<]+)</);
  const avatarMatch = html.match(/<img\s+class="profile-card-avatar"[^>]*src="([^"]+)"/);
  const bioMatch = html.match(/<div\s+class="profile-bio"[^>]*>([^<]+)</);
  const stats: string[] = [];
  html.replace(/<span\s+class="profile-stat-number"[^>]*>([^<]+)<\/span>/g, (_: string, val: string) => { stats.push(val.replace(/[^\d]/g, '')); return ''; });

  return {
    id: username,
    username,
    displayName: nameMatch?.[1]?.trim() ?? username,
    avatarUrl: avatarMatch?.[1] ?? '',
    bio: bioMatch?.[1]?.trim() ?? '',
    followers: Number(stats[1] ?? 0),
    following: Number(stats[2] ?? 0),
    likes: Number(stats[3] ?? 0),
    posts: Number(stats[0] ?? 0),
    verified: false,
    platform: 'twitter' as PlatformId,
    profileUrl: `https://twitter.com/${username}`,
  };
}

export async function fetchViaRSS(channelId: string): Promise<SocialUserInfo> {
  await delay(500);
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`RSS feed error ${res.status}`);
  const xml = await res.text();
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
  return {
    id: channelId,
    username: channelId,
    displayName: titleMatch?.[1]?.trim() ?? channelId,
    avatarUrl: '',
    bio: '',
    followers: 0,
    following: 0,
    likes: 0,
    posts: (xml.match(/<entry>/g) ?? []).length,
    verified: false,
    platform: 'youtube',
    profileUrl: `https://youtube.com/channel/${channelId}`,
  };
}

export async function extractFromPublicURL<T>(url: string, parser?: (html: string) => T): Promise<T> {
  await delay(1000);
  const proxy = 'https://api.allorigins.win/raw?url=';
  const res = await fetch(`${proxy}${encodeURIComponent(url)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Public URL extraction failed (${res.status})`);
  const html = await res.text();
  if (parser) return parser(html) as T;
  return html as unknown as T;
}

export async function searchViaGoogle<T>(_query: string): Promise<T> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string;
  const cx = import.meta.env.VITE_GOOGLE_CX as string;
  if (!apiKey || !cx) throw new Error('Google Custom Search API non configurée');
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(_query)}`
  );
  if (!res.ok) throw new Error(`Google Search error ${res.status}`);
  const data = await res.json() as { items?: { snippet: string; link: string }[] };
  if (!data.items?.length) throw new Error('Aucun résultat Google');
  return data as unknown as T;
}

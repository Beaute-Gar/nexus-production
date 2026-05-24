export type PlatformId = 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'linkedin';

export type ContentType = 'caption' | 'hashtags' | 'script' | 'bio' | 'dm' | 'thread' | 'ad_copy' | 'tweet' | 'post' | 'story';
export type ContentTone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'promotional';
export type ContentLanguage = 'fr' | 'en' | 'es' | 'de' | 'pt';
export type Language = 'fr' | 'en';
export type Theme = 'dark' | 'light' | 'system';
export type PaymentMethod = 'mtn_momo' | 'orange_money' | 'card';
export type Currency = 'XAF' | 'USD' | 'EUR';
export type VideoAspectRatio = '9:16' | '16:9' | '1:1' | '4:5';
export type MediaType = 'image' | 'video' | 'audio' | 'template' | 'asset';
export type TriggerType = 'new_follower' | 'comment_received' | 'mention' | 'dm_received' | 'post_liked' | 'new_subscriber' | 'scheduled';
export type ActionType = 'follow_user' | 'like_post' | 'reply_comment' | 'send_dm' | 'publish_post' | 'add_to_list';

export interface ConnectedAccount {
  id: string;
  platform: PlatformId;
  username: string;
  displayName: string;
  avatarUrl: string;
  followers: number;
  following: number;
  likes: number;
  posts: number;
  verified: boolean;
  engagement: number;
  region: string;
  connectedAt: string;
  lastSyncAt: string;
  profileUrl?: string;
  accessToken?: string;
  historicalFollowers?: { date: string; count: number }[];
  bio?: string;
}

export interface TrendingItem {
  id: string;
  platform: PlatformId;
  name: string;
  usageCount: number;
  growth: number;
  thumbnail?: string;
  type?: string;
}

export interface GeneratedContent {
  id: string;
  platform: PlatformId;
  type: ContentType;
  content: string;
  alternatives?: GeneratedContent[];
  hashtags?: string[];
  createdAt: string;
  isFavorite?: boolean;
  topic?: string;
  tone?: ContentTone;
}

export interface AutomationRule {
  id: string;
  name: string;
  platform: PlatformId;
  trigger: TriggerType;
  action: ActionType;
  actionMessage?: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  schedule?: string;
}

export interface AutomationLog {
  id: string;
  ruleId?: string;
  platform: PlatformId;
  action: string;
  success: boolean;
  message?: string;
  ruleName?: string;
  target?: string;
  targetUsername?: string;
  executedAt: string;
  metricsBefore?: { followers: number; likes: number; following: number };
  metricsAfter?: { followers: number; likes: number; following: number };
}

export interface AnalyticsDataPoint {
  date: string;
  followers: number;
  likes: number;
  views: number;
  engagement: number;
  posts: number;
}

export interface Commission {
  id: string;
  platform?: PlatformId;
  accountId?: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'paid' | 'cancelled';
  description?: string;
  period?: string;
  createdAt: string;
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface MonetizationProgram {
  id: string;
  platform: PlatformId;
  name: string;
  description?: string;
  minFollowers: number;
  requirements?: string[];
  currentFollowers?: number;
  eligible?: boolean;
  estimatedRevenue?: number;
}

export interface GrowthMilestone {
  id: string;
  platform: PlatformId;
  accountId?: string;
  target: number;
  current: number;
  achieved?: boolean;
  achievedAt?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type?: string;
  browser: string;
  os: string;
  ip?: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  desktopEnabled: boolean;
  newFollower: boolean;
  newComment: boolean;
  newLike: boolean;
  automationExecuted: boolean;
  milestoneReached: boolean;
  commissionDue: boolean;
}

export interface AppSettings {
  currency: Currency;
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  autoSync: boolean;
  syncInterval: number;
  securityLevel: 'low' | 'medium' | 'high';
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  lastLogin?: string;
}

export interface VideoProject {
  id: string;
  name: string;
  platform?: PlatformId;
  aspectRatio: VideoAspectRatio;
  duration: number;
  tracks: TimelineTrack[];
  assets: MediaAsset[];
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  source: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  photographer?: string;
  duration?: number;
  width?: number;
  height?: number;
  license?: string;
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'overlay';
  clips: TimelineClip[];
  label?: string;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  startTime: number;
  endTime: number;
  text?: string;
  trackOffset?: number;
  volume?: number;
  opacity?: number;
  speed?: number;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  src: { large: string; small: string };
  alt?: string;
}

export interface PexelsVideo {
  id: number;
  image: string;
  duration: number;
  width: number;
  height: number;
  user: { name: string };
  video_files: { link: string; quality: string }[];
}

export interface PixabayImage {
  id: number;
  webformatURL: string;
  previewURL: string;
  tags: string;
  user: string;
}

export interface FreesoundTrack {
  id: number;
  name: string;
  username: string;
  duration: number;
  previews: { 'preview-hq-mp3': string };
}

export interface SocialUserInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  followers: number;
  following: number;
  likes: number;
  posts: number;
  verified: boolean;
  platform: PlatformId;
  profileUrl?: string;
  engagement?: number;
  region?: string;
  historicalFollowers?: { date: string; count: number }[];
  isPrivate?: boolean;
}

export interface ScheduledPost {
  id: string;
  platform: PlatformId;
  content: string;
  mediaUrls?: string[];
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  publishedAt?: string;
  results?: { likes: number; comments: number; shares: number; reach: number };
}

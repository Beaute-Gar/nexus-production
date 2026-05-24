import { create } from 'zustand';
import type { ConnectedAccount, GeneratedContent, AutomationRule, AutomationLog, VideoProject, Commission, GrowthMilestone, AppSettings, Currency, Theme, Language, PlatformId } from '@/types';

interface LiveMetrics {
  followers: number;
  likes: number;
  following: number;
  posts: number;
}

interface AppStore {
  isSidebarCollapsed: boolean;
  user: { id: string; name: string; email: string; avatarUrl?: string; plan: string; countryCode: string } | null;
  connectedAccounts: ConnectedAccount[];
  contentHistory: GeneratedContent[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  videoProjects: VideoProject[];
  activeProjectId: string | null;
  commissions: Commission[];
  growthMilestones: GrowthMilestone[];
  milestones: GrowthMilestone[];
  settings: AppSettings;
  isLoading: boolean;
  isInitialized: boolean;
  lastSyncAt: string | null;
  liveMetrics: LiveMetrics;

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setUser: (user: any) => void;
  logout: () => void;

  addAccount: (account: ConnectedAccount) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, data: Partial<ConnectedAccount>) => void;
  syncAccount: (id: string) => void;

  addContent: (content: GeneratedContent) => void;
  removeContent: (id: string) => void;
  toggleFavoriteContent: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearContentHistory: () => void;
  loadContent: () => void;

  addRule: (rule: AutomationRule) => void;
  updateRule: (id: string, data: Partial<AutomationRule>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  addAutomationLog: (log: AutomationLog) => void;
  addLog: (log: AutomationLog) => void;
  loadRules: () => void;
  loadLogs: () => void;

  addVideoProject: (project: VideoProject) => void;
  updateVideoProject: (id: string, data: Partial<VideoProject>) => void;
  removeVideoProject: (id: string) => void;
  addProject: (project: VideoProject) => void;
  updateProject: (id: string, data: Partial<VideoProject>) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  loadProjects: () => void;

  addCommission: (commission: Commission) => void;
  updateCommission: (id: string, data: Partial<Commission>) => void;
  markCommissionPaid: (id: string) => void;
  loadCommissions: () => void;

  addMilestone: (milestone: GrowthMilestone) => void;
  updateMilestone: (id: string, data: Partial<GrowthMilestone>) => void;
  loadMilestones: () => void;

  setConnectedDevices: (devices: any[]) => void;
  removeDevice: (id: string) => void;
  setGrowthMilestones: (m: GrowthMilestone[]) => void;

  setAnalyticsPeriod: (period: string) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  updateNotificationSettings: (ns: any) => void;
  updateSecuritySettings: (ss: any) => void;
  resetSettings: () => void;

  setCurrency: (c: Currency) => void;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;

  setLoading: (v: boolean) => void;
  setLastSyncAt: (v: string) => void;

  updateLiveMetrics: (metrics: LiveMetrics) => void;
  initializeApp: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  currency: 'XAF',
  theme: 'dark',
  language: 'fr',
  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    desktopEnabled: true,
    newFollower: true,
    newComment: true,
    newLike: true,
    automationExecuted: true,
    milestoneReached: true,
    commissionDue: true,
  },
  autoSync: true,
  syncInterval: 30,
  securityLevel: 'low',
  twoFactorEnabled: false,
};

export const useAppStore = create<AppStore>((set, get) => ({
  isSidebarCollapsed: false,
  user: null,
  connectedAccounts: [],
  contentHistory: [],
  automationRules: [],
  automationLogs: [],
  videoProjects: [],
  activeProjectId: null,
  commissions: [],
  growthMilestones: [],
  milestones: [],
  settings: defaultSettings,
  isLoading: false,
  isInitialized: false,
  lastSyncAt: null,
  liveMetrics: { followers: 0, likes: 0, following: 0, posts: 0 },

  toggleSidebar: () => set(s => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),
  setUser: (user) => set({ user }),
  logout: async () => {
    const { supabase } = await import('@/services/nexusApi');
    await supabase.auth.signOut();
    set({ user: null, connectedAccounts: [], contentHistory: [], automationRules: [],
      automationLogs: [], videoProjects: [], commissions: [], milestones: [], growthMilestones: [] });
  },

  addAccount: (account) => set(s => ({ connectedAccounts: [...s.connectedAccounts, account] })),
  removeAccount: (id) => set(s => ({ connectedAccounts: s.connectedAccounts.filter(a => a.id !== id) })),
  updateAccount: (id, data) => set(s => ({
    connectedAccounts: s.connectedAccounts.map(a => a.id === id ? { ...a, ...data } : a),
  })),
  syncAccount: async (id) => {
    const state = get();
    const account = state.connectedAccounts.find(a => a.id === id);
    if (!account) return;
    try {
      const { SocialDataService } = await import('@/services/nexusApi');
      const fresh = await SocialDataService.getUserInfo(account.platform, account.username);
      const { calculateEngagementRate } = await import('@/lib/utils');
      const engagement = calculateEngagementRate(fresh.likes, fresh.followers, fresh.posts);
      set(s => ({
        connectedAccounts: s.connectedAccounts.map(a =>
          a.id === id ? {
            ...a, followers: fresh.followers, following: fresh.following,
            likes: fresh.likes, posts: fresh.posts, avatarUrl: fresh.avatarUrl,
            displayName: fresh.displayName, verified: fresh.verified,
            bio: fresh.bio, profileUrl: fresh.profileUrl,
            engagement, lastSyncAt: new Date().toISOString(),
            historicalFollowers: [
              ...(a.historicalFollowers ?? []).slice(-29),
              { date: new Date().toISOString().split('T')[0], count: fresh.followers },
            ],
          } : a
        ),
      }));
    } catch {
      set(s => ({
        connectedAccounts: s.connectedAccounts.map(a =>
          a.id === id ? { ...a, lastSyncAt: new Date().toISOString() } : a
        ),
      }));
    }
  },

  addContent: (content) => set(s => ({ contentHistory: [content, ...s.contentHistory] })),
  removeContent: (id) => set(s => ({ contentHistory: s.contentHistory.filter(c => c.id !== id) })),
  toggleFavoriteContent: (id) => set(s => ({
    contentHistory: s.contentHistory.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c),
  })),
  toggleFavorite: (id) => get().toggleFavoriteContent(id),
  clearContentHistory: () => set({ contentHistory: [] }),
  loadContent: async () => {
    set({ isLoading: true });
    try {
      const { SupabaseService } = await import('@/services/nexusApi');
      const items = await SupabaseService.getContent();
      set({ contentHistory: items, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  addRule: (rule) => set(s => ({ automationRules: [...s.automationRules, rule] })),
  updateRule: (id, data) => set(s => ({
    automationRules: s.automationRules.map(r => r.id === id ? { ...r, ...data } : r),
  })),
  removeRule: (id) => set(s => ({ automationRules: s.automationRules.filter(r => r.id !== id) })),
  toggleRule: (id) => set(s => ({
    automationRules: s.automationRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r),
  })),
  addAutomationLog: (log) => set(s => ({ automationLogs: [log, ...s.automationLogs] })),
  addLog: (log) => get().addAutomationLog(log),
  loadRules: async () => {
    try {
      const { SupabaseService } = await import('@/services/nexusApi');
      const items = await SupabaseService.getRules();
      set({ automationRules: items });
    } catch {}
  },
  loadLogs: async () => {
    try {
      const { SupabaseService } = await import('@/services/nexusApi');
      const items = await SupabaseService.getLogs();
      set({ automationLogs: items });
    } catch {}
  },

  addVideoProject: (project) => set(s => ({ videoProjects: [...s.videoProjects, project] })),
  updateVideoProject: (id, data) => set(s => ({
    videoProjects: s.videoProjects.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
  })),
  removeVideoProject: (id) => set(s => ({ videoProjects: s.videoProjects.filter(p => p.id !== id) })),
  addProject: (project) => get().addVideoProject(project),
  updateProject: (id, data) => get().updateVideoProject(id, data),
  removeProject: (id) => get().removeVideoProject(id),
  setActiveProject: (id) => set({ activeProjectId: id }),
  loadProjects: async () => {
    try {
      const { SupabaseService } = await import('@/services/nexusApi');
      const items = await SupabaseService.getProjects();
      set({ videoProjects: items });
    } catch {}
  },

  addCommission: (commission) => set(s => ({ commissions: [...s.commissions, commission] })),
  updateCommission: (id, data) => set(s => ({
    commissions: s.commissions.map(c => c.id === id ? { ...c, ...data } : c),
  })),
  markCommissionPaid: (id) => set(s => ({
    commissions: s.commissions.map(c => c.id === id ? { ...c, status: 'paid', paidAt: new Date().toISOString() } : c),
  })),
  loadCommissions: async () => {
    try {
      const { CommissionService } = await import('@/services/nexusApi');
      const items = await CommissionService.getAll();
      set({ commissions: items });
    } catch {}
  },

  addMilestone: (milestone) => set(s => ({ milestones: [...s.milestones, milestone], growthMilestones: [...s.growthMilestones, milestone] })),
  updateMilestone: (id, data) => set(s => ({
    milestones: s.milestones.map(m => m.id === id ? { ...m, ...data } : m),
    growthMilestones: s.growthMilestones.map(m => m.id === id ? { ...m, ...data } : m),
  })),
  loadMilestones: async () => {
    try {
      const { SupabaseService } = await import('@/services/nexusApi');
      const items = await SupabaseService.getMilestones();
      set({ milestones: items, growthMilestones: items });
    } catch {}
  },

  setConnectedDevices: () => {},
  removeDevice: () => {},
  setGrowthMilestones: (m) => set({ growthMilestones: m, milestones: m }),

  setAnalyticsPeriod: () => {},

  updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
  updateNotificationSettings: (ns) => set(s => ({
    settings: { ...s.settings, notifications: { ...s.settings.notifications, ...ns } },
  })),
  updateSecuritySettings: (ss) => set(s => ({
    settings: { ...s.settings, ...ss },
  })),
  resetSettings: () => set({ settings: defaultSettings }),

  setCurrency: (c) => set(s => ({ settings: { ...s.settings, currency: c } })),
  setTheme: (t) => set(s => ({ settings: { ...s.settings, theme: t } })),
  setLanguage: (l) => set(s => ({ settings: { ...s.settings, language: l } })),

  setLoading: (v) => set({ isLoading: v }),
  setLastSyncAt: (v) => set({ lastSyncAt: v }),

  updateLiveMetrics: (metrics) => set({ liveMetrics: metrics }),

  initializeApp: async () => {
    const state = get();
    if (state.isInitialized) return;
    set({ isLoading: true });
    try {
      const { supabase } = await import('@/services/nexusApi');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) set({ user: { id: session.user.id, name: session.user.user_metadata?.full_name || 'Utilisateur', email: session.user.email || '', plan: 'free', countryCode: 'CM' } });
      await get().loadContent();
      await get().loadRules();
      await get().loadLogs();
      await get().loadProjects();
      await get().loadCommissions();
      await get().loadMilestones();
      set({ isInitialized: true, isLoading: false, lastSyncAt: new Date().toISOString() });
    } catch { set({ isInitialized: true, isLoading: false }); }
  },
}));

export const useTheme = () => useAppStore(s => s.settings.theme);
export const useIsSidebarCollapsed = () => useAppStore(s => s.isSidebarCollapsed);
export const useUser = () => useAppStore(s => s.user);
export const useConnectedAccounts = () => useAppStore(s => s.connectedAccounts);

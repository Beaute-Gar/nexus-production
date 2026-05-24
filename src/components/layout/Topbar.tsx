import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, RefreshCw, User, LogOut,
  Settings, ChevronDown, Hexagon,
} from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { useAppStore, useUser, useConnectedAccounts } from '@/store/useAppStore';
import { supabase } from '@/services/nexusApi';

// ─────────────────────────────────────────
// CONFIG ROUTES → TITRES
// ─────────────────────────────────────────

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/connect':      { title: 'Connexion Plateformes',  subtitle: 'Connecte tes comptes réseaux sociaux' },
  '/overview':     { title: 'Aperçu Global',           subtitle: 'Vue synthétique de tes performances' },
  '/analytics':    { title: 'Analytics',               subtitle: 'Analyse détaillée par plateforme' },
  '/growth':       { title: 'Stratégie de Croissance', subtitle: 'Projections et objectifs abonnés' },
  '/automation':   { title: 'Automation',              subtitle: 'Règles automatiques et planification' },
  '/ai-creator':   { title: 'IA Créateur',             subtitle: 'Génération de contenu par Groq Llama 3' },
  '/video-studio': { title: 'Studio Vidéo',            subtitle: 'Assets Pexels pour tes créations' },
  '/monetization': { title: 'Monétisation',            subtitle: 'Suivi des revenus et partenariats' },
  '/commissions':  { title: 'Commissions',             subtitle: 'Liens affiliés et historique gains' },
  '/settings':     { title: 'Paramètres',              subtitle: 'Configuration de ton espace Nexus' },
};

interface Notification {
  id:      string;
  title:   string;
  message: string;
  time:    string;
  isRead:  boolean;
  type:    'success' | 'info' | 'warning';
}

const NOTIF_COLORS = {
  success: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400',
  info:    'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  warning: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
};

// ─────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────

export default function Topbar() {
  const location         = useLocation();
  const navigate         = useNavigate();
  const user             = useUser();
  const accounts         = useConnectedAccounts();
  const isSidebarCollapsed = useAppStore(s => s.isSidebarCollapsed);
  const automationLogs = useAppStore(s => s.automationLogs);
  const contentHistory = useAppStore(s => s.contentHistory);

  const [isRefreshing,     setIsRefreshing]     = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile,       setShowProfile]       = useState(false);
  const [searchValue,       setSearchValue]       = useState('');

  const pageInfo   = PAGE_TITLES[location.pathname] ?? { title: 'Nexus Analytics', subtitle: '' };

  // Real notifications derived from store data
  const notifications: Notification[] = [
    ...automationLogs.slice(0, 5).map(log => ({
      id: log.id, type: log.status === 'success' ? 'success' as const : log.status === 'error' ? 'warning' as const : 'info' as const,
      title: log.action, message: log.details || '', time: log.executedAt, isRead: false,
    })),
    ...contentHistory.slice(0, 3).map(c => ({
      id: c.id, type: 'info' as const, title: 'Contenu généré', message: c.content.slice(0, 80), time: c.createdAt, isRead: false,
    })),
    ...accounts.filter(a => {
      const h = a.lastSyncAt ? new Date(a.lastSyncAt) : null;
      return h && (Date.now() - h.getTime()) > 86400000;
    }).map(a => ({
      id: a.id + '-sync', type: 'warning' as const, title: 'Sync en attente',
      message: `${a.username} non synchronisé depuis 24h+`, time: a.lastSyncAt || '', isRead: true,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    useAppStore.getState().setUser(null);
    navigate('/connect');
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-[var(--topbar-height)]',
        'flex items-center justify-between px-6',
        'bg-deep/80 border-b border-border glass',
        'transition-all duration-300'
      )}
      style={{
        left: isSidebarCollapsed
          ? 'var(--sidebar-width-collapsed)'
          : 'var(--sidebar-width)',
      }}
    >
      {/* ── Titre de page ───────────────────── */}
      <div className="min-w-0">
        <h1 className="text-base font-bold text-text-primary leading-tight truncate">
          {pageInfo.title}
        </h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-text-muted truncate">{pageInfo.subtitle}</p>
        )}
      </div>

      {/* ── Actions ─────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Recherche */}
        <div className="relative hidden md:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="h-9 pl-9 pr-4 w-48 lg:w-64 rounded-xl text-sm
                       bg-surface border border-border text-text-primary
                       placeholder:text-text-muted
                       focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20
                       transition-all duration-150"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="btn-icon"
          title="Actualiser les données"
        >
          <RefreshCw
            size={15}
            className={cn('transition-transform', isRefreshing && 'animate-spin')}
          />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(p => !p); setShowProfile(false); }}
            className={cn('btn-icon relative', showNotifications && 'border-border-bright text-text-primary')}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                               bg-cyan-500 text-void text-2xs font-bold
                               flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{   opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl
                           bg-overlay border border-border shadow-card z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Tout lire
                    </button>
                  )}
                </div>

                <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 transition-colors',
                        notif.isRead ? 'opacity-60' : 'bg-surface/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded text-2xs font-bold border',
                          NOTIF_COLORS[notif.type]
                        )}>
                          {notif.type === 'success' ? '✓' : notif.type === 'warning' ? '!' : 'i'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-2xs text-text-muted mt-1">
                            {formatRelativeDate(notif.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profil utilisateur */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(p => !p); setShowNotifications(false); }}
            className={cn(
              'flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl',
              'bg-surface border border-border hover:border-border-bright',
              'transition-all duration-150',
              showProfile && 'border-border-bright'
            )}
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30
                            flex items-center justify-center flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
              ) : (
                <Hexagon size={12} className="text-cyan-400" />
              )}
            </div>
            <span className="hidden sm:block text-xs font-medium text-text-primary max-w-[80px] truncate">
              {user?.name ?? 'Djousse'}
            </span>
            <ChevronDown
              size={12}
              className={cn(
                'text-text-muted transition-transform duration-200',
                showProfile && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{   opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl
                           bg-overlay border border-border shadow-card z-50 overflow-hidden"
              >
                {/* Infos utilisateur */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user?.name ?? 'Utilisateur'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user?.email ?? 'non connecté'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="status-dot-green w-1.5 h-1.5" />
                    <span className="text-2xs text-emerald-400">
                      {accounts.length} compte{accounts.length > 1 ? 's' : ''} connecté{accounts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { navigate('/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                               text-sm text-text-secondary hover:text-text-primary hover:bg-raised
                               transition-all duration-100"
                  >
                    <Settings size={14} />
                    Paramètres
                  </button>
                  <button
                    onClick={() => { navigate('/connect'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                               text-sm text-text-secondary hover:text-text-primary hover:bg-raised
                               transition-all duration-100"
                  >
                    <User size={14} />
                    Mes comptes
                  </button>
                </div>

                <div className="p-1.5 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                               text-sm text-rose-400 hover:bg-rose-500/10
                               transition-all duration-100"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay pour fermer les dropdowns */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowProfile(false); }}
        />
      )}
    </header>
  );
}
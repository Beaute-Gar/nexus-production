import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Zap,
  Wand2,
  Video,
  DollarSign,
  Award,
  Settings,
  Plug,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useIsSidebarCollapsed } from '@/store/useAppStore';

// ─────────────────────────────────────────
// CONFIG NAVIGATION
// ─────────────────────────────────────────

interface NavSection {
  label: string;
  items: NavItemConfig[];
}

interface NavItemConfig {
  path:  string;
  label: string;
  icon:  React.ElementType;
  badge?: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { path: '/connect',  label: 'Connexion',   icon: Plug          },
      { path: '/overview', label: 'Aperçu',       icon: LayoutDashboard },
      { path: '/analytics', label: 'Analytics',   icon: BarChart3     },
      { path: '/growth',   label: 'Croissance',   icon: TrendingUp    },
    ],
  },
  {
    label: 'Outils',
    items: [
      { path: '/automation',      label: 'Automation',      icon: Zap,    badge: 'BETA' },
      { path: '/nexus-ai-studio', label: 'Nexus AI Studio', icon: Cpu,    badge: 'NEW'  },
      { path: '/ai-creator',      label: 'IA Créateur',     icon: Wand2              },
      { path: '/video-studio',    label: 'Studio Vidéo',    icon: Video              },
    ],
  },
  {
    label: 'Revenus',
    items: [
      { path: '/monetization', label: 'Monétisation',  icon: DollarSign },
      { path: '/commissions',  label: 'Commissions',   icon: Award      },
    ],
  },
  {
    label: 'Système',
    items: [
      { path: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

// ─────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────

function SidebarNavItem({
  item,
  isCollapsed,
}: {
  item:        NavItemConfig;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
          'text-sm font-medium transition-all duration-150 group',
          isActive
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-raised border border-transparent'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicateur actif */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            />
          )}

          {/* Icône */}
          <span className={cn('relative z-10 flex-shrink-0', isActive && 'text-cyan-400')}>
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          </span>

          {/* Label */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{   opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="relative z-10 whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge && !isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 ml-auto px-1.5 py-0.5 rounded text-2xs font-bold
                         bg-violet-500/20 text-violet-400 border border-violet-500/30"
            >
              {item.badge}
            </motion.span>
          )}

          {/* Tooltip quand collapsed */}
          {isCollapsed && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg z-50
                         bg-overlay border border-border text-xs text-text-primary
                         whitespace-nowrap pointer-events-none shadow-card
                         opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              {item.label}
              {item.badge && (
                <span className="ml-1.5 text-violet-400 font-bold">{item.badge}</span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─────────────────────────────────────────
// SIDEBAR PRINCIPALE
// ─────────────────────────────────────────

export default function Sidebar() {
  const isCollapsed  = useIsSidebarCollapsed();
  const toggleSidebar = useAppStore(s => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 h-full z-40 flex flex-col
                 bg-sidebar-gradient border-r border-border overflow-hidden"
    >
      {/* ── Logo ────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30
                        flex items-center justify-center shadow-glow-sm">
          <Hexagon size={16} className="text-cyan-400" strokeWidth={2.5} />
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{   opacity: 0, x: -8  }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-text-primary whitespace-nowrap leading-tight">
                Nexus Analytics
              </p>
              <p className="text-2xs text-text-muted whitespace-nowrap">
                Djousse Tech Evolution
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ──────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-hide space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {/* Label de section */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{   opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 mb-1.5 text-2xs font-semibold text-text-muted uppercase tracking-widest"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {isCollapsed && (
              <div className="mx-2 mb-2 h-px bg-border/50" />
            )}

            <div className="space-y-0.5">
              {section.items.map(item => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Toggle collapse ─────────────────────── */}
      <div className="flex-shrink-0 p-2 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     text-text-muted hover:text-text-primary hover:bg-raised
                     transition-all duration-150 group"
        >
          {isCollapsed
            ? <ChevronRight size={16} className="group-hover:text-cyan-400 transition-colors" />
            : (
              <>
                <ChevronLeft size={16} className="group-hover:text-cyan-400 transition-colors" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs whitespace-nowrap"
                >
                  Réduire
                </motion.span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  );
}
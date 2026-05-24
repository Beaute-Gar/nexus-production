import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

import { useAppStore, useTheme } from '@/store/useAppStore';

import Sidebar from '@/components/layout/Sidebar';
import Topbar  from '@/components/layout/Topbar';

import Overview          from '@/components/modules/Overview';
import Analytics         from '@/components/modules/Analytics';
import Automation        from '@/components/modules/Automation';
import AICreator         from '@/components/modules/AICreator';
import VideoStudio       from '@/components/modules/VideoStudio';
import NexusAIStudio     from '@/components/modules/NexusAIStudio';
import Growth            from '@/components/modules/Growth';
import Monetization      from '@/components/modules/Monetization';
import CommissionHistory from '@/components/modules/CommissionHistory';
import PlatformConnect   from '@/components/modules/PlatformConnect';
import SettingsModule    from '@/components/modules/SettingsModule';

function AppLayout({ children }: { children: React.ReactNode }) {
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-deep">
      <Sidebar />
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-slow"
        style={{
          marginLeft: isSidebarCollapsed
            ? 'var(--sidebar-width-collapsed)'
            : 'var(--sidebar-width)',
        }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initializeApp = useAppStore(s => s.initializeApp);
  useEffect(() => { initializeApp(); }, [initializeApp]);
  return <>{children}</>;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

    root.classList.toggle('dark', isDark);
  }, [theme]);

  return <>{children}</>;
}

function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-900/80 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
        <div className="text-sm text-gray-300 space-y-4 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <p><strong>Dernière mise à jour :</strong> Mai 2026</p>
      <h2 className="text-lg font-semibold text-white mt-6">1. Acceptation des conditions</h2>
      <p>En utilisant Nexus Analytics Pro ("l'Application"), vous acceptez les présentes conditions d'utilisation.</p>
      <h2 className="text-lg font-semibold text-white mt-6">2. Description du service</h2>
      <p>L'Application permet aux créateurs de contenu de gérer leur présence sur les réseaux sociaux via des outils d'analyse, d'automatisation et de création de contenu assistée par IA.</p>
      <h2 className="text-lg font-semibold text-white mt-6">3. Authentification OAuth</h2>
      <p>L'Application utilise TikTok OAuth 2.0 pour se connecter à votre compte. Nous ne stockons jamais vos mots de passe. Les tokens d'accès sont utilisés uniquement pour les fonctionnalités que vous activez explicitement.</p>
      <h2 className="text-lg font-semibold text-white mt-6">4. Utilisation des données</h2>
      <p>Nous accédons uniquement aux données nécessaires au fonctionnement de l'application : informations de profil public, statistiques de compte, et liste de vidéos. Aucune donnée n'est revendue à des tiers.</p>
      <h2 className="text-lg font-semibold text-white mt-6">5. Limitation de responsabilité</h2>
      <p>L'Application est fournie "telle quelle". Nous ne sommes pas responsables des dommages indirects liés à l'utilisation du service.</p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p><strong>Dernière mise à jour :</strong> Mai 2026</p>
      <h2 className="text-lg font-semibold text-white mt-6">1. Données collectées</h2>
      <p>Nous collectons : votre nom d'utilisateur TikTok, photo de profil, statistiques publiques (followers, likes, vidéos), et les tokens OAuth nécessaires au fonctionnement.</p>
      <h2 className="text-lg font-semibold text-white mt-6">2. Utilisation des données</h2>
      <p>Les données sont utilisées uniquement pour : afficher vos analytics, exécuter les actions d'automatisation que vous configurez, et améliorer le service.</p>
      <h2 className="text-lg font-semibold text-white mt-6">3. Stockage</h2>
      <p>Les tokens OAuth sont stockés de manière sécurisée via Supabase. Vous pouvez révoquer l'accès à tout moment depuis les paramètres TikTok.</p>
      <h2 className="text-lg font-semibold text-white mt-6">4. Partage des données</h2>
      <p>Nous ne partageons aucune donnée personnelle avec des tiers. Les données agrégées et anonymisées peuvent être utilisées à des fins statistiques.</p>
      <h2 className="text-lg font-semibold text-white mt-6">5. Contact</h2>
      <p>Pour toute question concernant vos données : support@nexus-analytics.app</p>
    </>
  );
}

export default function App() {
  return (
    <AppInitializer>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />

          <Route
            path="/overview"
            element={
              <AppLayout>
                <Overview />
              </AppLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <AppLayout>
                <Analytics />
              </AppLayout>
            }
          />
          <Route
            path="/automation"
            element={
              <AppLayout>
                <Automation />
              </AppLayout>
            }
          />
          <Route
            path="/nexus-ai-studio"
            element={
              <AppLayout>
                <NexusAIStudio />
              </AppLayout>
            }
          />
          <Route
            path="/ai-creator"
            element={
              <AppLayout>
                <AICreator />
              </AppLayout>
            }
          />
          <Route
            path="/video-studio"
            element={
              <AppLayout>
                <VideoStudio />
              </AppLayout>
            }
          />
          <Route
            path="/growth"
            element={
              <AppLayout>
                <Growth />
              </AppLayout>
            }
          />
          <Route
            path="/monetization"
            element={
              <AppLayout>
                <Monetization />
              </AppLayout>
            }
          />
          <Route
            path="/commissions"
            element={
              <AppLayout>
                <CommissionHistory />
              </AppLayout>
            }
          />
          <Route
            path="/connect"
            element={
              <AppLayout>
                <PlatformConnect />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsModule />
              </AppLayout>
            }
          />

          <Route path="/terms" element={<StaticPage title="Conditions d'utilisation"><TermsContent /></StaticPage>} />
          <Route path="/privacy" element={<StaticPage title="Politique de confidentialité"><PrivacyContent /></StaticPage>} />

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '0.5px solid var(--color-border-default)',
              fontSize: '0.8125rem',
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
    </AppInitializer>
  );
}

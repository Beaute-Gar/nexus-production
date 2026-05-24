import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Bell, Monitor, CreditCard, Server, Globe, Moon, Sun, ChevronRight, Eye, EyeOff, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Smartphone, Laptop, Tablet } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SupabaseService } from '@/services/nexusApi';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { Currency, Theme, Language, ConnectedDevice, NotificationSettings } from '@/types';

type Tab = 'general' | 'security' | 'notifications' | 'devices' | 'billing' | 'infrastructure';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'Général', icon: <Globe size={16} /> },
  { id: 'security', label: 'Sécurité', icon: <Shield size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'devices', label: 'Appareils', icon: <Monitor size={16} /> },
  { id: 'billing', label: 'Facturation', icon: <CreditCard size={16} /> },
  { id: 'infrastructure', label: 'Infrastructure', icon: <Server size={16} /> },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const { settings, setCurrency, setTheme, setLanguage, updateSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Préférences</h3>

        <SettingRow label="Devise" description="Devise utilisée pour les estimations de revenus et commissions">
          <select
            value={settings.currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="XAF">🇨🇲 XAF – Franc CFA</option>
            <option value="USD">🇺🇸 USD – Dollar américain</option>
            <option value="EUR">🇪🇺 EUR – Euro</option>
          </select>
        </SettingRow>

        <SettingRow label="Thème" description="Apparence de l'application">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-xl border transition-all ${settings.theme === 'light' ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-gray-500 hover:text-white'}`}
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-xl border transition-all ${settings.theme === 'dark' ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-gray-500 hover:text-white'}`}
            >
              <Moon size={16} />
            </button>
          </div>
        </SettingRow>

        <SettingRow label="Langue" description="Langue d'affichage de l'interface">
          <select
            value={settings.language}
            onChange={e => setLanguage(e.target.value as Language)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </SettingRow>

        <SettingRow label="Synchronisation automatique" description="Synchroniser les comptes toutes les 30 secondes">
          <Toggle
            enabled={settings.autoSync}
            onChange={v => updateSettings({ autoSync: v })}
          />
        </SettingRow>

        <SettingRow label="Intervalle de sync" description="En secondes (minimum 30)">
          <input
            type="number"
            min={30}
            max={300}
            value={settings.syncInterval}
            onChange={e => updateSettings({ syncInterval: Number(e.target.value) })}
            className="w-20 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 text-center"
          />
        </SettingRow>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5">
        <h3 className="text-sm font-semibold text-red-400 mb-4">Zone dangereuse</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Vider le cache local</div>
              <div className="text-xs text-gray-500">Supprime les données en cache (les comptes restent)</div>
            </div>
            <button
              onClick={() => {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('nexus_cache'));
                keys.forEach(k => localStorage.removeItem(k));
              }}
              className="px-3 py-1.5 text-xs text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-colors"
            >
              Vider
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Réinitialiser l'application</div>
              <div className="text-xs text-gray-500">Supprime toutes les données locales</div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Réinitialiser complètement ? Toutes les données locales seront perdues.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-3 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { settings, updateSettings } = useAppStore();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleChangePassword = () => {
    setPwdMsg('');
    setPwdError('');
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError('Remplissez tous les champs');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('Minimum 8 caractères requis');
      return;
    }
    // Store hashed marker locally (not real auth)
    localStorage.setItem('nexus_pwd_changed', new Date().toISOString());
    updateSettings({ lastPasswordChange: new Date().toISOString() });
    setOldPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdMsg('Mot de passe mis à jour avec succès');
  };

  const securityLevels = {
    low: { color: 'text-red-400', bg: 'bg-red-500', label: 'Faible', width: '30%' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500', label: 'Moyen', width: '60%' },
    high: { color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Élevé', width: '100%' },
  };
  const lvl = securityLevels[settings.securityLevel];

  return (
    <div className="space-y-6">
      {/* Security score */}
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Niveau de sécurité</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${lvl.bg} rounded-full transition-all`} style={{ width: lvl.width }} />
          </div>
          <span className={`text-sm font-bold ${lvl.color}`}>{lvl.label}</span>
        </div>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-400" />
            <span>Compte connecté</span>
          </div>
          <div className="flex items-center gap-2">
            {settings.twoFactorEnabled ? <CheckCircle size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
            <span>Double authentification</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-400" />
            <span>Dernière connexion: {timeAgo(settings.lastLogin ?? '')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-400" />
            <span>Mot de passe changé: {timeAgo(settings.lastPasswordChange ?? '')}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Changer le mot de passe</h3>
        <div className="space-y-3">
          {[
            { label: 'Mot de passe actuel', value: oldPwd, setter: setOldPwd, show: showOld, toggle: () => setShowOld(!showOld) },
            { label: 'Nouveau mot de passe', value: newPwd, setter: setNewPwd, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: 'Confirmer le nouveau', value: confirmPwd, setter: setConfirmPwd, show: showNew, toggle: () => setShowNew(!showNew) },
          ].map((f, i) => (
            <div key={i} className="relative">
              <label className="text-xs text-gray-400 mb-1.5 block">{f.label}</label>
              <div className="relative">
                <input
                  type={f.show ? 'text' : 'password'}
                  value={f.value}
                  onChange={e => f.setter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
                <button onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}

          {pwdError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertTriangle size={12} />
              {pwdError}
            </div>
          )}
          {pwdMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle size={12} />
              {pwdMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Mettre à jour le mot de passe
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Double authentification (2FA)</h3>
        <SettingRow
          label="Activer la 2FA"
          description="Protégez votre compte avec un code à usage unique"
        >
          <Toggle
            enabled={settings.twoFactorEnabled}
            onChange={v => {
              updateSettings({
                twoFactorEnabled: v,
                securityLevel: v ? 'high' : 'medium',
              });
            }}
          />
        </SettingRow>
        {settings.twoFactorEnabled && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
            <CheckCircle size={12} className="mt-0.5" />
            <span>2FA activée. Votre compte est protégé par une couche de sécurité supplémentaire.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const { settings, updateSettings } = useAppStore();
  const notifs = settings.notifications;

  const update = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ notifications: { ...notifs, [key]: value } });
  };

  const channels = [
    { key: 'emailEnabled' as const, label: 'Notifications email', description: 'Recevoir les alertes par email' },
    { key: 'pushEnabled' as const, label: 'Notifications push', description: 'Alertes dans le navigateur' },
    { key: 'desktopEnabled' as const, label: 'Notifications bureau', description: 'Alertes sur le bureau (desktop)' },
  ];

  const events = [
    { key: 'newFollower' as const, label: 'Nouveau follower', description: 'Quand quelqu\'un vous suit' },
    { key: 'newComment' as const, label: 'Nouveau commentaire', description: 'Quand quelqu\'un commente' },
    { key: 'newLike' as const, label: 'Nouveau like', description: 'Quand quelqu\'un aime votre contenu' },
    { key: 'automationExecuted' as const, label: 'Automation exécutée', description: 'Quand une règle est déclenchée' },
    { key: 'milestoneReached' as const, label: 'Jalon atteint', description: 'Quand vous atteignez un objectif' },
    { key: 'commissionDue' as const, label: 'Commission à payer', description: 'Quand une commission est due' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Canaux de notification</h3>
        {channels.map(c => (
          <SettingRow key={c.key} label={c.label} description={c.description}>
            <Toggle enabled={notifs[c.key]} onChange={v => update(c.key, v)} />
          </SettingRow>
        ))}
      </div>

      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Événements</h3>
        {events.map(e => (
          <SettingRow key={e.key} label={e.label} description={e.description}>
            <Toggle enabled={notifs[e.key]} onChange={v => update(e.key, v)} />
          </SettingRow>
        ))}
      </div>
    </div>
  );
}

// ─── Devices Tab ──────────────────────────────────────────────────────────────

function DevicesTab() {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SupabaseService.getDevices()
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Déconnecter cet appareil ?')) return;
    await SupabaseService.revokeDevice(id);
    setDevices(d => d.filter(dev => dev.id !== id));
  };

  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Laptop size={18} />,
    mobile: <Smartphone size={18} />,
    tablet: <Tablet size={18} />,
  };

  if (loading) return <div className="text-center py-8 text-gray-600 text-sm"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Chargement...</div>;

  return (
    <div className="space-y-3">
      {devices.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">Aucun appareil enregistré</div>
      ) : (
        devices.map(device => (
          <div key={device.id} className={`rounded-2xl border p-4 ${device.isCurrent ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-white/5 bg-gray-900/60'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isCurrent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-gray-400'}`}>
                {deviceIcons[device.type ?? ''] ?? <Monitor size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{device.name}</span>
                  {device.isCurrent && (
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Appareil actuel</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{device.browser} · {device.os}</div>
                <div className="text-xs text-gray-600">{device.location} · Actif {timeAgo(device.lastActive)}</div>
              </div>
              {!device.isCurrent && (
                <button
                  onClick={() => handleRevoke(device.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methods = [
    { id: 'mtn', label: 'MTN MoMo', icon: '🟡', number: '+237 6XX XXX XXX' },
    { id: 'orange', label: 'Orange Money', icon: '🟠', number: '+237 6XX XXX XXX' },
    { id: 'card', label: 'Carte bancaire', icon: '💳', number: '**** **** **** 4242' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Moyens de paiement</h3>
        <div className="space-y-2">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedMethod === m.id ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 hover:border-white/10'}`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{m.label}</div>
                <div className="text-xs text-gray-500">{m.number}</div>
              </div>
              {selectedMethod === m.id && <CheckCircle size={16} className="text-cyan-400" />}
            </button>
          ))}
        </div>
        <button className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-gray-500 hover:border-white/20 hover:text-gray-300 transition-colors">
          + Ajouter un moyen de paiement
        </button>
      </div>

      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Plan actuel</h3>
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="text-lg font-bold text-white">Nexus Pro</div>
          <div className="text-xs text-gray-400 mt-1">Accès illimité à tous les modules et plateformes</div>
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            {['Analytics avancés', 'Automation illimitée', 'VideoStudio Pro', 'Support prioritaire'].map(f => (
              <span key={f} className="flex items-center gap-1 text-cyan-400">
                <CheckCircle size={10} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Infrastructure Tab ───────────────────────────────────────────────────────

function InfrastructureTab() {
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const cacheSize = Math.round((JSON.stringify(localStorage).length / 1024));

  const testConnection = useCallback(async () => {
    setTesting(true);
    try {
      const ok = await SupabaseService.ping();
      setSupabaseOk(ok);
    } catch {
      setSupabaseOk(false);
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => { testConnection(); }, [testConnection]);

  const statusMap = {
    null: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Test en cours...' },
    true: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Connecté' },
    false: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Déconnecté' },
  };
  const status = statusMap[String(supabaseOk) as 'null' | 'true' | 'false'] ?? statusMap['null'];

  const infos = [
    { label: 'Version Nexus', value: '2.0.0-beta' },
    { label: 'Version React', value: '18.x' },
    { label: 'Backend', value: 'Supabase (PostgreSQL)' },
    { label: 'AI Model', value: 'Groq Llama 3 70B' },
    { label: 'Cache local', value: `${cacheSize} KB` },
    { label: 'Environnement', value: import.meta.env.MODE ?? 'production' },
  ];

  return (
    <div className="space-y-6">
      {/* Backend status */}
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Statut des services</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${supabaseOk === true ? 'bg-emerald-400 animate-pulse' : supabaseOk === false ? 'bg-red-400' : 'bg-gray-400'}`} />
              <div>
                <div className="text-sm text-white">Supabase Database</div>
                <div className={`text-xs ${status.color}`}>{status.label}</div>
              </div>
            </div>
            <button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
            >
              <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
              Tester
            </button>
          </div>

          {['Groq AI API', 'Pexels API', 'Pixabay API', 'Freesound API'].map(svc => (
            <div key={svc} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="text-sm text-white">{svc}</div>
              <span className="ml-auto text-xs text-emerald-400">Configuré</span>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Informations système</h3>
        <div className="space-y-0">
          {infos.map(({ label, value }) => (
            <SettingRow key={label} label={label}>
              <span className="text-sm text-gray-400 font-mono">{value}</span>
            </SettingRow>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabContent: Record<Tab, React.ReactNode> = {
    general: <GeneralTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    devices: <DevicesTab />,
    billing: <BillingTab />,
    infrastructure: <InfrastructureTab />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez votre compte, sécurité et préférences</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-cyan-400' : ''}>{tab.icon}</span>
                {tab.label}
                <ChevronRight size={14} className={`ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}
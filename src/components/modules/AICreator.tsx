import { useState, useCallback } from 'react';
import { Sparkles, Copy, Heart, Trash2, RefreshCw, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getPlatformConfig, formatNumber, timeAgo, generateId } from '@/lib/utils';
import type { PlatformId, GeneratedContent, ContentType, ContentTone } from '@/types';

const TONES: { id: ContentTone; label: string; emoji: string }[] = [
  { id: 'professional', label: 'Professionnel', emoji: '💼' },
  { id: 'casual', label: 'Décontracté', emoji: '😎' },
  { id: 'humorous', label: 'Humour', emoji: '😂' },
  { id: 'inspirational', label: 'Inspirant', emoji: '✨' },
  { id: 'educational', label: 'Éducatif', emoji: '📚' },
  { id: 'promotional', label: 'Promotionnel', emoji: '💰' },
];

function ContentCard({ item, onToggleFavorite, onDelete }: { item: GeneratedContent; onToggleFavorite: (id: string) => void; onDelete: (id: string) => void }) {
  const cfg = getPlatformConfig(item.platform);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content + ((item.hashtags ?? []).length > 0 ? '\n\n' + (item.hashtags ?? []).join(' ') : ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-white/10 transition-all overflow-hidden">
      <div className={`h-0.5 bg-gradient-to-r ${cfg.gradient}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.icon}</span>
            <span className={`text-xs font-medium ${cfg.textColor}`}>{cfg.name}</span>
            <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
              {item.type}
            </span>
            {item.tone && <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{item.tone}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onToggleFavorite(item.id)} className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/10'}`}>
              <Heart size={13} fill={item.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleCopy} className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
          {expanded || item.content.length < 200 ? item.content : item.content.slice(0, 200) + '...'}
        </p>
        {item.content.length >= 200 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-cyan-400 mt-1 hover:underline">
            {expanded ? 'Réduire' : 'Voir plus'}
          </button>
        )}
        {(item.hashtags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {(item.hashtags ?? []).map((h, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>{h}</span>
            ))}
          </div>
        )}
        <div className="text-2xs text-gray-600 mt-2">{timeAgo(item.createdAt)}</div>
      </div>
    </div>
  );
}

export default function AICreator() {
  const { connectedAccounts, contentHistory, addContent, removeContent, toggleFavorite } = useAppStore();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ContentTone>('casual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const tiktokAccount = connectedAccounts.find(a => a.platform === 'tiktok');
  const cfg = tiktokAccount ? getPlatformConfig(tiktokAccount.platform) : getPlatformConfig('tiktok');

  const generateCaption = useCallback(async () => {
    if (!topic.trim()) { setError('Entre le sujet de ta vidéo'); return; }
    if (!tiktokAccount) { setError('Connecte d\'abord ton compte TikTok'); return; }
    setLoading(true);
    setError('');
    setGeneratedContent(null);

    try {
      const { AIService } = await import('@/services/nexusApi');
      const result = await AIService.generateContent({
        platform: tiktokAccount.platform,
        type: 'caption' as ContentType,
        topic,
        tone,
        language: 'fr',
        audience: tiktokAccount.followers.toString(),
      });
      setGeneratedContent(result);
    } catch {
      const mockContent: GeneratedContent = {
        id: generateId(),
        platform: 'tiktok',
        type: 'caption',
        content: `🔥 ${topic} 🔥\n\n👇 Voici ce que tu dois savoir :\n\n1️⃣ Étape 1 : Commence par comprendre ton public\n2️⃣ Étape 2 : Crée du contenu authentique\n3️⃣ Étape 3 : Sois régulier dans tes publications\n\n💰 Like et partage pour aider les autres !\n\n#TikTok #${topic.replace(/\s+/g, '')} #PourToi #FYP #Viral`,
        hashtags: ['TikTok', topic.replace(/\s+/g, ''), 'PourToi', 'FYP', 'Viral', 'Croissance', 'Conseils'],
        createdAt: new Date().toISOString(),
        isFavorite: false,
        tone,
      };
      setGeneratedContent(mockContent);
    } finally {
      setLoading(false);
    }
  }, [topic, tone, tiktokAccount]);

  const handleSave = useCallback(() => {
    if (!generatedContent) return;
    addContent(generatedContent);
    setGeneratedContent(null);
    setTopic('');
  }, [generatedContent, addContent]);

  const handleRegenerate = useCallback(() => {
    generateCaption();
  }, [generateCaption]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Créer mon contenu</h1>
          <p className="text-sm text-gray-400 mt-1">Génère des captions, hashtags et scripts pour TES vidéos TikTok</p>
        </div>
        {tiktokAccount && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5`}>
            <span className="text-base">{cfg.icon}</span>
            <span className="text-xs font-medium text-white">@{tiktokAccount.username}</span>
          </div>
        )}
      </div>

      {!tiktokAccount ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold text-white mb-2">Connecte ton compte TikTok</h3>
          <p className="text-sm text-gray-500">Va dans l'onglet "Connexion" pour ajouter ton compte</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-6 space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Sujet de ma vidéo</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ex: Comment gagner de l'argent avec TikTok"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                onKeyDown={e => e.key === 'Enter' && generateCaption()}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Ton de la vidéo</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${tone === t.id ? `border-cyan-500/30 bg-cyan-500/10 text-cyan-300` : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button onClick={generateCaption} disabled={loading || !topic.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-sm font-medium transition-opacity disabled:opacity-50`}
            >
              <Sparkles size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Génération...' : 'Générer ma caption'}
            </button>
          </div>

          {generatedContent && (
            <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">📄 Contenu généré</h2>
                <div className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                  {cfg.icon} {tone}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">{generatedContent.content}</pre>
              </div>

              {(generatedContent.hashtags ?? []).length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Hashtags suggérés</label>
                  <div className="flex flex-wrap gap-1">
                    {(generatedContent.hashtags ?? []).map((h, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>#{h}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard.writeText(generatedContent.content)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  <Copy size={14} /> Copier
                </button>
                <button onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={14} /> Sauvegarder
                </button>
                <button onClick={handleRegenerate}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}

          {contentHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Contenu sauvegardé ({contentHistory.length})</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {contentHistory.map(item => (
                  <ContentCard key={item.id} item={item} onToggleFavorite={toggleFavorite} onDelete={removeContent} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

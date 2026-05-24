import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AIService, PexelsService, SupabaseService } from '@/services/nexusApi';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';

const STUDIO_CSS = `#nas *{box-sizing:border-box;margin:0;padding:0}
#nas{height:740px;position:relative;overflow:hidden;background:#07071180;border-radius:14px;border:.5px solid rgba(139,92,246,.2);display:flex;flex-direction:column;font-family:Outfit,sans-serif}
#nas .n{--p:#8b5cf6;--p2:#a78bfa;--c:#06b6d4;--b:#3b82f6;--bg0:#070711;--bg1:#0d0d1a;--bg2:rgba(255,255,255,.04);--bg3:rgba(255,255,255,.07);--bd:rgba(255,255,255,.08);--bd2:rgba(139,92,246,.3);--t1:#f1f5f9;--t2:#94a3b8;--t3:#475569}
#nas .ov{position:absolute;inset:0;background:rgba(5,5,14,.96);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;opacity:0;pointer-events:none;transition:opacity .35s;border-radius:14px}
#nas .ov.on{opacity:1;pointer-events:all}
#nas .ov-rings{width:130px;height:130px;position:relative;display:flex;align-items:center;justify-content:center}
#nas .ring{position:absolute;border-radius:50%;border:1px solid transparent}
#nas .r1{width:130px;height:130px;border-color:rgba(139,92,246,.5);border-top-color:#8b5cf6;animation:spin1 2.4s linear infinite}
#nas .r2{width:100px;height:100px;border-color:rgba(6,182,212,.4);border-bottom-color:#06b6d4;animation:spin2 1.8s linear infinite}
#nas .r3{width:72px;height:72px;border-color:rgba(59,130,246,.3);border-left-color:#3b82f6;animation:spin1 1.2s linear infinite}
#nas .logo-core{width:50px;height:50px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:#fff;z-index:1;animation:logobeat 1.8s ease-in-out infinite;position:relative}
#nas .logo-core::after{content:'';position:absolute;inset:-6px;border-radius:16px;border:1px solid rgba(139,92,246,.4);animation:logobeat 1.8s ease-in-out infinite reverse}
@keyframes spin1{to{transform:rotate(360deg)}}@keyframes spin2{to{transform:rotate(-360deg)}}@keyframes logobeat{0%,100%{opacity:.85}50%{opacity:1}}@keyframes fadeup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
#nas .ov-name{font-size:20px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:fadeup .4s ease}
#nas .ov-tag,#nas .ov-pct{font-size:11px;color:#64748b}
#nas .ov-status{font-size:12px;color:#94a3b8;min-height:20px;animation:fadeup .4s ease}
#nas .ov-track{width:280px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;position:relative}
#nas .ov-prog{height:100%;background:linear-gradient(90deg,#8b5cf6,#06b6d4);border-radius:2px;width:0%;transition:width .4s cubic-bezier(.4,0,.2,1);position:relative}
#nas .ov-prog::after{content:'';position:absolute;top:0;left:0;width:50%;height:100%;background:rgba(255,255,255,.35);animation:shimmer 1.5s infinite;pointer-events:none}
#nas .notif{position:absolute;top:14px;right:14px;z-index:200;background:rgba(10,10,22,.95);border:.5px solid rgba(139,92,246,.5);border-radius:10px;padding:9px 14px;font-size:12px;display:flex;align-items:center;gap:9px;color:#f1f5f9;transform:translateX(115%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-width:270px;pointer-events:none}
#nas .notif.on{transform:translateX(0);pointer-events:all}
#nas .notif.ok{border-color:rgba(34,197,94,.5)}#nas .nd{width:7px;height:7px;border-radius:50%;flex-shrink:0}
#nas .nd.ok{background:#22c55e}#nas .nd.info{background:#8b5cf6}
#nas header{height:50px;display:flex;align-items:center;padding:0 14px;gap:11px;border-bottom:.5px solid var(--bd);background:rgba(10,10,20,.95);flex-shrink:0}
#nas .hlogo{display:flex;align-items:center;gap:8px}
#nas .hmark{width:26px;height:26px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#fff}
#nas .hname{font-weight:800;font-size:13px;background:linear-gradient(135deg,#a78bfa,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
#nas .hbadge{font-size:9px;background:rgba(139,92,246,.2);color:#a78bfa;border:.5px solid rgba(139,92,246,.4);padding:2px 7px;border-radius:4px;font-weight:700}
#nas .hsp{flex:1}
#nas .htab{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;border:.5px solid var(--bd);background:var(--bg2);cursor:pointer;transition:all .2s;font-size:11px;color:var(--t2)}
#nas .htab:hover,#nas .htab.on{border-color:var(--p);color:var(--p2);background:rgba(139,92,246,.1)}
#nas .hbtn{padding:6px 13px;border-radius:7px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);border:none;color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:opacity .2s}
#nas .hbtn:hover{opacity:.88}
#nas .sdot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:blink 2s ease-in-out infinite}
#nas .body{flex:1;display:grid;grid-template-columns:1fr 1fr;overflow:hidden}
#nas .pnl{display:flex;flex-direction:column;overflow:hidden}
#nas .pnl-l{border-right:.5px solid var(--bd)}
#nas .ph{height:44px;display:flex;align-items:center;gap:8px;padding:0 13px;border-bottom:.5px solid var(--bd);background:rgba(8,8,18,.8);flex-shrink:0}
#nas .ptitle{font-size:12px;font-weight:700;color:var(--t1)}#nas .psub{font-size:10px;color:var(--t3)}#nas .pha{margin-left:auto;display:flex;gap:5px;align-items:center}
#nas .pb{flex:1;overflow-y:auto;padding:12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.06) transparent}
#nas .pb::-webkit-scrollbar{width:2px}#nas .pb::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:1px}
#nas .fl{font-size:9px;color:var(--t3);margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
#nas .fg{margin-bottom:11px}
#nas .prow{display:flex;gap:5px;flex-wrap:wrap}
#nas .pbtn2{width:36px;height:36px;border-radius:8px;border:.5px solid var(--bd);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .2s;position:relative;color:var(--t2)}
#nas .pbtn2:hover{border-color:var(--p);color:var(--p2);background:rgba(139,92,246,.1)}
#nas .pbtn2.on{border-color:var(--p);background:rgba(139,92,246,.15);color:var(--p2)}
#nas .pck{position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:var(--p);display:none;align-items:center;justify-content:center;font-size:7px;color:#fff;font-weight:700}
#nas .pbtn2.on .pck{display:flex}
#nas .ttabs{display:flex;gap:3px;background:rgba(255,255,255,.03);padding:3px;border-radius:8px;border:.5px solid var(--bd)}
#nas .ttab{flex:1;padding:5px 6px;border-radius:5px;border:none;background:transparent;color:var(--t3);font-size:10px;font-weight:600;cursor:pointer;transition:all .2s}
#nas .ttab.on{background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff}
#nas .inp{width:100%;background:rgba(255,255,255,.05);border:.5px solid var(--bd);border-radius:7px;padding:8px 11px;color:var(--t1);font-size:12px;font-family:inherit;transition:all .2s;resize:none}
#nas .inp:focus{outline:none;border-color:var(--p)}#nas .inp::placeholder{color:var(--t3)}
#nas select.inp option{background:#0d0d1a;color:#f1f5f9}
#nas .tchips{display:flex;gap:4px;flex-wrap:wrap}
#nas .tchip{padding:4px 9px;border-radius:16px;border:.5px solid var(--bd);background:var(--bg2);color:var(--t2);font-size:10px;cursor:pointer;transition:all .2s}
#nas .tchip:hover{border-color:#06b6d4;color:#06b6d4}#nas .tchip.on{border-color:#06b6d4;background:rgba(6,182,212,.12);color:#06b6d4}
#nas .gbtn{width:100%;padding:10px;border-radius:9px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);border:none;color:#fff;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;position:relative;overflow:hidden}
#nas .gbtn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:rgba(255,255,255,.12);transition:left .4s}
#nas .gbtn:hover::before{left:100%}
#nas .gbtn:hover{opacity:.92;transform:translateY(-1px)}#nas .gbtn:active{transform:translateY(0)}#nas .gbtn:disabled{opacity:.45;cursor:not-allowed;transform:none}
#nas .outbox{background:rgba(139,92,246,.06);border:.5px solid rgba(139,92,246,.25);border-radius:9px;padding:12px;font-size:12px;line-height:1.85;color:var(--t1);margin-top:11px;position:relative;white-space:pre-wrap;word-break:break-word;min-height:70px}
#nas .outbox::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,#8b5cf6,#06b6d4,transparent)}
#nas .outbox::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,.4),rgba(6,182,212,.4),transparent)}
#nas .oacts{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
#nas .oact{padding:5px 10px;border-radius:6px;border:.5px solid var(--bd);background:var(--bg2);color:var(--t2);font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .2s}
#nas .oact:hover{border-color:var(--p);color:var(--p2)}
#nas .oact.pri{background:linear-gradient(135deg,rgba(139,92,246,.3),rgba(59,130,246,.3));border-color:rgba(139,92,246,.5);color:#a78bfa;font-weight:700}
#nas .oact.pri:hover{background:linear-gradient(135deg,rgba(139,92,246,.5),rgba(59,130,246,.5));color:#fff}
#nas .alt-item{padding:8px 10px;background:rgba(255,255,255,.03);border:.5px solid var(--bd);border-radius:6px;font-size:11px;color:var(--t2);cursor:pointer;transition:all .2s;margin-top:5px}
#nas .alt-item:hover{border-color:rgba(6,182,212,.4);color:var(--t1)}#nas .alt-lbl{font-size:9px;color:var(--t3);margin-bottom:3px}
#nas .prev{flex:1;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;min-height:0}
#nas .prev-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 40%,rgba(139,92,246,.08) 0%,transparent 60%),radial-gradient(ellipse at 70% 70%,rgba(6,182,212,.06) 0%,transparent 60%),#050510}
#nas .prev-ico{font-size:40px;color:rgba(139,92,246,.25);z-index:1;position:relative}
#nas .prev-cap{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.88);border:.5px solid rgba(255,255,255,.12);border-radius:6px;padding:6px 15px;font-size:12px;color:#fff;text-align:center;max-width:82%;white-space:pre-wrap;line-height:1.55;z-index:2}
#nas .prev-ctl{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);display:flex;gap:7px;align-items:center;z-index:2}
#nas .pc{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.12);border:.5px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:12px;transition:all .2s}
#nas .pc:hover{background:rgba(139,92,246,.35);border-color:var(--p)}
#nas .pc.play{width:38px;height:38px;font-size:15px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);border:none}
#nas .prev-fmt{position:absolute;top:9px;left:9px;background:rgba(139,92,246,.18);border:.5px solid rgba(139,92,246,.5);color:#a78bfa;font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700;z-index:2}
#nas .prev-time{position:absolute;top:9px;right:9px;font-size:10px;color:rgba(255,255,255,.4);z-index:2}
#nas .ai-badge{position:absolute;top:9px;left:50%;transform:translateX(-50%);background:rgba(6,182,212,.18);border:.5px solid rgba(6,182,212,.4);color:#06b6d4;font-size:9px;padding:2px 9px;border-radius:4px;font-weight:700;z-index:2;opacity:0;transition:opacity .4s;white-space:nowrap}
#nas .ai-badge.on{opacity:1}
#nas .tla{background:rgba(5,5,15,.6);border-top:.5px solid var(--bd);flex-shrink:0}
#nas .tlh{display:flex;align-items:center;gap:7px;padding:7px 12px;border-bottom:.5px solid var(--bd)}
#nas .tlht{font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
#nas .tlt{display:flex;gap:3px;margin-left:auto}
#nas .tltl{width:22px;height:22px;border-radius:5px;border:.5px solid var(--bd);background:var(--bg2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t3);font-size:11px;transition:all .2s}
#nas .tltl:hover{border-color:var(--p);color:var(--p2)}
#nas .tlr{display:flex;height:16px;padding:0 12px 0 70px;border-bottom:.5px solid rgba(255,255,255,.04)}
#nas .tlm{flex:1;font-size:8px;color:var(--t3);border-left:.5px solid rgba(255,255,255,.05);padding-left:2px}
#nas .tltracks{padding:7px 12px;display:flex;flex-direction:column;gap:4px}
#nas .trk{display:flex;align-items:center;gap:7px;height:24px}
#nas .trkl{width:58px;font-size:8px;color:var(--t3);text-align:right;flex-shrink:0;text-transform:uppercase;letter-spacing:.04em}
#nas .trkz{flex:1;height:100%;background:rgba(255,255,255,.025);border-radius:3px;position:relative;overflow:hidden;border:.5px solid rgba(255,255,255,.04)}
#nas .trkc{position:absolute;top:2px;height:calc(100% - 4px);border-radius:2px;display:flex;align-items:center;padding:0 5px;font-size:8px;white-space:nowrap;overflow:hidden;cursor:pointer;transition:all .35s;gap:3px}
#nas .trkc:hover{filter:brightness(1.25)}
#nas .cv{background:rgba(139,92,246,.55);border:.5px solid rgba(139,92,246,.5);color:rgba(255,255,255,.9);left:0;width:58%}
#nas .ca{background:rgba(6,182,212,.45);border:.5px solid rgba(6,182,212,.45);color:rgba(255,255,255,.9);left:4%;width:72%}
#nas .cc{background:rgba(245,158,11,.45);border:.5px solid rgba(245,158,11,.4);color:rgba(255,255,255,.85);left:0;width:28%;transition:all .45s ease}
#nas .cc.ai{width:64%;background:rgba(139,92,246,.55);border-color:rgba(139,92,246,.6);color:#fff;box-shadow:0 0 10px rgba(139,92,246,.3)}
#nas .ce{background:rgba(239,68,68,.35);border:.5px solid rgba(239,68,68,.35);color:rgba(255,255,255,.75);left:22%;width:38%}
#nas .ph2{position:absolute;top:0;left:30%;width:1px;background:rgba(139,92,246,.8);height:100%;pointer-events:none}
#nas .assp{background:rgba(5,5,15,.7);border-top:.5px solid var(--bd);flex-shrink:0}
#nas .asstabs{display:flex;padding:0 12px;border-bottom:.5px solid var(--bd)}
#nas .asstab{padding:6px 10px;font-size:10px;color:var(--t3);cursor:pointer;border-bottom:1.5px solid transparent;transition:all .2s}
#nas .asstab.on{color:var(--p2);border-bottom-color:var(--p)}
#nas .assgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:7px 12px}
#nas .assth{aspect-ratio:16/9;border-radius:5px;background:rgba(255,255,255,.05);border:.5px solid var(--bd);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:16px}
#nas .assth:hover{border-color:var(--p);transform:scale(1.05)}
#nas .assth.on{border-color:var(--p);box-shadow:0 0 8px rgba(139,92,246,.4)}
#nas .sbtn{padding:4px 9px;border-radius:5px;border:.5px solid var(--bd);background:var(--bg2);color:var(--t3);font-size:10px;cursor:pointer;display:flex;align-items:center;gap:3px;transition:all .2s}
#nas .sbtn:hover{border-color:var(--p);color:var(--p2)}`;

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter', 'LinkedIn', 'Facebook'];
const CONTENT_TYPES = [
  { label: 'Caption', desc: 'Caption virale + Hashtags stratégiques' },
  { label: 'Script', desc: 'Script vidéo professionnel (hook + corps + CTA)' },
  { label: 'Bio', desc: 'Bio de profil optimisée (150 car. max)' },
  { label: 'Idées', desc: '5 idées de posts viraux numérotées' },
  { label: 'SEO YT', desc: 'Description YouTube SEO (titre + 200 mots + tags)' },
];
const TONES = [
  { label: '🔥 Dynamique', desc: 'Dynamique et percutant' },
  { label: '💼 Pro', desc: 'Professionnel et autoritaire' },
  { label: '😄 Viral', desc: 'Humoristique et viral' },
  { label: '✨ Inspirant', desc: 'Inspirant et motivant' },
  { label: '📚 Éducatif', desc: 'Éducatif et informatif' },
];
const ASSETS = ['🏔️', '🌆', '🌿', '💻', '🌊', '🌅', '🎨', '🎵', '🚀', '⚡', '🌙', '🔮'];
const FORMATS = [
  { id: '9:16', label: '9:16 — TikTok/Reels' },
  { id: '16:9', label: '16:9 — YouTube' },
  { id: '1:1', label: '1:1 — FB/IG carré' },
  { id: '4:5', label: '4:5 — Instagram' },
];

export default function NexusAIStudio() {
  const [selPlatform, setSelPlatform] = useState('TikTok');
  const [selType, setSelType] = useState(CONTENT_TYPES[0].desc);
  const [selTone, setSelTone] = useState(TONES[0].desc);
  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState('Français 🇫🇷');
  const [creat, setCreat] = useState('Équilibrée');
  const [fmt, setFmt] = useState('9:16');
  const [overlay, setOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState('Initialisation...');
  const [overlayPct, setOverlayPct] = useState(0);
  const [genContent, setGenContent] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifOk, setNotifOk] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ntRef = useRef<ReturnType<typeof setTimeout>>();
  const ovRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STUDIO_CSS;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  const notify = useCallback((msg: string, ok: boolean) => {
    setNotifMsg(msg);
    setNotifOk(ok);
    setShowNotif(true);
    clearTimeout(ntRef.current);
    ntRef.current = setTimeout(() => setShowNotif(false), 3000);
  }, []);

  const runOverlay = useCallback(() => {
    setOverlay(true);
    setOverlayText('Connexion aux serveurs Nexus AI...');
    setOverlayPct(0);
    const steps: [number, string][] = [
      [0, 'Connexion aux serveurs Nexus AI...'],
      [18, `Analyse de la plateforme ${selPlatform}...`],
      [35, 'Chargement du modèle de langage...'],
      [52, 'Génération du contenu en cours...'],
      [70, `Optimisation pour ${selPlatform}...`],
      [85, `Application du style "${selTone}"...`],
      [95, 'Finalisation et vérification...'],
    ];
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        setOverlayPct(steps[i][0]);
        setOverlayText(steps[i][1]);
        i++;
        ovRef.current = setTimeout(tick, 500 + Math.random() * 350);
      }
    };
    tick();
  }, [selPlatform, selTone]);

  const hideOverlay = useCallback((ok: boolean) => {
    clearTimeout(ovRef.current);
    setOverlayPct(100);
    setOverlayText(ok ? '✓ Génération réussie !' : '✕ Erreur — Réessayez');
    setTimeout(() => {
      setOverlay(false);
      setOverlayPct(0);
    }, 950);
  }, []);

  const addProject = useAppStore(s => s.addProject);

  const generate = useCallback(async () => {
    const t = topic || 'technologie';
    runOverlay();

    try {
      const platformMap: Record<string, string> = {
        TikTok: 'tiktok', Instagram: 'instagram', YouTube: 'youtube',
        Twitter: 'twitter', LinkedIn: 'linkedin', Facebook: 'facebook',
      };
      const typeMap: Record<string, string> = {
        'Caption virale + Hashtags stratégiques': 'caption',
        'Script vidéo professionnel (hook + corps + CTA)': 'script',
        'Bio de profil optimisée (150 car. max)': 'bio',
        '5 idées de posts viraux numérotées': 'caption',
        'Description YouTube SEO (titre + 200 mots + tags)': 'caption',
      };

      const result = await AIService.generateContent({
        platform: platformMap[selPlatform] as any,
        type: typeMap[selType] as any,
        topic: t,
        tone: selTone,
        language: lang.includes('English') ? 'en' : lang.includes('Español') ? 'es' : 'fr',
      });

      setGenContent(result.content);
      hideOverlay(true);
      setTimeout(() => {
        setShowOutput(true);
        toast.success('Contenu généré avec Groq IA !');
      }, 500);
    } catch (err: any) {
      hideOverlay(false);
      setTimeout(() => {
        setGenContent(`❌ ${err.message || 'Erreur de génération'}`);
        setShowOutput(true);
        toast.error('Erreur de génération');
      }, 500);
    }
  }, [topic, lang, selPlatform, selType, selTone, runOverlay, hideOverlay]);

  const [pexelResults, setPexelResults] = useState<string[]>([]);
  const [pexelLoading, setPexelLoading] = useState(false);

  const sendToStudio = useCallback(async () => {
    if (!genContent) return;
    const pid = generateId();
    const project = {
      id: pid,
      name: `Studio - ${topic || 'Sans titre'} (${new Date().toLocaleTimeString()})`,
      platform: (selPlatform.toLowerCase()) as any,
      aspectRatio: fmt as any,
      duration: 15,
      tracks: [{ id: generateId(), type: 'text' as const, clips: [{ id: generateId(), assetId: generateId(), startTime: 0, endTime: 15, text: genContent }], label: 'Caption' }],
      assets: [],
      thumbnailUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(project);
    await SupabaseService.saveProject(project);
    notify('✓ Projet sauvegardé dans le cloud !', true);
    toast.success('Projet synchronisé avec Supabase');
  }, [genContent, topic, selPlatform, fmt, addProject]);

  const publishToTikTok = useCallback(async () => {
    try {
      const token = import.meta.env.VITE_TIKTOK_CLIENT_ID;
      if (!token) { toast.error('Configure VITE_TIKTOK_CLIENT_ID dans .env'); return; }
      const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:8000';
      notify('Publication en cours...', false);
      const res = await fetch(`${proxyUrl}/api/tiktok/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post', text: genContent, clientKey: token }),
      });
      if (!res.ok) throw new Error(await res.text());
      notify('✓ Publié sur TikTok !', true);
      toast.success('Publication réussie !');
    } catch (err: any) {
      toast.error(`Publication échouée: ${err.message}`);
      notify('Erreur de publication', false);
    }
  }, [genContent]);

  const copyOut = useCallback(() => {
    navigator.clipboard.writeText(genContent).then(() =>
      notify('✓ Copié dans le presse-papiers', true)
    );
  }, [genContent, notify]);

  const clearAll = useCallback(() => {
    setShowOutput(false);
    setGenContent('');
    setTopic('');
    notify('Interface réinitialisée', false);
  }, [notify]);

  const searchPexels = useCallback(async () => {
    const q = topic || 'technology';
    setPexelLoading(true);
    try {
      const results = await PexelsService.searchVideos(q);
      setPexelResults(results.map((r: any) => r.video_files?.[0]?.link || r.image || '').filter(Boolean));
      if (results.length > 0) toast.success(`${results.length} assets Pexels trouvés`);
    } catch {
      toast.error('Erreur recherche Pexels');
    } finally {
      setPexelLoading(false);
    }
  }, [topic]);

  const previewLines = genContent
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .slice(0, 3)
    .join('\n');

  return (
    <div id="nas" className="n">
      {overlay && (
        <div className="ov on">
          <div className="ov-rings">
            <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
            <div className="logo-core">N</div>
          </div>
          <div className="ov-name">Nexus AI Studio</div>
          <div className="ov-tag">Powered by Groq · Multi-plateforme</div>
          <div className="ov-status">{overlayText}</div>
          <div className="ov-track">
            <div className="ov-prog" style={{ width: `${overlayPct}%` }} />
          </div>
          <div className="ov-pct">{overlayPct}%</div>
        </div>
      )}

      <div className={`notif ${showNotif ? 'on' : ''} ${notifOk ? 'ok' : ''}`}>
        <div className={`nd ${notifOk ? 'ok' : 'info'}`} />
        <span>{notifMsg}</span>
      </div>

      <header>
        <div className="hlogo">
          <div className="hmark">N</div>
          <div className="hname">NEXUS</div>
        </div>
        <div className="hbadge">AI Studio v2</div>
        <div className="hsp" />
        <div className="sdot" />
        <div className="htab on"><i className="ti ti-cpu" style={{ fontSize: 13 }} />IA active</div>
        <div className="htab"><i className="ti ti-cloud" style={{ fontSize: 13 }} />Cloud</div>
        <button className="hbtn" onClick={publishToTikTok}>
          <i className="ti ti-send" style={{ fontSize: 13 }} />Publier
        </button>
      </header>

      <div className="body">
        <div className="pnl pnl-l">
          <div className="ph">
            <i className="ti ti-sparkles" style={{ color: '#a78bfa', fontSize: 15 }} />
            <div>
              <div className="ptitle">Créateur IA</div>
              <div className="psub">Génération multi-plateforme</div>
            </div>
            <div className="pha">
              <div className="sbtn" onClick={clearAll}>
                <i className="ti ti-refresh" style={{ fontSize: 11 }} />Reset
              </div>
            </div>
          </div>

          <div className="pb">
            <div className="fg">
              <div className="fl">Plateforme cible</div>
              <div className="prow">
                {PLATFORMS.map(p => (
                  <div key={p}
                    className={`pbtn2 ${selPlatform === p ? 'on' : ''}`}
                    onClick={() => setSelPlatform(p)}
                    title={p}
                  >
                    <i className={`ti ti-brand-${p.toLowerCase()}`} />
                    <span className="pck">✓</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fg">
              <div className="fl">Type de contenu</div>
              <div className="ttabs">
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.desc}
                    className={`ttab ${selType === ct.desc ? 'on' : ''}`}
                    onClick={() => setSelType(ct.desc)}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fg">
              <div className="fl">Sujet / Niche</div>
              <input className="inp" type="text" value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex: IA, crypto, mode africaine, fitness..."
              />
            </div>

            <div className="fg">
              <div className="fl">Ton & style</div>
              <div className="tchips">
                {TONES.map(t => (
                  <span key={t.desc}
                    className={`tchip ${selTone === t.desc ? 'on' : ''}`}
                    onClick={() => setSelTone(t.desc)}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="fg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div className="fl">Langue</div>
                <select className="inp" style={{ fontSize: 11 }} value={lang} onChange={e => setLang(e.target.value)}>
                  <option>Français 🇫🇷</option>
                  <option>English 🇺🇸</option>
                  <option>Español 🇪🇸</option>
                  <option>Portugais 🇧🇷</option>
                </select>
              </div>
              <div>
                <div className="fl">Créativité IA</div>
                <select className="inp" style={{ fontSize: 11 }} value={creat} onChange={e => setCreat(e.target.value)}>
                  <option>Équilibrée</option>
                  <option>Maximale 🔥</option>
                  <option>Conservative</option>
                </select>
              </div>
            </div>

            <button className="gbtn" onClick={generate}>
              <i className="ti ti-sparkles" style={{ fontSize: 15 }} />
              Générer avec Nexus AI ↗
            </button>

            {showOutput && (
              <>
                <div className="outbox">{genContent}</div>
                <div className="oacts">
                  <button className="oact" onClick={copyOut}>
                    <i className="ti ti-copy" style={{ fontSize: 12 }} />Copier
                  </button>
                  <button className="oact" onClick={async () => { await SupabaseService.saveContent({ id: generateId(), platform: selPlatform.toLowerCase(), type: selType, content: genContent, createdAt: new Date().toISOString(), isFavorite: false } as any); toast.success('Sauvegardé dans le cloud !'); }}>
                    <i className="ti ti-heart" style={{ fontSize: 12 }} />Sauver
                  </button>
                  <button className="oact pri" onClick={sendToStudio}>
                    <i className="ti ti-video" style={{ fontSize: 12 }} />→ Studio
                  </button>
                  <button className="oact" onClick={generate}>
                    <i className="ti ti-refresh" style={{ fontSize: 12 }} />Variante
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Alternatives rapides</div>
                  <div className="alt-item" onClick={() => notify('Variante 2 sélectionnée', true)}>
                    <div className="alt-lbl">Variante 2 · Ton professionnel</div>
                    {genContent.slice(0, 65)}...
                  </div>
                  <div className="alt-item" onClick={() => notify('Variante 3 sélectionnée', true)}>
                    <div className="alt-lbl">Variante 3 · Ton viral maximal</div>
                    {genContent.slice(0, 65)}...
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pnl" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ph">
            <i className="ti ti-video" style={{ color: '#06b6d4', fontSize: 15 }} />
            <div>
              <div className="ptitle">Studio Vidéo</div>
              <div className="psub">Éditeur professionnel IA</div>
            </div>
            <div className="pha">
              <select className="inp" style={{ width: 120, fontSize: 10, padding: '4px 8px' }}
                value={fmt} onChange={e => setFmt(e.target.value)}
              >
                {FORMATS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <button className="hbtn" onClick={() => notify('Export lancé (bêta)...', false)}
                style={{ fontSize: 10, padding: '5px 10px' }}>
                <i className="ti ti-download" style={{ fontSize: 12 }} />Export
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="prev">
              <div className="prev-bg" />
              <i className="ti ti-player-play prev-ico" />
              <div className="prev-fmt">{fmt}</div>
              <div className="prev-time">0:00 / 0:15</div>
              <div className={`ai-badge ${genContent ? 'on' : ''}`}>
                <i className="ti ti-sparkles" /> Contenu IA synchronisé
              </div>
              <div className="prev-ctl">
                <div className="pc" onClick={() => notify('Retour arrière', false)}>
                  <i className="ti ti-player-skip-back" />
                </div>
                <div className="pc play" onClick={() => setIsPlaying(!isPlaying)}>
                  <i className={`ti ti-player-${isPlaying ? 'pause' : 'play'}`} id="pico" />
                </div>
                <div className="pc" onClick={() => notify('Avance rapide', false)}>
                  <i className="ti ti-player-skip-forward" />
                </div>
              </div>
              {genContent && (
                <div className="prev-cap">{previewLines || genContent.slice(0, 110)}</div>
              )}
            </div>

            <div className="tla">
              <div className="tlh">
                <span className="tlht">Timeline</span>
                <div className="tlt">
                  <div className="tltl" title="Couper"><i className="ti ti-scissors" /></div>
                  <div className="tltl" title="Vitesse"><i className="ti ti-brand-speedtest" /></div>
                  <div className="tltl" title="Filtres"><i className="ti ti-adjustments" /></div>
                  <div className="tltl" title="Texte"><i className="ti ti-text-size" /></div>
                  <div className="tltl" title="Micro" onClick={() => notify('Enregistrement micro...', false)}>
                    <i className="ti ti-microphone" />
                  </div>
                  <div className="tltl" title="IA" style={{ borderColor: 'rgba(139,92,246,.4)', color: '#a78bfa' }}>
                    <i className="ti ti-sparkles" />
                  </div>
                </div>
              </div>
              <div className="tlr">
                <span className="tlm">0s</span><span className="tlm">3s</span>
                <span className="tlm">6s</span><span className="tlm">9s</span>
                <span className="tlm">12s</span><span className="tlm">15s</span>
              </div>
              <div className="tltracks">
                <div className="trk">
                  <div className="trkl">Vidéo</div>
                  <div className="trkz">
                    <div className="ph2" />
                    <div className="trkc cv"><i className="ti ti-video" style={{ fontSize: 9 }} />Clip principal</div>
                  </div>
                </div>
                <div className="trk">
                  <div className="trkl">Audio</div>
                  <div className="trkz">
                    <div className="trkc ca"><i className="ti ti-music" style={{ fontSize: 9 }} />Piste audio</div>
                  </div>
                </div>
                <div className="trk">
                  <div className="trkl">Caption</div>
                  <div className="trkz">
                    <div className={`trkc cc ${genContent ? 'ai' : ''}`}>
                      <i className={`ti ti-${genContent ? 'sparkles' : 'text-size'}`} style={{ fontSize: 9 }} />
                      {genContent ? `IA · ${genContent.slice(0, 22)}...` : 'Sous-titres'}
                    </div>
                  </div>
                </div>
                <div className="trk">
                  <div className="trkl">Effets</div>
                  <div className="trkz">
                    <div className="trkc ce"><i className="ti ti-wand" style={{ fontSize: 9 }} />Transition</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="assp">
              <div className="asstabs">
                <div className="asstab on" onClick={searchPexels}>Pexels</div>
                <div className="asstab">Pixabay</div>
                <div className="asstab">Musique</div>
                <div className="asstab">IA Assets</div>
                <div className="asstab">Local</div>
              </div>
              <div className="assgrid">
                {pexelLoading ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', fontSize: 11, padding: 12 }}>
                    <i className="ti ti-loader" style={{ animation: 'spin1 1s linear infinite', marginRight: 6 }} />
                    Recherche Pexels...
                  </div>
                ) : pexelResults.length > 0 ? (
                  pexelResults.slice(0, 6).map((url: string, i: number) => (
                    <div key={i} className="assth" onClick={() => { notify('Asset ajouté à la timeline', false); }}
                      style={{ background: `url(${url}) center/cover`, fontSize: 0 }}
                      title="Asset Pexels"
                    >
                      <span style={{ fontSize: 8, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '2px 5px', borderRadius: 3 }}>Pexels</span>
                    </div>
                  ))
                ) : (
                  ASSETS.map((a, i) => (
                    <div key={i} className="assth" onClick={() => notify('Asset ajouté à la timeline', false)}>
                      {a}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

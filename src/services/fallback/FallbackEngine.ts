import type { SocialUserInfo, PlatformId } from '@/types';

export interface FallbackAttempt {
  level: number;
  method: string;
  status: 'pending' | 'success' | 'fail';
  error?: string;
}

export type ProgressCallback = (attempt: FallbackAttempt) => void;

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  method: string;
  attempts: FallbackAttempt[];
  error?: string;
}

type StrategyFn<T> = () => Promise<T>;

const FALLBACK_DELAYS = [500, 1000, 2000, 3000, 5000];

export async function executeFallbackChain<T>(
  label: string,
  strategies: { name: string; fn: StrategyFn<T> }[],
  onProgress?: ProgressCallback,
  timeout = 30000,
): Promise<FallbackResult<T>> {
  const attempts: FallbackAttempt[] = [];

  for (let i = 0; i < strategies.length; i++) {
    const attempt: FallbackAttempt = {
      level: i + 1,
      method: strategies[i].name,
      status: 'pending',
    };
    attempts.push(attempt);
    onProgress?.({ ...attempt });

    try {
      const data = await strategies[i].fn();
      attempt.status = 'success';
      onProgress?.({ ...attempt });

      return {
        success: true,
        data,
        method: strategies[i].name,
        attempts,
      };
    } catch (err) {
      attempt.status = 'fail';
      attempt.error = err instanceof Error ? err.message : String(err);
      onProgress?.({ ...attempt });

      if (i < strategies.length - 1) {
        await delay(FALLBACK_DELAYS[Math.min(i, FALLBACK_DELAYS.length - 1)]);
      }
    }
  }

  return {
    success: false,
    method: strategies[strategies.length - 1]?.name ?? 'all',
    attempts,
    error: `Échec après ${strategies.length} tentatives pour ${label}`,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Strategies builders ──────────────────────────────────────────────────

export function buildStrategies(
  _label: string,
  _usernameOrId: string,
  platform: PlatformId,
  primaryFn: () => Promise<SocialUserInfo>,
  scrapeFn?: () => Promise<SocialUserInfo>,
  altFns?: { name: string; fn: () => Promise<SocialUserInfo> }[],
): { name: string; fn: () => Promise<SocialUserInfo> }[] {
  const chain: { name: string; fn: () => Promise<SocialUserInfo> }[] = [
    { name: `API ${platform}`, fn: primaryFn },
  ];

  if (altFns) {
    for (const alt of altFns) {
      chain.push(alt);
    }
  }

  if (scrapeFn) {
    chain.push({ name: `Scraping ${platform}`, fn: scrapeFn });
  }

  return chain;
}



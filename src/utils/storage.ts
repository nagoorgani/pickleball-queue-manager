import type { PickleballState, CourtData } from '../types';
import { INITIAL_COURT_1, INITIAL_COURT_2 } from './rotation';

const STORAGE_KEY = 'pickleball_queue_manager_v2';

export const DEFAULT_INITIAL_STATE: PickleballState = {
  court1: INITIAL_COURT_1,
  court2: INITIAL_COURT_2,
  isCourt2Available: true, // Default: both courts available
  queue: [],
  matchHistory: [],
  theme: 'dark',
  soundEnabled: true,
};

/**
 * Loads persisted state from localStorage with migration and schema fallback
 */
export function loadStateFromStorage(): PickleballState {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_STATE;

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      // Check for v1 storage migration
      const oldSerialized = localStorage.getItem('pickleball_queue_manager_v1');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (oldSerialized) {
        try {
          const old = JSON.parse(oldSerialized);
          return {
            ...DEFAULT_INITIAL_STATE,
            court1: {
              ...INITIAL_COURT_1,
              teamA: old.court?.teamA || null,
              teamB: old.court?.teamB || null,
              matchStartTime: old.matchStartTime || null,
              matchNumber: old.matchNumber || 1,
              currentScores: old.currentScores || { teamA: 0, teamB: 0 },
            },
            court2: INITIAL_COURT_2,
            isCourt2Available: true,
            queue: Array.isArray(old.queue) ? old.queue : [],
            theme: old.theme === 'light' ? 'light' : 'dark',
            soundEnabled: typeof old.soundEnabled === 'boolean' ? old.soundEnabled : true,
          };
        } catch {
          // ignore
        }
      }

      return {
        ...DEFAULT_INITIAL_STATE,
        theme: prefersDark ? 'dark' : 'light',
      };
    }

    const parsed = JSON.parse(serialized) as Partial<PickleballState>;

    const safeCourt = (c: Partial<CourtData> | undefined, fallback: CourtData): CourtData => ({
      id: fallback.id,
      name: fallback.name,
      teamA: c?.teamA || null,
      teamB: c?.teamB || null,
      matchStartTime: typeof c?.matchStartTime === 'number' ? c.matchStartTime : null,
      matchNumber: typeof c?.matchNumber === 'number' ? c.matchNumber : 1,
      currentScores: c?.currentScores || { teamA: 0, teamB: 0 },
    });

    return {
      court1: safeCourt(parsed.court1, INITIAL_COURT_1),
      court2: safeCourt(parsed.court2, INITIAL_COURT_2),
      isCourt2Available: typeof parsed.isCourt2Available === 'boolean' ? parsed.isCourt2Available : true,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      matchHistory: Array.isArray(parsed.matchHistory) ? parsed.matchHistory : [],
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return DEFAULT_INITIAL_STATE;
  }
}

/**
 * Saves current state to localStorage
 */
export function saveStateToStorage(state: PickleballState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

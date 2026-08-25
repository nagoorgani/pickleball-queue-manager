export interface Player {
  id: string;
  name: string;
  joinedAt: number; // Unix timestamp in ms
  gamesPlayed: number;
  groupId?: string; // ID of preset group if linked
}

export type Team = [Player, Player];

export interface PlayerGroup {
  id: string;
  name: string;
  playerIds: string[];
  groupType?: 'duo' | 'foursome';
  neverSplit?: boolean;
  color: string; // Tailwind color token or hex
  createdAt: number;
}

export interface CourtData {
  id: 1 | 2;
  name: string;
  teamA: Team | null;
  teamB: Team | null;
  matchStartTime: number | null;
  matchNumber: number;
  currentScores: { teamA: number; teamB: number };
}

export interface MatchScores {
  teamA: number;
  teamB: number;
  winner?: 'Team A' | 'Team B' | 'Draw';
}

export interface MatchRecord {
  id: string;
  courtId: 1 | 2;
  courtName: string;
  matchNumber: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  teamANames: [string, string];
  teamBNames: [string, string];
  scores?: MatchScores;
}

export interface AdminCredentials {
  loginId: string;
  passwordHash: string;
  updatedAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  adminUsername: string;
}

export interface PickleballState {
  court1: CourtData;
  court2: CourtData;
  isCourt2Available: boolean;
  queue: Player[];
  groups: PlayerGroup[];
  matchHistory: MatchRecord[];
  theme: 'dark' | 'light';
  soundEnabled: boolean;
}

export interface HistoryEntry {
  state: PickleballState;
  description: string;
}

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
}

export interface DragItemData {
  type: 'player' | 'group';
  id: string; // playerId or groupId
  playerIds: string[]; // all player IDs involved
  source: 'queue' | 'court';
  courtId?: 1 | 2;
  team?: 'teamA' | 'teamB';
  queueIndex?: number;
}

export interface Player {
  id: string;
  name: string;
  joinedAt: number; // Unix timestamp in ms
  gamesPlayed: number;
}

export type Team = [Player, Player];

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

export interface PickleballState {
  court1: CourtData;
  court2: CourtData;
  isCourt2Available: boolean; // If false: Court 2 is reserved for promotion matches
  queue: Player[];
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

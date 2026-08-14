import type { CourtData, MatchRecord, MatchScores, PickleballState, Player } from '../types';

export const INITIAL_COURT_1: CourtData = {
  id: 1,
  name: 'Court 1 (Main)',
  teamA: null,
  teamB: null,
  matchStartTime: null,
  matchNumber: 1,
  currentScores: { teamA: 0, teamB: 0 },
};

export const INITIAL_COURT_2: CourtData = {
  id: 2,
  name: 'Court 2 (Secondary)',
  teamA: null,
  teamB: null,
  matchStartTime: null,
  matchNumber: 1,
  currentScores: { teamA: 0, teamB: 0 },
};

/**
 * Normalizes a player name for duplicate checking
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Checks if a player name already exists in Court 1, Court 2, or queue
 */
export function isDuplicateName(
  name: string,
  state: PickleballState,
  excludePlayerId?: string
): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return false;

  const allPlayers = getAllPlayers(state);
  return allPlayers.some(
    p => p.id !== excludePlayerId && normalizeName(p.name) === normalized
  );
}

/**
 * Extracts active players from a single court
 */
export function getCourtPlayers(court: CourtData): Player[] {
  const players: Player[] = [];
  if (court.teamA) {
    players.push(court.teamA[0], court.teamA[1]);
  }
  if (court.teamB) {
    players.push(court.teamB[0], court.teamB[1]);
  }
  return players;
}

/**
 * Retrieves all players across all active courts and queue
 */
export function getAllPlayers(state: PickleballState): Player[] {
  const c1 = getCourtPlayers(state.court1);
  const c2 = getCourtPlayers(state.court2);
  return [...c1, ...c2, ...state.queue];
}

/**
 * Creates teams from an array of exactly 4 players.
 * Team 1 (A) = Player 1 + Player 2
 * Team 2 (B) = Player 3 + Player 4
 */
export function createTeams(fourPlayers: Player[]): { teamA: [Player, Player] | null; teamB: [Player, Player] | null } {
  if (fourPlayers.length !== 4) {
    return { teamA: null, teamB: null };
  }
  return {
    teamA: [fourPlayers[0], fourPlayers[1]],
    teamB: [fourPlayers[2], fourPlayers[3]],
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Add Player
 * =========================================================================
 * Every new player is ALWAYS added to the END of the queue.
 */
export function addPlayerToState(
  state: PickleballState,
  playerName: string
): { nextState: PickleballState; error?: string; newPlayer?: Player } {
  const trimmedName = playerName.trim();
  if (!trimmedName) {
    return { nextState: state, error: 'Player name cannot be empty.' };
  }

  if (isDuplicateName(trimmedName, state)) {
    return {
      nextState: state,
      error: `Player "${trimmedName}" is already registered. Names must be unique.`,
    };
  }

  const newPlayer: Player = {
    id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    joinedAt: Date.now(),
    gamesPlayed: 0,
  };

  const nextQueue = [...state.queue, newPlayer];

  return {
    nextState: {
      ...state,
      queue: nextQueue,
    },
    newPlayer,
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Start Court Match
 * =========================================================================
 */
export function startCourtMatch(
  state: PickleballState,
  courtId: 1 | 2
): { nextState: PickleballState; error?: string } {
  const targetCourt = courtId === 1 ? state.court1 : state.court2;

  if (courtId === 2 && !state.isCourt2Available) {
    return { nextState: state, error: 'Court 2 is currently reserved for promotion matches.' };
  }

  if (state.queue.length < 4) {
    return { nextState: state, error: `Need at least 4 waiting players to start ${targetCourt.name}.` };
  }

  const firstFour = state.queue.slice(0, 4);
  const remainingQueue = state.queue.slice(4);
  const teams = createTeams(firstFour);

  const updatedCourt: CourtData = {
    ...targetCourt,
    teamA: teams.teamA,
    teamB: teams.teamB,
    matchStartTime: Date.now(),
    matchNumber: targetCourt.matchNumber === 0 ? 1 : targetCourt.matchNumber,
    currentScores: { teamA: 0, teamB: 0 },
  };

  return {
    nextState: {
      ...state,
      [courtId === 1 ? 'court1' : 'court2']: updatedCourt,
      queue: remainingQueue,
    },
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Start All Available Courts
 * =========================================================================
 */
export function startAllAvailableCourts(state: PickleballState): {
  nextState: PickleballState;
  error?: string;
} {
  const allPlayers = getAllPlayers(state);
  if (allPlayers.length < 4) {
    return { nextState: state, error: 'Need at least 4 players to start.' };
  }

  let queue = state.queue.length >= 4
    ? [...state.queue]
    : [...getCourtPlayers(state.court1), ...getCourtPlayers(state.court2), ...state.queue];

  let nextCourt1 = { ...state.court1 };
  let nextCourt2 = { ...state.court2 };

  // Fill Court 1 if needed
  if (!nextCourt1.teamA && queue.length >= 4) {
    const c1Players = queue.slice(0, 4);
    queue = queue.slice(4);
    const teams = createTeams(c1Players);
    nextCourt1 = {
      ...nextCourt1,
      teamA: teams.teamA,
      teamB: teams.teamB,
      matchStartTime: Date.now(),
      currentScores: { teamA: 0, teamB: 0 },
    };
  }

  // Fill Court 2 if available and enough players
  if (state.isCourt2Available && !nextCourt2.teamA && queue.length >= 4) {
    const c2Players = queue.slice(0, 4);
    queue = queue.slice(4);
    const teams = createTeams(c2Players);
    nextCourt2 = {
      ...nextCourt2,
      teamA: teams.teamA,
      teamB: teams.teamB,
      matchStartTime: Date.now(),
      currentScores: { teamA: 0, teamB: 0 },
    };
  }

  return {
    nextState: {
      ...state,
      court1: nextCourt1,
      court2: nextCourt2,
      queue,
    },
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Finish Game on Specific Court
 * =========================================================================
 */
export function finishCourtGameAndRotate(
  state: PickleballState,
  courtId: 1 | 2,
  scores?: { teamA: number; teamB: number }
): {
  nextState: PickleballState;
  finishedMatch?: MatchRecord;
  error?: string;
} {
  const targetCourt = courtId === 1 ? state.court1 : state.court2;
  const courtPlayers = getCourtPlayers(targetCourt);

  if (courtPlayers.length !== 4) {
    return { nextState: state, error: `No active 4-player match on ${targetCourt.name} to finish.` };
  }

  const now = Date.now();
  const startTime = targetCourt.matchStartTime || now;
  const durationSeconds = Math.max(1, Math.round((now - startTime) / 1000));

  const actualScores = scores || targetCourt.currentScores;
  let winner: 'Team A' | 'Team B' | 'Draw' | undefined = undefined;
  if (actualScores.teamA > actualScores.teamB) {
    winner = 'Team A';
  } else if (actualScores.teamB > actualScores.teamA) {
    winner = 'Team B';
  } else if (actualScores.teamA > 0 || actualScores.teamB > 0) {
    winner = 'Draw';
  }

  const matchScores: MatchScores | undefined =
    actualScores.teamA > 0 || actualScores.teamB > 0
      ? { teamA: actualScores.teamA, teamB: actualScores.teamB, winner }
      : undefined;

  const finishedMatch: MatchRecord = {
    id: `match_c${courtId}_${targetCourt.matchNumber}_${now}`,
    courtId,
    courtName: targetCourt.name,
    matchNumber: targetCourt.matchNumber,
    startTime,
    endTime: now,
    durationSeconds,
    teamANames: [targetCourt.teamA![0].name, targetCourt.teamA![1].name],
    teamBNames: [targetCourt.teamB![0].name, targetCourt.teamB![1].name],
    scores: matchScores,
  };

  // 1. Current 4 players get gamesPlayed + 1
  const updatedCourtPlayers: Player[] = courtPlayers.map(p => ({
    ...p,
    gamesPlayed: p.gamesPlayed + 1,
  }));

  // 2. Append finished players to the END of the waiting queue
  const combinedQueue = [...state.queue, ...updatedCourtPlayers];

  // 3. Take next 4 from queue for this court if available
  let nextTeamA: [Player, Player] | null = null;
  let nextTeamB: [Player, Player] | null = null;
  let nextQueue: Player[] = combinedQueue;
  let nextMatchStartTime: number | null = null;

  if (combinedQueue.length >= 4) {
    const nextFour = combinedQueue.slice(0, 4);
    nextQueue = combinedQueue.slice(4);
    const teams = createTeams(nextFour);
    nextTeamA = teams.teamA;
    nextTeamB = teams.teamB;
    nextMatchStartTime = now;
  }

  const updatedCourt: CourtData = {
    ...targetCourt,
    teamA: nextTeamA,
    teamB: nextTeamB,
    matchStartTime: nextMatchStartTime,
    matchNumber: targetCourt.matchNumber + 1,
    currentScores: { teamA: 0, teamB: 0 },
  };

  const nextState: PickleballState = {
    ...state,
    [courtId === 1 ? 'court1' : 'court2']: updatedCourt,
    queue: nextQueue,
    matchHistory: [finishedMatch, ...state.matchHistory],
  };

  return { nextState, finishedMatch };
}

/**
 * =========================================================================
 * ADMIN FEATURE: Toggle Court 2 Availability (Promotion Match Mode)
 * =========================================================================
 */
export function toggleCourt2Mode(state: PickleballState): PickleballState {
  const willBeAvailable = !state.isCourt2Available;

  if (!willBeAvailable) {
    // Disabling Court 2 (Reserved for promotion matches)
    // If Court 2 has active players, return them to the waiting queue cleanly
    const court2Players = getCourtPlayers(state.court2);
    const nextQueue = [...state.queue, ...court2Players];

    return {
      ...state,
      isCourt2Available: false,
      court2: {
        ...state.court2,
        teamA: null,
        teamB: null,
        matchStartTime: null,
        currentScores: { teamA: 0, teamB: 0 },
      },
      queue: nextQueue,
    };
  } else {
    // Enabling Court 2
    return {
      ...state,
      isCourt2Available: true,
    };
  }
}

/**
 * =========================================================================
 * ADMIN FEATURE: Shuffle Teams on a Specific Court
 * =========================================================================
 */
export function shuffleCourtTeams(state: PickleballState, courtId: 1 | 2): {
  nextState: PickleballState;
  error?: string;
} {
  const targetCourt = courtId === 1 ? state.court1 : state.court2;
  const courtPlayers = getCourtPlayers(targetCourt);

  if (courtPlayers.length !== 4) {
    return { nextState: state, error: `Need 4 players on ${targetCourt.name} to shuffle teams.` };
  }

  const shuffled = [...courtPlayers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const teams = createTeams(shuffled);
  const updatedCourt: CourtData = {
    ...targetCourt,
    teamA: teams.teamA,
    teamB: teams.teamB,
  };

  return {
    nextState: {
      ...state,
      [courtId === 1 ? 'court1' : 'court2']: updatedCourt,
    },
  };
}

/**
 * =========================================================================
 * ADMIN FEATURE: Swap Partners on a Specific Court
 * =========================================================================
 */
export function swapCourtPartners(state: PickleballState, courtId: 1 | 2): {
  nextState: PickleballState;
  error?: string;
} {
  const targetCourt = courtId === 1 ? state.court1 : state.court2;
  if (!targetCourt.teamA || !targetCourt.teamB) {
    return { nextState: state, error: `No active teams on ${targetCourt.name} to swap.` };
  }

  const [a1, a2] = targetCourt.teamA;
  const [b1, b2] = targetCourt.teamB;

  const updatedCourt: CourtData = {
    ...targetCourt,
    teamA: [a1, b1],
    teamB: [a2, b2],
  };

  return {
    nextState: {
      ...state,
      [courtId === 1 ? 'court1' : 'court2']: updatedCourt,
    },
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Remove Player
 * =========================================================================
 */
export function removePlayerFromState(
  state: PickleballState,
  playerId: string
): { nextState: PickleballState; removedPlayer?: Player } {
  // Check queue
  const inQueueIdx = state.queue.findIndex(p => p.id === playerId);
  if (inQueueIdx !== -1) {
    const removedPlayer = state.queue[inQueueIdx];
    return {
      nextState: {
        ...state,
        queue: state.queue.filter(p => p.id !== playerId),
      },
      removedPlayer,
    };
  }

  // Check Court 1
  const c1Players = getCourtPlayers(state.court1);
  const inC1Idx = c1Players.findIndex(p => p.id === playerId);
  if (inC1Idx !== -1) {
    const removedPlayer = c1Players[inC1Idx];
    const remaining = c1Players.filter(p => p.id !== playerId);

    if (state.queue.length > 0) {
      const sub = state.queue[0];
      const nextQueue = state.queue.slice(1);
      const teams = createTeams([...remaining, sub]);
      return {
        nextState: {
          ...state,
          court1: { ...state.court1, teamA: teams.teamA, teamB: teams.teamB },
          queue: nextQueue,
        },
        removedPlayer,
      };
    } else {
      return {
        nextState: {
          ...state,
          court1: { ...state.court1, teamA: null, teamB: null, matchStartTime: null },
          queue: [...remaining, ...state.queue],
        },
        removedPlayer,
      };
    }
  }

  // Check Court 2
  const c2Players = getCourtPlayers(state.court2);
  const inC2Idx = c2Players.findIndex(p => p.id === playerId);
  if (inC2Idx !== -1) {
    const removedPlayer = c2Players[inC2Idx];
    const remaining = c2Players.filter(p => p.id !== playerId);

    if (state.queue.length > 0) {
      const sub = state.queue[0];
      const nextQueue = state.queue.slice(1);
      const teams = createTeams([...remaining, sub]);
      return {
        nextState: {
          ...state,
          court2: { ...state.court2, teamA: teams.teamA, teamB: teams.teamB },
          queue: nextQueue,
        },
        removedPlayer,
      };
    } else {
      return {
        nextState: {
          ...state,
          court2: { ...state.court2, teamA: null, teamB: null, matchStartTime: null },
          queue: [...remaining, ...state.queue],
        },
        removedPlayer,
      };
    }
  }

  return { nextState: state };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Edit Player Name
 * =========================================================================
 */
export function editPlayerNameInState(
  state: PickleballState,
  playerId: string,
  newName: string
): { nextState: PickleballState; error?: string } {
  const trimmed = newName.trim();
  if (!trimmed) return { nextState: state, error: 'Player name cannot be blank.' };

  if (isDuplicateName(trimmed, state, playerId)) {
    return { nextState: state, error: `Another player is named "${trimmed}". Names must be unique.` };
  }

  const update = (p: Player): Player => (p.id === playerId ? { ...p, name: trimmed } : p);

  const nextQueue = state.queue.map(update);

  const updateCourt = (c: CourtData): CourtData => {
    if (!c.teamA || !c.teamB) return c;
    return {
      ...c,
      teamA: [update(c.teamA[0]), update(c.teamA[1])],
      teamB: [update(c.teamB[0]), update(c.teamB[1])],
    };
  };

  return {
    nextState: {
      ...state,
      court1: updateCourt(state.court1),
      court2: updateCourt(state.court2),
      queue: nextQueue,
    },
  };
}

/**
 * =========================================================================
 * Reset Session
 * =========================================================================
 */
export function resetSessionInState(state: PickleballState): PickleballState {
  const allInOrder = [
    ...getCourtPlayers(state.court1),
    ...getCourtPlayers(state.court2),
    ...state.queue,
  ];

  return {
    ...state,
    court1: {
      ...state.court1,
      teamA: null,
      teamB: null,
      matchStartTime: null,
      matchNumber: 1,
      currentScores: { teamA: 0, teamB: 0 },
    },
    court2: {
      ...state.court2,
      teamA: null,
      teamB: null,
      matchStartTime: null,
      matchNumber: 1,
      currentScores: { teamA: 0, teamB: 0 },
    },
    queue: allInOrder,
  };
}

/**
 * =========================================================================
 * Clear All Players
 * =========================================================================
 */
export function clearAllInState(state: PickleballState): PickleballState {
  return {
    ...state,
    court1: {
      ...state.court1,
      teamA: null,
      teamB: null,
      matchStartTime: null,
      matchNumber: 1,
      currentScores: { teamA: 0, teamB: 0 },
    },
    court2: {
      ...state.court2,
      teamA: null,
      teamB: null,
      matchStartTime: null,
      matchNumber: 1,
      currentScores: { teamA: 0, teamB: 0 },
    },
    queue: [],
    matchHistory: [],
  };
}

export const DEMO_PLAYERS = [
  'Alex Rivera',
  'Jordan Chen',
  'Taylor Swift',
  'Marcus Vance',
  'Elena Rostova',
  'Liam Gallagher',
  'Sophia Patel',
  'Noah Kim',
  'Carlos Santana',
  'Maya Lin',
  'Lucas Becker',
  'Hannah Abbott',
];

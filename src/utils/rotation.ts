import type { CourtData, MatchRecord, MatchScores, PickleballState, Player, PlayerGroup, DragItemData } from '../types';

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

const GROUP_COLORS = [
  '#10b981', // emerald
  '#0284c7', // sky
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // rose
  '#6366f1', // indigo
];

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

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

export function getAllPlayers(state: PickleballState): Player[] {
  const c1 = getCourtPlayers(state.court1);
  const c2 = getCourtPlayers(state.court2);
  return [...c1, ...c2, ...state.queue];
}

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
 * Add Player to end of queue
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

  return {
    nextState: {
      ...state,
      queue: [...state.queue, newPlayer],
    },
    newPlayer,
  };
}

/**
 * =========================================================================
 * PRESET GROUPS (PLAYER MATCHING / LINKED PAIRS / 4-PLAYER FOURSOMES)
 * =========================================================================
 */

export function createPlayerGroup(
  state: PickleballState,
  playerIds: string[],
  groupName?: string,
  groupType: 'duo' | 'foursome' = playerIds.length === 4 ? 'foursome' : 'duo'
): { nextState: PickleballState; newGroup?: PlayerGroup; error?: string } {
  if (playerIds.length < 2 || playerIds.length > 4) {
    return { nextState: state, error: 'A preset group must contain between 2 and 4 players.' };
  }

  const allPlayers = getAllPlayers(state);
  const targetPlayers = allPlayers.filter(p => playerIds.includes(p.id));

  if (targetPlayers.length !== playerIds.length) {
    return { nextState: state, error: 'Some selected players could not be found.' };
  }

  const alreadyGrouped = targetPlayers.find(p => p.groupId);
  if (alreadyGrouped) {
    return {
      nextState: state,
      error: `Player "${alreadyGrouped.name}" is already in a group. Please unlink them first.`,
    };
  }

  const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const color = GROUP_COLORS[state.groups.length % GROUP_COLORS.length];
  const autoName =
    groupName?.trim() ||
    (groupType === 'foursome' || playerIds.length === 4
      ? `Match Group: ${targetPlayers.map(p => p.name).join(', ')}`
      : `Duo: ${targetPlayers.map(p => p.name).join(' & ')}`);

  const newGroup: PlayerGroup = {
    id: groupId,
    name: autoName,
    playerIds,
    groupType,
    neverSplit: true,
    color,
    createdAt: Date.now(),
  };

  const updatePlayerGroup = (p: Player): Player =>
    playerIds.includes(p.id) ? { ...p, groupId } : p;

  let nextQueue = state.queue.map(updatePlayerGroup);

  const groupedInQueue = nextQueue.filter(p => playerIds.includes(p.id));
  if (groupedInQueue.length > 0) {
    const firstIdx = nextQueue.findIndex(p => playerIds.includes(p.id));
    const nonGrouped = nextQueue.filter(p => !playerIds.includes(p.id));
    nonGrouped.splice(firstIdx, 0, ...groupedInQueue);
    nextQueue = nonGrouped;
  }

  const updateCourt = (c: CourtData): CourtData => ({
    ...c,
    teamA: c.teamA ? [updatePlayerGroup(c.teamA[0]), updatePlayerGroup(c.teamA[1])] : null,
    teamB: c.teamB ? [updatePlayerGroup(c.teamB[0]), updatePlayerGroup(c.teamB[1])] : null,
  });

  return {
    nextState: {
      ...state,
      groups: [...state.groups, newGroup],
      queue: nextQueue,
      court1: updateCourt(state.court1),
      court2: updateCourt(state.court2),
    },
    newGroup,
  };
}

export function unlinkPlayerGroup(
  state: PickleballState,
  groupId: string
): { nextState: PickleballState } {
  const removeGroupId = (p: Player): Player =>
    p.groupId === groupId ? { ...p, groupId: undefined } : p;

  const updateCourt = (c: CourtData): CourtData => ({
    ...c,
    teamA: c.teamA ? [removeGroupId(c.teamA[0]), removeGroupId(c.teamA[1])] : null,
    teamB: c.teamB ? [removeGroupId(c.teamB[0]), removeGroupId(c.teamB[1])] : null,
  });

  return {
    nextState: {
      ...state,
      groups: state.groups.filter(g => g.id !== groupId),
      queue: state.queue.map(removeGroupId),
      court1: updateCourt(state.court1),
      court2: updateCourt(state.court2),
    },
  };
}

/**
 * =========================================================================
 * ROTATION SELECTION ALGORITHM (5-CASE RULE FOR 4-PLAYER PRESET GROUPS)
 * =========================================================================
 */
export function getNextFourForCourt(
  queue: Player[],
  groups: PlayerGroup[]
): { fourPlayers: Player[] | null; remainingQueue: Player[] } {
  if (queue.length < 4) {
    return { fourPlayers: null, remainingQueue: queue };
  }

  // Find first 4-player "neverSplit" group in queue
  const foursomeGroup = groups.find(
    g => g.playerIds.length === 4 && g.neverSplit !== false
  );

  if (!foursomeGroup) {
    // Standard rotation: top 4
    return {
      fourPlayers: queue.slice(0, 4),
      remainingQueue: queue.slice(4),
    };
  }

  const groupMemberIds = new Set(foursomeGroup.playerIds);
  const queueGroupMembers = queue.filter(p => groupMemberIds.has(p.id));

  if (queueGroupMembers.length !== 4) {
    // Group members not all in queue, standard top 4
    return {
      fourPlayers: queue.slice(0, 4),
      remainingQueue: queue.slice(4),
    };
  }

  const firstMemberIdx = queue.findIndex(p => groupMemberIds.has(p.id));

  // Count individual players ahead of Group G
  const playersAhead = queue.slice(0, firstMemberIdx);
  const N = playersAhead.length;

  // CASE 0 (0 ahead) & CASE 4 (4+ ahead): Top 4 from queue form the match
  if (N === 0 || N >= 4) {
    return {
      fourPlayers: queue.slice(0, 4),
      remainingQueue: queue.slice(4),
    };
  }

  // CASE 1 (1 ahead), CASE 2 (2 ahead), CASE 3 (3 ahead):
  // Collect N players ahead, skip 4-player Group G, take (4 - N) players from BELOW Group G
  const queueAfterFirstMember = queue.slice(firstMemberIdx);
  const queueBelowGroup = queueAfterFirstMember.filter(p => !groupMemberIds.has(p.id));

  const neededFromBelow = 4 - N;

  if (queueBelowGroup.length >= neededFromBelow) {
    const belowPlayersToTake = queueBelowGroup.slice(0, neededFromBelow);

    const fourPlayers = [...playersAhead, ...belowPlayersToTake];

    // Reconstruct remaining queue: Group G stays intact at #1, followed by remaining below players
    const remainingBelow = queueBelowGroup.slice(neededFromBelow);
    const remainingQueue = [...queueGroupMembers, ...remainingBelow];

    return { fourPlayers, remainingQueue };
  } else {
    // Insufficient players below Group G to fill individual match -> Group G plays next as 4 players!
    const fourPlayers = queueGroupMembers;
    const remainingQueue = queue.filter(p => !groupMemberIds.has(p.id));
    return { fourPlayers, remainingQueue };
  }
}

/**
 * =========================================================================
 * DRAG & DROP: Queue Reordering
 * =========================================================================
 */
export function reorderQueueItem(
  state: PickleballState,
  draggedPlayerId: string,
  targetIndex: number
): PickleballState {
  const queue = [...state.queue];
  const draggedPlayer = queue.find(p => p.id === draggedPlayerId);
  if (!draggedPlayer) return state;

  let itemsToMove: Player[] = [draggedPlayer];
  if (draggedPlayer.groupId) {
    itemsToMove = queue.filter(p => p.groupId === draggedPlayer.groupId);
  }

  const remainingQueue = queue.filter(p => !itemsToMove.some(m => m.id === p.id));
  const clampedTarget = Math.max(0, Math.min(targetIndex, remainingQueue.length));

  remainingQueue.splice(clampedTarget, 0, ...itemsToMove);

  return {
    ...state,
    queue: remainingQueue,
  };
}

/**
 * =========================================================================
 * DRAG & DROP: Drag Player / Group to Court (SWAP POSITIONS, NO REPLACEMENT)
 * =========================================================================
 */
export function dropOnCourt(
  state: PickleballState,
  dragData: DragItemData,
  targetCourtId: 1 | 2,
  targetTeam: 'teamA' | 'teamB' = 'teamA',
  targetPlayerId?: string
): PickleballState {
  if (targetCourtId === 2 && !state.isCourt2Available) return state;

  const targetCourtKey = targetCourtId === 1 ? 'court1' : 'court2';
  const targetCourt = state[targetCourtKey];

  if (targetCourt.teamA && targetCourt.teamB) {
    if (dragData.source === 'court' && dragData.courtId) {
      const sourceCourtKey = dragData.courtId === 1 ? 'court1' : 'court2';
      const sourceCourt = state[sourceCourtKey];
      const draggedPlayerId = dragData.id;

      const sourceTeam = dragData.team || 'teamA';
      const sourcePlayers = [...(sourceCourt[sourceTeam] || [])] as [Player, Player];
      const destPlayers = [...(targetCourt[targetTeam] || [])] as [Player, Player];

      const draggedIdx = sourcePlayers.findIndex(p => p.id === draggedPlayerId);
      if (draggedIdx === -1) return state;

      const targetIdx = targetPlayerId
        ? destPlayers.findIndex(p => p.id === targetPlayerId)
        : 0;
      const validTargetIdx = targetIdx !== -1 ? targetIdx : 0;

      if (dragData.courtId === targetCourtId && sourceTeam === targetTeam) {
        const otherIdx = draggedIdx === 0 ? 1 : 0;
        const temp = sourcePlayers[draggedIdx];
        sourcePlayers[draggedIdx] = sourcePlayers[otherIdx];
        sourcePlayers[otherIdx] = temp;

        return {
          ...state,
          [targetCourtKey]: {
            ...targetCourt,
            [sourceTeam]: sourcePlayers,
          },
        };
      }

      const temp = sourcePlayers[draggedIdx];
      sourcePlayers[draggedIdx] = destPlayers[validTargetIdx];
      destPlayers[validTargetIdx] = temp;

      if (dragData.courtId === targetCourtId) {
        return {
          ...state,
          [targetCourtKey]: {
            ...targetCourt,
            [sourceTeam]: sourcePlayers,
            [targetTeam]: destPlayers,
          },
        };
      } else {
        return {
          ...state,
          [sourceCourtKey]: {
            ...sourceCourt,
            [sourceTeam]: sourcePlayers,
          },
          [targetCourtKey]: {
            ...targetCourt,
            [targetTeam]: destPlayers,
          },
        };
      }
    }

    if (dragData.source === 'queue') {
      const destPlayers = [...(targetCourt[targetTeam] || [])] as [Player, Player];
      const queuePlayersToMove = state.queue.filter(p => dragData.playerIds.includes(p.id));
      if (queuePlayersToMove.length === 0) return state;

      if (queuePlayersToMove.length === 1) {
        const singleQueuePlayer = queuePlayersToMove[0];
        const targetIdx = targetPlayerId
          ? destPlayers.findIndex(p => p.id === targetPlayerId)
          : 0;
        const validTargetIdx = targetIdx !== -1 ? targetIdx : 0;

        const displacedCourtPlayer = destPlayers[validTargetIdx];
        destPlayers[validTargetIdx] = singleQueuePlayer;

        const queueIdx = typeof dragData.queueIndex === 'number' ? dragData.queueIndex : 0;
        const nextQueue = [...state.queue];
        const replaceAt = nextQueue.findIndex(p => p.id === singleQueuePlayer.id);
        if (replaceAt !== -1) {
          nextQueue[replaceAt] = displacedCourtPlayer;
        } else {
          nextQueue.splice(queueIdx, 0, displacedCourtPlayer);
        }

        return {
          ...state,
          [targetCourtKey]: {
            ...targetCourt,
            [targetTeam]: destPlayers,
          },
          queue: nextQueue,
        };
      } else if (queuePlayersToMove.length >= 2) {
        const displacedTeamPlayers = destPlayers;
        const newTeamDuo: [Player, Player] = [queuePlayersToMove[0], queuePlayersToMove[1]];

        const firstDuoIdx = state.queue.findIndex(p => p.id === queuePlayersToMove[0].id);
        const nextQueue = state.queue.filter(p => !queuePlayersToMove.some(q => q.id === p.id));
        const insertAt = firstDuoIdx !== -1 ? firstDuoIdx : nextQueue.length;
        nextQueue.splice(insertAt, 0, ...displacedTeamPlayers);

        return {
          ...state,
          [targetCourtKey]: {
            ...targetCourt,
            [targetTeam]: newTeamDuo,
          },
          queue: nextQueue,
        };
      }
    }
  }

  const allPlayers = getAllPlayers(state);
  const playersToMove = allPlayers.filter(p => dragData.playerIds.includes(p.id));
  if (playersToMove.length === 0) return state;

  let nextState = removePlayersFromState(state, dragData.playerIds);
  const currentCourt = nextState[targetCourtKey];
  let currentCourtPlayers = getCourtPlayers(currentCourt).filter(p => !dragData.playerIds.includes(p.id));

  const combined = [...currentCourtPlayers, ...playersToMove];
  if (combined.length >= 4) {
    const teams = createTeams(combined.slice(0, 4));
    return {
      ...nextState,
      [targetCourtKey]: {
        ...currentCourt,
        teamA: teams.teamA,
        teamB: teams.teamB,
        matchStartTime: currentCourt.matchStartTime || Date.now(),
      },
    };
  }

  return nextState;
}

/**
 * Remove array of player IDs from queue and courts without losing player state
 */
function removePlayersFromState(state: PickleballState, playerIds: string[]): PickleballState {
  const cleanPlayer = (p: Player | null) => (p && playerIds.includes(p.id) ? null : p);

  const cleanTeam = (team: [Player, Player] | null): [Player, Player] | null => {
    if (!team) return null;
    const a = cleanPlayer(team[0]);
    const b = cleanPlayer(team[1]);
    if (a && b) return [a, b];
    return null;
  };

  return {
    ...state,
    queue: state.queue.filter(p => !playerIds.includes(p.id)),
    court1: {
      ...state.court1,
      teamA: cleanTeam(state.court1.teamA),
      teamB: cleanTeam(state.court1.teamB),
    },
    court2: {
      ...state.court2,
      teamA: cleanTeam(state.court2.teamA),
      teamB: cleanTeam(state.court2.teamB),
    },
  };
}

/**
 * =========================================================================
 * ROTATION ALGORITHM: Start Court Match (With 5-Case Rule)
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

  const { fourPlayers, remainingQueue } = getNextFourForCourt(state.queue, state.groups);

  if (!fourPlayers || fourPlayers.length < 4) {
    return { nextState: state, error: `Need at least 4 waiting players to start ${targetCourt.name}.` };
  }

  const teams = createTeams(fourPlayers);

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

  if (!nextCourt1.teamA && queue.length >= 4) {
    const { fourPlayers, remainingQueue } = getNextFourForCourt(queue, state.groups);
    if (fourPlayers) {
      queue = remainingQueue;
      const teams = createTeams(fourPlayers);
      nextCourt1 = {
        ...nextCourt1,
        teamA: teams.teamA,
        teamB: teams.teamB,
        matchStartTime: Date.now(),
        currentScores: { teamA: 0, teamB: 0 },
      };
    }
  }

  if (state.isCourt2Available && !nextCourt2.teamA && queue.length >= 4) {
    const { fourPlayers, remainingQueue } = getNextFourForCourt(queue, state.groups);
    if (fourPlayers) {
      queue = remainingQueue;
      const teams = createTeams(fourPlayers);
      nextCourt2 = {
        ...nextCourt2,
        teamA: teams.teamA,
        teamB: teams.teamB,
        matchStartTime: Date.now(),
        currentScores: { teamA: 0, teamB: 0 },
      };
    }
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
 * ROTATION ALGORITHM: Finish Game & Group Preservation
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

  const updatedCourtPlayers: Player[] = courtPlayers.map(p => ({
    ...p,
    gamesPlayed: p.gamesPlayed + 1,
  }));

  // Existing queue before match finish
  const existingQueue = [...state.queue];

  let nextTeamA: [Player, Player] | null = null;
  let nextTeamB: [Player, Player] | null = null;
  let nextQueue: Player[];
  let nextMatchStartTime: number | null = null;

  if (existingQueue.length >= 4) {
    // Evaluate next 4 using the 5-case rotation rule
    const { fourPlayers, remainingQueue } = getNextFourForCourt(existingQueue, state.groups);
    if (fourPlayers) {
      const teams = createTeams(fourPlayers);
      nextTeamA = teams.teamA;
      nextTeamB = teams.teamB;
      nextMatchStartTime = now;
      nextQueue = [...remainingQueue, ...updatedCourtPlayers];
    } else {
      nextQueue = [...existingQueue, ...updatedCourtPlayers];
    }
  } else {
    // All 4 finished court players return to end of queue
    nextQueue = [...existingQueue, ...updatedCourtPlayers];
    nextTeamA = null;
    nextTeamB = null;
    nextMatchStartTime = null;
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

export function toggleCourt2Mode(state: PickleballState): PickleballState {
  const willBeAvailable = !state.isCourt2Available;

  if (!willBeAvailable) {
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
    return {
      ...state,
      isCourt2Available: true,
    };
  }
}

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

export function removePlayerFromState(
  state: PickleballState,
  playerId: string
): { nextState: PickleballState; removedPlayer?: Player } {
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
    groups: [],
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

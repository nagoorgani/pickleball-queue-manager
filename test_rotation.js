// Pure JS import of compiled dist or quick direct test
function normalizeName(name) {
  return name.trim().toLowerCase();
}

function getAllPlayers(state) {
  const courtPlayers = [];
  if (state.court.teamA) courtPlayers.push(state.court.teamA[0], state.court.teamA[1]);
  if (state.court.teamB) courtPlayers.push(state.court.teamB[0], state.court.teamB[1]);
  return [...courtPlayers, ...state.queue];
}

function isDuplicateName(name, state, excludePlayerId) {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  const allPlayers = getAllPlayers(state);
  return allPlayers.some(p => p.id !== excludePlayerId && normalizeName(p.name) === normalized);
}

function createTeams(fourPlayers) {
  if (fourPlayers.length !== 4) return { teamA: null, teamB: null };
  return {
    teamA: [fourPlayers[0], fourPlayers[1]],
    teamB: [fourPlayers[2], fourPlayers[3]],
  };
}

function addPlayerToState(state, playerName) {
  const trimmedName = playerName.trim();
  if (!trimmedName) return { nextState: state, error: 'Player name cannot be empty.' };
  if (isDuplicateName(trimmedName, state)) {
    return { nextState: state, error: `Player "${trimmedName}" is already registered.` };
  }
  const newPlayer = {
    id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    joinedAt: Date.now(),
    gamesPlayed: 0,
  };
  return {
    nextState: { ...state, queue: [...state.queue, newPlayer] },
    newPlayer,
  };
}

function startSession(state) {
  const allPlayers = getAllPlayers(state);
  if (allPlayers.length < 4) {
    return { nextState: state, error: 'Need at least 4 players to start.' };
  }
  const firstFour = state.queue.slice(0, 4);
  const remainingQueue = state.queue.slice(4);
  const newCourt = createTeams(firstFour);
  return {
    nextState: {
      ...state,
      court: newCourt,
      queue: remainingQueue,
      isSessionActive: true,
      matchStartTime: Date.now(),
      matchNumber: 1,
    },
  };
}

function finishGameAndRotate(state) {
  const courtPlayers = [];
  if (state.court.teamA) courtPlayers.push(state.court.teamA[0], state.court.teamA[1]);
  if (state.court.teamB) courtPlayers.push(state.court.teamB[0], state.court.teamB[1]);

  if (courtPlayers.length !== 4) {
    return { nextState: state, error: 'No active 4-player match on court to finish.' };
  }

  const updatedCourtPlayers = courtPlayers.map(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
  const combinedQueue = [...state.queue, ...updatedCourtPlayers];

  let nextCourt = { teamA: null, teamB: null };
  let nextQueue = combinedQueue;
  let nextMatchStartTime = null;

  if (combinedQueue.length >= 4) {
    const nextFour = combinedQueue.slice(0, 4);
    nextQueue = combinedQueue.slice(4);
    nextCourt = createTeams(nextFour);
    nextMatchStartTime = Date.now();
  }

  return {
    nextState: {
      ...state,
      court: nextCourt,
      queue: nextQueue,
      isSessionActive: combinedQueue.length >= 4,
      matchStartTime: nextMatchStartTime,
      matchNumber: state.matchNumber + 1,
      matchHistory: [{ id: 'm1', matchNumber: state.matchNumber }, ...state.matchHistory],
    },
  };
}

console.log('=== VERIFYING PICKLEBALL ROTATION LOGIC ===');

function assert(condition, msg) {
  if (!condition) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  }
  console.log('PASS: ' + msg);
}

let state = {
  court: { teamA: null, teamB: null },
  queue: [],
  isSessionActive: false,
  matchStartTime: null,
  matchNumber: 1,
  matchHistory: [],
  theme: 'dark',
  soundEnabled: true,
};

// Add 8 players
['John', 'Ahmed', 'Sara', 'David', 'Ali', 'Emma', 'Lucas', 'Mia'].forEach(name => {
  const res = addPlayerToState(state, name);
  state = res.nextState;
});
assert(state.queue.length === 8, '8 players registered');

// Test Duplicate Prevention
const dupRes = addPlayerToState(state, 'JOHN');
assert(Boolean(dupRes.error), 'Duplicate prevention works for case-insensitive duplicate');

// Start session
const sessionRes = startSession(state);
assert(!sessionRes.error, 'Session starts successfully');
state = sessionRes.nextState;

assert(state.court.teamA[0].name === 'John' && state.court.teamA[1].name === 'Ahmed', 'Match 1 Team A is John + Ahmed');
assert(state.court.teamB[0].name === 'Sara' && state.court.teamB[1].name === 'David', 'Match 1 Team B is Sara + David');
assert(state.queue.length === 4, 'Waiting queue has 4 players');
assert(state.queue[0].name === 'Ali', 'On deck #1 is Ali');

// Finish game
const rotRes = finishGameAndRotate(state);
assert(!rotRes.error, 'Game finish & rotation succeeds');
state = rotRes.nextState;

assert(state.court.teamA[0].name === 'Ali' && state.court.teamA[1].name === 'Emma', 'Match 2 Team A is Ali + Emma');
assert(state.court.teamB[0].name === 'Lucas' && state.court.teamB[1].name === 'Mia', 'Match 2 Team B is Lucas + Mia');
assert(state.queue[0].name === 'John', 'Queue #1 is John (returned to back of queue)');
assert(state.queue[0].gamesPlayed === 1, 'John gamesPlayed count incremented to 1');

console.log('ALL VERIFICATIONS SUCCESSFUL!');

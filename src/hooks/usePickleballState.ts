import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry, PickleballState, ToastMessage, DragItemData } from '../types';
import {
  loadStateFromStorage,
  saveStateToStorage,
} from '../utils/storage';
import {
  addPlayerToState,
  startCourtMatch,
  startAllAvailableCourts,
  finishCourtGameAndRotate,
  toggleCourt2Mode,
  shuffleCourtTeams,
  swapCourtPartners,
  removePlayerFromState,
  editPlayerNameInState,
  resetSessionInState,
  clearAllInState,
  createPlayerGroup,
  unlinkPlayerGroup,
  reorderQueueItem,
  dropOnCourt,
  DEMO_PLAYERS,
} from '../utils/rotation';
import { soundFx } from '../utils/sound';

export function usePickleballState() {
  const [state, setState] = useState<PickleballState>(() => loadStateFromStorage());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Auto-save on state change
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Apply dark/light class to root document
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Push entry onto undo history stack
  const pushHistory = useCallback((description: string, currentState: PickleballState) => {
    setHistory(prev => [{ state: currentState, description }, ...prev.slice(0, 19)]);
  }, []);

  // Toast System
  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts(prev => [...prev.slice(-3), { id, title, description, type }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 1. Add Player
  const handleAddPlayer = useCallback(
    (playerName: string) => {
      const { nextState, error, newPlayer } = addPlayerToState(state, playerName);
      if (error) {
        addToast('Cannot Add Player', error, 'warning');
        return false;
      }

      pushHistory(`Added player "${newPlayer?.name}"`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast('Player Added', `"${newPlayer?.name}" joined the waiting queue.`, 'success');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 2. Preset Group Creation
  const handleCreateGroup = useCallback(
    (playerIds: string[], groupName?: string) => {
      const { nextState, newGroup, error } = createPlayerGroup(state, playerIds, groupName);
      if (error) {
        addToast('Group Creation Failed', error, 'warning');
        return false;
      }

      pushHistory(`Created preset group "${newGroup?.name}"`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playWhistle();
      addToast('Preset Group Created!', `Linked ${playerIds.length} players into "${newGroup?.name}".`, 'success');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 3. Unlink Group
  const handleUnlinkGroup = useCallback(
    (groupId: string) => {
      const group = state.groups.find(g => g.id === groupId);
      const { nextState } = unlinkPlayerGroup(state, groupId);

      pushHistory(`Unlinked group "${group?.name || groupId}"`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playUndo();
      addToast('Group Unlinked', `Group "${group?.name || 'Duo'}" unlinked into individual players.`, 'info');
    },
    [state, addToast, pushHistory]
  );

  // 4. Reorder Queue (Drag & Drop)
  const handleReorderQueue = useCallback(
    (draggedPlayerId: string, targetIndex: number) => {
      const nextState = reorderQueueItem(state, draggedPlayerId, targetIndex);
      pushHistory('Reordered queue via drag-and-drop', state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
    },
    [state, pushHistory]
  );

  // 5. Drop on Court (Drag & Drop with Side/Position Swap)
  const handleDropOnCourt = useCallback(
    (dragData: DragItemData, targetCourtId: 1 | 2, targetTeam?: 'teamA' | 'teamB', targetPlayerId?: string) => {
      const nextState = dropOnCourt(state, dragData, targetCourtId, targetTeam, targetPlayerId);
      pushHistory(`Swapped player/group on Court ${targetCourtId}`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast('Court Positions Swapped!', `Player/Group swapped positions on Court ${targetCourtId}.`, 'success');
    },
    [state, addToast, pushHistory]
  );

  // 6. Start Match on Court
  const handleStartCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = startCourtMatch(state, courtId);
      if (error) {
        addToast('Cannot Start Match', error, 'warning');
        return false;
      }

      const courtName = courtId === 1 ? state.court1.name : state.court2.name;
      pushHistory(`Started match on ${courtName}`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playWhistle();
      addToast('Match Started!', `${courtName} match is now live.`, 'success');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 7. Start All Available Courts
  const handleStartAllCourts = useCallback(() => {
    const { nextState, error } = startAllAvailableCourts(state);
    if (error) {
      addToast('Cannot Start Session', error, 'warning');
      return false;
    }

    pushHistory('Started match session across courts', state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playWhistle();
    addToast('Session Started!', 'Available courts have been populated with players.', 'success');
    return true;
  }, [state, addToast, pushHistory]);

  // 8. Finish Game & Rotate
  const handleFinishCourtGame = useCallback(
    (courtId: 1 | 2, scores?: { teamA: number; teamB: number }) => {
      const { nextState, finishedMatch, error } = finishCourtGameAndRotate(state, courtId, scores);
      if (error) {
        addToast('Cannot Finish Match', error, 'warning');
        return false;
      }

      const courtName = courtId === 1 ? state.court1.name : state.court2.name;
      pushHistory(`Finished match on ${courtName}`, state);
      setState(nextState);

      if (state.soundEnabled) soundFx.playCelebration();

      const scoreText = finishedMatch?.scores
        ? ` (${finishedMatch.scores.teamA} - ${finishedMatch.scores.teamB})`
        : '';
      addToast(
        'Match Completed! 🎉',
        `${courtName} finished${scoreText}. Players rotated to end of queue.`,
        'success'
      );
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 9. Toggle Court 2 Availability Mode
  const handleToggleCourt2 = useCallback(() => {
    const nextState = toggleCourt2Mode(state);
    const wasAvailable = state.isCourt2Available;

    pushHistory(wasAvailable ? 'Reserved Court 2 for Promotion Matches' : 'Enabled Court 2 for Open Queue', state);
    setState(nextState);

    if (state.soundEnabled) soundFx.playPop();

    if (wasAvailable) {
      addToast(
        '1 Court Mode Active',
        'Court 2 reserved for promotion matches. Active Court 2 players returned to queue.',
        'info'
      );
    } else {
      addToast(
        '2 Courts Mode Active',
        'Court 2 is now available for open queue rotations.',
        'success'
      );
    }
  }, [state, addToast, pushHistory]);

  // 10. Shuffle Court Teams
  const handleShuffleCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = shuffleCourtTeams(state, courtId);
      if (error) {
        addToast('Shuffle Failed', error, 'warning');
        return false;
      }

      pushHistory(`Shuffled teams on Court ${courtId}`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast(`Court ${courtId} Shuffled`, 'Active players re-paired into new teams.', 'info');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 11. Swap Court Partners
  const handleSwapCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = swapCourtPartners(state, courtId);
      if (error) {
        addToast('Swap Failed', error, 'warning');
        return false;
      }

      pushHistory(`Swapped partners on Court ${courtId}`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast(`Court ${courtId} Partners Swapped`, 'Swapped player pairings on court.', 'info');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 12. Update Court Live Scores
  const handleUpdateCourtScores = useCallback(
    (courtId: 1 | 2, teamA: number, teamB: number) => {
      setState(prev => {
        const target = courtId === 1 ? 'court1' : 'court2';
        return {
          ...prev,
          [target]: {
            ...prev[target],
            currentScores: {
              teamA: Math.max(0, teamA),
              teamB: Math.max(0, teamB),
            },
          },
        };
      });
    },
    []
  );

  // 13. Remove Player
  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      const { nextState, removedPlayer } = removePlayerFromState(state, playerId);
      if (!removedPlayer) return false;

      pushHistory(`Removed player "${removedPlayer.name}"`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playUndo();
      addToast('Player Removed', `"${removedPlayer.name}" was removed.`, 'info');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 14. Edit Player Name
  const handleEditPlayer = useCallback(
    (playerId: string, newName: string) => {
      const { nextState, error } = editPlayerNameInState(state, playerId, newName);
      if (error) {
        addToast('Edit Failed', error, 'error');
        return false;
      }
      pushHistory(`Renamed player to "${newName.trim()}"`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast('Player Updated', `Name changed to "${newName.trim()}".`, 'success');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 15. Reset Session
  const handleResetSession = useCallback(() => {
    pushHistory('Reset Court Session', state);
    const nextState = resetSessionInState(state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playUndo();
    addToast('Session Reset', 'All players returned to waiting queue.', 'info');
  }, [state, addToast, pushHistory]);

  // 16. Clear All
  const handleClearAll = useCallback(() => {
    pushHistory('Cleared All Players', state);
    const nextState = clearAllInState(state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playUndo();
    addToast('Queue Cleared', 'All players, courts, and scores have been cleared.', 'info');
  }, [state, addToast, pushHistory]);

  // 17. Load Demo Players
  const handleLoadDemoPlayers = useCallback(() => {
    pushHistory('Loaded Demo Players', state);
    let currentState = clearAllInState(state);
    currentState = { ...currentState, isCourt2Available: true };

    DEMO_PLAYERS.forEach(name => {
      const { nextState } = addPlayerToState(currentState, name);
      currentState = nextState;
    });

    const { nextState } = startAllAvailableCourts(currentState);
    setState(nextState);
    if (state.soundEnabled) soundFx.playWhistle();
    addToast('Demo Players Loaded!', 'Court 1 and Court 2 populated, remaining in queue.', 'success');
  }, [state, addToast, pushHistory]);

  // 18. Undo Last Action
  const handleUndo = useCallback(() => {
    if (history.length === 0) {
      addToast('Nothing to Undo', 'No previous actions found in history.', 'info');
      return;
    }

    const [lastHistoryItem, ...remainingHistory] = history;
    setHistory(remainingHistory);
    setState(lastHistoryItem.state);
    if (state.soundEnabled) soundFx.playUndo();
    addToast('Action Undone', `Reverted: ${lastHistoryItem.description}`, 'info');
  }, [history, state.soundEnabled, addToast]);

  // 19. Toggles
  const handleToggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const handleToggleSound = useCallback(() => {
    setState(prev => {
      const nextSound = !prev.soundEnabled;
      if (nextSound) soundFx.playPop();
      return { ...prev, soundEnabled: nextSound };
    });
  }, []);

  return {
    state,
    canUndo: history.length > 0,
    lastActionDescription: history[0]?.description,
    toasts,
    addToast,
    removeToast,
    addPlayer: handleAddPlayer,
    createGroup: handleCreateGroup,
    unlinkGroup: handleUnlinkGroup,
    reorderQueue: handleReorderQueue,
    dropOnCourt: handleDropOnCourt,
    startCourt: handleStartCourt,
    startAllCourts: handleStartAllCourts,
    finishCourtGame: handleFinishCourtGame,
    toggleCourt2: handleToggleCourt2,
    shuffleCourt: handleShuffleCourt,
    swapCourt: handleSwapCourt,
    updateCourtScores: handleUpdateCourtScores,
    removePlayer: handleRemovePlayer,
    editPlayer: handleEditPlayer,
    resetSession: handleResetSession,
    clearAll: handleClearAll,
    loadDemoPlayers: handleLoadDemoPlayers,
    undo: handleUndo,
    toggleTheme: handleToggleTheme,
    toggleSound: handleToggleSound,
  };
}

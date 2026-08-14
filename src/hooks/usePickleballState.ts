import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  PickleballState,
  HistoryEntry,
  ToastMessage,
  NotificationType,
  Player,
} from '../types';
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
  DEMO_PLAYERS,
} from '../utils/rotation';
import { soundFx } from '../utils/sound';

const MAX_HISTORY_LENGTH = 25;

export function usePickleballState() {
  const [state, setState] = useState<PickleballState>(loadStateFromStorage);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isInitialMount = useRef(true);

  // Sync with Local Storage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveStateToStorage(state);
  }, [state]);

  // Sync theme
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Toast notifier
  const addToast = useCallback(
    (title: string, description?: string, type: NotificationType = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts(prev => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushHistory = useCallback((description: string, currentState: PickleballState) => {
    setHistory(prev => [
      { state: currentState, description },
      ...prev.slice(0, MAX_HISTORY_LENGTH - 1),
    ]);
  }, []);

  // 1. Add Player
  const handleAddPlayer = useCallback(
    (name: string) => {
      const { nextState, error, newPlayer } = addPlayerToState(state, name);
      if (error) {
        addToast('Cannot Add Player', error, 'error');
        return false;
      }
      pushHistory(`Added player "${newPlayer?.name}"`, state);

      // Auto-fill empty court if 4+ players ready
      if (!nextState.court1.teamA && nextState.queue.length >= 4) {
        const started = startCourtMatch(nextState, 1);
        setState(started.nextState);
        if (state.soundEnabled) soundFx.playWhistle();
        addToast('Player Added & Court 1 Ready', `"${newPlayer?.name}" added. Match 1 started on Court 1!`, 'success');
      } else if (nextState.isCourt2Available && !nextState.court2.teamA && nextState.queue.length >= 4) {
        const started = startCourtMatch(nextState, 2);
        setState(started.nextState);
        if (state.soundEnabled) soundFx.playWhistle();
        addToast('Player Added & Court 2 Ready', `"${newPlayer?.name}" added. Match 1 started on Court 2!`, 'success');
      } else {
        setState(nextState);
        if (state.soundEnabled) soundFx.playPop();
        addToast('Player Added', `"${newPlayer?.name}" joined the waiting queue.`, 'success');
      }
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 2. Start Court Match
  const handleStartCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = startCourtMatch(state, courtId);
      if (error) {
        addToast(`Cannot Start Court ${courtId}`, error, 'warning');
        return false;
      }
      pushHistory(`Started Court ${courtId} Match`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playWhistle();
      addToast(`Court ${courtId} Match Started!`, `4 players rotated onto Court ${courtId}.`, 'success');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 3. Start All Available Courts
  const handleStartAllCourts = useCallback(() => {
    const { nextState, error } = startAllAvailableCourts(state);
    if (error) {
      addToast('Cannot Start Courts', error, 'warning');
      return false;
    }
    pushHistory('Started All Available Courts', state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playWhistle();
    addToast('Courts Started!', 'Available courts are active with matches.', 'success');
    return true;
  }, [state, addToast, pushHistory]);

  // 4. Finish Game on Specific Court
  const handleFinishCourtGame = useCallback(
    (courtId: 1 | 2, customScores?: { teamA: number; teamB: number }) => {
      const targetCourt = courtId === 1 ? state.court1 : state.court2;
      const scoresToRecord = customScores || targetCourt.currentScores;

      const { nextState, finishedMatch, error } = finishCourtGameAndRotate(
        state,
        courtId,
        scoresToRecord
      );
      if (error) {
        addToast('Action Failed', error, 'error');
        return false;
      }

      pushHistory(`Finished Court ${courtId} Match #${finishedMatch?.matchNumber}`, state);
      setState(nextState);

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#84cc16', '#10b981', '#38bdf8', '#fbbf24'],
        });
      } catch {
        // Confetti fallback
      }

      if (state.soundEnabled) {
        soundFx.playCelebration();
      }

      const scoreText =
        scoresToRecord.teamA > 0 || scoresToRecord.teamB > 0
          ? ` (${scoresToRecord.teamA} - ${scoresToRecord.teamB})`
          : '';

      const nextTargetCourt = courtId === 1 ? nextState.court1 : nextState.court2;

      addToast(
        `Court ${courtId} Match #${finishedMatch?.matchNumber} Finished!${scoreText}`,
        nextTargetCourt.teamA
          ? `Court ${courtId} rotated with next 4 players from queue.`
          : `Court ${courtId} players returned to queue. Waiting for more players.`,
        'success'
      );
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 5. Toggle Court 2 Availability (Promotion Match Mode)
  const handleToggleCourt2 = useCallback(() => {
    const nextState = toggleCourt2Mode(state);
    const isNowAvailable = nextState.isCourt2Available;

    pushHistory(
      isNowAvailable ? 'Enabled Court 2 (2 Courts Active)' : 'Reserved Court 2 for Promotion Matches (1 Court Active)',
      state
    );
    setState(nextState);
    if (state.soundEnabled) soundFx.playPop();

    addToast(
      isNowAvailable ? '2 Courts Mode Activated' : '1 Court Mode (Court 2 Reserved)',
      isNowAvailable
        ? 'Both Court 1 and Court 2 are available for open queue rotation.'
        : 'Court 2 is now marked for Promotion Matches. Active rotations run on Court 1 only.',
      'info'
    );
  }, [state, addToast, pushHistory]);

  // 6. Shuffle Court Teams
  const handleShuffleCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = shuffleCourtTeams(state, courtId);
      if (error) {
        addToast('Shuffle Failed', error, 'warning');
        return false;
      }
      pushHistory(`Shuffled Court ${courtId} Teams`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast(`Court ${courtId} Teams Shuffled`, 'Players randomly assigned to new teams.', 'info');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 7. Swap Court Partners
  const handleSwapCourt = useCallback(
    (courtId: 1 | 2) => {
      const { nextState, error } = swapCourtPartners(state, courtId);
      if (error) {
        addToast('Swap Failed', error, 'warning');
        return false;
      }
      pushHistory(`Swapped Court ${courtId} Partners`, state);
      setState(nextState);
      if (state.soundEnabled) soundFx.playPop();
      addToast(`Court ${courtId} Partners Swapped`, 'Swapped player pairings on court.', 'info');
      return true;
    },
    [state, addToast, pushHistory]
  );

  // 8. Update Court Live Scores
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

  // 9. Remove Player
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

  // 10. Edit Player Name
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

  // 11. Reset Session
  const handleResetSession = useCallback(() => {
    pushHistory('Reset Court Session', state);
    const nextState = resetSessionInState(state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playUndo();
    addToast('Session Reset', 'All players returned to waiting queue.', 'info');
  }, [state, addToast, pushHistory]);

  // 12. Clear All
  const handleClearAll = useCallback(() => {
    pushHistory('Cleared All Players', state);
    const nextState = clearAllInState(state);
    setState(nextState);
    if (state.soundEnabled) soundFx.playUndo();
    addToast('Queue Cleared', 'All players, courts, and scores have been cleared.', 'info');
  }, [state, addToast, pushHistory]);

  // 13. Load Demo Players (12 players to fill both courts + queue!)
  const handleLoadDemoPlayers = useCallback(() => {
    pushHistory('Loaded Demo Players (12 players)', state);
    let currentState = clearAllInState(state);
    currentState = { ...currentState, isCourt2Available: true };

    const addedPlayers: Player[] = [];
    DEMO_PLAYERS.forEach(name => {
      const { nextState, newPlayer } = addPlayerToState(currentState, name);
      currentState = nextState;
      if (newPlayer) addedPlayers.push(newPlayer);
    });

    const { nextState } = startAllAvailableCourts(currentState);
    setState(nextState);
    if (state.soundEnabled) soundFx.playWhistle();
    addToast('12 Demo Players Loaded!', 'Court 1 and Court 2 are active, remaining players in queue.', 'success');
  }, [state, addToast, pushHistory]);

  // 14. Undo Last Action
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

  // 15. Toggles
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
    removeToast,
    addPlayer: handleAddPlayer,
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

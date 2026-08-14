import { useState, useMemo } from 'react';
import { usePickleballState } from './hooks/usePickleballState';
import { getAllPlayers } from './utils/rotation';
import type { Player } from './types';
import { Header } from './components/Header';
import { CourtView } from './components/CourtView';
import { NextMatchPreview } from './components/NextMatchPreview';
import { WaitingQueue } from './components/WaitingQueue';
import { AddPlayerForm } from './components/AddPlayerForm';
import { EditPlayerModal } from './components/EditPlayerModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { ToastContainer } from './components/Toast';

type ConfirmDialogType =
  | { type: 'remove_player'; player: Player }
  | { type: 'reset_session' }
  | { type: 'clear_all' }
  | null;

export function App() {
  const {
    state,
    canUndo,
    lastActionDescription,
    toasts,
    removeToast,
    addPlayer,
    startCourt,
    startAllCourts,
    finishCourtGame,
    toggleCourt2,
    shuffleCourt,
    swapCourt,
    updateCourtScores,
    removePlayer,
    editPlayer,
    resetSession,
    clearAll,
    loadDemoPlayers,
    undo,
    toggleTheme,
    toggleSound,
  } = usePickleballState();

  // Modals state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogType>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const allPlayers = useMemo(() => getAllPlayers(state), [state]);

  // Handle remove confirmation
  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'remove_player') {
      removePlayer(confirmDialog.player.id);
    } else if (confirmDialog.type === 'reset_session') {
      resetSession();
    } else if (confirmDialog.type === 'clear_all') {
      clearAll();
    }
    setConfirmDialog(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header Bar */}
      <Header
        totalPlayers={allPlayers.length}
        queueCount={state.queue.length}
        court1={state.court1}
        court2={state.court2}
        isCourt2Available={state.isCourt2Available}
        theme={state.theme}
        soundEnabled={state.soundEnabled}
        canUndo={canUndo}
        lastActionDescription={lastActionDescription}
        onToggleCourt2={toggleCourt2}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onUndo={undo}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onRequestResetSession={() => setConfirmDialog({ type: 'reset_session' })}
        onRequestClearAll={() => setConfirmDialog({ type: 'clear_all' })}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top: Add Player Input & Quick Actions */}
        <AddPlayerForm
          onAddPlayer={addPlayer}
          onLoadDemoPlayers={loadDemoPlayers}
          showDemoButton={allPlayers.length === 0}
        />

        {/* Court and Queue Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Courts & Next Match Preview) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Current Match / Courts */}
            <CourtView
              court1={state.court1}
              court2={state.court2}
              isCourt2Available={state.isCourt2Available}
              queue={state.queue}
              totalPlayers={allPlayers.length}
              onToggleCourt2={toggleCourt2}
              onStartCourtMatch={startCourt}
              onStartAllCourts={startAllCourts}
              onFinishCourtGame={finishCourtGame}
              onShuffleCourt={shuffleCourt}
              onSwapCourt={swapCourt}
              onUpdateCourtScores={updateCourtScores}
              onRequestResetSession={() => setConfirmDialog({ type: 'reset_session' })}
              onEditPlayer={player => setEditingPlayer(player)}
              onRequestRemovePlayer={player =>
                setConfirmDialog({ type: 'remove_player', player })
              }
            />

            {/* Section 2: Next Match Preview */}
            <NextMatchPreview
              queue={state.queue}
              isCourt2Available={state.isCourt2Available}
            />
          </div>

          {/* Right Column (Section 3: Waiting Queue) */}
          <div className="lg:col-span-5 space-y-6">
            <WaitingQueue
              queue={state.queue}
              onEditPlayer={player => setEditingPlayer(player)}
              onRequestRemovePlayer={player =>
                setConfirmDialog({ type: 'remove_player', player })
              }
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
        <p>Pickleball Queue Manager • Multi-Court & Single-Court Fair FIFO Rotation System • Live Score Tracking</p>
      </footer>

      {/* Modals & Dialogs */}
      <EditPlayerModal
        isOpen={Boolean(editingPlayer)}
        player={editingPlayer}
        onSave={editPlayer}
        onClose={() => setEditingPlayer(null)}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmDialog)}
        title={
          confirmDialog?.type === 'remove_player'
            ? 'Remove Player'
            : confirmDialog?.type === 'reset_session'
            ? 'Reset Active Matches & Courts?'
            : 'Clear All Players?'
        }
        message={
          confirmDialog?.type === 'remove_player'
            ? `Are you sure you want to remove "${confirmDialog.player.name}"? The courts and queue order will automatically update.`
            : confirmDialog?.type === 'reset_session'
            ? 'This will return all active court players back to the waiting queue, reset live scores, and reset match timers.'
            : 'Are you sure you want to delete all registered players and reset court stats? This cannot be undone.'
        }
        confirmLabel={
          confirmDialog?.type === 'remove_player'
            ? 'Remove Player'
            : confirmDialog?.type === 'reset_session'
            ? 'Reset Session'
            : 'Clear Everything'
        }
        confirmVariant={confirmDialog?.type === 'reset_session' ? 'warning' : 'danger'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />

      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        matches={state.matchHistory}
        allPlayers={allPlayers}
      />

      {/* Floating Action Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;

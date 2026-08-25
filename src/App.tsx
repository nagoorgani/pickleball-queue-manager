import { useState, useMemo, useEffect } from 'react';
import { usePickleballState } from './hooks/usePickleballState';
import { getAllPlayers } from './utils/rotation';
import { checkAdminSession, getAdminUsername, logoutAdmin } from './utils/auth';
import type { Player } from './types';
import { Header } from './components/Header';
import { CourtView } from './components/CourtView';
import { NextMatchPreview } from './components/NextMatchPreview';
import { WaitingQueue } from './components/WaitingQueue';
import { AddPlayerForm } from './components/AddPlayerForm';
import { EditPlayerModal } from './components/EditPlayerModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { GroupManagerModal } from './components/GroupManagerModal';
import { LoginPage } from './components/LoginPage';
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
    addToast,
    addPlayer,
    createGroup,
    unlinkGroup,
    reorderQueue,
    dropOnCourt,
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

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkAdminSession);
  const [adminUsername, setAdminUsername] = useState<string>(getAdminUsername);
  const [isSpectatorMode, setIsSpectatorMode] = useState<boolean>(false);

  // Modals state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogType>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(checkAdminSession());
    setAdminUsername(getAdminUsername());
  }, []);

  const allPlayers = useMemo(() => getAllPlayers(state), [state]);

  const handleLoginSuccess = (loginId: string) => {
    setIsAuthenticated(true);
    setAdminUsername(loginId);
    setIsSpectatorMode(false);
    addToast('Admin Logged In', `Welcome, ${loginId}! Full court control enabled.`, 'success');
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setIsSpectatorMode(false);
    addToast('Logged Out', 'Admin session has been ended.', 'info');
  };

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

  // If not authenticated and not in spectator view, show Login Page
  if (!isAuthenticated && !isSpectatorMode) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onViewAsSpectator={() => setIsSpectatorMode(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Spectator Mode Banner */}
      {!isAuthenticated && isSpectatorMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-3">
          <span>👀 Spectator Mode: Live Court View (Read-Only)</span>
          <button
            type="button"
            onClick={() => setIsSpectatorMode(false)}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-black shadow transition-transform active:scale-95 cursor-pointer"
          >
            Admin Log In
          </button>
        </div>
      )}

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
        adminUsername={isAuthenticated ? adminUsername : 'Spectator'}
        onToggleCourt2={toggleCourt2}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onUndo={undo}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onLogout={handleLogout}
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
              onDropOnCourt={dropOnCourt}
            />

            {/* Section 2: Next Match Preview */}
            <NextMatchPreview
              queue={state.queue}
              groups={state.groups}
              isCourt2Available={state.isCourt2Available}
            />
          </div>

          {/* Right Column (Section 3: Waiting Queue) */}
          <div className="lg:col-span-5 space-y-6">
            <WaitingQueue
              queue={state.queue}
              groups={state.groups}
              onEditPlayer={player => setEditingPlayer(player)}
              onRequestRemovePlayer={player =>
                setConfirmDialog({ type: 'remove_player', player })
              }
              onUnlinkGroup={unlinkGroup}
              onOpenGroupManager={() => setIsGroupManagerOpen(true)}
              onReorderQueue={reorderQueue}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
        <p>Pickleball Queue Manager • Drag & Drop Queue Reordering • Preset Partner Groups • Single-Admin Secured</p>
      </footer>

      {/* Modals & Dialogs */}
      <EditPlayerModal
        isOpen={Boolean(editingPlayer)}
        player={editingPlayer}
        onSave={editPlayer}
        onClose={() => setEditingPlayer(null)}
      />

      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        currentLoginId={adminUsername}
        onClose={() => setIsAdminSettingsOpen(false)}
        onCredentialsUpdated={newId => setAdminUsername(newId)}
      />

      <GroupManagerModal
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        queue={state.queue}
        allPlayers={allPlayers}
        groups={state.groups}
        onCreateGroup={createGroup}
        onUnlinkGroup={unlinkGroup}
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

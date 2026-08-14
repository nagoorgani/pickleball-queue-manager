# 🎾 Pickleball Queue Manager

A modern, mobile-friendly web application designed to automatically manage pickleball court player rotations, team pairings, live scores, and waiting queues with zero disputes.

---

## 🌟 Features

### 🏓 1. Dual Court & Promotion Match Mode
- **2 Courts Mode**: Both Court 1 and Court 2 actively rotate players from the shared waiting queue (8 simultaneous players on court).
- **1 Court Mode**: Court 2 can be toggled to **"Reserved / Promotion Match"** mode for special events or tournaments, running rotations exclusively on Court 1.
- **Independent Courts**: Each court tracks its own active match, live duration timer ($mm:ss$), and live point scoring.

### 👥 2. Fair FIFO Player Rotation & Team Formation
- Exactly 4 players per court (Team A = Player 1 + 2, Team B = Player 3 + 4).
- Every new player is appended to the end of the waiting queue.
- When finishing a game, active players return to the end of the queue, and the top 4 waiting players immediately take the court.
- Strict arrival order preservation.

### 🔀 3. Admin Tools & Team Controls
- **Shuffle Teams**: Randomly re-pair the 4 active players into fresh teams.
- **Swap Partners**: Instantly swap player partners between Team A and Team B ($A_1 + B_1$ vs $A_2 + B_2$).
- **Player Edit & Remove**: Inline editing and removal with confirmation dialogs.

### 🏆 4. Live Match Scorekeeper & Game History
- Live point counters with `+ Point`, `- 1`, and `Reset Score`.
- Auto-winner detection (First to 11, win by 2).
- **Match History Modal**: Records match number, court name, duration, final scores, and player leaderboards.

### ⚡ 5. Quality & UX
- **Local Storage Persistence**: State, queues, active games, themes, and match history automatically persist across page reloads.
- **Multi-Level Undo**: Revert any game rotation, player addition, edit, or removal with one click.
- **Dark & Light Mode**: Toggle between sports dark theme and high-contrast light theme.
- **Audio Feedback**: Synthesized court whistle, paddle pops, and victory chimes via Web Audio API.
- **Demo Data Loader**: 1-click button to load 12 demo players for instant testing.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Celebration**: Canvas Confetti
- **Audio**: Web Audio API (Synthesized)
- **Storage**: Local Storage (No backend required)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/nagoorgani/pickleball-queue-manager.git

# 2. Navigate to directory
cd pickleball-queue-manager

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📜 License

MIT License. Feel free to use and contribute!

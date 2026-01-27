# Changelog - Chess Tic-Tac-Toe

## v1.1 - Critical Fixes & UI Overhaul (Current)

### 🐛 Critical Bug Fixes

1. **Placement Phase Extended**
   - **Issue:** Phase transition was at ply 5 (only 2 pieces per player)
   - **Fix:** Phase transition now at ply 7 (3 pieces per player as intended)
   - **Files:** `chess-ttt-engine.ts`, `Game.tsx`, `chess_tic_tac_toe_prd.md`
   - **Impact:** Prevents early captures, improves strategic gameplay

2. **Pawn Direction Corrected**
   - **Issue:** Pawn directions were inverted relative to UI layout
   - **Fix:** 
     - White pawns (top) now move DOWN correctly (row 0 → 3)
     - Black pawns (bottom) now move UP correctly (row 3 → 0)
   - **Files:** `chess-ttt-engine.ts` line 91
   - **Impact:** Pawns now move away from their owner as intended

3. **Placement Phase Click Bug**
   - **Issue:** Could click board pieces during placement phase
   - **Fix:** Added defensive check to prevent interactions with occupied squares
   - **Files:** `Game.tsx` onSquareClick function
   - **Impact:** Enforces placement-only rule during plies 1-6

### 🎨 UI/UX Improvements

1. **Complete UI Redesign**
   - Modern gradient header with purple theme
   - Player panels above and below board (White top, Black bottom)
   - Improved piece visibility with larger symbols (56px on board, 32px in panels)
   - Clear color differentiation: White (outlined) vs Black (filled) pieces
   - Professional styling with shadows, animations, and smooth transitions

2. **Board Improvements**
   - Seamless 4×4 grid with visible borders between squares
   - Uniform light beige background (#f5e6d3)
   - Clear grid structure without gaps
   - Larger square size (90px) for better visibility
   - Hover effects on all interactive elements

3. **Player Panels**
   - Both players visible simultaneously
   - Vertical layout matching pawn movement direction
   - Clear piece state indicators:
     - ○ = Unplaced (available to place)
     - ● = On Board (currently placed)
     - ✕ = Captured (available to respawn)
   - Active player highlighted with gold border
   - Animated "Your Turn" indicator
   - Piece cards show symbol, name, and state

4. **Enhanced Interactions**
   - **Click to select/deselect:** Click same piece again to deselect
   - **Seamless selection switching:** Click different piece to switch selection
   - **Interactive board pieces:** Click your own piece on board to select it (hybrid phase)
   - **Context-aware instructions:** Dynamic help text based on game state
   - **Visual feedback:** Green highlights for moves, red for captures, gold for selection

5. **Score Tracking System**
   - Persistent win counter across multiple games
   - Live score display: "⚪ White [X] - ⚫ Black [Y]"
   - Click score box to reset scores
   - Integrated elegantly into header

6. **Removed Confusing Elements**
   - Removed standalone "Cancel" button
   - Integrated unselect into piece interaction (click same piece)
   - Clearer phase indicator: "Placement Phase (2/6)" or "Movement Phase"
   - Error messages are prominent and clear

### 📄 Documentation Updates

1. **PRD Enhancements**
   - Updated Phase 1 to reflect 6 plies (3 per player)
   - Updated Phase 2 to reflect ply 7+ transition
   - Added comprehensive pawn direction documentation
   - Added detailed capture rules for all piece types
   - Added win condition scenarios
   - Added edge cases and loss conditions
   - Added test scenarios section
   - Updated to v1.1 status

2. **New Documentation**
   - **TESTING.md:** Comprehensive test plan with 50+ test cases
   - **CHANGELOG.md:** This file
   - Inline code comments updated throughout

### 🔧 Technical Changes

1. **Engine Updates**
   - `phaseFromPly()`: Returns PLACEMENT_ONLY for ply ≤ 6
   - `defaultPawnDirFor()`: Fixed pawn directions (W=DOWN, B=UP)
   - Updated all phase-related comments (4→6, 5→7)
   - Enhanced validation messages

2. **Component Structure**
   - New `PlayerPanel` component for reusable player displays
   - Improved `Game` component with score state
   - Better separation of concerns
   - Added `useEffect` for score tracking
   - Added `useRef` for winner tracking

3. **Styling Overhaul**
   - Complete CSS rewrite (92 lines → 421 lines)
   - CSS custom properties for theming
   - Responsive design with mobile breakpoints
   - Accessibility improvements (hover states, focus indicators)
   - Professional color scheme and typography

### 📊 Code Statistics

- **Lines Changed:** ~500+
- **Files Modified:** 4 (engine, UI, CSS, PRD)
- **Files Created:** 2 (TESTING.md, CHANGELOG.md)
- **Bug Fixes:** 3 critical
- **New Features:** Score tracking, improved selection UX
- **UI Components:** 1 new (PlayerPanel)

---

## v1.0 - Initial Release

### Features

1. **Core Gameplay**
   - 4×4 board with 4 pieces per player (Pawn, Knight, Bishop, Rook)
   - Two-phase gameplay: Placement → Hybrid
   - Chess-style piece movement
   - Tic-tac-toe win condition (4 in a row)

2. **Game Logic**
   - Deterministic rules engine
   - Legal move generation
   - Win detection (4 rows, 4 columns, 2 diagonals)
   - Capture and respawn mechanics
   - No legal moves = loss

3. **UI**
   - React + TypeScript
   - Vite build system
   - Basic grid layout
   - Piece selection and placement
   - Move highlighting
   - Error messages

### Known Issues (Fixed in v1.1)
- ❌ Placement phase only 4 plies instead of 6
- ❌ Pawn directions inverted
- ❌ UI not intuitive (single player tray, no score, confusing cancel button)
- ❌ Board grid not clearly visible

---

## Future Roadmap

### v1.2 - Polish & Refinements
- Move history display
- Undo last move
- Game state save/load
- Keyboard shortcuts
- Accessibility improvements (ARIA labels, screen reader support)

### v2.0 - AI Opponent
- Minimax algorithm with alpha-beta pruning
- Difficulty levels (Easy, Medium, Hard)
- AI move visualization
- Hint system

### v2.5 - Advanced Features
- Move timer
- Tournament mode
- Player profiles
- Statistics tracking
- Replay mode

### v3.0 - Multiplayer
- Online multiplayer via WebSockets
- Matchmaking system
- Ranked play
- Friend invites
- Chat system

---

## Version History

- **v1.1** (Current): Critical bug fixes, complete UI overhaul
- **v1.0**: Initial release with basic functionality

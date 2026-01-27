# Chess Tic-Tac-Toe (4x4)
## Product Requirements Document (PRD)

---

## 1. Product Overview

**Product Name:** Chess Tic-Tac-Toe (4x4)  
**Platform (MVP):** Web (Vite + React)  
**Future Platforms:** Mobile (wrapper or native)  

Chess Tic-Tac-Toe is a turn-based, two-player abstract strategy game that blends chess-style piece movement with a tic-tac-toe–style win condition. The game is designed to be fast, tactical, and replayable while remaining simple enough for casual players.

The MVP focuses on **local two-player (hot-seat) gameplay** with a clear ruleset and deterministic logic, forming a foundation for future AI and online multiplayer extensions.

---

## 2. Goals & Non-Goals

### Goals
- Create a playable, bug-free MVP with deterministic rules
- Ensure rules are explicit and enforceable by code (no ambiguity)
- Enable fast iteration and playtesting
- Keep UI simple but intuitive

### Non-Goals (MVP)
- AI / Bot opponent
- Online multiplayer
- Timers, rankings, or matchmaking
- Animations, sound, or advanced visuals

---

## 3. Board & Components

### Board
- 4×4 grid (16 squares)
- All squares are uniform (no black/white coloring)
- Coordinates are logical only (row/column); no chess notation required

### Pieces (per player)
Each player has exactly **4 pieces**:
- Pawn (P)
- Knight (N)
- Bishop (B)
- Rook (R)

Constraints:
- A player may never have more than **4 pieces on the board** at any time

---

## 4. Game Phases

### Phase 1: Mandatory Placement Phase (Moves 1–6)
- First **6 plies total** (3 turns per player)
- Each player must place 3 pieces before any other actions
- On each turn:
  - Player **must place** one unplaced piece on any empty square

Restrictions during this phase:
- ❌ No movement
- ❌ No captures
- ❌ No respawns

Purpose:
- Establish an initial board state with majority of pieces placed
- Prevent trivial early wins or captures
- Ensure strategic positioning before gameplay begins
- Players still have 1 piece in reserve for later placement

---

### Phase 2: Hybrid Phase (Move 7 onward)
From ply 7 onward, on each turn a player must perform **exactly one** action:

1. **Move** an on-board piece
2. **Capture** an opponent’s piece
3. **Place** an unplaced piece (if any remain)
4. **Respawn** a previously captured piece

Restrictions:
- No passing turns
- Only one action per turn

---

## 5. Movement Rules (Chess-Based)

### Pawn
**Movement:**
- Moves 1 square forward in its designated direction
- Captures 1 square diagonally forward (like standard chess)
- No double move on first move
- No en passant
- No promotion

**Pawn direction (based on UI layout):**
- White player (shown at top): Pawns move DOWN the board (away from owner)
- Black player (shown at bottom): Pawns move UP the board (away from owner)
- Direction is set when the pawn is first placed/respawned
- Direction never changes except when reversed

**Pawn reversal:**
- When a pawn reaches the far edge of the board:
  - It does **not promote**
  - It permanently reverses direction
  - It can then move back toward its starting side
  - Reversal happens only once per pawn
  - White pawn: reverses when reaching row 3 (bottom)
  - Black pawn: reverses when reaching row 0 (top)

---

### Knight
- Standard L-shaped movement (2 + 1)
- May jump over pieces

---

### Bishop
- Moves diagonally any number of squares
- No color restriction (board is uniform)

---

### Rook
- Moves horizontally or vertically any number of squares

---

## 6. Capture Rules

- Captures follow standard chess logic
- A capture:
  - Removes the opponent’s piece from the board
  - The capturing piece occupies the captured square
- Capturing is considered the player’s **single action for the turn**

Captures may:
- Break an opponent’s potential winning line
- Break an existing line before a win is declared

---

## 7. Respawn Rules

- When a piece is captured, it enters the **CAPTURED** state
- From Phase 2 onward, a player may respawn a captured piece

Respawn rules:
- Respawn counts as a placement
- Respawn must occur on an empty square
- Immediate respawn is allowed (no cooldown)
- Respawning can **immediately win the game**
- Player may never exceed 4 on-board pieces

---

## 8. Win Condition

A player wins **immediately** if they form a straight line of **4 of their own pieces** in any of the following:

- **Horizontal:** Any complete row (4 positions)
- **Vertical:** Any complete column (4 positions)
- **Main diagonal:** Top-left to bottom-right [0, 5, 10, 15]
- **Anti-diagonal:** Top-right to bottom-left [3, 6, 9, 12]

**Winning timing:**
- Win is checked immediately after each action completes
- Winning can occur via:
  - Placement (even during Phase 1 if 3 pieces form a line and a 4th completes it)
  - Movement (moving a piece to complete a line)
  - Capture (capturing into a position that completes a line)
  - Respawn (respawning into a position that completes a line)

**Note on early wins:**
- Theoretically possible (but difficult) to win during placement phase if:
  - Player strategically places 3 pieces in a row/column/diagonal
  - On ply 5 or 6, completes the line with their 3rd piece
  - This is a valid win condition and game ends immediately

**End game:**
- The active player wins instantly when a line is formed
- No further moves are played
- Game state is frozen

---

## 9. Loss Conditions

### No Legal Moves
- If a player starts their turn and has **no legal actions available**:
  - That player **loses immediately**
  - The opponent wins by default

**Scenarios where this can occur:**
- All pieces are on board, all are blocked, no captures possible
- All pieces captured and no empty squares to respawn into (impossible on 4x4 board)
- Extremely rare in practice due to board size and piece variety

### Board Full (Draw Prevention)
- If all 16 squares are filled and no player has won:
  - Game continues with captures and movements only
  - Players cannot place or respawn (no empty squares)
  - First player to form a line wins
  - If neither player can win, player with no legal moves loses

**Note:** Traditional stalemate (draw) does not exist in this game

---

## 10. Explicitly Excluded Rules

The following chess concepts do **not** apply:
- Check / Checkmate
- Self-check
- Castling
- Pawn promotion
- En passant
- Draw by repetition or stalemate

---

## 11. UI Interaction Model (MVP)

### Placement / Respawn
- Player selects a piece first
- Then taps an empty square

### Movement / Capture
- Player taps a piece on the board
- Legal destination squares are highlighted
- Player taps destination square

Only one selection (piece or square) is active at a time.

---

## 12. Technical Architecture (MVP)

### Stack
- Frontend: React + TypeScript
- Build tool: Vite
- Styling: Basic CSS

### Core Modules

#### Rules Engine (`chess-ttt-engine.ts`)
- Board representation (4×4 flat array)
- Piece state model (UNPLACED / ON_BOARD / CAPTURED)
- Legal move generator
- Turn validation
- Win detection

#### UI (`Game.tsx`)
- Local UI state (selected piece, errors)
- Highlights based on legal moves
- Interaction handling

---

## 13. Out of Scope (Future Versions)

- AI / Bot opponents
- Online multiplayer
- Timers and ranked play
- Animations and sound
- Variant rules (e.g., threat-based wins)

---

## 14. Versioning

- **v1.0:** Initial local two-player MVP
- **v1.1 (Current):** Placement phase set to 6 plies (3 pieces per player), improved UI/UX with score tracking
- **v2.0:** Bot / advanced win conditions

---

## 15. Edge Cases & Test Scenarios

### Critical Test Cases

**Placement Phase (Plies 1-6):**
1. ✓ Cannot move pieces
2. ✓ Cannot capture pieces
3. ✓ Cannot respawn pieces
4. ✓ Can only place unplaced pieces on empty squares
5. ✓ Can win if forming a line of 4 (e.g., 3 pieces placed, 4th completes line)
6. ✓ Phase automatically transitions to Hybrid at ply 7

**Hybrid Phase (Ply 7+):**
1. ✓ Can place the 4th (remaining) piece
2. ✓ Can move on-board pieces according to their rules
3. ✓ Can capture enemy pieces
4. ✓ Can respawn captured pieces to empty squares
5. ✓ Cannot exceed 4 pieces on board at once
6. ✓ Win detection works for all action types

**Pawn Behavior:**
1. ✓ Moves forward 1 square
2. ✓ Captures diagonally forward 1 square
3. ✓ White pawn (top) moves DOWN (increases row number)
4. ✓ Black pawn (bottom) moves UP (decreases row number)
5. ✓ Reverses direction when reaching far edge (row 0 or 3)
6. ✓ Reversal happens only once per pawn
7. ✓ Cannot move backward until reversed

**Knight Behavior:**
1. ✓ Moves in L-shape (2+1 or 1+2)
2. ✓ Can jump over pieces
3. ✓ All 8 possible L-moves validated
4. ✓ Can capture on any valid L-destination

**Bishop/Rook Behavior:**
1. ✓ Ray-casting works in all directions
2. ✓ Blocked by first piece (friendly or enemy)
3. ✓ Can capture enemy piece blocking path
4. ✓ Cannot jump over pieces

**Win Conditions:**
1. ✓ 4 rows detected correctly
2. ✓ 4 columns detected correctly
3. ✓ 2 diagonals detected correctly
4. ✓ Win checked after each action
5. ✓ Game ends immediately on win
6. ✓ Winner stored in state

**No Legal Moves:**
1. ✓ Player with no legal moves loses
2. ✓ Checked at start of player's turn
3. ✓ Opponent declared winner

### Edge Cases Handled

**Board State:**
- ✓ Empty board at start (all 16 squares null)
- ✓ All pieces start in UNPLACED state
- ✓ Piece positions sync with board array
- ⚠️ Full board (all 16 squares occupied) - game continues with moves/captures only

**Piece State Transitions:**
- ✓ UNPLACED → ON_BOARD (via PLACE/RESPAWN)
- ✓ ON_BOARD → CAPTURED (via enemy capture)
- ✓ CAPTURED → ON_BOARD (via RESPAWN in Phase 2)
- ✓ Position null when UNPLACED or CAPTURED
- ✓ Position valid (0-15) when ON_BOARD

**Turn Management:**
- ✓ Players alternate turns
- ✓ Ply increments after each turn
- ✓ Current player tracked in state
- ✓ No moves allowed after winner declared

**Respawn Validation:**
- ✓ Only in Phase 2 (ply >= 7)
- ✓ Requires piece in CAPTURED state
- ✓ Requires empty square
- ✓ Cannot respawn if all 4 pieces on board
- ✓ Pawn direction reset on respawn

**Selection/Deselection:**
- ✓ Click piece to select
- ✓ Click same piece again to deselect
- ✓ Click different piece to switch selection
- ✓ Click valid destination to execute action
- ✓ Error message for invalid moves

### Known Limitations & Future Improvements

**Current Limitations:**
- No move history/undo
- No save/load game state
- No AI opponent
- No online multiplayer
- No move timer
- No replay functionality

**Potential Rule Clarifications Needed:**
- What happens if both players repeatedly move pieces without progress?
- Should there be a move limit or draw condition?
- Can a pawn that has reversed be captured and respawned? (Currently: yes, it resets)

---

## 16. Status

**PRD Status:** Locked (v1.1)  
**Ready for:** Playtesting, iteration, and feature expansion


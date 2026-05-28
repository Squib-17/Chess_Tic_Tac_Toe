# Chess Tic-Tac-Toe Testing Guide

## Critical Bug Fixes (v1.1)

### 1. ✅ Placement Phase Extended (FIXED)
**Issue:** Placement phase was only 4 plies (2 per player)
**Fix:** Extended to 6 plies (3 per player)
**Impact:** Players now establish better board position before combat begins

### 2. ✅ Pawn Direction Corrected (FIXED)
**Issue:** Pawn directions were inverted relative to UI layout
**Fix:** 
- White (top) pawns now move DOWN (row 0 → row 3) ✓
- Black (bottom) pawns now move UP (row 3 → row 0) ✓
**Impact:** Pawns now correctly move away from their owner's position

---

## Test Plan

### Phase 1: Placement Phase (Plies 1-6)

#### Test Case 1.1: Basic Placement
- [ ] Place White pawn on square (0,0) - ply 1
- [ ] Place Black knight on square (3,3) - ply 2
- [ ] Place White rook on square (1,1) - ply 3
- [ ] Place Black bishop on square (2,2) - ply 4
- [ ] Place White bishop on square (0,3) - ply 5
- [ ] Place Black rook on square (3,0) - ply 6
- [ ] Verify phase changes to "Movement Phase" at ply 7

#### Test Case 1.2: Movement Blocked During Placement
- [ ] Try to click and move a placed piece during plies 1-6
- [ ] Verify no movement highlights appear
- [ ] Verify piece cannot be moved

#### Test Case 1.3: Capture Blocked During Placement
- [ ] Place White piece on (1,1) - ply 1
- [ ] Place Black piece on (1,2) - ply 2
- [ ] Try to move/capture with White knight
- [ ] Verify capture option is NOT available
- [ ] Verify error message appears if attempted

#### Test Case 1.4: Early Win Scenario
- [ ] White places pawn at (0,0) - ply 1
- [ ] Black places anywhere - ply 2
- [ ] White places knight at (0,1) - ply 3
- [ ] Black places anywhere - ply 4
- [ ] White places bishop at (0,2) - ply 5
- [ ] Black places anywhere - ply 6
- [ ] If Black doesn't block, this should NOT win yet (only 3 pieces)
- [ ] Verify game continues

### Phase 2: Hybrid Phase (Ply 7+)

#### Test Case 2.1: Fourth Piece Placement
- [ ] After ply 6, select unplaced piece from panel
- [ ] Click empty square
- [ ] Verify piece places successfully
- [ ] Verify piece state changes to ON_BOARD

#### Test Case 2.2: Moving Pieces
- [ ] Click on-board rook
- [ ] Verify horizontal/vertical highlights appear
- [ ] Click highlighted square
- [ ] Verify rook moves successfully
- [ ] Verify previous square is now empty

#### Test Case 2.3: Knight Jumping
- [ ] Place pieces to block knight's path
- [ ] Move knight in L-shape over blocking pieces
- [ ] Verify knight can jump over pieces
- [ ] Verify knight lands on correct square

#### Test Case 2.4: Capture Mechanics
- [ ] Move White rook to threaten Black piece
- [ ] On White's turn, click rook
- [ ] Verify enemy piece location shows red (capture) highlight
- [ ] Click enemy piece
- [ ] Verify enemy piece is removed from board
- [ ] Verify capturing piece occupies that square
- [ ] Verify captured piece shows in Black's panel with ✕

#### Test Case 2.5: Respawn Mechanics
- [ ] After capturing a piece, wait for that player's turn
- [ ] Click captured piece in panel (should have ✕ indicator)
- [ ] Verify empty squares are highlighted
- [ ] Click empty square
- [ ] Verify piece returns to board
- [ ] Verify piece state changes to ON_BOARD
- [ ] If pawn: verify direction resets to original

### Pawn Specific Tests

#### Test Case 3.1: White Pawn Movement (Top→Bottom)
- [ ] Place White pawn at row 0
- [ ] Verify pawn can only move to row 1 (DOWN, one square forward)
- [ ] Move pawn to row 1
- [ ] Verify pawn can only move to row 2
- [ ] Continue until row 3 (bottom edge)
- [ ] Verify pawn reverses at row 3
- [ ] Verify pawn can now move back UP toward row 2

#### Test Case 3.2: Black Pawn Movement (Bottom→Top)
- [ ] Place Black pawn at row 3
- [ ] Verify pawn can only move to row 2 (UP, one square forward)
- [ ] Move pawn to row 2
- [ ] Verify pawn can only move to row 1
- [ ] Continue until row 0 (top edge)
- [ ] Verify pawn reverses at row 0
- [ ] Verify pawn can now move back DOWN toward row 1

#### Test Case 3.3: Pawn Diagonal Capture
- [ ] Place White pawn at (1,1)
- [ ] Place Black piece at (2,2) - diagonal forward-right
- [ ] On White's turn, click White pawn
- [ ] Verify diagonal square (2,2) shows red capture highlight
- [ ] Click (2,2) to capture
- [ ] Verify pawn captures successfully

#### Test Case 3.4: Pawn Cannot Move Backward (Before Reversal)
- [ ] Place White pawn at (1,1)
- [ ] Click pawn
- [ ] Verify only row 2 (forward/DOWN) is highlighted
- [ ] Verify row 0 (backward/UP) is NOT highlighted

### Win Condition Tests

#### Test Case 4.1: Horizontal Win
- [ ] Arrange 3 White pieces in a row: (0,0), (0,1), (0,2)
- [ ] Place/move 4th White piece to (0,3)
- [ ] Verify "White Wins!" announcement appears
- [ ] Verify game freezes (no more moves possible)
- [ ] Verify score increments: White = 1

#### Test Case 4.2: Vertical Win
- [ ] Arrange 3 Black pieces in a column: (0,2), (1,2), (2,2)
- [ ] Place/move 4th Black piece to (3,2)
- [ ] Verify "Black Wins!" announcement appears
- [ ] Verify score increments: Black = 1

#### Test Case 4.3: Diagonal Win (Main)
- [ ] Arrange White pieces at (0,0), (1,1), (2,2), (3,3)
- [ ] Verify win detected
- [ ] Verify game ends

#### Test Case 4.4: Diagonal Win (Anti)
- [ ] Arrange Black pieces at (0,3), (1,2), (2,1), (3,0)
- [ ] Verify win detected
- [ ] Verify game ends

#### Test Case 4.5: Win via Capture
- [ ] Set up: White has 3 in a row, Black piece blocks 4th position
- [ ] White captures Black piece to complete the line
- [ ] Verify White wins immediately

#### Test Case 4.6: Win via Respawn
- [ ] Set up: White has 3 in a row, 4th position empty, 4th piece captured
- [ ] White respawns captured piece into 4th position
- [ ] Verify White wins immediately

### UI/UX Tests

#### Test Case 5.1: Selection/Deselection
- [ ] Click piece in panel - verify gold highlight
- [ ] Click same piece again - verify deselection
- [ ] Click different piece - verify selection switches
- [ ] Click board piece (hybrid phase) - verify selection
- [ ] Click empty square with selection - verify placement/move

#### Test Case 5.2: Error Handling
- [ ] Try invalid move - verify error message appears
- [ ] Try placing on occupied square - verify error
- [ ] Try selecting opponent's piece - verify no selection
- [ ] Verify error clears on next valid action

#### Test Case 5.3: Score Tracking
- [ ] Win game as White - verify score: White 1, Black 0
- [ ] Click "New Game" - verify score persists
- [ ] Win game as Black - verify score: White 1, Black 1
- [ ] Click score box - verify score resets to 0-0

#### Test Case 5.4: Visual Indicators
- [ ] Verify current player's panel has gold border
- [ ] Verify "Your Turn" indicator on active player
- [ ] Verify phase display: "Placement Phase (X/6)" or "Movement Phase"
- [ ] Verify piece states: ○ (unplaced), ● (on board), ✕ (captured)
- [ ] Verify move highlights: green (move), red (capture)

### Edge Case Tests

#### Test Case 6.1: No Legal Moves
- [ ] Create scenario where player has no moves (all pieces blocked)
- [ ] Verify "no legal actions" is detected
- [ ] Verify opponent wins

#### Test Case 6.2: Full Board
- [ ] Fill all 16 squares with pieces
- [ ] Verify placement/respawn is disabled
- [ ] Verify only moves and captures possible
- [ ] Verify game continues until win or no legal moves

#### Test Case 6.3: Multiple Captures
- [ ] Capture all 4 opponent pieces
- [ ] Verify opponent can respawn all 4
- [ ] Verify respawn works correctly for all pieces

#### Test Case 6.4: Pawn Respawn After Reversal
- [ ] Move pawn to far edge to reverse it
- [ ] Capture that pawn
- [ ] Respawn pawn
- [ ] Verify pawn direction resets to original (not reversed)

---

## Regression Testing Checklist

After any code changes, verify:
- [ ] Placement phase = 6 plies (not 4 or 8)
- [ ] White pawns move DOWN (top to bottom)
- [ ] Black pawns move UP (bottom to top)
- [ ] No captures during plies 1-6
- [ ] Win detection works for all 10 lines
- [ ] Score persists across games
- [ ] Game ends immediately on win
- [ ] No legal moves = loss

---

## Performance Tests

- [ ] Game loads within 2 seconds
- [ ] Move/placement executes instantly (<100ms)
- [ ] Win detection is immediate
- [ ] No lag with all 8 pieces on board
- [ ] No memory leaks after 10+ games

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Known Issues / Future Improvements

1. No undo function - mistakes are permanent
2. No draw condition - games can theoretically go on forever
3. No move timer - players can take unlimited time
4. No persisted settings or saved games
5. No online multiplayer

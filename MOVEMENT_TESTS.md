# Chess Tic-Tac-Toe Movement Tests

## Purpose
This document provides manual test cases to verify all piece movements work correctly according to the rules.

## Test Setup
Open the game and use the move history feature to verify each piece moves as expected.

---

## Rook Movement Tests

### Test 1: Rook Horizontal Movement
**Setup:**
1. Start new game
2. Place White Rook at B2
3. In hybrid phase, try moving the rook

**Expected:**
- Rook should move to A2, C2, D2 (horizontal)
- Rook should move to B1, B3, B4 (vertical)
- Rook should NOT move diagonally
- Rook should NOT jump over pieces

**Verification:**
- [ ] Can move horizontally (left/right)
- [ ] Can move vertically (up/down)
- [ ] Cannot move diagonally
- [ ] Stops at board edge
- [ ] Stops when blocked by own piece
- [ ] Can capture enemy piece (and stops there)

### Test 2: Rook Ray Blocking
**Setup:**
1. Place White Rook at A1
2. Place White Pawn at A3
3. Place Black Knight at A4
4. Try moving the rook

**Expected:**
- Rook can move to A2 (blocked by pawn at A3)
- Rook cannot move to A3 or A4
- Move history should show only A2 as valid destination

**Verification:**
- [ ] Blocked by friendly piece
- [ ] Cannot jump over pieces
- [ ] Ray stops at first obstruction

### Test 3: Rook Capture
**Setup:**
1. Place White Rook at A1
2. Place Black Bishop at A4
3. Move rook to A4

**Expected:**
- Rook captures Bishop at A4
- Move history shows: "♖ Rook A1 × ♝ A4"
- Bishop enters CAPTURED state

**Verification:**
- [ ] Can capture enemy piece
- [ ] Capture notation correct in history
- [ ] Captured piece removed from board

---

## Bishop Movement Tests

### Test 1: Bishop Diagonal Movement
**Setup:**
1. Place White Bishop at B2
2. In hybrid phase, check valid moves

**Expected:**
- Bishop can move to A1, C3, D4 (one diagonal)
- Bishop can move to A3, C1 (other diagonal)
- Bishop cannot move horizontally or vertically

**Verification:**
- [ ] Moves diagonally only
- [ ] All 4 diagonal directions work
- [ ] Cannot move straight
- [ ] Stops at board edge

### Test 2: Bishop Blocking
**Setup:**
1. Place White Bishop at A1
2. Place White Pawn at B2
3. Place Black Rook at C3

**Expected:**
- Bishop blocked by pawn at B2
- Cannot reach C3 or D4

**Verification:**
- [ ] Blocked by friendly piece
- [ ] Cannot jump over pieces

---

## Knight Movement Tests

### Test 1: Knight L-Shape Movement
**Setup:**
1. Place White Knight at B2
2. Check all valid moves

**Expected:**
- Knight can move to: A4, C4, D3, D1 (all valid L-shapes within bounds)
- Knight cannot move to adjacent squares
- Knight can jump over pieces

**Verification:**
- [ ] All 8 L-shape patterns checked
- [ ] Can jump over pieces
- [ ] Respects board boundaries
- [ ] Cannot move to friendly occupied squares

### Test 2: Knight in Corner
**Setup:**
1. Place White Knight at A1 (corner)
2. Check valid moves

**Expected:**
- Knight can move to: B3, C2 only
- Other L-shapes are out of bounds

**Verification:**
- [ ] Edge case handling correct
- [ ] Only valid L-shapes shown

---

## Pawn Movement Tests

### Test 1: White Pawn Forward Movement
**Setup:**
1. Place White Pawn at B2 (White at top)
2. Check valid moves

**Expected:**
- Pawn can move to B3 (down, away from White)
- Pawn cannot move to B1 (toward White)
- Pawn cannot move horizontally

**Verification:**
- [ ] Moves forward (down) 1 square
- [ ] Cannot move backward
- [ ] Cannot move sideways

### Test 2: Black Pawn Forward Movement
**Setup:**
1. Place Black Pawn at B3 (Black at bottom)
2. Check valid moves

**Expected:**
- Pawn can move to B2 (up, away from Black)
- Pawn cannot move to B4 (toward Black)

**Verification:**
- [ ] Moves forward (up) 1 square
- [ ] Direction opposite of White pawn
- [ ] Cannot move backward

### Test 3: Pawn Diagonal Capture
**Setup:**
1. Place White Pawn at B2
2. Place Black Knight at A3
3. Place Black Bishop at C3

**Expected:**
- Pawn can capture at A3 or C3 (diagonal forward)
- Pawn cannot capture at B3 (straight forward)
- Move history shows: "♙ Pawn B2 × ♞ A3"

**Verification:**
- [ ] Can capture diagonally forward
- [ ] Cannot capture straight ahead
- [ ] Both diagonal directions work

### Test 4: Pawn Edge Reversal
**Setup:**
1. Place White Pawn at B3 (one move from edge)
2. Move to B4 (edge)
3. Check if pawn reversed

**Expected:**
- Pawn reaches B4 (bottom edge)
- Pawn direction reverses
- Next turn, pawn can move to B3 (back up)

**Verification:**
- [ ] Reversal triggers at edge (row 3 for White, row 0 for Black)
- [ ] Direction permanently reversed
- [ ] Can move in opposite direction after reversal

### Test 5: Pawn Blocked Movement
**Setup:**
1. Place White Pawn at B2
2. Place Black Rook at B3

**Expected:**
- Pawn cannot move to B3 (blocked)
- Pawn has no valid forward moves
- Pawn cannot capture at B3 (not diagonal)

**Verification:**
- [ ] Blocked by piece in front
- [ ] Cannot capture straight ahead
- [ ] No valid moves shown

---

## Integration Tests

### Test 1: Multiple Piece Types
**Setup:**
1. Place all 4 White pieces on board
2. Verify each can move according to their rules
3. Check move history shows correct notation

**Verification:**
- [ ] All pieces move independently
- [ ] No movement interference
- [ ] History notation correct for each type

### Test 2: Capture Chain
**Setup:**
1. Set up scenario where:
   - White Rook captures Black Pawn
   - Black Bishop captures White Rook
   - White Knight captures Black Bishop

**Verification:**
- [ ] All captures work correctly
- [ ] Captured pieces enter CAPTURED state
- [ ] History shows all captures with × notation
- [ ] Respawn works for captured pieces

### Test 3: Phase Transition
**Setup:**
1. Play through placement phase (6 moves)
2. Verify no movement/capture possible
3. Enter hybrid phase (ply 7)
4. Verify movement/capture now possible

**Verification:**
- [ ] Plies 1-6: Only placement allowed
- [ ] Ply 7+: All actions available
- [ ] Phase indicator updates correctly
- [ ] Move history reflects phase rules

---

## Known Issues to Watch For

### Rook Specific
- ❗ **Check:** Rook cannot move through pieces
- ❗ **Check:** Rook stops at first capture
- ❗ **Check:** All 4 directions (up/down/left/right) work

### Bishop Specific
- ❗ **Check:** Bishop cannot move straight
- ❗ **Check:** All 4 diagonals work correctly

### Knight Specific
- ❗ **Check:** Can jump over pieces
- ❗ **Check:** L-shape strictly enforced

### Pawn Specific
- ❗ **Check:** Direction correct based on player
- ❗ **Check:** Reversal works at edge
- ❗ **Check:** Cannot capture straight ahead

---

## How to Use This Document

1. **For each test:** Perform the setup steps
2. **Make the moves:** Try the expected actions
3. **Check move history:** Verify notation is correct
4. **Mark completion:** Check off verification items
5. **Report issues:** Note any discrepancies

## Debugging with Move History

The new move history feature shows:
- Move number (ply)
- Player icon (⚪/⚫)
- Piece symbol and name
- From/to positions in notation (e.g., A1 → B2)
- Captures marked with ×

**Use this to verify:**
- Positions are correct
- Piece types match
- Movement patterns make sense
- No impossible moves appear

---

## Quick Reference: Movement Patterns

```
Rook (R):    ↑ ↓ ← →
Bishop (B):  ↖ ↗ ↙ ↘
Knight (N):  L-shapes (2+1 or 1+2)
Pawn (P):    ↑ (forward 1, or ↓ if reversed)
             ↗ ↖ (diagonal captures)
```

## Board Notation

```
   A  B  C  D
4  □  □  □  □
3  □  □  □  □
2  □  □  □  □
1  □  □  □  □
```

Row 1 = top, Row 4 = bottom
Column A = left, Column D = right

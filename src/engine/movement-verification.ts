/**
 * Movement Verification Tests
 * Run these in browser console to verify piece movements
 * 
 * Usage:
 * import { runAllMovementTests } from './engine/movement-verification'
 * runAllMovementTests()
 */

import { getInitialState, applyAction, generateLegalActions } from './chess-ttt-engine';

function posToNotation(pos: number): string {
  const row = Math.floor(pos / 4);
  const col = pos % 4;
  return `${String.fromCharCode(65 + col)}${4 - row}`;
}

export function testRookMovement(): boolean {
  console.group('🔍 Testing Rook Movement');
  
  try {
    // Setup: Place White Rook at B2 (position 5)
    const state = getInitialState('W');
    
    // Skip to hybrid phase
    let current = state;
    current.ply = 7;
    
    // Place rook at B2 (position 5)
    const placeAction = { kind: 'PLACE' as const, pieceId: 'W_R' as const, to: 5 };
    current = applyAction(current, placeAction);
    console.log(`✓ Placed White Rook at ${posToNotation(5)}`);
    
    // Generate legal moves for the rook
    const actions = generateLegalActions(current);
    const rookMoves = actions.filter(a => a.pieceId === 'W_R');
    
    const destinations = rookMoves.map(a => a.to);
    const notations = destinations.map(posToNotation);
    
    console.log(`Rook can move to: ${notations.join(', ')}`);
    
    // Expected: Rook at B2 (position 5) should be able to move to:
    // - Horizontal: A2(4), C2(6), D2(7)
    // - Vertical: B1(1), B3(9), B4(13)
    const expected = [1, 4, 6, 7, 9, 13];
    const expectedNotations = expected.map(posToNotation);
    
    console.log(`Expected: ${expectedNotations.join(', ')}`);
    
    // Check if all expected moves are present
    const allPresent = expected.every(pos => destinations.includes(pos));
    const noExtra = destinations.every(pos => expected.includes(pos) || state.board[pos] !== null);
    
    if (allPresent && noExtra) {
      console.log('✅ Rook movement PASSED');
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Rook movement FAILED');
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.groupEnd();
    return false;
  }
}

export function testBishopMovement(): boolean {
  console.group('🔍 Testing Bishop Movement');
  
  try {
    const state = getInitialState('W');
    let current = state;
    current.ply = 7;
    
    // Place bishop at B2 (position 5)
    const placeAction = { kind: 'PLACE' as const, pieceId: 'W_B' as const, to: 5 };
    current = applyAction(current, placeAction);
    console.log(`✓ Placed White Bishop at ${posToNotation(5)}`);
    
    const actions = generateLegalActions(current);
    const bishopMoves = actions.filter(a => a.pieceId === 'W_B');
    
    const destinations = bishopMoves.map(a => a.to);
    const notations = destinations.map(posToNotation);
    
    console.log(`Bishop can move to: ${notations.join(', ')}`);
    
    // Expected: Bishop at B2 (position 5) diagonals:
    // - Up-left: A1(0)
    // - Up-right: C1(2), D2(3) - wait, D2 is horizontal from C2
    // Let me recalculate: B2 is row 1, col 1 (0-indexed)
    // Diagonals: (-1,-1) -> (0,0)=A1, (-1,+1) -> (0,2)=C1, (+1,-1) -> (2,0)=A3, (+1,+1) -> (2,2)=C3, (3,3)=D4
    const expected = [0, 2, 8, 10, 15]; // A1, C1, A3, C3, D4
    const expectedNotations = expected.map(posToNotation);
    
    console.log(`Expected: ${expectedNotations.join(', ')}`);
    
    const allPresent = expected.every(pos => destinations.includes(pos));
    
    if (allPresent) {
      console.log('✅ Bishop movement PASSED');
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Bishop movement FAILED');
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.groupEnd();
    return false;
  }
}

export function testKnightMovement(): boolean {
  console.group('🔍 Testing Knight Movement');
  
  try {
    const state = getInitialState('W');
    let current = state;
    current.ply = 7;
    
    // Place knight at B2 (position 5)
    const placeAction = { kind: 'PLACE' as const, pieceId: 'W_N' as const, to: 5 };
    current = applyAction(current, placeAction);
    console.log(`✓ Placed White Knight at ${posToNotation(5)}`);
    
    const actions = generateLegalActions(current);
    const knightMoves = actions.filter(a => a.pieceId === 'W_N');
    
    const destinations = knightMoves.map(a => a.to);
    const notations = destinations.map(posToNotation);
    
    console.log(`Knight can move to: ${notations.join(', ')}`);
    
    // Knight at B2 (row 1, col 1) L-shapes:
    // All 8 possible L-moves, checking bounds
    // Valid: A4(12), C4(14), D3(11), D1(3)
    const expected = [3, 11, 12, 14];
    const expectedNotations = expected.map(posToNotation);
    
    console.log(`Expected: ${expectedNotations.join(', ')}`);
    
    const allPresent = expected.every(pos => destinations.includes(pos));
    
    if (allPresent) {
      console.log('✅ Knight movement PASSED');
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Knight movement FAILED');
      console.log('Missing:', expected.filter(p => !destinations.includes(p)).map(posToNotation));
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.groupEnd();
    return false;
  }
}

export function testPawnMovement(): boolean {
  console.group('🔍 Testing Pawn Movement');
  
  try {
    const state = getInitialState('W');
    let current = state;
    current.ply = 7;
    
    // Place White pawn at B2 (position 5)
    const placeAction = { kind: 'PLACE' as const, pieceId: 'W_P' as const, to: 5 };
    current = applyAction(current, placeAction);
    console.log(`✓ Placed White Pawn at ${posToNotation(5)}`);
    
    const actions = generateLegalActions(current);
    const pawnMoves = actions.filter(a => a.pieceId === 'W_P');
    
    const destinations = pawnMoves.map(a => a.to);
    const notations = destinations.map(posToNotation);
    
    console.log(`Pawn can move to: ${notations.join(', ')}`);
    
    // White pawn at B2 moves DOWN (away from top)
    // Forward: B3 (position 9)
    // No diagonal captures without enemy pieces
    const expected = [9]; // B3
    const expectedNotations = expected.map(posToNotation);
    
    console.log(`Expected: ${expectedNotations.join(', ')}`);
    
    const allPresent = expected.every(pos => destinations.includes(pos));
    
    if (allPresent) {
      console.log('✅ Pawn movement PASSED');
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Pawn movement FAILED');
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.groupEnd();
    return false;
  }
}

export function runAllMovementTests(): void {
  console.log('🏁 Running Movement Verification Tests...\n');
  
  const results = {
    rook: testRookMovement(),
    bishop: testBishopMovement(),
    knight: testKnightMovement(),
    pawn: testPawnMovement(),
  };
  
  console.log('\n📊 Test Summary:');
  console.log(`Rook:   ${results.rook ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Bishop: ${results.bishop ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Knight: ${results.knight ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Pawn:   ${results.pawn ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ All tests PASSED' : '❌ Some tests FAILED'}`);
}

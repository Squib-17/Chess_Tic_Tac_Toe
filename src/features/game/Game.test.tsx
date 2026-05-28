import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Action } from '../../domain/game-engine/chess-ttt-engine';
import { Game } from './Game';
import { getBotMove } from '../ai/bot-controller';

vi.mock('react-confetti', () => ({
  default: () => null,
}));

vi.mock('../ai/bot-controller', () => ({
  getBotMove: vi.fn(),
}));

const mockedGetBotMove = vi.mocked(getBotMove);

async function place(pieceName: RegExp, squareName: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: pieceName }));
  await user.click(screen.getByRole('gridcell', { name: squareName }));
}

describe('Game UI', () => {
  beforeEach(() => {
    mockedGetBotMove.mockReset();
  });

  it('allows a local player to place a piece with accessible controls', async () => {
    render(<Game />);

    await place(/white pawn/i, /A4, empty, legal/i);

    expect(screen.getByRole('gridcell', { name: /A4, White Pawn/i })).toBeInTheDocument();
    expect(screen.getByText(/Placement Phase \(2\/6\)/i)).toBeInTheDocument();
  });

  it('shows and closes the winner dialog', async () => {
    const user = userEvent.setup();
    render(<Game />);

    await place(/white pawn/i, /A4, empty, legal/i);
    await place(/black pawn/i, /A3, empty, legal/i);
    await place(/white knight/i, /B4, empty, legal/i);
    await place(/black knight/i, /B3, empty, legal/i);
    await place(/white bishop/i, /C4, empty, legal/i);
    await place(/black bishop/i, /C3, empty, legal/i);
    await place(/white rook/i, /D4, empty, legal/i);

    expect(screen.getByRole('dialog', { name: /White Wins/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /White Wins/i })).not.toBeInTheDocument();
  });

  it('does not apply a stale bot move after reset', async () => {
    const user = userEvent.setup();
    let resolveStaleMove: (action: Action) => void = () => undefined;
    mockedGetBotMove.mockReturnValueOnce(
      new Promise<Action>((resolve) => {
        resolveStaleMove = resolve;
      }),
    );
    mockedGetBotMove.mockReturnValue(new Promise<Action>(() => undefined));

    render(<Game />);

    await user.click(screen.getByRole('button', { name: /vs Bot/i }));
    await user.selectOptions(screen.getByLabelText(/Bot plays as/i), 'W');

    expect(screen.getByText(/Thinking/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /New Game/i }));
    resolveStaleMove({ kind: 'PLACE', pieceId: 'W_P', to: 0 });

    await waitFor(() => {
      expect(screen.getByText(/Placement Phase \(1\/6\)/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('gridcell', { name: /A4, empty/i })).toBeInTheDocument();
  });

  it('shows multiplayer room controls and validates join input', async () => {
    const user = userEvent.setup();
    render(<Game />);

    await user.click(screen.getByRole('button', { name: /Online/i }));

    expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Room code/i)).toBeInTheDocument();
    expect(screen.getByText(/Create or join a room to start online play/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Join Room/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter a room code/i);
  });
});

import type { GameSession, RoomId } from '../src/shared/session';

export type RoomStore = {
  create(session: GameSession): void;
  get(roomId: RoomId): GameSession | undefined;
  update(session: GameSession): void;
  remove(roomId: RoomId): void;
  listActiveRooms(): GameSession[];
  removeInactiveRooms(now: number, maxInactiveMs: number): RoomId[];
};

export class InMemoryRoomStore implements RoomStore {
  private readonly rooms = new Map<RoomId, GameSession>();

  create(session: GameSession): void {
    this.rooms.set(session.roomId, session);
  }

  get(roomId: RoomId): GameSession | undefined {
    return this.rooms.get(roomId);
  }

  update(session: GameSession): void {
    this.rooms.set(session.roomId, session);
  }

  remove(roomId: RoomId): void {
    this.rooms.delete(roomId);
  }

  listActiveRooms(): GameSession[] {
    return [...this.rooms.values()];
  }

  removeInactiveRooms(now: number, maxInactiveMs: number): RoomId[] {
    const removed: RoomId[] = [];

    for (const [roomId, session] of this.rooms) {
      if (now - session.updatedAt > maxInactiveMs) {
        this.rooms.delete(roomId);
        removed.push(roomId);
      }
    }

    return removed;
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Action } from '../../../domain/game-engine/chess-ttt-engine';
import type {
  ClientId,
  ClientMessage,
  PublicGameSession,
  RoomId,
  ServerMessage,
  SessionRole,
} from '../../../shared/session';

export type MultiplayerStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

const SERVER_URL = import.meta.env.VITE_MULTIPLAYER_URL ?? 'ws://localhost:8787';
const CLIENT_ID_KEY = 'chess-ttt-client-id';

function getStoredClientId(): ClientId {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
}

export function useMultiplayerRoom() {
  const clientId = useMemo(() => getStoredClientId(), []);
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<MultiplayerStatus>('idle');
  const [roomId, setRoomId] = useState<RoomId | null>(null);
  const [role, setRole] = useState<SessionRole | null>(null);
  const [session, setSession] = useState<PublicGameSession | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setLastError('Multiplayer server is not connected.');
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const connect = useCallback(() => {
    const existing = socketRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
    ) {
      return existing;
    }

    setStatus('connecting');
    setLastError(null);

    const socket = new WebSocket(SERVER_URL);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setStatus('connected');
    });

    socket.addEventListener('close', () => {
      setStatus('disconnected');
    });

    socket.addEventListener('error', () => {
      setStatus('error');
      setLastError('Unable to connect to the multiplayer server.');
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data as string) as ServerMessage;

      switch (message.type) {
        case 'room_created':
        case 'room_joined':
          setRoomId(message.roomId);
          setRole(message.role);
          setSession(message.session);
          setLastError(null);
          break;
        case 'room_state':
        case 'action_accepted':
          setRoomId(message.roomId);
          setSession(message.session);
          setLastError(null);
          break;
        case 'action_rejected':
          if (message.session) setSession(message.session);
          setLastError(message.reason);
          break;
        case 'player_disconnected':
          setSession(message.session);
          setLastError(`${message.role === 'spectator' ? 'A spectator' : `${message.role} player`} disconnected.`);
          break;
        case 'error':
          setLastError(message.message);
          break;
        case 'pong':
          break;
      }
    });

    return socket;
  }, []);

  const createRoom = useCallback(() => {
    const socket = connect();
    socket.addEventListener('open', () => {
      send({ type: 'create_room', clientId });
    }, { once: true });

    if (socket.readyState === WebSocket.OPEN) {
      send({ type: 'create_room', clientId });
    }
  }, [clientId, connect, send]);

  const joinRoom = useCallback((targetRoomId: string) => {
    const normalizedRoomId = targetRoomId.trim().toUpperCase();
    if (!normalizedRoomId) {
      setLastError('Enter a room code to join.');
      return;
    }

    const socket = connect();
    socket.addEventListener('open', () => {
      send({ type: 'join_room', roomId: normalizedRoomId, clientId });
    }, { once: true });

    if (socket.readyState === WebSocket.OPEN) {
      send({ type: 'join_room', roomId: normalizedRoomId, clientId });
    }
  }, [clientId, connect, send]);

  const reconnectRoom = useCallback(() => {
    if (!roomId) {
      setLastError('No room to reconnect to.');
      return;
    }

    joinRoom(roomId);
  }, [joinRoom, roomId]);

  const leaveRoom = useCallback(() => {
    if (roomId) {
      send({ type: 'leave_room', roomId });
    }
    setRoomId(null);
    setRole(null);
    setSession(null);
    setLastError(null);
  }, [roomId, send]);

  const submitNetworkAction = useCallback((action: Action) => {
    if (!roomId) {
      setLastError('Create or join a room before moving.');
      return false;
    }

    return send({ type: 'submit_action', roomId, action });
  }, [roomId, send]);

  useEffect(() => () => {
    socketRef.current?.close();
  }, []);

  return {
    clientId,
    createRoom,
    joinRoom,
    lastError,
    leaveRoom,
    reconnectRoom,
    role,
    roomId,
    session,
    status,
    submitNetworkAction,
  };
}

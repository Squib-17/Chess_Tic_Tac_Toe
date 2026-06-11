import { startMultiplayerServer, readAllowedOriginsFromEnv } from './multiplayer-server';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';
const allowedOrigins = readAllowedOriginsFromEnv();

const server = startMultiplayerServer({
  port,
  host,
  allowedOrigins,
});

server.httpServer.on('listening', () => {
  console.log(`Chess TTT health check: http://${host}:${port}/health`);
  console.log(
    `Chess TTT multiplayer WebSocket: ws://${host}:${port}${
      allowedOrigins?.length ? ` (origins: ${allowedOrigins.join(', ')})` : ''
    }`,
  );
});

function shutdown(): void {
  void server.close().then(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

import { startMultiplayerServer } from './multiplayer-server';

const port = Number(process.env.PORT ?? 8787);

startMultiplayerServer({ port });

console.log(`Chess TTT multiplayer server listening on ws://localhost:${port}`);

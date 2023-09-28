import shortid from 'shortid';
import * as sockets from '../lib/sockets';
import redis from './redis';
import logs from './logging';

const subscriber: any = redis.client.duplicate();  // You might want to replace `any` with the correct type if available.

let gameServerPorts: number[] = [];
let servers: { [key: number]: any } = {};  // Adjust the `any` type to match the socket type.
let waiting: { [key: string]: { resolve: (value?: any) => void, reject: (reason?: any) => void } } = {};

(async function initialize() {
    try {
        gameServerPorts = await redis.getAllGameServerPorts();

        for (let port of gameServerPorts) {
            establishGameConn(port);
        }

        subscriber.subscribe('gamePorts', 'deprecate');
        subscriber.on('message', (chan: string, port: number) => {
            if (chan === 'gamePorts') establishGameConn(port);
            else if (chan === 'deprecate') deprecateServer(port);
        });
    } catch (e) {
        logs.logger.error(e);
    }
})();

function establishGameConn(port: number): void {
    if (servers[port]) servers[port].terminate();

    let socket = new sockets.ClientSocket(`ws://localhost:${port}`, true);
    servers[port] = socket;

    socket.on("connected", () => {
        socket.send("authAsServer", process.env.LOAD_BALANCER_KEY);
    });

    socket.on("gameCreated", (gameId) => {
        const gameResults = waiting[gameId];
        if (!gameResults) return;

        delete waiting[gameId];
        gameResults.resolve(gameId);
    });

    socket.on("gameCreateError", (info) => {
        const gameResults = waiting[info.gameId];
        if (!gameResults) return;

        delete waiting[info.gameId];
        gameResults.reject(new Error(info.error));
    });

    socket.on("gameLeft", (userId) => {
        const leaveResults = waiting[userId];
        if (!leaveResults) return;

        delete waiting[userId];
        leaveResults.resolve();
    });

    socket.on("gameLeaveError", (info) => {
        const leaveResults = waiting[info.userId];
        if (!leaveResults) return;

        delete waiting[info.userId];
        leaveResults.reject(new Error(info.error));
    });
}

function createGame(hostId: string, gameType: string, settings: any): Promise<string> {
    return new Promise(async (res, rej) => {
        try {
            const gameId = shortid.generate();
            var portForNextGame = await redis.getNextGameServerPort();

            if (
                portForNextGame === NaN ||
                portForNextGame === null ||
                portForNextGame === undefined
            ) {
                portForNextGame = Number(3010);
            }

            waiting[gameId] = {
                resolve: res,
                reject: rej,
            };

            servers[portForNextGame].send("createGame", {
                gameId: gameId,
                key: process.env.LOAD_BALANCER_KEY,
                hostId: hostId,
                gameType: gameType,
                settings: settings,
            });

            setTimeout(() => {
                if (!waiting[gameId]) return;

                rej(new Error("Timeout creating game on game server"));
                delete waiting[gameId];
            }, Number(process.env.GAME_CREATION_TIMEOUT));
        } catch (e) {
            logs.logger.error(e);
            rej(e);
        }
    });
}

async function leaveGame(userId: string): Promise<void> {
    return new Promise(async (res, rej) => {
        try {
            const gameId = await redis.inGame(userId);

            if (!gameId) {
                res();
                return;
            }

            const port = await redis.getGamePort(gameId);

            if (!port) {
                res();
                return;
            }

            waiting[userId] = {
                resolve: res,
                reject: rej,
            };

            try {
                servers[port].send("leaveGame", {
                    userId: userId,
                    key: process.env.LOAD_BALANCER_KEY,
                });
            } catch (e) {
                rej(e);
            }
        } catch (e) {
            logs.logger.error(e);
            rej(e);
        }
    });
}

async function cancelGame(userId: string, gameId: string): Promise<void> {
    return new Promise(async (res, rej) => {
        try {
            const port = await redis.getGamePort(gameId);

            waiting[userId] = {
                resolve: res,
                reject: rej,
            };

            servers[port].send("cancelGame", {
                gameId: gameId,
                userId: userId,
                key: process.env.LOAD_BALANCER_KEY,
            });
        } catch (e) {
            logs.logger.error(e);
            rej(e);
        }
    });
}

async function deprecateServer(port: number): Promise<void> {
    await redis.removeGameServer(port);
    servers[port].send("deprecated", {
        key: process.env.LOAD_BALANCER_KEY,
    });
}

export {
    createGame,
    leaveGame,
    cancelGame,
    deprecateServer
};

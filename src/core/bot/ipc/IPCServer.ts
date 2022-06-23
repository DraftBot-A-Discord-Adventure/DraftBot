import {IPC} from "node-ipc";
import RootIPC = require("node-ipc");

const spamDelay = 1000;

// The limitTimestamp is the date when the blocking is finished
const blockedPlayers: Map<string, { reason: string, limitTimestamp: number }[]> = new Map();
const spamPlayers: Map<string, number> = new Map();

export const startIPCServer = (): void => {
	let ipc: InstanceType<typeof IPC> = null;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ipc = new RootIPC.IPCModule();
	ipc.config.id = "draftbot";
	ipc.config.retry = 1500;
	ipc.config.silent = true; // You can set this to false in order to debug, it's very useful

	ipc.serve(
		function() {
			ipc.server.on(
				"block",
				function(data) {
					if (!blockedPlayers.get(data.discordId)) {
						blockedPlayers.set(data.discordId, []);
					}
					blockedPlayers.get(data.discordId).push({
						reason: data.reason,
						limitTimestamp: data.time !== 0 ? Date.now() + data.time : 0
					});
				}
			);
			ipc.server.on(
				"unblock",
				function(data) {
					const arrayOfPlayer = blockedPlayers.get(data.discordId);
					arrayOfPlayer.splice(arrayOfPlayer.indexOf(data.reason));
					if (arrayOfPlayer.length === 0) {
						blockedPlayers.delete(data.discordId);
					}
				}
			);
			ipc.server.on(
				"isBlocked",
				function(data, socket) {
					const blockedPlayer = blockedPlayers.get(data.discordId);
					const response = [];
					if (blockedPlayer) {
						for (const block of blockedPlayer) {
							if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
								blockedPlayers.delete(data.discordId);
							}
							else {
								response.push(block.reason);
							}
						}
					}
					ipc.server.emit(socket, "isBlocked", {
						packet: data.packet,
						reason: response
					});
				}
			);
			ipc.server.on(
				"spam",
				function(data) {
					spamPlayers.set(data.discordId, Date.now() + spamDelay);
				}
			);
			ipc.server.on(
				"isSpamming",
				function(data, socket) {
					const spamPlayerLimitTimestamp: number | undefined = spamPlayers.get(data.discordId);
					let response = false;
					if (spamPlayerLimitTimestamp) {
						if (spamPlayerLimitTimestamp < Date.now()) {
							spamPlayers.delete(data.discordId);
						}
						else {
							response = true;
						}
					}
					ipc.server.emit(socket, "isSpamming", {
						packet: data.packet,
						spamming: response
					});
				}
			);
			ipc.server.on(
				"socket.connected",
				function(socket, socketID) {
					ipc.log("client " + socketID + " has connected!");
				}
			);
			ipc.server.on(
				"socket.disconnected",
				function(socket, destroyedSocketID) {
					ipc.log("client " + destroyedSocketID + " has disconnected!");
				}
			);
		}
	);

	ipc.server.start();
};
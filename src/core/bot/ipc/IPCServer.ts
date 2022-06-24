import {IPC} from "node-ipc";
import RootIPC = require("node-ipc");

const spamDelay = 1000;

// The limitTimestamp is the date when the blocking is finished
const blockedPlayers: Map<string, { reason: string, limitTimestamp: number }[]> = new Map();
const spamPlayers: Map<string, number> = new Map();

/**
 * Remove the specified block reason from the given user
 * @param discordId
 * @param reason
 */
function removeBlockedReason(discordId: string, reason: string) {
	blockedPlayers.set(discordId, blockedPlayers.get(discordId).filter(v => v.reason !== reason));
	if (blockedPlayers.get(discordId).length === 0) {
		blockedPlayers.delete(discordId);
	}
}

/**
 * Answer to call when you want to block a player from doing another command
 * @param ipc
 */
function prepareBlockAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"block",
		function(data: { discordId: string; reason: string; time: number; }) {
			if (!blockedPlayers.get(data.discordId)) {
				blockedPlayers.set(data.discordId, []);
			}
			blockedPlayers.get(data.discordId).push({
				reason: data.reason,
				limitTimestamp: data.time !== 0 ? Date.now() + data.time : 0
			});
		}
	);
}

/**
 * Answer to call when you want to unblock a player
 * @param ipc
 */
function prepareUnblockAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"unblock",
		function(data: { discordId: string; reason: string; }) {
			removeBlockedReason(data.discordId, data.reason);
		}
	);
}

/**
 * Get the reasons for why the player is blocked, if exists
 * @param ipc
 */
function prepareIsBlockedAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"isBlocked",
		function(data: { discordId: string; packet: number; }, socket: unknown) {
			const blockedPlayer = blockedPlayers.get(data.discordId);
			const response = [];
			if (blockedPlayer) {
				for (const block of blockedPlayer) {
					if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
						removeBlockedReason(data.discordId, block.reason);
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
}

/**
 * Save when the last command has been entered, to avoid spam
 * @param ipc
 */
function prepareSpamAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"spam",
		function(data: { discordId: string; }) {
			spamPlayers.set(data.discordId, Date.now() + spamDelay);
		}
	);
}

/**
 * Check if the player is spamming
 * @param ipc
 */
function prepareIsSpammingAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"isSpamming",
		function(data: { discordId: string; packet: number; }, socket: unknown) {
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
}

/**
 * Socket connexion
 * @param ipc
 */
function prepareConnexionSocketAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"socket.connected",
		function(socket: unknown, socketID: string) {
			ipc.log("client " + socketID + " has connected!");
		}
	);
}

/**
 * Socket deconnexion
 * @param ipc
 */
function prepareDeconnexionSocketAnswer(ipc: InstanceType<typeof IPC>) {
	ipc.server.on(
		"socket.disconnected",
		function(socket: unknown, destroyedSocketID: string) {
			ipc.log("client " + destroyedSocketID + " has disconnected!");
		}
	);
}

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
			prepareBlockAnswer(ipc);
			prepareUnblockAnswer(ipc);
			prepareIsBlockedAnswer(ipc);
			prepareSpamAnswer(ipc);
			prepareIsSpammingAnswer(ipc);
			prepareConnexionSocketAnswer(ipc);
			prepareDeconnexionSocketAnswer(ipc);
		}
	);

	ipc.server.start();
};
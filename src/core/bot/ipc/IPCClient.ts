import RootIPC = require("node-ipc");
import {IPC} from "node-ipc";

// We need to use InstanceType because IPC is not exported
let ipc: InstanceType<typeof IPC> = null;
// We do not add extra steps which puts it back to 0 because we have 10^15 possibilities, we'll die before it reaches this
// The requestCount is used for packet ids
let requestCount = 0;

/*
 * This client sends a message to the server, but it cannot wait for an answer.
 * The solution is to store a callback associated with a packet id and when the server emits an answer with the same packet id we can call the callback
 */
const blockCallbacks: Map<number, (reason: string) => void> = new Map();
const spamCallbacks: Map<number, (spamming: boolean) => void> = new Map();

export class IPCClient {
	static connectToIPCServer(shardId: number) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		ipc = new RootIPC.IPCModule();
		ipc.config.id = "draftbot" + shardId;
		ipc.config.retry = 1500;
		ipc.config.silent = true; // You can set this to false in order to debug, it's very useful

		ipc.connectTo("draftbot", function() {
			ipc.of.draftbot.on(
				"connect",
				function() {
					console.log("## Shard " + shardId + " connected to draftbot IPC ##");
				}
			);
			ipc.of.draftbot.on(
				"disconnect",
				function() {
					// Clear the queue. Should not be called but it is in prevention
					blockCallbacks.forEach((value) => {
						value(null);
					});
					blockCallbacks.clear();
					spamCallbacks.forEach((value) => {
						value(false);
					});
					spamCallbacks.clear();
					console.log("Shard " + shardId + " disconnected from draftbot IPC");
				}
			);
			ipc.of.draftbot.on(
				"isBlocked",
				function(data) {
					// Get the callback, delete it from the map and call the callback
					const callback = blockCallbacks.get(data.packet);
					blockCallbacks.delete(data.packet);
					callback(data.reason ?? null);
				}
			);
			ipc.of.draftbot.on(
				"isSpamming",
				function(data) {
					// Get the callback, delete it from the map and call the callback
					const callback = spamCallbacks.get(data.packet);
					spamCallbacks.delete(data.packet);
					callback(data.spamming);
				}
			);
		});
	}

	static ipcBlockPlayer(discordId: string, reason: string, time = 0) {
		ipc.of.draftbot.emit("block", {discordId, reason, time});
	}

	static ipcUnblockPlayer(discordId: string) {
		ipc.of.draftbot.emit("unblock", {discordId});
	}

	static ipcGetBlockedPlayerReason(discordId: string): Promise<string> {
		return new Promise(resolve => {
			blockCallbacks.set(requestCount, (reason) => resolve(reason));
			ipc.of.draftbot.emit("isBlocked", {packet: requestCount, discordId});
			requestCount++;
		});
	}

	static ipcSpamBlockPlayer(discordId: string) {
		ipc.of.draftbot.emit("spam", {discordId});
	}

	static ipcIsPlayerSpamming(discordId: string): Promise<boolean> {
		return new Promise(resolve => {
			spamCallbacks.set(requestCount, (spamming) => resolve(spamming));
			ipc.of.draftbot.emit("isSpamming", {packet: requestCount, discordId});
			requestCount++;
		});
	}
}
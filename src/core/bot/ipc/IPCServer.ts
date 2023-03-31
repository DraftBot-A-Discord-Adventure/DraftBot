const NodeIPC = require("node-ipc");
import {Socket} from "net";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class IPCServer extends NodeIPC.IPCModule {
	private static spamDelay = 1000;

	// The limitTimestamp is the date when the blocking is finished
	private blockedPlayers: Map<string, { reason: string, limitTimestamp: number }[]> = new Map();

	private spamPlayers: Map<string, number> = new Map();

	/**
	 * Get the count of blocked players
	 */
	public getBlockedPlayersCount(): number {
		let count = 0;
		const now = Date.now();
		for (const blockedPlayer of this.blockedPlayers.entries()) {
			for (const block of blockedPlayer[1]) {
				if (block.limitTimestamp === 0 || block.limitTimestamp > now) {
					count++;
					break;
				}
			}
		}
		return count;
	}

	/**
	 * Remove the specified block reason from the given user
	 * @param discordId
	 * @param reason
	 */
	public removeBlockedReason(discordId: string, reason: string): void {
		const blockedPlayer = this.blockedPlayers.get(discordId);
		if (blockedPlayer) {
			this.blockedPlayers.set(discordId, blockedPlayer.filter(v => v.reason !== reason));
			if (this.blockedPlayers.get(discordId).length === 0) {
				this.blockedPlayers.delete(discordId);
			}
		}
	}

	/**
	 * Answer to call when you want to block a player from doing another command
	 */
	public prepareBlockAnswer(): void {
		this.server.on(
			"block",
			(data: { discordId: string; reason: string; time: number; }) => {
				if (!this.blockedPlayers.get(data.discordId)) {
					this.blockedPlayers.set(data.discordId, []);
				}
				this.blockedPlayers.get(data.discordId).push({
					reason: data.reason,
					limitTimestamp: data.time !== 0 ? Date.now() + data.time : 0
				});
			}
		);
	}

	/**
	 * Answer to call when you want to unblock a player
	 */
	public prepareUnblockAnswer(): void {
		this.server.on(
			"unblock",
			(data: { discordId: string; reason: string; }) => {
				this.removeBlockedReason(data.discordId, data.reason);
			}
		);
	}

	/**
	 * Get the reasons for why the player is blocked, if exists
	 */
	public prepareIsBlockedAnswer(): void {
		this.server.on(
			"isBlocked",
			(data: { discordId: string; packet: number; }, socket: Socket) => {
				const blockedPlayer = this.blockedPlayers.get(data.discordId);
				const response = [];
				if (blockedPlayer) {
					for (const block of blockedPlayer) {
						if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
							this.removeBlockedReason(data.discordId, block.reason);
						}
						else {
							response.push(block.reason);
						}
					}
				}
				this.server.emit(socket, "isBlocked", {
					packet: data.packet,
					reason: response
				});
			}
		);
	}

	/**
	 * Save when the last command has been entered, to avoid spam
	 */
	public prepareSpamAnswer(): void {
		this.server.on(
			"spam",
			(data: { discordId: string; }) => {
				this.spamPlayers.set(data.discordId, Date.now() + IPCServer.spamDelay);
			}
		);
	}

	/**
	 * Check if the player is spamming
	 */
	public prepareIsSpammingAnswer(): void {
		this.server.on("isSpamming",
			(data: { discordId: string; packet: number; }, socket: Socket) => {
				const spamPlayerLimitTimestamp = this.spamPlayers.get(data.discordId);
				let response = false;
				if (spamPlayerLimitTimestamp) {
					if (spamPlayerLimitTimestamp < Date.now()) {
						this.spamPlayers.delete(data.discordId);
					}
					else {
						response = true;
					}
				}
				this.server.emit(socket, "isSpamming", {
					packet: data.packet,
					spamming: response
				});
			}
		);
	}

	/**
	 * Socket connection
	 */
	public prepareConnexionSocketAnswer(): void {
		this.server.on(
			"socket.connected",
			(socket: unknown, socketID: string) => {
				this.log(`client ${socketID} has connected!`);
			}
		);
	}

	/**
	 * Socket disconnection
	 */
	public prepareDisconnectionSocketAnswer(): void {
		this.server.on(
			"socket.disconnected",
			(socket: unknown, destroyedSocketID: string) => {
				this.log(`client ${destroyedSocketID} has disconnected!`);
			}
		);
	}

	/**
	 * Maintenance command
	 */
	public prepareMaintenanceCommand(): void {
		this.server.on(
			"maintenanceCommand",
			(data: { enable: boolean }) => {
				this.broadcastMaintenance(data.enable, true);
			}
		);
	}

	/**
	 * Ask for maintenance
	 * @param enable
	 */
	public broadcastMaintenance(enable: boolean, fromCommand: boolean): void {
		this.server.broadcast("maintenance", {
			enable,
			fromCommand
		});
	}

	/**
	 * Starts the IPC server
	 */
	constructor() {
		super();

		this.config.id = "draftbot";
		this.config.retry = 1500;
		this.config.silent = true; // You can set this to false in order to debug, it's very useful

		this.serve(
			() => {
				this.prepareBlockAnswer();
				this.prepareUnblockAnswer();
				this.prepareIsBlockedAnswer();
				this.prepareSpamAnswer();
				this.prepareIsSpammingAnswer();
				this.prepareConnexionSocketAnswer();
				this.prepareDisconnectionSocketAnswer();
				this.prepareMaintenanceCommand();
			}
		);

		this.server.start();
	}
}
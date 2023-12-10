import {DraftBotConfig} from "./DraftBotConfig";
import {PacketListenerServer} from "../../../../Lib/src/packets/PacketListener";
import pingCommand from "../../commands/player/PingCommand";
import {GameDatabase} from "../database/game/GameDatabase";
import {LogsDatabase} from "../database/logs/LogsDatabase";
import {ReactionCollectorReactPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ReactionCollector} from "../utils/ReactionsCollector";
import {CommandPingPacketReq} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {CommandRarityPacketReq} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {CommandVotePacketReq} from "../../../../Lib/src/packets/commands/CommandVotePacket";
import {CommandBadgePacketReq} from "../../../../Lib/src/packets/commands/CommandBadgePacket";
import rarityCommand from "../../commands/player/RarityCommand";
import voteCommand from "../../commands/player/VoteCommand";
import badgeCommand from "../../commands/player/BadgeCommand";

export class DraftBot {
	public readonly packetListener: PacketListenerServer;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	private config: DraftBotConfig;

	constructor(config: DraftBotConfig) {
		this.config = config;

		// Register commands
		this.packetListener = new PacketListenerServer();
		this.packetListener.addPacketListener<CommandPingPacketReq>(CommandPingPacketReq, pingCommand);
		this.packetListener.addPacketListener<CommandRarityPacketReq>(CommandRarityPacketReq, rarityCommand);
		this.packetListener.addPacketListener<CommandVotePacketReq>(CommandVotePacketReq, voteCommand);
		this.packetListener.addPacketListener<CommandBadgePacketReq>(CommandBadgePacketReq, badgeCommand);
		this.packetListener.addPacketListener<ReactionCollectorReactPacket>(ReactionCollectorReactPacket, ReactionCollector.reactPacket);

		// Databases
		this.gameDatabase = new GameDatabase();
		this.logsDatabase = new LogsDatabase();
	}

	async init(): Promise<void> {
		await this.gameDatabase.init();
		await this.logsDatabase.init();
	}
}
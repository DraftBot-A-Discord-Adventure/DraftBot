import {DraftBotConfig} from "./DraftBotConfig";
import {PacketListener} from "../../../../Lib/src/packets/PacketListener";
import {pingCommand} from "../../commands/player/PingCommand";
import {GameDatabase} from "../database/game/GameDatabase";
import {LogsDatabase} from "../database/logs/LogsDatabase";
import {ReactionCollectorReactPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ReactionCollector} from "../utils/ReactionsCollector";
import {CommandPingPacketReq} from "../../../../Lib/src/packets/commands/CommandPingPacket";

export class DraftBot {
	public readonly packetListener: PacketListener;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	private config: DraftBotConfig;

	constructor(config: DraftBotConfig) {
		this.config = config;

		// Register commands
		this.packetListener = new PacketListener();
		this.packetListener.addPacketListener<CommandPingPacketReq>("CommandPingPacketReq", pingCommand);
		this.packetListener.addPacketListener<ReactionCollectorReactPacket>("ReactionCollectorReactPacket", ReactionCollector.reactPacket);

		// Databases
		this.gameDatabase = new GameDatabase();
		this.logsDatabase = new LogsDatabase();
	}

	async init(): Promise<void> {
		await this.gameDatabase.init();
		await this.logsDatabase.init();
	}
}
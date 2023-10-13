import {DraftBotConfig} from "./DraftBotConfig";
import {CommandPingPacketReq, PacketListener} from "draftbot_lib";
import {pingCommand} from "../../commands/player/PingCommand";
import {GameDatabase} from "../database/game/GameDatabase";
import {LogsDatabase} from "../database/logs/LogsDatabase";

export class DraftBot {
    private config: DraftBotConfig;

    public readonly packetListener: PacketListener;

    public readonly gameDatabase: GameDatabase;

    public readonly logsDatabase: LogsDatabase;

    constructor(config: DraftBotConfig) {
        this.config = config;

        // Register commands
        this.packetListener = new PacketListener();
        this.packetListener.addPacketListener<CommandPingPacketReq>("CommandPingPacketReq", pingCommand)

        // Databases
        this.gameDatabase = new GameDatabase();
        this.logsDatabase = new LogsDatabase();
    }

    async init(): Promise<void> {
        await this.gameDatabase.init();
        await this.logsDatabase.init();
    }
}
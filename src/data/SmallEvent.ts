import {DataController} from "./DataController";
import {Data} from "./Data";
import {readdirSync} from "fs";
import Player from "../core/database/game/models/Player";
import {WebsocketClient} from "../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket} from "../../../Lib/src/packets/DraftBotPacket";
import {SmallEventPacket} from "../../../Lib/src/packets/commands/CommandReportPacket";

export class SmallEvent extends Data<string> {

	public canBeExecuted(player: Player): Promise<boolean> {
		const smallEventFunction = SmallEventDataController.getSmallEventFunction(this.id);
		return smallEventFunction.canBeExecuted(player) as Promise<boolean>;
	}

	public async execute(client: WebsocketClient, response: DraftBotPacket[], player: Player): Promise<void> {
		const smallEventFunction = SmallEventDataController.getSmallEventFunction(this.id);
		response.push(makePacket<SmallEventPacket>({smallEvent: this.id}));
		await smallEventFunction.executeSmallEvent(client, response, player);
	}
}

export type CanBeExecutedLike = (player: Player) => boolean | Promise<boolean>;
export type ExecuteSmallEventLike = (client: WebsocketClient, response: DraftBotPacket[], player: Player) => void | Promise<void>;

export type SmallEventFuncs = {
	canBeExecuted: CanBeExecutedLike;
	executeSmallEvent: ExecuteSmallEventLike;
}

export class SmallEventDataController extends DataController<string, SmallEvent> {
	static readonly instance: SmallEventDataController = new SmallEventDataController("fightactions");

	private static smallEventsFunctionsCache: Map<string, SmallEventFuncs>;

	public static getSmallEventFunction(id: string): SmallEventFuncs {
		if (SmallEventDataController.smallEventsFunctionsCache === null) {
			SmallEventDataController.smallEventsFunctionsCache = new Map<string, SmallEventFuncs>();
			SmallEventDataController.loadSmallEventsFromFolder("dist/src/core/smallEvents", "TODO replace with the right one");
		}

		return SmallEventDataController.smallEventsFunctionsCache.get(id);
	}

	private static loadSmallEventsFromFolder(path: string, relativePath: string): void {
		const files = readdirSync(path);
		for (const file of files) {
			if (file.endsWith(".js")) {
				const smallEventFile = require(`${relativePath}/${file.substring(0, file.length - 3)}`);
				SmallEventDataController.smallEventsFunctionsCache.set(
					file.substring(0, file.length - 3),
					smallEventFile as SmallEventFuncs
				);
			}
		}
	}

	newInstance(): SmallEvent {
		return new SmallEvent();
	}
}
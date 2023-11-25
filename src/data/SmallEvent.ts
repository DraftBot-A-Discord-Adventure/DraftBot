import {DataController} from "./DataController";
import {Data} from "./Data";
import {readdirSync} from "fs";
import Player from "../core/database/game/models/Player";
import {WebsocketClient} from "../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket} from "../../../Lib/src/packets/DraftBotPacket";
import {SmallEventPacket} from "../../../Lib/src/packets/commands/CommandReportPacket";

export class SmallEvent extends Data<string> {
	private readonly properties: { [key: string]: unknown };

	async execute(response: DraftBotPacket[], player: Player, client: WebsocketClient): Promise<void> {
		const smallEventFunction = SmallEventDataController.getSmallEventFunction(this.id);
		response.push(makePacket<SmallEventPacket>({smallEvent: this.id}));
		await smallEventFunction.executeSmallEvent(response, player, client);
	}

	getProperties<T>(): T {
		return <T> this.properties;
	}
}

type CanBeExecutedLike = (player: Player) => boolean | Promise<boolean>;
type ExecuteSmallEventLike = (response: DraftBotPacket[], player: Player, client: WebsocketClient) => void | Promise<void>;

export type SmallEventFuncs = {
	canBeExecuted: CanBeExecutedLike;
	executeSmallEvent: ExecuteSmallEventLike;
}

export class SmallEventDataController extends DataController<string, SmallEvent> {
	static readonly instance: SmallEventDataController = new SmallEventDataController("smallEvents");

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
				const smallEventFuncs = (<{smallEventFuncs: SmallEventFuncs}>require(`${relativePath}/${file.substring(0, file.length - 3)}`)).smallEventFuncs;
				SmallEventDataController.smallEventsFunctionsCache.set(
					file.substring(0, file.length - 3),
					smallEventFuncs
				);
			}
		}
	}

	newInstance(): SmallEvent {
		return new SmallEvent();
	}
}
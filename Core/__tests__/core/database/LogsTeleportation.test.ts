import {
	beforeEach, describe, expect, it, vi
} from "vitest";

import { LogsDatabase } from "../../../src/core/database/logs/LogsDatabase";
import { MapLinkDataController } from "../../../src/data/MapLink";
import { LogsMapLinks } from "../../../src/core/database/logs/models/LogsMapLinks";
import { LogsPlayersTeleportations } from "../../../src/core/database/logs/models/LogsPlayersTeleportations";

const LOG_PLAYER_ID = 42;

const GAME_ORIGIN_MAP_LINK_ID = 1000;
const GAME_NEW_MAP_LINK_ID = 2000;
const LOGS_ORIGIN_MAP_LINK_ID = 5;
const LOGS_NEW_MAP_LINK_ID = 9;

const GAME_MAP_LINKS: Record<number, { startMap: number; endMap: number }> = {
	[GAME_ORIGIN_MAP_LINK_ID]: {
		startMap: 1, endMap: 2
	},
	[GAME_NEW_MAP_LINK_ID]: {
		startMap: 3, endMap: 4
	}
};

describe("LogsDatabase teleportation", () => {
	const logs = Object.create(LogsDatabase.prototype) as LogsDatabase;

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(LogsDatabase, "findOrCreatePlayer").mockResolvedValue({ id: LOG_PLAYER_ID } as never);
		vi.spyOn(MapLinkDataController.instance, "getById").mockImplementation(id => GAME_MAP_LINKS[id] as never);
		vi.spyOn(LogsMapLinks, "findOrCreate").mockImplementation((async (options: { where: { start: number } }) => [{ id: options.where.start === GAME_MAP_LINKS[GAME_ORIGIN_MAP_LINK_ID].startMap ? LOGS_ORIGIN_MAP_LINK_ID : LOGS_NEW_MAP_LINK_ID }, true ]) as never);
		vi.spyOn(LogsPlayersTeleportations, "create").mockResolvedValue({} as never);
	});

	it("stores the logs map link ids instead of the game ones", async () => {
		await logs.logTeleportation("player-keycloak-id", GAME_ORIGIN_MAP_LINK_ID, GAME_NEW_MAP_LINK_ID);

		expect(LogsMapLinks.findOrCreate).toHaveBeenCalledWith({ where: { start: 1, end: 2 } });
		expect(LogsMapLinks.findOrCreate).toHaveBeenCalledWith({ where: { start: 3, end: 4 } });
		expect(LogsPlayersTeleportations.create).toHaveBeenCalledWith(expect.objectContaining({
			playerId: LOG_PLAYER_ID,
			originMapLinkId: LOGS_ORIGIN_MAP_LINK_ID,
			newMapLinkId: LOGS_NEW_MAP_LINK_ID
		}));
	});

	it("does not log anything when a game map link is unknown", async () => {
		await logs.logTeleportation("player-keycloak-id", GAME_ORIGIN_MAP_LINK_ID, 999999);

		expect(LogsPlayersTeleportations.create).not.toHaveBeenCalled();
	});
});

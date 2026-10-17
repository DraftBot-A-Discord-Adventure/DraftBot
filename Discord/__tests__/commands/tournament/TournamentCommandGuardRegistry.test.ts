import {
	afterAll, describe, expect, it, vi
} from "vitest";

vi.mock("../../../src/bot/CrowniclesShard", () => ({
	discordConfig: {},
	keycloakConfig: {},
	crowniclesClient: null,
	shardId: 0
}));

// The guard is imported before CommandsManager on purpose: it enters the import cycle between both modules from the guard side
import { isAllowedInTournament } from "../../../src/commands/tournament/TournamentCommandGuard";
import { CommandsManager } from "../../../src/commands/CommandsManager";
import { commandInfo as fightCommandInfo } from "../../../src/commands/player/FightCommand";
import { commandInfo as inventoryCommandInfo } from "../../../src/commands/player/InventoryCommand";

describe("TournamentCommandGuard with the real command registry", () => {
	const commands = [fightCommandInfo, inventoryCommandInfo];

	afterAll(() => {
		for (const command of commands) {
			CommandsManager.commands.delete(command.slashCommandBuilder.name);
		}
	});

	it("reads the declaration of the commands registered in CommandsManager", () => {
		for (const command of commands) {
			CommandsManager.commands.set(command.slashCommandBuilder.name, command);
		}

		expect(isAllowedInTournament(fightCommandInfo.slashCommandBuilder.name)).toBe(true);
		expect(isAllowedInTournament(inventoryCommandInfo.slashCommandBuilder.name)).toBe(false);
		expect(isAllowedInTournament("unregistered-command")).toBe(false);
	});
});

import Player from "../../core/database/game/models/Player";
import Guild, { Guilds } from "../../core/database/game/models/Guild";
import { GuildPets } from "../../core/database/game/models/GuildPet";
import { Maps } from "../../core/maps/Maps";

async function verifyConditionCanAcceptPet(condition: PossibilityCondition, player: Player): Promise<boolean> {
	if (!condition.canAcceptPet) {
		return true;
	}

	let guild: Guild | null;

	// Search for a user's guild
	try {
		guild = await Guilds.getById(player.guildId) ?? null;
	}
	catch {
		guild = null;
	}

	const noRoomInGuild = !guild ? true : guild.isPetShelterFull(await GuildPets.getOfGuild(guild.id));

	return !(noRoomInGuild && player.petId !== null);
}

export async function verifyPossibilityCondition(condition: PossibilityCondition, player: Player): Promise<boolean> {
	return player.level >= (condition.level ?? 0)
		&& (condition.canGoBack === undefined || (Maps.getGoBackMapLink(player) !== null) === condition.canGoBack)
		&& await verifyConditionCanAcceptPet(condition, player);
}

export interface PossibilityCondition {
	level?: number;
	canAcceptPet?: boolean;

	/**
	 * `true`: only offer this possibility when the player may go back to the map they come from.
	 * `false`: only offer it when they may not, to replace the go back choice instead of losing it.
	 */
	canGoBack?: boolean;
}

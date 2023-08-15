import Player from "../database/game/models/Player";
import Guild, {Guilds} from "../database/game/models/Guild";
import {GuildPets} from "../database/game/models/GuildPet";

async function verifyConditionCanAcceptPet(condition: PossibilityCondition, player: Player): Promise<boolean> {
	if (!condition.canAcceptPet) {
		return true;
	}

	let guild: Guild;

	// Search for a user's guild
	try {
		guild = await Guilds.getById(player.guildId);
	}
	catch (error) {
		guild = null;
	}

	const noRoomInGuild = guild === null ? true : guild.isPetShelterFull(await GuildPets.getOfGuild(guild.id));

	return !(noRoomInGuild && player.petId !== null);
}

export async function verifyPossibilityCondition(condition: PossibilityCondition, player: Player): Promise<boolean> {
	return player.level >= (condition.level ?? 0) &&
		await verifyConditionCanAcceptPet(condition, player);
}

export interface PossibilityCondition {
	level?: number;
	canAcceptPet?: boolean;
}
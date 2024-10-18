import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {PetEntities} from "../database/game/models/PetEntity";
import {Guilds} from "../database/game/models/Guild";
import {PET_ENTITY_GIVE_RETURN} from "../../../../Lib/src/constants/PetConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventFindPetPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindPetPacket";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const pet = PetEntities.generateRandomPetEntityNotGuild();
		let guild;

		// Search if user has a guild
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch (error) {
			guild = null;
		}

		// Give pet to player
		const giveReturn = await pet.giveToPlayer(player, response);

		response.push(makePacket(SmallEventFindPetPacket, {
			isPetReceived: giveReturn !== PET_ENTITY_GIVE_RETURN.NO_SLOT, // Fail because no space
			isGuildOrPlayer: giveReturn === PET_ENTITY_GIVE_RETURN.GUILD, // Give to the guild or the player
			isPetFood: RandomUtils.draftbotRandom.bool() && Boolean(guild),
			petID: pet.typeId,
			petGenre: pet.sex
		}));
	}
};

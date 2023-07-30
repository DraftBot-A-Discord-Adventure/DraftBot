import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Guilds} from "../../../database/game/models/Guild";

/**
 *  Bait with meat
 */
export default class BaitWithVegetables extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const guild = await Guilds.getById(player.guildId);

		return guild && feralPet.originalPet.canEatVegetables() && RandomUtils.draftbotRandom.bool() && guild.herbivorousFood > 0;
	}
}
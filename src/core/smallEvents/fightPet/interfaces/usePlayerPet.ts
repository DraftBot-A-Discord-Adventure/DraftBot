import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {Pets} from "../../../database/game/models/Pet";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 *  Allow the player to use his pet in the fight
 */
export default class UsePlayerPet extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const playerPet = await Pets.getById(player.petId);
		// Chances are higher if the pet is rare
		return playerPet && RandomUtils.draftbotRandom.realZeroToOneInclusive() <= (
			playerPet.rarity * SmallEventConstants.FIGHT_PET.USE_PLAYER_PET_PLAYER_PET_MULTIPLIER - feralPet.originalPet.rarity * SmallEventConstants.FIGHT_PET.USE_PLAYER_PET_FERAL_PET_MULTIPLIER
		) / 100;
	}
}
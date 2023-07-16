import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {Maps} from "../../../maps/Maps";

/**
 * Ask guild's member to help the player
 */
export default class HelpFromMates extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const memberCountOnPveIsland = (await Maps.getGuildMembersOnPveIsland(player)).length;
		return feralPet.originalPet.rarity <= memberCountOnPveIsland;
	}
}
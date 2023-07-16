import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {GuildConstants} from "../../../constants/GuildConstants";
import {Maps} from "../../../maps/Maps";

/**
 * Ask guild's member to help the player
 */
export default class HelpFromMates extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const valueToBeat = RandomUtils.draftbotRandom.realZeroToOneInclusive() * GuildConstants.MAX_GUILD_MEMBERS;
		const memberCountOnPveIsland = (await Maps.getGuildMembersOnPveIsland(player)).length;
		return valueToBeat < memberCountOnPveIsland;
	}
}
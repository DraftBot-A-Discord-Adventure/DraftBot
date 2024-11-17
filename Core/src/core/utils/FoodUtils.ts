import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {Guilds} from "../database/game/models/Guild";
import Player from "../database/game/models/Player";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {NoFoodSpaceInGuildPacket} from "../../../../Lib/src/packets/utils/NoFoodSpaceInGuildPacket";
import {GiveFoodToGuildPacket} from "../../../../Lib/src/packets/utils/GiveFoodToGuildPacket";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

/**
 * Get the corresponding index in the constants of a given pet food
 * @param food
 */
export function getFoodIndexOf(food: string): number {
	return PetConstants.PET_FOOD_BY_ID.indexOf(food);
}

export async function giveFoodToGuild(response: DraftBotPacket[],player:Player, selectedFood:string, quantity:number, reason:NumberChangeReason):Promise<void> {
	const guild = await Guilds.getById(player.guildId);
	const selectedFoodIndex = getFoodIndexOf(selectedFood);
	if (guild.isStorageFullFor(selectedFood, quantity)) {
		response.push(makePacket(NoFoodSpaceInGuildPacket,{}));
		return;
	}
	guild.addFood(selectedFood, quantity, reason);
	await guild.save();
	response.push(makePacket(GiveFoodToGuildPacket,{quantity,selectedFoodIndex}));
}
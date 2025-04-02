import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import { ClassDataController } from "../../data/Class";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { ClassConstants } from "../../../../Lib/src/constants/ClassConstants";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { SmallEventClassPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventClassPacket";
import { SmallEventConstants } from "../../../../Lib/src/constants/SmallEventConstants";
import {
	ItemCategory, ItemConstants, ItemNature
} from "../../../../Lib/src/constants/ItemConstants";
import {
	generateRandomItem, giveItemToPlayer
} from "../utils/ItemUtils";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../database/game/models/Player";
import { InventorySlots } from "../database/game/models/InventorySlot";
import { ClassKind } from "../../../../Lib/src/types/ClassKind";

/**
 * Manage the different interactions
 * @param player
 * @param packet
 * @param response
 * @param context
 * @param classKind
 */
async function managePickedInteraction(player: Player, packet: SmallEventClassPacket, response: DraftBotPacket[], context: PacketContext, classKind: ClassKind): Promise<void> {
	let item;

	switch (packet.interactionName) {
		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_WEAPON:
			item = generateRandomItem(ItemCategory.WEAPON);
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_ARMOR:
			item = generateRandomItem(ItemCategory.ARMOR);
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_OBJECT:
			item = generateRandomItem(
				ItemCategory.OBJECT,
				ItemConstants.RARITY.COMMON,
				ItemConstants.RARITY.MYTHICAL,
				classKind === ClassConstants.CLASS_KIND.ATTACK ? ItemNature.ATTACK : ItemNature.DEFENSE
			);
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_ITEM:
			item = generateRandomItem();
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_POTION:
			item = generateRandomItem(
				ItemCategory.POTION,
				ItemConstants.RARITY.COMMON,
				ItemConstants.RARITY.MYTHICAL,
				classKind === ClassConstants.CLASS_KIND.ATTACK ? ItemNature.ATTACK : ItemNature.DEFENSE
			);
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_HEALTH:
			packet.amount = RandomUtils.rangedInt(SmallEventConstants.CLASS.HEALTH);
			await player.addHealth(packet.amount, response, NumberChangeReason.SMALL_EVENT);
			break;

		case ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS_NAMES.WIN_MONEY:
			packet.amount = RandomUtils.rangedInt(SmallEventConstants.CLASS.MONEY);
			await player.addMoney({
				amount: packet.amount, response, reason: NumberChangeReason.SMALL_EVENT
			});
			break;
		default:
			break;
	}
	if (item) {
		await giveItemToPlayer(player, item, context, response, await InventorySlots.getOfPlayer(player.id));
	}
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (response, player, context): Promise<void> => {
		const playerClassId = player.class;
		const classKind = ClassDataController.instance.getById(playerClassId).classKind;
		const issue = RandomUtils.draftbotRandom.pick(ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS[classKind.toUpperCase() as keyof typeof ClassConstants.CLASS_SMALL_EVENT_INTERACTIONS]);
		const packet: SmallEventClassPacket = {
			classKind, interactionName: issue
		};
		await managePickedInteraction(player, packet, response, context, classKind);
		response.push(makePacket(SmallEventClassPacket, packet));
	}
};

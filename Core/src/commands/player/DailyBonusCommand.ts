import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {CommandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {
	CommandDailyBonusInCooldown,
	CommandDailyBonusNoActiveObject,
	CommandDailyBonusObjectDoNothing,
	CommandDailyBonusObjectIsActiveDuringFights,
	CommandDailyBonusPacketReq,
	CommandDailyBonusPacketRes
} from "../../../../Lib/src/packets/commands/CommandDailyBonusPacket";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {draftBotInstance} from "../../index";
import {ObjectItem} from "../../data/ObjectItem";
import {ItemNature} from "../../../../Lib/src/constants/ItemConstants";
import {InventoryConstants} from "../../../../Lib/src/constants/InventoryConstants";
import {InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {millisecondsToHours} from "../../../../Lib/src/utils/TimeUtils";
import {DailyConstants} from "../../../../Lib/src/constants/DailyConstants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {TravelTime} from "../../core/maps/TravelTime";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";

async function isWrongObjectForDaily(activeObject: ObjectItem, response: DraftBotPacket[]): Promise<boolean> {
	if (activeObject.nature === ItemNature.NONE) {
		response.push(makePacket(activeObject.id === InventoryConstants.OBJECT_DEFAULT_ID ? CommandDailyBonusNoActiveObject : CommandDailyBonusObjectDoNothing, {}));
		return true;
	}
	if ([ItemNature.SPEED, ItemNature.DEFENSE, ItemNature.ATTACK].includes(activeObject.nature)) {
		response.push(makePacket(CommandDailyBonusObjectIsActiveDuringFights, {}));
		return true;
	}
	return false;
}

async function dailyNotReady(player: Player, response: DraftBotPacket[]): Promise<boolean> {
	const inventoryInfo = await InventoryInfos.getOfPlayer(player.id);
	const lastDailyTimestamp = inventoryInfo.getLastDailyAtTimestamp();
	if (millisecondsToHours(Date.now() - inventoryInfo.getLastDailyAtTimestamp()) < DailyConstants.TIME_BETWEEN_DAILIES) {
		response.push(makePacket(CommandDailyBonusInCooldown, {
			timeBetweenDailies: DailyConstants.TIME_BETWEEN_DAILIES,
			lastDailyTimestamp
		}));
		return true;
	}
	return false;
}

async function activateDailyItem(player: Player, activeObject: ObjectItem, response: DraftBotPacket[]) {
	const packet = makePacket(CommandDailyBonusPacketRes, {
		value: activeObject.power,
		itemNature: activeObject.nature
	});
	response.push(packet);
	switch (packet.itemNature) {
	case ItemNature.ENERGY:
		player.addEnergy(activeObject.power, NumberChangeReason.DAILY);
		break;
	case ItemNature.HEALTH:
		await player.addHealth(activeObject.power, response, NumberChangeReason.DAILY);
		break;
	case ItemNature.TIME_SPEEDUP:
		await TravelTime.timeTravel(player, activeObject.power, NumberChangeReason.DAILY);
		break;
	case ItemNature.MONEY:
		await player.addMoney({
			amount: activeObject.power,
			response,
			reason: NumberChangeReason.DAILY
		});
		break;
	}
	const inventoryInfo = await InventoryInfos.getOfPlayer(player.id);
	inventoryInfo.updateLastDailyAt();
	await Promise.all([
		inventoryInfo.save(),
		player.save()
	]);
}

export default class DailyBonusCommand {

	/**
	 * Respawn the player
	 * @param _packet
	 * @param context
	 * @param response
	 */
	@packetHandler(CommandDailyBonusPacketReq)
	@CommandRequires({
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.STARTED_AND_NOT_DEAD
	})
	async execute(_packet: CommandDailyBonusPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(context.keycloakId);
		const activeObjectSlot = await InventorySlots.getMainObjectSlot(player.id);
		if (!activeObjectSlot) {
			response.push(makePacket(CommandDailyBonusNoActiveObject, {}));
			return;
		}

		const activeObject: ObjectItem = activeObjectSlot.getItem() as ObjectItem;

		if (await isWrongObjectForDaily(activeObject, response) || await dailyNotReady(player, response)) {
			return;
		}

		await activateDailyItem(player, activeObject, response);
		draftBotInstance.logsDatabase.logPlayerDaily(player.keycloakId, activeObject).then();
	}
}


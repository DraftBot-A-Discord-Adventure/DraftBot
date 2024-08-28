import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {CommandSwitchPacketReq, CommandSwitchPacketRes} from "../../../../Lib/src/packets/commands/CommandSwitchPacket";
import {Weapon} from "../../data/Weapon";
import {Armor} from "../../data/Armor";
import {Potion} from "../../data/Potion";
import {ObjectItem} from "../../data/ObjectItem";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {InventoryInfos} from "../../core/database/game/models/InventoryInfo";

export default class SwitchCommand {
	@packetHandler(CommandSwitchPacketReq)
	async execute(client: WebsocketClient, packet: CommandSwitchPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {

		const player = await Players.getByKeycloakId(packet.keycloakId);
		const maxStatsValues = player.getMaxStatsValue();
		const [items, invInfo] = await Promise.all([InventorySlots.getOfPlayer(player.id), InventoryInfos.getOfPlayer(player.id)]);
		// Send collector
		const collector = new ReactionCollectorSwitch(
			data
	:
		{
			weapon: (items.find((item) => item.isWeapon() && item.isEquipped()).getItem() as Weapon).getDisplayPacket(maxStatsValues),
				armor
		:
			(items.find((item) => item.isArmor() && item.isEquipped()).getItem() as Armor).getDisplayPacket(maxStatsValues),
				potion
		:
			(items.find((item) => item.isPotion() && item.isEquipped()).getItem() as Potion).getDisplayPacket(),
				object
		:
			(items.find((item) => item.isObject() && item.isEquipped()).getItem() as ObjectItem).getDisplayPacket(maxStatsValues),
				backupWeapons
		:
			items.filter((item) => item.isWeapon() && !item.isEquipped()).map((item) =>
				({display: (item.getItem() as Weapon).getDisplayPacket(maxStatsValues), slot: item.slot})),
				backupArmors
		:
			items.filter((item) => item.isArmor() && !item.isEquipped()).map((item) =>
				({display: (item.getItem() as Armor).getDisplayPacket(maxStatsValues), slot: item.slot})),
				backupPotions
		:
			items.filter((item) => item.isPotion() && !item.isEquipped()).map((item) =>
				({display: (item.getItem() as Potion).getDisplayPacket(), slot: item.slot})),
				backupObjects
		:
			items.filter((item) => item.isObject() && !item.isEquipped()).map((item) =>
				({display: (item.getItem() as ObjectItem).getDisplayPacket(maxStatsValues), slot: item.slot})),
				slots
		:
			{
				weapons: invInfo.weaponSlots,
					armors
			:
				invInfo.armorSlots,
					potions
			:
				invInfo.potionSlots,
					objects
			:
				invInfo.objectSlots
			}
		}
	)
		;

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptGuildCreate(player, packet.askedGuildName, response);
			}
			else {
				response.push(makePacket(CommandGuildCreateRefusePacketRes, {}));
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_CREATE);
		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.GUILD_CREATE)
			.build();

		response.push(collectorPacket);
		response.push(makePacket(CommandSwitchPacketRes, {}));
	}
}
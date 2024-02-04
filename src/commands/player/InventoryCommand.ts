import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {CommandInventoryPacketReq, CommandInventoryPacketRes} from "../../../../Lib/src/packets/commands/CommandInventoryPacket";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {Weapon} from "../../data/Weapon";
import {Armor} from "../../data/Armor";
import {Potion} from "../../data/Potion";
import {ObjectItem} from "../../data/ObjectItem";

export default class InventoryCommand {
	@packetHandler(CommandInventoryPacketReq)
	async execute(client: WebsocketClient, packet: CommandInventoryPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = packet.askedPlayer.keycloakId ? await Players.getByKeycloakId(packet.askedPlayer.keycloakId) : await Players.getByRank(packet.askedPlayer.rank);

		if (!player) {
			response.push(makePacket(CommandInventoryPacketRes, {
				foundPlayer: false
			}));
		}
		else {
			const maxStatsValues = player.getMaxStatsValue();
			const items = await InventorySlots.getOfPlayer(player.id);

			response.push(makePacket(CommandInventoryPacketRes, {
				foundPlayer: true,
				keycloakId: player.keycloakId,
				data: {
					weapon: (items.find((item) => item.isWeapon() && item.isEquipped()).getItem() as Weapon).getDisplayPacket(maxStatsValues),
					armor: (items.find((item) => item.isArmor() && item.isEquipped()).getItem() as Armor).getDisplayPacket(maxStatsValues),
					potion: (items.find((item) => item.isPotion() && item.isEquipped()).getItem() as Potion).getDisplayPacket(),
					object: (items.find((item) => item.isObject() && item.isEquipped()).getItem() as ObjectItem).getDisplayPacket(maxStatsValues),
					backupWeapons: items.filter((item) => item.isWeapon() && !item.isEquipped()).map((item) => (item.getItem() as Weapon).getDisplayPacket(maxStatsValues)),
					backupArmors: items.filter((item) => item.isArmor() && !item.isEquipped()).map((item) => (item.getItem() as Armor).getDisplayPacket(maxStatsValues)),
					backupPotions: items.filter((item) => item.isPotion() && !item.isEquipped()).map((item) => (item.getItem() as Potion).getDisplayPacket()),
					backupObjects: items.filter((item) => item.isObject() && !item.isEquipped()).map((item) => (item.getItem() as ObjectItem).getDisplayPacket(maxStatsValues))
				}
			}));
		}
	}
}
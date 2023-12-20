import {CommandRarityPacketReq, CommandRarityPacketRes} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ItemConstants} from "../../core/constants/ItemConstants";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

export default class RarityCommand {
	@packetHandler(CommandRarityPacketReq)
	execute(client: WebsocketClient, packet: CommandRarityPacketReq, context: PacketContext, response: DraftBotPacket[]): void {
		const maxValue = ItemConstants.RARITY.GENERATOR.MAX_VALUE;
		const raritiesGenerator = ItemConstants.RARITY.GENERATOR.VALUES;
		response.push(makePacket(CommandRarityPacketRes, {
			common: raritiesGenerator[0] * 100 / maxValue,
			uncommon: (raritiesGenerator[1] - raritiesGenerator[0]) * 100 / maxValue,
			exotic: (raritiesGenerator[2] - raritiesGenerator[1]) * 100 / maxValue,
			rare: (raritiesGenerator[3] - raritiesGenerator[2]) * 100 / maxValue,
			special: (raritiesGenerator[4] - raritiesGenerator[3]) * 100 / maxValue,
			epic: (raritiesGenerator[5] - raritiesGenerator[4]) * 100 / maxValue,
			legendary: (raritiesGenerator[6] - raritiesGenerator[5]) * 100 / maxValue,
			unique: (maxValue - raritiesGenerator[6]) * 100 / maxValue
		}));
	}
}

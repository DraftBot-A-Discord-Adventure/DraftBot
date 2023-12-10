import {PacketListenerCallbackServer} from "../../../../Lib/src/packets/PacketListener";
import {CommandRarityPacketReq, CommandRarityPacketRes} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {ItemConstants} from "../../core/constants/ItemConstants";

const command: PacketListenerCallbackServer<CommandRarityPacketReq> = (client, packet, context, response) => {
	const maxValue = ItemConstants.RARITY.GENERATOR.MAX_VALUE;
	const raritiesGenerator = ItemConstants.RARITY.GENERATOR.VALUES;
	response.push(makePacket<CommandRarityPacketRes>(CommandRarityPacketRes, {
		common: raritiesGenerator[0] * 100 / maxValue,
		uncommon: (raritiesGenerator[1] - raritiesGenerator[0]) * 100 / maxValue,
		exotic: (raritiesGenerator[2] - raritiesGenerator[1]) * 100 / maxValue,
		rare: (raritiesGenerator[3] - raritiesGenerator[2]) * 100 / maxValue,
		special: (raritiesGenerator[4] - raritiesGenerator[3]) * 100 / maxValue,
		epic: (raritiesGenerator[5] - raritiesGenerator[4]) * 100 / maxValue,
		legendary: (raritiesGenerator[6] - raritiesGenerator[5]) * 100 / maxValue,
		unique: (maxValue - raritiesGenerator[6]) * 100 / maxValue
	}));
};

export default command;

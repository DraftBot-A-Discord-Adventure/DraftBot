import {packetHandler} from "../../../PacketHandler";
import {
	CommandGuildKickAcceptPacketRes,
	CommandGuildKickPacketRes,
	CommandGuildKickRefusePacketRes
} from "../../../../../../Lib/src/packets/commands/CommandGuildKickPacket";
import {PacketContext} from "../../../../../../Lib/src/packets/DraftBotPacket";
import {
	handleCommandGuildKickAcceptPacketRes,
	handleCommandGuildKickPacketRes,
	handleCommandGuildKickRefusePacketRes
} from "../../../../commands/guild/GuildKickCommand";

export default class GuildKickCommandPacketHandlers {
	@packetHandler(CommandGuildKickPacketRes)
	async guildKickRes(context: PacketContext, packet: CommandGuildKickPacketRes): Promise<void> {
		await handleCommandGuildKickPacketRes(packet, context);
	}

	@packetHandler(CommandGuildKickRefusePacketRes)
	async guildKickRefuseRes(context: PacketContext, packet: CommandGuildKickRefusePacketRes): Promise<void> {
		await handleCommandGuildKickRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildKickAcceptPacketRes)
	async guildKickAcceptRes(context: PacketContext, packet: CommandGuildKickAcceptPacketRes): Promise<void> {
		await handleCommandGuildKickAcceptPacketRes(packet, context);
	}
}
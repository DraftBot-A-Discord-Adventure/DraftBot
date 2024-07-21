import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {WebSocket} from "ws";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {draftBotClient, shardId} from "../../bot/DraftBotShard";
import {CommandProfilePacketRes} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
import {handleCommandProfilePacketRes} from "../../commands/player/ProfileCommand";
import {CommandInventoryPacketRes} from "../../../../Lib/src/packets/commands/CommandInventoryPacket";
import {handleCommandInventoryPacketRes} from "../../commands/player/InventoryCommand";
import {handleCommandUpdatePacketRes} from "../../commands/player/UpdateCommand";
import {CommandUpdatePacketRes} from "../../../../Lib/src/packets/commands/CommandUpdatePacket";
import {CommandTestPacketRes} from "../../../../Lib/src/packets/commands/CommandTestPacket";
import {CommandRarityPacketRes} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {handleCommandRarityPacketRes} from "../../commands/player/RarityCommand";
import {handleCommandTestPacketRes} from "../../commands/admin/TestCommand";
import {handleCommandGuildPacketRes} from "../../commands/guild/GuildCommand";
import {CommandGuildPacketRes} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import {reportResult, reportTravelSummary} from "../../commands/player/ReportCommand";
import {
	CommandReportBigEventResultRes,
	CommandReportTravelSummaryRes
} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {CommandMapDisplayRes} from "../../../../Lib/src/packets/commands/CommandMapPacket";
import {handleCommandMapDisplayRes} from "../../commands/player/MapCommand";
import {CommandPetPacketRes} from "../../../../Lib/src/packets/commands/CommandPetPacket";
import {handleCommandPetPacketRes} from "../../commands/pet/PetCommand";
import {
	handleCommandPetFreeAcceptPacketRes,
	handleCommandPetFreePacketRes,
	handleCommandPetFreeRefusePacketRes
} from "../../commands/pet/PetFreeCommand";
import {
	CommandPetFreeAcceptPacketRes,
	CommandPetFreePacketRes,
	CommandPetFreeRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {CommandPetNickPacketRes} from "../../../../Lib/src/packets/commands/CommandPetNickPacket";
import {handleCommandPetNickPacketRes} from "../../commands/pet/PetNickCommand";

export default class CommandHandlers {
	@packetHandler(CommandPingPacketRes)
	async pingRes(socket: WebSocket, packet: CommandPingPacketRes, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			content: i18n.t("commands:ping.discord.edit", {
				lng: interaction?.userLanguage,
				totalLatency: Date.now() - packet.clientTime,
				discordApiLatency: draftBotClient!.ws.ping,
				shardId: shardId,
				totalShards: draftBotClient!.shard!.count - 1
			})
		});
	}

	@packetHandler(CommandProfilePacketRes)
	async profileRes(socket: WebSocket, packet: CommandProfilePacketRes, context: PacketContext): Promise<void> {
		await handleCommandProfilePacketRes(packet, context);
	}

	@packetHandler(CommandPetPacketRes)
	async petRes(socket: WebSocket, packet: CommandPetPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetPacketRes(packet, context);
	}

	@packetHandler(CommandPetFreePacketRes)
	async petFreeRes(socket: WebSocket, packet: CommandPetFreePacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreePacketRes(packet, context);
	}

	@packetHandler(CommandPetFreeRefusePacketRes)
	async petFreeRefuseRes(socket: WebSocket, packet: CommandPetFreeRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreeRefusePacketRes(packet, context);
	}

	@packetHandler(CommandPetFreeAcceptPacketRes)
	async petFreeAcceptRes(socket: WebSocket, packet: CommandPetFreeAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreeAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandPetNickPacketRes)
	async PetNickPacketRes(socket: WebSocket, packet: CommandPetNickPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetNickPacketRes(packet, context);
	}

	@packetHandler(CommandGuildPacketRes)
	async guildRes(socket: WebSocket, packet: CommandGuildPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildPacketRes(packet, context);
	}

	@packetHandler(CommandInventoryPacketRes)
	async inventoryRes(socket: WebSocket, packet: CommandInventoryPacketRes, context: PacketContext): Promise<void> {
		await handleCommandInventoryPacketRes(packet, context);
	}

	@packetHandler(CommandUpdatePacketRes)
	async updateRes(socket: WebSocket, packet: CommandUpdatePacketRes, context: PacketContext): Promise<void> {
		await handleCommandUpdatePacketRes(packet, context);
	}

	@packetHandler(CommandTestPacketRes)
	async testRes(socket: WebSocket, packet: CommandTestPacketRes, context: PacketContext): Promise<void> {
		await handleCommandTestPacketRes(packet, context);
	}

	@packetHandler(CommandRarityPacketRes)
	async rarityRes(socket: WebSocket, packet: CommandRarityPacketRes, context: PacketContext): Promise<void> {
		await handleCommandRarityPacketRes(packet, context);
	}

	@packetHandler(CommandReportBigEventResultRes)
	async reportResultRes(socket: WebSocket, packet: CommandReportBigEventResultRes, context: PacketContext): Promise<void> {
		await reportResult(packet, context);
	}

	@packetHandler(CommandReportTravelSummaryRes)
	async reportTravelSummaryRes(socket: WebSocket, packet: CommandReportTravelSummaryRes, context: PacketContext): Promise<void> {
		await reportTravelSummary(packet, context);
	}

	@packetHandler(CommandMapDisplayRes)
	async mapRes(socket: WebSocket, packet: CommandMapDisplayRes, context: PacketContext): Promise<void> {
		await handleCommandMapDisplayRes(packet, context);
	}
}
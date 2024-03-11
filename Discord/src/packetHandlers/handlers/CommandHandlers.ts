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
import { CommandGuildPacketRes } from "../../../../Lib/src/packets/commands/CommandGuildPacket";

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
}
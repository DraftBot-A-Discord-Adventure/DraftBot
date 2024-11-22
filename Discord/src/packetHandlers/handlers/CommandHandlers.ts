import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
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
import {
	handleCommandRespawnErrorAlreadyAlive,
	handleCommandRespawnPacketRes
} from "../../commands/player/RespawnCommand";
import {CommandGuildPacketRes} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import {
	handleCommandGuildCreateAcceptPacketRes,
	handleCommandGuildCreatePacketRes,
	handleCommandGuildCreateRefusePacketRes
} from "../../commands/guild/GuildCreateCommand";
import {reportResult, reportTravelSummary} from "../../commands/player/ReportCommand";
import {
	CommandReportBigEventResultRes,
	CommandReportErrorNoMonsterRes,
	CommandReportMonsterRewardRes,
	CommandReportRefusePveFightRes,
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
import {
	CommandGuildCreateAcceptPacketRes,
	CommandGuildCreatePacketRes,
	CommandGuildCreateRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
import {CommandClassesInfoPacketRes} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";
import {handleCommandClassesInfoPacketRes} from "../../commands/player/ClassesInfoCommand";
import {
	CommandRespawnErrorAlreadyAlive,
	CommandRespawnPacketRes
} from "../../../../Lib/src/packets/commands/CommandRespawnPacket";
import {
	CommandShopAlreadyHaveBadge,
	CommandShopBadgeBought,
	CommandShopBoughtTooMuchDailyPotions,
	CommandShopClosed,
	CommandShopFullRegen,
	CommandShopHealAlterationDone,
	CommandShopNoAlterationToHeal,
	CommandShopNoEnergyToHeal,
	CommandShopNotEnoughMoney,
	CommandShopTooManyEnergyBought
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {
	handleCommandShopAlreadyHaveBadge,
	handleCommandShopBadgeBought,
	handleCommandShopBoughtTooMuchDailyPotions,
	handleCommandShopClosed,
	handleCommandShopFullRegen,
	handleCommandShopHealAlterationDone,
	handleCommandShopNoAlterationToHeal,
	handleCommandShopNoEnergyToHeal,
	handleCommandShopNotEnoughMoney,
	handleCommandShopTooManyEnergyBought,
	handleReactionCollectorBuyCategorySlotBuySuccess
} from "../../commands/player/ShopCommand";
import {ReactionCollectorBuyCategorySlotBuySuccess} from "../../../../Lib/src/packets/interaction/ReactionCollectorBuyCategorySlot";
import {CommandMaintenancePacketRes} from "../../../../Lib/src/packets/commands/CommandMaintenancePacket";
import {handleCommandMaintenancePacketRes} from "../../commands/admin/MaintenanceCommand";
import {
	handleCommandMissionPlayerNotFoundPacket,
	handleCommandMissionsPacketRes
} from "../../commands/mission/MissionsCommand";
import {
	CommandMissionPlayerNotFoundPacket,
	CommandMissionsPacketRes
} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {
	CommandGuildShopEmpty,
	CommandGuildShopGiveXp,
	CommandGuildShopNoFoodStorageSpace
} from "../../../../Lib/src/packets/commands/CommandGuildShopPacket";
import {
	handleCommandGuildShopEmpty,
	handleCommandGuildShopGiveXp,
	handleCommandGuildShopNoFoodStorageSpace
} from "../../commands/guild/GuildShopCommand";
import {
	CommandGuildDailyCooldownErrorPacket, CommandGuildDailyPveIslandErrorPacket,
	CommandGuildDailyRewardPacket
} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {
	handleCommandGuildDailyCooldownErrorPacket, handleCommandGuildDailyPveIslandErrorPacket,
	handleCommandGuildDailyRewardPacket
} from "../../commands/guild/GuildDailyCommand";
import {
	CommandGuildKickAcceptPacketRes,
	CommandGuildKickPacketRes,
	CommandGuildKickRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildKickPacket";
import {
	handleCommandGuildKickAcceptPacketRes,
	handleCommandGuildKickPacketRes,
	handleCommandGuildKickRefusePacketRes
} from "../../commands/guild/GuildKickCommand";

export default class CommandHandlers {
	@packetHandler(CommandPingPacketRes)
	async pingRes(packet: CommandPingPacketRes, context: PacketContext): Promise<void> {
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
	async profileRes(packet: CommandProfilePacketRes, context: PacketContext): Promise<void> {
		await handleCommandProfilePacketRes(packet, context);
	}

	@packetHandler(CommandPetPacketRes)
	async petRes(packet: CommandPetPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetPacketRes(packet, context);
	}

	@packetHandler(CommandPetFreePacketRes)
	async petFreeRes(packet: CommandPetFreePacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreePacketRes(packet, context);
	}

	@packetHandler(CommandPetFreeRefusePacketRes)
	async petFreeRefuseRes(packet: CommandPetFreeRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreeRefusePacketRes(packet, context);
	}

	@packetHandler(CommandPetFreeAcceptPacketRes)
	async petFreeAcceptRes(packet: CommandPetFreeAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetFreeAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandPetNickPacketRes)
	async PetNickPacketRes(packet: CommandPetNickPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetNickPacketRes(packet, context);
	}

	@packetHandler(CommandGuildPacketRes)
	async guildRes(packet: CommandGuildPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildPacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreatePacketRes)
	async guildCreateRes(packet: CommandGuildCreatePacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildCreatePacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreateRefusePacketRes)
	async guildCreateRefuseRes(packet: CommandGuildCreateRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildCreateRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreateAcceptPacketRes)
	async guildCreateAcceptRes(packet: CommandGuildCreateAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildCreateAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandGuildKickPacketRes)
	async guildKickRes(packet: CommandGuildKickPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildKickPacketRes(packet, context);
	}

	@packetHandler(CommandGuildKickRefusePacketRes)
	async guildKickRefuseRes(packet: CommandGuildKickRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildKickRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildKickAcceptPacketRes)
	async guildKickAcceptRes(packet: CommandGuildKickAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildKickAcceptPacketRes(packet, context);
	}


	@packetHandler(CommandInventoryPacketRes)
	async inventoryRes(packet: CommandInventoryPacketRes, context: PacketContext): Promise<void> {
		await handleCommandInventoryPacketRes(packet, context);
	}

	@packetHandler(CommandUpdatePacketRes)
	async updateRes(packet: CommandUpdatePacketRes, context: PacketContext): Promise<void> {
		await handleCommandUpdatePacketRes(packet, context);
	}

	@packetHandler(CommandTestPacketRes)
	async testRes(packet: CommandTestPacketRes, context: PacketContext): Promise<void> {
		await handleCommandTestPacketRes(packet, context);
	}

	@packetHandler(CommandRarityPacketRes)
	async rarityRes(packet: CommandRarityPacketRes, context: PacketContext): Promise<void> {
		await handleCommandRarityPacketRes(packet, context);
	}

	@packetHandler(CommandReportBigEventResultRes)
	async reportResultRes(packet: CommandReportBigEventResultRes, context: PacketContext): Promise<void> {
		await reportResult(packet, context);
	}

	@packetHandler(CommandReportTravelSummaryRes)
	async reportTravelSummaryRes(packet: CommandReportTravelSummaryRes, context: PacketContext): Promise<void> {
		await reportTravelSummary(packet, context);
	}

	@packetHandler(CommandMapDisplayRes)
	async mapRes(packet: CommandMapDisplayRes, context: PacketContext): Promise<void> {
		await handleCommandMapDisplayRes(packet, context);
	}

	@packetHandler(CommandReportMonsterRewardRes)
	async reportMonsterRewardRes(packet: CommandReportMonsterRewardRes, context: PacketContext): Promise<void> {
		// TODO
	}

	@packetHandler(CommandReportErrorNoMonsterRes)
	async reportErrorNoMonsterRes(packet: CommandReportErrorNoMonsterRes, context: PacketContext): Promise<void> {
		// TODO
	}

	@packetHandler(CommandReportRefusePveFightRes)
	async reportRefusePveFightRes(packet: CommandReportRefusePveFightRes, context: PacketContext): Promise<void> {
		// TODO
	}

	@packetHandler(CommandClassesInfoPacketRes)
	async classesInfoRes(packet: CommandClassesInfoPacketRes, context: PacketContext): Promise<void> {
		await handleCommandClassesInfoPacketRes(packet, context);
	}

	@packetHandler(CommandRespawnPacketRes)
	async respawnRes(packet: CommandRespawnPacketRes, context: PacketContext): Promise<void> {
		await handleCommandRespawnPacketRes(packet, context);
	}

	@packetHandler(CommandRespawnErrorAlreadyAlive)
	async respawnErrorAlreadyAlive(packet: CommandRespawnErrorAlreadyAlive, context: PacketContext): Promise<void> {
		await handleCommandRespawnErrorAlreadyAlive(packet, context);
	}

	@packetHandler(CommandShopClosed)
	async shopClosed(packet: CommandShopClosed, context: PacketContext): Promise<void> {
		await handleCommandShopClosed(context);
	}

	@packetHandler(CommandShopNoAlterationToHeal)
	async shopNoAlterationToHeal(packet: CommandShopNoAlterationToHeal, context: PacketContext): Promise<void> {
		await handleCommandShopNoAlterationToHeal(context);
	}

	@packetHandler(CommandShopHealAlterationDone)
	async shopHealAlterationDone(packet: CommandShopHealAlterationDone, context: PacketContext): Promise<void> {
		await handleCommandShopHealAlterationDone(context);
	}

	@packetHandler(CommandShopTooManyEnergyBought)
	async shopTooManyEnergyBought(packet: CommandShopTooManyEnergyBought, context: PacketContext): Promise<void> {
		await handleCommandShopTooManyEnergyBought(context);
	}

	@packetHandler(CommandShopNoEnergyToHeal)
	async shopNoEnergyToHeal(packet: CommandShopNoEnergyToHeal, context: PacketContext): Promise<void> {
		await handleCommandShopNoEnergyToHeal(context);
	}

	@packetHandler(CommandShopFullRegen)
	async shopFullRegen(packet: CommandShopFullRegen, context: PacketContext): Promise<void> {
		await handleCommandShopFullRegen(context);
	}

	@packetHandler(CommandShopAlreadyHaveBadge)
	async shopAlreadyHaveBadge(packet: CommandShopAlreadyHaveBadge, context: PacketContext): Promise<void> {
		await handleCommandShopAlreadyHaveBadge(context);
	}

	@packetHandler(CommandShopBadgeBought)
	async shopBadgeBought(packet: CommandShopBadgeBought, context: PacketContext): Promise<void> {
		await handleCommandShopBadgeBought(context);
	}

	@packetHandler(CommandShopBoughtTooMuchDailyPotions)
	async shopBoughtTooMuchDailyPotions(packet: CommandShopBoughtTooMuchDailyPotions, context: PacketContext): Promise<void> {
		await handleCommandShopBoughtTooMuchDailyPotions(context);
	}

	@packetHandler(CommandShopNotEnoughMoney)
	async shopNotEnoughMoney(packet: CommandShopNotEnoughMoney, context: PacketContext): Promise<void> {
		await handleCommandShopNotEnoughMoney(context);
	}

	@packetHandler(ReactionCollectorBuyCategorySlotBuySuccess)
	async buyCategorySlotBuySuccess(packet: ReactionCollectorBuyCategorySlotBuySuccess, context: PacketContext): Promise<void> {
		await handleReactionCollectorBuyCategorySlotBuySuccess(context);
	}

	@packetHandler(CommandMaintenancePacketRes)
	async maintenanceReq(packet: CommandMaintenancePacketRes, context: PacketContext): Promise<void> {
		await handleCommandMaintenancePacketRes(packet, context);
	}

	@packetHandler(CommandMissionPlayerNotFoundPacket)
	async commandMissionPlayerNotFound(packet: CommandMissionPlayerNotFoundPacket, context: PacketContext): Promise<void> {
		await handleCommandMissionPlayerNotFoundPacket(packet, context);
	}

	@packetHandler(CommandMissionsPacketRes)
	async missionsCommandRes(packet: CommandMissionsPacketRes, context: PacketContext): Promise<void> {
		await handleCommandMissionsPacketRes(packet, context);
	}

	@packetHandler(CommandGuildShopNoFoodStorageSpace)
	async guildShopNoFoodStorageSpace(packet: CommandGuildShopNoFoodStorageSpace, context: PacketContext): Promise<void> {
		await handleCommandGuildShopNoFoodStorageSpace(context);
	}

	@packetHandler(CommandGuildShopEmpty)
	async guildShopEmpty(packet: CommandGuildShopEmpty, context: PacketContext): Promise<void> {
		await handleCommandGuildShopEmpty(context);

	}

	@packetHandler(CommandGuildShopGiveXp)
	async guildShopGiveXp(packet: CommandGuildShopGiveXp, context: PacketContext): Promise<void> {
		await handleCommandGuildShopGiveXp(packet, context);
	}

	@packetHandler(CommandGuildDailyRewardPacket)
	async guildDailyReward(packet: CommandGuildDailyRewardPacket, context: PacketContext): Promise<void> {
		await handleCommandGuildDailyRewardPacket(packet, context);
	}

	@packetHandler(CommandGuildDailyCooldownErrorPacket)
	async guildDailyCooldownError(packet: CommandGuildDailyCooldownErrorPacket, context: PacketContext): Promise<void> {
		await handleCommandGuildDailyCooldownErrorPacket(packet, context);
	}

	@packetHandler(CommandGuildDailyPveIslandErrorPacket)
	async guildDailyPveIslandError(packet: CommandGuildDailyPveIslandErrorPacket, context: PacketContext): Promise<void> {
		await handleCommandGuildDailyPveIslandErrorPacket(packet, context);
	}
}
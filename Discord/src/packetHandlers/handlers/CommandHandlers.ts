import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {draftBotClient, shardId} from "../../bot/DraftBotShard";
import {
	CommandProfilePacketRes,
	CommandProfilePlayerNotFound
} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
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
import {handleCommandRespawnPacketRes} from "../../commands/player/RespawnCommand";
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
import {CommandPetPacketRes, CommandPetPetNotFound} from "../../../../Lib/src/packets/commands/CommandPetPacket";
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
import {
	CommandGuildInviteAcceptPacketRes,
	CommandGuildInviteAlreadyInAGuild,
	CommandGuildInviteGuildIsFull,
	CommandGuildInviteInvitedPlayerIsDead,
	CommandGuildInviteInvitedPlayerIsOnPveIsland,
	CommandGuildInviteInvitingPlayerNotInGuild,
	CommandGuildInviteLevelTooLow,
	CommandGuildInviteRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildInvitePacket.js";
import {
	handleCommandGuildInviteAcceptPacketRes,
	handleCommandGuildInviteError,
	handleCommandGuildInviteRefusePacketRes
} from "../../commands/guild/GuildInviteCommand.js";
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
	CommandShopNotEnoughCurrency,
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
	CommandGuildDailyCooldownErrorPacket,
	CommandGuildDailyPveIslandErrorPacket,
	CommandGuildDailyRewardPacket
} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {
	handleCommandGuildDailyCooldownErrorPacket,
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
import {
	CommandDailyBonusInCooldown,
	CommandDailyBonusNoActiveObject,
	CommandDailyBonusObjectDoNothing,
	CommandDailyBonusObjectIsActiveDuringFights,
	CommandDailyBonusPacketRes
} from "../../../../Lib/src/packets/commands/CommandDailyBonusPacket";
import {handleDailyBonusCooldownError, handleDailyBonusRes} from "../../commands/player/DailyBonusCommand";
import {
	CommandUnlockAcceptPacketRes,
	CommandUnlockHimself,
	CommandUnlockNoPlayerFound,
	CommandUnlockNotEnoughMoney,
	CommandUnlockNotInJail,
	CommandUnlockRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandUnlockPacket";
import {
	handleCommandUnlockAcceptPacketRes,
	handleCommandUnlockNotEnoughMoneyError,
	handleCommandUnlockRefusePacketRes
} from "../../commands/player/UnlockCommand";
import {handleClassicError} from "../../utils/ErrorUtils";
import {
	CommandMissionShopAlreadyBoughtPointsThisWeek,
	CommandMissionShopAlreadyHadBadge,
	CommandMissionShopBadge,
	CommandMissionShopKingsFavor,
	CommandMissionShopMoney,
	CommandMissionShopNoMissionToSkip,
	CommandMissionShopNoPet,
	CommandMissionShopPetInformation,
	CommandMissionShopSkipMissionResult
} from "../../../../Lib/src/packets/commands/CommandMissionShopPacket";
import {
	handleLovePointsValueShopItem,
	handleMissionShopBadge,
	handleMissionShopKingsFavor,
	handleMissionShopMoney,
	skipMissionShopResult
} from "../../commands/mission/MissionShop";
import {
	CommandTopGuildsEmptyPacket,
	CommandTopInvalidPagePacket,
	CommandTopPacketResGlory,
	CommandTopPacketResGuild,
	CommandTopPacketResScore,
	CommandTopPlayersEmptyPacket
} from "../../../../Lib/src/packets/commands/CommandTopPacket";
import {
	handleCommandTopGuildsEmptyPacket,
	handleCommandTopInvalidPagePacket,
	handleCommandTopPacketResGlory,
	handleCommandTopPacketResGuild,
	handleCommandTopPacketResScore,
	handleCommandTopPlayersEmptyPacket
} from "../../commands/player/TopCommand";
import {
	CommandGuildElderAcceptPacketRes,
	CommandGuildElderAlreadyElderPacketRes,
	CommandGuildElderFoundPlayerPacketRes,
	CommandGuildElderHimselfPacketRes,
	CommandGuildElderRefusePacketRes,
	CommandGuildElderSameGuildPacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildElderPacket";
import {
	handleCommandGuildElderAcceptPacketRes,
	handleCommandGuildElderRefusePacketRes
} from "../../commands/guild/GuildElderCommand";

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

	@packetHandler(CommandProfilePlayerNotFound)
	async profilePlayerNotFound(_packet: CommandProfilePlayerNotFound, context: PacketContext): Promise<void> {
		await handleClassicError(context, "error:playerDoesntExist");
	}

	@packetHandler(CommandProfilePacketRes)
	async profileRes(packet: CommandProfilePacketRes, context: PacketContext): Promise<void> {
		await handleCommandProfilePacketRes(packet, context);
	}

	@packetHandler(CommandPetPacketRes)
	async petRes(packet: CommandPetPacketRes, context: PacketContext): Promise<void> {
		await handleCommandPetPacketRes(packet, context);
	}

	@packetHandler(CommandPetPetNotFound)
	async petNotFound(_packet: CommandPetPetNotFound, context: PacketContext): Promise<void> {
		await handleClassicError(context, "error:petDoesntExist");
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

	@packetHandler(CommandGuildInviteInvitedPlayerIsDead)
	async guildInviteInvitedPlayerIsDead(packet: CommandGuildInviteInvitedPlayerIsDead, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:effects.dead.other");
	}

	@packetHandler(CommandGuildInviteInvitingPlayerNotInGuild)
	async guildInviteInvitingPlayerNotInGuild(packet: CommandGuildInviteInvitingPlayerNotInGuild, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:notInAGuild");
	}

	@packetHandler(CommandGuildInviteLevelTooLow)
	async guildInviteLevelTooLow(packet: CommandGuildInviteLevelTooLow, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:targetLevelTooLow");
	}

	@packetHandler(CommandGuildInviteGuildIsFull)
	async guildInviteGuildIsFull(packet: CommandGuildInviteGuildIsFull, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.guildIsFull");
	}

	@packetHandler(CommandGuildInviteInvitedPlayerIsOnPveIsland)
	async guildInviteInvitedPlayerIsOnPveIsland(packet: CommandGuildInviteInvitedPlayerIsOnPveIsland, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.playerIsOnPveIsland");
	}

	@packetHandler(CommandGuildInviteAlreadyInAGuild)
	async guildInviteAlreadyInAGuild(packet: CommandGuildInviteAlreadyInAGuild, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.playerIsAlreadyInAGuild");
	}

	@packetHandler(CommandGuildInviteRefusePacketRes)
	async guildInviteRefuseRes(packet: CommandGuildInviteRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildInviteAcceptPacketRes)
	async guildInviteAcceptRes(packet: CommandGuildInviteAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildInviteAcceptPacketRes(packet, context);
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

	@packetHandler(CommandGuildElderSameGuildPacketRes)
	async guildElderSameGuildRes(packet: CommandGuildElderSameGuildPacketRes, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:guildElder.notSameGuild");
	}

	@packetHandler(CommandGuildElderHimselfPacketRes)
	async guildElderHimselfRes(packet: CommandGuildElderHimselfPacketRes, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:guildElder.chiefError");
	}

	@packetHandler(CommandGuildElderAlreadyElderPacketRes)
	async guildElderAlreadyElderRes(packet: CommandGuildElderAlreadyElderPacketRes, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:guildElder.alreadyElder");
	}

	@packetHandler(CommandGuildElderFoundPlayerPacketRes)
	async guildElderFoundPlayerRes(packet: CommandGuildElderFoundPlayerPacketRes, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:guildElder.playerNotFound");
	}

	@packetHandler(CommandGuildElderRefusePacketRes)
	async guildElderRefuseRes(packet: CommandGuildElderRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildElderRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildElderAcceptPacketRes)
	async guildElderAcceptRes(packet: CommandGuildElderAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandGuildElderAcceptPacketRes(packet, context);
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
	async respawnErrorAlreadyAlive(_packet: CommandRespawnErrorAlreadyAlive, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:respawn.alreadyAlive");
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

	@packetHandler(CommandShopNotEnoughCurrency)
	async shopNotEnoughMoney(packet: CommandShopNotEnoughCurrency, context: PacketContext): Promise<void> {
		await handleCommandShopNotEnoughMoney(packet, context);
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
		await handleClassicError(context, "commands:guildDaily.pveIslandError");
	}

	@packetHandler(CommandDailyBonusPacketRes)
	async dailyBonusRes(packet: CommandDailyBonusPacketRes, context: PacketContext): Promise<void> {
		await handleDailyBonusRes(context, packet);
	}

	@packetHandler(CommandDailyBonusObjectDoNothing)
	async dailyBonusObjectDoNothing(_packet: CommandDailyBonusObjectDoNothing, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.objectDoNothingError");
	}

	@packetHandler(CommandDailyBonusObjectIsActiveDuringFights)
	async dailyBonusObjectIsActiveDuringFights(_packet: CommandDailyBonusObjectIsActiveDuringFights, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.objectIsActiveDuringFights");
	}

	@packetHandler(CommandDailyBonusNoActiveObject)
	async dailyBonusNoActiveObject(_packet: CommandDailyBonusNoActiveObject, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.noActiveObject");
	}

	@packetHandler(CommandDailyBonusInCooldown)
	async dailyBonusInCooldown(packet: CommandDailyBonusInCooldown, context: PacketContext): Promise<void> {
		await handleDailyBonusCooldownError(context, packet.lastDailyTimestamp, packet.timeBetweenDailies);
	}

	@packetHandler(CommandUnlockHimself)
	async unlockHimself(_packet: CommandUnlockHimself, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:unlock.himself");
	}

	@packetHandler(CommandUnlockNotInJail)
	async unlockNotInJail(_packet: CommandUnlockNotInJail, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:unlock.notInJail");
	}

	@packetHandler(CommandUnlockNoPlayerFound)
	async unlockNoPlayerFound(_packet: CommandUnlockNoPlayerFound, context: PacketContext): Promise<void> {
		await handleClassicError(context, "error:playerDoesntExist");
	}

	@packetHandler(CommandUnlockNotEnoughMoney)
	async unlockNotEnoughMoney(packet: CommandUnlockNotEnoughMoney, context: PacketContext): Promise<void> {
		await handleCommandUnlockNotEnoughMoneyError(packet, context);
	}

	@packetHandler(CommandUnlockRefusePacketRes)
	async unlockRefuseRes(packet: CommandUnlockRefusePacketRes, context: PacketContext): Promise<void> {
		await handleCommandUnlockRefusePacketRes(packet, context);
	}

	@packetHandler(CommandUnlockAcceptPacketRes)
	async unlockAcceptRes(packet: CommandUnlockAcceptPacketRes, context: PacketContext): Promise<void> {
		await handleCommandUnlockAcceptPacketRes(packet, context);

	}

	@packetHandler(CommandTopPacketResScore)
	async topScoreRes(packet: CommandTopPacketResScore, context: PacketContext): Promise<void> {
		await handleCommandTopPacketResScore(context, packet);
	}

	@packetHandler(CommandTopPacketResGlory)
	async topGloryRes(packet: CommandTopPacketResGlory, context: PacketContext): Promise<void> {
		await handleCommandTopPacketResGlory(context, packet);
	}

	@packetHandler(CommandTopPacketResGuild)
	async topGuildRes(packet: CommandTopPacketResGuild, context: PacketContext): Promise<void> {
		await handleCommandTopPacketResGuild(context, packet);
	}

	@packetHandler(CommandTopInvalidPagePacket)
	async topInvalidPageRes(packet: CommandTopInvalidPagePacket, context: PacketContext): Promise<void> {
		await handleCommandTopInvalidPagePacket(context, packet);
	}

	@packetHandler(CommandTopPlayersEmptyPacket)
	async topPlayersEmptyRes(_packet: CommandTopPlayersEmptyPacket, context: PacketContext): Promise<void> {
		await handleCommandTopPlayersEmptyPacket(context);
	}

	@packetHandler(CommandTopGuildsEmptyPacket)
	async topGuildsEmptyRes(_packet: CommandTopGuildsEmptyPacket, context: PacketContext): Promise<void> {
		await handleCommandTopGuildsEmptyPacket(context);
	}

	@packetHandler(CommandMissionShopAlreadyBoughtPointsThisWeek)
	async missionShopAlreadyBoughtPointsThisWeek(_packet: CommandMissionShopAlreadyBoughtPointsThisWeek, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.alreadyBoughtPointsThisWeek");
	}

	@packetHandler(CommandMissionShopPetInformation)
	async missionShopPetInformation(packet: CommandMissionShopPetInformation, context: PacketContext): Promise<void> {
		await handleLovePointsValueShopItem(packet, context);
	}

	@packetHandler(CommandMissionShopSkipMissionResult)
	async missionShopSkipMissionResult(packet: CommandMissionShopSkipMissionResult, context: PacketContext): Promise<void> {
		await skipMissionShopResult(packet, context);
	}

	@packetHandler(CommandMissionShopMoney)
	async missionShopMoney(packet: CommandMissionShopMoney, context: PacketContext): Promise<void> {
		await handleMissionShopMoney(packet, context);
	}

	@packetHandler(CommandMissionShopKingsFavor)
	async missionShopKingsFavor(_packet: CommandMissionShopKingsFavor, context: PacketContext): Promise<void> {
		await handleMissionShopKingsFavor(context);
	}

	@packetHandler(CommandMissionShopBadge)
	async missionShopBadge(_packet: CommandMissionShopBadge, context: PacketContext): Promise<void> {
		await handleMissionShopBadge(context);
	}

	@packetHandler(CommandMissionShopNoMissionToSkip)
	async missionShopNoMissionToSkip(_packet: CommandMissionShopNoMissionToSkip, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.noMissionToSkip");
	}

	@packetHandler(CommandMissionShopAlreadyHadBadge)
	async missionShopAlreadyHadBadge(_packet: CommandMissionShopAlreadyHadBadge, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.alreadyHadBadge");
	}

	@packetHandler(CommandMissionShopNoPet)
	async missionShopNoPet(_packet: CommandMissionShopNoPet, context: PacketContext): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.noPet");
	}
}
import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketRes} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {draftBotClient, shardId} from "../../bot/DraftBotShard";
import {CommandProfilePacketRes, CommandProfilePlayerNotFound} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
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
import {handleCommandGuildCreateAcceptPacketRes, handleCommandGuildCreatePacketRes, handleCommandGuildCreateRefusePacketRes} from "../../commands/guild/GuildCreateCommand";
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
import {handleCommandPetFreeAcceptPacketRes, handleCommandPetFreePacketRes, handleCommandPetFreeRefusePacketRes} from "../../commands/pet/PetFreeCommand";
import {CommandPetFreeAcceptPacketRes, CommandPetFreePacketRes, CommandPetFreeRefusePacketRes} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {CommandPetNickPacketRes} from "../../../../Lib/src/packets/commands/CommandPetNickPacket";
import {handleCommandPetNickPacketRes} from "../../commands/pet/PetNickCommand";
import {CommandGuildCreateAcceptPacketRes, CommandGuildCreatePacketRes, CommandGuildCreateRefusePacketRes} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
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
import {handleCommandGuildInviteAcceptPacketRes, handleCommandGuildInviteError, handleCommandGuildInviteRefusePacketRes} from "../../commands/guild/GuildInviteCommand.js";
import {CommandClassesInfoPacketRes} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";
import {handleCommandClassesInfoPacketRes} from "../../commands/player/ClassesInfoCommand";
import {CommandRespawnErrorAlreadyAlive, CommandRespawnPacketRes} from "../../../../Lib/src/packets/commands/CommandRespawnPacket";
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
import {handleCommandMissionPlayerNotFoundPacket, handleCommandMissionsPacketRes} from "../../commands/mission/MissionsCommand";
import {CommandMissionPlayerNotFoundPacket, CommandMissionsPacketRes} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {CommandGuildShopEmpty, CommandGuildShopGiveXp, CommandGuildShopNoFoodStorageSpace} from "../../../../Lib/src/packets/commands/CommandGuildShopPacket";
import {handleCommandGuildShopEmpty, handleCommandGuildShopGiveXp, handleCommandGuildShopNoFoodStorageSpace} from "../../commands/guild/GuildShopCommand";
import {CommandGuildDailyCooldownErrorPacket, CommandGuildDailyPveIslandErrorPacket, CommandGuildDailyRewardPacket} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {handleCommandGuildDailyCooldownErrorPacket, handleCommandGuildDailyRewardPacket} from "../../commands/guild/GuildDailyCommand";
import {CommandGuildKickAcceptPacketRes, CommandGuildKickPacketRes, CommandGuildKickRefusePacketRes} from "../../../../Lib/src/packets/commands/CommandGuildKickPacket";
import {handleCommandGuildKickAcceptPacketRes, handleCommandGuildKickPacketRes, handleCommandGuildKickRefusePacketRes} from "../../commands/guild/GuildKickCommand";
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
import {handleCommandUnlockAcceptPacketRes, handleCommandUnlockNotEnoughMoneyError, handleCommandUnlockRefusePacketRes} from "../../commands/player/UnlockCommand";
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
import {handleLovePointsValueShopItem, handleMissionShopBadge, handleMissionShopKingsFavor, handleMissionShopMoney, skipMissionShopResult} from "../../commands/mission/MissionShop";
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
	CommandGuildElderRemoveAcceptPacketRes,
	CommandGuildElderRemoveNoElderPacket,
	CommandGuildElderRemoveRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildElderRemovePacket";
import {
	handleCommandGuildLeaveAcceptPacketRes,
	handleCommandGuildLeaveRefusePacketRes
} from "../../commands/guild/GuildLeaveCommand";
import {handleCommandGuildElderAcceptPacketRes, handleCommandGuildElderRefusePacketRes} from "../../commands/guild/GuildElderCommand";
import {CommandSwitchCancelled, CommandSwitchErrorNoItemToSwitch, CommandSwitchSuccess} from "../../../../Lib/src/packets/commands/CommandSwitchPacket";
import {handleItemSwitch} from "../../commands/player/SwitchCommand";
import {
	CommandGuildLeaveAcceptPacketRes, CommandGuildLeaveNotInAGuildPacketRes,
	CommandGuildLeaveRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
import {
	handleCommandGuildElderRemoveAcceptPacketRes,
	handleCommandGuildElderRemoveRefusePacketRes
} from "../../commands/guild/GuildElderRemoveCommand";
import {
	CommandGuildDescriptionAcceptPacketRes,
	CommandGuildDescriptionNoGuildPacket,
	CommandGuildDescriptionNotAnElderPacket,
	CommandGuildDescriptionRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildDescriptionPacket";
import {
	handleCommandGuildDescriptionAcceptPacketRes,
	handleCommandGuildDescriptionRefusePacketRes
} from "../../commands/guild/GuildDescriptionCommand";
import {
	CommandDrinkCancelDrink,
	CommandDrinkConsumePotionRes, CommandDrinkNoActiveObjectError, CommandDrinkObjectIsActiveDuringFights
} from "../../../../Lib/src/packets/commands/CommandDrinkPacket";
import {handleDrinkConsumePotion} from "../../commands/player/DrinkCommand";
import {
	CommandJoinBoatAcceptPacketRes,
	CommandJoinBoatNoGuildPacketRes,
	CommandJoinBoatNoMemberOnBoatPacketRes,
	CommandJoinBoatNotEnoughEnergyPacketRes,
	CommandJoinBoatNotEnoughGemsPacketRes, CommandJoinBoatRefusePacketRes,
	CommandJoinBoatTooManyRunsPacketRes
} from "../../../../Lib/src/packets/commands/CommandJoinBoatPacket";
import {
	handleCommandJoinBoatAcceptPacketRes,
	handleCommandJoinBoatRefusePacketRes
} from "../../commands/player/JoinBoatCommand";

export default class CommandHandlers {
	@packetHandler(CommandPingPacketRes)
	async pingRes(context: PacketContext, packet: CommandPingPacketRes): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			content: i18n.t("commands:ping.discord.edit", {
				lng: interaction?.userLanguage,
				totalLatency: Date.now() - packet.clientTime,
				discordApiLatency: draftBotClient!.ws.ping,
				shardId,
				totalShards: draftBotClient!.shard!.count - 1
			})
		});
	}

	@packetHandler(CommandProfilePlayerNotFound)
	async profilePlayerNotFound(context: PacketContext, _packet: CommandProfilePlayerNotFound): Promise<void> {
		await handleClassicError(context, "error:playerDoesntExist");
	}

	@packetHandler(CommandProfilePacketRes)
	async profileRes(context: PacketContext, packet: CommandProfilePacketRes): Promise<void> {
		await handleCommandProfilePacketRes(packet, context);
	}

	@packetHandler(CommandPetPacketRes)
	async petRes(context: PacketContext, packet: CommandPetPacketRes): Promise<void> {
		await handleCommandPetPacketRes(packet, context);
	}

	@packetHandler(CommandPetPetNotFound)
	async petNotFound(context: PacketContext, _packet: CommandPetPetNotFound): Promise<void> {
		await handleClassicError(context, "error:petDoesntExist");
	}

	@packetHandler(CommandPetFreePacketRes)
	async petFreeRes(context: PacketContext, packet: CommandPetFreePacketRes): Promise<void> {
		await handleCommandPetFreePacketRes(packet, context);
	}

	@packetHandler(CommandPetFreeRefusePacketRes)
	async petFreeRefuseRes(context: PacketContext, _packet: CommandPetFreeRefusePacketRes): Promise<void> {
		await handleCommandPetFreeRefusePacketRes(context);
	}

	@packetHandler(CommandPetFreeAcceptPacketRes)
	async petFreeAcceptRes(context: PacketContext, packet: CommandPetFreeAcceptPacketRes): Promise<void> {
		await handleCommandPetFreeAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandPetNickPacketRes)
	async PetNickPacketRes(context: PacketContext, packet: CommandPetNickPacketRes): Promise<void> {
		await handleCommandPetNickPacketRes(packet, context);
	}

	@packetHandler(CommandGuildPacketRes)
	async guildRes(context: PacketContext, packet: CommandGuildPacketRes): Promise<void> {
		await handleCommandGuildPacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreatePacketRes)
	async guildCreateRes(context: PacketContext, packet: CommandGuildCreatePacketRes): Promise<void> {
		await handleCommandGuildCreatePacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreateRefusePacketRes)
	async guildCreateRefuseRes(context: PacketContext, _packet: CommandGuildCreateRefusePacketRes): Promise<void> {
		await handleCommandGuildCreateRefusePacketRes(context);
	}

	@packetHandler(CommandGuildInviteInvitedPlayerIsDead)
	async guildInviteInvitedPlayerIsDead(context: PacketContext, packet: CommandGuildInviteInvitedPlayerIsDead): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:effects.dead.other");
	}

	@packetHandler(CommandGuildInviteInvitingPlayerNotInGuild)
	async guildInviteInvitingPlayerNotInGuild(context: PacketContext, packet: CommandGuildInviteInvitingPlayerNotInGuild): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:notInAGuild");
	}

	@packetHandler(CommandGuildInviteLevelTooLow)
	async guildInviteLevelTooLow(context: PacketContext, packet: CommandGuildInviteLevelTooLow): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "error:targetLevelTooLow");
	}

	@packetHandler(CommandGuildInviteGuildIsFull)
	async guildInviteGuildIsFull(context: PacketContext, packet: CommandGuildInviteGuildIsFull): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.guildIsFull");
	}

	@packetHandler(CommandGuildInviteInvitedPlayerIsOnPveIsland)
	async guildInviteInvitedPlayerIsOnPveIsland(context: PacketContext, packet: CommandGuildInviteInvitedPlayerIsOnPveIsland): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.playerIsOnPveIsland");
	}

	@packetHandler(CommandGuildInviteAlreadyInAGuild)
	async guildInviteAlreadyInAGuild(context: PacketContext, packet: CommandGuildInviteAlreadyInAGuild): Promise<void> {
		await handleCommandGuildInviteError(packet, context, "commands:guildInvite.errors.playerIsAlreadyInAGuild");
	}

	@packetHandler(CommandGuildInviteRefusePacketRes)
	async guildInviteRefuseRes(context: PacketContext, packet: CommandGuildInviteRefusePacketRes): Promise<void> {
		await handleCommandGuildInviteRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildInviteAcceptPacketRes)
	async guildInviteAcceptRes(context: PacketContext, packet: CommandGuildInviteAcceptPacketRes): Promise<void> {
		await handleCommandGuildInviteAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandGuildCreateAcceptPacketRes)
	async guildCreateAcceptRes(context: PacketContext, packet: CommandGuildCreateAcceptPacketRes): Promise<void> {
		await handleCommandGuildCreateAcceptPacketRes(packet, context);
	}

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

	@packetHandler(CommandGuildElderSameGuildPacketRes)
	async guildElderSameGuildRes(context: PacketContext, _packet: CommandGuildElderSameGuildPacketRes): Promise<void> {
		await handleClassicError(context, "commands:guildElder.notSameGuild");
	}

	@packetHandler(CommandGuildElderHimselfPacketRes)
	async guildElderHimselfRes(context: PacketContext, _packet: CommandGuildElderHimselfPacketRes): Promise<void> {
		await handleClassicError(context, "commands:guildElder.chiefError");
	}

	@packetHandler(CommandGuildElderAlreadyElderPacketRes)
	async guildElderAlreadyElderRes(context: PacketContext, _packet: CommandGuildElderAlreadyElderPacketRes): Promise<void> {
		await handleClassicError(context, "commands:guildElder.alreadyElder");
	}

	@packetHandler(CommandGuildElderFoundPlayerPacketRes)
	async guildElderFoundPlayerRes(context: PacketContext, _packet: CommandGuildElderFoundPlayerPacketRes): Promise<void> {
		await handleClassicError(context, "commands:guildElder.playerNotFound");
	}

	@packetHandler(CommandGuildElderRefusePacketRes)
	async guildElderRefuseRes(context: PacketContext, packet: CommandGuildElderRefusePacketRes): Promise<void> {
		await handleCommandGuildElderRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildElderAcceptPacketRes)
	async guildElderAcceptRes(context: PacketContext, packet: CommandGuildElderAcceptPacketRes): Promise<void> {
		await handleCommandGuildElderAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandGuildLeaveNotInAGuildPacketRes)
	async guildLeaveNotInAGuildRes(context: PacketContext, _packet: CommandGuildLeaveNotInAGuildPacketRes): Promise<void> {
		await handleClassicError(context, "commands:guildLeave.notInAGuild");
	}

	@packetHandler(CommandGuildLeaveRefusePacketRes)
	async guildLeaveRefuseRes(context: PacketContext, _packet: CommandGuildLeaveRefusePacketRes): Promise<void> {
		await handleCommandGuildLeaveRefusePacketRes(context);
	}

	@packetHandler(CommandGuildLeaveAcceptPacketRes)
	async guildLeaveAcceptRes(context: PacketContext, packet: CommandGuildLeaveAcceptPacketRes): Promise<void> {
		await handleCommandGuildLeaveAcceptPacketRes(packet,context);
	}

	@packetHandler(CommandGuildElderRemoveNoElderPacket)
	async guildElderRemoveFoundPlayerRes(context: PacketContext, _packet: CommandGuildElderRemoveNoElderPacket): Promise<void> {
		await handleClassicError(context, "commands:guildElderRemove.noElder");
	}

	@packetHandler(CommandGuildElderRemoveRefusePacketRes)
	async guildElderRemoveRefuseRes(context: PacketContext, packet: CommandGuildElderRemoveRefusePacketRes): Promise<void> {
		await handleCommandGuildElderRemoveRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildElderRemoveAcceptPacketRes)
	async guildElderRemoveAcceptRes(context: PacketContext, packet: CommandGuildElderRemoveAcceptPacketRes): Promise<void> {
		await handleCommandGuildElderRemoveAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandGuildDescriptionNoGuildPacket)
	async guildDescriptionNoGuildRes(context: PacketContext, _packet: CommandGuildElderRemoveNoElderPacket): Promise<void> {
		await handleClassicError(context, "commands:guildDescription.noGuild");
	}

	@packetHandler(CommandGuildDescriptionNotAnElderPacket)
	async guildDescriptionNotAnElderRes(context: PacketContext, _packet: CommandGuildDescriptionNotAnElderPacket): Promise<void> {
		await handleClassicError(context, "commands:guildDescription.notAnElder");
	}

	@packetHandler(CommandGuildDescriptionRefusePacketRes)
	async guildDescriptionRefuseRes(context: PacketContext, packet: CommandGuildDescriptionRefusePacketRes): Promise<void> {
		await handleCommandGuildDescriptionRefusePacketRes(packet, context);
	}

	@packetHandler(CommandGuildDescriptionAcceptPacketRes)
	async guildDescriptionAcceptRes(context: PacketContext, packet: CommandGuildDescriptionAcceptPacketRes): Promise<void> {
		await handleCommandGuildDescriptionAcceptPacketRes(packet, context);
	}


	@packetHandler(CommandInventoryPacketRes)
	async inventoryRes(context: PacketContext, packet: CommandInventoryPacketRes): Promise<void> {
		await handleCommandInventoryPacketRes(packet, context);
	}

	@packetHandler(CommandUpdatePacketRes)
	async updateRes(context: PacketContext, packet: CommandUpdatePacketRes): Promise<void> {
		await handleCommandUpdatePacketRes(packet, context);
	}

	@packetHandler(CommandTestPacketRes)
	async testRes(context: PacketContext, packet: CommandTestPacketRes): Promise<void> {
		await handleCommandTestPacketRes(packet, context);
	}

	@packetHandler(CommandRarityPacketRes)
	async rarityRes(context: PacketContext, packet: CommandRarityPacketRes): Promise<void> {
		await handleCommandRarityPacketRes(packet, context);
	}

	@packetHandler(CommandReportBigEventResultRes)
	async reportResultRes(context: PacketContext, packet: CommandReportBigEventResultRes): Promise<void> {
		await reportResult(packet, context);
	}

	@packetHandler(CommandReportTravelSummaryRes)
	async reportTravelSummaryRes(context: PacketContext, packet: CommandReportTravelSummaryRes): Promise<void> {
		await reportTravelSummary(packet, context);
	}

	@packetHandler(CommandMapDisplayRes)
	async mapRes(context: PacketContext, packet: CommandMapDisplayRes): Promise<void> {
		await handleCommandMapDisplayRes(packet, context);
	}

	@packetHandler(CommandReportMonsterRewardRes)
	async reportMonsterRewardRes(_context: PacketContext, _packet: CommandReportMonsterRewardRes): Promise<void> {
		// TODO
	}

	@packetHandler(CommandReportErrorNoMonsterRes)
	async reportErrorNoMonsterRes(_context: PacketContext, _packet: CommandReportErrorNoMonsterRes): Promise<void> {
		// TODO
	}

	@packetHandler(CommandReportRefusePveFightRes)
	async reportRefusePveFightRes(_context: PacketContext, _packet: CommandReportRefusePveFightRes): Promise<void> {
		// TODO
	}

	@packetHandler(CommandClassesInfoPacketRes)
	async classesInfoRes(context: PacketContext, packet: CommandClassesInfoPacketRes): Promise<void> {
		await handleCommandClassesInfoPacketRes(packet, context);
	}

	@packetHandler(CommandRespawnPacketRes)
	async respawnRes(context: PacketContext, packet: CommandRespawnPacketRes): Promise<void> {
		await handleCommandRespawnPacketRes(packet, context);
	}

	@packetHandler(CommandRespawnErrorAlreadyAlive)
	async respawnErrorAlreadyAlive(context: PacketContext, _packet: CommandRespawnErrorAlreadyAlive): Promise<void> {
		await handleClassicError(context, "commands:respawn.alreadyAlive");
	}

	@packetHandler(CommandShopClosed)
	async shopClosed(context: PacketContext, _packet: CommandShopClosed): Promise<void> {
		await handleCommandShopClosed(context);
	}

	@packetHandler(CommandShopNoAlterationToHeal)
	async shopNoAlterationToHeal(context: PacketContext, _packet: CommandShopNoAlterationToHeal): Promise<void> {
		await handleCommandShopNoAlterationToHeal(context);
	}

	@packetHandler(CommandShopHealAlterationDone)
	async shopHealAlterationDone(context: PacketContext, _packet: CommandShopHealAlterationDone): Promise<void> {
		await handleCommandShopHealAlterationDone(context);
	}

	@packetHandler(CommandShopTooManyEnergyBought)
	async shopTooManyEnergyBought(context: PacketContext, _packet: CommandShopTooManyEnergyBought): Promise<void> {
		await handleCommandShopTooManyEnergyBought(context);
	}

	@packetHandler(CommandShopNoEnergyToHeal)
	async shopNoEnergyToHeal(context: PacketContext, _packet: CommandShopNoEnergyToHeal): Promise<void> {
		await handleCommandShopNoEnergyToHeal(context);
	}

	@packetHandler(CommandShopFullRegen)
	async shopFullRegen(context: PacketContext, _packet: CommandShopFullRegen): Promise<void> {
		await handleCommandShopFullRegen(context);
	}

	@packetHandler(CommandShopAlreadyHaveBadge)
	async shopAlreadyHaveBadge(context: PacketContext, _packet: CommandShopAlreadyHaveBadge): Promise<void> {
		await handleCommandShopAlreadyHaveBadge(context);
	}

	@packetHandler(CommandShopBadgeBought)
	async shopBadgeBought(context: PacketContext, _packet: CommandShopBadgeBought): Promise<void> {
		await handleCommandShopBadgeBought(context);
	}

	@packetHandler(CommandShopBoughtTooMuchDailyPotions)
	async shopBoughtTooMuchDailyPotions(context: PacketContext, _packet: CommandShopBoughtTooMuchDailyPotions): Promise<void> {
		await handleCommandShopBoughtTooMuchDailyPotions(context);
	}

	@packetHandler(CommandShopNotEnoughCurrency)
	async shopNotEnoughMoney(context: PacketContext, packet: CommandShopNotEnoughCurrency): Promise<void> {
		await handleCommandShopNotEnoughMoney(packet, context);
	}

	@packetHandler(ReactionCollectorBuyCategorySlotBuySuccess)
	async buyCategorySlotBuySuccess(context: PacketContext, _packet: ReactionCollectorBuyCategorySlotBuySuccess): Promise<void> {
		await handleReactionCollectorBuyCategorySlotBuySuccess(context);
	}

	@packetHandler(CommandMaintenancePacketRes)
	async maintenanceReq(context: PacketContext, packet: CommandMaintenancePacketRes): Promise<void> {
		await handleCommandMaintenancePacketRes(packet, context);
	}

	@packetHandler(CommandMissionPlayerNotFoundPacket)
	async commandMissionPlayerNotFound(context: PacketContext, _packet: CommandMissionPlayerNotFoundPacket): Promise<void> {
		await handleCommandMissionPlayerNotFoundPacket(context);
	}

	@packetHandler(CommandMissionsPacketRes)
	async missionsCommandRes(context: PacketContext, packet: CommandMissionsPacketRes): Promise<void> {
		await handleCommandMissionsPacketRes(packet, context);
	}

	@packetHandler(CommandGuildShopNoFoodStorageSpace)
	async guildShopNoFoodStorageSpace(context: PacketContext, _packet: CommandGuildShopNoFoodStorageSpace): Promise<void> {
		await handleCommandGuildShopNoFoodStorageSpace(context);
	}

	@packetHandler(CommandGuildShopEmpty)
	async guildShopEmpty(context: PacketContext, _packet: CommandGuildShopEmpty): Promise<void> {
		await handleCommandGuildShopEmpty(context);
	}

	@packetHandler(CommandGuildShopGiveXp)
	async guildShopGiveXp(context: PacketContext, packet: CommandGuildShopGiveXp): Promise<void> {
		await handleCommandGuildShopGiveXp(packet, context);
	}

	@packetHandler(CommandGuildDailyRewardPacket)
	async guildDailyReward(context: PacketContext, packet: CommandGuildDailyRewardPacket): Promise<void> {
		await handleCommandGuildDailyRewardPacket(packet, context);
	}

	@packetHandler(CommandGuildDailyCooldownErrorPacket)
	async guildDailyCooldownError(context: PacketContext, packet: CommandGuildDailyCooldownErrorPacket): Promise<void> {
		await handleCommandGuildDailyCooldownErrorPacket(packet, context);
	}

	@packetHandler(CommandGuildDailyPveIslandErrorPacket)
	async guildDailyPveIslandError(context: PacketContext, _packet: CommandGuildDailyPveIslandErrorPacket): Promise<void> {
		await handleClassicError(context, "commands:guildDaily.pveIslandError");
	}

	@packetHandler(CommandDailyBonusPacketRes)
	async dailyBonusRes(context: PacketContext, packet: CommandDailyBonusPacketRes): Promise<void> {
		await handleDailyBonusRes(context, packet);
	}

	@packetHandler(CommandDailyBonusObjectDoNothing)
	async dailyBonusObjectDoNothing(context: PacketContext, _packet: CommandDailyBonusObjectDoNothing): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.objectDoNothingError");
	}

	@packetHandler(CommandDailyBonusObjectIsActiveDuringFights)
	async dailyBonusObjectIsActiveDuringFights(context: PacketContext, _packet: CommandDailyBonusObjectIsActiveDuringFights): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.objectIsActiveDuringFights");
	}

	@packetHandler(CommandDailyBonusNoActiveObject)
	async dailyBonusNoActiveObject(context: PacketContext, _packet: CommandDailyBonusNoActiveObject): Promise<void> {
		await handleClassicError(context, "commands:daily.errors.noActiveObject");
	}

	@packetHandler(CommandDailyBonusInCooldown)
	async dailyBonusInCooldown(context: PacketContext, packet: CommandDailyBonusInCooldown): Promise<void> {
		await handleDailyBonusCooldownError(context, packet.lastDailyTimestamp, packet.timeBetweenDailies);
	}

	@packetHandler(CommandUnlockHimself)
	async unlockHimself(context: PacketContext, _packet: CommandUnlockHimself): Promise<void> {
		await handleClassicError(context, "commands:unlock.himself");
	}

	@packetHandler(CommandUnlockNotInJail)
	async unlockNotInJail(context: PacketContext, _packet: CommandUnlockNotInJail): Promise<void> {
		await handleClassicError(context, "commands:unlock.notInJail");
	}

	@packetHandler(CommandUnlockNoPlayerFound)
	async unlockNoPlayerFound(context: PacketContext, _packet: CommandUnlockNoPlayerFound): Promise<void> {
		await handleClassicError(context, "error:playerDoesntExist");
	}

	@packetHandler(CommandUnlockNotEnoughMoney)
	async unlockNotEnoughMoney(context: PacketContext, packet: CommandUnlockNotEnoughMoney): Promise<void> {
		await handleCommandUnlockNotEnoughMoneyError(packet, context);
	}

	@packetHandler(CommandUnlockRefusePacketRes)
	async unlockRefuseRes(context: PacketContext, _packet: CommandUnlockRefusePacketRes): Promise<void> {
		await handleCommandUnlockRefusePacketRes(context);
	}

	@packetHandler(CommandUnlockAcceptPacketRes)
	async unlockAcceptRes(context: PacketContext, packet: CommandUnlockAcceptPacketRes): Promise<void> {
		await handleCommandUnlockAcceptPacketRes(packet, context);

	}

	@packetHandler(CommandTopPacketResScore)
	async topScoreRes(context: PacketContext, packet: CommandTopPacketResScore): Promise<void> {
		await handleCommandTopPacketResScore(context, packet);
	}

	@packetHandler(CommandTopPacketResGlory)
	async topGloryRes(context: PacketContext, packet: CommandTopPacketResGlory): Promise<void> {
		await handleCommandTopPacketResGlory(context, packet);
	}

	@packetHandler(CommandTopPacketResGuild)
	async topGuildRes(context: PacketContext, packet: CommandTopPacketResGuild): Promise<void> {
		await handleCommandTopPacketResGuild(context, packet);
	}

	@packetHandler(CommandTopInvalidPagePacket)
	async topInvalidPageRes(context: PacketContext, packet: CommandTopInvalidPagePacket): Promise<void> {
		await handleCommandTopInvalidPagePacket(context, packet);
	}

	@packetHandler(CommandTopPlayersEmptyPacket)
	async topPlayersEmptyRes(context: PacketContext, _packet: CommandTopPlayersEmptyPacket): Promise<void> {
		await handleCommandTopPlayersEmptyPacket(context);
	}

	@packetHandler(CommandTopGuildsEmptyPacket)
	async topGuildsEmptyRes(context: PacketContext, _packet: CommandTopGuildsEmptyPacket): Promise<void> {
		await handleCommandTopGuildsEmptyPacket(context);
	}

	@packetHandler(CommandMissionShopAlreadyBoughtPointsThisWeek)
	async missionShopAlreadyBoughtPointsThisWeek(context: PacketContext, _packet: CommandMissionShopAlreadyBoughtPointsThisWeek): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.alreadyBoughtPointsThisWeek");
	}

	@packetHandler(CommandMissionShopPetInformation)
	async missionShopPetInformation(context: PacketContext, packet: CommandMissionShopPetInformation): Promise<void> {
		await handleLovePointsValueShopItem(packet, context);
	}

	@packetHandler(CommandMissionShopSkipMissionResult)
	async missionShopSkipMissionResult(context: PacketContext, packet: CommandMissionShopSkipMissionResult): Promise<void> {
		await skipMissionShopResult(packet, context);
	}

	@packetHandler(CommandMissionShopMoney)
	async missionShopMoney(context: PacketContext, packet: CommandMissionShopMoney): Promise<void> {
		await handleMissionShopMoney(packet, context);
	}

	@packetHandler(CommandMissionShopKingsFavor)
	async missionShopKingsFavor(context: PacketContext, _packet: CommandMissionShopKingsFavor): Promise<void> {
		await handleMissionShopKingsFavor(context);
	}

	@packetHandler(CommandMissionShopBadge)
	async missionShopBadge(context: PacketContext, _packet: CommandMissionShopBadge): Promise<void> {
		await handleMissionShopBadge(context);
	}

	@packetHandler(CommandMissionShopNoMissionToSkip)
	async missionShopNoMissionToSkip(context: PacketContext, _packet: CommandMissionShopNoMissionToSkip): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.noMissionToSkip");
	}

	@packetHandler(CommandMissionShopAlreadyHadBadge)
	async missionShopAlreadyHadBadge(context: PacketContext, _packet: CommandMissionShopAlreadyHadBadge): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.alreadyHadBadge");
	}

	@packetHandler(CommandMissionShopNoPet)
	async missionShopNoPet(context: PacketContext, _packet: CommandMissionShopNoPet): Promise<void> {
		await handleClassicError(context, "commands:missionsshop.error.noPet");
	}

	@packetHandler(CommandSwitchSuccess)
	async switchSuccess(context: PacketContext, packet: CommandSwitchSuccess): Promise<void> {
		await handleItemSwitch(packet, context);
	}

	@packetHandler(CommandSwitchCancelled)
	async switchCancelled(context: PacketContext, _packet: CommandSwitchCancelled): Promise<void> {
		await handleClassicError(context, "commands:switch.cancelled");
	}

	@packetHandler(CommandSwitchErrorNoItemToSwitch)
	async switchErrorNoItemToSwitch(context: PacketContext, _packet: CommandSwitchErrorNoItemToSwitch): Promise<void> {
		await handleClassicError(context, "commands:switch.noItemToSwitch");
	}

	@packetHandler(CommandDrinkConsumePotionRes)
	async drinkConsumePotionRes(context: PacketContext, packet: CommandDrinkConsumePotionRes): Promise<void> {
		await handleDrinkConsumePotion(context, packet);
	}

	@packetHandler(CommandDrinkCancelDrink)
	async drinkCancelDrink(context: PacketContext, _packet: CommandDrinkCancelDrink): Promise<void> {
		await handleClassicError(context, "commands:drink.cancelled");
	}

	@packetHandler(CommandDrinkNoActiveObjectError)
	async drinkNoActiveObjectError(context: PacketContext, _packet: CommandDrinkNoActiveObjectError): Promise<void> {
		await handleClassicError(context, "commands:drink.noActiveObject");
	}

	@packetHandler(CommandDrinkObjectIsActiveDuringFights)
	async drinkObjectIsActiveDuringFights(context: PacketContext, _packet: CommandDrinkObjectIsActiveDuringFights): Promise<void> {
		await handleClassicError(context, "commands:drink.objectIsActiveDuringFights");
	}

	@packetHandler(CommandJoinBoatNoGuildPacketRes)
	async joinBoatNoGuild(context: PacketContext, _packet: CommandJoinBoatNoGuildPacketRes): Promise<void> {
		await handleClassicError(context, "commands:joinBoat.errorMessage.noGuild");
	}

	@packetHandler(CommandJoinBoatTooManyRunsPacketRes)
	async joinBoatTooManyRuns(context: PacketContext, _packet: CommandJoinBoatTooManyRunsPacketRes): Promise<void> {
		await handleClassicError(context, "commands:joinBoat.errorMessage.tooManyBoatThisWeek");
	}

	@packetHandler(CommandJoinBoatNoMemberOnBoatPacketRes)
	async joinBoatNoMemberOnBoat(context: PacketContext, _packet: CommandJoinBoatNoMemberOnBoatPacketRes): Promise<void> {
		await handleClassicError(context, "commands:joinBoat.errorMessage.noMemberOnBoat");
	}

	@packetHandler(CommandJoinBoatNotEnoughEnergyPacketRes)
	async joinBoatNotEnoughEnergy(context: PacketContext, _packet: CommandJoinBoatNotEnoughEnergyPacketRes): Promise<void> {
		await handleClassicError(context, "commands:joinBoat.errorMessage.notEnoughEnergy");
	}

	@packetHandler(CommandJoinBoatNotEnoughGemsPacketRes)
	async joinBoatNotEnoughGems(context: PacketContext, _packet: CommandJoinBoatNotEnoughGemsPacketRes): Promise<void> {
		await handleClassicError(context, "commands:joinBoat.errorMessage.notEnoughGems");
	}

	@packetHandler(CommandJoinBoatAcceptPacketRes)
	async joinBoatAcceptRes(context: PacketContext, packet: CommandJoinBoatAcceptPacketRes): Promise<void> {
		await handleCommandJoinBoatAcceptPacketRes(packet, context);
	}

	@packetHandler(CommandJoinBoatRefusePacketRes)
	async joinBoatRefuseRes(context: PacketContext, packet: CommandJoinBoatRefusePacketRes): Promise<void> {
		await handleCommandJoinBoatRefusePacketRes(packet, context);
	}
}
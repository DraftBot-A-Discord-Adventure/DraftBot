import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {CommandReportChooseDestinationRes} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {draftBotClient, keycloakConfig} from "../../bot/DraftBotShard";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {minutesToHours} from "../../../../Lib/src/utils/TimeUtils";
import {GuildLevelUpPacket} from "../../../../Lib/src/packets/events/GuildLevelUpPacket";
import {MissionsCompletedPacket} from "../../../../Lib/src/packets/events/MissionsCompletedPacket";
import {MissionsExpiredPacket} from "../../../../Lib/src/packets/events/MissionsExpiredPacket";
import {PlayerDeathPacket} from "../../../../Lib/src/packets/events/PlayerDeathPacket";
import {PlayerLeavePveIslandPacket} from "../../../../Lib/src/packets/events/PlayerLeavePveIslandPacket";
import {PlayerLevelUpPacket} from "../../../../Lib/src/packets/events/PlayerLevelUpPacket";
import {PlayerReceivePetPacket} from "../../../../Lib/src/packets/events/PlayerReceivePetPacket";
import {EmoteUtils} from "../../utils/EmoteUtils";
import {GiveFoodToGuildPacket} from "../../../../Lib/src/packets/utils/GiveFoodToGuildPacket";
import {NoFoodSpaceInGuildPacket} from "../../../../Lib/src/packets/utils/NoFoodSpaceInGuildPacket";
import {MissionUtils} from "../../utils/MissionUtils";
import {MissionType} from "../../../../Lib/src/types/CompletedMission";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

export default class EventsHandlers {
	@packetHandler(CommandReportChooseDestinationRes)
	async chooseDestinationRes(context: PacketContext, packet: CommandReportChooseDestinationRes): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		const lng = interaction.userLanguage;
		const embed = new DraftBotEmbed();
		embed.formatAuthor(i18n.t("commands:report.destinationTitle", {
			lng,
			pseudo: user.attributes.gameUsername
		}), interaction.user);
		let time = packet.tripDuration;
		let i18nTr: string;
		if (time < 60) {
			i18nTr = "commands:report.choseMapMinutes";
		}
		else {
			time = Math.round(minutesToHours(packet.tripDuration));
			i18nTr = "commands:report.choseMap";
		}
		embed.setDescription(i18n.t(i18nTr, {
			count: time,
			lng,
			mapPrefix: i18n.t(`models:map_types.${packet.mapTypeId}.prefix`, {lng}),
			mapType: (i18n.t(`models:map_types.${packet.mapTypeId}.name`, {lng}) as string).toLowerCase(),
			mapEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.map_types[packet.mapTypeId]),
			mapName: i18n.t(`models:map_locations.${packet.mapId}.name`, {lng}),
			time
		}));
		if (context.discord!.buttonInteraction) {
			await DiscordCache.getButtonInteraction(context.discord!.buttonInteraction)?.editReply({embeds: [embed]});
		}
		else {
			await interaction.channel.send({embeds: [embed]});
		}
	}

	@packetHandler(GuildLevelUpPacket)
	async guildLevelUp(_context: PacketContext, _packet: GuildLevelUpPacket): Promise<void> {
		// Todo
	}

	@packetHandler(MissionsCompletedPacket)
	async missionsCompleted(context: PacketContext, packet: MissionsCompletedPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))!;
		if (!user.attributes.discordId) {
			throw new Error(`User of keycloakId ${packet.keycloakId} has no discordId`);
		}
		const discordUser = draftBotClient.users.cache.get(user.attributes.discordId[0]);
		if (!interaction || !discordUser) {
			return;
		}

		const lng = interaction.userLanguage;
		const completedMissionsEmbed = new DraftBotEmbed().formatAuthor(i18n.t("notifications:missions.completed.title", {
			lng,
			count: packet.missions.length,
			pseudo: discordUser.displayName
		}), discordUser);

		const missionLists: Record<MissionType, string[]> = {
			[MissionType.CAMPAIGN]: [],
			[MissionType.DAILY]: [],
			[MissionType.NORMAL]: []
		};
		let totalGems = 0;
		let totalXP = 0;
		for (const mission of packet.missions) {
			totalGems += mission.gemsToWin;
			totalXP += mission.xpToWin;
			missionLists[mission.missionType].push(MissionUtils.formatCompletedMission(mission, lng));
		}
		for (const [missionType, missions] of Object.entries(missionLists).filter(entry => entry[1].length !== 0)) {
			completedMissionsEmbed.addFields({
				name: i18n.t(`notifications:missions.completed.subcategories.${missionType}`, {
					lng,
					count: missions.length
				}),
				value: missions.join("\n")
			});
		}
		if (packet.missions.length > 1) {
			completedMissionsEmbed.addFields({
				name: i18n.t("notifications:missions.completed.totalRewards", {
					lng
				}),
				value: i18n.t("notifications:missions.completed.totalDisplay", {
					lng,
					gems: totalGems,
					xp: totalXP
				})
			});
		}
		await interaction.channel.send({embeds: [completedMissionsEmbed]});
	}

	@packetHandler(MissionsExpiredPacket)
	async missionsExpired(context: PacketContext, packet: MissionsExpiredPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))!;
		if (!user.attributes.discordId) {
			throw new Error(`User of keycloakId ${packet.keycloakId} has no discordId`);
		}
		const discordUser = draftBotClient.users.cache.get(user.attributes.discordId[0]);
		if (!interaction || !discordUser) {
			return;
		}
		const lng = interaction.userLanguage;
		let missionsExpiredDescription = "";
		for (const mission of packet.missions) {
			missionsExpiredDescription += `- ${MissionUtils.formatBaseMission(mission, lng)} (${mission.numberDone}/${mission.missionObjective})\n`;
		}
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("notifications:missions.expired.title", {
						count: packet.missions.length,
						lng,
						pseudo: user.attributes.gameUsername[0]
					}), discordUser)
					.setDescription(i18n.t("notifications:missions.expired.description", {
						lng,
						count: packet.missions.length,
						missionsExpired: missionsExpiredDescription,
						interpolation: {escapeValue: false}
					}))]
		});
	}

	@packetHandler(PlayerDeathPacket)
	async playerDeath(_context: PacketContext, _packet: PlayerDeathPacket): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerLeavePveIslandPacket)
	async playerLeavePveIsland(_context: PacketContext, _packet: PlayerLeavePveIslandPacket): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerLevelUpPacket)
	async playerLevelUp(_context: PacketContext, _packet: PlayerLevelUpPacket): Promise<void> {
		// Todo
	}

	@packetHandler(PlayerReceivePetPacket)
	async playerReceivePet(_context: PacketContext, _packet: PlayerReceivePetPacket): Promise<void> {
		// Todo
	}

	@packetHandler(GiveFoodToGuildPacket)
	async giveFoodToGuild(context: PacketContext, packet: GiveFoodToGuildPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const foodId = PetConstants.PET_FOOD_BY_ID[packet.selectedFoodIndex];
		const lng = interaction!.userLanguage;

		await interaction?.followUp({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("notifications:guildFood.receivedFoodTitle", {lng}), interaction.user)
					.setDescription(
						i18n.t("notifications:guildFood.receivedFoodDescription", {
							lng,
							foodId,
							amount: packet.quantity,
							foodName: i18n.t(`models:foods.${foodId}`, {
								lng,
								count: packet.quantity
							})
						})
					)
			]
		});
	}

	@packetHandler(NoFoodSpaceInGuildPacket)
	async noFoodSpaceInGuild(_context: PacketContext, _packet: NoFoodSpaceInGuildPacket): Promise<void> {
		// Todo
	}
}
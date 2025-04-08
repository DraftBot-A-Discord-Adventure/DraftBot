import { packetHandler } from "../PacketHandler";
import { PacketContext } from "../../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { CommandReportChooseDestinationRes } from "../../../../Lib/src/packets/commands/CommandReportPacket";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import {
	draftBotClient, keycloakConfig
} from "../../bot/DraftBotShard";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import { minutesToHours } from "../../../../Lib/src/utils/TimeUtils";
import { GuildLevelUpPacket } from "../../../../Lib/src/packets/events/GuildLevelUpPacket";
import { MissionsCompletedPacket } from "../../../../Lib/src/packets/events/MissionsCompletedPacket";
import { MissionsExpiredPacket } from "../../../../Lib/src/packets/events/MissionsExpiredPacket";
import { PlayerDeathPacket } from "../../../../Lib/src/packets/events/PlayerDeathPacket";
import { PlayerLeavePveIslandPacket } from "../../../../Lib/src/packets/events/PlayerLeavePveIslandPacket";
import { PlayerLevelUpPacket } from "../../../../Lib/src/packets/events/PlayerLevelUpPacket";
import { PlayerReceivePetPacket } from "../../../../Lib/src/packets/events/PlayerReceivePetPacket";
import { EmoteUtils } from "../../utils/EmoteUtils";
import { GiveFoodToGuildPacket } from "../../../../Lib/src/packets/utils/GiveFoodToGuildPacket";
import { NoFoodSpaceInGuildPacket } from "../../../../Lib/src/packets/utils/NoFoodSpaceInGuildPacket";
import { MissionUtils } from "../../utils/MissionUtils";
import { MissionType } from "../../../../Lib/src/types/CompletedMission";
import { PetConstants } from "../../../../Lib/src/constants/PetConstants";
import { DisplayUtils } from "../../utils/DisplayUtils";
import { DraftBotErrorEmbed } from "../../messages/DraftBotErrorEmbed";

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
			mapPrefix: i18n.t(`models:map_types.${packet.mapTypeId}.prefix`, { lng }),
			mapType: (i18n.t(`models:map_types.${packet.mapTypeId}.name`, { lng }) as string).toLowerCase(),
			mapEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.mapTypes[packet.mapTypeId]),
			mapName: i18n.t(`models:map_locations.${packet.mapId}.name`, { lng }),
			time
		}));
		if (context.discord!.buttonInteraction) {
			await DiscordCache.getButtonInteraction(context.discord!.buttonInteraction)
				?.editReply({ embeds: [embed] });
		}
		else {
			await interaction.channel.send({ embeds: [embed] });
		}
	}

	@packetHandler(GuildLevelUpPacket)
	async guildLevelUp(context: PacketContext, packet: GuildLevelUpPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setTitle(i18n.t("models:guilds.levelUpTitle", {
						lng: interaction.userLanguage,
						guild: packet.guildName
					}))
					.setDescription(i18n.t("models:guilds.levelUpDesc", {
						lng: interaction.userLanguage,
						level: packet.level
					}))
			]
		});
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
		for (const [missionType, missions] of Object.entries(missionLists)
			.filter(entry => entry[1].length !== 0)) {
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
		await interaction.channel.send({ embeds: [completedMissionsEmbed] });
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
						interpolation: { escapeValue: false }
					}))
			]
		});
	}

	@packetHandler(PlayerDeathPacket)
	async playerDeath(context: PacketContext, _packet: PlayerDeathPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		const lng = interaction.userLanguage;

		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("models:players.koTitle", {
						lng,
						pseudo: interaction.user.displayName
					}), interaction.user)
					.setDescription(i18n.t("models:players.koDesc", {
						lng
					}))
					.setErrorColor()
			]
		});

		await interaction.user.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("models:players.koDmTitle", {
						lng
					}), interaction.user)
					.setDescription(i18n.t("models:players.koDmDesc", {
						lng
					}))
			]
		});
	}

	@packetHandler(PlayerLeavePveIslandPacket)
	async playerLeavePveIsland(context: PacketContext, packet: PlayerLeavePveIslandPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		const lng = interaction.userLanguage;
		let desc = i18n.t("models:players.leavePVEIslandDescStart", {
			lng,
			moneyLost: packet.moneyLost
		});

		if (packet.guildPointsLost > 0) {
			desc += i18n.t("models:players.leavePVEIslandMalusGuildPoints", {
				lng,
				guildPointsLost: packet.guildPointsLost
			});
		}

		desc += i18n.t("models:players.leavePVEIslandDescEnd", {
			lng
		});

		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("models:players.leavePVEIslandTitle", {
						lng,
						pseudo: interaction.user.displayName
					}), interaction.user)
					.setDescription(desc)
			]
		});
	}

	@packetHandler(PlayerLevelUpPacket)
	async playerLevelUp(context: PacketContext, packet: PlayerLevelUpPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		const lng = interaction.userLanguage;

		const rewards: {
			[key in keyof Omit<PlayerLevelUpPacket, "level">]: {
				tr: string; replacements?: object;
			}
		} = {
			healthRestored: { tr: "healthRestored" },
			fightUnlocked: { tr: "fightUnlocked" },
			guildUnlocked: { tr: "guildUnlocked" },
			classesTier1Unlocked: {
				tr: "classTier",
				replacements: { tier: 1 }
			},
			classesTier2Unlocked: {
				tr: "classTier",
				replacements: { tier: 2 }
			},
			classesTier3Unlocked: {
				tr: "classTier",
				replacements: { tier: 3 }
			},
			classesTier4Unlocked: {
				tr: "classTier",
				replacements: { tier: 4 }
			},
			classesTier5Unlocked: {
				tr: "classTier",
				replacements: { tier: 5 }
			},
			missionSlotUnlocked: { tr: "newMissionSlot" },
			pveUnlocked: { tr: "pveUnlocked" },
			statsIncreased: { tr: "statsIncreased" }
		};

		let desc = i18n.t("models:players.levelUp.description", {
			lng,
			level: packet.level
		});

		for (const [key, value] of Object.entries(rewards)) {
			if (packet[key as keyof PlayerLevelUpPacket]) {
				desc += `${i18n.t(`models:players.levelUp.rewards.${value.tr}`, {
					lng,
					...value.replacements
				})}\n`;
			}
		}

		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("models:players.levelUp.title", {
						lng,
						pseudo: interaction.user.displayName
					}), interaction.user)
					.setDescription(desc)
			]
		});
	}

	@packetHandler(PlayerReceivePetPacket)
	async playerReceivePet(context: PacketContext, packet: PlayerReceivePetPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		const lng = interaction.userLanguage;
		const descTr = packet.giveInGuild
			? "models:petReceived.genericGiveGuild"
			: packet.giveInPlayerInv
				? "models:petReceived.genericGivePlayer"
				: "models:petReceived.genericGiveNoSlot";

		const embed = new DraftBotEmbed()
			.formatAuthor(i18n.t("models:petReceived.genericGiveTitle", {
				lng,
				pseudo: interaction.user.displayName
			}), interaction.user)
			.setDescription(i18n.t(descTr, {
				lng,
				pet: DisplayUtils.getPetDisplay(packet.petTypeId, packet.petSex, lng)
			}));

		if (packet.noRoomInGuild) {
			embed.setErrorColor();
		}

		await interaction.channel.send({
			embeds: [embed]
		});
	}

	@packetHandler(GiveFoodToGuildPacket)
	async giveFoodToGuild(context: PacketContext, packet: GiveFoodToGuildPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const foodId = PetConstants.PET_FOOD_BY_ID[packet.selectedFoodIndex];
		const lng = interaction!.userLanguage;

		await interaction?.followUp({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("notifications:guildFood.receivedFoodTitle", { lng }), interaction.user)
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
	async noFoodSpaceInGuild(context: PacketContext, packet: NoFoodSpaceInGuildPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		if (!interaction) {
			return;
		}

		await interaction.channel.send({
			embeds: [
				new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("error:guildFoodStorageFull", {
					lng: interaction.userLanguage,
					quantity: packet.quantity,
					food: DisplayUtils.getFoodDisplay(packet.food, packet.quantity, interaction.userLanguage, false)
				}))
			]
		});
	}
}

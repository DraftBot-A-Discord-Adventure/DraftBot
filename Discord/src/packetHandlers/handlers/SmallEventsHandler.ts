import {packetHandler} from "../PacketHandler";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventAdvanceTimePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../../messages/DraftbotSmallEventEmbed";
import {Language} from "../../../../Lib/src/Language";
import {StringUtils} from "../../utils/StringUtils";
import {SmallEventBigBadPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBigBadPacket";
import {SmallEventSmallBadPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventSmallBadPacket";
import {SmallEventBigBadKind} from "../../../../Lib/src/enums/SmallEventBigBadKind";
import i18n from "../../translations/i18n";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {SmallEventBoatAdvicePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBoatAdvicePacket";
import {
	SmallEventGoToPVEIslandAcceptPacket,
	SmallEventGoToPVEIslandNotEnoughGemsPacket,
	SmallEventGoToPVEIslandRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventGoToPVEIslandPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {
	SmallEventLotteryLosePacket,
	SmallEventLotteryNoAnswerPacket,
	SmallEventLotteryPoorPacket,
	SmallEventLotteryWinPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventLotteryPacket";
import {
	InteractOtherPlayerInteraction,
	SmallEventInteractOtherPlayersAcceptToGivePoorPacket,
	SmallEventInteractOtherPlayersPacket,
	SmallEventInteractOtherPlayersRefuseToGivePoorPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventInteractOtherPlayers";
import {interactOtherPlayerGetPlayerDisplay} from "../../smallEvents/interactOtherPlayers";
import {SmallEventLeagueRewardPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventLeagueReward";
import {printTimeBeforeDate} from "../../../../Lib/src/utils/TimeUtils";
import {SmallEventWinGuildXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinGuildXPPacket";
import {SmallEventBonusGuildPVEIslandPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBonusGuildPVEIslandPacket";
import {SmallEventBotFactsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBotFactsPacket";
import {SmallEventDoNothingPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventDoNothingPacket";
import {SmallEventFightPetPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFightPetPacket";
import {SmallEventGobletsGamePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventGobletsGamePacket";
import {SmallEventShopPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventShopPacket";
import {SmallEventStaffMemberPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventStaffMemberPacket";
import {SmallEventWinEnergyPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinEnergyPacket";
import {SmallEventWinFightPointsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinFightPointsPacket";
import {SmallEventWinHealthPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinHealthPacket";
import {SmallEventWinPersonalXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinPersonalXPPacket";
import {SmallEventWitchResultPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWitchPacket";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {witchResult} from "../../smallEvents/witch";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {
	SmallEventSpaceInitialPacket,
	SmallEventSpaceResultPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventSpacePacket";
import {SmallEventFindPetPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindPetPacket";
import {PetUtils} from "../../utils/PetUtils";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";
import {ClassUtils} from "../../utils/ClassUtils";
import {SmallEventFindPotionPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindPotionPacket";
import {SmallEventFindItemPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindItemPacket";
import {SmallEventPetPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventPetPacket";
import {SmallEventClassPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventClassPacket";
import {BadgeConstants} from "../../../../Lib/src/constants/BadgeConstants";
import {SmallEventUltimateFoodMerchantPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventUltimateFoodMerchantPacket";
import {EmoteUtils} from "../../utils/EmoteUtils";
import {SmallEventCartPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventCartPacket";
import {cartResult} from "../../smallEvents/cart";
import {SmallEventFindMissionPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindMissionPacket";
import {MissionUtils} from "../../utils/MissionUtils";


export function getRandomSmallEventIntro(language: Language): string {
	return StringUtils.getRandomTranslation("smallEvents:intro", language);
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(packet: SmallEventAdvanceTimePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const description = getRandomSmallEventIntro(interaction.userLanguage)
			+ StringUtils.getRandomTranslation("smallEvents:advanceTime.stories", interaction.userLanguage, {time: packet.amount});
		await interaction.editReply({embeds: [new DraftbotSmallEventEmbed("advanceTime", description, interaction.user, interaction.userLanguage)]});
	}

	@packetHandler(SmallEventBigBadPacket)
	async smallEventBigBad(packet: SmallEventBigBadPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		let story: string;
		switch (packet.kind) {
		case SmallEventBigBadKind.LIFE_LOSS:
			story = StringUtils.getRandomTranslation("smallEvents:bigBad.lifeLoss", interaction.userLanguage, {lifeLoss: packet.lifeLost});
			break;
		case SmallEventBigBadKind.ALTERATION:
			story = `${i18n.t(`smallEvents:bigBad.alterationStories.${packet.receivedStory}`, {lng: interaction.userLanguage})} ${DraftBotIcons.effects[packet.effectId!]}`;
			break;
		case SmallEventBigBadKind.MONEY_LOSS:
			story = StringUtils.getRandomTranslation("smallEvents:bigBad.moneyLoss", interaction.userLanguage, {moneyLost: packet.moneyLost});
			break;
		default:
			story = "";
		}
		const description = getRandomSmallEventIntro(interaction.userLanguage) + story;
		await interaction.editReply({embeds: [new DraftbotSmallEventEmbed("bigBad", description, interaction.user, interaction.userLanguage)]});
	}

	@packetHandler(SmallEventBoatAdvicePacket)
	async smallEventBoatAdvice(packet: SmallEventBoatAdvicePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const description = StringUtils.getRandomTranslation(
			"smallEvents:boatAdvice.intro",
			interaction.userLanguage,
			{advice: StringUtils.getRandomTranslation("smallEvents:boatAdvice.advices", interaction.userLanguage)}
		);
		await interaction.editReply({embeds: [new DraftbotSmallEventEmbed("boatAdvice", description, interaction.user, interaction.userLanguage)]});
	}

	@packetHandler(SmallEventGoToPVEIslandAcceptPacket)
	async smallEventGoToPVEIslandAccept(packet: SmallEventGoToPVEIslandAcceptPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t(
						packet.alone
							? "smallEvents:goToPVEIsland.endStoryAccept"
							: "smallEvents:goToPVEIsland.endStoryAcceptWithMember",
						{lng: user.attributes.language[0]}
					),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventGoToPVEIslandRefusePacket)
	async smallEventGoToPVEIslandRefuse(packet: SmallEventGoToPVEIslandRefusePacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.endStoryRefuse", {lng: user.attributes.language[0]}),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventGoToPVEIslandNotEnoughGemsPacket)
	async smallEventGoToPVEIslandNotEnoughGems(packet: SmallEventGoToPVEIslandNotEnoughGemsPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.notEnoughGems", {lng: user.attributes.language[0]}),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventLotteryNoAnswerPacket)
	async smallEventLotteryNoAnswer(packet: SmallEventLotteryNoAnswerPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed("lottery", i18n.t("smallEvents:lottery.end", {lng: interaction.userLanguage}), interaction.user, interaction.userLanguage)
			]
		});
	}

	@packetHandler(SmallEventLotteryPoorPacket)
	async smallEventLotteryPoor(packet: SmallEventLotteryPoorPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t("smallEvents:lottery.poor", {lng: user.attributes.language[0]}),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventLotteryLosePacket)
	async smallEventLotteryLose(packet: SmallEventLotteryLosePacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const failKey = packet.moneyLost > 0 ? "failWithMalus" : "fail";
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t(`smallEvents:lottery.${packet.level}.${failKey}`, {
						lng: user.attributes.language[0],
						lostTime: packet.lostTime,
						money: packet.moneyLost
					}),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventLotteryWinPacket)
	async smallEventLotteryWin(packet: SmallEventLotteryWinPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const rewardDesc = i18n.t(`smallEvents:lottery.rewardTypeText.${packet.winReward}`, {
			lng: user.attributes.language[0],
			reward: packet.winAmount
		});
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t(`smallEvents:lottery.${packet.level}.success`, {
						lng: user.attributes.language[0],
						lostTime: packet.lostTime
					}) + rewardDesc,
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersPacket)
	async smallEventInteractOtherPlayers(packet: SmallEventInteractOtherPlayersPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		if (!packet.keycloakId) {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"interactOtherPlayers",
						StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.no_one", interaction.userLanguage),
						interaction.user,
						interaction.userLanguage
					)]
			});
			return;
		}
		else if (!packet.data) {
			throw new Error("No packet data defined in InteractOtherPlayers small event");
		}
		const playerDisplay = await interactOtherPlayerGetPlayerDisplay(packet.keycloakId, packet.data.rank, interaction.userLanguage);
		if (packet.playerInteraction === InteractOtherPlayerInteraction.EFFECT) {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"interactOtherPlayers",
						StringUtils.getRandomTranslation(`smallEvents:interactOtherPlayers.effect.${packet.data.effectId}`, interaction.userLanguage, {playerDisplay}),
						interaction.user,
						interaction.userLanguage
					)]
			});
			return;
		}
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation(
						`smallEvents:interactOtherPlayers.${InteractOtherPlayerInteraction[packet.playerInteraction!].toLowerCase()}`,
						interaction.userLanguage,
						{
							playerDisplay,
							level: packet.data.level,
							class: `${DraftBotIcons.classes[packet.data.classId]} ${i18n.t(`models:classes.${packet.data.classId}`, {lng: interaction.userLanguage})}`,
							advice: StringUtils.getRandomTranslation("advices:advices", interaction.userLanguage),
							petEmote: packet.data.petId ? PetUtils.getPetIcon(packet.data.petId, packet.data.petSex ?? PetConstants.SEX.MALE) : "",
							petName: packet.data.petName,
							guildName: packet.data.guildName,
							weapon: DisplayUtils.getWeaponDisplay(packet.data.weaponId, interaction.userLanguage),
							armor: DisplayUtils.getArmorDisplay(packet.data.armorId, interaction.userLanguage),
							object: DisplayUtils.getObjectDisplay(packet.data.objectId, interaction.userLanguage),
							potion: DisplayUtils.getPotionDisplay(packet.data.potionId, interaction.userLanguage)
						}
					),
					interaction.user,
					interaction.userLanguage
				)]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersAcceptToGivePoorPacket)
	async smallEventInteractOtherPlayersAcceptToGivePoor(packet: SmallEventInteractOtherPlayersAcceptToGivePoorPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.poor_give_money", user.attributes.language[0]),
					interaction.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersRefuseToGivePoorPacket)
	async smallEventInteractOtherPlayersRefuseToGivePoor(packet: SmallEventInteractOtherPlayersRefuseToGivePoorPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = context.discord!.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!) : DiscordCache.getInteraction(context.discord!.interaction!);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.poor_dont_give_money", user.attributes.language[0]),
					interaction!.user,
					user.attributes.language[0]
				)]
		});
	}

	@packetHandler(SmallEventLeagueRewardPacket)
	async smallEventLeagueReward(packet: SmallEventLeagueRewardPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const endMessage = i18n.t(`smallEvents:leagueReward.${packet.rewardToday ? "rewardToday" : packet.enoughFights ? "endMessage" : "notEnoughFight"}`, {
			lng: interaction.userLanguage,
			interpolation: {escapeValue: false},
			league: i18n.t(`models:leagues.${packet.leagueId}`, {lng: interaction.userLanguage}),
			rewards: i18n.t("smallEvents:leagueReward.reward", {
				lng: interaction.userLanguage,
				money: packet.money,
				xp: packet.xp
			}),
			time: printTimeBeforeDate(packet.nextRewardDate)
		});
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"leagueReward",
					getRandomSmallEventIntro(interaction.userLanguage) + StringUtils.getRandomTranslation("smallEvents:leagueReward.intrigue", interaction.userLanguage) + endMessage,
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWinGuildXPPacket)
	async smallEventWinGuildXp(packet: SmallEventWinGuildXPPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winGuildXP",
					StringUtils.getRandomTranslation("smallEvents:winGuildXP.stories", interaction.userLanguage, {guild: packet.guildName})
					+ i18n.t("smallEvents:winGuildXP.end", {lng: interaction.userLanguage, xp: packet.amount}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventDoNothingPacket)
	async smallEventDoNothing(packet: SmallEventDoNothingPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"doNothing",
					StringUtils.getRandomTranslation("smallEvents:doNothing.stories", interaction.userLanguage),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventStaffMemberPacket)
	async smallEventStaffMember(packet: SmallEventStaffMemberPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const staffMember = RandomUtils.draftbotRandom.pick(Object.keys(i18n.t("smallEvents:staffMember.members", {
			returnObjects: true,
			lng: interaction.userLanguage
		})));
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"staffMember",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:staffMember.context", interaction.userLanguage, {
						pseudo: staffMember,
						sentence: i18n.t(`smallEvents:staffMember.members.${staffMember}`, {
							lng: interaction.userLanguage,
							interpolation: {escapeValue: false}
						})
					}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWinEnergyPacket)
	async smallEventWinEnergy(packet: SmallEventWinEnergyPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winEnergy",
					getRandomSmallEventIntro(interaction.userLanguage) + StringUtils.getRandomTranslation("smallEvents:winEnergy.stories", interaction.userLanguage),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWinFightPointsPacket)
	async smallEventWinFightPoints(packet: SmallEventWinFightPointsPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winFightPoints",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:winFightPoints.stories", interaction.userLanguage, {fightPoints: packet.amount}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWinHealthPacket)
	async smallEventWinHealth(packet: SmallEventWinHealthPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winHealth",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:winHealth.stories", interaction.userLanguage, {health: packet.amount}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWinPersonalXPPacket)
	async smallEventWinPersonalXP(packet: SmallEventWinPersonalXPPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winPersonalXP",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:winPersonalXP.stories", interaction.userLanguage)
					+ i18n.t("smallEvents:winPersonalXP.end", {lng: interaction.userLanguage, xp: packet.amount}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventWitchResultPacket)
	async smallEventWitchResult(packet: SmallEventWitchResultPacket, context: PacketContext): Promise<void> {
		await witchResult(packet, context);
	}

	@packetHandler(SmallEventFindPetPacket)
	async smallEventFindPet(packet: SmallEventFindPetPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const translationKey = packet.isPetReceived
			? packet.petIsReceivedByGuild
				? "givePetGuild"
				: "givePetPlayer"
			: packet.isPetFood
				? "food"
				: "noFood";
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findPet",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation(
						`smallEvents:findPet.${translationKey}`,
						interaction.userLanguage,
						{
							context: packet.petSex,
							pet: PetUtils.petToShortString(interaction.userLanguage, undefined, packet.petTypeID, packet.petSex)
						}
					),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventSpaceInitialPacket)
	async smallEventSpaceInitial(packet: SmallEventSpaceInitialPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"space",
					i18n.t("smallEvents:space.before_search_format", {
						lng: interaction.userLanguage,
						seIntro: getRandomSmallEventIntro(interaction.userLanguage),
						intro: StringUtils.getRandomTranslation("smallEvents:space.intro", interaction.userLanguage, {
							name: StringUtils.getRandomTranslation("smallEvents:space.names", interaction.userLanguage)
						}),
						searchAction: StringUtils.getRandomTranslation("smallEvents:space.searchAction", interaction.userLanguage),
						search: StringUtils.getRandomTranslation("smallEvents:space.search", interaction.userLanguage),
						interpolation: {escapeValue: false}
					}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventSpaceResultPacket)
	async smallEventSpaceResult(packet: SmallEventSpaceResultPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const oldMessage = (await interaction.fetchReply()).embeds[0]?.data.description;
		if (!oldMessage) {
			return;
		}
		const lng = interaction.userLanguage;
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"space",
					i18n.t("smallEvents:space.after_search_format", {
						lng,
						oldMessage: oldMessage.split(" ").slice(1)
							.join(" "),
						actionIntro: StringUtils.getRandomTranslation("smallEvents:space.actionIntro", lng),
						action: StringUtils.getRandomTranslation("smallEvents:space.action", lng),
						specific: StringUtils.getRandomTranslation(`smallEvents:space.specific.${packet.chosenEvent}`, lng, {
							mainValue: packet.chosenEvent === "moonPhase" ? i18n.t("smallEvents:space.moonPhases", {
								returnObjects: true,
								lng
							})[packet.values.mainValue] : packet.values.mainValue,
							objectWhichWillCrossTheSky: i18n.t("smallEvents:space.nObjectsCrossTheSky", {
								lng,
								count: packet.values.mainValue
							}),
							days: i18n.t("smallEvents:space.days", {lng}),
							randomObjectName: packet.values.randomObjectName,
							randomObjectDistance: packet.values.randomObjectDistance,
							randomObjectDiameter: packet.values.randomObjectDiameter
						}),
						outro: StringUtils.getRandomTranslation("smallEvents:space.outro", lng),
						interpolation: {escapeValue: false}
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventBotFactsPacket)
	async smallEventBotFacts(packet: SmallEventBotFactsPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"botFacts",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:botFacts.stories", interaction.userLanguage, {
						botFact: i18n.t(`smallEvents:botFacts.possibleInfo.${packet.information}`, {
							lng: interaction.userLanguage,
							count: packet.infoNumber,
							infoNumber: packet.infoNumber,
							infoComplement: ClassUtils.classToString(interaction.userLanguage, packet.infoComplement ? packet.infoComplement : 0),
							interpolation: {escapeValue: false}
						}),
						interpolation: {escapeValue: false}
					}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventSmallBadPacket)
	async smallEventSmallBad(packet: SmallEventSmallBadPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"smallBad",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation(`smallEvents:smallBad.${packet.issue}.stories`, interaction.userLanguage, {amount: packet.amount}),
					interaction.user,
					interaction.userLanguage
				)]
		});
	}

	@packetHandler(SmallEventFindPotionPacket)
	async smallEventFindPotion(packet: SmallEventFindPotionPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findPotion",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:findPotion.stories", interaction.userLanguage),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventFindItemPacket)
	async smallEventFindItem(packet: SmallEventFindItemPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findItem",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:findItem.stories", interaction.userLanguage),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventPetPacket)
	async smallEventPet(packet: SmallEventPetPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"pet",
					StringUtils.getRandomTranslation(
						`smallEvents:pet.stories.${packet.interactionName}`,
						interaction.userLanguage,
						{
							context: packet.petSex,
							pet: PetUtils.petToShortString(interaction.userLanguage, packet.petNickname, packet.petTypeId, packet.petSex),
							amount: packet.amount,
							food: packet.food ? DisplayUtils.displayFood(packet.food, interaction.userLanguage) : null,
							badge: BadgeConstants.PET_TAMER,
							randomAnimal: i18n.t("smallEvents:pet.randomAnimal", {
								lng: interaction.userLanguage,
								context: packet.randomPetSex,
								randomAnimal: PetUtils.petToShortString(interaction.userLanguage, undefined, packet.randomPetTypeId, packet.randomPetSex)
							})
						}
					),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventClassPacket)
	async smallEventClass(packet: SmallEventClassPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"class",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation(`smallEvents:class.${packet.classKind}.${packet.interactionName}`, interaction.userLanguage, {
						amount: packet.amount
					}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventUltimateFoodMerchantPacket)
	async smallEventUltimateFoodMerchant(packet: SmallEventUltimateFoodMerchantPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);

		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"ultimateFoodMerchant",
					getRandomSmallEventIntro(interaction.userLanguage)
					+ StringUtils.getRandomTranslation("smallEvents:ultimateFoodMerchant.stories", interaction.userLanguage)
					+ StringUtils.getRandomTranslation(`smallEvents:ultimateFoodMerchant.rewards.${packet.interactionName}`, interaction.userLanguage, {
						count: packet.amount,
						moneyEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.unitValues.money)
					}),
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}

	@packetHandler(SmallEventCartPacket)
	async smallEventCart(packet: SmallEventCartPacket, context: PacketContext): Promise<void> {
		await cartResult(packet, context);
	}

	@packetHandler(SmallEventBonusGuildPVEIslandPacket)
	async smallEventBonusGuildPVEIsland(packet: SmallEventBonusGuildPVEIslandPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(SmallEventFightPetPacket)
	async smallEventFightPet(packet: SmallEventFightPetPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(SmallEventGobletsGamePacket)
	async smallEventGobletsGame(packet: SmallEventGobletsGamePacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(SmallEventShopPacket)
	async smallEventShop(packet: SmallEventShopPacket, context: PacketContext): Promise<void> {
		// Todo
	}

	@packetHandler(SmallEventFindMissionPacket)
	async smallEventFindMission(packet: SmallEventFindMissionPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findMission",
					`${
						getRandomSmallEventIntro(interaction.userLanguage)
					}${
						StringUtils.getRandomTranslation("smallEvents:findMission.intrigue", interaction.userLanguage)
					}\n\n**${
						MissionUtils.formatBaseMission(packet.mission)
					}**`,
					interaction.user,
					interaction.userLanguage
				)
			]
		});
	}
}
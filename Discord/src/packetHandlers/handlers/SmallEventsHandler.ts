import { packetHandler } from "../PacketHandler";
import { PacketContext } from "../../../../Lib/src/packets/DraftBotPacket";
import { SmallEventAdvanceTimePacket } from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftbotSmallEventEmbed } from "../../messages/DraftbotSmallEventEmbed";
import { Language } from "../../../../Lib/src/Language";
import {
	escapeUsername, StringUtils
} from "../../utils/StringUtils";
import { SmallEventBigBadPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventBigBadPacket";
import {
	SmallEventBadIssue,
	SmallEventSmallBadPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventSmallBadPacket";
import { SmallEventBigBadKind } from "../../../../Lib/src/types/SmallEventBigBadKind";
import i18n from "../../translations/i18n";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import { SmallEventBoatAdvicePacket } from "../../../../Lib/src/packets/smallEvents/SmallEventBoatAdvicePacket";
import {
	SmallEventGoToPVEIslandAcceptPacket,
	SmallEventGoToPVEIslandNotEnoughGemsPacket,
	SmallEventGoToPVEIslandRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventGoToPVEIslandPacket";
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
import { interactOtherPlayerGetPlayerDisplay } from "../../smallEvents/interactOtherPlayers";
import { SmallEventLeagueRewardPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventLeagueReward";
import {
	minutesDisplay, printTimeBeforeDate
} from "../../../../Lib/src/utils/TimeUtils";
import { SmallEventWinGuildXPPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinGuildXPPacket";
import { SmallEventBonusGuildPVEIslandPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventBonusGuildPVEIslandPacket";
import { SmallEventBotFactsPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventBotFactsPacket";
import { SmallEventDoNothingPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventDoNothingPacket";
import { SmallEventFightPetPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFightPetPacket";
import { SmallEventGobletsGamePacket } from "../../../../Lib/src/packets/smallEvents/SmallEventGobletsGamePacket";
import {
	SmallEventShopAcceptPacket,
	SmallEventShopCannotBuyPacket,
	SmallEventShopRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventShopPacket";
import { SmallEventStaffMemberPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventStaffMemberPacket";
import { SmallEventWinEnergyPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinEnergyPacket";
import { SmallEventWinEnergyOnIslandPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinEnergyOnIslandPacket";
import { SmallEventWinHealthPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinHealthPacket";
import { SmallEventWinPersonalXPPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinPersonalXPPacket";
import { SmallEventWitchResultPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWitchPacket";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { witchResult } from "../../smallEvents/witch";
import { DisplayUtils } from "../../utils/DisplayUtils";
import {
	SmallEventSpaceInitialPacket,
	SmallEventSpaceResultPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventSpacePacket";
import { SmallEventFindPetPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFindPetPacket";
import { PetUtils } from "../../utils/PetUtils";
import { SmallEventFindPotionPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFindPotionPacket";
import { SmallEventFindItemPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFindItemPacket";
import { SmallEventPetPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventPetPacket";
import { SmallEventClassPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventClassPacket";
import { SmallEventUltimateFoodMerchantPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventUltimateFoodMerchantPacket";
import { EmoteUtils } from "../../utils/EmoteUtils";
import { SmallEventCartPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventCartPacket";
import { cartResult } from "../../smallEvents/cart";
import { SmallEventFindMissionPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventFindMissionPacket";
import { MissionUtils } from "../../utils/MissionUtils";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { baseFunctionHandler } from "../../smallEvents/shop";
import { epicItemShopHandler } from "../../smallEvents/epicItemShop";
import {
	SmallEventEpicItemShopAcceptPacket,
	SmallEventEpicItemShopCannotBuyPacket,
	SmallEventEpicItemShopRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventEpicItemShopPacket";
import { Badge } from "../../../../Lib/src/types/Badge";


export function getRandomSmallEventIntro(language: Language): string {
	return StringUtils.getRandomTranslation("smallEvents:intro", language);
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(context: PacketContext, packet: SmallEventAdvanceTimePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		const description = getRandomSmallEventIntro(lng)
			+ StringUtils.getRandomTranslation("smallEvents:advanceTime.stories", lng, { time: packet.amount });
		await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("advanceTime", description, interaction.user, lng)] });
	}

	@packetHandler(SmallEventBigBadPacket)
	async smallEventBigBad(context: PacketContext, packet: SmallEventBigBadPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		let story: string;
		switch (packet.kind) {
			case SmallEventBigBadKind.LIFE_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.lifeLoss", lng, { lifeLoss: packet.lifeLost });
				break;
			case SmallEventBigBadKind.ALTERATION:
				story = `${i18n.t(`smallEvents:bigBad.alterationStories.${packet.receivedStory}`, { lng })} ${DraftBotIcons.effects[packet.effectId!]}`;
				break;
			case SmallEventBigBadKind.MONEY_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.moneyLoss", lng, { moneyLost: packet.moneyLost });
				break;
			default:
				story = "";
		}
		const description = getRandomSmallEventIntro(lng) + story;
		await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("bigBad", description, interaction.user, lng)] });
	}

	@packetHandler(SmallEventBoatAdvicePacket)
	async smallEventBoatAdvice(context: PacketContext, _packet: SmallEventBoatAdvicePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		const description = StringUtils.getRandomTranslation(
			"smallEvents:boatAdvice.intro",
			lng,
			{ advice: StringUtils.getRandomTranslation("smallEvents:boatAdvice.advices", lng) }
		);
		await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("boatAdvice", description, interaction.user, lng)] });
	}

	@packetHandler(SmallEventGoToPVEIslandAcceptPacket)
	async smallEventGoToPVEIslandAccept(context: PacketContext, packet: SmallEventGoToPVEIslandAcceptPacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		if (!interaction) {
			return;
		}
		const lng = context.discord!.language;
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t(`smallEvents:goToPVEIsland.endStoryAccept${packet.alone ? "WithMember" : ""}`, {
						lng,
						gainScore: packet.pointsWon > 0
							? i18n.t("smallEvents:goToPVEIsland.confirmedScore", {
								lng,
								score: packet.pointsWon
							})
							: ""
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventGoToPVEIslandRefusePacket)
	async smallEventGoToPVEIslandRefuse(context: PacketContext, _packet: SmallEventGoToPVEIslandRefusePacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.endStoryRefuse", { lng }),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventGoToPVEIslandNotEnoughGemsPacket)
	async smallEventGoToPVEIslandNotEnoughGems(context: PacketContext, _packet: SmallEventGoToPVEIslandNotEnoughGemsPacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.notEnoughGems", { lng }),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventLotteryNoAnswerPacket)
	async smallEventLotteryNoAnswer(context: PacketContext, _packet: SmallEventLotteryNoAnswerPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		await interaction.editReply({
			embeds: [new DraftbotSmallEventEmbed("lottery", i18n.t("smallEvents:lottery.end", { lng }), interaction.user, lng)]
		});
	}

	@packetHandler(SmallEventLotteryPoorPacket)
	async smallEventLotteryPoor(context: PacketContext, _packet: SmallEventLotteryPoorPacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t("smallEvents:lottery.poor", { lng }),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventLotteryLosePacket)
	async smallEventLotteryLose(context: PacketContext, packet: SmallEventLotteryLosePacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t(`smallEvents:lottery.${packet.level}.${packet.moneyLost > 0 ? "failWithMalus" : "fail"}`, {
						lng,
						lostTime: packet.lostTime,
						money: packet.moneyLost
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventLotteryWinPacket)
	async smallEventLotteryWin(context: PacketContext, packet: SmallEventLotteryWinPacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"lottery",
					i18n.t(`smallEvents:lottery.${packet.level}.success`, {
						lng,
						lostTime: packet.lostTime
					}) + i18n.t(`smallEvents:lottery.rewardTypeText.${packet.winReward}`, {
						lng,
						reward: packet.winAmount
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersPacket)
	async smallEventInteractOtherPlayers(context: PacketContext, packet: SmallEventInteractOtherPlayersPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		if (!packet.keycloakId) {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"interactOtherPlayers",
						StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.no_one", lng),
						interaction.user,
						lng
					)
				]
			});
			return;
		}
		else if (!packet.data) {
			throw new Error("No packet data defined in InteractOtherPlayers small event");
		}
		const playerDisplay = await interactOtherPlayerGetPlayerDisplay(packet.keycloakId, packet.data.rank, lng);
		if (packet.playerInteraction === InteractOtherPlayerInteraction.EFFECT) {
			await interaction.editReply({
				embeds: [
					new DraftbotSmallEventEmbed(
						"interactOtherPlayers",
						StringUtils.getRandomTranslation(`smallEvents:interactOtherPlayers.effect.${packet.data.effectId}`, lng, { playerDisplay }),
						interaction.user,
						lng
					)
				]
			});
			return;
		}
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation(
						`smallEvents:interactOtherPlayers.${InteractOtherPlayerInteraction[packet.playerInteraction!].toLowerCase()}`,
						lng,
						{
							playerDisplay,
							level: packet.data.level,
							class: `${DraftBotIcons.classes[packet.data.classId]} ${i18n.t(`models:classes.${packet.data.classId}`, { lng })}`,
							advice: StringUtils.getRandomTranslation("advices:advices", lng),
							petEmote: packet.data.petId && packet.data.petSex ? DisplayUtils.getPetIcon(packet.data.petId, packet.data.petSex) : "",
							petName: packet.data.petName,
							guildName: packet.data.guildName,
							weapon: DisplayUtils.getWeaponDisplay(packet.data.weaponId, lng),
							armor: DisplayUtils.getArmorDisplay(packet.data.armorId, lng),
							object: DisplayUtils.getObjectDisplay(packet.data.objectId, lng),
							potion: DisplayUtils.getPotionDisplay(packet.data.potionId, lng)
						}
					),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersAcceptToGivePoorPacket)
	async smallEventInteractOtherPlayersAcceptToGivePoor(context: PacketContext, _packet: SmallEventInteractOtherPlayersAcceptToGivePoorPacket): Promise<void> {
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.poor_give_money", lng),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventInteractOtherPlayersRefuseToGivePoorPacket)
	async smallEventInteractOtherPlayersRefuseToGivePoor(context: PacketContext, _packet: SmallEventInteractOtherPlayersRefuseToGivePoorPacket): Promise<void> {
		const interaction = context.discord!.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!) : DiscordCache.getInteraction(context.discord!.interaction!);
		const lng = context.discord!.language;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"interactOtherPlayers",
					StringUtils.getRandomTranslation("smallEvents:interactOtherPlayers.poor_dont_give_money", lng),
					interaction!.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventLeagueRewardPacket)
	async smallEventLeagueReward(context: PacketContext, packet: SmallEventLeagueRewardPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		const endMessage = i18n.t(`smallEvents:leagueReward.${packet.rewardToday ? "rewardToday" : packet.enoughFights ? "endMessage" : "notEnoughFight"}`, {
			lng,
			league: i18n.t(`models:leagues.${packet.leagueId}`, { lng }),
			rewards: i18n.t("smallEvents:leagueReward.reward", {
				lng,
				money: packet.money,
				xp: packet.xp
			}),
			time: printTimeBeforeDate(packet.nextRewardDate)
		});
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"leagueReward",
					getRandomSmallEventIntro(lng) + StringUtils.getRandomTranslation("smallEvents:leagueReward.intrigue", lng) + endMessage,
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWinGuildXPPacket)
	async smallEventWinGuildXp(context: PacketContext, packet: SmallEventWinGuildXPPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winGuildXP",
					StringUtils.getRandomTranslation("smallEvents:winGuildXP.stories", lng, { guild: packet.guildName })
					+ i18n.t("smallEvents:winGuildXP.end", {
						lng,
						xp: packet.amount
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventDoNothingPacket)
	async smallEventDoNothing(context: PacketContext, _packet: SmallEventDoNothingPacket): Promise<void> {
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
	async smallEventStaffMember(context: PacketContext, _packet: SmallEventStaffMemberPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		const staffMember = RandomUtils.draftbotRandom.pick(Object.keys(i18n.t("smallEvents:staffMember.members", {
			returnObjects: true,
			lng
		})));
		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"staffMember",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:staffMember.context", lng, {
						pseudo: staffMember,
						sentence: i18n.t(`smallEvents:staffMember.members.${staffMember}`, {
							lng
						})
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWinEnergyPacket)
	async smallEventWinEnergy(context: PacketContext, _packet: SmallEventWinEnergyPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winEnergy",
					getRandomSmallEventIntro(lng) + StringUtils.getRandomTranslation("smallEvents:winEnergy.stories", lng),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWinEnergyOnIslandPacket)
	async smallEventWinFightPoints(context: PacketContext, packet: SmallEventWinEnergyOnIslandPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winEnergyOnIsland",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation(
						"smallEvents:winEnergyOnIsland.stories",
						lng,
						{ energy: packet.amount }
					),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWinHealthPacket)
	async smallEventWinHealth(context: PacketContext, packet: SmallEventWinHealthPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winHealth",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:winHealth.stories", lng, { health: packet.amount }),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWinPersonalXPPacket)
	async smallEventWinPersonalXP(context: PacketContext, packet: SmallEventWinPersonalXPPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"winPersonalXP",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:winPersonalXP.stories", lng)
					+ i18n.t("smallEvents:winPersonalXP.end", {
						lng,
						xp: packet.amount
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventWitchResultPacket)
	async smallEventWitchResult(context: PacketContext, packet: SmallEventWitchResultPacket): Promise<void> {
		await witchResult(packet, context);
	}

	@packetHandler(SmallEventFindPetPacket)
	async smallEventFindPet(context: PacketContext, packet: SmallEventFindPetPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
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
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation(
						`smallEvents:findPet.${translationKey}`,
						lng,
						{
							context: packet.petSex,
							pet: PetUtils.petToShortString(lng, undefined, packet.petTypeID, packet.petSex)
						}
					),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventSpaceInitialPacket)
	async smallEventSpaceInitial(context: PacketContext, _packet: SmallEventSpaceInitialPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"space",
					i18n.t("smallEvents:space.before_search_format", {
						lng,
						seIntro: getRandomSmallEventIntro(lng),
						intro: StringUtils.getRandomTranslation("smallEvents:space.intro", lng, {
							name: StringUtils.getRandomTranslation("smallEvents:space.names", lng)
						}),
						searchAction: StringUtils.getRandomTranslation("smallEvents:space.searchAction", lng),
						search: StringUtils.getRandomTranslation("smallEvents:space.search", lng)
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventSpaceResultPacket)
	async smallEventSpaceResult(context: PacketContext, packet: SmallEventSpaceResultPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const oldMessage = (await interaction.fetchReply()).embeds[0]?.data.description;
		if (!oldMessage) {
			return;
		}
		const lng = interaction.userLanguage;
		const oneOrMoreDays = packet.values.mainValue > 1
			? i18n.t("smallEvents:space.days_other", { lng })
			: i18n.t("smallEvents:space.days_one", { lng });

		await interaction.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"space",
					i18n.t("smallEvents:space.after_search_format", {
						lng,
						oldMessage: oldMessage.split(" ")
							.slice(1)
							.join(" "),
						actionIntro: StringUtils.getRandomTranslation("smallEvents:space.actionIntro", lng),
						action: StringUtils.getRandomTranslation("smallEvents:space.action", lng),
						specific: StringUtils.getRandomTranslation(`smallEvents:space.specific.${packet.chosenEvent}`, lng, {
							mainValue: packet.chosenEvent === "moonPhase"
								? i18n.t("smallEvents:space.moonPhases", {
									returnObjects: true,
									lng
								})[packet.values.mainValue]
								: packet.values.mainValue,
							objectWhichWillCrossTheSky: i18n.t("smallEvents:space.nObjectsCrossTheSky", {
								lng,
								count: packet.values.mainValue
							}),
							days: oneOrMoreDays,
							randomObjectName: packet.values.randomObjectName,
							randomObjectDistance: packet.values.randomObjectDistance,
							randomObjectDiameter: packet.values.randomObjectDiameter
						}),
						outro: StringUtils.getRandomTranslation("smallEvents:space.outro", lng)
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventBotFactsPacket)
	async smallEventBotFacts(context: PacketContext, packet: SmallEventBotFactsPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"botFacts",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:botFacts.stories", lng, {
						botFact: i18n.t(`smallEvents:botFacts.possibleInfo.${packet.information}`, {
							lng,
							count: packet.infoNumber,
							infoNumber: packet.infoNumber,
							infoComplement: DisplayUtils.getClassDisplay(packet.infoComplement ? packet.infoComplement : 0, lng)
						})
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventSmallBadPacket)
	async smallEventSmallBad(context: PacketContext, packet: SmallEventSmallBadPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		const amountDisplay = packet.issue === SmallEventBadIssue.TIME
			? minutesDisplay(packet.amount, lng)
			: packet.amount;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"smallBad",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation(`smallEvents:smallBad.${packet.issue}.stories`, lng, { amount: amountDisplay }),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventFindPotionPacket)
	async smallEventFindPotion(context: PacketContext, _packet: SmallEventFindPotionPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findPotion",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:findPotion.stories", lng),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventFindItemPacket)
	async smallEventFindItem(context: PacketContext, _packet: SmallEventFindItemPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findItem",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:findItem.stories", lng),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventPetPacket)
	async smallEventPet(context: PacketContext, packet: SmallEventPetPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"pet",
					StringUtils.getRandomTranslation(
						`smallEvents:pet.stories.${packet.interactionName}`,
						lng,
						{
							context: packet.petSex,
							pet: PetUtils.petToShortString(lng, packet.petNickname, packet.petTypeId, packet.petSex),
							amount: packet.amount,
							food: packet.food ? DisplayUtils.getFoodDisplay(packet.food, 1, lng, false) : null,
							badge: DraftBotIcons.badges[Badge.LEGENDARY_PET],
							randomAnimal: i18n.t("smallEvents:pet.randomAnimal", {
								lng,
								context: packet.randomPetSex,
								randomAnimal: PetUtils.petToShortString(lng, undefined, packet.randomPetTypeId, packet.randomPetSex)
							})
						}
					),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventClassPacket)
	async smallEventClass(context: PacketContext, packet: SmallEventClassPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"class",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation(`smallEvents:class.${packet.classKind}.${packet.interactionName}`, lng, {
						amount: packet.amount
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventUltimateFoodMerchantPacket)
	async smallEventUltimateFoodMerchant(context: PacketContext, packet: SmallEventUltimateFoodMerchantPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"ultimateFoodMerchant",
					getRandomSmallEventIntro(lng)
					+ StringUtils.getRandomTranslation("smallEvents:ultimateFoodMerchant.stories", lng)
					+ StringUtils.getRandomTranslation(`smallEvents:ultimateFoodMerchant.rewards.${packet.interactionName}`, lng, {
						count: packet.amount,
						moneyEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.unitValues.money)
					}),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventCartPacket)
	async smallEventCart(context: PacketContext, packet: SmallEventCartPacket): Promise<void> {
		await cartResult(packet, context);
	}

	@packetHandler(SmallEventBonusGuildPVEIslandPacket)
	async smallEventBonusGuildPVEIsland(context: PacketContext, packet: SmallEventBonusGuildPVEIslandPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"bonusGuildPVEIsland",
					`${i18n.t(`smallEvents:bonusGuildPVEIsland.events.${packet.event}.intro`, { lng })}\n\n${
						i18n.t(`smallEvents:bonusGuildPVEIsland.events.${packet.event}.${packet.result}.${packet.surrounding}`, {
							lng,
							amount: packet.amount,
							emoteKey: packet.isExperienceGain ? "xp" : "guildPoint"
						})}`,
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventFightPetPacket)
	async smallEventFightPet(context: PacketContext, packet: SmallEventFightPetPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.channel.send({
			embeds: [
				new DraftbotSmallEventEmbed(
					"fightPet",
					i18n.t(`smallEvents:fightPet.fightPetActions.${packet.fightPetActionId}.${packet.isSuccess ? "success" : "failure"}`, { lng })
					+ (packet.isSuccess
						? i18n.t("smallEvents:fightPet.rageUpFormat", {
							lng,
							rageUpDescription: StringUtils.getRandomTranslation("smallEvents:fightPet.rageUpDescriptions", lng)
						})
						: ""),
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventGobletsGamePacket)
	async smallEventGobletsGame(context: PacketContext, packet: SmallEventGobletsGamePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}
		const lng = interaction.userLanguage;
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(
						i18n.t("commands:report.journal", {
							lng,
							pseudo: escapeUsername(interaction.user.displayName)
						}),
						interaction.user
					)
					.setDescription(
						i18n.t(`{emote:goblets.{{goblet}}} $t(smallEvents:gobletsGame.results.${packet.malus})`, {
							lng,
							quantity: packet.value,
							goblet: packet.goblet ?? RandomUtils.draftbotRandom.pick(Object.keys(DraftBotIcons.goblets))
						})
					)
			]
		});
	}


	@packetHandler(SmallEventShopRefusePacket)
	async smallEventShopRefuse(context: PacketContext, _packet: SmallEventShopRefusePacket): Promise<void> {
		await baseFunctionHandler(context, "smallEvents:shop.refused");
	}

	@packetHandler(SmallEventShopAcceptPacket)
	async smallEventShopAccept(context: PacketContext, _packet: SmallEventShopAcceptPacket): Promise<void> {
		await baseFunctionHandler(context, "smallEvents:shop.purchased");
	}

	@packetHandler(SmallEventShopCannotBuyPacket)
	async smallEventShopCannotBuy(context: PacketContext, _packet: SmallEventShopCannotBuyPacket): Promise<void> {
		await baseFunctionHandler(context, "smallEvents:shop.notEnoughMoney");
	}

	@packetHandler(SmallEventFindMissionPacket)
	async smallEventFindMission(context: PacketContext, packet: SmallEventFindMissionPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const lng = interaction!.userLanguage;
		await interaction?.editReply({
			embeds: [
				new DraftbotSmallEventEmbed(
					"findMission",
					`${
						getRandomSmallEventIntro(lng)
					}${
						StringUtils.getRandomTranslation("smallEvents:findMission.intrigue", lng)
					}\n\n**${
						MissionUtils.formatBaseMission(packet.mission, lng)
					}**`,
					interaction.user,
					lng
				)
			]
		});
	}

	@packetHandler(SmallEventEpicItemShopRefusePacket)
	async smallEventEpicItemShopRefuse(context: PacketContext, _packet: SmallEventEpicItemShopRefusePacket): Promise<void> {
		await epicItemShopHandler(context, "smallEvents:epicItemShop.refused");
	}

	@packetHandler(SmallEventEpicItemShopAcceptPacket)
	async smallEventEpicItemShopAccept(context: PacketContext, _packet: SmallEventEpicItemShopAcceptPacket): Promise<void> {
		await epicItemShopHandler(context, "smallEvents:epicItemShop.purchased");
	}

	@packetHandler(SmallEventEpicItemShopCannotBuyPacket)
	async smallEventEpicItemShopCannotBuy(context: PacketContext, _packet: SmallEventEpicItemShopCannotBuyPacket): Promise<void> {
		await epicItemShopHandler(context, "smallEvents:epicItemShop.notEnoughMoney");
	}
}

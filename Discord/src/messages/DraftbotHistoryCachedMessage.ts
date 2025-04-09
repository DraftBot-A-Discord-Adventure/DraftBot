import {
	DraftbotCachedMessage, DraftbotCachedMessages
} from "./DraftbotCachedMessage";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../bot/DraftBotShard";
import i18n from "../translations/i18n";
import { CommandFightHistoryItemPacket } from "../../../Lib/src/packets/fights/FightHistoryItemPacket";
import { EmoteUtils } from "../utils/EmoteUtils";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { FightAlterationState } from "../../../Lib/src/types/FightAlterationResult";
import { FightConstants } from "../../../Lib/src/constants/FightConstants";
import { DraftbotFightStatusCachedMessage } from "./DraftbotFightStatusCachedMessage";
import { StringUtils } from "../utils/StringUtils";
import { DraftbotActionChooseCachedMessage } from "./DraftbotActionChooseCachedMessage";
import { PetAssistanceState } from "../../../Lib/src/types/PetAssistanceResult";
import { StringConstants } from "../../../Lib/src/constants/StringConstants";
import { DisplayUtils } from "../utils/DisplayUtils";
import { DraftbotInteraction } from "./DraftbotInteraction";

export class DraftbotHistoryCachedMessage extends DraftbotCachedMessage<CommandFightHistoryItemPacket> {
	readonly duration = 30;

	historyContent: string;

	constructor(originalMessageId: string) {
		super(originalMessageId);
		this.historyContent = "";
	}

	get type(): string {
		return "history";
	}

	updateMessage = async (packet: CommandFightHistoryItemPacket, context: PacketContext): Promise<null> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const fighter = packet.fighterKeycloakId
			? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.fighterKeycloakId))!.attributes.gameUsername[0]
			: i18n.t(`models:monsters.${packet.monsterId}.name`, { lng: interaction.userLanguage });

		let newLine = i18n.t("commands:fight.actions.intro", {
			lng: interaction.userLanguage,
			emote: EmoteUtils.translateEmojiToDiscord(packet.pet
				? DraftBotIcons.pets[packet.pet.typeId][packet.pet.sex === StringConstants.SEX.FEMALE.short ? "emoteFemale" : "emoteMale"]
				: DraftBotIcons.fightActions[packet.fightActionId]),
			fighter
		}) + this.manageMainMessage(packet, interaction);

		if (packet.fightActionEffectReceived) {
			newLine += this.manageReceivedEffects(packet, interaction);
		}

		// Then we need to display the side effects of the attack or alteration if there are any
		if (packet.fightActionEffectDealt) {
			newLine += this.manageSideEffects(packet, interaction);
		}

		if (this.historyContent.length + newLine.length <= FightConstants.MAX_HISTORY_LENGTH) {
			this.historyContent = `${this.historyContent}\n${newLine}`;
			await this.post({ content: this.historyContent });
			return null;
		}
		this.storedMessage = undefined;
		this.historyContent = newLine;
		await this.post({ content: this.historyContent });
		DraftbotCachedMessages.markAsReupload(DraftbotCachedMessages.getOrCreate(this.originalMessageId, DraftbotFightStatusCachedMessage));
		DraftbotCachedMessages.markAsReupload(DraftbotCachedMessages.getOrCreate(this.originalMessageId, DraftbotActionChooseCachedMessage));
		return null;
	};

	private manageSideEffects(packet: CommandFightHistoryItemPacket, interaction: DraftbotInteraction): string {
		let sideEffectString = "";
		Object.entries(packet.fightActionEffectDealt!)
			.forEach(([key, value]) => {
				if (typeof value === "number") {
					const operator = value >= 0 ? FightConstants.OPERATOR.PLUS : FightConstants.OPERATOR.MINUS;
					sideEffectString += i18n.t(`commands:fight.actions.fightActionEffects.opponent.${key}`, {
						lng: interaction.userLanguage,
						operator,
						amount: Math.abs(value)
					});
				}
				else if (value) {
					sideEffectString += i18n.t(`commands:fight.actions.fightActionEffects.opponent.${key}`, {
						lng: interaction.userLanguage,
						effect: i18n.t(`models:fight_actions.${value}.name`, {
							lng: interaction.userLanguage
						})
					});
				}
			});
		return sideEffectString;
	}

	private manageMainMessage(packet: CommandFightHistoryItemPacket, interaction: DraftbotInteraction): string {
		if (
			packet.status
			&& Object.values(FightAlterationState)
				.includes(packet.status as FightAlterationState)
			|| Object.values(PetAssistanceState)
				.includes(packet.status as PetAssistanceState)
		) {
			// The fightAction is an alteration or pet assistance
			return i18n.t(`models:fight_actions.${packet.fightActionId}.${packet.status}`, {
				lng: interaction.userLanguage,
				interpolation: { escapeValue: false },
				petNickname: packet.pet
					? packet.pet.nickname
						? packet.pet.nickname
						: DisplayUtils.getPetTypeName(interaction.userLanguage, packet.pet.typeId, packet.pet.sex)
					: undefined
			});
		}
		else if (packet.customMessage) {
			return i18n.t(`models:fight_actions.${packet.fightActionId}.customMessage`, {
				lng: interaction.userLanguage,
				interpolation: { escapeValue: false }
			});
		}

		// The fightAction is an attack
		return StringUtils.getRandomTranslation(
			`commands:fight.actions.attacksResults.${packet.status}`,
			interaction.userLanguage,
			{
				attack: i18n.t(`models:fight_actions.${packet.fightActionId}.name`, {
					lng: interaction.userLanguage,
					interpolation: { escapeValue: false },
					count: 1
				}),
				interpolation: { escapeValue: false }
			}
		);
	}

	private manageReceivedEffects(packet: CommandFightHistoryItemPacket, interaction: DraftbotInteraction): string {
		let effectsString = "";
		Object.entries(packet.fightActionEffectReceived!)
			.forEach(([key, value]) => {
				if (typeof value === "number") {
					effectsString += i18n.t(`commands:fight.actions.fightActionEffects.self.${key}`, {
						lng: interaction.userLanguage,
						operator: value >= 0 ? FightConstants.OPERATOR.PLUS : FightConstants.OPERATOR.MINUS,
						amount: Math.abs(value)
					});
				}
				else if (value) {
					effectsString += i18n.t(`commands:fight.actions.fightActionEffects.self.${key}`, {
						lng: interaction.userLanguage,
						effect: i18n.t(`models:fight_actions.${value}.name`, {
							lng: interaction.userLanguage
						})
					});
				}
			});
		return effectsString;
	}
}

import {DraftbotCachedMessage} from "./DraftbotCachedMessage";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import i18n from "../translations/i18n";
import {CommandFightHistoryItemPacket} from "../../../Lib/src/packets/fights/FightHistoryItemPacket";
import {EmoteUtils} from "../utils/EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {FightAlterationState} from "../../../Lib/src/types/FightAlterationResult";
import {FightActionStatus} from "../../../Lib/src/types/FightActionStatus";
import {StringUtils} from "../utils/StringUtils";

export class DraftbotHistoryCachedMessage extends DraftbotCachedMessage<CommandFightHistoryItemPacket> {
	readonly duration = 30;

	get type(): string {
		return "history";
	}

	updateMessage = async (packet: CommandFightHistoryItemPacket, context: PacketContext): Promise<void> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const fighter = packet.fighterKeycloakId ?
			(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.fighterKeycloakId))!.attributes.gameUsername[0] :
			i18n.t(`models:monster.${packet.monsterId}`, {lng: interaction.userLanguage});

		let newLine = i18n.t("commands:fight.actions.intro", {
			lng: interaction.userLanguage,
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_actions[packet.fightActionId]),
			fighter: fighter
		});
		let attackName = ""; // Name of the attack, used to display the attack name in the message
		if (packet.status && Object.values(FightAlterationState).includes(packet.status as FightAlterationState)) {
			newLine += i18n.t(`models:fight_actions.${packet.fightActionId}.${packet.status}`, {
				lng: interaction.userLanguage
			});
		}
		else {
			attackName = i18n.t(`models:fight_actions.${packet.fightActionId}.name`, {
				lng: interaction.userLanguage,
				count: 1
			});
		}

		// Second, display cases where the fightAction is an attack
		switch (packet.status) {
		case FightActionStatus.CRITICAL:
			newLine += StringUtils.getRandomTranslation("commands:fight.actions.attacksResults.critical", interaction.userLanguage, {
				attack: attackName
			});
			break;
		case FightActionStatus.MISSED:
			newLine += StringUtils.getRandomTranslation("commands:fight.actions.attacksResults.missed", interaction.userLanguage, {
				attack: attackName
			});
			break;
		case FightActionStatus.NORMAL:
			newLine += StringUtils.getRandomTranslation("commands:fight.actions.attacksResults.normal", interaction.userLanguage, {
				attack: attackName
			});
			break;
		case FightActionStatus.MAX_USES:
			newLine += StringUtils.getRandomTranslation("commands:fight.actions.attacksResults.maxUses", interaction.userLanguage, {
				attack: attackName
			});
			break;
		case FightActionStatus.CHARGING:
			newLine += StringUtils.getRandomTranslation("commands:fight.actions.attacksResults.charging", interaction.userLanguage, {
				attack: attackName
			});
			break;
		default:
			// Nothing to do, not an attack
			break;
		}

		// Then we need to display the side effects of the attack if there are any
		if (packet.fightActionEffectDealt) {
			Object.entries(packet.fightActionEffectDealt!).forEach(([key, value]) => {
				const operator = value > 0 ? "+" : "-";
				newLine += i18n.t(`commands:fight.actions.fightActionEffects.opponent.${key}`, {
					lng: interaction.userLanguage,
					operator: operator,
					amount: Math.abs(value)
				});
			});
		}
		if (packet.fightActionEffectReceived) {
			Object.entries(packet.fightActionEffectReceived!).forEach(([key, value]) => {
				const operator = value > 0 ? "+" : "-";
				newLine += i18n.t(`commands:fight.actions.fightActionEffects.self.${key}`, {
					lng: interaction.userLanguage,
					operator: operator,
					amount: Math.abs(value)
				});
			});
		}

		const previousHistory = this.storedMessage?.content || "";
		const history = `${previousHistory}\n${newLine}`;
		await this.post({content: history});
	};
}

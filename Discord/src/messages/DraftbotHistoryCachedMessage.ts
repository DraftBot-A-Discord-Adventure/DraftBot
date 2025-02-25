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

		// First, display cases where the fightAction is an alteration
		switch (packet.alterationStatus) {
		case FightAlterationState.NEW:
			newLine += i18n.t(`models:fight_actions.${packet.fightActionId}.new`, {
				lng: interaction.userLanguage,
				damage: packet.damageReceived
			});
			break;
		case FightAlterationState.ACTIVE:
			newLine += i18n.t(`models:fight_actions.${packet.fightActionId}.active`, {
				lng: interaction.userLanguage,
				damage: packet.damageReceived
			});
			break;
		case FightAlterationState.NO_ACTION:
			newLine += i18n.t(`models:fight_actions.${packet.fightActionId}.noAction`, {
				lng: interaction.userLanguage
			});
			break;
		case FightAlterationState.RANDOM_ACTION:
			// Todo: implement this case
			break;
		case FightAlterationState.STOP:
			newLine += i18n.t(`models:fight_actions.${packet.fightActionId}.stop`, {
				lng: interaction.userLanguage,
				damage: packet.damageReceived
			});
			break;
		default:
			// nothing to do, not an alteration
			break;
		}

		// Second, display cases where the fightAction is an attack
		let keyAttackResultsValue = "commands:fight.actions.attacksResults";
		switch (packet.status) {
		case FightActionStatus.CRITICAL:
			keyAttackResultsValue += ".critical";
			break;
		case FightActionStatus.NORMAL:
			keyAttackResultsValue += ".normal";
			break;
		case FightActionStatus.MISSED:
			keyAttackResultsValue += ".missed";
			break;
		default:
			break;
		}
		const attack =
			newLine += StringUtils.getRandomTranslation(keyAttackResultsValue, interaction.userLanguage, {
				attack:
			});

		const previousHistory = this.storedMessage?.content || "";
		const history = `${previousHistory}\n${newLine}`;
		await this.post({content: history});
	};
}

import {DraftbotCachedMessage} from "./DraftbotCachedMessage";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import i18n from "../translations/i18n";
import {CommandFightHistoryItemPacket} from "../../../Lib/src/packets/fights/FightHistoryItemPacket";
import {EmoteUtils} from "../utils/EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";

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

		const newLine = i18n.t("commands:fight.actions.intro", {
			lng: interaction.userLanguage,
			emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_actions[packet.fightActionId]),
			fighter: fighter
		});


		const previousHistory = this.storedMessage?.content || "";

		const history = `${previousHistory}\n${newLine}`;
		await this.post({content: history});
	};
}

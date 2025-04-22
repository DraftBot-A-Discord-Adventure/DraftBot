import { DraftbotCachedMessage } from "./DraftbotCachedMessage";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../bot/DraftBotShard";
import { DraftBotEmbed } from "./DraftBotEmbed";
import i18n from "../translations/i18n";
import { CommandFightStatusPacket } from "../../../Lib/src/packets/fights/FightStatusPacket";
import { escapeUsername } from "../utils/StringUtils";

export class DraftbotFightStatusCachedMessage extends DraftbotCachedMessage<CommandFightStatusPacket> {
	readonly duration = 30;

	get type(): string {
		return "fightStatus";
	}

	updateMessage = async (packet: CommandFightStatusPacket, context: PacketContext): Promise<null> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const lng = interaction.userLanguage;
		const attacker = packet.activeFighter.keycloakId
			? escapeUsername((await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.activeFighter.keycloakId))!.attributes.gameUsername[0])
			: i18n.t(`models:monsters.${packet.activeFighter.monsterId}.name`, { lng });
		const defender = packet.defendingFighter.keycloakId
			? escapeUsername((await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.defendingFighter.keycloakId))!.attributes.gameUsername[0])
			: i18n.t(`models:monsters.${packet.defendingFighter.monsterId}.name`, { lng });
		const keyProlongation = packet.numberOfTurn > packet.maxNumberOfTurn ? "prolongation" : "noProlongation";

		const embed = new DraftBotEmbed()
			.setTitle(i18n.t("commands:fight.summarize.title", { lng }))
			.setDescription(
				i18n.t("commands:fight.summarize.intro.start", {
					lng,
					state: i18n.t(`commands:fight.summarize.intro.${keyProlongation}`, {
						lng,
						currentTurn: packet.numberOfTurn,
						maxTurn: packet.maxNumberOfTurn
					})
				})
				+ i18n.t("commands:fight.summarize.attacker", {
					lng,
					pseudo: attacker
				})
				+ i18n.t("commands:fight.summarize.stats", {
					lng,
					...packet.activeFighter.stats
				})
				+ i18n.t("commands:fight.summarize.defender", {
					lng,
					pseudo: defender
				})
				+ i18n.t("commands:fight.summarize.stats", {
					lng,
					...packet.defendingFighter.stats
				})
			);

		await this.post({ embeds: [embed] });
		return null;
	};
}

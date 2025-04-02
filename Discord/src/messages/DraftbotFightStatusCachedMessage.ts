import { DraftbotCachedMessage } from "./DraftbotCachedMessage";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../bot/DraftBotShard";
import { DraftBotEmbed } from "./DraftBotEmbed";
import i18n from "../translations/i18n";
import { CommandFightStatusPacket } from "../../../Lib/src/packets/fights/FightStatusPacket";

export class DraftbotFightStatusCachedMessage extends DraftbotCachedMessage<CommandFightStatusPacket> {
	readonly duration = 30;

	get type(): string {
		return "fightStatus";
	}

	updateMessage = async (packet: CommandFightStatusPacket, context: PacketContext): Promise<undefined> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const attacker = packet.activeFighter.keycloakId
			? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.activeFighter.keycloakId))!.attributes.gameUsername[0]
			: i18n.t(`models:monsters.${packet.activeFighter.monsterId}.name`, { lng: interaction.userLanguage });
		const defender = packet.defendingFighter.keycloakId
			? (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.defendingFighter.keycloakId))!.attributes.gameUsername[0]
			: i18n.t(`models:monsters.${packet.defendingFighter.monsterId}.name`, { lng: interaction.userLanguage });
		const keyProlongation = packet.numberOfTurn > packet.maxNumberOfTurn ? "prolongation" : "noProlongation";

		const embed = new DraftBotEmbed()
			.setTitle(i18n.t("commands:fight.summarize.title", { lng: interaction.userLanguage }))
			.setDescription(
				i18n.t("commands:fight.summarize.intro.start", {
					lng: interaction.userLanguage,
					state: i18n.t(`commands:fight.summarize.intro.${keyProlongation}`, {
						lng: interaction.userLanguage,
						currentTurn: packet.numberOfTurn,
						maxTurn: packet.maxNumberOfTurn,
						interpolation: { escapeValue: false }
					}),
					interpolation: { escapeValue: false }
				})
				+ i18n.t("commands:fight.summarize.attacker", {
					lng: interaction.userLanguage,
					pseudo: attacker
				})
				+ i18n.t("commands:fight.summarize.stats", {
					lng: interaction.userLanguage,
					...packet.activeFighter.stats
				})
				+ i18n.t("commands:fight.summarize.defender", {
					lng: interaction.userLanguage,
					pseudo: defender
				})
				+ i18n.t("commands:fight.summarize.stats", {
					lng: interaction.userLanguage,
					...packet.defendingFighter.stats
				})
			);

		await this.post({ embeds: [embed] });
		return undefined;
	};
}

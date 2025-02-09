import {DraftbotCachedMessage, DraftbotCachedMessages} from "./DraftbotCachedMessage";
import {CommandFightStatusPacket} from "../../../Lib/src/packets/commands/CommandFightPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {DraftBotEmbed} from "./DraftBotEmbed";
import i18n from "../translations/i18n";

export class DraftbotFightStatusCachedMessage extends DraftbotCachedMessage {
	duration = 30;

	static readonly type: string = "fightStatus";

	constructor(originalMessageId: string) {
		super(originalMessageId, DraftbotFightStatusCachedMessage.type);
	}

	updateMessage = async (packet: CommandFightStatusPacket, context: PacketContext): Promise<void> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const attacker = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.fightInitiator.keycloakId))!;
		const defender = packet.fightOpponent.keycloakId ?
			(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.fightOpponent.keycloakId))!.attributes.gameUsername[0] :
			i18n.t(`models:monster.${packet.fightOpponent.monsterId}`, {lng: interaction.userLanguage});
		const keyProlongation = packet.numberOfTurn > packet.maxNumberOfTurn ? "prolongation" : "noProlongation";

		const embed = new DraftBotEmbed()
			.setTitle(i18n.t("commands:fight.summarize.title", {lng: interaction.userLanguage}))
			.setDescription(
				i18n.t("commands:fight.summarize.intro.start", {
					lng: interaction.userLanguage,
					state: i18n.t(`commands:fight.summarize.intro.${keyProlongation}`, {
						lng: interaction.userLanguage,
						currentTurn: packet.numberOfTurn,
						maxTurn: packet.maxNumberOfTurn
					})
				}) +
				i18n.t("commands:fight.summarize.attacker", {
					lng: interaction.userLanguage,
					pseudo: attacker.attributes.gameUsername[0]
				}) +
				i18n.t("commands:fight.summarize.stats", {
					lng: interaction.userLanguage,
					power: packet.fightInitiator.stats.power,
					attack: packet.fightInitiator.stats.attack,
					defense: packet.fightInitiator.stats.defense,
					speed: packet.fightInitiator.stats.speed,
					breath: packet.fightInitiator.stats.breath,
					maxBreath: packet.fightInitiator.stats.maxBreath,
					breathRegen: packet.fightInitiator.stats.breathRegen
				}) +
				i18n.t("commands:fight.summarize.defender", {
					lng: interaction.userLanguage,
					pseudo: defender
				}) +
				i18n.t("commands:fight.summarize.stats", {
					lng: interaction.userLanguage,
					power: packet.fightOpponent.stats.power,
					attack: packet.fightOpponent.stats.attack,
					defense: packet.fightOpponent.stats.defense,
					speed: packet.fightOpponent.stats.speed,
					breath: packet.fightOpponent.stats.breath,
					maxBreath: packet.fightOpponent.stats.maxBreath,
					breathRegen: packet.fightOpponent.stats.breathRegen
				})
			);

		await this.post({embeds: [embed]});
	};

	// Retrieve the cached message from the global cache by using the composite key
	static get(interactionId: string): DraftbotFightStatusCachedMessage | undefined {
		return DraftbotCachedMessages.get(`${interactionId}-${DraftbotFightStatusCachedMessage.type}`) as DraftbotFightStatusCachedMessage;
	}
}

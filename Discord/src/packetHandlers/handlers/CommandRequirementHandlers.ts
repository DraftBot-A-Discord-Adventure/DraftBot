import {packetHandler} from "../PacketHandler";
import {RequirementEffectPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementEffectPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {effectsErrorTextValue, replyErrorMessage} from "../../utils/ErrorUtils";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {RequirementGuildNeededPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildNeededPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {RequirementGuildRolePacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildRolePacket";
import {RequirementLevelPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementLevelPacket";
import {RequirementRightPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementRightPacket";

export default class CommandRequirementHandlers {
	@packetHandler(RequirementEffectPacket)
	async requirementEffect(packet: RequirementEffectPacket, context: PacketContext): Promise<void> {
		const keycloakUser = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!);
		if (keycloakUser && context.discord?.language) {
			effectsErrorTextValue(keycloakUser, context.discord?.language, true, packet.currentEffectId, packet.remainingTime);
		}
	}

	@packetHandler(RequirementGuildNeededPacket)
	async requirementGuildNeeded(packet: RequirementGuildNeededPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyErrorMessage(interaction, i18n.t("error:notInAGuild", {lng: interaction.userLanguage}));
	}

	@packetHandler(RequirementGuildRolePacket)
	async requirementGuildRole(packet: RequirementGuildRolePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyErrorMessage(interaction, i18n.t("error:notAuthorizedError", {lng: interaction.userLanguage}));
	}

	@packetHandler(RequirementLevelPacket)
	async requirementLevel(packet: RequirementLevelPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyErrorMessage(interaction, i18n.t("error:levelTooLow", {lng: interaction.userLanguage, level: packet.requiredLevel}));
	}

	@packetHandler(RequirementRightPacket)
	async requirementRight(packet: RequirementRightPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyErrorMessage(interaction, i18n.t("error:notAuthorizedRight", {lng: interaction.userLanguage}));
	}
}
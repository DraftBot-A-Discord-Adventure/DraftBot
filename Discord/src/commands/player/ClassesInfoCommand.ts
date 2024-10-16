import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {
	CommandClassesInfoPacketReq,
	CommandClassesInfoPacketRes
} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {Effect} from "../../../../Lib/src/enums/Effect";
import { Constants } from "../../../../Lib/src/constants/Constants";
import {ClassInfoConstants} from "../../../../Lib/src/constants/ClassInfoConstants";

function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandClassesInfoPacketReq> {
	return Promise.resolve(makePacket(CommandClassesInfoPacketReq, {keycloakId: user.id, language: interaction.userLanguage}));
}

export async function handleCommandClassesInfoPacketRes(packet: CommandClassesInfoPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				content: "commands:error.playerDoesntExist",
				ephemeral: true
			});
		}

		// Todo: handle the main and sub embeds in a specific function and fetch the classes available to the player
		const embed = new DraftBotEmbed().setTitle(i18n.t("commands:classesInfo.title.list", {
			lng: interaction.userLanguage
		}));

		const classesList = [];
		for (const classStats of packet.data?.classesStats ?? []) {
			classesList.push(ClassInfoConstants.FIELDS_VALUE
				.replace("{name}", `${classStats.emoji} ${i18n.t(`models:classes.${classStats.id}`, {
					lng: classStats.lng
				})}`)
				.replace("{health}", classStats.health.toString())
				.replace("{attack}", classStats.attack.toString())
				.replace("{defense}", classStats.defense.toString())
				.replace("{speed}", classStats.speed.toString())
				.replace("{baseBreath}", classStats.baseBreath.toString())
				.replace("{maxBreath}", classStats.maxBreath.toString())
				.replace("{breathRegen}", classStats.breathRegen.toString())
				.replace("{fightPoint}", classStats.fightPoint.toString()));
		}

		embed.setDescription(`${i18n.t("commands:classesInfo.description.list", {
			lng: interaction.userLanguage
		})}\n\n${classesList.join("\n")}`);
		await interaction.reply({embeds: [embed]});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("classesInfo"),
	getPacket,
	requirements: {
		disallowEffects: [Effect.DEAD, Effect.NOT_STARTED],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};
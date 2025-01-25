import Player, {Players} from "../../core/database/game/models/Player";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Guilds} from "../../core/database/game/models/Guild";
import {
	CommandGuildElderRemoveAcceptPacketRes,
	CommandGuildElderRemoveFoundPlayerPacketRes,
	CommandGuildElderRemoveHimselfPacketRes, CommandGuildElderRemoveNotElderPacketRes,
	CommandGuildElderRemovePacketReq,
	CommandGuildElderRemoveRefusePacketRes,
	CommandGuildElderRemoveSameGuildPacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildElderRemovePacket";
import {draftBotInstance} from "../../index";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {GuildRole} from "../../../../Lib/src/enums/GuildRole";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {ReactionCollectorGuildElderRemove} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildElderRemove";

/**
 * Return true if demotedPlayer can be demoted
 * @param player
 * @param demotedPlayer
 * @param response
 */
async function isEligible(player: Player, demotedPlayer: Player, response: DraftBotPacket[]): Promise<boolean> {
	if (demotedPlayer === null) {
		response.push(makePacket(CommandGuildElderRemoveFoundPlayerPacketRes, {}));
		return false;
	}
	let demotedGuild;
	try {
		demotedGuild = await Guilds.getById(demotedPlayer.guildId);
	}
	catch (error) {
		demotedGuild = null;
	}

	const guild = await Guilds.getById(player.guildId);
	if (demotedGuild === null || demotedGuild.id !== player.guildId) {
		response.push(makePacket(CommandGuildElderRemoveSameGuildPacketRes, {}));
		return false;
	}

	if (demotedPlayer.id === player.id) {
		response.push(makePacket(CommandGuildElderRemoveHimselfPacketRes, {}));
		return false;
	}

	if (demotedPlayer.id !== guild.elderId) {
		response.push(makePacket(CommandGuildElderRemoveNotElderPacketRes, {}));
		return false;
	}
	return true;
}

/**
 * Promote demotedPlayer as elder of the guild
 * @param player
 * @param demotedPlayer
 * @param response
 */
async function acceptGuildElderRemove(player: Player, demotedPlayer: Player, response: DraftBotPacket[]): Promise<void> {
	await player.reload();
	await demotedPlayer.reload();
	// Do all necessary checks again just in case something changed during the menu
	if (!await isEligible(player, demotedPlayer, response)) {
		return;
	}
	const guild = await Guilds.getById(player.guildId);
	guild.elderId = null;

	await Promise.all([
		demotedPlayer.save(),
		guild.save()
	]);
	draftBotInstance.logsDatabase.logGuildElderRemove(guild, demotedPlayer.id).then();

	response.push(makePacket(CommandGuildElderRemoveAcceptPacketRes, {
		demotedKeycloakId: demotedPlayer.keycloakId,
		guildName: guild.name
	}));
}

function endCallback(player: Player, demotedPlayer: Player): EndCallback {
	return async (collector, response): Promise<void> => {
		const reaction = collector.getFirstReaction();
		if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
			await acceptGuildElderRemove(player, demotedPlayer, response);
		}
		else {
			response.push(makePacket(CommandGuildElderRemoveRefusePacketRes, {demotedKeycloakId: demotedPlayer.keycloakId}));
		}
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_ELDER_REMOVE);
	};
}

export default class GuildElderRemoveCommand {
	@commandRequires(CommandGuildElderRemovePacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: GuildConstants.REQUIRED_LEVEL,
		guildNeeded: true,
		guildRoleNeeded: GuildRole.CHIEF
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandGuildElderRemovePacketReq, context: PacketContext): Promise<void> {
		const demotedPlayer = await Players.getAskedPlayer({keycloakId: packet.askedPlayerKeycloakId}, player);

		if (!await isEligible(player, demotedPlayer, response)) {
			return;
		}
		const guildName = (await Guilds.getById(player.guildId)).name;

		const collector = new ReactionCollectorGuildElderRemove(
			guildName,
			demotedPlayer.keycloakId
		);

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback(player,demotedPlayer)
		)
			.block(player.id, BlockingConstants.REASONS.GUILD_ELDER_REMOVE)
			.build();

		response.push(collectorPacket);
	}
}
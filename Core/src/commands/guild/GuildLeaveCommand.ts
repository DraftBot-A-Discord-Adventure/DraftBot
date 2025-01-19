import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "../../core/database/game/models/Player";
import {
	CommandGuildLeaveAcceptPacketRes, CommandGuildLeaveNotInAGuildPacketRes,
	CommandGuildLeavePacketReq, CommandGuildLeaveRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
import {Guilds} from "../../core/database/game/models/Guild";
import {ReactionCollectorGuildLeave} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildLeave";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {draftBotInstance} from "../../index";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase";


/**
 * Allow the player to leave its guild
 * @param player
 * @param response
 */
async function acceptGuildLeave(player: Player, response: DraftBotPacket[]): Promise<void> {
	await player.reload();
	// The player is no longer in a guild since the menu
	if (player.guildId === null) {
		response.push(makePacket(CommandGuildLeaveNotInAGuildPacketRes, {}));
		return;
	}
	const guild = await Guilds.getById(player.guildId);
	if (player.id === guild.chiefId) {
		// The guild's chief is leaving
		if (guild.elderId !== null) {
			await draftBotInstance.logsDatabase.logGuildElderRemove(guild, guild.elderId);
			await draftBotInstance.logsDatabase.logGuildChiefChange(guild, guild.elderId);
			// An elder can recover the guild
			player.guildId = null;
			const elder = await Players.getById(guild.elderId);
			guild.elderId = null;
			guild.chiefId = elder.id;
			response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
				newChiefKeycloakId: elder.keycloakId,
				guildName: guild.name
			}));

			await Promise.all([
				elder.save(),
				guild.save(),
				player.save()
			]);
			return;
		}
		// No elder => the guild will be destroyed
		await guild.completelyDestroyAndDeleteFromTheDatabase();
		response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
			guildName: guild.name,
			isGuildDestroyed: true
		}));
		return;
	}
	if (guild.elderId === player.id) {
		// The guild's elder is leaving
		await draftBotInstance.logsDatabase.logGuildElderRemove(guild, guild.elderId);
		guild.elderId = null;
	}
	LogsDatabase.logGuildLeave(guild, player.keycloakId).then();
	player.guildId = null;
	response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
		guildName: guild.name
	}));
	await Promise.all([
		player.save(),
		guild.save()
	]);
}

export default class GuildLeaveCommand {
	@commandRequires(CommandGuildLeavePacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: GuildConstants.REQUIRED_LEVEL,
		guildNeeded: true
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandGuildLeavePacketReq, context: PacketContext): Promise<void> {
		const guild = await Guilds.getById(player.guildId);
		const newChief = guild.chiefId === player.id && guild.elderId ? await Players.getById(guild.elderId) : null;

		const collector = new ReactionCollectorGuildLeave(
			guild.name,
			guild.chiefId === player.id && guild.elderId === null,
			newChief?.keycloakId
		);
		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptGuildLeave(player, response);
			}
			else {
				response.push(makePacket(CommandGuildLeaveRefusePacketRes, {}));
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_LEAVE);
		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.GUILD_LEAVE)
			.build();

		response.push(collectorPacket);
	}
}
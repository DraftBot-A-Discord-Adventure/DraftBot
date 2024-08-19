import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {
	CommandGuildCreateAcceptPacketRes,
	CommandGuildCreatePacketReq,
	CommandGuildCreatePacketRes,
	CommandGuildCreateRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
import {checkNameString} from "../../../../Lib/src/utils/StringUtils";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ReactionCollectorGuildCreate} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildCreate";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {GuildCreateConstants} from "../../../../Lib/src/constants/GuildCreateConstants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase";
import {MissionsController} from "../../core/missions/MissionsController";

async function acceptGuildCreate(player: Player, guildName: string, response: DraftBotPacket[]) {
	await player.reload();
	const guild = player.guildId ? await Guilds.getById(player.guildId) : null;
	let existingGuild;
	try {
		existingGuild = await Guilds.getByName(guildName);
	}
	catch (error) {
		existingGuild = null;
	}
	// do all necessary checks again just in case something changed during the menu
	if (existingGuild || guild || player.money < GuildCreateConstants.PRICE || !checkNameString(guildName, GuildConstants.GUILD_NAME_LENGTH_RANGE)) {
		response.push(makePacket(CommandGuildCreateRefusePacketRes, {})); // generic error, if the player want's the exact error, he can do the command again
		return;
	}

	// everything is valid, start guild creation process:
	const newGuild = await Guild.create({
		name: guildName,
		chiefId: player.id
	});
	player.guildId = newGuild.id;
	await player.spendMoney({
		amount: GuildCreateConstants.PRICE,
		response,
		reason: NumberChangeReason.GUILD_CREATE
	});
	newGuild.updateLastDailyAt();
	await newGuild.save();
	await player.save();
	LogsDatabase.logGuildCreation(player.keycloakId, newGuild).then();
	await MissionsController.update(player, response, {missionId: "joinGuild"});
	await MissionsController.update(player, response, {
		missionId: "guildLevel",
		count: newGuild.level,
		set: true
	});

	response.push(makePacket(CommandGuildCreateAcceptPacketRes, {guildName}));
}

export default class GuildCreateCommand {
	@packetHandler(CommandGuildCreatePacketReq)
	async execute(client: WebsocketClient, packet: CommandGuildCreatePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {

		const player = await Players.getByKeycloakId(packet.keycloakId);
		const guild = player.guildId ? await Guilds.getById(player.guildId) : null;
		const playerMoney = player.money;
		if (guild) {
			response.push(makePacket(CommandGuildCreatePacketRes, {
				playerMoney,
				foundGuild: true
			}));
			return;
		}
		let existingGuild;
		try {
			existingGuild = await Guilds.getByName(packet.askedGuildName);
		}
		catch (error) {
			existingGuild = null;
		}

		if (existingGuild) {
			// A guild with this name already exists
			response.push(makePacket(CommandGuildCreatePacketRes, {
				playerMoney,
				foundGuild: false,
				guildNameIsAvailable: false
			}));
			return;
		}

		if (!checkNameString(packet.askedGuildName, GuildConstants.GUILD_NAME_LENGTH_RANGE)) {
			response.push(makePacket(CommandGuildCreatePacketRes, {
				playerMoney,
				foundGuild: false,
				guildNameIsAvailable: true,
				guildNameIsAcceptable: false
			}));
			return;
		}
		response.push(makePacket(CommandGuildCreatePacketRes, {
			playerMoney,
			foundGuild: false,
			guildNameIsAvailable: true,
			guildNameIsAcceptable: true
		}));

		if (playerMoney < GuildCreateConstants.PRICE) {
			return; // we don't want to send the menu if the player do not have enough money
		}

		// Send collector
		const collector = new ReactionCollectorGuildCreate(
			packet.askedGuildName
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptGuildCreate(player, packet.askedGuildName, response);
			}
			else {
				response.push(makePacket(CommandGuildCreateRefusePacketRes, {}));
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_CREATE);
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
			.block(player.id, BlockingConstants.REASONS.GUILD_CREATE)
			.build();

		response.push(collectorPacket);
	}
}
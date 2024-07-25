import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {Guilds} from "../../core/database/game/models/Guild";
import {Maps} from "../../core/maps/Maps";
import {MapCache} from "../../core/maps/MapCache";
import {
	CommandGuildCreatePacketReq,
	CommandGuildCreatePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildCreatePacket";
import {checkNameString} from "../../../../Lib/src/utils/StringUtils";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";

export default class GuildCreateCommand {
	@packetHandler(CommandGuildCreatePacketReq)
	async execute(client: WebsocketClient, packet: CommandGuildCreatePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {


		const player = await Players.getByKeycloakId(packet.keycloakId);
		const guild = player.guildId ? await Guilds.getById(player.guildId) : null;

		if (guild) {
			response.push(makePacket(CommandGuildCreatePacketRes, {
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
				foundGuild: false,
				guildNameIsAvailable: false
			}));
			return;
		}

		if (!checkNameString(packet.askedGuildName, GuildConstants.GUILD_NAME_LENGTH_RANGE)) {
			response.push(makePacket(CommandGuildCreatePacketRes, {
				foundGuild: false,
				guildNameIsAvailable: true,
				guildNameIsAcceptable: false
			}));
			return;
		}
		response.push(makePacket(CommandGuildCreatePacketRes, {
			foundGuild: false,
			guildNameIsAvailable: true,
			guildNameIsAcceptable: true
		}));


		const members = await Players.getByGuild(guild.id);
		const rank = await guild.getRanking();
		const numberOfGuilds = await Guilds.getTotalRanked();
		const membersPveAlliesIds = (await Maps.getGuildMembersOnPveIsland(player)).map((player) => player.id);
		const isUnranked = rank > -1;

		response.push(makePacket(CommandGuildPacketRes, {
			foundGuild: true,
			askedPlayerKeycloakId: player.keycloakId,
			data: {
				name: guild.name,
				description: guild.guildDescription,
				chiefId: guild.chiefId,
				elderId: guild.elderId,
				level: guild.level,
				isMaxLevel: guild.isAtMaxLevel(),
				experience: {
					value: guild.experience,
					max: guild.getExperienceNeededToLevelUp()
				},
				rank: {
					unranked: isUnranked,
					rank,
					numberOfGuilds,
					score: guild.score
				},
				members: await Promise.all(
					members.map(async member => ({
						id: member.id,
						keycloakId: member.keycloakId,
						rank: await Players.getRankById(member.id),
						score: member.score,
						islandStatus: {
							isOnPveIsland: Maps.isOnPveIsland(member),
							isOnBoat: MapCache.boatEntryMapLinks.includes(member.mapLinkId),
							isPveIslandAlly: membersPveAlliesIds.includes(member.id),
							isInactive: member.isInactive(),
							cannotBeJoinedOnBoat: member.isNotActiveEnoughToBeJoinedInTheBoat()
						}
					}))
				)
			}
		}));

	}
}
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {CommandGuildPacketReq, CommandGuildPacketRes} from "../../../../Lib/src/packets/commands/CommandGuildPacket";
import {Maps} from "../../core/maps/Maps";
import {MapCache} from "../../core/maps/MapCache";

export default class GuildCommand {
	@packetHandler(CommandGuildPacketReq)
	async execute(packet: CommandGuildPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		let guild: Guild;
		const player = packet.askedPlayer.keycloakId ? await Players.getByKeycloakId(packet.askedPlayer.keycloakId) : await Players.getByRank(packet.askedPlayer.rank);
		if (packet.askedGuildName) {
			try {
				guild = await Guilds.getByName(packet.askedGuildName);
			}
			catch (error) {
				guild = null;
			}
		}
		else {
			guild = player.guildId ? await Guilds.getById(player.guildId) : null;
		}

		if (!guild) {
			response.push(makePacket(CommandGuildPacketRes, {
				foundGuild: false
			}));
		}
		else {
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
}
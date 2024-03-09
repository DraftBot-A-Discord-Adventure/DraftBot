import {PetEntities} from "../../core/database/game/models/PetEntity";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {FightConstants} from "../../core/constants/FightConstants";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {Constants} from "../../core/Constants";
import {hoursToMilliseconds} from "../../../../Lib/src/utils/TimeUtils";
import {PetDataController} from "../../data/Pet";
import {CommandGuildPacketReq, CommandGuildPacketRes} from "../../../../Lib/src/packets/commands/CommandGuildPacket";

export default class GuildCommand {
	@packetHandler(CommandGuildPacketReq)
	async execute(client: WebsocketClient, packet: CommandGuildPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		let guild: Guild;
		if (packet.askedGuildName) {
			try {
				guild = await Guilds.getByName(packet.askedGuildName);
			}
			catch (error) {
				guild = null;
			}
		}
		else {
			const player = packet.askedPlayer.keycloakId ? await Players.getByKeycloakId(packet.askedPlayer.keycloakId) : await Players.getByRank(packet.askedPlayer.rank);
			guild = player.guildId ? await Guilds.getById(player.guildId) : null;
		}

		if (!guild) {
			response.push(makePacket(CommandGuildPacketRes, {
				foundGuild: false
			}));
		}
		else {
			const rank = await Players.getRankById(player.id);
			const numberOfPlayers = await Players.getNbPlayersHaveStartedTheAdventure();
			const isUnranked = rank > numberOfPlayers;
			const petEntity = player.petId ? await PetEntities.getById(player.petId) : null;
			const petModel = player.petId ? PetDataController.instance.getById(petEntity.id) : null;
			const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
			const playerActiveObjects = await InventorySlots.getMainSlotsItems(player.id);
			const badges = player.badges === "" || !player.badges ? [] : player.badges.split("-");
			if (new Date().valueOf() - player.topggVoteAt.valueOf() < hoursToMilliseconds(Constants.TOPGG.BADGE_DURATION)) {
				badges.push(Constants.TOPGG.BADGE);
			}
			const destinationId = player.getDestinationId();

			response.push(makePacket(CommandGuildPacketRes, {
				foundGuild: true,
				data: {
					name: guild.name,
					description: guild.guildDescription,
					chiefId: guild.chiefId,
					elderId: guild.elderId,
					level: guild.level,
					experience: {
						value: guild.experience,
						max: guild.getExperienceNeededToLevelUp()
					},
					rank: {
						unranked: isUnranked,
						rank,
						numberOfGuilds: numberOfPlayers,
						score: guild.score
					},
					members: guild.members.map(member => ({
						keycloakId: member.keycloakId,
						rank: member.rank,
						score: member.score,
						islandStatus: {
							isOnPveIsland: member.isOnPveIsland,
							isOnBoat: member.isOnBoat,
							isPveIslandAlly: member.isPveIslandAlly,
							isInactive: member.isInactive,
							cannotBeJoinedOnBoat: member.cannotBeJoinedOnBoat
						}
					}))
				}

					badges,
					guild: guild?.name,
					level: player.level,
					rank: {
						rank: isUnranked ? -1 : rank,
						numberOfPlayers,
						score: player.score,
						unranked: isUnranked
					},
					class: player.class,
					color: player.getProfileColor(),
					pet: petEntity ? {
						id: petEntity.id,
						nickname: petEntity.nickname,
						rarity: petModel.rarity
					} : null,
					destination: destinationId,
					effect: player.checkEffect() ? {
						effect: player.effect,
						timeLeft: player.effectEndDate.valueOf() - Date.now(),
						healed: new Date() >= player.effectEndDate
					} : null,
					fightRanking: player.level >= FightConstants.REQUIRED_LEVEL ? {
						glory: player.gloryPoints,
						league: player.getLeague().id
					} : null,
					missions: {
						gems: missionsInfo.gems,
						campaignProgression: getCampaignProgression(missionsInfo)
					},
					stats: player.level >= Constants.CLASS.REQUIRED_LEVEL ? {
						attack: player.getCumulativeAttack(playerActiveObjects),
						defense: player.getCumulativeDefense(playerActiveObjects),
						speed: player.getCumulativeSpeed(playerActiveObjects),
						energy: {
							value: player.getCumulativeFightPoint(),
							max: player.getMaxCumulativeFightPoint()
						},
						breath: {
							base: player.getBaseBreath(),
							max: player.getMaxBreath(),
							regen: player.getBreathRegen()
						}
					} : null,
					experience: {
						value: player.experience,
						max: player.getExperienceNeededToLevelUp()
					},
					health: {
						value: player.health,
						max: player.getMaxHealth()
					},
					money: player.money
				}
			}));
		}
	}
}
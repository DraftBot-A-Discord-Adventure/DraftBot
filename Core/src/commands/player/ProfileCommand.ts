import {PetEntities} from "../../core/database/game/models/PetEntity";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandProfilePacketReq,
	CommandProfilePacketRes
} from "../../../../Lib/src/packets/commands/CommandProfilePacket";
import {Campaign} from "../../core/missions/Campaign";
import {Players} from "../../core/database/game/models/Player";
import {Guilds} from "../../core/database/game/models/Guild";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {hoursToMilliseconds} from "../../../../Lib/src/utils/TimeUtils";
import {PetDataController} from "../../data/Pet";
import {MapLocationDataController} from "../../data/MapLocation";

/**
 * Get the current campaign progression of the player
 * @param missionsInfo
 */
function getCampaignProgression(missionsInfo: PlayerMissionsInfo): number {
	return missionsInfo.campaignProgression === 0 ? 100 : Math.round(Campaign.getAmountOfCampaignCompleted(missionsInfo.campaignBlob) / Campaign.getMaxCampaignNumber() * 100);
}

export default class ProfileCommand {
	@packetHandler(CommandProfilePacketReq)
	async execute(packet: CommandProfilePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = packet.askedPlayer.keycloakId ? await Players.getByKeycloakId(packet.askedPlayer.keycloakId) : await Players.getByRank(packet.askedPlayer.rank);

		if (!player) {
			response.push(makePacket(CommandProfilePacketRes, {
				foundPlayer: false
			}));
		}
		else {
			const guild = player.guildId ? await Guilds.getById(player.guildId) : null;
			const rank = await Players.getRankById(player.id);
			const numberOfPlayers = await Players.getNbPlayersHaveStartedTheAdventure();
			const isUnranked = rank > numberOfPlayers;
			const petEntity = player.petId ? await PetEntities.getById(player.petId) : null;
			const petModel = player.petId ? PetDataController.instance.getById(petEntity.typeId) : null;
			const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
			const playerActiveObjects = await InventorySlots.getMainSlotsItems(player.id);
			const badges = player.badges === "" || !player.badges ? [] : player.badges.split("-");
			if (new Date().valueOf() - player.topggVoteAt.valueOf() < hoursToMilliseconds(Constants.TOPGG.BADGE_DURATION)) {
				badges.push(Constants.TOPGG.BADGE);
			}
			const destinationId = player.getDestinationId();

			response.push(makePacket(CommandProfilePacketRes, {
				foundPlayer: true,
				keycloakId: player.keycloakId,
				data: {
					badges,
					guild: guild?.name,
					level: player.level,
					rank: {
						rank: isUnranked ? -1 : rank,
						numberOfPlayers,
						score: player.score,
						unranked: isUnranked
					},
					classId: player.class,
					color: player.getProfileColor(),
					pet: petEntity ? {
						typeId: petModel.id,
						sex: petEntity.sex,
						nickname: petEntity.nickname,
						rarity: petModel.rarity
					} : null,
					destinationId,
					mapTypeId: destinationId ? MapLocationDataController.instance.getById(destinationId).type : null,
					effect: player.checkEffect() ? {
						effect: player.effectId,
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
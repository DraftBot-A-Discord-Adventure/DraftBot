import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {PetEntities, PetEntity} from "../../core/database/game/models/PetEntity";
import {
	CommandPetFreeAcceptPacketRes,
	CommandPetFreePacketReq,
	CommandPetFreePacketRes,
	CommandPetFreeRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {PetFreeConstants} from "../../../../Lib/src/constants/PetFreeConstants";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {ReactionCollectorPetFree} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetFree";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import {Constants} from "../../../../Lib/src/constants/Constants";


/**
 * Send the number of milliseconds that remain before the player is allowed to free his pet
 * (a player cannot free pets too often)
 * @param player
 */
function getCooldownRemainingTimeMs(player: Player): number {
	return PetFreeConstants.FREE_COOLDOWN - (new Date().valueOf() - player.lastPetFree.valueOf());
}

/**
 * Returns the amount of money the player is missing to free his pet (0 if the player has enough money)
 * @param player
 * @param playerPet
 */
function getMissingMoneyToFreePet(player: Player, playerPet: PetEntity): number {
	return playerPet.isFeisty() ? PetFreeConstants.FREE_FEISTY_COST - player.money : 0;
}

/**
 * Return true if the player is "lucky" and wins a meat piece for freeing his pet
 * @param guild
 * @param pPet
 */
function generateLuckyMeat(guild: Guild, pPet: PetEntity): boolean {
	return guild && guild.carnivorousFood + 1 <= GuildConstants.MAX_PET_FOOD[getFoodIndexOf(Constants.PET_FOOD.CARNIVOROUS_FOOD)]
		&& RandomUtils.draftbotRandom.realZeroToOneInclusive() <= PetFreeConstants.GIVE_MEAT_PROBABILITY
		&& !pPet.isFeisty();
}

/**
 * Accept the petfree request and free the pet
 * @param player
 * @param playerPet
 * @param response
 */
async function acceptPetFree(player: Player, playerPet: PetEntity, response: DraftBotPacket[]): Promise<void> {
	if (playerPet.isFeisty()) {
		await player.addMoney({
			amount: -PetFreeConstants.FREE_FEISTY_COST,
			response,
			reason: NumberChangeReason.PET_FREE
		});
	}

	LogsDatabase.logPetFree(playerPet).then();

	await playerPet.destroy();
	player.petId = null;
	player.lastPetFree = new Date();
	await player.save();

	let guild: Guild;
	let luckyMeat = false;
	try {
		guild = await Guilds.getById(player.guildId);
		luckyMeat = generateLuckyMeat(guild, playerPet);
		if (luckyMeat) {
			guild!.carnivorousFood += PetFreeConstants.MEAT_GIVEN;
			await guild!.save();
		}
	}
	catch (error) {
		guild = null;
	}

	response.push(makePacket(CommandPetFreeAcceptPacketRes, {
		petId: playerPet.typeId,
		petSex: playerPet.sex,
		petNickname: playerPet.nickname,
		freeCost: playerPet.isFeisty() ? PetFreeConstants.FREE_FEISTY_COST : 0,
		luckyMeat
	}));
}

export default class PetFreeCommand {

	@packetHandler(CommandPetFreePacketReq)
	async execute(client: WebsocketClient, packet: CommandPetFreePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);
		if (BlockingUtils.appendBlockedPacket(player, response)) {
			return;
		}

		const playerPet = await PetEntities.getById(player.petId);
		if (!playerPet) {
			response.push(makePacket(CommandPetFreePacketRes, {
				foundPet: false
			}));
			return;
		}

		// Check cooldown
		const cooldownRemainingTimeMs = getCooldownRemainingTimeMs(player);
		if (cooldownRemainingTimeMs > 0) {
			response.push(makePacket(CommandPetFreePacketRes, {
				foundPet: true,
				petCanBeFreed: false,
				cooldownRemainingTimeMs
			}));
			return;
		}

		// Check money
		const missingMoney = getMissingMoneyToFreePet(player, playerPet);
		if (missingMoney > 0) {
			response.push(makePacket(CommandPetFreePacketRes, {
				foundPet: true,
				petCanBeFreed: false,
				missingMoney
			}));
			return;
		}

		// Send collector
		const collector = new ReactionCollectorPetFree(
			playerPet.typeId,
			playerPet.sex,
			playerPet.nickname,
			playerPet.isFeisty() ? PetFreeConstants.FREE_FEISTY_COST : 0
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();

			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptPetFree(player, playerPet, response);
			}
			else {
				response.push(makePacket(CommandPetFreeRefusePacketRes, {}));
			}

			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.PET_FREE);
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
			.block(player.id, BlockingConstants.REASONS.PET_FREE)
			.build();

		response.push(collectorPacket);
	}
}
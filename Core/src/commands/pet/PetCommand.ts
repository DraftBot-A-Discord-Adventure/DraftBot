import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {CommandPetPacketReq, CommandPetPacketRes} from "../../../../Lib/src/packets/commands/CommandPetPacket";
import {PetEntities} from "../../core/database/game/models/PetEntity";
import {PetDataController} from "../../data/Pet";
import {CommandUtils} from "../../core/utils/CommandUtils";

export default class PetCommand {
	@packetHandler(CommandPetPacketReq)
	async execute(packet: CommandPetPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const initiatorPlayer = await Players.getByKeycloakId(context.keycloakId);
		if (!await CommandUtils.verifyStartedAndNotDead(initiatorPlayer, response)) {
			return;
		}

		const player = packet.askedPlayer.keycloakId
			? packet.askedPlayer.keycloakId === context.keycloakId
				? initiatorPlayer
				: await Players.getByKeycloakId(packet.askedPlayer.keycloakId)
			: await Players.getByRank(packet.askedPlayer.rank);
		const pet = await PetEntities.getById(player.petId);
		if (!pet) {
			response.push(makePacket(CommandPetPacketRes, {
				foundPet: false
			}));
		}
		else {
			const petModel = PetDataController.instance.getById(pet.typeId);
			response.push(makePacket(CommandPetPacketRes, {
				foundPet: true,
				data: {
					nickname: pet.nickname,
					petTypeId: petModel.id,
					rarity: petModel.rarity,
					sex: pet.sex,
					loveLevel: pet.getLoveLevelNumber()
				}
			}));
		}
	}
}
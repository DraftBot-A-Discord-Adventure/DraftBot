import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {CommandPetPacketReq, CommandPetPacketRes} from "../../../../Lib/src/packets/commands/CommandPetPacket";
import {Maps} from "../../core/maps/Maps";
import {MapCache} from "../../core/maps/MapCache";

import {PetEntities} from "../../core/database/game/models/PetEntity";
import {Pet, PetDataController} from "../../data/Pet";

export default class PetCommand {
	@packetHandler(CommandPetPacketReq)
	async execute(client: WebsocketClient, packet: CommandPetPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {

		const player = packet.askedPlayer.keycloakId ? await Players.getByKeycloakId(packet.askedPlayer.keycloakId) : await Players.getByRank(packet.askedPlayer.rank);
		const pet = await PetEntities.getById(player.petId);
		const petModel = PetDataController.instance.getById(pet.petId);
		if (!pet) {
			response.push(makePacket(CommandPetPacketRes, {
				foundPet: false
			}));
		}
		else {
			response.push(makePacket(CommandPetPacketRes, {
				foundPet: true,
				data: {
					nickname: pet.nickname,
					emote: pet.getPetEmote(),
					typeId: petModel.id,
					rarity: petModel.rarity,
					sex: pet.sex,
					loveLevel: pet.getLoveLevelNumber()
				}
			}));
		}
	}
}
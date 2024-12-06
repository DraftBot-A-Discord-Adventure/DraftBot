import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {CommandPetPacketReq, CommandPetPacketRes} from "../../../../Lib/src/packets/commands/CommandPetPacket";
import {PetEntities} from "../../core/database/game/models/PetEntity";
import {PetDataController} from "../../data/Pet";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";

export default class PetCommand {
	@commandRequires(CommandPetPacketReq, {
		notBlocked: false,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandPetPacketReq): Promise<void> {
		const toCheckPlayer = await Players.getAskedPlayer(packet.askedPlayer, player);
		const pet = await PetEntities.getById(toCheckPlayer.petId);
		if (!pet) {
			response.push(makePacket(CommandPetPacketRes, {
				foundPet: false
			}));
			return;
		}
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
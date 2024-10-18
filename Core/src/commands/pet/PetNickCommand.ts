import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {PetEntities} from "../../core/database/game/models/PetEntity";
import {
	CommandPetNickPacketReq,
	CommandPetNickPacketRes
} from "../../../../Lib/src/packets/commands/CommandPetNickPacket";
import {checkNameString} from "../../../../Lib/src/utils/StringUtils";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";


export default class PetNickCommand {

	@packetHandler(CommandPetNickPacketReq)
	async execute(packet: CommandPetNickPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);
		const playerPet = await PetEntities.getById(player.petId);

		if (!playerPet) {
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: false
			}));
			return;
		}

		const newPetNickName = packet.newNickname;

		if (!newPetNickName) {
			// No nickname provided, reset the nickname to None
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: true,
				newNickname: null,
				nickNameIsAcceptable: true
			}));
		}
		else {
			if (!checkNameString(newPetNickName, PetConstants.NICKNAME_LENGTH_RANGE)) {
				response.push(makePacket(CommandPetNickPacketRes, {
					foundPet: true,
					newNickname: newPetNickName,
					nickNameIsAcceptable: false
				}));
				return;
			}
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: true,
				newNickname: newPetNickName,
				nickNameIsAcceptable: true
			}));
		}

		playerPet.nickname = newPetNickName ? newPetNickName : null;
		await playerPet.save();
		console.log(playerPet);
	}
}
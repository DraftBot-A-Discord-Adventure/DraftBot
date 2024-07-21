import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
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
	async execute(client: WebsocketClient, packet: CommandPetNickPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);
		const playerPet = await PetEntities.getById(player.petId);

		if (!playerPet) {
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: false
			}));
			return;
		}

		const petNicknameUntested = packet.newNickname;

		if (!petNicknameUntested) {
			// No nickname provided, reset the nickname to None
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: true,
				newNickname: null
			}));
		}
		else {
			if (!checkNameString(petNicknameUntested, PetConstants.NICKNAME_LENGTH_RANGE)) {
				response.push(makePacket(CommandPetNickPacketRes, {
					foundPet: true,
					newNickname: petNicknameUntested,
					nickNameIsAcceptable: false
				}));
				return;
			}
			response.push(makePacket(CommandPetNickPacketRes, {
				foundPet: true,
				newNickname: petNicknameUntested,
				nickNameIsAcceptable: true
			}));
		}

		playerPet.nickname = petNicknameUntested;
		await playerPet.save();
	}
}
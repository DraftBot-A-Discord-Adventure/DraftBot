import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import Player from "../../../../core/database/game/models/Player";
import { BlockingUtils } from "../../../../core/utils/BlockingUtils";
import { BlockingConstants } from "../../../../../../Lib/src/constants/BlockingConstants";

export const commandInfo: ITestCommand = {
	name: "blockplayer",
	aliases: ["block"],
	commandFormat: "<time>",
	typeWaited: {
		time: TypeKey.INTEGER
	},
	description: "Vous bloque pendant un temps en secondes donné"
};

/**
 * Block your player for a given time
 */
const blockPlayerTestCommand: ExecuteTestCommandLike = (player: Player, args: string[]) => {
	const blockTime = parseInt(args[0], 10);
	if (blockTime <= 0) {
		throw new Error("Erreur block : on ne peut pas vous bloquer pendant un temps négatif ou nul !");
	}
	BlockingUtils.blockPlayer(player.keycloakId, BlockingConstants.REASONS.TEST, parseInt(args[1], 10));
	return `Vous êtes maintenant bloqué pendant ${args[1]} secondes !`;
};

commandInfo.execute = blockPlayerTestCommand;

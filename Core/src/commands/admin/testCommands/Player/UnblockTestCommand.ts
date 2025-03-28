import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";
import {BlockingUtils} from "../../../../core/utils/BlockingUtils";

export const commandInfo: ITestCommand = {
	name: "unblock",
	description: "Vous permet de vous débloquer lorsqu'une commande vous bloque (ATTENTION: si vous obtenez un exploit avec cette commande, ce n'en est pas un)"
};

/**
 * Unblock the player
 */
const unblockTestCommand: ExecuteTestCommandLike = (player) => {
	const reasons = BlockingUtils.getPlayerBlockingReason(player.keycloakId).map(r => {
		BlockingUtils.unblockPlayer(player.keycloakId, r);
		return r;
	});
	return `Vous vous êtes débloqué des raisons suivantes : ${reasons.join(", ")}`;
};

commandInfo.execute = unblockTestCommand;

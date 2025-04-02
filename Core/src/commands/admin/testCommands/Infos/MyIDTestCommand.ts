import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "myids",
	description: "Montre votre ID de joueur"
};

/**
 * Show your player's ID
 */
const myIDTestCommand: ExecuteTestCommandLike = player => `Player id: ${player.id}\nKeycloak id: ${player.keycloakId}`;

commandInfo.execute = myIDTestCommand;

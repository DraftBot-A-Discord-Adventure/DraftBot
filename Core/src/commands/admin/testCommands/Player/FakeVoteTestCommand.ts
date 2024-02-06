import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "fakevote",
	description: "Effectue un faux vote"
};

/**
 * Simulate a topgg vote
 */
const fakeVoteTestCommand: ExecuteTestCommandLike = () =>
	// TODO : check how to make votes in v5
	// Await DBL.userDBLVote(interaction.user.id);
	"Vous avez faussement voté !";

commandInfo.execute = fakeVoteTestCommand;
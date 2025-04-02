import GuildPet from "../database/game/models/GuildPet";

export type GuildLikeType = {
	id: number;
	name: string;
	creationDate: Date;
	chiefId: number;
	guildPets: GuildPet[];
};

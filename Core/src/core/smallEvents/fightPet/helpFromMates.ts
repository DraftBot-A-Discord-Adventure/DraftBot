import { Maps } from "../../maps/Maps";
import { FightPetActionFunc } from "../../../data/FightPetAction";

export const fightPetAction: FightPetActionFunc = async (player, pet) => pet.rarity <= (await Maps.getGuildMembersOnPveIsland(player)).length;

import {DraftBotPacket} from "../DraftBotPacket";
import {CompletedMission} from "../../interfaces/CompletedMission";

export interface MissionsCompletedPacket extends DraftBotPacket {
    missions: CompletedMission[]
}
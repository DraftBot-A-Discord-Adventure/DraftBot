import {DataController} from "./DataController";
import {Data} from "./Data";
import {MissionDifficulty} from "../core/missions/MissionDifficulty";
import {RandomUtils} from "../core/utils/RandomUtils";

export class Mission extends Data<string> {
    public readonly campaignOnly: boolean;

    public readonly difficulties?: {
        easy?: number[];

        medium?: number[];

        hard?: number[];
    }

    public readonly objectives?: number[];

    public readonly gems?: number[];

    public readonly xp?: number[];

    public readonly points?: number[];

    public readonly money?: number[];

    public readonly expirations?: number[];

    public readonly dailyIndexes?: number[];


    public canBeEasy(): boolean {
        return this.difficulties?.easy?.length !== 0;
    }

    public canBeMedium(): boolean {
        return this.difficulties?.medium?.length !== 0;
    }

    public canBeHard(): boolean {
        return this.difficulties?.hard?.length !== 0;
    }
}

export class MissionDataController extends DataController<string, Mission> {
    static readonly instance: MissionDataController = new MissionDataController("missions");

    newInstance(): Mission {
        return new Mission();
    }

    public getRandomMission(difficulty: MissionDifficulty, exceptions: string = null): Mission {
        const filter: (mission: Mission) => boolean =
            difficulty === MissionDifficulty.EASY ? (mission) => mission.canBeEasy()
                : difficulty === MissionDifficulty.MEDIUM ? (mission) => mission.canBeMedium()
                : (mission) => mission.canBeHard()

        return RandomUtils.draftbotRandom.pick(
            this.getValuesArray()
                .filter((mission) => filter(mission) && mission.campaignOnly === false)
        );
    }

    public getRandomDailyMission(): Mission {
        return RandomUtils.draftbotRandom.pick(
            this.getValuesArray()
                .filter((mission) => mission.dailyIndexes?.length !== 0 && !mission.campaignOnly)
        );
    }
}
import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData, ReactionCollectorReaction,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";

export type ReactionCollectorChangeClassDetails = {
	id: number;

	energy: number;

	attack: number;

	defense: number;

	speed: number;

	initialBreath: number;

	maxBreath: number;

	breathRegen: number;

	health: number;
};

export class ReactionCollectorChangeClassData extends ReactionCollectorData {
	classesDetails!: ReactionCollectorChangeClassDetails[];

	cooldownSeconds!: number;
}

export class ReactionCollectorChangeClassReaction extends ReactionCollectorReaction {
	classId!: number;
}

export class ReactionCollectorChangeClass extends ReactionCollector {
	private readonly classesDetails: ReactionCollectorChangeClassDetails[];

	private readonly cooldownSeconds: number;

	constructor(classesDetails: ReactionCollectorChangeClassDetails[], cooldownSeconds: number) {
		super();
		this.classesDetails = classesDetails;
		this.cooldownSeconds = cooldownSeconds;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				...this.classesDetails.map(classDetails =>
					this.buildReaction(ReactionCollectorChangeClassReaction, {
						classId: classDetails.id
					})),
				this.buildReaction(ReactionCollectorRefuseReaction, {})
			],
			data: this.buildData(ReactionCollectorChangeClassData, {
				classesDetails: this.classesDetails,
				cooldownSeconds: this.cooldownSeconds
			})
		};
	}
}

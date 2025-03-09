import {PetAssistance, PetAssistanceDataController} from "../../data/PetAssistance";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

// Map to store pet behaviors by pet ID
const petAssistanceList = new Map<number, PetAssistance>();

/**
 * Initialize all pet behaviors in a map so they can be accessed by pet ID
 */
export function initializeAllPetBehaviors(): void {
	const petBehaviors = [
		{
			petIds: [PetConstants.PETS.SHARK],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SCARE_FISH
		},
		{
			petIds: [
				PetConstants.PETS.FISH,
				PetConstants.PETS.TROPICAL_FISH,
				PetConstants.PETS.PUFFERFISH,
				PetConstants.PETS.DOLPHIN
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.FISH_PROTECT_AGAINST_FIRE
		},
		{
			petIds: [
				PetConstants.PETS.LION,
				PetConstants.PETS.TIGER,
				PetConstants.PETS.LEOPARD
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.CLAWS
		},
		{
			petIds: [
				PetConstants.PETS.CAT,
				PetConstants.PETS.BADGER
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SMALL_CLAWS
		},
		{
			petIds: [PetConstants.PETS.DRAGON],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SPIT_FIRE
		},
		{
			petIds: [
				PetConstants.PETS.DOG,
				PetConstants.PETS.POODLE,
				PetConstants.PETS.FOX,
				PetConstants.PETS.WOLF,
				PetConstants.PETS.CROCODILE
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.BITE
		},
		{
			petIds: [
				PetConstants.PETS.SCORPION,
				PetConstants.PETS.SNAKE
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.POISONOUS_BITE
		},
		{
			petIds: [PetConstants.PETS.MOUSE],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SCARE_ELEPHANT
		},
		{
			petIds: [PetConstants.PETS.ELEPHANT],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.ELEPHANT_REMEMBER_LAST_ACTION
		},
		{
			petIds: [
				PetConstants.PETS.HAMSTER,
				PetConstants.PETS.RABBIT,
				PetConstants.PETS.PIG,
				PetConstants.PETS.TURKEY,
				PetConstants.PETS.CHIPMUNK,
				PetConstants.PETS.FLAMINGO
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.TRIES_TO_HELP
		},
		{
			petIds: [
				PetConstants.PETS.CHICKEN,
				PetConstants.PETS.DUCK,
				PetConstants.PETS.PEACOCK,
				PetConstants.PETS.BIRD
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.PECK
		},
		{
			petIds: [
				PetConstants.PETS.KOALA,
				PetConstants.PETS.SLOTH,
				PetConstants.PETS.SHRIMP,
				PetConstants.PETS.PANDA
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.IS_USELESS
		},
		{
			petIds: [
				PetConstants.PETS.COW,
				PetConstants.PETS.BEAR,
				PetConstants.PETS.BOAR
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.PET_CHARGE
		},
		{
			petIds: [
				PetConstants.PETS.SHEEP,
				PetConstants.PETS.GOAT,
				PetConstants.PETS.SWAN
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.PET_SMALL_CHARGE
		},
		{
			petIds: [
				PetConstants.PETS.FROG,
				PetConstants.PETS.SKUNK
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.PET_POISON
		},
		{
			petIds: [
				PetConstants.PETS.BLACK_CAT
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.PET_CURSE
		},
		{
			petIds: [
				PetConstants.PETS.HORSE,
				PetConstants.PETS.ZEBRA,
				PetConstants.PETS.DROMEDARY,
				PetConstants.PETS.CAMEL
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.BOOST_SPEED
		},
		{
			petIds: [
				PetConstants.PETS.TURTLE
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.BOOST_DEFENSE
		},
		{
			petIds: [
				PetConstants.PETS.LIZARD
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SMALL_REGEN
		},
		{
			petIds: [
				PetConstants.PETS.SNOWMAN,
				PetConstants.PETS.SNOW_PERSON
			],
			behaviorId: FightConstants.FIGHT_ACTIONS.PET.SNOW_BALL
		}
	];
	for (const mapping of petBehaviors) {
		const behavior = PetAssistanceDataController.instance.getById(mapping.behaviorId);
		mapping.petIds.forEach(petId => registerPetBehavior(petId, behavior));
	}
}

/**
 * Register a pet behavior
 * @param petId The pet ID
 * @param behavior The behavior implementation
 */
export function registerPetBehavior(petId: number, behavior: PetAssistance): void {
	petAssistanceList.set(petId, behavior);
}

/**
 * Get a pet behavior by pet ID
 * @param petId The pet ID
 * @returns The pet behavior or undefined if not found
 */
export function getAiPetBehavior(petId: number): PetAssistance | undefined {
	return petAssistanceList.get(petId);
}
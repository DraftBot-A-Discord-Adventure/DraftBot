import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {MapLink, MapLinkDataController} from "../../data/MapLink";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventCartPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventCartPacket";
import {MapLocationDataController} from "../../data/MapLocation";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: (context, response, player): void => {
		const chance = RandomUtils.draftbotRandom.realZeroToOneInclusive();
		const destination = MapLinkDataController.instance.generateRandomMapLinkDifferentOfCurrent(player.mapLinkId);
		let price: number, displayedDestination: MapLink;
		const packet: SmallEventCartPacket = {displayedDestination: {isDisplayed: true}, price: 0};

		if (chance <= SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
			// The player knows where they will be teleported
			price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE;
			displayedDestination = destination;
			packet.displayedDestination.id = displayedDestination.endMap;
			packet.displayedDestination.type = MapLocationDataController.instance.getById(displayedDestination.endMap).type;
		}
		else if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD) {
			// The player doesn't know where they will be teleported
			packet.displayedDestination.isDisplayed = false;
			price = SmallEventConstants.CART.HIDDEN_TP_PRICE;
		}
		else if (chance <= SmallEventConstants.CART.SCAM_THRESHOLD) {
			// The NPC lied about the destination but offers the trip for cheap
			displayedDestination = MapLinkDataController.instance.generateRandomMapLinkDifferentOfCurrent(player.mapLinkId);
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
			packet.displayedDestination.id = displayedDestination.endMap;
			packet.displayedDestination.type = MapLocationDataController.instance.getById(displayedDestination.endMap).type;
		}
		else {
			// The trip is just cheap
			displayedDestination = destination;
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
			packet.displayedDestination.id = displayedDestination.endMap;
			packet.displayedDestination.type = MapLocationDataController.instance.getById(displayedDestination.endMap).type;
		}

		packet.price = Math.round(price * (1 + RandomUtils.draftbotRandom.realZeroToOneInclusive() * SmallEventConstants.CART.RANDOM_PRICE_BONUS));
		response.push(makePacket(SmallEventCartPacket, packet));
	}
};
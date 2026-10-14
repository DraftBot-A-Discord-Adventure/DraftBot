import { ReactNode } from "react";
import { Animated } from "react-native";
import {
	CITY_BLACKSMITH_LIMITS, CityMobileBeyondReachItem
} from "ws-packets/src/fromServer/collectors";
import { AppIcons } from "@/src/AppIcons";
import { cityItemIconPath } from "@/src/collectors/CityItemPresentation";
import {
	FarewellEmblem, FarewellPage, FarewellSparkles, useMotionLoop
} from "@/src/design/Farewell";
import { useColors } from "@/src/design/ThemeContext";
import { TwemojiIcon } from "@/src/design/TwemojiIcon";
import { i18n } from "@/src/translations/i18n";

const FLOAT_MOTION = {
	periodMs: 1800, rise: -6, item: 56
} as const;

/** The item hovers over a warm halo, sparkles around it: it is not refused, it has outgrown the forge. */
function OutgrownEmblem({ item }: { item: CityMobileBeyondReachItem }): ReactNode {
	const colors = useColors();
	const float = useMotionLoop(FLOAT_MOTION.periodMs, true);
	const emoji = AppIcons.getIconOrNull(cityItemIconPath(item));
	return <FarewellEmblem pulse={float} haloColor={colors.goldWash}>
		<FarewellSparkles />
		<Animated.View style={{ transform: [
			{ translateY: float.interpolate({
				inputRange: [0, 1], outputRange: [0, FLOAT_MOTION.rise]
			}) }
		] }}>
			{emoji ? <TwemojiIcon emoji={emoji} size={FLOAT_MOTION.item} /> : null}
		</Animated.View>
	</FarewellEmblem>;
}

/** Why the blacksmith hands an item back: the royal blacksmith alone can go further, or no one can. */
export function BeyondReachStory({ item }: { item: CityMobileBeyondReachItem }): ReactNode {
	const colors = useColors();
	const story = item.limit === CITY_BLACKSMITH_LIMITS.ROYAL_ONLY ? "royalOnlyStory" : "maxedStory";
	return <FarewellPage
		emblem={<OutgrownEmblem item={item} />}
		eyebrow={i18n.t(`app:city.anvil.${story}.eyebrow`, { level: item.itemLevel })}
		eyebrowColor={colors.gold}
		title={i18n.t(`app:city.anvil.${story}.title`)}
		description={i18n.t(`app:city.anvil.${story}.description`, {
			level: item.itemLevel, nextLevel: item.itemLevel + 1
		})}
	/>;
}

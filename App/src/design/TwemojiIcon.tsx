import { Image } from "expo-image";
import twemoji from "@twemoji/api";
import { ReactElement } from "react";
import {
	PixelRatio, StyleSheet
} from "react-native";

const TWEMOJI_ASSET_BASE_URL = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets";

/** Twemoji also ships every emoji as a 72 px bitmap, far cheaper to decode than its SVG on modest phones. */
const TWEMOJI_BITMAP_PIXELS = 72;

const styles = StyleSheet.create({
	icon: { flexShrink: 0 }
});

/** The bitmap while it is drawn no larger than it is, the SVG beyond so a big emoji stays sharp. */
export function twemojiAssetUrl(emoji: string, pixelSize = Number.POSITIVE_INFINITY): string {
	const filenameSource = emoji.includes("\u200D")
		? emoji
		: emoji.replace(/\uFE0F/gu, "");
	const filename = twemoji.convert.toCodePoint(filenameSource);
	return pixelSize <= TWEMOJI_BITMAP_PIXELS
		? `${TWEMOJI_ASSET_BASE_URL}/72x72/${filename}.png`
		: `${TWEMOJI_ASSET_BASE_URL}/svg/${filename}.svg`;
}

export function TwemojiIcon({
	emoji, size, opacity = 1, verticalOffset = 0
}: {
	emoji: string;
	size: number;
	opacity?: number;
	verticalOffset?: number;
}): ReactElement {
	const source = twemojiAssetUrl(emoji, PixelRatio.getPixelSizeForLayoutSize(size));

	return (
		<Image
			accessibilityRole="image"
			accessibilityLabel={emoji}
			contentFit="contain"
			cachePolicy="memory-disk"
			source={source}
			style={[
				styles.icon, {
					width: size, height: size, opacity, transform: [{ translateY: verticalOffset }]
				}
			]}
		/>
	);
}

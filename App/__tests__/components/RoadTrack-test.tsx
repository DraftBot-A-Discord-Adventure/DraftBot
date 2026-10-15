import {
	fireEvent, render, screen
} from "@testing-library/react-native";
import { Animated } from "react-native";
import { RoadTrack } from "@/src/components/RoadTrack";

jest.mock("@/src/design/TwemojiIcon", () => ({ TwemojiIcon: (): null => null }));

const TRACK_WIDTH = 200;

function translateX(style: unknown): number | undefined {
	const transform = [style].flat(Infinity as 1).find(part => typeof part === "object" && part !== null && "transform" in part) as { transform: { translateX?: number }[] } | undefined;
	return transform?.transform.find(step => step.translateX !== undefined)?.translateX;
}

describe("RoadTrack", () => {
	it("slides the fill and the traveller to the progress once the road is measured", async () => {
		await render(<RoadTrack progress={new Animated.Value(0.25)} stride={new Animated.Value(0)} runner="x" fillColor="#000000" />);
		const track = screen.getByTestId("road-track");
		await fireEvent(track, "layout", { nativeEvent: { layout: {
			width: TRACK_WIDTH, height: 6, x: 0, y: 0
		} } });

		expect(translateX(screen.getByTestId("road-fill").props.style)).toBe(-150);
		expect(translateX(screen.getByTestId("road-runner").props.style)).toBe(50);
	});

	it("hides the fill until the road is measured, so it never flashes full", async () => {
		await render(<RoadTrack progress={new Animated.Value(0)} stride={new Animated.Value(0)} runner="x" fillColor="#000000" />);

		expect([screen.getByTestId("road-fill").props.style].flat(Infinity as 1)).toEqual(expect.arrayContaining([expect.objectContaining({ opacity: 0 })]));
	});
});

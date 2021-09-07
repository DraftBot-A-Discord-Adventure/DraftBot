import * as https from "https";

export interface NearEarthObjectApproachData {
	close_approach_date: string,
	close_approach_date_full: string,
	epoch_date_close_approach: number,
	relative_velocity: {
		kilometers_per_second: string,
		kilometers_per_hour: string,
		miles_per_hour: string
	},
	miss_distance: {
		astronomical: string,
		lunar: string,
		kilometers: string,
		miles: string
	},
	orbiting_body: string
}

export interface NearEarthObject {
	links: {
		self: string
	},
	id: string,
	neo_reference_id: string,
	name: string,
	nasa_jpl_url: string,
	absolute_magnitude_h: number,
	estimated_diameter: {
		kilometers: {
			estimated_diameter_min: number,
			estimated_diameter_max: number
		},
		meters: {
			estimated_diameter_min: number,
			estimated_diameter_max: number
		},
		miles: {
			estimated_diameter_min: number,
			estimated_diameter_max: number
		},
		feet: {
			estimated_diameter_min: number,
			estimated_diameter_max: number
		}
	},
	is_potentially_hazardous_asteroid: boolean,
	close_approach_data: NearEarthObjectApproachData[],
	is_sentry_object: boolean
}

export enum Planet {
	MERCURY = 0,
	VENUS = 1,
	EARTH = 2,
	MARS = 3,
	JUPITER = 4,
	SATURN = 5,
	URANUS = 6,
	NEPTUNE = 7,
	PLUTO = 8
}

export class SpaceUtils {
	private static cachedNeoFeed: NearEarthObject[] = null;

	private static cachedNeoFeedDate: string = null;

	static getNeoWSFeed(apiKey: string): Promise<any> {
		const today = new Date().toISOString()
			.slice(0, 10);
		if (today === this.cachedNeoFeedDate) {
			return Promise.resolve(this.cachedNeoFeed);
		}
		return new Promise((resolve) => {
			https.get("https://api.nasa.gov/neo/rest/v1/feed?start_date=" + today + "&end_date=" + today + "&api_key=" + apiKey, res => {
				let data = "";
				res.on("data", chunk => {
					data += chunk;
				});
				res.on("end", () => {
					const parsedAnswer = JSON.parse(data);
					if (parsedAnswer.near_earth_objects[today]) {
						parsedAnswer.near_earth_objects = parsedAnswer.near_earth_objects[today];
					}
					this.cachedNeoFeedDate = today;
					this.cachedNeoFeed = parsedAnswer;
					resolve(parsedAnswer.near_earth_objects);
				});
			});
		});
	}
}

import * as https from "https";

export interface NearEarthObjectApproachData {
	// eslint-disable-next-line camelcase
	close_approach_date: string,
	// eslint-disable-next-line camelcase
	close_approach_date_full: string,
	// eslint-disable-next-line camelcase
	epoch_date_close_approach: number,
	// eslint-disable-next-line camelcase
	relative_velocity: {
		// eslint-disable-next-line camelcase
		kilometers_per_second: string,
		// eslint-disable-next-line camelcase
		kilometers_per_hour: string,
		// eslint-disable-next-line camelcase
		miles_per_hour: string
	},
	// eslint-disable-next-line camelcase
	miss_distance: {
		astronomical: string,
		lunar: string,
		kilometers: string,
		miles: string
	},
	// eslint-disable-next-line camelcase
	orbiting_body: string
}

export interface NearEarthObject {
	links: {
		self: string
	},
	id: string,
	// eslint-disable-next-line camelcase
	neo_reference_id: string,
	name: string,
	// eslint-disable-next-line camelcase
	nasa_jpl_url: string,
	// eslint-disable-next-line camelcase
	absolute_magnitude_h: number,
	// eslint-disable-next-line camelcase
	estimated_diameter: {
		kilometers: {
			// eslint-disable-next-line camelcase
			estimated_diameter_min: number,
			// eslint-disable-next-line camelcase
			estimated_diameter_max: number
		},
		meters: {
			// eslint-disable-next-line camelcase
			estimated_diameter_min: number,
			// eslint-disable-next-line camelcase
			estimated_diameter_max: number
		},
		miles: {
			// eslint-disable-next-line camelcase
			estimated_diameter_min: number,
			// eslint-disable-next-line camelcase
			estimated_diameter_max: number
		},
		feet: {
			// eslint-disable-next-line camelcase
			estimated_diameter_min: number,
			// eslint-disable-next-line camelcase
			estimated_diameter_max: number
		}
	},
	// eslint-disable-next-line camelcase
	is_potentially_hazardous_asteroid: boolean,
	// eslint-disable-next-line camelcase
	close_approach_data: NearEarthObjectApproachData[],
	// eslint-disable-next-line camelcase
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
					try {
						if (parsedAnswer.near_earth_objects[today]) {
							// eslint-disable-next-line camelcase
							parsedAnswer.near_earth_objects = parsedAnswer.near_earth_objects[today];
						}
						this.cachedNeoFeedDate = today;
						this.cachedNeoFeed = parsedAnswer;
						resolve(parsedAnswer.near_earth_objects);
					}
					catch (e) {
						resolve([]);
					}
				});
			});
		});
	}
}

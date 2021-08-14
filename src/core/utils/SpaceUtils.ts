import request, {Response} from "sync-request";

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

	static getNeoWSFeed(apiKey: string): NearEarthObject[] {
		const today = new Date().toISOString()
			.slice(0, 10);
		if (today === this.cachedNeoFeedDate) {
			return this.cachedNeoFeed;
		}
		const res: Response = request("GET", "https://api.nasa.gov/neo/rest/v1/feed?start_date=" + today + "&end_date=" + today + "&api_key=" + apiKey);
		const parsedAnswer = JSON.parse(res.getBody().toString());
		if (parsedAnswer.near_earth_objects[today]) {
			parsedAnswer.near_earth_objects = parsedAnswer.near_earth_objects[today];
		}
		this.cachedNeoFeedDate = today;
		this.cachedNeoFeed = parsedAnswer;
		return <NearEarthObject[]>(parsedAnswer.near_earth_objects);
	}

	private static keplerianElements2050 = [
		[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081, 0, 0, 0, 0],
		[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418, 0, 0, 0, 0],
		[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0, 0, 0, 0, 0],
		[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, -0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343, 0, 0, 0, 0],
		[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106, 0, 0, 0, 0],
		[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794, 0, 0, 0, 0],
		[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503, -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589, 0, 0, 0, 0],
		[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664, 0, 0, 0, 0],
		[39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684, -0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482, 0, 0, 0, 0]
	];

	static computeEclipticCoordinates(planet: Planet, unixMilliTime: number) {
		const deg2rad = Math.PI / 180;
		const teph = unixMilliTime / 1000 / 86400 + 2440587.5; // Julian Ephemeris Date
		const T = (teph - 2451545) / 36525; // Centuries past J2000.0

		// Calculations of the Keplerian elements
		const a0 = this.keplerianElements2050[planet][0]; // semi-major axis (initial)
		const at = this.keplerianElements2050[planet][6]; // semi-major axis (century variation)
		const a = a0 + at * T; // semi-major axis
		const e0 = this.keplerianElements2050[planet][1]; // eccentricity (initial)
		const et = this.keplerianElements2050[planet][7]; // eccentricity (century variation)
		const e = e0 + et * T; // eccentricity
		const I0 = this.keplerianElements2050[planet][2]; // inclination (initial)
		const It = this.keplerianElements2050[planet][8]; // inclination (century variation)
		const I = I0 + It * T; // inclination
		const L0 = this.keplerianElements2050[planet][3]; // mean longitude (initial)
		const Lt = this.keplerianElements2050[planet][9]; // mean longitude (century variation)
		const L = L0 + Lt * T; // mean longitude
		const W0 = this.keplerianElements2050[planet][4]; // longitude of perihelion (initial)
		const Wt = this.keplerianElements2050[planet][10]; // longitude of perihelion (century variation)
		const W = W0 + Wt * T; // longitude of perihelion
		const O0 = this.keplerianElements2050[planet][5]; // longitude of ascending node (initial)
		const Ot = this.keplerianElements2050[planet][11]; // longitude of ascending node (century variation)
		const O = O0 + Ot * T; // longitude of ascending node

		// Auxiliary parameters for the 3000 BC - 3000 AD period
		const b = this.keplerianElements2050[planet][12];
		const c = this.keplerianElements2050[planet][13];
		const s = this.keplerianElements2050[planet][14];
		const f = this.keplerianElements2050[planet][15];

		// Argument of perihelion w
		const w = W - O;

		// Mean anomaly M
		let M = L - W + b * Math.pow(T, 2) + c * Math.cos(deg2rad * f * T) + s * Math.sin(deg2rad * f * T);
		if (M < -180 || M > 180) {
			M %= 360;
		} // Modulus M to be between -180 and 180

		// Solve the Kepler Equation for the eccentric anomaly E
		const E = SpaceUtils.solveKeplerEquation(M, e);

		// Heliocentric coordinates
		const x1 = a * (Math.cos(deg2rad * E) - e);
		const y1 = a * Math.sqrt(1 - e * e) * Math.sin(deg2rad * E);

		/*
		// Auxiliary trigonometric calculations
		const cosw = Math.cos(deg2rad * w);
		const sinw = Math.sin(deg2rad * w);
		const cosO = Math.cos(deg2rad * O);
		const sinO = Math.sin(deg2rad * O);
		const cosI = Math.cos(deg2rad * I);
		const sinI = Math.sin(deg2rad * I);

		// J2000 Ecliptic Plane Coordinates
		const Xecl = (cosw * cosO - sinw * sinO * cosI) * x1 + (-sinw * cosO - cosw * sinO * cosI) * y1;
		const Yecl = (cosw * sinO + sinw * cosO * cosI) * x1 + (-sinw * sinO + cosw * cosO * cosI) * y1;
		const Zecl = sinw * sinI * x1 + cosw * sinI * y1;

		// Result array
		return [Xecl, Yecl, Zecl];*/

		return [x1, y1, 0];
	}

	static convertToICRF(eclipticCoordinates: number[]) {
		const deg2rad = Math.PI / 180;
		const E = 23.43928;
		const cosE = Math.cos(deg2rad * E);
		const sinE = Math.sin(deg2rad * E);
		const Xeq = eclipticCoordinates[0];
		const Yeq = cosE * eclipticCoordinates[1] - sinE * eclipticCoordinates[2];
		const Zeq = sinE * eclipticCoordinates[1] + cosE * eclipticCoordinates[2];

		return [Xeq, Yeq, Zeq];
	}


	static solveKeplerEquation(M: number, e: number) {
		const e1 = 180 / Math.PI * e;
		const deg2rad = Math.PI / 180;
		const E0 = M + e1 * Math.sin(M * deg2rad);
		const tolerance = 10e-6;
		let dE;
		let dM;
		const E1 = E0;
		let E2 = 0;
		let difE1E2 = 1;

		for (let i = 0; i < 1000 && difE1E2 > tolerance; i++) {
			dM = M - (E1 - e1 * Math.sin(deg2rad * E1));
			dE = dM / (1 - e * Math.cos(deg2rad * E1));
			E2 = E1 + dE;
			difE1E2 = Math.abs(E1 - E2);
		}
		return E2;
	}
}
const EARTH_SIZE = 20902000; // in feet

// Calculates distance from lat/long.
export function calculateDistance(
	lat1: number,
	long1: number,
	lat2: number,
	long2: number
) {
	const nlat1 = (lat1 * Math.PI) / 180,
		nlat2 = (lat2 * Math.PI) / 180,
		nlong1 = (long1 * Math.PI) / 180,
		nlong2 = (long2 * Math.PI) / 180;
	const midpoint = (nlat1 + nlat2) / 2;
	return (
		EARTH_SIZE *
		Math.sqrt(
			(nlat2 - nlat1) ** 2 +
				Math.cos((midpoint * Math.PI) / 180) ** 2 * (nlong2 - nlong1) ** 2
		)
	);
}

export function distanceSort(pos: Coordinates) {
	return (a: GameLocation, b: GameLocation) => {
		return (
			calculateDistance(a.coords[0], a.coords[1], pos.latitude, pos.longitude) -
			calculateDistance(b.coords[0], b.coords[1], pos.latitude, pos.longitude)
		);
	};
}

const coordNames = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];

export function getBearing(lat1, long1, lat2, long2) {
	let radians = Math.atan2(long2 - long1, lat2 - lat1);

	var compassReading = radians * (180 / Math.PI);

	var coordIndex = Math.round(compassReading / 45);
	if (coordIndex < 0) {
		coordIndex = coordIndex + 8;
	}

	return coordNames[coordIndex]; // returns the coordinate value
}

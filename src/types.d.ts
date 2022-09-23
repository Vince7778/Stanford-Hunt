type GameState = "BeforeStart" | "AwaitingGPS" | "Playing";
type GameLocation = {
	name: string;
	coords: number[];
	threshold?: number;
};
type GameDifficulty = "Easy" | "Medium" | "Hard";

type FakeCoordinates = {
	latitude: number;
	longitude: number;
};
type FakePosition = {
	coords: FakeCoordinates;
};
type Coordinates = GeolocationCoordinates | FakeCoordinates;
type Position = GeolocationPosition | FakePosition;

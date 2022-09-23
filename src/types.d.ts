type GameState = "BeforeStart" | "AwaitingGPS" | "Playing";
type GameLocation = {
	name: string;
	coords: number[];
	threshold?: number;
};
type GameDifficulty = "Easy" | "Medium" | "Hard";

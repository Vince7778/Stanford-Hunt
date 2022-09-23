<script lang="ts">
	import Timer from "./lib/Timer.svelte";
	import locationsJson from "./assets/locations.json";
	import { calculateDistance, distanceSort } from "./Utils";

	const thresholdFeet = 100;
	const difficultyDistances = {
		Easy: [100, 1000],
		Medium: [500, 3000],
		Hard: [1000, 5000],
	};
	const metersToFeet = 3.28084;

	let curLocation: GameLocation = null;
	let curThreshold: number;
	let startTime: Date | null = null;
	let error: string = "";
	let positionWatchId: number | null = null;
	let gameState: GameState = "BeforeStart";
	let locations: GameLocation[] = locationsJson;
	let difficulty: GameDifficulty = "Easy";
	let flashing = false;

	let score = 0;

	function chooseLocation(curPos: GeolocationPosition) {
		console.log(curPos.coords);

		let difficultyLocations = locations.filter((loc) => {
			let dist = calculateDistance(
				loc.coords[0],
				loc.coords[1],
				curPos.coords.latitude,
				curPos.coords.longitude
			);

			console.log(loc.name, dist);

			return (
				dist >= difficultyDistances[difficulty][0] &&
				dist <= difficultyDistances[difficulty][1]
			);
		});

		let chosen: GameLocation;
		if (difficultyLocations.length === 0) {
			// choose closest
			chosen = locations.sort(distanceSort(curPos.coords))[0];
		} else {
			chosen =
				difficultyLocations[
					Math.floor(Math.random() * difficultyLocations.length)
				];
		}

		curThreshold = chosen?.threshold ?? thresholdFeet;

		return chosen;
	}

	function startGame() {
		gameState = "AwaitingGPS";
		getLocation();
	}

	function nextScore(pos: GeolocationPosition) {
		score++;
		navigator.vibrate(100);
		flashing = true;
		setTimeout(() => {
			flashing = false;
		}, 1000);
		curLocation = chooseLocation(pos);
		startTimer();
	}

	function startTimer() {
		startTime = new Date();
	}

	function getLocation() {
		if (navigator.geolocation) {
			positionWatchId = navigator.geolocation.watchPosition(
				updateLocation,
				(err) => {
					switch (err.code) {
						case 1:
							error = "This game cannot be played without GPS.";
							break;
						default:
							error = "An error occurred while attempting to get GPS position.";
							break;
					}
				}
			);
		} else {
			error = "Your device/browser does not support GPS.";
			return false;
		}
	}

	function updateLocation(pos: GeolocationPosition) {
		if (gameState === "AwaitingGPS") {
			curLocation = chooseLocation(pos);
			startTimer();
			gameState = "Playing";
		}

		if (
			calculateDistance(
				curLocation.coords[0],
				curLocation.coords[1],
				pos.coords.latitude,
				pos.coords.longitude
			) <= curThreshold
		) {
			nextScore(pos);
		}
	}
</script>

<main class:flash={flashing}>
	<h1>Stanford Hunt</h1>

	{#if error}
		<p>{error}</p>
	{:else if gameState === "AwaitingGPS"}
		<p>Awaiting GPS coordinates...</p>
	{:else if gameState === "Playing"}
		<div>
			<p style="margin-bottom: 5px">
				Goal:<br />Get within {curThreshold} ft of:
			</p>
			<h2 style="margin-top: 5px">
				{curLocation.name}
			</h2>
		</div>
		<Timer {startTime} />
		<div>
			<p>Score: {score}</p>
		</div>
	{:else}
		<button on:click={startGame}>Start Game</button>
	{/if}
</main>

<style>
	.flash {
		animation: greenflash 1s;
	}

	@keyframes greenflash {
		from {
			background-color: rgba(0, 255, 0);
		}
		to {
			background-color: rgba(255, 255, 255);
		}
	}
</style>

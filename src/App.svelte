<script lang="ts">
	import Timer from "./lib/Timer.svelte";
	import locationsJson from "./assets/locations.json";
	import { calculateDistance, distanceSort, getBearing } from "./Utils";

	const thresholdFeet = 100;
	const difficultyDistances = {
		Easy: [300, 1500],
		Medium: [1000, 3000],
		Hard: [2000, 5000],
	};
	const metersToFeet = 3.28084;
	const distanceHintPenalty = 10;
	const directionHintPenalty = 20;

	let curLocation: GameLocation = null;
	let lastPosition: Position = null;
	let curThreshold: number;
	let startTime: Date | null = null;
	let timePenalty: number;
	let error: string = "";
	let positionWatchId: number | null = null;
	let gameState: GameState = "BeforeStart";
	let locations: GameLocation[] = locationsJson;
	let difficulty: GameDifficulty = "Easy";
	let difficulties: GameDifficulty[] = ["Easy", "Medium", "Hard"];
	let flashing = false;
	let distanceHint: number | null = null;
	let directionHint: string = "";

	let isDebug = import.meta.env.DEV;
	let spoofing = false;
	let spoofStr = "";
	let spoofPos = [0, 0];
	$: spoofPos = spoofStr.split(", ").map((x) => parseFloat(x));

	let score = 0;

	function chooseLocation(curPos: Position) {
		let difficultyLocations = locations.filter((loc) => {
			let dist = calculateDistance(
				loc.coords[0],
				loc.coords[1],
				curPos.coords.latitude,
				curPos.coords.longitude
			);

			return (
				dist >= difficultyDistances[difficulty][0] &&
				dist <= difficultyDistances[difficulty][1] &&
				dist > loc.threshold
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

	function nextScore(pos: Position) {
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
		timePenalty = 0;
		startTime = new Date();
	}

	function getLocation() {
		if (navigator.geolocation) {
			positionWatchId = navigator.geolocation.watchPosition(
				(pos: GeolocationPosition) => {
					if (!spoofing) updateLocation(pos);
				},
				(err) => {
					switch (err.code) {
						case 1:
							error =
								"GPS is currently disabled, so this game does not work. Try enabling it in settings.";
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

	function updateLocation(pos: Position) {
		lastPosition = pos;
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

	function giveDistanceHint() {
		distanceHint = calculateDistance(
			lastPosition.coords.latitude,
			lastPosition.coords.longitude,
			curLocation.coords[0],
			curLocation.coords[1]
		);
		timePenalty += distanceHintPenalty;
	}

	function giveDirectionHint() {
		directionHint = getBearing(
			lastPosition.coords.latitude,
			lastPosition.coords.longitude,
			curLocation.coords[0],
			curLocation.coords[1]
		);
		timePenalty += directionHintPenalty;
	}

	function updateSpoof() {
		if (spoofing && (gameState === "AwaitingGPS" || gameState === "Playing")) {
			spoofPos = spoofStr.split(", ").map((x) => parseFloat(x));
			let locPos: FakePosition = {
				coords: {
					latitude: spoofPos[0],
					longitude: spoofPos[1],
				},
			};
			updateLocation(locPos);
		}
	}

	function setDifficulty(diff: number) {
		let curDifficultyInd = difficulties.indexOf(difficulty);
		let newInd = curDifficultyInd + diff;
		if (newInd < 0 || newInd >= difficulties.length) return;
		difficulty = difficulties[newInd];
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
		<Timer {startTime} penalty={timePenalty} />
		<div>
			<button on:click={giveDistanceHint}
				>Give Distance Hint (+{distanceHintPenalty}s)</button
			>
			{#if distanceHint}
				<p>You are {distanceHint.toFixed(0)} feet away.</p>
			{/if}
		</div>
		<div>
			<button on:click={giveDirectionHint}
				>Give Direction Hint (+{directionHintPenalty}s)</button
			>
			{#if directionHint}
				<p>The goal is {directionHint} of here.</p>
			{/if}
		</div>
		<div>
			<p>Score: {score}</p>
		</div>
	{:else}
		<p>
			<button on:click={() => setDifficulty(-1)}>&lt;</button>
			Difficulty: {difficulty}
			<button on:click={() => setDifficulty(1)}>&gt;</button>
		</p>
		<button on:click={startGame}>Start Game</button>
	{/if}

	{#if isDebug}
		<div>
			Spoofing: <input type="checkbox" bind:checked={spoofing} />
			{#if spoofing}
				<input type="text" bind:value={spoofStr} on:input={updateSpoof} />
			{/if}
		</div>
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

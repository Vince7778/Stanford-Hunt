<script lang="ts">
	export let startTime: Date;
	export let penalty: number;
	let displayTime = formatTime(
		new Date().getTime() - startTime.getTime() + penalty * 1000
	);
	export let updateInterval = 50;

	function padZeros(str: string, totalLen: number) {
		return "0".repeat(totalLen - str.length) + str;
	}

	function formatTime(diff: number) {
		let ms = padZeros(Math.floor((diff % 1000) / 10).toString(), 2);
		diff = Math.floor(diff / 1000);
		let secs = padZeros(Math.floor(diff % 60).toString(), 2);
		diff = Math.floor(diff / 60);
		let mins = padZeros((diff % 60).toString(), 2);
		diff = Math.floor(diff / 60);
		let hours = diff;

		return `${hours}:${mins}:${secs}.${ms}`;
	}

	setInterval(() => {
		displayTime = formatTime(
			new Date().getTime() - startTime.getTime() + penalty * 1000
		);
	}, updateInterval);
</script>

<div>
	{displayTime}
</div>

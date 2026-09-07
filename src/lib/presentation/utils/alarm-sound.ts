/* The session countdown's beep, synthesized rather than fetched: there is no asset to
   keep in the repo, nothing to add to the service worker's precache and nothing that
   can 404 for 200 ms of sound. Three tones, because one is easy to take for a
   notification from something else. */

let context: AudioContext | null = null;
const BEEPS = 3;
const BEEP_SECONDS = 0.12;
const BEEP_SPACING = 0.2;

export function playAlarmSound() {
	context ??= new AudioContext();

	/* A ring the tab was away for lands on a document that has had no click since it
	   loaded, and a context built there starts suspended — silently, so the resume is
	   what makes a stale ring audible at all. */
	void context.resume();

	for (let i = 0; i < BEEPS; i++) {
		const at = context.currentTime + i * BEEP_SPACING;
		const oscillator = context.createOscillator();
		const gain = context.createGain();

		oscillator.frequency.value = 880;
		// A bare oscillator at full scale is louder than any other sound the app makes.
		gain.gain.value = 0.2;
		oscillator.connect(gain).connect(context.destination);
		oscillator.start(at);
		oscillator.stop(at + BEEP_SECONDS);
	}
}

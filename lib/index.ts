import {Note, noteToString, noteOfString, rangeNote, randomNote, equalsNote, isBetweenNotes} from "./note/model";

import {findOrFail} from "./dom-utils";
import {RSPNoteRenderer} from "./note/renderer";

const MIN_SAMPLES = 0;
const GOOD_ENOUGH_CORRELATION = 0.9;

const sample: number[] = [];
const buf = new Float32Array(1024);
const notes = rangeNote("C", "B");

const requestForAudioStreamBtn = findOrFail(document, HTMLButtonElement, "request-for-audio-stream");
const expectedNoteRenderer = findOrFail(document, RSPNoteRenderer, "expected-note-renderer");
const expectedNote = findOrFail(document, HTMLDivElement, "expected-note");
const playedNoteRenderer = findOrFail(document, RSPNoteRenderer, "played-note-renderer");
const playedNote = findOrFail(document, HTMLDivElement, "played-note");

function getRandomNote() {
  return randomNote("G/3", "A/5");
}

async function requestForAudioStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({audio: true});
}

async function getAnalyser(audioCtx: AudioContext, stream: MediaStream): Promise<AnalyserNode> {
  const mediaStreamSrc = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  mediaStreamSrc.connect(analyser);

  return analyser;
}

function autoCorrelate(buf: Float32Array, sampleRate: number) {
  let SIZE = buf.length;
  let MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  let correlations = new Array(MAX_SAMPLES);

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01)
    // not enough signal
    return -1;

  let lastCorrelation = 1;
  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buf[i] - buf[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if (correlation > GOOD_ENOUGH_CORRELATION && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      let shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
      return sampleRate / (bestOffset + 8 * shift);
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return -1;
}

function noteFromPitch(frequency: number) {
  let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const note = notes[(Math.round(noteNum) + 69) % 12];
  note.octave = Math.trunc((Math.round(noteNum) + 69) / 12);
  return note;
}

const analyseStream = (audioCtx: AudioContext, analyser: AnalyserNode, note: Note) => (resolve: Function) => {
  analyser.getFloatTimeDomainData(buf);
  const pitch = autoCorrelate(buf, audioCtx.sampleRate);

  if (pitch > -1) {
    const notePlayed = noteFromPitch(pitch);

    if (isBetweenNotes(noteOfString("G/3"), noteOfString("A/5"), notePlayed)) {
      console.log(notePlayed);
      const matchNote = equalsNote(notePlayed, note);
      playedNoteRenderer.note = notePlayed;
      playedNoteRenderer.renderWithThrottle();
      playedNote.textContent = noteToString(notePlayed);
      // TODO: make note match octave also
      // const matchOctave = Math.trunc(notePlayed / 12) === note[1]
      sample.push(Number(matchNote));
      sample.length > 51 && sample.shift();
      if (sample.reduce((sum, n) => sum + n) > 40) {
        sample.splice(0, Infinity);
        return resolve();
        /* nextNote = getRandomNote(); */
        /* findNote(note); */
        /* setStep("note-found"); */
        /* setNote(nextNote); */
        /* console.log("NEXT NOTE: ", nextNote); */
      }
    }
  }

  requestAnimationFrame(() => analyseStream(audioCtx, analyser, note)(resolve));
};

async function listenTillMatch(audioCtx: AudioContext, analyser: AnalyserNode, note: Note) {
  return new Promise(analyseStream(audioCtx, analyser, note));
}

requestForAudioStreamBtn.addEventListener("click", async () => {
  const note = getRandomNote();
  expectedNoteRenderer.note = note;
  expectedNoteRenderer.render();
  expectedNote.textContent = noteToString(note);

  const audioCtx = new AudioContext();
  const stream = await requestForAudioStream();
  const analyser = await getAnalyser(audioCtx, stream);
  await listenTillMatch(audioCtx, analyser, note);
  console.log("DONE");
});

import React, {FC, useEffect, useRef, useState} from "react"
import Vex, {Flow as VF} from "vexflow"

import {Note, formatNote, rangeNote, randomNote, equalsNote} from "./note"

import "./app.scss"

const {Renderer} = Vex.Flow
const audioCtx = new AudioContext()
const buf = new Float32Array(1024)
const MIN_SAMPLES = 0
const GOOD_ENOUGH_CORRELATION = 0.9
const notes = rangeNote("C", "B")

const sample: number[] = []

type Step = "init" | "find-note" | "note-found"

function getRandomNote() {
  return randomNote("G/3", "B/5")
}

const App: FC = () => {
  const container = useRef<HTMLDivElement | null>(null)
  const content = useRef<HTMLDivElement | null>(null)
  const [noteFound, findNote] = useState<Note | null>(null)
  const [note, setNote] = useState(getRandomNote())
  const [step, setStep] = useState<Step>("init")

  useEffect(() => {
    if (step === "note-found") {
      setTimeout(() => setStep("find-note"), 750)
    }
  }, [step])

  async function requestForAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false})
      const mediaStreamSource = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      mediaStreamSource.connect(analyser)
      updatePitch(analyser, note)
      setStep("find-note")
    } catch (err) {
      console.log("baaaad")
    }
  }

  function autoCorrelate(buf: Float32Array, sampleRate: number) {
    let SIZE = buf.length
    let MAX_SAMPLES = Math.floor(SIZE / 2)
    let best_offset = -1
    let best_correlation = 0
    let rms = 0
    let foundGoodCorrelation = false
    let correlations = new Array(MAX_SAMPLES)

    for (let i = 0; i < SIZE; i++) {
      let val = buf[i]
      rms += val * val
    }
    rms = Math.sqrt(rms / SIZE)
    if (rms < 0.01)
      // not enough signal
      return -1

    let lastCorrelation = 1
    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
      let correlation = 0

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buf[i] - buf[i + offset])
      }
      correlation = 1 - correlation / MAX_SAMPLES
      correlations[offset] = correlation // store it, for the tweaking we need to do below.
      if (correlation > GOOD_ENOUGH_CORRELATION && correlation > lastCorrelation) {
        foundGoodCorrelation = true
        if (correlation > best_correlation) {
          best_correlation = correlation
          best_offset = offset
        }
      } else if (foundGoodCorrelation) {
        let shift =
          (correlations[best_offset + 1] - correlations[best_offset - 1]) /
          correlations[best_offset]
        return sampleRate / (best_offset + 8 * shift)
      }
      lastCorrelation = correlation
    }

    if (best_correlation > 0.01) {
      return sampleRate / best_offset
    }
    return -1
  }

  function noteFromPitch(frequency: number) {
    let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2))
    return notes[(Math.round(noteNum) + 69) % 12]
  }

  function updatePitch(analyser: AnalyserNode, note: Note) {
    analyser.getFloatTimeDomainData(buf)

    let nextNote = note
    const pitch = autoCorrelate(buf, audioCtx.sampleRate)

    if (pitch > -1) {
      const notePlayed = noteFromPitch(pitch)
      console.log(formatNote(notePlayed))
      const matchNote = equalsNote(notePlayed, note)
      // TODO: make note match octave also
      // const matchOctave = Math.trunc(notePlayed / 12) === note[1]
      sample.push(Number(matchNote))
      sample.length > 51 && sample.shift()
      if (sample.reduce((sum, n) => sum + n) > 40) {
        sample.splice(0, Infinity)
        nextNote = getRandomNote()
        findNote(note)
        setStep("note-found")
        setNote(nextNote)
        console.log("NEXT NOTE: ", nextNote)
      }
    }

    requestAnimationFrame(() => updatePitch(analyser, nextNote))
  }

  useEffect(() => {
    if (container.current && content.current && step === "find-note") {
      const renderer = new Renderer(content.current, Renderer.Backends.SVG)
      const ctx = renderer.getContext()

      const stave = new VF.Stave(0, 15, 100)
      const staveNote = new VF.StaveNote({keys: [formatNote(note)], duration: "q"})

      switch (note.accidental) {
        case "flat":
          staveNote.addAccidental(0, new VF.Accidental("b"))
          break
        case "sharp":
          staveNote.addAccidental(0, new VF.Accidental("#"))
          break
      }

      stave.addClef("treble")
      stave.setContext(ctx).draw()
      renderer.resize(200, 260)

      VF.Formatter.FormatAndDraw(ctx, stave, [staveNote])
      ctx.scale(2, 2)
    }
  }, [note, step])

  return (
    <div ref={container} className="container">
      {(() => {
        switch (step) {
          case "init":
            return (
              <button className="ready" onClick={requestForAudio}>
                Ready?
              </button>
            )

          case "find-note":
            return <div ref={content} className="stave" />

          case "note-found":
            return noteFound && <div className="toast">{formatNote(noteFound)}</div>
        }
      })()}
    </div>
  )
}

export default App

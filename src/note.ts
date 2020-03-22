import random from "lodash/fp/random"

export type NoteKey = "A" | "B" | "C" | "D" | "E" | "F" | "G"
export type NoteAccidental = "flat" | "natural" | "sharp"
export type Note = {
  key: NoteKey
  accidental: NoteAccidental
  octave?: number
}

export const keys: NoteKey[] = ["A", "B", "C", "D", "E", "F", "G"]

function prevKey(note: Note) {
  return keys[(keys.indexOf(note.key) - 1) % keys.length]
}

function nextKey(note: Note) {
  return keys[(keys.indexOf(note.key) + 1) % keys.length]
}

function nextOctave(note: Note) {
  return note.octave ? note.octave + 1 : undefined
}

function prevOctave(note: Note) {
  return note.octave ? note.octave - 1 : undefined
}

export function parseNote(format: string): Note {
  const match = format.match(/(A|B|C|D|E|F|G)(b|#)?(\/(\d)+)?/)
  if (!match) throw new Error("invalid format " + format)

  const key: NoteKey = (() => {
    switch (match[1]) {
      case "A":
      case "B":
      case "C":
      case "D":
      case "E":
      case "F":
      case "G":
        return match[1]

      default:
        throw new Error("invalid format " + format)
    }
  })()

  const accidental: NoteAccidental = (() => {
    switch (match[2]) {
      case "b":
        return "flat"
      case "#":
        return "sharp"
      default:
        return "natural"
    }
  })()

  const octave = match[4] ? Number(match[4]) : undefined

  return {key, accidental, octave}
}

export function formatNote(note: Note) {
  const accidental = (() => {
    switch (note.accidental) {
      case "flat":
        return "b"
      case "natural":
        return ""
      case "sharp":
        return "#"
    }
  })()

  const keyStr = note.key + accidental
  return note.octave ? [keyStr, note.octave].join("/") : keyStr
}

function _equals(a: Note | null, b: Note | null) {
  if (!a || !b) return false
  const matchOctave = a.octave && b.octave ? a.octave === b.octave : true
  return a.key === b.key && a.accidental === b.accidental && matchOctave
}

export function equalsNote(a: Note, b: Note) {
  const siblingA = siblingNote(a)
  const siblingB = siblingNote(b)

  return (
    _equals(a, b) || _equals(siblingA, b) || _equals(a, siblingB) || _equals(siblingA, siblingB)
  )
}

export function nextNote(note: Note): Note {
  switch (note.accidental) {
    case "flat":
      return {...note, accidental: "natural"}

    case "natural":
      return {...note, accidental: "sharp"}

    case "sharp":
      switch (note.key) {
        case "A":
        case "C":
        case "D":
        case "F":
        case "G":
          return {...note, key: nextKey(note), accidental: "natural"}
        case "B":
          return {key: nextKey(note), accidental: "sharp", octave: nextOctave(note)}
        case "E":
          return {...note, key: nextKey(note), accidental: "sharp"}
      }
  }
}

export function siblingNote(note: Note): Note | null {
  switch (note.accidental) {
    case "flat":
      switch (note.key) {
        case "A":
        case "B":
        case "D":
        case "E":
        case "G":
          return {...note, key: prevKey(note), accidental: "sharp"}
        case "C":
          return {key: prevKey(note), accidental: "natural", octave: prevOctave(note)}
        case "F":
          return {...note, key: prevKey(note), accidental: "natural"}
      }
      break

    case "natural":
      switch (note.key) {
        case "A":
        case "D":
        case "G":
          return null
        case "B":
          return {key: nextKey(note), accidental: "flat", octave: nextOctave(note)}
        case "E":
          return {...note, key: nextKey(note), accidental: "flat"}
        case "C":
          return {key: prevKey(note), accidental: "sharp", octave: prevOctave(note)}
        case "F":
          return {...note, key: prevKey(note), accidental: "sharp"}
      }
      break

    case "sharp":
      switch (note.key) {
        case "A":
        case "C":
        case "D":
        case "F":
        case "G":
          return {...note, key: nextKey(note), accidental: "flat"}
        case "B":
          return {key: nextKey(note), accidental: "natural", octave: nextOctave(note)}
        case "E":
          return {...note, key: nextKey(note), accidental: "natural"}
      }
  }
}

export function rangeNote(minFormat: string, maxFormat: string) {
  const notes: Note[] = []
  let minNote = parseNote(minFormat)
  const maxNote = parseNote(maxFormat)

  for (let i = 0; i < 100 && !equalsNote(minNote, maxNote); i++) {
    notes.push(minNote)
    minNote = nextNote(minNote)
  }

  return [...notes, minNote]
}

export function randomNote(minFormat: string, maxFormat: string) {
  const notes = rangeNote(minFormat, maxFormat)
  return notes[random(0, notes.length - 1)]
}

import {noteOfString, nextNote, siblingNote, noteToString, rangeNote} from "./model";

it("should parse flat with octave", () => {
  const note = noteOfString("Ab/1");

  expect(note.key).toBe("A");
  expect(note.accidental).toBe("flat");
  expect(note.octave).toBe(1);
});

it("should parse natural with octave", () => {
  const note = noteOfString("A/2");

  expect(note.key).toBe("A");
  expect(note.accidental).toBe("natural");
  expect(note.octave).toBe(2);
});

it("should parse natural without octave", () => {
  const note = noteOfString("A#");

  expect(note.key).toBe("A");
  expect(note.accidental).toBe("sharp");
  expect(note.octave).toBeUndefined();
});

it("should get next", () => {
  const cases = [
    ["A/2", "A#/2"],
    ["A#/2", "B/2"],
    ["Bb/2", "B/2"],
    ["B/2", "B#/2"],
    ["B#/2", "C#/3"],
    ["Cb/2", "C/2"],
    ["C/2", "C#/2"],
    ["C#/2", "D/2"],
    ["Db/2", "D/2"],
    ["D/2", "D#/2"],
    ["D#/2", "E/2"],
    ["Eb/2", "E/2"],
    ["E/2", "E#/2"],
    ["E#/2", "F#/2"],
    ["Fb/2", "F/2"],
    ["F/2", "F#/2"],
    ["F#/2", "G/2"],
    ["Gb/2", "G/2"],
    ["G/2", "G#/2"],
    ["G#/2", "A/2"],
  ];

  cases.forEach(([noteFormat, expectedNextFormat]) => {
    const note = noteOfString(noteFormat!);
    const next = nextNote(note);
    expect(noteToString(next)).toBe(expectedNextFormat);
  });
});

it("should get sibling", () => {
  const cases = [
    ["A/2", null],
    ["A#/2", "Bb/2"],
    ["Bb/2", "A#/2"],
    ["B/2", "Cb/3"],
    ["B#/2", "C/3"],
    ["Cb/2", "B/1"],
    ["C/2", "B#/1"],
    ["C#/2", "Db/2"],
    ["Db/2", "C#/2"],
    ["D/2", null],
    ["D#/2", "Eb/2"],
    ["Eb/2", "D#/2"],
    ["E/2", "Fb/2"],
    ["E#/2", "F/2"],
    ["Fb/2", "E/2"],
    ["F/2", "E#/2"],
    ["F#/2", "Gb/2"],
    ["Gb/2", "F#/2"],
    ["G/2", null],
    ["G#/2", "Ab/2"],
  ];

  cases.forEach(([noteFormat, expectedSiblingFormat]) => {
    const note = noteOfString(noteFormat!);
    const sibling = siblingNote(note);

    if (!expectedSiblingFormat) {
      expect(sibling).toBeNull();
    } else {
      expect(sibling).not.toBeNull();
      if (sibling) {
        const siblingFormat = noteToString(sibling);
        sibling && expect(siblingFormat).toBe(expectedSiblingFormat);
      }
    }
  });
});

it("should get range", () => {
  const cases = [
    [
      ["C", "B"],
      ["C", "C#", "D", "D#", "E", "E#", "F#", "G", "G#", "A", "A#", "B"],
    ],
    [
      ["C/2", "E/2"],
      ["C/2", "C#/2", "D/2", "D#/2", "E/2"],
    ],
  ];

  cases.forEach(([[minFormat, maxFormat], expectedRangeFormat]) => {
    const range = rangeNote(minFormat, maxFormat);
    const expectedRange = expectedRangeFormat.map(noteOfString);

    expect(range).toHaveLength(expectedRange.length);
    expect(range).toMatchObject(expectedRange);
  });
});

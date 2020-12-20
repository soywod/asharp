import Vex from "vexflow";

import {parseTpl, parseStyle, findOrFail} from "../dom-utils";
import {Note, noteOfString, noteToString} from "./model";

export class RSPNoteRenderer extends HTMLElement {
  private root: HTMLDivElement;
  private renderer: Vex.Flow.Renderer;
  private stave: Vex.Flow.Stave;
  private _note?: Note;
  private throttle = 0;

  public constructor() {
    super();

    const tpl = parseTpl(`
      <div id="root"></div>
    `);

    const css = parseStyle(`
      :host {
        display: block;
      }

      #root {
        display: flex;
      }
    `);

    const shadowRoot = this.attachShadow({mode: "closed"});
    shadowRoot.append(css, tpl);

    this.root = findOrFail(shadowRoot, HTMLDivElement, "root");
    this.renderer = new Vex.Flow.Renderer(this.root, Vex.Flow.Renderer.Backends.SVG);
    this.renderer.resize(200, 260);
    const ctx = this.renderer.getContext();
    this.stave = new Vex.Flow.Stave(0, 15, 100);
    this.stave.addClef("treble");
    this.stave.setContext(ctx);
    this.stave.draw();
    ctx.scale(2, 2);

    const noteAttr = this.getAttribute("note");
    this._note = noteAttr ? noteOfString(noteAttr) : undefined;
  }

  protected connectedCallback() {
    this.render();
  }

  public render() {
    if (!this.note) {
      return;
    }

    const staveNote = new Vex.Flow.StaveNote({keys: [noteToString(this.note)], duration: "q"});

    switch (this.note.accidental) {
      case "flat":
        staveNote.addAccidental(0, new Vex.Flow.Accidental("b"));
        break;

      case "sharp":
        staveNote.addAccidental(0, new Vex.Flow.Accidental("#"));
        break;
    }

    this.renderer.getContext().clear();
    this.stave.draw();
    Vex.Flow.Formatter.FormatAndDraw(this.renderer.getContext(), this.stave, [staveNote]);
    this.throttle = 0;
  }

  public renderWithThrottle() {
    if (this.throttle === 0) {
      this.throttle = window.setTimeout(() => this.render(), 250);
    }
  }

  public get note() {
    return this._note;
  }

  public set note(note: Note | undefined) {
    this._note = note;
  }
}

customElements.define("rsp-note-renderer", RSPNoteRenderer);

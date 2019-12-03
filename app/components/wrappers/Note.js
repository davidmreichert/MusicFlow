import Vex from 'vexflow';

const VF = Vex.Flow;

export default class Note {
    static get DEFAULT() {
        return {
            STYLE: {
                fillStyle: "black",
                strokeStyle: "black"
            },
            CLEF: "treble",
            KEYS: [],
            DURATION: "8"
        }
    }

    static compare(note, tickable) {
        var clef = note.clef === tickable.clef;
        var duration = note.duration === tickable.duration;
        var keys = this.arraysEqual(note.keys, tickable.keys);

        return clef && duration && keys;
    }

    static arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
      
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Gets start info for bass or trebel clef.
     * returns: {
     *      note: index of note (c == 0, b == 6)
     *      octave: piano octave
     *  }
     */
    static getStartForClef(clef) {
        if (clef === "bass") {
            return {
                note: 1, // d
                octave: 1
            };
        } else if (clef === "treble") {
            return {
                note: 6, // b
                octave: 2
            };
        }
    }
 
    /**
     * 
     * @param {String} clef 
     * @param {Integer} duration 
     * @returns {Map}
     */
    static createNotesMap(clef, duration) {
        var noteNames = ['c','d','e','f','g','a','b'];
        var noteInfo = this.getStartForClef(clef);

        var notes = new Map();
        for (let i = 18; i >= -8; i--) {
            notes.set(i + "", new Note({
                clef: clef, 
                keys: [noteNames[noteInfo.note] + "/" + noteInfo.octave], 
                duration: duration
            }));

            noteInfo.note = (noteInfo.note + 1) % noteNames.length;
            if (noteInfo.note == 0) {
                noteInfo.octave++;
            }
        }

        return notes;
    }

    constructor(props) {
        this.mergeDefaults(props);
    }

    mergeDefaults(props) {
        this.model = {
                clef: props.clef || Notes.DEFAULT.CLEF, 
                keys: props.keys || Notes.DEFAULT.KEYS,
                duration: props.duration || Notes.DEFAULT.DURATION
            }
    }

    get clef() {
        return this.model.clef;
    }

    get keys() {
        return this.model.keys;
    }

    get duration() {
        return this.model.duration;
    }

    get currentStyle() {
        return this.model.currentStyle;
    }

    set clef(clef) {
        this.model.clef = clef;
    }

    set keys(keys) {
        this.model.keys = keys;
    }

    set duration(duration) {
        this.model.duration = duration;
    }

    set currentStyle(currentStyle) {
        this.model.currentStyle = currentStyle;
    }
}
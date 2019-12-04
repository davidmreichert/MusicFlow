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
            ACCIDENTALS: [],//[{index: 0, value: "##"}],
            DOTS: [],//[0],
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
                keys: [{
                    noteName: noteNames[noteInfo.note],
                    octave: noteInfo.octave
                }],
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
                clef: props.clef || Note.DEFAULT.CLEF, 
                keys: props.keys || Note.DEFAULT.KEYS,
                accidentals: props.accidentals || Note.DEFAULT.ACCIDENTALS,
                dots: props.dots || Note.DEFAULT.DOTS,
                duration: props.duration || Note.DEFAULT.DURATION
            }
    }

    getVFNote(vfStave) {
        let vfNote = new VF.StaveNote(this.vexModel).setStave(vfStave);
        if (this.currentStyle) {
            vfNote.setStyle(this.currentStyle);
        }

        if (this.dots) {
            this.dots.forEach(dot => {
                vfNote.addDot(dot);
            });
        }

        if (this.accidentals) {
            this.accidentals.forEach(accidental => {
                vfNote.addAccidental(
                    accidental.index, 
                    new VF.Accidental(accidental.value)
                );
            });
        }

        return vfNote;
    }

    get clef() {
        return this.model.clef;
    }

    get accidentals() {
        return this.model.accidentals;
    }

    get toneAccidentals() {
        return this.model.accidentals.map(accidental => {
            let value = accidental.value;
            if (value === "##") {
                value = "x";
            }
            return {
                index: accidental.index,
                value: value
            }
        });
    }

    get vexAccidentals() {
        return this.model.accidentals.map(accidental => {
            let value = accidental.value;
            if (value === "x") {
                value = "##";
            }
            return {
                index: accidental.index,
                value: value
            }
        });
    }

    get dots() {
        return this.model.dots;
    }

    get duration() {
        return this.model.duration;
    }

    get doubleDuration() {
        let multiplier = 1;
        if (this.dots && this.dots.length) {
            multiplier = 0.75 
        }

        let intDur = parseInt(this.model.duration);
        return intDur * multiplier;
    }

    get intDuration() {
        return parseInt(this.doubleDuration);
    }

    get toneDurations() {
        let durations = [];
        this.keys.forEach((key, i) => {
            if (this.dots.includes(i)) {
                durations.push(this.duration + "n.");
            } else {
                durations.push(this.duration + "n");
            }
        });

        return durations;
    }

    get currentStyle() {
        return this.model.currentStyle;
    }

    get vexModel() {
        return {
            clef: this.clef,
            keys: this.vexKeys, 
            duration: this.duration
        }
    }

    get keys() {
        return this.model.keys;
    }
    
    get vexKeys() {
        return this.model.keys.map((key,i) => {
            return key.noteName + "/" + key.octave;
        });
    }

    get tones() {
        return this.model.keys.map((key, i) => {
            let accidental = this.toneAccidentals.find(accidental => accidental.index === i) || {value: ""};

            return key.noteName.toUpperCase() + accidental.value + key.octave;
        })
    }

    set clef(clef) {
        this.model.clef = clef;
    }

    set accidentals(accidentals) {
        this.model.accidentals = accidentals;
    }

    set dots(dots) {
        this.model.dots = dots;
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
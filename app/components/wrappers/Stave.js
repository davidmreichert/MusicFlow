import Vex from 'vexflow';
import Voice from './Voice';

const VF = Vex.Flow;

export default class StaveModel {
    constructor(props) {
        props = props || {};
        this.mergeDefaultModel(props);
    }

    static get DEFAULT() {
        return {
            WIDTH: 400,
            NOTE_PAD: 60,
            X: 10,
            Y: 70,
            CLEF: "bass",
            TIME_SIGNATURE: "4/4",
            KEY_SIGNATURE: "C",
            TIME: {
                num_beats: 4,
                beat_value: 4,
                resolution: VF.RESOLUTION
            },
            NOTE_DURATION: "8", // Eighth note
            VOICES: []
        }
    }

    setEmptyModel() {
        this.model = {
            needsRerender: true,
        }
    }

    mergeDefaultModel(props) {
        this.model = {
            needsRerender: true,
            x: props.x || StaveModel.DEFAULT.X,
            y: props.y || StaveModel.DEFAULT.Y,
            width: props.width || StaveModel.DEFAULT.WIDTH,
            notePad: props.notePad || StaveModel.DEFAULT.NOTE_PAD,
            clef: props.clef || StaveModel.DEFAULT.CLEF,
            timeSignature: props.timeSignature || StaveModel.DEFAULT.TIME_SIGNATURE,
            keySignature: props.keySignature || StaveModel.DEFAULT.KEY_SIGNATURE,
            time: props.time || StaveModel.DEFAULT.TIME,
            noteDuration: props.noteDuration || StaveModel.DEFAULT.NOTE_DURATION,
            voices: props.voices || StaveModel.DEFAULT.VOICES
        }
    }

    /**
     * Adds optional parameters to the vf stave if
     * those are set. Optional parameters are clef,
     * time signature, and key signature
     * @param vfStave VexFlow stave
     */
    addOptionalParameters(vfStave) {
        if (this.clef) {
            vfStave.addClef(this.clef);
        }

        if (this.timeSignature) {
            vfStave.addTimeSignature(this.timeSignature);
        }

        if (this.keySignature) {
            vfStave.addKeySignature(this.keySignature);
        }
    }

    /**
     * Gets the vfStave. If it has not already been
     * created, creates it along with voices, beams, 
     * and ties.
     * @param {*} current: flag if you want the 
     * current stave or to create another one with 
     * new parameters
     */
    getVFStave(current) {
        if ((!this.vfStave || this.needsRerender) && !current) {
            this.drawList = [];

            this.vfStave = new VF.Stave(this.x, this.y, this.width);
            this.addOptionalParameters(this.vfStave);

            if (this.voices && this.voices.length) {
                var vfVoices = this.voices.map(voice => {
                    return voice.getVFVoice(this.vfStave, this.time);
                });
                
                var joinedVoices = vfVoices.filter((vfVoice, i) => this.voices[i].join);
                var unjoinedVoices = vfVoices.filter((vfVoice, i) => !this.voices[i].join);
                
                var formatter = new VF.Formatter();
                if (joinedVoices && joinedVoices.length) {
                    formatter.joinVoices(joinedVoices)
                        .formatToStave(joinedVoices, this.vfStave);
                }

                if (unjoinedVoices && unjoinedVoices.length) {
                    unjoinedVoices.forEach(voice => {
                        formatter.joinVoices([voice])
                            .formatToStave([voice], this.vfStave);
                        });
                }

                this.voices.forEach( (voice, i) => {
                    if (voice.beams) {
                        let vfBeams = voice.getVFBeams();
                        this.drawList.push.apply(this.drawList, vfBeams);
                    }

                    if (voice.ties && voice.ties.length) {
                        let vfTies = voice.getVFTies();
                        this.drawList.push.apply(this.drawList, vfTies);
                    }
                })

                this.drawList.push.apply(this.drawList, vfVoices);
            }

            return this.vfStave;
        } else {
            return this.vfStave;
        }
    }

    getDrawList() {
        if (this.drawlist) {
            return this.drawlist;
        } else {
            this.getVFStave(false);
            return this.drawList;
        }
    }

    getBottomY() {
        return this.getVFStave().getBottomY();
    }
    
    getTopY() {
        return this.getVFStave().getBoundingBox().y;
    }

    getYForLine(lineNum) {
        return this.getVFStave().getYForLine(lineNum);
    }

    checkYBounds(y, staveLineY) {
        return Math.abs(y - staveLineY) < 2;
    }

    /**
     * Gets start info for bass or trebel clef.
     * returns: {
     *      note: index of note (c == 0, b == 6)
     *      octave: piano octave
     *  }
     */
    getStartForClef(clef) {
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
    createNotesMap(clef, duration) {
        var noteNames = ['c','d','e','f','g','a','b'];
        var noteInfo = this.getStartForClef(clef);

        var notes = new Map();
        for (let i = 18; i >= -8; i--) {
            notes.set(i + "", {
                clef: clef, 
                keys: [noteNames[noteInfo.note] + "/" + noteInfo.octave], 
                duration: duration
            });

            noteInfo.note = (noteInfo.note + 1) % noteNames.length;
            if (noteInfo.note == 0) {
                noteInfo.octave++;
            }
        }

        return notes;
    }

    addNote(yCoord, clef) {
        clef = this.clef || clef;
        let notes = this.createNotesMap(clef, this.noteDuration);

        let note;
        notes.forEach((lineNote, lineNum) => {
            let lineY = this.getYForLine(parseInt(lineNum)/2);
            let inBounds = this.checkYBounds(yCoord, lineY);
            if (inBounds) {
                note = lineNote;
            }
        });

        if (note && this.isNewNote(note)) {
            let voice = this.voices.filter(voice => voice.pending)[0];

            if (!voice) {
                this.addVoice(note);
            } else {
                voice.addNote(note);
            }

            this.needsRerender = true;
        }
    }

    /**
     * Increments the saved notes in a voice by the
     * given amount
     * @param {} voice 
     * @param {*} amount 
     */
    incrementSavedNotes(voice, amount) {
        if (voice.savedNotes + amount >= voice.tickables.length) {
            voice.savedNotes = voice.tickables.length;
        } else {
            voice.savedNotes += amount;
        }
    }

    getLastNote() {
        let notes = this.voices[this.voices.length - 1].tickables;
        return notes[notes.length - 1];
    }

    saveNote(finalNote) {
        if (this.voices.length > 0) {
            let voice = this.voices.filter(voice => voice.pending)[0];
            if (voice) {
                this.incrementSavedNotes(voice, 1);
                this.needsRerender = true;

                if (!voice.full(this.time)) {
                    return false;
                } else {
                    voice.pending = false;
                }

                return true;
            }
        }
    }

    deleteNote() {
        let voices = this.voices.filter(voice => voice.savedNotes !== 0);
        let voice = voices[voices.length - 1];

        if (voice) {
            voice.deleteNote();
        }

        this.needsRerender = true;
    }

    isNewNote(note) {
        var newNote = true;
        this.voices.forEach(voice => {
            if (newNote) {
                newNote = voice.isNewNote(note);
            }
        })

        return newNote;
    }

    addVoice(note) {
        let stem = (this.voices[0]) ? VF.Stem.DOWN : VF.Stem.UP;
        this.voices.push(new Voice([note], stem));
    }


    /***** Getters *****/

    get pending() {
        return this.voices.length < 2 || this.voices.find(voice => voice.pending);
    }

    /**
     * @returns {Array<Voice>}
     */
    get voices() {
        return this.model.voices;
    }

    get x() {
        return this.model.x;
    }

    get y() {
        return this.model.y;
    }

    get width() {
        return this.model.width;
    }

    get notePad() {
        return this.model.notePad;
    }

    get clef() {
        return this.model.clef;
    }

    get timeSignature() {
        return this.model.timeSignature;
    }

    get keySignature() {
        return this.model.keySignature;
    }

    get joinVoices() {
        return this.model.joinVoices;
    }

    get time() {
        return this.model.time;
    }

    get needsRerender() {
        return this.model.needsRerender;
    }

    get noteDuration() {
        return this.model.noteDuration || StaveModel.DEFAULT.NOTE_DURATION;
    }

    /* Setters */

    set voices(voices) {
        this.model.voices = voices;
    }

    set x(x) {
        this.model.x = x;
        this.needsRerender = true;
    }

    set y(y) {
        this.model.y = y;
        this.needsRerender = true;
    }

    set width(width) {
        this.model.width = width;
        this.needsRerender = true;
    }

    set notePad(notePad) {
        this.model.notePad = notePad;
        this.needsRerender = true;
    }

    set clef(clef) {
        this.model.clef = clef;
        this.needsRerender = true;
    }

    set timeSignature(timeSignature) {
        this.model.timeSignature = timeSignature;
        this.needsRerender = true;
    }

    set keySignature(keySignature) {
        this.model.keySignature = keySignature;
        this.needsRerender = true;
    }

    set joinVoices(joinVoices) {
        this.model.joinVoices = joinVoices;
        this.needsRerender = true;
    }

    set time(time) {
        this.model.time = time;
        this.needsRerender = true;
    }

    set needsRerender(needsRerender) {
        this.model.needsRerender = needsRerender;
    }

    set noteDuration(noteDuration) {
        this.model.noteDuration = noteDuration;
    }
}

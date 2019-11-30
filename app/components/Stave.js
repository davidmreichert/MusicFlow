import Vex from 'vexflow';
import {size} from 'underscore'

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
                var vfTickablesList = [];
                var vfVoices = this.voices.map(voice => {
                    var vfVoice = new VF.Voice(this.time).setMode(voice.mode);
                    vfVoice.setStave(this.vfStave);

                    if (voice.tickables && voice.tickables.length) { 
                        var vfTickables = voice.tickables.map(note => {
                            return new VF.StaveNote(note);
                        });

                        vfVoice.addTickables(vfTickables);
                        vfTickablesList.push(vfTickables);
                    }

                    return vfVoice;
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
                        let groups = voice.beams.groups.map(fraction => {
                            return new VF.Fraction(fraction.numerator, fraction.denominator);
                        });

                        let vfBeams = VF.Beam.applyAndGetBeams(vfVoices[i], voice.beams.direction, groups);
                        this.drawList.push.apply(this.drawList, vfBeams);
                    }

                    if (voice.ties && voice.ties.length) {
                        let vfTies = voice.ties.map(tie => {
                            return new VF.StaveTie({
                                first_note: vfTickablesList[i][tie.first_note],
                                last_note: vfTickablesList[i][tie.last_note],
                                first_indices: tie.first_indices,
                                last_indices: tie.last_indices
                            });
                        })

                        this.drawList.push.apply(this.drawList, vfTies);
                    }
                })

                this.drawList.push.apply(this.drawList, vfVoices);
            }

            console.log()

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

    createNotesMap(clef, duration) {
        var noteNames = ['c','d','e','f','g','a','b'];
        var noteInfo = this.getStartForClef(clef);

        var notes = {};
        for (let i = 18; i >= -8; i--) {
            notes["" + i] = {
                clef: clef, 
                keys: [noteNames[noteInfo.note] + "/" + noteInfo.octave], 
                duration: duration
            }

            noteInfo.note = (noteInfo.note + 1) % noteNames.length;
            if (noteInfo.note == 0) {
                noteInfo.octave++;
            }
        }

        return notes;
    }

    addNote(yCoord, clef) {
        clef = this.clef || clef;
        let notes = this.createNotesMap(clef,"8");
        // var notes = {
        //     "18": {clef: "bass", keys: ["d/1"], duration: "8" },
        //     "17": {clef: "bass", keys: ["e/1"], duration: "8" },
        //     "16": {clef: "bass", keys: ["f/1"], duration: "8" },
        //     "15": {clef: "bass", keys: ["g/1"], duration: "8" },
        //     "14": {clef: "bass", keys: ["a/1"], duration: "8" },
        //     "13": {clef: "bass", keys: ["b/1"], duration: "8" },
        //     "12": {clef: "bass", keys: ["c/2"], duration: "8" },
        //     "11": {clef: "bass", keys: ["d/2"], duration: "8" },
        //     "10": {clef: "bass", keys: ["e/2"], duration: "8" },
        //     "9": {clef: "bass", keys: ["f/2"], duration: "8" },
        //     "8": {clef: "bass", keys: ["g/2"], duration: "8" },
        //     "7": {clef: "bass", keys: ["a/2"], duration: "8" },
        //     "6": {clef: "bass", keys: ["b/2"], duration: "8" },
        //     "5": {clef: "bass", keys: ["c/3"], duration: "8" },
        //     "4": {clef: "bass", keys: ["d/3"], duration: "8" },
        //     "3": {clef: "bass", keys: ["e/3"], duration: "8" },
        //     "2": {clef: "bass", keys: ["f/3"], duration: "8" },
        //     "1": {clef: "bass", keys: ["g/3"], duration: "8" },
        //     "0": {clef: "bass", keys: ["a/3"], duration: "8" },
        //     "-1": {clef: "bass", keys: ["b/3"], duration: "8" },
        //     "-2": {clef: "bass", keys: ["c/4"], duration: "8" },
        //     "-3": {clef: "bass", keys: ["d/4"], duration: "8" },
        //     "-4": {clef: "bass", keys: ["e/4"], duration: "8" },
        //     "-5": {clef: "bass", keys: ["f/4"], duration: "8" },
        //     "-6": {clef: "bass", keys: ["g/4"], duration: "8" },
        //     "-7": {clef: "bass", keys: ["a/4"], duration: "8" },
        //     "-8": {clef: "bass", keys: ["b/4"], duration: "8" }
        // };


        let note;
        Object.entries(notes).forEach(entry => {
            let lineY = this.getYForLine(parseInt(entry[0])/2);
            let inBounds = this.checkYBounds(yCoord, lineY);
            if (inBounds) {
                note = entry[1];
            }
        });

        if (note && this.isNewNote(note)) {
            let voice = this.voices.filter(voice => voice.pending)[0];
            this.updateVoice(voice, note);
        }
    }

    updateVoice(voice, note) {
        if (note) {
            this.voices = this.voices.filter(voice => !voice.pending);
            this.voices.push(this.addNoteToVoice(voice, note));
        } else {
            voice.tickables = voice.tickables.splice(0, voice.savedNotes);
        }
        
        this.needsRerender = true;
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

    saveNote(finalNote) {
        if (this.voices.length > 0) {
            let voice = this.voices.filter(voice => voice.pending)[0];
            if (!this.voiceFull(voice)) {
                this.incrementSavedNotes(voice, 1);
                this.updateVoice(voice);

                this.needsRerender = true;
                return false;
            } else if (finalNote) {
                this.incrementSavedNotes(voice, 1);
                this.updateVoice(voice);

                voice.pending = false;

                this.needsRerender = true;
            }

            return true;
        }
    }

    deleteNote() {
        let voices = this.voices.filter(voice => voice.savedNotes !== 0);
        let voice = voices[voices.length - 1];
        if (voice && voice.savedNotes > 0) {
            voice.pending = true;
            voice.savedNotes--;
            this.updateVoice(voice);

            this.needsRerender = true;
        }
    }

    voiceFull(voice) {
        if (voice) {
            let numBeats = this.time.num_beats;
            let beatValue = this.time.beat_value;

            var sum = 0.0;
            voice.tickables.forEach(note => {
                sum += 1/note.duration;
            });

            return sum === (numBeats / beatValue);
        }
    }

    isNewNote(note) {
        var newNote = true;
        this.voices.forEach(voice => {
            if (voice.pending) {
                voice.tickables.forEach((tickable, i) => {
                    if (i >= voice.savedNotes && this.compareNotes(note, tickable)) {
                        newNote = false;
                    }
                });
            }
        })

        return newNote;
    }

    compareNotes(note, tickable) {
        var clef = note.clef === tickable.clef;
        var duration = note.duration === tickable.duration;
        var keys = this.arraysEqual(note.keys, tickable.keys);

        return clef && duration && keys;
    }

    arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
      
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }

    addNoteToVoice(voice, note) {
        this.needsRerender = true;
        if (voice) {
            voice.tickables = voice.tickables.slice(0, voice.savedNotes);

            if (note) {
                voice.tickables.push(note);
            }

            return voice;
        } else {
            let stem = (this.voices[0]) ? VF.Stem.DOWN : VF.Stem.UP;
            return this.createVoice([note], stem);
        }
    }

    createVoice(notes, stem) {
        return { 
            pending: true,
            savedNotes: 0,
            join: true,
            mode: VF.Voice.Mode.SOFT,
            tickables: notes,
            beams: {
                direction: stem,
                groups: [
                    {
                        numerator: 4,
                        denominator: 8
                    }
                ]
            }
        }
    }


    /* Getters */

    get pending() {
        return this.voices.length < 2 || this.voices.find(voice => voice.pending);
    }

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

    /* Setters */

    set voices(voices) {
        this.model.voices = voices;
        return this;
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
}

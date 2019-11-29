import Vex from 'vexflow';
import {size} from 'underscore'

const VF = Vex.Flow;

export default class StaveModel {
    constructor(lastStave, firstStave, canvasWidth, canvasHeight) {
        if (!lastStave || !firstStave || !canvasWidth || !canvasHeight) {
            this.setDefaultModel();
        } else {
            this.setEmptyModel();
            let fullWidth = lastStave.x + lastStave.width + StaveModel.DEFAULT.WIDTH;

            if (fullWidth < canvasWidth) {
                this.x = lastStave.x + lastStave.width;
                this.y = lastStave.y;
            } else {
                this.x = firstStave.x;
                this.y = firstStave.getBottomY();
            }

            this.width = StaveModel.DEFAULT.WIDTH;
            this.notePad = StaveModel.DEFAULT.NOTE_PAD;
            this.voices = StaveModel.DEFAULT.VOICES;

            this.time = lastStave.time;
            
            if (this.getBottomY() > canvasHeight) {
                throw "Canvas limit reached. Please increase height";
            }
        }
    }

    static get DEFAULT() {
        return {
            WIDTH: 400,
            NOTE_PAD: 60,
            X: 10,
            Y: 40,
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

    setDefaultModel() {
        this.model = {
            needsRerender: true,
            x: StaveModel.DEFAULT.X,
            y: StaveModel.DEFAULT.Y,
            width: StaveModel.DEFAULT.WIDTH,
            notePad: StaveModel.DEFAULT.NOTE_PAD,
            clef: StaveModel.DEFAULT.CLEF,
            timeSignature: StaveModel.DEFAULT.TIME_SIGNATURE,
            keySignature: StaveModel.DEFAULT.KEY_SIGNATURE,
            joinVoices: StaveModel.DEFAULT.JOIN,
            time: StaveModel.DEFAULT.TIME,
            voices: StaveModel.DEFAULT.VOICES
        };
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
                var numNotes = 0;
                this.voices.forEach(voice => {
                    if (voice.tickables && voice.tickables.length > numNotes) {
                        numNotes = voice.tickables.length;
                    }
                });

                let width = numNotes * this.notePad;
                if (width > this.width) 
                {
                    this.width = numNotes * 60;
                    this.vfStave.setWidth(numNotes * 60);
                }

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

    getYForLine(lineNum) {
        return this.getVFStave().getYForLine(lineNum);
    }

    checkYBounds(y, staveLineY) {
        return Math.abs(y - staveLineY) < 2;
    }

    addNote(y) {   
        var notes = {
            "8": {clef: "bass", keys: ["g/2"], duration: "8" },
            "7": {clef: "bass", keys: ["a/2"], duration: "8" },
            "6": {clef: "bass", keys: ["b/2"], duration: "8" },
            "5": {clef: "bass", keys: ["c/3"], duration: "8" },
            "4": {clef: "bass", keys: ["d/3"], duration: "8" },
            "3": {clef: "bass", keys: ["e/3"], duration: "8" },
            "2": {clef: "bass", keys: ["f/3"], duration: "8" },
            "1": {clef: "bass", keys: ["g/3"], duration: "8" },
            "0": {clef: "bass", keys: ["a/3"], duration: "8" }
        };


        var note;
        for(var i = 0; i < size(notes); i++) {
            var lineY = this.getYForLine(i/2);
            var inBounds = this.checkYBounds(y, lineY);
            if (inBounds) {
                note = notes["" + i];
                break;
            }
        }

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
                console.log("hello")
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

        // return {
        //     pending: pending,
        //     join: true,
        //     mode: VF.Voice.Mode.STRICT,
        //     tickables: [
        //         {
        //             clef: "bass",
        //             keys: ["a/2"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["b/2"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["c/3"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["d/3"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["e/3"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["f/3"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["g/3"],
        //             duration: "8"
        //         },
        //         {
        //             clef: "bass",
        //             keys: ["a/3"],
        //             duration: "8"
        //         }
        //     ],
        //     beams: {
        //         direction: VF.Stem.DOWN,
        //         groups: [
        //             {
        //                 numerator: 4,
        //                 denominator: 8
        //             }
        //         ]
        //     },
        //     ties: [
        //         {
        //             first_note: 3,
        //             last_note: 4,
        //             first_indices: [0],
        //             last_indices: [0]
        //         }
        //     ]
        // }
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
    }

    set y(y) {
        this.model.y = y;
    }

    set width(width) {
        this.model.width = width;
        this.needsRerender = true;
        return this;
    }

    set notePad(notePad) {
        this.model.notePad = notePad;
    }

    set clef(clef) {
        this.model.clef = clef;
    }

    set timeSignature(timeSignature) {
        this.model.timeSignature = timeSignature;
    }

    set keySignature(keySignature) {
        this.model.keySignature = keySignature;
    }

    set joinVoices(joinVoices) {
        this.model.joinVoices = joinVoices;
    }

    set time(time) {
        this.model.time = time;
    }

    set needsRerender(needsRerender) {
        this.model.needsRerender = needsRerender;
    }
}

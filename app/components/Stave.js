import Vex from 'vexflow';

const VF = Vex.Flow;

export default class StaveModel {
    constructor() {
        this.setDefaultModel();
    }

    setDefaultModel() {
        this.model = {
            needsRerender: true,
            x: 10,
            y: 40,
            width: 400,
            notePad: 60,
            clef: "bass",
            timeSignature: "4/4",
            keySignature: "C",
            joinVoices: false,
            time: {
                num_beats: 4,
                beat_value: 4,
                resolution: VF.RESOLUTION
            },
            voices: [
                // {
                //     join: true,
                //     mode: VF.Voice.Mode.STRICT,
                //     tickables: [
                //         {
                //             clef: "bass",
                //             keys: ["f/2"],
                //             duration: "8"
                //         },
                //         {
                //             clef: "bass",
                //             keys: ["g/2"],
                //             duration: "8"
                //         },
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
                //         }
                //     ],
                //     beams:
                //     {
                //         direction: VF.Stem.UP,
                //         groups: [
                //             {
                //                 numerator: 4,
                //                 denominator: 8
                //             }
                //         ]
                //     },
                //     ties: []
                // },
                // {
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
            ]
        };
    }

    get voices() {
        return this.model.voices;
    }

    set voices(voices) {
        this.model.voices = voices;
        return this;
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

    set width(width) {
        this.model.width = width;
        this.needsRerender = true;
        return this;
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

    get needsRerender() {
        return this.model.needsRerender;
    }

    set needsRerender(needsRerender) {
        this.model.needsRerender = needsRerender;
    }

    getVFStave(current) {
        if ((!this.vfStave || this.needsRerender) && !current) {
            this.drawList = [];

            this.vfStave = new VF.Stave(this.x, this.y, this.width);
            this.vfStave.addClef(this.clef).addTimeSignature(this.timeSignature).addKeySignature(this.keySignature);

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
            "4": {clef: "bass", keys: ["g/2"], duration: "8" },
            "3": {clef: "bass", keys: ["b/2"], duration: "8" },
            "2": {clef: "bass", keys: ["d/3"], duration: "8" },
            "1": {clef: "bass", keys: ["f/3"], duration: "8" },
            "0": {clef: "bass", keys: ["a/3"], duration: "8" }
        };


        var note;
        for(var i = 0; i < 5; i++) {
            var lineY = this.getYForLine(i);
            var inBounds = this.checkYBounds(y, lineY);
            if (inBounds) {
                note = notes["" + i];
                break;
            }
        }

        if (note && this.isNewNote(note)) {
            this.voices = this.voices.filter(voice => !voice.pending);
            this.voices.push(this.createVoice([note], true));
            this.needsRerender = true;
        }

    }

    isNewNote(note) {
        var newNote = true;
        this.voices.forEach(voice => {
            if (voice.pending) {
                voice.tickables.forEach(tickable => {
                    if (this.compareNotes(note, tickable)) {
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

    createVoice(notes, pending) {
        return { 
            pending: pending,
            join: true,
            mode: VF.Voice.Mode.SOFT,
            tickables: notes,
            beams: {
                direction: VF.Stem.UP,
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
}

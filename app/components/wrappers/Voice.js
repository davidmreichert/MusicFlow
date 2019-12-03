import Vex from 'vexflow';
import Note from './Note';

const VF = Vex.Flow;

export default class Voice {
    constructor(notes, stem) {
        this.model = {
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

    getVFVoice(vfStave, time) {
        if (!this.vfVoice || this.pending) {
            this.vfVoice = new VF.Voice(time).setMode(this.mode);
            this.vfVoice.setStave(vfStave);

            if (this.tickables && this.tickables.length) { 
                var vfTickables = this.tickables.map(note => {
                    return new VF.StaveNote(note).setStave(vfStave);
                });

                this.vfVoice.addTickables(vfTickables);
            }
        }

        return this.vfVoice;
    }

    getVFBeams() {
        if (this.vfVoice && !this.vfBeams || this.pending) {
            let groups = this.beams.groups.map(fraction => {
                return new VF.Fraction(fraction.numerator, fraction.denominator);
            });

            this.vfBeams = VF.Beam.applyAndGetBeams(this.vfVoice, this.beams.direction, groups);
        }

        return this.vfBeams;
    }

    getVFTies() {
        if (!this.vfTies || this.pending) {
            if (!this.vfVoice) {
                this.getVFVoice();
            }

            this.vfTies = this.ties.map(tie => {
                return new VF.StaveTie({
                    first_note: this.vfTickablesList[tie.first_note],
                    last_note: this.vfTickablesList[tie.last_note],
                    first_indices: tie.first_indices,
                    last_indices: tie.last_indices
                });
            })
        }

        return this.vfTies;
    }


    addNote(note) {
        this.tickables = this.tickables.slice(0, this.savedNotes);

        if (note) {
            this.tickables.push(note);
        }
    }

    deleteNote() {
        if (this.savedNotes > 0) {
            this.pending = true;
            this.savedNotes--;
            this.tickables.pop();
        }
    }

    full(time) {
        let numBeats = time.num_beats;
        let beatValue = time.beat_value;

        var sum = 0.0;
        this.tickables.forEach(note => {
            sum += 1/note.duration;
        });

        return sum === (numBeats / beatValue);
    }

    /**
     * Determines whether a note is already pending in this voice.
     * @param {*} note 
     */
    isNewNote(note) {
        if (this.pending) {
            for(let i = 0, tickable; tickable = this.tickables[i]; i++) {
                if (i >= this.savedNotes && Note.compare(note, tickable)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @returns {Array}
     */
    get tickables() {
        return this.model.tickables;
    }

    get savedNotes() {
        return this.model.savedNotes;
    }

    get pending() {
        return this.model.pending;
    }

    get mode() {
        return this.model.mode;
    }

    get beams() {
        return this.model.beams;
    }

    get vfTickablesList() {
        return this.vfVoice.getTickables();
    }

    get savedNotes() {
        return this.model.savedNotes;
    }

    get join() {
        return this.model.join;
    }
    
    set savedNotes(savedNotes) {
        this.model.savedNotes = savedNotes;
    }

    set pending(pending) {
        this.model.pending = pending;
    }

    set tickables(tickables) {
        this.model.tickables = tickables;
    }
}
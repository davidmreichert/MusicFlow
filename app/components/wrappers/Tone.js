import Tone from 'tone';
import Note from './Note';

/**
 * A wrapper class around the Tone.js library for translating
 * systems and notes into sound.
 */
export default class ToneWrapper {
    constructor() {
        this.tone = new Tone();
        this.synth = new Tone.PolySynth(35, Tone.Synth, {
            oscillator: {
                type: 'fatsine'
            }
        }).toMaster();

        this.model = {};
    }

    static get DEFAULT() {
        return {
            velocity: 0.05
        }
    }

    /**
     * Plays a synth noise for the given notes
     * @param {Note} note: Note to be sounded at the given time.
     * @param {number} startTime: The beat the note will be played on
     */
    playNote(note, startTime) {
        // If transport still playing, stop it.
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause(0);
            Tone.Transport.cancel(0);
            Tone.Transport.stop(0);
        }
        
        if (note && !this.noteAlreadyAdded(note, startTime)) {
            // Plays the sound
            console.log(note.toneDurations);
            this.synth.triggerAttackRelease(note.tones, note.toneDurations, startTime, ToneWrapper.DEFAULT.velocity);

            // Create/update queued notes map
            if (startTime || startTime === 0) {
                if (this.queuedNotes.get(startTime)) {
                    this.queuedNotes.get(startTime).push(note);
                } else {
                    this.queuedNotes.set(startTime, [note]);
                }
            }
        }
    }

    /**
     * Playing two of the same note at the same time
     * causes issues, so this checks for that. queuedNotes
     * is a map of start times to the list of notes that occur
     * in those times.
     */
    noteAlreadyAdded(note, startTime) {
        let noteList = this.queuedNotes.get(startTime);
        if (noteList) {
            for (let i = 0, currNote; currNote = noteList[i]; i++) {
                if (Note.compare(currNote, note)) {
                    return true;
                }
            }
        }
    }

    /**
     * Plays an entire system on the synth
     * @param {System} system 
     */
    playSystem(system) {
        // Stop the transport and res
        Tone.Transport.cancel(0);
        Tone.Transport.stop(0);
        this.resync();

        // Queues notes for each line
        system.staveLines.forEach(staveLine => {
            staveLine.forEach((stave, i)=> {
                let staveTime = this.tone.toSeconds(i + "m"); // ith measure
                stave.voices.forEach(voice => {
                    let noteTime = staveTime;
                    voice.tickables.forEach(note => {
                        this.playNote(note, noteTime);

                        // Updates the note time so each note sounds at the correct time
                        noteTime += this.tone.toSeconds(note.duration + "n");
                    });
                })
            })
        })

        // Plays the notes and clears them from queue
        Tone.Transport.start();
        this.queuedNotes.clear();
    }

    /** Methods for syncing to the transport **/

    unsync() {
        this.synth.unsync();
    }

    sync() {
        this.synth.sync();
    }

    resync() {
        this.unsync();
        this.sync();
    }

    /**
     * @returns {Map} A map of start times to the notes that are played then.
     */
    get queuedNotes() {
        if (!this.model.queuedNotes) {
            this.model.queuedNotes = new Map();
        }

        return this.model.queuedNotes;
    }

    set queuedNotes(queuedNotes) {
        this.model.queuedNotes = queuedNotes;
    }
}
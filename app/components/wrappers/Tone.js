import Vex from 'vexflow';
import Tone from 'tone';

const VF = Vex.Flow;

export default class ToneWrapper {
    constructor() {
        this.tone = new Tone();
        this.synth = new Tone.PolySynth(35, Tone.Synth, {
            oscillator: {
                type: 'fatsine'
            }
        }).toMaster();
    }

    /**
     * Plays a synth noise for the given notes
     * @param notes: List of notes to sounded at the same time
     */
    playNote(note, startTime) {
        if (Tone.Transport.state === "started") {
            Tone.Transport.cancel(0);
            Tone.Transport.stop(0);
        }
        
        if (note) {
            console.log(startTime);
            let tones = 
                note.keys.map(key => {
                    let name = key.slice(0,1).toUpperCase();
                    let octave = key.slice(2,3);    
                    
                    return name + octave;
                });

            let velocity = 0.05;
            this.synth.triggerAttackRelease(tones, note.duration + "n", startTime, velocity);
        }
    }

    playSystem(system) {
        Tone.Transport.cancel(0);
        Tone.Transport.stop(0);

        this.synth.unsync();
        this.synth.sync();
        let maxTime = 0;
        system.staveLines.forEach(staveLine => {
            staveLine.forEach((stave, i)=> {
                let staveTime = this.tone.toSeconds(i + "m"); // ith measure
                stave.voices.forEach(voice => {
                    let noteTime = staveTime;
                    voice.tickables.forEach(note => {
                        this.playNote(note, noteTime);

                        noteTime += this.tone.toSeconds(note.duration + "n");

                        if (maxTime < noteTime) {
                            maxTime = noteTime;
                        }
                    });
                })
            })
        })

        Tone.Transport.start();
    }

    unsync() {
        this.synth.unsync();
    }
}
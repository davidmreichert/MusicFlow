import Vex from 'vexflow';
import StaveModel from './Stave';

const VF = Vex.Flow;

export default class SystemModel {
    constructor() {
        this.setDefaultModel();
    }

    setDefaultModel() {
        this.model = {
            needsRerender: true,
            width: 1500,
            height: 1500,
            staves: [
                new StaveModel() // Creates default stave
            ]
        };
    }

    getStave(x, y) {
        var matchingStave;
        this.staves.forEach((stave, i) => {
            var xBounds = x < stave.x + stave.width && x > stave.x;
            var yBounds = y < stave.getBottomY() && y > stave.y;

            if (xBounds && yBounds) {
                matchingStave = {
                    stave: stave, 
                    index: i};
            }
        });

        return matchingStave;
    }

    addStave() {
        let lastStave = this.staves[this.staves.length - 1];
        let firstStave = this.staves[0];

        this.staves.push(new StaveModel(lastStave, firstStave, this.width, this.height));
    }

    /**
     * Updates the stave widths if there are enough notes.
     * Also update staves that are after that stave on 
     * the same line.
     */
    updateStaveWidths() {
        //this.needsRerender = false;
        this.staves.forEach(stave => {
            var numNotes = 0;
            stave.voices.forEach(voice => {
                if (voice.tickables && voice.tickables.length > numNotes) {
                    numNotes = voice.tickables.length;
                }
            });

            let width = numNotes * stave.notePad;
            if (width > stave.width) 
            {
                this.needsRerender = true;
                stave.width = numNotes * 60;
            }
        });

        for (let i = 0; i < this.staves.length - 1; i++) {
            let stave = this.staves[i];
            let nextStave = this.staves[i + 1];
            
            // Only if on the same line
            if (stave.y === nextStave.y) {
                this.needsRerender = true;
                nextStave.x = stave.x + stave.width;
            }
        }
    }

    removePendingNotes() {
        this.staves.forEach(stave => {
            stave.voices
                .filter(voice => voice.pending)
                .forEach(voice => {
                    if (voice.tickables.length > voice.savedNotes) {
                        this.needsRerender = true;
                        voice.tickables = voice.tickables.splice(0, voice.savedNotes);
                    }
                });
        })
    }


    get staves() {
        return this.model.staves;
    }

    get needsRerender() {
        return this.model.needsRerender || this.staves.find(stave => stave.needsRerender);
    }

    get width() {
        return this.model.width;
    }

    get height() {
        return this.model.height;
    }

    set needsRerender(needsRerender) {
        console.log(needsRerender)
        this.model.needsRerender =  needsRerender;
        this.model.staves.forEach(stave => stave.needsRerender = needsRerender);
    }
}

import Vex from 'vexflow';
import StaveModel from './Stave';
import StaveLine from './StaveLine';

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
            startX: 30,
            startY: 70,
            staveLines: [],
            staveConnectors: []
        };

        this.createGrandStaff(
            new StaveLine(new StaveModel({
                x: this.startX,
                y: this.startY,
                clef: "treble"
            })),
            new StaveLine(new StaveModel({
                x: this.startX,
                y: this.startY,
                clef: "bass"
            })),        
        )
    }

    createGrandStaff(...staveLines) {
        if (staveLines && staveLines.length > 0) {
            this.addStaveLine(staveLines[0]);
            for (let i = 0; i < staveLines.length - 1; i++) {
                let staveLine = staveLines[i];
                let nextStaveLine = staveLines[i + 1];
                
                nextStaveLine.y = staveLine.getBottomY();
                this.addStaveLine(nextStaveLine);
            }

            // Always have stave connectors at the beginning and end
            this.staveConnectors.push({
                index: 0,
                type: VF.StaveConnector.type.BRACKET
            });
            this.staveConnectors.push({
                index: 0,
                type: VF.StaveConnector.type.BOLD_DOUBLE_RIGHT,
                end: true
            });
        }
    }

    addStaveLine(staveLine) {
        this.staveLines.push(staveLine);
    }

    getStave(x, y) {
        for (let i = 0; i < this.staveLines.length; i++) {
            for(let j = 0; j < this.length; j++) {
                let stave = this.staveLines[i].staves[j];
                let xBounds = x < stave.x + stave.width && x > stave.x;
                let yBounds = y < stave.getBottomY() && y > stave.y;

                if (xBounds && yBounds) {
                    return {
                        stave: stave, 
                        index: {
                            line: i,
                            stave: j
                        }
                    }
                }
            }
        }
    }

    addStave() {
        var length = this.length;
        for(let i = 0; i < this.staveLines.length; i++) {
            let lastStave = this.staveLines[i].staves[length - 1];
            let firstStave = this.staveLines[i].staves[0];

            let newStave = new StaveModel();
            newStave.setEmptyModel();

            let fullWidth = lastStave.x + lastStave.width + StaveModel.DEFAULT.WIDTH;

            if (fullWidth < this.width) {
                newStave.x = lastStave.x + lastStave.width;
                newStave.y = lastStave.y;
            } else {
                this.startNewRow(firstStave, newStave, i);
            }

            newStave.width = StaveModel.DEFAULT.WIDTH;
            newStave.notePad = StaveModel.DEFAULT.NOTE_PAD;
            newStave.voices = StaveModel.DEFAULT.VOICES;

            newStave.time = lastStave.time;
            
            if (newStave.getBottomY() > this.height) {
                throw "Canvas limit reached. Please increase height";
            }

            this.staveLines[i].push(newStave);
        }

        this.staveConnectors.find(connector => connector.end).index++;
    }

    startNewRow(firstStave, newStave, i) {
        var bottomY;
        if (i === 0) {
            bottomY = this.getBottomY();

            // Adds connector for newest index
            this.staveConnectors.push({
                index: this.length,
                type: VF.StaveConnector.type.BRACKET
            });        
        } else {
            bottomY = this.staveLines[i - 1].getBottomY();
        }

        newStave.clef = firstStave.clef;
        newStave.x = this.startX;
        newStave.y = bottomY;
    }

    addNote(staveIndex, yCoord) {
        let staveLine = this.staveLines[staveIndex.line];
        let stave = staveLine.getStave(staveIndex.stave);

        stave.addNote(yCoord, staveLine.getStave(0).clef);
    }
    /**
     * Updates the stave widths if there are enough notes.
     * Also update staves that are after that stave on 
     * the same line.
     */
    updateStaveWidths() {
        //this.needsRerender = false;
        this.staveLines.forEach(staveList => {
            staveList.forEach(stave => { 
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
        });

        for (let i = 0; i < this.staveLines.length - 1; i++) {
            let stave = this.staveLines[i];
            let nextStave = this.staveLines[i + 1];
            
            // Only if on the same line
            if (stave.y === nextStave.y) {
                this.needsRerender = true;
                nextStave.x = stave.x + stave.width;
            }
        }
    }

    removePendingNotes() {
        this.staveLines.forEach(staveLine => {
            staveLine.forEach(stave => {
            stave.voices
                .filter(voice => voice.pending)
                .forEach(voice => {
                    if (voice.tickables.length > voice.savedNotes) {
                        this.needsRerender = true;
                        voice.tickables = voice.tickables.splice(0, voice.savedNotes);
                    }
                });
            });
        })
    }

    createDrawableObjects() {
        if (this.staveLines && this.staveLines.length) {
            var drawList = [];

            //modelInfo.updateStaveWidths();
            this.staveLines.forEach(staveList => {
                let vfStaveList = staveList.map(stave => {
                    drawList.push.apply(drawList, stave.getDrawList());
                    return stave.getVFStave(true);
                });

                drawList.push.apply(drawList, vfStaveList);        
            });

            //Create stave connectors
            this.staveConnectors.forEach(connector => {
                console.log(connector);
                let staves = this.staveLines.map(staveLine => staveLine.getStave(connector.index));

                // Get top and bottom of the grand staff
                let topStave = staves[0].getVFStave();
                let bottomStave = staves[staves.length - 1].getVFStave();

                let vfStaveConnector = new VF.StaveConnector(topStave, bottomStave).setType(connector.type);
                drawList.push(vfStaveConnector);
            })
        
            return drawList;
        }
    }

    getBottomY() {
        return this.staveLines[this.staveLines.length - 1].getBottomY();
    }



    get staveLines() {
        return this.model.staveLines;
    }

    get length() {
        return (this.model.staveLines[0]) ? this.model.staveLines[0].length : 0;
    }

    get needsRerender() {
        return this.model.needsRerender || 
            this.staveLines.find(staveLine => 
                staveLine.find(stave => 
                    stave.needsRerender
                )
            );
    }

    get width() {
        return this.model.width;
    }

    get height() {
        return this.model.height;
    }

    get startX() {
        return this.model.startX;
    }

    get startY() {
        return this.model.startY;
    }

    get staveConnectors() {
        return this.model.staveConnectors;
    }

    set needsRerender(needsRerender) {
        this.model.needsRerender =  needsRerender;
        this.model.staveLines.forEach(staveLine => 
            staveLine.forEach(
                stave => stave.needsRerender = needsRerender
                )
            );
    }
}

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
            staves: [
                new StaveModel() // Creates default stave
            ]
        };
    }

    getStave(x, y) {
        var matchingStave;
        this.staves.forEach(stave => {
            var xBounds = x < stave.x + stave.width && x > stave.x;
            var yBounds = y < stave.getBottomY() && y > stave.y;
            if (xBounds && yBounds) {
                matchingStave = stave;
            }
        });

        return matchingStave;
    }

    get staves() {
        return this.model.staves;
    }

    get needsRerender() {
        return this.model.needsRerender || this.staves.find(stave => stave.needsRerender);
    }

    set needsRerender(needsRerender) {
        this.model.needsRerender =  needsRerender;
        this.model.staves.forEach(stave => stave.needsRerender = needsRerender);
        return this;
    }
}

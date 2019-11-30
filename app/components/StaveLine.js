
export default class StaveLine {
    constructor(...staves) {
        this.staves = staves;
    }

    forEach(consumable) {
        this.staves.forEach(consumable);
    }

    map(consumable) {
        return  this.staves.map(consumable);
    }

    find(consumable) {
        return this.staves.find(consumable);
    }

    push(stave) {
        return this.staves.push(stave);
    }

    getBottomY() {
        return this.staves[this.length - 1].getBottomY();
    }

    getStave(index) {
        return this.staves[index];
    }

    get length() {
        return this.staves.length;
    }

    set y(y) {
        console.log(y);
        this.staves.forEach(stave => {
            stave.y = y;
        });
    }


}
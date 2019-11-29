import Vex from 'vexflow';
import React, {Component} from 'react';
import SystemModel from './system';

const VF = Vex.Flow;

export default class VexFlow extends Component {
    constructor(props) {
        super(props);

        this.setDefaultState();
    };

    setDefaultState() {
        this.system = new SystemModel();
    }

    createDrawableObjects(modelInfo) {
        if (!modelInfo.needsRerender) {
            return;
        }
        if (modelInfo.staves && modelInfo.staves.length) {
            var drawList = [];

            this.staves = modelInfo.staves.map(stave => {
                drawList.push.apply(drawList, stave.getDrawList());
                return stave.getVFStave(true);
            });
        
            drawList.push.apply(drawList, this.staves);        
            return drawList;
        }
    }

    getContext(div) {
        let context = VF.Renderer.lastContext;
        if (!context) {
            var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
            renderer.lastContext        
            // Configure the rendering context.
            renderer.resize(1500, 1500);

            context = renderer.getContext();
            VF.Renderer.lastContext = context;
        } else {
            context.clear();
        }

        return context;
    }

    draw() {
        if (this.system.needsRerender) {
            let addEventListeners = !this.div;

            this.update = true;
            this.div = this.div || document.getElementById("vexflow");

            let context = this.getContext(this.div);
            let drawList = this.createDrawableObjects(this.system);

            if (drawList) {
                drawList.reverse().forEach(drawable => drawable.setContext(context).draw());
            }

            if (addEventListeners) {
                this.div.addEventListener("mousemove", this.getMousePosition.bind(this), false);
                this.div.addEventListener("click", this.getClickPosition.bind(this), false);
                document.addEventListener("keyup", this.shortcuts.bind(this), false);
            }

            this.system.needsRerender = false;
            this.update = false;
        }
    }

    componentDidMount() {
        this.draw();
    }

    checkYBounds(y, staveLineY) {
        return Math.abs(y - staveLineY) < 2;
    }


    getMousePosition(e) {
        if (this.update) {
            return;
        }

        this.div = this.div || document.getElementById("vexflow");
        this.startX = this.startX || this.div.getBoundingClientRect().x
        this.startY = this.startY || this.div.getBoundingClientRect().y;

        var x = e.clientX - this.startX;
        var y = e.clientY - this.startY;

        this.currentStave = this.system.getStave(x, y);

        if (this.currentStave && y < this.currentStave.getBottomY() && y > this.currentStave.getYForLine(0)) {
            this.currentStave.addNote(y);
        } 
            
        this.draw();
    }

    getClickPosition(e) {
        if (this.update) {
            return;
        }

        let currentTime = Date.now();
        this.lastClickTime = this.lastClickTime || 0;

        if (currentTime - this.lastClickTime > 100 && this.currentStave) {
            this.currentStave.saveNote();

            this.draw();
        }
    }

    shortcuts(e) {
        // // ignore all keyup events that are part of composition
        // if (event.isComposing || event.keyCode === 229) {
        //     return;
        // }

        if (e.key === "Backspace") {
            if (this.currentStave) {
                this.currentStave.deleteNote();

                this.draw();
            }
        }
    }

    render() {
        return <div id="vexflow"></div>;
    }

}

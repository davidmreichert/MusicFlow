import Vex from 'vexflow';
import React, {Component} from 'react';
import SystemModel from './System';

const VF = Vex.Flow;

export default class VexFlow extends Component {
    constructor(props) {
        super(props);

        this.setDefaultState();
    }

    get APP_NAME() {
        return "VexEdit";
    }

    get DIV_NAME() {
        return "system";
    }

    setDefaultState() {
        this.system = new SystemModel();
    }

    getContext(div) {
        let context = VF.Renderer.lastContext;
        if (!context) {
            var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

            // Configure the rendering context.
            renderer.resize(this.system.width, this.system.height);

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
            this.div = this.div || document.getElementById(this.DIV_NAME);

            let context = this.getContext(this.div);
            let drawList = this.system.createDrawableObjects(this.system);

            if (drawList) {
                drawList.reverse().forEach(drawable => drawable.setContext(context).draw());
            }

            if (addEventListeners) {
                this.div.addEventListener("mousemove", this.getMousePosition.bind(this), false);
                this.div.addEventListener("click", this.getClickPosition.bind(this), false);
                //document.addEventListener("keyup", this.shortcuts.bind(this), false);
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

        this.div = this.div || document.getElementById(this.DIV_NAME);
        this.startX = this.startX || this.div.getBoundingClientRect().x;
        this.startY = this.startY || this.div.getBoundingClientRect().y;

        // Gets location of scrolled window relative to page. Ensure mouse location
        // correctly interpretted.
        var doc = document.documentElement;
        var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

        var x = (e.clientX + left) - this.startX;
        var y = (e.clientY + top) - this.startY;

        let staveInfo = this.system.getStave(x, y);
        let switchStaveLine = false;
        if (staveInfo) {
            this.currentStave = staveInfo.stave;
            
            // checks if we've switched staves
            switchStaveLine = this.currentStaveIndex 
                && (this.currentStaveIndex.line !== staveInfo.index.line || this.currentStaveIndex.stave !== staveInfo.index.stave);

            this.currentStaveIndex = staveInfo.index;
        }

        // If current stave is pending and mouse is between the lines, add note
        if ((this.currentStave && this.currentStave.pending) &&
            (y < this.currentStave.getBottomY() && y > this.currentStave.getTopY())) {
                this.system.addNote(this.currentStaveIndex, y);

                if (switchStaveLine) {
                    this.system.removePendingNotes();
                }
        } else {
            this.system.removePendingNotes();
        }
            
        this.draw();
    }

    getClickPosition(e) {
        if (this.update || 
            (this.currentStave && !this.currentStave.pending)) {
            return;
        }

        let currentTime = Date.now();
        this.lastClickTime = this.lastClickTime || 0;

        if (currentTime - this.lastClickTime > 100 && this.currentStave) {
            let voiceFull = this.currentStave.saveNote();
            if (voiceFull) {
                if (this.currentStaveIndex.stave === this.system.length - 1) {
                    this.system.addStave();
                }
                
                this.currentStave.saveNote(true);
            }

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
        } else if (e.key === "ArrowUp") {
            if (this.currentStave) {
                this.currentStave.y -= 5;

                this.draw();
            }
        } else if (e.key === "ArrayDown") {
            if (this.currentStave) {
                this.currentStave.y += 5;

                this.draw();
            }
        }
    }

    render() {
        return (
            <div id={ this.APP_NAME }>
                <div id={ this.DIV_NAME } />
                <button type="button" class="btn btn-dark">Dark</button>
            </div>
        );
    }

}

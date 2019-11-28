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
            this.div = this.div || document.getElementById("vexflow");

            let context = this.getContext(this.div);
            let drawList = this.createDrawableObjects(this.system);

            if (drawList) {
                drawList.reverse().forEach(drawable => drawable.setContext(context).draw());
            }

            this.div.addEventListener("mousemove", this.getClickPosition.bind(this), false);
            this.system.needsRerender = false;
        }
    }

    componentDidMount() {
        this.draw();
    }

    checkYBounds(y, staveLineY) {
        return Math.abs(y - staveLineY) < 2;
    }


    getClickPosition(e) {
        this.div = this.div || document.getElementById("vexflow");
        this.startX = this.startX || this.div.getBoundingClientRect().x
        this.startY = this.startY || this.div.getBoundingClientRect().y;

        var x = e.clientX - this.startX;
        var y = e.clientY - this.startY;

        var stave = this.system.getStave(x, y);

        if (stave && y < stave.getBottomY() && y > stave.getYForLine(0)) {
            stave.addNote(y);
        } 
            
        this.draw();
    }

    render() {
        return <div id="vexflow">
        </div>;
    }

}

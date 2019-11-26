import Vex from 'vexflow';
import React, {Component} from 'react';

const VF = Vex.Flow;


export default class VexFlow extends Component {

    constructor(props) {
        super(props);

        this.state = {
            x: 0,
            y: 0,

        };
    };

    componentDidMount() {
        const svgContainer = document.createElement('div');

        var renderer = new VF.Renderer(svgContainer, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

        // Create a stave of width 400 at position 10, 40 on the canvas.
        var stave = new VF.Stave(10, 40, 400);

        // Add a clef and time signature.
        stave.addClef("treble").addTimeSignature("4/4");

        // Connect it to the rendering context and draw!
        stave.setContext(context).draw();

        var accidentals = ["bb","b","#","n","b","##"];
        var noteInfo = {
            clef: "treble",
            keys: ["g/4", "b/4", "cb/5", "e/5", "g#/5", "b/5"],
            duration: "h"
        }

        var notes = [];

        var note = new VF.StaveNote(noteInfo);

        accidentals.forEach( (acc, ind) => {
            note.addAccidental(ind, new VF.Accidental(acc));
        });

        notes.push(note);
        notes.push(new Vex.Flow.StaveNote({clef: "treble", keys: ["c/4"], duration: "h" }));


        // Helper function to justify and draw a 4/4 voice
        VF.Formatter.FormatAndDraw(context, stave, notes);

        this.refs.outer.appendChild(svgContainer);
    }

    makeSystem(vf, width) {
        const system = vf.System({ x: this.state.x, y: this.state.y, width: width, spaceBetweenStaves: 10 });
        this.setState({x: this.state.x + width});
        return system;
    }

    render() {
        return <div ref="outer" style={{
            border: "2px blue solid",
            padding: 10,
            borderRadius: 10,
            display: "inline-block",
        }}>
        </div>;
    }

}

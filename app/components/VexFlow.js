import Vex from 'vexflow';
import React, {Component} from 'react';

const VF = Vex.Flow;

export default class VexFlow extends Component {
    constructor(props) {
        super(props);

        this.state = {
            x: 0,
            y: 0
        };

        this.staves = [];
    };

    draw() {
        console.log("Rerender");

        const div = document.getElementById("vexflow");

        var context = VF.Renderer.lastContext;
        if (!context) {
            var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
            
            // Configure the rendering context.
            renderer.resize(1500, 1500);

            var context = renderer.getContext();
            VF.Renderer.lastContext = context;
        }
        context.clear();

        // Create a stave of width 400 at position 10, 40 on the canvas.
        var stave = new VF.Stave(10, 40, 400);

        var stave2 = new VF.Stave(stave.x + stave.getWidth(), stave.y, stave.getWidth());

        // Add a clef and time signature.
        stave.addClef("bass").addTimeSignature("4/4").addKeySignature("C#");

        // var accidentals = ["bb","b","#","n","b","##"];
        // var noteInfo = {
        //     clef: "bass",
        //     keys: ["g/2", "b/2", "c/3", "e/3", "g/3", "b/3"],
        //     duration: "h"
        // }

        // var notes = [];

        // var note = new VF.StaveNote(noteInfo);

        // accidentals.forEach( (acc, ind) => {
        //     note.addAccidental(ind, new VF.Accidental(acc));
        // });

        var notes = [
            new VF.StaveNote({clef: "bass", keys: ["e#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["f#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["g#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["a#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["b#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["c#/3"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["d#/3"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["e#/3"], duration: "8" }),
            // new VF.StaveNote({clef: "bass", keys: ["f#/3"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["g#/3"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["a#/3"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["b#/3"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["c#/4"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["d#/4"], duration: "16" }),
            // new VF.StaveNote({clef: "bass", keys: ["e#/4"], duration: "8" })
        ]
        
        // notes.push(note);
        // notes.push(new VF.StaveNote({clef: "bass", keys: ["c/4"], duration: "h" }));

        var time = {
            num_beats: 4,
            beat_value: 4,
            resolution: VF.RESOLUTION,
        }
        var voice = new VF.Voice(time).setMode(VF.Voice.Mode.STRICT);
        voice.addTickables(notes);

        var notes2 = [
            new VF.StaveNote({clef: "bass", keys: ["c#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["d#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["e#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["f#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["g#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["a#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["b#/2"], duration: "8" }),
            new VF.StaveNote({clef: "bass", keys: ["c#/3"], duration: "8" })
        ]

        var voice2 = new VF.Voice(time).setMode(VF.Voice.Mode.STRICT);
        voice2.addTickables(notes2);

        var ties = [
            new VF.StaveTie({
                first_note: notes2[3],
                last_note: notes2[4],
                first_indices: [0],
                last_indices: [0]
            })
        ];

        var formatter = new VF.Formatter();

        var voices = [voice, voice2];

        var numNotes = 0;
        voices.forEach(voice => {
            if (voice.getTickables().length > numNotes) {
                numNotes = voice.getTickables().length;
            }
        });

        var staves = [stave, stave2];
        staves.forEach(stave => {
            let width = numNotes * 60;
            if (width > stave.width) 
            {
                stave.setWidth(numNotes * 60);
            }
        })

        if (stave.x + (stave.getWidth() * 2) > 1500) {
            stave2.setX(stave.x);
            stave2.setY(stave.getBottomY());
        } else {
            stave2.setX(stave.x + stave.width);
        }

        formatter.joinVoices(voices)
            .formatToStave(voices, stave);

        var groups = [
            new VF.Fraction(4, 8)
        ];


                
        var beams = VF.Beam.applyAndGetBeams(voice, VF.Stem.UP, groups);

        voice.setStave(stave).draw(context);

        var beams2 = VF.Beam.applyAndGetBeams(voice2, VF.Stem.DOWN, groups);

        voice2.setStave(stave).draw(context);

        // Connect to the rendering context and draw!
        stave.setContext(context);
        stave.draw();

        stave2.setContext(context);
        stave2.draw();

        this.staves = staves;

        beams.forEach(beam => beam.setContext(context).draw());
        beams2.forEach(beam => beam.setContext(context).draw());

        ties.forEach(t => t.setContext(context).draw());

        div.addEventListener("mousemove", this.getClickPosition.bind(this), false);
        this.needsRerender = false;
    }

    componentDidMount() {
        this.draw();
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

    checkYBounds(y, staveLineY) {
        return Math.abs(y - staveLineY) < 2;
    }

    checkInBoundingBox(boundingBox, x, y) {
        //console.log(boundingBox);
        var inBounds = boundingBox && boundingBox.startX < parseInt(x,10)
            && boundingBox.endX > parseInt(x,10)
            && boundingBox.startY < parseInt(y,10)
            && boundingBox.endY > parseInt(y,10);

        console.log(inBounds);
        return inBounds;
    }

    getStaveNote(stave, y) {
        var notes = {
            "4": new VF.StaveNote({clef: "bass", keys: ["g/2"], duration: "8" }),
            "3": new VF.StaveNote({clef: "bass", keys: ["b/2"], duration: "8" }),
            "2": new VF.StaveNote({clef: "bass", keys: ["d/3"], duration: "8" }),
            "1": new VF.StaveNote({clef: "bass", keys: ["f/3"], duration: "8" }),
            "0": new VF.StaveNote({clef: "bass", keys: ["a/3"], duration: "8" })
        };


        for(var i = 0; i < 5; i++) {
            var lineY = stave.getYForLine(i);
            var inBounds = this.checkYBounds(y, lineY);
            if (inBounds) {
                var boundingBox = {
                    startX: stave.x,
                    startY: lineY - 2,
                    endX: stave.x + stave.width,
                    endY: lineY + 2
                }
                let note = notes["" + i]
                return {
                    boundingBox, 
                    note
                };
            }
        }

        return {};
    }


    getClickPosition(e) {
        const svgContainer = document.getElementById("vexflow");
        var startX = svgContainer.getBoundingClientRect().x
        var startY = svgContainer.getBoundingClientRect().y;

        var x = e.clientX - startX;
        var y = e.clientY - startY;

        //console.log(`${x}, ${y}`);
        var stave = this.getStave(x, y); //getStave(this.x, this.y);

        //console.log(`${stave.getBottomLineY()}, ${stave.getYForLine(0)}`);
        if (stave && y < stave.getBottomLineY() && y > stave.getYForLine(0)) {
            var {boundingBox, note} = this.getStaveNote(stave, y);
            if (!note) {
                return;
            }

            if (this.checkInBoundingBox(this.lastBoundingBox, x, y)) {
                return;
            } else if (this.needsRerender) {
                this.draw();
            }

            var time = {
                num_beats: 4,
                beat_value: 4,
                resolution: VF.RESOLUTION / 4
            }

            var voice = new VF.Voice(time).setMode(VF.Voice.Mode.SOFT);
            voice.addTickables([note]);

            new VF.Formatter().joinVoices([voice])
                .formatToStave([voice], stave);

            voice.setContext(VF.Renderer.lastContext);
            voice.rendered = false;
            voice.setStave(stave).draw();

            this.needsRerender = true;

            this.lastBoundingBox = boundingBox;
        } else if (this.needsRerender) {
            this.draw();
        }
    }

    render() {
        return <div id="vexflow">
        </div>;
    }

}

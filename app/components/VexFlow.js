import Vex from 'vexflow';
import React, {Component} from 'react';

const VF = Vex.Flow;

export default class VexFlow extends Component {
    constructor(props) {
        super(props);

        this.setDefaultState();
    };

    setDefaultState() {
        this.state = {
            staves: [
                {
                    x: 10,
                    y: 40,
                    width: 400,
                    notePad: 60,
                    clef: "bass",
                    timeSignature: "4/4",
                    keySignature: "C",
                    joinVoices: true,
                    time: {
                        num_beats: 4,
                        beat_value: 4,
                        resolution: VF.RESOLUTION
                    },
                    time: {
                        num_beats: 4,
                        beat_value: 4,
                        resolution: VF.RESOLUTION,
                    },
                    voices: [
                        {
                            mode: VF.Voice.Mode.STRICT,
                            tickables: [
                                {
                                    clef: "bass",
                                    keys: ["f/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["g/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["a/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["b/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["c/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["d/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["e/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["f/3"],
                                    duration: "8"
                                }
                            ],
                            beams:
                            {
                                direction: VF.Stem.UP,
                                groups: [
                                    {
                                        numerator: 4,
                                        denominator: 8
                                    }
                                ]
                            },
                            ties: []
                        },
                        {
                            mode: VF.Voice.Mode.STRICT,
                            tickables: [
                                {
                                    clef: "bass",
                                    keys: ["a/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["b/2"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["c/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["d/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["e/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["f/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["g/3"],
                                    duration: "8"
                                },
                                {
                                    clef: "bass",
                                    keys: ["a/3"],
                                    duration: "8"
                                }
                            ],
                            beams: {
                                direction: VF.Stem.DOWN,
                                groups: [
                                    {
                                        numerator: 4,
                                        denominator: 8
                                    }
                                ]
                            },
                            ties: [
                                {
                                    first_note: 3,
                                    last_note: 4,
                                    first_indices: [0],
                                    last_indices: [0]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }

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

        var drawList = [];
        this.staves = this.state.staves.map(stave => {
            var vfStave = new VF.Stave(stave.x, stave.y, stave.width);
            vfStave.addClef(stave.clef).addTimeSignature(stave.timeSignature).addKeySignature(stave.keySignature);

            var numNotes = 0;
            stave.voices.forEach(voice => {
                if (voice.tickables.length > numNotes) {
                    numNotes = voice.tickables.length;
                }
            });

            let width = numNotes * stave.notePad;
            if (width > stave.width) 
            {
                stave.width = numNotes * 60;
                vfStave.setWidth(numNotes * 60);
            }

            var vfTickablesList = [];
            var vfVoices = stave.voices.map(voice => {
                var vfTickables = voice.tickables.map(note => {
                    return new VF.StaveNote(note);
                });

                var vfVoice = new VF.Voice(stave.time).setMode(voice.mode);
                vfVoice.addTickables(vfTickables);
                vfVoice.setStave(vfStave);

                if (vfTickables.length > numNotes) {
                    numNotes = vfTickables.length;
                }

                vfTickablesList.push(vfTickables);
                drawList.push(vfVoice);

                return vfVoice;
            });

            if (stave.joinVoices) {
                new VF.Formatter().joinVoices(vfVoices)
                    .formatToStave(vfVoices, vfStave);
            }

            stave.voices.forEach( (voice, i) => {
                let groups = voice.beams.groups.map(fraction => {
                    return new VF.Fraction(fraction.numerator, fraction.denominator);
                });

                var vfBeams = VF.Beam.applyAndGetBeams(vfVoices[i], voice.beams.direction, groups);
                var vfTies = voice.ties.map(tie => {
                    return new VF.StaveTie({
                        first_note: vfTickablesList[i][tie.first_note],
                        last_note: vfTickablesList[i][tie.last_note],
                        first_indices: tie.first_indices,
                        last_indices: tie.last_indices
                    });
                })

                drawList.push.apply(drawList, vfBeams);
                drawList.push.apply(drawList, vfTies);
            })

            drawList.push(vfStave);

            return vfStave;
        });

        console.log(drawList);
        drawList.forEach(drawable => drawable.setContext(context).draw());

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

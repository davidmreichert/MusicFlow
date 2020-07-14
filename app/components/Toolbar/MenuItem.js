import React from "react";
import {Dropdown} from "react-bootstrap"

export default class MenuItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            show: false
        };
    }

    onMouseEnter(e) {
        this.setState({show: true});
        e.target.focus();
    }

    onMouseLeave(e) {
        this.setState({show: false});
        e.target.blur();
    }

    toggle(e) {
        e.target.blur();
    }

    render() {
        return (
            <div onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}
                 onMouseOut={this.toggle.bind(this)}>
                <Dropdown show={this.state.show}>
                    <Dropdown.Toggle bsPrefix="dropdown-item" id="dropdown-basic">
                        {this.props.text}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {this.props.items.map((value, index) => {
                            return <Dropdown.Item as="button">{value}</Dropdown.Item>
                        })}
                    </Dropdown.Menu>

                </Dropdown>
            </div>
        );
    }
}
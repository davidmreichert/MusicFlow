import React from "react";

export default class Button extends React.Component {
    constructor(props) {
        super(props);
        this.style = {
            __html: this.props.image
        }
    }

    render() {
      return (
        <div
          className={"button " + (this.props.active ? "selected" : "")}
          dangerouslySetInnerHTML={this.style}
          onClick={e => this.props.handleClick(e, this.props.name)}
        />
      );
    }
}
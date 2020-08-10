import React from "react";
import MenuItem from "./MenuItem.js";

export default class MenuBar extends React.Component {
  constructor(props) {
      super(props);

      this.state = {};

      this.state.fileItems = [
          'Open',
          'New',
          'Save'
      ];

      this.state.editItems = [
          'Cut',
          'Copy',
          'Paste',
          'Undo',
          'Redo'
      ];

      this.state.viewItems = [
          'Recent Files',
          'Toolbox Window',
      ];

      this.state.toolsItems = [
          'Note Value',
          'Toggle Rest'
      ];

      this.state.helpItems = [
          'Search'
      ];
  }

  render() {
    return (
      <div className="menu-bar">
        <MenuItem text="File" items={this.state.fileItems}/>
        <MenuItem text="Edit" items={this.state.editItems}/>
        <MenuItem text="View" items={this.state.viewItems}/>
        <MenuItem text="Tools" items={this.state.toolsItems}/>
        <MenuItem text="Help" items={this.state.helpItems} />
      </div>
    );
  }
}

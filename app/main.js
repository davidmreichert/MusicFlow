//main.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import VexFlow from './components/VexFlow';

import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(<App />, document.getElementById('app'));
ReactDOM.render(<VexFlow />, document.getElementById('vexflow'));

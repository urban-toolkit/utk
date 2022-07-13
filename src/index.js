import JupyterReact from 'jupyter-react-js';
import components from './components';
// import requirejs from 'requirejs'

function load_ipython_extension () {
  requirejs([
    "base/js/namespace",
    "base/js/events",
  ], function( Jupyter, events ) {
    JupyterReact.init( Jupyter, events, 'react.thing', { components, save: false } );
  });
}

module.exports = {
  load_ipython_extension: load_ipython_extension
};

import React, {useEffect} from 'react';

// css file
import './App.css';

import {Environment, DataLoader, GrammarInterpreterFactory} from 'utk';
import 'utk/style.css'

import $ from 'jquery';

// const pythonServerParams = require('./pythonServerConfig.json');

// ======================================================================================

// TODO: get rid of this initializer
let initializer: any;

class Initializer {
  _map: any;
  _grammarInterpreter: any;
  _mainDiv: any;

  constructor(mainDiv: any) {

    this._mainDiv = document.querySelector(mainDiv);

    this._grammarInterpreter = GrammarInterpreterFactory.getInstance();
  }

  run(data:any) {

    this._grammarInterpreter.resetGrammarInterpreter(data, this._mainDiv);
    
    // cave connection
    // initializeConnection(this._map); // TODO: enable CAVE connection
  }

  get map(){
    return this._map;
  }

}

export const createAndRunMap = () => {
  $('#mainDiv').empty();

  initializer = new Initializer('#mainDiv');
      
  const port = 3000; // TODO: enable vr mode

  // if(MapConfig.frontEndMode == 'vr'){
  //   port = '3001';
  // }else{
  //   port = '3000';
  // }

  // Serves data files to the map
  // Environment.setEnvironment({backend: process.env.REACT_APP_BACKEND_SERVICE_URL as string});
  Environment.setEnvironment({backend: `http://localhost:5001` as string});
  const url = `${Environment.backend}/getGrammar`;
  DataLoader.getJsonData(url).then(data => {
    initializer.run(data);
  });
}

export const emptyMainDiv = () => {
  $('#mainDiv').empty();
}
 
// ======================================================================================

function App() {

  // Run only once
  useEffect(() => {
    createAndRunMap();
  }, []);

  return (
    <React.Fragment>
      <div id='mainDiv' style={{height: "100vh", width: "100%"}}>
      </div>
    </React.Fragment>
  );
}

export default App;


import React, {useEffect} from 'react';

// css file
import './App.css';

import {Environment, DataLoader, GrammarInterpreterFactory } from './utk-map/ts/dist/urbantkmap';
import './utk-map/ts/dist/urbantkmap.css';
import {paramsMapView} from './params.js';

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
  Environment.setEnvironment({backend: 'http://'+paramsMapView.environmentIP+':'+port+'/', dataFolder:paramsMapView.environmentDataFolder});
  // index.json is a file containing the descrition of map layers
  const url = `${Environment.backend}/${Environment.dataFolder}/grammar.json`;
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


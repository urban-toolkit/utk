// bootstrap component
import {Col} from 'react-bootstrap'

import {useEffect} from 'react'

// urbantkmap.js
import {Environment, MapView as WebMap, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';

// for jupyter python
import {MapView as JupyterMap} from '../../utilities/urbantkmap.iife.js';

// jquery
import $ from 'jquery';

// mapview css
import './MapView.css';

// enables sending images to cave
import {initializeConnection} from '../../caveSupport/sendToUnity.js';

import {paramsMapView} from '../../params.js';

// Mapview Application Class
class App {
  _map: WebMap;
  constructor(div: any) {
    const mapDiv = document.querySelector(div);
    this._map = new WebMap(mapDiv);
  }

  run(data:any) {
    this._map.initMapView(data).then(() => {
      this._map.render();
    });
    
    initializeConnection(this._map);
  }
}

// MapViewer parameter types
type mapViewDataProps = {
  dataToView: any,
  divWidth: number,
  frontEndMode?: string, //web is the default
  data?: any
}

export const MapViewer = ({dataToView, divWidth, frontEndMode, data}:mapViewDataProps) => {

    useEffect(()=> {
        $('#map').empty();

        // this line checks whether we are rendering the map
        // in browser or in jupyter notebook
        if(dataToView === 'none'){ //render map to jupyter notebook

          // get the div
          // var el = document.getElementById('map')!;

          // create new instance of Mapview from urbanktk.iife.js - jupyter
          // let map = new JupyterMap(el, false);

          let app = new App('#map');
          app.run(data);

          // render the map in jupyter
          // map.initMapView(data);

          // map.addLayer(data);

        }else{

          let app = new App('#map');
        
          let port;

          if(frontEndMode == 'vr'){
            port = '3001';
          }else{
            port = '3000';
          }

          // Serves data files to the map
          Environment.setEnvironment({backend: 'http://'+paramsMapView.environmentIP+':'+port+'/', dataFolder:paramsMapView.environmentDataFolder});
          // index.json is a file containing the descrition of map layers
          const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;
          DataLoader.getJsonData(url).then(data => {
              app.run(data);
          });

       }   

    }, [dataToView, data])

    return(
        <Col md={divWidth}>
            <div id='map'></div>
        </Col>
    )
}
// bootstrap component
import {Col} from 'react-bootstrap'

import React, {useEffect, useRef } from 'react'
// urbantkmap.js
import {Environment, MapView as WebMap, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';

// for jupyter python
import {MapView as JupyterMap} from '../../utilities/urbantkmap.iife.js';
// jquery
import $ from 'jquery';
// mapview css
import './MapView.css';

// enables sending images to cave
import {initialize} from '../../caveSupport/canvaToFile.js';

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
        // setInterval(function() { _this._map.render(); }, 25); 
      });
      
      // initialize(this._map);

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
          var el = document.getElementById('map')!;

          // create new instance of Mapview from urbanktk.iife.js - jupyter
          let map = new JupyterMap(el, false);

          // render the map in jupyter
          map.initMapView(data);

          map.addLayer(data);

        }else{

          let app = new App('#map');
        
          // console.log(window.innerHeight)
          // Data fromat example)

          let port;

          if(frontEndMode == 'vr'){
            port = '3001';
          }else{
            port = '3000';
          }
          // Environment.setEnvironment({backend: 'http://localhost:'+port+'/', dataFolder:'data/refs_format'});
          // Environment.setEnvironment({backend: 'http://http://131.193.183.139/:'+port+'/', dataFolder:'data/layers_new'});
          Environment.setEnvironment({backend: 'http://localhost:'+port+'/', dataFolder:'data/example_mesh_nyc'});


          // Environment.setEnvironment({backend: 'http://localhost:5501/', dataFolder:'data/refs_format'});
          // const url = `https://gist.githubusercontent.com/nafiul-nipu/1be0e281b5e7c1415bb239297660a998/raw/78196c1143f00bf29e91e1ee542ca6308bd07267/park_slope_no_buildings.json`;
          // const url = `https://gist.githubusercontent.com/nafiul-nipu/62a79715f9200212bc35227a0d4100e9/raw/0a13d94866e863356ed915dc57bf556c47da7dd5/index.json`
          // const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;
          const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;
          DataLoader.getJsonData(url).then(data => {
              app.run(data);
          });
       }   

    }, [dataToView, data])

    return(
        <Col md={divWidth}>
            <div id='map'></div>
            {/* <canvas className='mapCanvas' ref={canvas} style={{border:"1px solid #000000"}}></canvas> */}
        </Col>
    )
}
// bootstrap component
import {Col} from 'react-bootstrap'

import React, {useEffect, useRef } from 'react'
// urbantkmap.js
import { MapView, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';
// jquery
import $ from 'jquery';
// mapview css
import './MapView.css';

// Mapview Application Class
class App {
    _map: MapView;
    constructor(div: any) {
      const mapDiv = document.querySelector(div);
      this._map = new MapView(mapDiv);
    }
  
    run(data:any) {
      this._map.initMapView(data).then(() => {
        this._map.render();
      });
    }
  }


// MapViewer parameter types
type mapViewDataProps = {
  dataToView: any
}

export const MapViewer = ({dataToView}:mapViewDataProps) => {

    useEffect(()=> {
        $('#map').empty();
        let app = new App('#map');
        
        // console.log(window.innerHeight)
        // Data fromat example
        // Environment.setEnvironment({backend: 'http://127.0.0.1:3000', dataFolder:'src/data/data_format'});
        // const url = `https://gist.githubusercontent.com/nafiul-nipu/1be0e281b5e7c1415bb239297660a998/raw/78196c1143f00bf29e91e1ee542ca6308bd07267/park_slope_no_buildings.json`;
        const url = `https://raw.githubusercontent.com/urban-toolkit/urbantk-react-ts/master/src/data/refs_format/index.json?token=GHSAT0AAAAAABRXFUABYWOXMFJGESNLVWXQYVCKMQA`

        DataLoader.getJsonData(url).then(data => {
            app.run(data);
          });

    }, [dataToView])

    return(
        <Col md={11}>
            <div id='map'></div>
            {/* <canvas className='mapCanvas' ref={canvas} style={{border:"1px solid #000000"}}></canvas> */}
        </Col>
    )
}
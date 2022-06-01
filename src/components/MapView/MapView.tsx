import {Col} from 'react-bootstrap'
import React, {useEffect, useRef } from 'react'
import { MapView, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';
import $, { data } from 'jquery';

import './MapView.css';

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


type mapViewDataProps = {
  dataToView: any
}

export const MapViewer = ({dataToView}:mapViewDataProps) => {
    // const canvas = useRef<HTMLCanvasElement>(null!);
    // console.log(dataToView)


    useEffect(()=> {
        // let can = canvas.current;
        $('#map').empty();
        let app = new App('#map');

        // Data fromat example
        // Environment.setEnvironment({backend: 'http://127.0.0.1:3000', dataFolder:'src/data/data_format'});
        const url = `https://gist.githubusercontent.com/nafiul-nipu/1be0e281b5e7c1415bb239297660a998/raw/78196c1143f00bf29e91e1ee542ca6308bd07267/park_slope_no_buildings.json`;
        // const url = `https://gist.githubusercontent.com/nafiul-nipu/d524f113976cc30168f854374dab7885/raw/b4a631633d182c48a75f30be05b960d6efb7f3c3/park_slope.json`

        // console.log(window.innerHeight)

        DataLoader.getJsonData(url).then(data => {
            // console.log(data)
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
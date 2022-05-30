import {Col} from 'react-bootstrap'
import { useCallback, useEffect, useRef } from 'react'
import { Environment, MapView, DataLoader } from '../../utilities/urbantkmap';
import $ from 'jquery';

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

export const MapViewer = () => {
    const canvas = useRef<HTMLCanvasElement>(null!);


    useEffect(()=> {
        let can = canvas.current;
        $('#map').empty();
        let app = new App('#map');

        // Data fromat example
        // Environment.setEnvironment({backend: 'http://127.0.0.1:3000', dataFolder:'src/data/data_format'});
        const url = `https://raw.githubusercontent.com/urban-toolkit/urbantk-react-ts/master/src/data/data_format/park_slope_no_buildings.json?token=GHSAT0AAAAAABRXFUABFHHVPJNHH7DTDESEYUVDGYA`;

        console.log(url)

        DataLoader.getJsonData(url).then(data => {
            console.log(data)
            app.run(data);
          });

    }, [])

    return(
        <Col md={11}>
            <div id='map'></div>
            {/* <canvas className='mapCanvas' ref={canvas} style={{border:"1px solid #000000"}}></canvas> */}
        </Col>
    )
}
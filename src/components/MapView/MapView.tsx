import {Col} from 'react-bootstrap'
import { useCallback, useEffect, useRef } from 'react'
import { Environment, MapView, DataLoader } from '../../utilities/urbantkmap';

import './MapView.css';
import { vertexShaderSrc } from './vertex.glsl';
import { fragmentShaderSrc } from './fragment.glsl';
import { 
    createShader, 
    createProgram, 
    createCube, 
    createVAO, 
    createBuffers, 
    scaleMatrix, 
    rotateXMatrix, 
    rotateYMatrix, 
    translateMatrix, 
    multiplyArrayOfMatrices,
    perspectiveMatrix,
    invertMatrix} from '../../utilities/utils';

var gl: any;
var program: WebGLProgram;
var buffers: any;
var vao: WebGLVertexArrayObject;
var modelLoc: any;
var projectionLoc: any;
var viewLoc: any;
var modelMatrix: Iterable<number>;
var projectionMatrix: Iterable<number>;
var viewMatrix: Iterable<number>;


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
        let app = new App('#map');

        // Data fromat example
        Environment.setEnvironment({backend: 'http://127.0.0.1:3000', dataFolder:'src/data/data_format'});
        const url = `${Environment.backend}/${Environment.dataFolder}/park_slope_no_buildings.json`;

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
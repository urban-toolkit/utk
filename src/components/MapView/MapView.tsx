// bootstrap component
import {Col, Row, Button} from 'react-bootstrap'
import { VisWidget } from "../Widgets/VisWidget";
import { LayersWidget } from "../Widgets/LayersWidget";
import React, {useEffect} from 'react'

// urbantkmap.js
// import {Environment, MapView as WebMap, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';
import {Environment, MapViewFactory, DataLoader } from '../../urbantk-map/ts/dist/urbantkmap';

// for jupyter python
import {MapView as JupyterMap} from '../../utilities/urbantkmap.iife.js';

// jquery
import $ from 'jquery';

// mapview css
import './MapView.css';

// enables sending images to cave
// import {initializeConnection} from '../../caveSupport/sendToUnity.js';

import {paramsMapView} from '../../params.js';

import {D3AppFactory} from './D3App';

import { FaChartBar, FaEdit, FaRegTrashAlt } from "react-icons/fa";

var app: any;

// Mapview Application Class
class App {
  _map: any;
  constructor(div: any, d3App: any | null = null, linkedContainerGenerator: any | null = null, cameraUpdateCallback: any | null = null, filterKnotsUpdateCallback: any | null = null, listLayersCallback: any | null = null) {
    const mapDiv = document.querySelector(div);

    if(d3App){
      this._map = MapViewFactory.getInstance();
      this._map.resetMap(mapDiv, d3App, linkedContainerGenerator, cameraUpdateCallback, filterKnotsUpdateCallback, listLayersCallback);
    }else{
      this._map = MapViewFactory.getInstance();
      this._map.resetMap(mapDiv);
    }

  }

  run(data:any) {

    this._map.initMapView(data).then(() => {
      this._map.render();
    });
    
    // cave connection
    // initializeConnection(this._map);
  }

  setCamera(camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) {
    this._map.setCamera(camera);
  }

  get map(){
    return this._map;
  }

}

// MapViewer parameter types
type mapViewDataProps = {
  dataToView: any,
  divWidth: number,
  systemMessages: {text: string, color: string}[],
  applyGrammarButtonId: string,
  genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
  addGenericPlot: any,
  removeGenericPlot: React.Dispatch<React.SetStateAction<any>>,
  togglePlotCollection: React.Dispatch<React.SetStateAction<any>>,
  modifyLabelPlot: any,
  modifyEditingState: React.Dispatch<React.SetStateAction<any>>,
  listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[],
  listLayers: string[],
  listLayersCallback: any,
  linkMapAndGrammarId: string,
  frontEndMode?: string, //web is the default
  data?: any,
  d3App?: any,
  linkedContainerGenerator?: any,
  cameraUpdateCallback?: any,
  filterKnotsUpdateCallback?: any,
  inputId?: string
}

class MapConfig {
  public static frontEndMode: string | undefined;
  public static d3App: any | undefined;
  public static linkedContainerGenerator: any;
  public static cameraUpdateCallback: any;
  public static filterKnotsUpdateCallback: any;
  public static listLayersCallback: any;
}

export const createAndRunMap = () => {

  $('#map').empty();

  app = new App('#map', MapConfig.d3App, MapConfig.linkedContainerGenerator, MapConfig.cameraUpdateCallback, MapConfig.filterKnotsUpdateCallback, MapConfig.listLayersCallback);
      
  let port;

  if(MapConfig.frontEndMode == 'vr'){
    port = '3001';
  }else{
    port = '3000';
  }

  // Serves data files to the map
  Environment.setEnvironment({backend: 'http://'+paramsMapView.environmentIP+':'+port+'/', dataFolder:paramsMapView.environmentDataFolder});
  // index.json is a file containing the descrition of map layers
  const url = `${Environment.backend}/${Environment.dataFolder}/grammar.json`;
  DataLoader.getJsonData(url).then(data => {
      app.run(data);
  });
}

export const emptyMap = () => {
  $('#map').empty();
}
 
export const MapViewer = ({dataToView, divWidth, systemMessages, applyGrammarButtonId, genericScreenPlotToggle, addGenericPlot, removeGenericPlot, togglePlotCollection, modifyLabelPlot, modifyEditingState, listPlots, listLayers, listLayersCallback, linkMapAndGrammarId, frontEndMode, data, d3App, linkedContainerGenerator, cameraUpdateCallback, filterKnotsUpdateCallback, inputId}:mapViewDataProps) => {

  MapConfig.frontEndMode = frontEndMode;
  MapConfig.d3App = d3App;
  MapConfig.linkedContainerGenerator = linkedContainerGenerator;
  MapConfig.cameraUpdateCallback = cameraUpdateCallback;
  MapConfig.filterKnotsUpdateCallback = filterKnotsUpdateCallback;
  MapConfig.listLayersCallback = listLayersCallback;

  useEffect(()=> {
      $('#map').empty();

      // this line checks whether we are rendering the map
      // in browser or in jupyter notebook
      if(dataToView === 'none'){ //render map to jupyter notebook

        // get the div
        // var el = document.getElementById('map')!;

        // create new instance of Mapview from urbanktk.iife.js - jupyter
        // let map = new JupyterMap(el, false);

        app = new App('#map');
        app.run(data);

        // render the map in jupyter
        // map.initMapView(data);

        // map.addLayer(data);

      }else{
        // createAndRunMap();
      }   

  }, [dataToView, data])

  return(
    <React.Fragment>
      
      <Row style={{padding: 0, margin: 0}}>
        <div style={{padding: 0}}>
          <div id='map'>
          </div>
          <div id='svg_div'>
            <svg id='svg_element' xmlns="http://www.w3.org/2000/svg" style={{"display": "none"}}>
            </svg>
          </div>
        </div>

        <div style={{position: "absolute", height: "160px", bottom: 0, width: (divWidth/12)*window.innerWidth, backgroundColor: "rgba(200,200,200,0.3)", padding: 0}}>
          
          <Row md={12} style={{padding: 0, margin: 0}}>

            <Col md={4} style={{padding: 0, margin: "auto", height: "160px"}}>
              <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                <Button variant="secondary" id={applyGrammarButtonId} style={{marginRight: "10px"}}>Apply Grammar</Button>
                <input name="linkMapAndGrammar" type="checkbox" id={linkMapAndGrammarId} style={{marginRight: "5px"}}></input>
                <label htmlFor="linkMapAndGrammar">Link</label>
              </div>
            </Col>

            <Col md={4} style={{padding: 0, margin: 0, height: "160px"}}>
                {
                  systemMessages.map((item, index) => (
                      <p style={{color: item.color, width: ((divWidth/12)*window.innerWidth)/3, textAlign: "center", fontWeight: "bold", marginTop: "18px", marginBottom: "5px", position: "absolute"}} key={index}>{item.text}</p>
                  ))
                } 
              <div className="d-flex flex-column align-items-center justify-content-center" style={{height: "160px"}}>
                <input type="text" id={inputId} name="searchBar" placeholder='Search place' style={{width: "100%"}}></input>
              </div>
            </Col>

            <Col md={4} style={{padding: 0, margin: 0, height: "160px"}}>
              <Row style={{padding: 0, margin: 0}}>
                <Col md={6} style={{padding: 0, margin: 0}}>
                  <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                    <VisWidget 
                        genericScreenPlotToggle = {genericScreenPlotToggle}
                        addGenericPlot = {addGenericPlot}
                        removeGenericPlot = {removeGenericPlot}
                        togglePlotCollection = {togglePlotCollection}
                        listPlots = {listPlots}
                        modifyLabelPlot = {modifyLabelPlot}
                        modifyEditingState = {modifyEditingState}
                      />
                  </div>
                </Col>
                
                <Col md={6} style={{padding: 0, margin: 0}}> 
                  <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                    <LayersWidget 
                      listLayers = {listLayers}
                      layerToggle = {(id: string) => app.map.toggleLayer(id)}                      
                    />
                  </div>
                </Col>
              </Row>
            </Col>

          </Row>

        </div>

      </Row>
        

    </React.Fragment>
  )
}

export const setCameraPosMap = (camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) => {
  app.setCamera(camera);
}
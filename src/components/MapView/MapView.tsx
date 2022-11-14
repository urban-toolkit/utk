// bootstrap component
import {Col} from 'react-bootstrap'

import React, {useEffect} from 'react'

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

import {D3Expec} from '../D3Expec';

// Mapview Application Class
class App {
  _map: WebMap;
  constructor(div: any, d3App: D3App | null = null) {
    const mapDiv = document.querySelector(div);

    if(d3App){
      this._map = new WebMap(mapDiv, d3App);
    }else{
      this._map = new WebMap(mapDiv);
    }

  }

  run(data:any) {
    this._map.initMapView(data).then(() => {
      this._map.render();
    });
    
    initializeConnection(this._map);
  }
}

class LockFlag {
  
  _flag: boolean;
  
  constructor(){
    this._flag = false;
  }

  set(){
    this._flag = true;
  }

  get flag(){
    return this._flag;
  }

}

class D3App {

  _d3Expec: D3Expec;
  _svgSelector: string;

  constructor(svg: any){
    this._d3Expec = new D3Expec(svg);
    this._svgSelector = svg;
  }

  /**
   * 
   * @param {any[]} data Data to be plotted 
   * @param {number} imageId Each image create has a unique identifier defined by the user. If a identifier is reused the image is replaced. The identifier
   * @returns return a filepath of an image that has all the previously created images combined. The order of the images is defined by the imageId. 
   */
  async run(data: any[]){

    await this._d3Expec.run(data);

    let image = await this.getImageSvg();

    return image;
  }

  /**
   * Takes a screenshot of the current state of the svg
   */
  async getImageSvg(){
    
    // TODO: given that the svg is populated, create blob object from SVG
    let svgElement: any = document.querySelector(this._svgSelector);

    // cloning the node
    let clonedSvgElement = svgElement.cloneNode(true); // true for deep clone

    // creating a blob object from the cloned node
    let outerHTML = clonedSvgElement.outerHTML;
    let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});

    // creating URL from the blob Object
    let urlCreator = window.URL || window.webkitURL || window;
    let blobURL = urlCreator.createObjectURL(blob);

    let lockFlag = new LockFlag(); // flag to indicate if the image was loaded

    // loading image to html image element
    let image = new Image();
    image.addEventListener('load', function() {
      
      urlCreator.revokeObjectURL(blobURL);

      lockFlag.set();

    });

    image.src = blobURL;

    let checkFlag = async () => {
      if(lockFlag.flag == false) {
        await new Promise(r => setTimeout(r, 100));
        checkFlag();
      }
    }
    
    await checkFlag();

    return image;

  }

  
  /**
   * Create all the canvas used for the linked views
   * @param images list of images used in the abstraction surfaces
   */
  public generateCanvasTex(mapDiv: HTMLElement, images: HTMLImageElement[]){
    // let canvasTexDiv: any = document.querySelector(this._texCanvasSelector);

    // console.log(this._texCanvasSelector);

    // canvasTexDiv.textContent = ""; // remove tex canvas elements
    
    // TODO: remove all .texCanvas elements from mapDiv

    // remove old tex canvas elements
    const elementsToRemove = document.getElementsByClassName("texCanvas");
    while(elementsToRemove.length > 0){
      if(elementsToRemove[0].parentNode){
        elementsToRemove[0].parentNode.removeChild(elementsToRemove[0]);
      }
    }

    images.forEach((image, imageIndex) => {
      let texCanvas = document.createElement("canvas");

      texCanvas.className = "texCanvas";
      texCanvas.width = 300;
      texCanvas.height = 300;
      texCanvas.style.top = (10+((20*imageIndex)+(texCanvas.width*imageIndex)))+"px";
      texCanvas.style.right = "54px";

      let context = texCanvas.getContext("2d");

      if(context){
        context.fillStyle = "white";
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
      }

      mapDiv.appendChild(texCanvas);

    });

  }

  /**
   * Attach image to texture canvas
   * @param canvasContext 2D canvas context
   * @param image HTMLImageElement
   */
  public attachImageToCanvas(canvasContext: CanvasRenderingContext2D, image: HTMLImageElement){
    canvasContext.canvas.style.display = "block";
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    canvasContext.fillStyle = "white";
    canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    canvasContext.drawImage(image, 0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
  }

  /**
   * Remove texCanvas elements
   */
  public clearTexCanvas(){
    const elementsToRemove = document.getElementsByClassName("texCanvas");
    while(elementsToRemove.length > 0){
      if(elementsToRemove[0].parentNode){
        elementsToRemove[0].parentNode.removeChild(elementsToRemove[0]);
      }
    }
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

          let d3app = new D3App('#svg_element');

          let app = new App('#map', d3app);
        
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
      <React.Fragment>
        <Col md={divWidth}>
            <div id='map'>
            </div>
        </Col>
        <div id='svg_div'>
          <svg id='svg_element' xmlns="http://www.w3.org/2000/svg" style={{"display": "none"}}>
          </svg>
        </div>
      </React.Fragment>
    )
}
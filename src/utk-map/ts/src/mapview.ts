/// <reference types="@types/webgl2" />

import { CameraFactory } from './camera';
import { Layer } from './layer';

import { MapStyle } from './map-style';

import { KeyEventsFactory } from './key-events';
import { MouseEventsFactory } from './mouse-events';

import { DataApi } from './data-api';
import { LayerManager } from './layer-manager';

import { ICameraData, ILayerData, IMapStyle, IGrammar, IKnot, ILayerFeature } from './interfaces';

import { PlotArrangementType, InteractionType, LevelType, AggregationType } from './constants';

import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";

import { GrammarManager } from "./grammar-manager";
import { BuildingsLayer } from './layer-buildings';

import { TrianglesLayer } from './layer-triangles';

import { GrammarInterpreterFactory } from './grammarInterpreter';
import { KnotManager } from './knotManager';
import { Knot } from './knot';

class MapView {
    // Html div that will host the map
    protected _mapDiv: HTMLElement;
    // Html canvas used to draw the map
    protected _canvas: HTMLCanvasElement;
    // WebGL context of the canvas
    public _glContext: WebGL2RenderingContext;

    // Layer manager object
    protected _layerManager: LayerManager;
    protected _knotManager: KnotManager;

    // Manages the view configuration loaded (including plots and its interactions)
    protected _grammarManager: GrammarManager;

    protected _grammarInterpreter: any;

    // For each time called it returns
    protected _linkedContainerGenerator: any;
    protected _cameraUpdateCallback: any;
    protected _filterKnotsUpdateCallback: any;
    protected _listLayersCallback: any;

    // interaction variables
    private _camera: any;
    // mouse events
    private _mouse: any;
    // keyboard events
    private _keyboard: any;

    // private _mapViewData: IGrammar;

    protected _embeddedKnots: Set<string>;
    protected _linkedKnots: Set<string>;

    public _viewId: number; // the view to which this map belongs

    resetMap(mapDiv: HTMLElement, linkedContainerGenerator: any | null = null, cameraUpdateCallback: any | null = null, filterKnotsUpdateCallback: any | null = null, listLayersCallback: any | null = null): void {
        if(this._mapDiv != undefined){
            this._mapDiv.innerHTML = "";
        }

        // stores the map div
        this._mapDiv = mapDiv;
        // creates the new canvas element
        this._canvas = document.createElement('canvas');
        // setting the id
        this._canvas.id = "mapCanvas";
        // gets the webgl context
        this._glContext = <WebGL2RenderingContext>this._canvas.getContext('webgl2', {preserveDrawingBuffer: true, stencil: true}); // preserve drawing buffer is used to generate valid blobs for the cave
        // appends the canvas
        this._mapDiv.appendChild(this._canvas);

        this._viewId = 0; // TODO: should change depending on in what view the map is

        // this._mapDiv.appendChild(texCanvas);
        // creates the manager
        this._layerManager = new LayerManager(filterKnotsUpdateCallback, this);
        this._knotManager = new KnotManager();

        this._linkedContainerGenerator = linkedContainerGenerator;
        this._cameraUpdateCallback = cameraUpdateCallback;
        this._filterKnotsUpdateCallback = filterKnotsUpdateCallback;
        this._listLayersCallback = listLayersCallback;

        // inits the mouse events
        this.initMouseEvents();
        // bind the window events
        this.initWindowEvents();
        // inits the keyboard events
        this.initKeyboardEvents();

        this.render();
    }

    get mouse(): any{
        return this._mouse;
    }

    /**
     * gets the map div
     */
    get div(): HTMLElement {
        return this._mapDiv;
    }

    /**
     * gets the canvas element
     */
    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /**
     * gets the opengl context
     */
    get glContext(): WebGL2RenderingContext {
        return this._glContext;
    }

    /**
     * gets the camera object
     */
    get camera(): any {
        return this._camera;
    }

    /**
     * gets the layers
     */
    get layerManager(): LayerManager {
        return this._layerManager;
    }

    get knotManager(): KnotManager{
        return this._knotManager;
    }

    get grammarManager(): GrammarManager{
        return this._grammarManager;
    }

    /**
     * Map initialization function
     * @param {IGrammar} data grammar object containing the views definitions
     */
    async initMapView(data: IGrammar): Promise<void> {

        if (data === null) {
            console.error('Map data not provided.');
            return;
        }

        this._grammarInterpreter = GrammarInterpreterFactory.getInstance();
        this._grammarInterpreter.resetGrammarInterpreter(data, this);

        await this.initCamera(this._grammarInterpreter.getCamera(this._viewId));

        // resizes the canvas
        this.resize();

        await this.initLayers();

        this.initKnots();

        let knotsToList: string[] = [];

        for(const knot of this._knotManager.knots){
            if(knot.visible){
                knotsToList.push(knot.id);
            }
        }

        this._listLayersCallback(knotsToList);

        this.initGrammarManager(this._grammarInterpreter.getProcessedGrammar());

        if(this._grammarInterpreter.getFilterKnots(this._viewId) != undefined){
            this._layerManager.filterBbox = this._grammarInterpreter.getFilterKnots(this._viewId);
        }else{
            this._layerManager.filterBbox = [];
        }
    }

    parsePlotsKnotData(){

        let plotsKnots: string[] = [];

        for(const plotAttributes of this._grammarInterpreter.getPlots(this._viewId)){
            for(const knotId of plotAttributes.knots){
                if(!plotsKnots.includes(knotId)){
                    plotsKnots.push(knotId);
                }
            }
        }

        let plotsKnotData: {knotId: string, elements: {coordinates: number[], abstract: number, highlighted: boolean, index: number}[]}[] = [];

        for(const knotId of plotsKnots){
            for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
                if(knotId == knot.id){

                    let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);

                    let left_layer = this._layerManager.searchByLayerId(this._grammarInterpreter.getKnotOutputLayer(knot, this._viewId));

                    // let left_layer = this._layerManager.searchByLayerId(lastLink.thisLayer);

                    if(left_layer == null){
                        throw Error("Layer not found while processing knot");
                    }

                    let elements = [];

                    if(lastLink.thisLevel == undefined){ // this is a pure knot
                        continue;
                    }

                    let coordinates = left_layer.getCoordsByLevel(lastLink.thisLevel);

                    let functionValues = left_layer.getFunctionByLevel(lastLink.thisLevel, knotId);

                    let knotStructure = this._knotManager.getKnotById(knotId);

                    let highlighted = left_layer.getHighlightsByLevel(lastLink.thisLevel, (<Knot>knotStructure).shaders);

                    let readCoords = 0;

                    let filtered = left_layer.mesh.filtered;

                    for(let i = 0; i < coordinates.length; i++){

                        // if(elements.length >= 1000){ // preventing plot from having too many elements TODO: let the user know that plot is cropped
                        //     break;
                        // }

                        if(filtered.length == 0 || filtered[readCoords] == 1){
                            elements.push({
                                coordinates: coordinates[i],
                                abstract: functionValues[i][0],
                                highlighted: highlighted[i],
                                index: i
                            });
                        }

                        readCoords += coordinates[i].length/left_layer.mesh.dimension;
                    }

                    let knotData = {
                        knotId: knotId,
                        elements: elements
                    }

                    plotsKnotData.push(knotData);
                }
            }
        }   

        return plotsKnotData;
    }

    updateGrammarPlotsData(){

        let plotsKnotData = this.parsePlotsKnotData();

        this._grammarManager.updateGrammarPlotsData(plotsKnotData);

    }

    // if clear == true, elementIndex and level are ignored and all selections are deactivated
    updateGrammarPlotsHighlight(layerId: string, level: LevelType | null, elementIndex: number | null, clear: boolean = false){

        if(!clear){
            let elements: any = {};
        
            for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
                let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);
    
                if(lastLink.thisLayer == layerId && lastLink.thisLevel == level){
                    elements[knot.id] = elementIndex;
                }
            }
            
            this.grammarManager.setHighlightElementsLocally(elements, true, true);
        }else{
            let knotsToClear: string[] = [];

            for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
                let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);
    
                if(lastLink.thisLayer == layerId){
                    knotsToClear.push(knot.id);
                }
            }

            this.grammarManager.clearHighlightsLocally(knotsToClear);
        }

    }

    initGrammarManager(grammar: IGrammar){
        this._grammarManager = new GrammarManager(grammar, this._linkedContainerGenerator, this.parsePlotsKnotData(), {"function": this.setHighlightElement, "arg": this});
    }

    setHighlightElement(knotId: string, elementIndex: number, value: boolean, _this: any){

        let knot = _this.getKnotById(knotId, this._viewId);

        if(knot == undefined){
            throw Error("Cannot highlight element knot not found");
        }

        let layerId = _this._grammarInterpreter.getKnotOutputLayer(knot, _this._viewId);

        let lastLink = _this._grammarInterpreter.getKnotLastLink(knot, _this._viewId);

        if(lastLink.thisLevel == undefined)
            return;

        for(const layer of _this._layerManager.layers){
            if(layer.id == layerId){
                layer.setHighlightElements([elementIndex], <LevelType>lastLink.thisLevel, value);
                break;
            }
        }

        _this.render();

    }

    toggleKnot(id:string){
        this._knotManager.toggleKnot(id);
        this.render();
    }

    /**
     * Camera initialization function
     * @param {string | ICameraData} data Object containing the camera. If data is a string, then it loads data from disk.
     */
    async initCamera(camera: ICameraData | string): Promise<void> {
        // load the index file and its layers
        const params = typeof camera === 'string' ? await DataApi.getCameraParameters(camera) : camera;

        // sets the camera
        this._camera = CameraFactory.getInstance();
        this._camera.resetCamera(params.position, params.direction.up, params.direction.lookAt, params.direction.right, this._cameraUpdateCallback);
    }

    async initLayers(): Promise<void> {

        let layers: string[] = [];
        let centroid = this.camera.getWorldOrigin();

        for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
            if(!knot.knotOp){
                // load layers from knots if they dont already exist
                for(let i = 0; i < knot.linkingScheme.length; i++){
                    if(!layers.includes(knot.linkingScheme[i].thisLayer)){
                        layers.push(knot.linkingScheme[i].thisLayer);
                    }
                }
            }
        }

        // loop over the index file
        for (let i = 0; i < layers.length; i++) {

            let element = layers[i];

            // loads from file if not provided
            const layer = await DataApi.getLayer(element);

            // adds the new layer
            await this.addLayer(layer, centroid);
        }

    }

    /**
     * Add layer geometry and function
     */
    async addLayer(layerData: ILayerData, centroid: number[] | Float32Array): Promise<void> {
        // gets the layer data if available
        const features = 'data' in layerData ? layerData.data : undefined;

        if (!features) { return; }

        // loads the layers data
        const layer = this._layerManager.createLayer(layerData, centroid, features);

        // not able to create the layer
        if (!layer) { return; }

        let joinedJson = await DataApi.getJoinedJson(layer.id);

        if(joinedJson != null)
            layer.setJoinedJson(joinedJson);

        // render
        this.render();
    }

    initKnots(){
        for(const knotGrammar of this._grammarInterpreter.getKnots(this._viewId)){
            let layerId = this._grammarInterpreter.getKnotOutputLayer(knotGrammar, this._viewId);
            
            for(const layer of this._layerManager.layers){
                if(layer.id == layerId){
                    let knot = this._knotManager.createKnot(knotGrammar.id, <Layer>layer, knotGrammar, this._grammarInterpreter, this._viewId, this);
                    knot.processThematicData(this._layerManager); // send thematic data to the mesh of the physical layer TODO: put this inside the constructor of Knot
                    knot.loadShaders(this._glContext); // instantiate the shaders inside the knot TODO: put this inside the constructor of Knot
                    break;
                }
            }
        }
    }

    /**
     * Inits the mouse events
     */
    initMouseEvents(): void {
        // creates the mouse events manager
        this._mouse = MouseEventsFactory.getInstance();
        this._mouse.setMap(this);

        // binds the mouse events
        this._mouse.bindEvents();
    }

    /**
     * Inits the mouse events
     */
    initKeyboardEvents(): void {
        // creates the mouse events manager
        this._keyboard = KeyEventsFactory.getInstance();
        this._keyboard.setMap(this);
    }

    /**
     * inits the window events
     */
    initWindowEvents(): void {
        // resize listener
        window.addEventListener('resize', () => {
            // resizes the canvas
            this.resize();
            this.render();
        });
    }

    public setCamera(camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}): void{
        this._camera.setPosition(camera.position[0], camera.position[1]);
        this.render();
    }   

    /**
     * Renders the map
     */
    render(): void {
        // no camera defined
        if (!this._camera) { return; }

        // sky definition
        const sky = MapStyle.getColor('sky').concat([1.0]);
        this._glContext.clearColor(sky[0], sky[1], sky[2], sky[3]);

        // tslint:disable-next-line:no-bitwise
        this._glContext.clear(this._glContext.COLOR_BUFFER_BIT | this._glContext.DEPTH_BUFFER_BIT);

        this._glContext.clearStencil(0);
        this._glContext.clear(this._glContext.STENCIL_BUFFER_BIT);

        // updates the camera
        this._camera.update();

        this._camera.loadPosition(JSON.stringify(this.camera));

        // // render the layers
        // for (const layer of this._layerManager.layers) {
        //     // skips based on visibility
        //     if (!layer.visible) { continue; }

        //     if(this._grammarInterpreter.evaluateLayerVisibility(layer.id, this._viewId)){
        //         // sends the camera
        //         layer.camera = this.camera;
        //         // render
        //         // layer.render(this._glContext);
        //     }
        // }

        for(const knot of this._knotManager.knots){
            if(this._grammarInterpreter.evaluateKnotVisibility(knot, this._viewId)){
                knot.render(this._glContext, this.camera);
            }
        }

    }

    /**
     * Resizes the html canvas
     */
    resize(): void {

        const targetWidth = this._mapDiv.clientWidth;
        const targetHeight = this._mapDiv.clientHeight;

        const value = Math.max(targetWidth, targetHeight);
        this._glContext.viewport(0, 0, value, value);
        this._canvas.width = targetWidth;
        this._canvas.height = targetHeight;

        // stores in the camera
        this._camera.setViewportResolution(targetWidth, targetHeight);

        for (const knot of this._knotManager.knots){
            if (!knot.visible) { continue; }

            for(const shader of knot.shaders){
                if(shader instanceof ShaderPicking){
                    shader.resizeDirty = true;
                }

                if(shader instanceof ShaderPickingTriangles){
                    shader.resizeDirty = true;
                }
            }
        }

    }
}

export var MapViewFactory = (function(){

    var instance: MapView;
  
    return {
      getInstance: function(){
          if (instance == null) {
              instance = new MapView();
          }
          return instance;
      }
    };
  
})();
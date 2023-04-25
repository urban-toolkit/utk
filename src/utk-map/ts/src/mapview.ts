/// <reference types="@types/webgl2" />

import { CameraFactory } from './camera';
import { MapStyle } from './map-style';

import { KeyEventsFactory } from './key-events';
import { MouseEventsFactory } from './mouse-events';

import { DataApi } from './data-api';
import { LayerManager } from './layer-manager';

import { ICameraData, ILayerData, IMapStyle, IGrammar, IKnot } from './interfaces';

import { PlotArrangementType, InteractionType, LevelType, AggregationType } from './constants';

import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";

import { GrammarManager } from "./grammar-manager";
import { ImpactViewManager } from "./impactViewManager";
import { BuildingsLayer } from './layer-buildings';

import { TrianglesLayer } from './layer-triangles';

import { GrammarInterpreterFactory } from './grammarInterpreter';

class MapView {
    // Html div that will host the map
    protected _mapDiv: HTMLElement;
    // Html canvas used to draw the map
    protected _canvas: HTMLCanvasElement;
    // WebGL context of the canvas
    public _glContext: WebGL2RenderingContext;

    // Layer manager object
    protected _layerManager: LayerManager;

    // Manages the view configuration loaded (including plots and its interactions)
    protected _grammarManager: GrammarManager;

    protected _grammarInterpreter: any;

    protected _impactViewManager: ImpactViewManager;

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
        this._layerManager = new LayerManager(filterKnotsUpdateCallback);

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

    get grammarManager(): GrammarManager{
        return this._grammarManager;
    }

    get impactViewManager(): ImpactViewManager{
        return this._impactViewManager;
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

        let knotsMap = this._grammarInterpreter.getMap(this._viewId).knots;
        let layersIds: string[] = [];
        let knotIdLayers: string[] = [];
        let endOfScheme: boolean[] = [];
        let joinedList: boolean[] = [];
        let colorMaps: (string | undefined)[] = [];

        function addLayerToList(layer: string, knotIdLayer: string, end: boolean, layersIds: string[], knotIdLayers: string[], endOfScheme: boolean[], joined: boolean, colorMap: string | undefined){
            // let alreadyIncluded = false;
            // let endIndex = -1;

            // for(let i = 0; i < layersIds.length; i++){
            //     if(layersIds[i] == layer){
            //         alreadyIncluded = true;
            //         endIndex = i;
            //         break;
            //     }
            // }

            // if(alreadyIncluded){
            //     if(end){
            //         endOfScheme[endIndex] = true;
            //         colorMaps[endIndex] = colorMap;
            //     }

            //     if(joined){
            //         joinedList[endIndex] = true;
            //     }

            // }else{
            //     layersIds.push(layer);
            //     endOfScheme.push(end);
            //     joinedList.push(joined);

            //     if(end){
            //         colorMaps.push(colorMap);
            //     }
            // }

            layersIds.push(layer);
            knotIdLayers.push(knotIdLayer);
            endOfScheme.push(end);
            joinedList.push(joined);

            if(end){
                colorMaps.push(colorMap);
            }
        }

        const addLayersFromKnot = (knot: IKnot, colorMap: string | undefined) => {
            for(let i = 0; i < knot.linkingScheme.length; i++){

                let joined = false;

                if(knot.linkingScheme[i].otherLayer != undefined && knot.linkingScheme[i].thisLayer != knot.linkingScheme[i].otherLayer){
                    joined = true;
                }

                if(i == knot.linkingScheme.length-1){
                    // addLayerToList(knot.linkingScheme[i].thisLayer, true, layersIds, endOfScheme, joined, colorMap);
                    addLayerToList(knot.linkingScheme[i].thisLayer, knot.id, true, layersIds, knotIdLayers, endOfScheme, joined, colorMap);
                }else{
                    // addLayerToList(knot.linkingScheme[i].thisLayer, false, layersIds, endOfScheme, joined, colorMap);
                    addLayerToList(knot.linkingScheme[i].thisLayer, knot.id, false, layersIds, knotIdLayers, endOfScheme, joined, colorMap);
                }
            }
        }

        for(const knotId of knotsMap){
            for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
                if(knot.id == knotId){

                    if(knot.knotOp != true){
                        addLayersFromKnot(knot, knot.colorMap);
                    }else{
                        let knotLeft = this._grammarInterpreter.getKnotById(knot.linkingScheme[knot.linkingScheme.length-1].thisLayer, this._viewId);
                        let knotRight = this._grammarInterpreter.getKnotById(<string>knot.linkingScheme[knot.linkingScheme.length-1].otherLayer, this._viewId);

                        if(knotLeft == undefined || knotRight == undefined){
                            throw Error("Could not find knot");
                        }

                        addLayersFromKnot(knotLeft, knot.colorMap);
                        addLayersFromKnot(knotRight, knot.colorMap);
                    }

                }
            }
        }

        // inits the layers
        await this.initLayers(layersIds, knotIdLayers, endOfScheme, joinedList, this.camera.getWorldOrigin(), colorMaps);

        let layersToList: string[] = [];

        for(const layer of this._layerManager.layers){
            if(layer.visible){
                layersToList.push(layer.knotId);
            }
        }

        this._listLayersCallback(layersToList);

        this.initGrammarManager(this._grammarInterpreter.getProcessedGrammar());

        this._impactViewManager = new ImpactViewManager();

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

                    let highlighted = left_layer.getHighlightsByLevel(lastLink.thisLevel);

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
    updateGrammarPlotsHighlight(_this:any, layerId: string, knotIdLayer: string, level: LevelType | null, elementIndex: number | null, clear: boolean = false){

        if(!clear){
            let elements: any = {};
        
            // for(const knot of _this._mapViewData.views[0].knots){
            //     let lastLink = _this._grammarInterpreter.getKnotLastLink(knot, _this._viewId);
    
            //     if(lastLink.thisLayer == layerId && lastLink.thisLevel == level){
            //         elements[knot.id] = elementIndex;
            //     }
            // }
            
            elements[knotIdLayer] = elementIndex;

            _this.grammarManager.setHighlightElementsLocally(elements, true, true);
        }else{
            let knotsToClear: string[] = [];

            // for(const knot of _this._mapViewData.views[0].knots){
            //     let lastLink = _this.grammarInterpreter.getKnotLastLink(knot, _this.viewId);
    
            //     if(lastLink.thisLayer == layerId){
            //         knotsToClear.push(knot.id);
            //     }
            // }

            knotsToClear.push(knotIdLayer);

            _this.grammarManager.clearHighlightsLocally(knotsToClear);
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

    toggleLayer(id:string){
        this._layerManager.toggleLayer(id);
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

    async initLayers(layers: string[], knotId: string[], endOfScheme: boolean[], joined: boolean[], centroid: number[] | Float32Array, colorMaps: (string | undefined)[]): Promise<void> {

        // loop over the index file
        for (let i = 0; i < layers.length; i++) {

            let element = layers[i];

            // loads from file if not provided
            const layer = await DataApi.getLayer(element);

            // skips the layer
            if ('skip' in layer && layer['skip']) {
                continue;
            }

            if(endOfScheme[i] == false){
                layer['visible'] = false;
            }

            // adds the new layer
            await this.addLayer(layer, knotId[i], joined[i], centroid, colorMaps[i]);
        }

    }

    private getLayerSchemes(layerId: string, knotIdLayer: string): {"knots": IKnot[], "interactions": InteractionType[]}  | null{
        let mapKnots = this._grammarInterpreter.getMap(this._viewId).knots;
        let lastMapKnot: IKnot | null = null;
        let lastMapKnotInteraction: InteractionType = InteractionType.NONE;

        // let allKnots = this._grammarInterpreter.getKnots(this._viewId);
        
        // let allLayerKnots = [];

        // let plotKnots: string[] = [];

        // for(const plot of this._grammarInterpreter.getPlots(this._viewId)){
        //     for(const knotId of plot.knots){
        //         if(!plotKnots.includes(knotId)){
        //             plotKnots.push(knotId);
        //         }
        //     }
        // }
        
        // retrieving last map knot of this layer (that is the one that will be rendered)
        // for(const knotId of mapKnots){
        //     for(const knot of this._grammarInterpreter.getKnots(this._viewId)){
        //         if(knot.id == knotId){
        //             if(knot.linkingScheme != undefined && knot.aggregationScheme != undefined && this._grammarInterpreter.getKnotOutputLayer(knot, this._viewId) == layerId){
        //                 lastMapKnot = knot;
        //                 lastMapKnotInteraction = this._grammarInterpreter.getMap(this._viewId).interactions[mapKnots.indexOf(knot.id)];
        //             }
        //         }
        //     }
        // }

        lastMapKnot = this._grammarInterpreter.getKnotById(knotIdLayer);
        lastMapKnotInteraction = this._grammarInterpreter.getMap(this._viewId).interactions[mapKnots.indexOf(knotIdLayer)];
        
        // let knotsInteractions: InteractionType[] = [];

        // for(const knot of allKnots){
        //     if(knot.linkingScheme != undefined && knot.aggregationScheme != undefined && this._grammarInterpreter.getKnotOutputLayer(knot, this._viewId) == layerId && (mapKnots.includes(knot.id) || plotKnots.includes(knot.id))){
        //         if(lastMapKnot == null){
        //             allLayerKnots.push(knot);
        //             if(mapKnots.includes(knot.id)){
        //                 knotsInteractions.push(this._grammarInterpreter.getMap(this._viewId).interactions[mapKnots.indexOf(knot.id)]);
        //             }else{
        //                 knotsInteractions.push(InteractionType.NONE);
        //             }                    
        //         }else if(knot.id != lastMapKnot.id){
        //             allLayerKnots.push(knot);
        //             if(mapKnots.includes(knot.id)){
        //                 knotsInteractions.push(this._grammarInterpreter.getMap(this._viewId).interactions[mapKnots.indexOf(knot.id)]);
        //             }else{
        //                 knotsInteractions.push(InteractionType.NONE);
        //             } 
        //         }
        //     }
        // }

        // if(lastMapKnot != null){
        //     allLayerKnots.push(lastMapKnot);
        //     knotsInteractions.push(lastMapKnotInteraction);
        // }

        // if(allLayerKnots.length == 0)
        //     return null

        // return {"knots": allLayerKnots, "interactions": knotsInteractions};
        return {"knots": [<IKnot>lastMapKnot], "interactions": [lastMapKnotInteraction]};
    }

    /**
     * Add layer geometry and function
     */
    async addLayer(layerData: ILayerData, knotIdLayer: string, joined: boolean, centroid: number[] | Float32Array, colorMap: string | undefined): Promise<void> {
        // loads the layers data
        const layer = this._layerManager.createLayer(knotIdLayer, layerData, centroid, colorMap);

        // not able to create the layer
        if (!layer) { return; }

        if(joined){
            let joinedJson = await DataApi.getJoinedJson(layer.id);
            layer.setJoinedJson(joinedJson);
        }

        // loads the shaders
        await layer.loadShaders(this._glContext);

        // gets the layer data if available
        const features = 'data' in layerData ? layerData.data : undefined;

        // update the features
        if (features) {

            let knotsAndInteractions = this.getLayerSchemes(layer.id, knotIdLayer);

            layer.updateMeshGeometry(features);

            let plotArrangementsPerKnot: any = {}; // stores in what plot arrangements a specific knot was used

            for(const plot of this._grammarInterpreter.getPlots(this._viewId)){
                for(const knotId of plot.knots){
                    if(plotArrangementsPerKnot[knotId] == undefined){
                        plotArrangementsPerKnot[knotId] = new Set();
                        plotArrangementsPerKnot[knotId].add(plot.arrangement);
                    }else{
                        plotArrangementsPerKnot[knotId].add(plot.arrangement);
                    }
                }
            }

            if(knotsAndInteractions != null){
                let plotArrangementsBuildings: PlotArrangementType[] = [];
                let interactionsBuildings: InteractionType[] = [];

                let plotArrangementsTriangles: PlotArrangementType[] = [];
                let interactionsTriangles: InteractionType[] = [];

                for(let i = 0; i < knotsAndInteractions.knots.length; i++){

                    if(knotsAndInteractions.knots[i].knotOp != true){
                        layer.addMeshFunction(knotsAndInteractions.knots[i], this._layerManager);
                    }else{
                        let functionsPerKnot: any = {};

                        for(const scheme of knotsAndInteractions.knots[i].linkingScheme){
                            if(functionsPerKnot[scheme.thisLayer] == undefined){
                                let knot = this._grammarInterpreter.getKnotById(scheme.thisLayer, this._viewId);

                                if(knot == undefined){
                                    throw Error("Could not retrieve knot that composes knotOp "+knotsAndInteractions.knots[i].id);
                                }

                                functionsPerKnot[scheme.thisLayer] = this.layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
                            }

                            if(functionsPerKnot[<string>scheme.otherLayer] == undefined){
                                let knot = this._grammarInterpreter.getKnotById(<string>scheme.otherLayer, this._viewId);

                                if(knot == undefined){
                                    throw Error("Could not retrieve knot that composes knotOp "+knotsAndInteractions.knots[i].id);
                                }

                                functionsPerKnot[<string>scheme.otherLayer] = this.layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
                            }

                        }

                        let functionSize = -1;

                        let functionsPerKnotsKeys = Object.keys(functionsPerKnot);

                        for(const key of functionsPerKnotsKeys){
                            if(functionSize == -1){
                                functionSize = functionsPerKnot[key].length;
                            }else if(functionSize != functionsPerKnot[key].length){
                                throw Error("All knots used in knotOp must have the same length");
                            }
                        }

                        if(functionSize == -1){
                            throw Error("Could not retrieve valid function values for knotOp "+knotsAndInteractions.knots[i].id);
                        }

                        let prevResult: number[] = new Array(functionSize);

                        let linkIndex = 0;

                        for(const scheme of knotsAndInteractions.knots[i].linkingScheme){
                            if(linkIndex == 0 && (<string>scheme.op).includes("prevResult")){
                                throw Error("It is not possible to access a previous result (prevResult) for the first link");
                            }

                            let functionValue0 = functionsPerKnot[scheme.thisLayer];
                            let functionValue1 = functionsPerKnot[<string>scheme.otherLayer];
                        
                            for(let j = 0; j < functionValue0.length; j++){

                                let operation = (<string>scheme.op).replaceAll(scheme.thisLayer, functionValue0[j]+'').replaceAll(<LevelType>scheme.otherLayer, functionValue1[j]+''); 
                                
                                if(linkIndex != 0){
                                    operation = operation.replaceAll("prevResult", prevResult[j]+'');
                                }

                                prevResult[j] = eval(operation); // TODO deal with security problem
                            }

                            linkIndex += 1;

                        }

                        console.log("prevResult", prevResult);

                        layer.directAddMeshFunction(prevResult, knotsAndInteractions.knots[i].id);

                    }

                    if(layer instanceof BuildingsLayer){
            
                        if(plotArrangementsPerKnot[knotsAndInteractions.knots[i].id] != undefined){ // the knot is not used in any plots
                            plotArrangementsBuildings = plotArrangementsBuildings.concat(Array.from(plotArrangementsPerKnot[knotsAndInteractions.knots[i].id]));
                        }
        
                        interactionsBuildings.push(knotsAndInteractions.interactions[i]);
                        
                    }else if(layer instanceof TrianglesLayer){

                        if(plotArrangementsPerKnot[knotsAndInteractions.knots[i].id] != undefined){ // the knot is not used in any plots
                            plotArrangementsTriangles = plotArrangementsTriangles.concat(Array.from(plotArrangementsPerKnot[knotsAndInteractions.knots[i].id]));
                        }
        
                        interactionsTriangles.push(knotsAndInteractions.interactions[i]);

                    }else if(knotsAndInteractions.interactions[i] != InteractionType.NONE){
                        throw Error("Interactions are currently only supported for the buildings and triangles layer");
                    }

                }

                this._mouse.setInteractionConfigBuildings(interactionsBuildings, plotArrangementsBuildings);
                this._keyboard.setInteractionConfigBuildings(interactionsBuildings, plotArrangementsBuildings);
            
                this._mouse.setInteractionConfigTriangles(interactionsTriangles, plotArrangementsTriangles);
                this._keyboard.setInteractionConfigTriangles(interactionsTriangles, plotArrangementsTriangles);
            
            }

            layer.updateShaders();

            // layer.updateFeatures(features, knots, this._layerManager);
            
            if(knotsAndInteractions != null){
                for(let i = 0; i < knotsAndInteractions.knots.length; i++){
                    if(this._grammarInterpreter.getKnotLastLink(knotsAndInteractions.knots[i], this._viewId).otherLayer != undefined){ // if it is not a pure knot
                        layer.updateFunction(features, knotsAndInteractions.knots[i]);
                    }
                }
            }

        }

        // render
        this.render();

    }

    /**
     * update layer function function
     */
    async updateLayerFunction(layerInfo: ILayerData): Promise<void> {
        // searches the layer
        let layer = this._layerManager.searchByLayerInfo(layerInfo);

        // gets the layer geometry if available
        const features = 'data' in layerInfo ? layerInfo['data'] : null;

        // not found or no data
        if (layer === null || !features) { return; }

        let knotsAndInteractions = this.getLayerSchemes(layer.id, layer.knotId);

        if(knotsAndInteractions == null){
            throw Error("Could not retrieve scheme of layer "+layer.id);
        }

        // layer.updateFeatures(features, knots, this._layerManager);
        for(let i = 0; i < knotsAndInteractions.knots.length; i++){
            layer.updateFunction(features, knotsAndInteractions.knots[i]);
        }

        // render
        this.render();
    }

    /**
     * apply the current layer color
     */
     applyLayerStyle(name: string): void {
        // searches the layer
        let layer = this._layerManager.searchByLayerId(name);

        // not found or no data
        if (layer === null ) { return; }

        // update the function
        layer.updateStyle(this._glContext);

        // render
        this.render();
    }

    /**
     * Changes the map style.
     */
     async changeMapStyle(data: string | IMapStyle): Promise<void> {
        await MapStyle.setColor(data);

        for (const layer of this._layerManager.layers) {
            layer.updateStyle(this._glContext);
        }

        this.render();
    }    

    activateBirdsEye(){
        this._camera.activateBirdsEye();
        this.render();
    }

    /**
     * Inits the mouse events
     */
    initMouseEvents(): void {
        // creates the mouse events manager
        this._mouse = MouseEventsFactory.getInstance();
        this._mouse.setMap(this);

        // this._mouse.setInteractionsCallback(this.updateGrammarPlotsData, this);
        this._mouse.setInteractionsCallback(this.updateGrammarPlotsHighlight, this);
        
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

        // this._keyboard.setInteractionsCallback(this.updateGrammarPlotsData, this);
        this._keyboard.setInteractionsCallback(this.updateGrammarPlotsHighlight, this);
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

        // render the layers
        for (const layer of this._layerManager.layers) {
            // skips based on visibility
            if (!layer.visible) { continue; }

            if(this._grammarInterpreter.evaluateLayerVisibility(layer.id, this._viewId)){
                // sends the camera
                layer.camera = this.camera;
                // render
                layer.render(this._glContext);
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

        for (const layer of this._layerManager.layers){
            if (!layer.visible) { continue; }

            for(const shader of layer.shaders){
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
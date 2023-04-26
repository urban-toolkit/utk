import { Layer } from "./layer";
import { AuxiliaryShader } from './auxiliaryShader';
import { Shader } from './shader';
import { MapStyle } from "./map-style";
import { AggregationType, InteractionType, LevelType, PlotArrangementType, RenderStyle } from './constants';

import { ShaderFlatColor } from "./shader-flatColor";
import { ShaderFlatColorMap } from "./shader-flatColorMap";
import { ShaderSmoothColor } from "./shader-smoothColor";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderSmoothColorMapTex } from "./shader-smoothColorMapTex";
import { ShaderAbstractSurface } from "./shader-abstractSurface";
import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";
import { AuxiliaryShaderTriangles } from "./auxiliaryShaderTriangles";

import { BuildingsLayer } from "./layer-buildings";
import { TrianglesLayer } from "./layer-triangles";
import { IKnot } from "./interfaces";
import { LayerManager } from "./layer-manager";

export class Knot {

    protected _physicalLayer: Layer; // the physical format the data will assume
    protected _thematicData: number[] | null;
    protected _knotSpecification: IKnot;
    protected _id: string;
    protected _shaders: (Shader|AuxiliaryShader)[] = [];
    protected _visible: boolean;
    protected _grammarInterpreter: any;
    protected _viewId: number;
    protected _map: any

    constructor(id: string, physicalLayer: Layer, knotSpecification: IKnot, grammarInterpreter: any, viewId: number, map: any) {
        this._physicalLayer = physicalLayer;
        this._knotSpecification = knotSpecification;
        this._id = id;
        this._visible = true;
        this._grammarInterpreter = grammarInterpreter;
        this._viewId = viewId;
        this._map = map;
    }   

    get id(){
        return this._id;
    }

    get visible(){
        return this._visible;
    }

    get shaders(){
        return this._shaders;
    }

    get physicalLayer(){
        return this._physicalLayer;
    }

    set visible(visible: boolean){
        this._visible = visible;
    }

    set thematicData(thematicData: number[]){
        this._thematicData = thematicData;
    }

    render(glContext: WebGL2RenderingContext, camera: any): void {
        if (!this._visible) { return; } 

        this._physicalLayer.camera = camera;
        this._physicalLayer.render(glContext, this._shaders);
    }

    loadShaders(glContext: WebGL2RenderingContext): void {
        this._shaders = [];
        const color = MapStyle.getColor(this._physicalLayer.style);

        let cmap = 'interpolateReds';

        if(this._knotSpecification['colorMap'] != undefined){
            cmap = <string>this._knotSpecification['colorMap'];
        }

        for (const type of this._physicalLayer.renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    shader = new ShaderFlatColor(glContext, color);
                break;
                case RenderStyle.FLAT_COLOR_MAP:
                    shader = new ShaderFlatColorMap(glContext, cmap);
                break;
                case RenderStyle.SMOOTH_COLOR:
                    shader = new ShaderSmoothColor(glContext, color);
                break;
                case RenderStyle.SMOOTH_COLOR_MAP:
                    shader = new ShaderSmoothColorMap(glContext, cmap);
                break;
                case RenderStyle.SMOOTH_COLOR_MAP_TEX:
                    shader = new ShaderSmoothColorMapTex(glContext, cmap);
                break;
                case RenderStyle.PICKING: 

                    if(this._physicalLayer instanceof TrianglesLayer){
                        let auxShader = undefined;
    
                        if(this._shaders.length > 0){
                            auxShader = this._shaders[this._shaders.length-1];
                        }
    
                        if(auxShader && auxShader instanceof AuxiliaryShaderTriangles){
                            shader = new ShaderPickingTriangles(glContext, auxShader);
                        }else{
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array. SMOOTH_COLOR_MAP can be used as an auxiliary array");
                        }
                    }else if(this._physicalLayer instanceof BuildingsLayer){
                        let auxShader = undefined;

                        if(this._shaders.length > 0){
                            auxShader = this._shaders[this._shaders.length-1];
                        }
    
                        if(auxShader && auxShader instanceof AuxiliaryShader){
                            shader = new ShaderPicking(glContext, auxShader);
                        }else{
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array.");
                        }
                    }

                break;
                case RenderStyle.ABSTRACT_SURFACES:
                    shader = new ShaderAbstractSurface(glContext);
                break;
                default:
                    shader = new ShaderFlatColor(glContext, color);
                break;
            }

            this._shaders.push(<Shader | AuxiliaryShader>shader);

            // // load message
            // console.log("------------------------------------------------------");
            // console.log(`Layer ${this._id} of type ${this._type}.`);
            // console.log(`Render styles: ${this._renderStyle.join(", ")}`);
            // console.log(`Successfully loaded ${this._shaders.length} shader(s).`);
            // console.log("------------------------------------------------------");
        }

        this._physicalLayer.updateShaders(this._shaders); // send mesh data to the shaders
        this._physicalLayer.updateFunction(this._knotSpecification, this._shaders);
    }

    // send function values to the mesh of the layer
    addMeshFunction(layerManager: LayerManager){
        let functionValues: number[] | null = null;
        
        if(this._knotSpecification.linkingScheme != null && this._knotSpecification.aggregationScheme != null){
            functionValues = layerManager.getAbstractDataFromLink(this._knotSpecification.linkingScheme, <AggregationType[]>this._knotSpecification.aggregationScheme)
        }

        this._thematicData = functionValues;

        let distributedValues = this._physicalLayer.distributeFunctionValues(functionValues);

        this._physicalLayer.mesh.loadFunctionData(distributedValues, this._knotSpecification.id);
    }

    processThematicData(layerManager: LayerManager){

        if(this._knotSpecification.knotOp != true){
            this.addMeshFunction(layerManager);
        }else{ // TODO: knot should not have to retrieve the subknots they should be given
            let functionsPerKnot: any = {};

            for(const scheme of this._knotSpecification.linkingScheme){
                if(functionsPerKnot[scheme.thisLayer] == undefined){
                    let knot = this._grammarInterpreter.getKnotById(scheme.thisLayer, this._viewId);

                    if(knot == undefined){
                        throw Error("Could not retrieve knot that composes knotOp "+this._knotSpecification.id);
                    }

                    functionsPerKnot[scheme.thisLayer] = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
                }

                if(functionsPerKnot[<string>scheme.otherLayer] == undefined){
                    let knot = this._grammarInterpreter.getKnotById(<string>scheme.otherLayer, this._viewId);

                    if(knot == undefined){
                        throw Error("Could not retrieve knot that composes knotOp "+this._knotSpecification.id);
                    }

                    functionsPerKnot[<string>scheme.otherLayer] = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme);
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
                throw Error("Could not retrieve valid function values for knotOp "+this._knotSpecification.id);
            }

            let prevResult: number[] = new Array(functionSize);

            let linkIndex = 0;

            for(const scheme of this._knotSpecification.linkingScheme){
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

            this._physicalLayer.directAddMeshFunction(prevResult, this._knotSpecification.id);

        }

    }

    private _getPickingArea(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): {pixelAnchorX: number, pixelAnchorY: number, width: number, height: number}{
        if(!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)){
            return {
                pixelAnchorX: 0,
                pixelAnchorY: 0,
                width: 0,
                height: 0
            };
        }
        
        // Converting mouse position in the CSS pixels display into pixel coordinate
        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;

        let pixelAnchorX = anchorX * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelAnchorY = glContext.canvas.height - anchorY * glContext.canvas.height / glContext.canvas.clientHeight - 1;

        let width: number = 0;
        let height: number = 0;

        if(pixelX - pixelAnchorX > 0 && pixelY - pixelAnchorY < 0){ //bottom right
            width = Math.abs(pixelX - pixelAnchorX); 
            height = Math.abs(pixelY - pixelAnchorY);    
            
            pixelAnchorY = pixelY; // shift the anchor point for the width and height be always positive
        }else if(pixelX - pixelAnchorX < 0 && pixelY - pixelAnchorY < 0){ //  bottom left
            width = Math.abs(pixelX - pixelAnchorX); 
            height = Math.abs(pixelY - pixelAnchorY); 
            
            pixelAnchorY = pixelY; // shift the anchor point for the width and height be always positive
            pixelAnchorX = pixelX; // shift the anchor point for the width and height be always positive
        }else if(pixelX - pixelAnchorX > 0 && pixelY - pixelAnchorY > 0){ // top right
            width = Math.abs(pixelX - pixelAnchorX); 
            height = Math.abs(pixelY - pixelAnchorY);
        }else if(pixelX - pixelAnchorX < 0 && pixelY - pixelAnchorY > 0){ // top left
            width = Math.abs(pixelX - pixelAnchorX); 
            height = Math.abs(pixelY - pixelAnchorY);

            pixelAnchorX = pixelX; // shift the anchor point for the width and height be always positive
        }

        return {
            pixelAnchorX: pixelAnchorX,
            pixelAnchorY: pixelAnchorY,
            width: width,
            height: height
        }
    }

    // handles map interaction with the knot
    async interact(glContext: WebGL2RenderingContext, eventName: string, cursorPosition: number[] | null = null, brushingPivot: number[] | null = null, eventObject: any | null = null){

        if(!this._visible || !this._physicalLayer.supportInteraction(eventName)){return;}

        let mapGrammar = this._grammarInterpreter.getMap();
        let interaction = '';

        for(let i = 0; i < mapGrammar.knots.length; i++){
            if(mapGrammar.knots[i].id == this._id){
                interaction = mapGrammar.interactions[i];
                break;
            }
        }

        if(interaction == ''){return;}

        let plotsGrammar = this._grammarInterpreter.getPlots();
        let plotArrangements = [];

        for(const plot of plotsGrammar){
            if(plot.knots.includes(this._id)){
                plotArrangements.push(plot.arrangement);
            }
        }

        let embedFootInteraction = false;
        let highlightCellInteraction = false;
        let highlightBuildingInteraction = false;
        let embedSurfaceInteraction = false;
        let highlightTriangleObject = false;

        if(interaction == InteractionType.BRUSHING){
            highlightCellInteraction = true;

            if(plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)){
                embedSurfaceInteraction = true;
            }
        }

        if(interaction == InteractionType.PICKING){
            if(plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED)){
                embedFootInteraction = true;
            }

            if(plotArrangements.includes(PlotArrangementType.LINKED)){
                highlightBuildingInteraction = true;
                highlightTriangleObject = true;
            }

            if(plotArrangements.length == 0){
                highlightBuildingInteraction = true;
                highlightTriangleObject = true;
            }
        }

        // mouse down
        if(eventName == "left+ctrl" && cursorPosition != null){

            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.clearPicking();
                    if(highlightCellInteraction)
                        shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }

        }

        if(eventName == 'right-alt'){
            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.clearPicking();
                }
            }

            this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, null, null, true); // letting plots manager know that this knot was interacted with
        }

        // mouse move
        if(eventName == "left+drag+alt-brushing" && cursorPosition != null && highlightCellInteraction){
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }

        if(eventName == "left+drag+alt+brushing" && cursorPosition != null && brushingPivot != null){
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], brushingPivot[0], brushingPivot[1]);

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }

        if(eventName == "left+drag-alt+brushing" || eventName == "-drag-alt+brushing"){
            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking){
                    shader.applyBrushing();
                }
            }
        }

        if(eventName == "right+drag-brushingFilter" && cursorPosition != null){
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.updatePickFilterPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }

        if(eventName == "right+drag+brushingFilter" && cursorPosition != null && brushingPivot != null){
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], brushingPivot[0], brushingPivot[1]);

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                    shader.updatePickFilterPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }

        // mouse wheel
        if(eventName == "wheel+alt" && cursorPosition != null && embedFootInteraction){
            if(this._physicalLayer instanceof BuildingsLayer){ // TODO: generalize this
                this._physicalLayer.createFootprintPlot(this._map.glContext, cursorPosition[0], cursorPosition[1], true, this._shaders);
                this._map.render(); // TODO: get rid of the need to render the map
                await this._physicalLayer.updateFootprintPlot(this._map.glContext, this._map.grammarManager, -1, eventObject.deltaY * 0.02, 'vega', this._shaders);
            }
        }

        if(eventName == "Enter" && highlightCellInteraction && embedSurfaceInteraction){
            if(this._physicalLayer instanceof BuildingsLayer){ // TODO: generalize this
                await this._physicalLayer.applyTexSelectedCells(this._map.glContext, this._map.grammarManager, 'vega', this._shaders);
            }
        }

        if(eventName == "r"){
            if(this._physicalLayer instanceof BuildingsLayer){ // TODO: generalize this
                this._physicalLayer.clearAbsSurface(this._shaders);
            }
        }

        // keyUp
        if(eventName == "t"){
            if(highlightTriangleObject){

                //triangles layer interactions
                if(this._physicalLayer instanceof TrianglesLayer){ // TODO: generalize this
                    let currentPoint = this._map.mouse.currentPoint;
                    this._physicalLayer.highlightElement(this._map.glContext, currentPoint[0], currentPoint[1], this._shaders);
                }

                this._map.render();
                this._map.render();

                if(this._physicalLayer instanceof TrianglesLayer){ // TODO: generalize this
                    let objectId = this._physicalLayer.getIdLastHighlightedElement(this._shaders);
                    this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, LevelType.OBJECTS, objectId); // letting plots manager know that this knot was interacted with
                }
            }

            if(embedFootInteraction && cursorPosition != null){ // TODO: simplify this footprint plot application
                let elementsIndex = [];
    
                if(this._physicalLayer instanceof BuildingsLayer){
                    this._physicalLayer.createFootprintPlot(this._map.glContext, cursorPosition[0], cursorPosition[1], false, this._shaders);
                    this._map.render();
                    let buildingId = await this._physicalLayer.applyFootprintPlot(this._map.glContext, this._map.grammarManager, 1, 'vega', this._shaders);
                    elementsIndex.push(buildingId);
                }
                this._map.render();
            }

            if(highlightBuildingInteraction && cursorPosition != null){
                // call functions to highlight building
                
                if(this._physicalLayer instanceof BuildingsLayer){
                    this._physicalLayer.highlightBuilding(this._map.glContext, cursorPosition[0], cursorPosition[1], this._shaders);
                }

                // the two renderings are required
                this._map.render();
                this._map.render();
    
                if(this._physicalLayer instanceof BuildingsLayer){
                    let buildingId = this._physicalLayer.getIdLastHighlightedBuilding(this._shaders);
                    this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, LevelType.OBJECTS, buildingId); // letting plots manager know that this knot was interacted with
                }
            }

        }

        this._map.render(); 
    }   

}
/// <reference types="@types/webgl2" />

import { Shader } from './shader';
// import { Camera } from './camera';
import { Mesh } from "./mesh";

import { ILayerFeature, IMapStyle, IJoinedLayer, IJoinedObjects, IKnot, IJoinedJson } from './interfaces';
import { LayerType, RenderStyle, AggregationType, LevelType } from './constants';
import { AuxiliaryShader } from './auxiliaryShader';
import { LayerManager } from './layer-manager';

import { DataApi } from './data-api';

export abstract class Layer {
    // layer id
    protected _id: string;
    // layer type
    protected _type: LayerType;

    // style key used to color the layer
    protected _styleKey: keyof IMapStyle;

    // style key used to color the layer
    protected _colorMap: string;
    // style key used to color the layer
    protected _reverseColorMap: boolean;

    // render styles available
    protected _renderStyle: RenderStyle[];

    // store link information with other layers
    protected _joinedLayers: IJoinedLayer[];
    protected _joinedObjects: IJoinedObjects[];

    // is visible
    protected _visible: boolean;
    // is selectable
    protected _selectable: boolean;

    // layer's shader
    protected _shaders: (Shader|AuxiliaryShader)[] = [];
    // layer's camera
    protected _camera: any;

    protected _centroid: number[] | Float32Array;

    protected _mesh: Mesh;

    /**
     * 
     * @param {string} id The Mapview layer Identifier
     * @param {LayerType} type The type of the layer
     * @param {keyof IMapStyle} styleKey The layer key on the style definition
     * @param {string} colorMap 
     * @param {boolean} reverseColorMap 
     * @param {RenderStyle} renderStyle Available render styles 
     * @param {boolean} visible The initial visibility state 
     * @param {boolean} selectable The initial selectability state 
     * @param {IJoinedLayer[]} joinedLayers 
     * @param {IJoinedObjects[]} joinedObjects 
     * @param {number[]} centroid 
     * @param {number} dimension 
     * @param {number} zOrder 
     */
    constructor(id: string, type: LayerType, styleKey: keyof IMapStyle, colorMap: string, reverseColorMap: boolean, renderStyle: RenderStyle[] = [], visible = true, selectable = false, centroid:number[] | Float32Array = [0,0,0], dimension: number, zOrder: number) {
        this._id = id;
        this._type = type;
        this._styleKey = styleKey;
        this._colorMap = colorMap;
        this._reverseColorMap = reverseColorMap;
        this._renderStyle = renderStyle;

        this._visible = visible;
        this._selectable = selectable;

        this._centroid = centroid;

        this._mesh = new Mesh(dimension, zOrder);
    }

    setJoinedJson(joinedJson: IJoinedJson){
        this._joinedLayers = joinedJson.joinedLayers;
        this._joinedObjects = joinedJson.joinedObjects;
    }

    /**
     * Accessor for the layer id
     */
    get id(): string {
        return this._id;
    }

    /**
     * Accessor for the layer style
     */
    get style(): keyof IMapStyle {
        return this._styleKey;
    }

    /**
     * Returns if the layers is visible
     */
    get visible(): boolean {
        return this._visible;
    }

    /**
     * Sets the visibility
     */
    set visible(visible: boolean) {
        this._visible = visible;
    }

    /**
     * Returns if the layers is selectable
     */
    get selectable(): boolean {
        return this._selectable;
    }

    get joinedLayers(): IJoinedLayer[] {
        return this._joinedLayers;
    }

    get joinedObjects(): IJoinedObjects[] {
        return this._joinedObjects;
    }

    /**
     * Sets the selection
     */
    set selectable(selectable: boolean) {
        this._selectable = selectable;
    }

    /**
     * Sends the camera to the layer
     */
    set camera(camera: any) {
        this._camera = camera;
    }

    /**
     * Returns list of shaders
     */
    get shaders(): Shader[]{
        return this._shaders;
    }

    get mesh(): Mesh {
        return this._mesh;
    }

    set mesh(mesh: Mesh) {
        this._mesh = mesh;
    }

    get centroid(){
        return this._centroid;
    }

    /**
     * Data update signature
     */
    abstract updateFeatures(data: ILayerFeature[], knot: IKnot, layerManager: LayerManager): void;

    abstract updateMeshGeometry(data: ILayerFeature[]): void;

    abstract updateShaders(): void;

    abstract addMeshFunction(knot: IKnot, layerManager: LayerManager): void;

    /**
     * Function update signature
     * @param {ILayerFeature[]} data layer data
     * @param {string} cmap used color map
     */
    abstract updateFunction(data: ILayerFeature[], knot: IKnot, cmap?: string): void;

    /**
     * Layer style update signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    abstract updateStyle(glContext: WebGL2RenderingContext): void;

    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    abstract render(glContext: WebGL2RenderingContext): void;

    /**
     * Layer picking function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {number} x Mouse x coordinate
     * @param {number} y Mouse y coordinate
     * @param {number} anchorX Anchor point (for a brushing interaction for instace)
     * @param {number} anchorY Anchor point (for a brushing interaction for instace)
     */
    abstract pick(glContext: WebGL2RenderingContext, x: number, y: number, anchorX?: number, anchorY?: number): void;

    abstract pickFilter(glContext: WebGL2RenderingContext, x: number, y: number, anchorX?: number, anchorY?: number): void;

    /**
     * Clear picking picking function signature
     */
     abstract clearPicking(): void;

    /**
     * Shader load signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    abstract loadShaders(glContext: WebGL2RenderingContext): void;

    /**
     * Distributes the function values inside the layer according to its semantics so it can be rendered. (i.e. function values of coordinates in building cells are averaged)
     * This function is called as the last step of the rendering pipeline (after all the joins and aggregations with the abstract data)
     * @param functionValues function values per coordinate
     */
    abstract distributeFunctionValues(functionValues: number[] | null): number[] | null;

    /**
     * Aggregates the function values to a more coarse level 
     * @param functionValues function values per coordinate (but all the coordinates that compose a basic struct at the start level have the same values). If the start level is building, for instance, all coordinates of a specific building have the same value.
     * 
     */
    abstract innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, aggregation: AggregationType): number[] | null;

    /**
     * Given the id of an element that is in a specific level, returns the function value index that should be used to 
     * retrieve the representative function value of that element
     */
    abstract getFunctionValueIndexOfId(id: number, level: LevelType): number | null;

    abstract getCoordsByLevel(level: LevelType): number[][];

    abstract getFunctionByLevel(level: LevelType, knotId: string): number[][];

    abstract getHighlightsByLevel(level: LevelType): boolean[];

    /**
     * 
     * @param elements array of elements indices (follow the order they appear in the layer json file)
     */
    abstract setHighlightElements(elements: number[], level: LevelType, value: boolean): void;

    // bypass the data extraction from link and data directly into the mesh
    abstract directAddMeshFunction(functionValues: number[], knotId: string): void;

    abstract getSelectedFiltering(): number[] | null;

    protected _brushingAreaCalculation(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): {pixelAnchorX: number, pixelAnchorY: number, width: number, height: number}{
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

}

/// <reference types="@types/webgl2" />

import { Shader } from './shader';
// import { Camera } from './camera';
import { Mesh } from "./mesh";

import { ILayerFeature, IMapStyle, IJoinedLayer, IJoinedObjects, IKnot, IJoinedJson } from './interfaces';
import { LayerType, RenderStyle, AggregationType, LevelType } from './constants';
import { AuxiliaryShader } from './auxiliaryShader';
import { LayerManager } from './layer-manager';

export abstract class Layer {
    // layer id
    protected _id: string;
    // layer type
    protected _type: LayerType;

    // style key used to color the layer
    protected _styleKey: keyof IMapStyle;

    // style key used to color the layer
    // protected _colorMap: string;
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

    // layer's camera
    protected _camera: any;

    protected _centroid: number[] | Float32Array;

    protected _mesh: Mesh;

    constructor(id: string, type: LayerType, styleKey: keyof IMapStyle, reverseColorMap: boolean, renderStyle: RenderStyle[] = [], selectable = false, centroid:number[] | Float32Array = [0,0,0], dimension: number, zOrder: number) {
        this._id = id;
        this._type = type;
        this._styleKey = styleKey;
        // this._colorMap = colorMap;
        this._reverseColorMap = reverseColorMap;
        this._renderStyle = renderStyle;

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

    // get colorMap(){
    //     return this._colorMap;
    // }

    get reverseColorMap(){
        return this._reverseColorMap;
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

    get mesh(): Mesh {
        return this._mesh;
    }

    set mesh(mesh: Mesh) {
        this._mesh = mesh;
    }

    get centroid(){
        return this._centroid;
    }

    get renderStyle(){
        return this._renderStyle;
    }

    /**
     * Data update signature
     */
    // abstract updateFeatures(data: ILayerFeature[], knot: IKnot, layerManager: LayerManager): void;

    abstract updateMeshGeometry(data: ILayerFeature[]): void;

    abstract updateShaders(shaders: (Shader|AuxiliaryShader)[]): void;

    abstract updateFunction(knot: IKnot, shaders: (Shader|AuxiliaryShader)[]): void;

    abstract render(glContext: WebGL2RenderingContext, shaders: (Shader|AuxiliaryShader)[]): void;

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

    abstract getHighlightsByLevel(level: LevelType, shaders: (Shader|AuxiliaryShader)[]): boolean[];

    abstract supportInteraction(eventName: string): boolean;

    /**
     * 
     * @param elements array of elements indices (follow the order they appear in the layer json file)
     */
    abstract setHighlightElements(elements: number[], level: LevelType, value: boolean, shaders: (Shader|AuxiliaryShader)[]): void;

    // bypass the data extraction from link and data directly into the mesh
    abstract directAddMeshFunction(functionValues: number[], knotId: string): void;

    abstract getSelectedFiltering(shaders: (Shader|AuxiliaryShader)[]): number[] | null;
}

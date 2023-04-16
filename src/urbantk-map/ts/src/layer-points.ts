import { AggregationType, LevelType } from "./constants";
import { ILayerData, ILayerFeature, IKnot } from "./interfaces";
import { Layer } from "./layer";
import { LayerManager } from "./layer-manager";

export class PointsLayer extends Layer {

    constructor(info: ILayerData, dimensions: number = 2, order: number = 0, centroid: number[] | Float32Array) {
        super(
            info.id,
            info.type,
            info.styleKey,
            info.colorMap !== undefined ? info.colorMap : "interpolateReds",
            info.reverseColorMap !== undefined ? info.reverseColorMap : false,
            info.renderStyle !== undefined ? info.renderStyle : [],
            info.visible !== undefined ? info.visible : true,
            info.selectable !== undefined ? info.selectable : false,
            centroid,
            1,
            order
        );
    }

    loadShaders(glContext: WebGL2RenderingContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateFeatures(data: ILayerFeature[], knot: IKnot, layerManager: LayerManager): void {
        throw new Error("Method not implemented.");
    }
    updateMeshGeometry(data: ILayerFeature[]){
        throw new Error("Method not implemented.");
    }
    updateShaders(){
        throw new Error("Method not implemented.");

    }
    getSelectedFiltering(): number[] | null {
        throw Error("Filtering not supported for point layer");
    }

    pickFilter(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): void {
        throw Error("Filtering not supported for point layer");
    }
    addMeshFunction(knot: IKnot, layerManager: LayerManager){
        throw new Error("Method not implemented.");
    }
    directAddMeshFunction(functionValues: number[], knotId: string): void{
        throw new Error("Method not implemented.");
    }
    updateFunction(data: ILayerFeature[], knot: IKnot, cmap?: string): void {
        throw new Error("Method not implemented.");
    }
    updateStyle(glContext: WebGL2RenderingContext): void {
        throw new Error("Method not implemented.");
    }
    render(glContext: WebGL2RenderingContext): void {
        throw new Error("Method not implemented.");
    }
    setHighlightElements(elements: number[], level: LevelType, value: boolean): void {
        throw new Error("Method not implemented.");
    }
    pick(glContext: WebGL2RenderingContext, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    distributeFunctionValues(functionValues: number[] | null): number[] | null{
        throw new Error("Method not implemented.");
    }
    innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, aggregation: AggregationType): number[] | null {
        throw new Error("Method not implemented.");
    }
    getFunctionValueIndexOfId(id: number, level: LevelType): number | null {
        throw new Error("Method not implemented.");
    }
    getCoordsByLevel(level: LevelType): number[][] {
        throw new Error("Method not implemented.");
    }
    getFunctionByLevel(level: LevelType, knotId: string): number[][] {
        throw new Error("Method not implemented.");
    }
    clearPicking(){
        throw new Error("Method not implemented.");
    }
    getHighlightsByLevel(level: LevelType): boolean[] {
        throw new Error("Method not implemented.");
    }
}
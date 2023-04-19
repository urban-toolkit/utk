import { AggregationType, LevelType, RenderStyle } from "./constants";
import { ILayerData, ILayerFeature, IKnot } from "./interfaces";
import { Layer } from "./layer";
import { LayerManager } from "./layer-manager";
import { MapStyle } from "./map-style";
import { ShaderFlatColor } from "./shader-flatColor";
import { ShaderColorPoints } from "./shader-colorPoints";

export class PointsLayer extends Layer {

    // protected _zOrder: number;
    protected _coordsByCOORDINATES3D: number[][] = [];

    constructor(info: ILayerData, zOrder: number = 0, centroid: number[] | Float32Array) {
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
            3,
            zOrder
        );

        // this._zOrder = zOrder;

    }

    loadShaders(glContext: WebGL2RenderingContext): void {
        this._shaders = [];
        const color = MapStyle.getColor(this._styleKey);

        const cmap = this._colorMap;
        const revs = this._reverseColorMap;

        for (const type of this._renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    throw Error("FLAT_COLOR not supported for point cloud layer");
                break;
                case RenderStyle.FLAT_COLOR_MAP:
                    throw Error("FLAT_COLOR_MAP not supported for point cloud layer");
                break;
                case RenderStyle.SMOOTH_COLOR:
                    throw Error("SMOOTH_COLOR not supported for point cloud layer");
                break;
                case RenderStyle.SMOOTH_COLOR_MAP:
                    throw Error("SMOOTH_COLOR_MAP not supported for point cloud layer");
                break;
                case RenderStyle.SMOOTH_COLOR_MAP_TEX:
                    throw Error("SMOOTH_COLOR_MAP_TEX not supported for point cloud layer");
                break;
                case RenderStyle.PICKING: // The picking is associated, by default, with the previous shader in this._renderStyle
                    throw Error("PICKING not supported for point cloud layer");
                break;
                case RenderStyle.ABSTRACT_SURFACES:
                    throw Error("ABSTRACT_SURFACES not supported for point cloud layer");
                break;
                case RenderStyle.COLOR_POINTS:
                    shader = new ShaderColorPoints(glContext, cmap);
                break;
                default:
                    shader = new ShaderFlatColor(glContext, color);
                break;
            }
            this._shaders.push(shader);

            // load message
            console.log("------------------------------------------------------");
            console.log(`Layer ${this._id} of type ${this._type}.`);
            console.log(`Render styles: ${this._renderStyle.join(", ")}`);
            console.log(`Successfully loaded ${this._shaders.length} shader(s).`);
            console.log("------------------------------------------------------");
        }
    }

    updateFeatures(data: ILayerFeature[], knot: IKnot, layerManager: LayerManager): void {
        this.updateMeshGeometry(data);
        
        this.addMeshFunction(knot, layerManager);

        this.updateShaders();
    }

    updateMeshGeometry(data: ILayerFeature[]){
        this._mesh.load(data, false, this._centroid);
    }

    updateShaders(){
        // updates the shader references
        for (const shader of this._shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    getSelectedFiltering(): number[] | null {
        throw Error("Filtering not supported for point layer");
    }

    pickFilter(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): void {
        throw Error("Filtering not supported for point layer");
    }

    addMeshFunction(knot: IKnot, layerManager: LayerManager){
        let functionValues: number[] | null = null;
        
        if(knot.linkingScheme != null && knot.aggregationScheme != null){
            functionValues = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme)
        }

        let distributedValues = this.distributeFunctionValues(functionValues);

        this._mesh.loadFunctionData(distributedValues, knot.id);
    }

    directAddMeshFunction(functionValues: number[], knotId: string): void{
        let distributedValues = this.distributeFunctionValues(functionValues);

        this._mesh.loadFunctionData(distributedValues, knotId);
    }

    updateFunction(data: ILayerFeature[], knot: IKnot, cmap?: string): void {
        // updates the shader references
        for (const shader of this._shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }

    updateStyle(glContext: WebGL2RenderingContext): void {
        const color = MapStyle.getColor(this.style);
        
        let id = this._renderStyle.indexOf(RenderStyle.FLAT_COLOR)
        if ( id >= 0 ) { this._shaders[id].updateShaderUniforms(color); }
    }

    render(glContext: WebGL2RenderingContext): void {
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);

        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);

        // enables stencil
        // glContext.enable(glContext.STENCIL_TEST);

        // the abs surfaces are loaded first to update the stencil
        for (const shader of this._shaders) {
            shader.renderPass(glContext, glContext.POINTS, this._camera, this._mesh, -1);
        }

        // disables stencil
        // glContext.disable(glContext.STENCIL_TEST);

        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }

    setHighlightElements(elements: number[], level: LevelType, value: boolean): void {
        throw new Error("Method not implemented.");
    }

    pick(glContext: WebGL2RenderingContext, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    distributeFunctionValues(functionValues: number[] | null): number[] | null{
        return functionValues;
    }
    innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, aggregation: AggregationType): number[] | null {
        throw new Error("Method not implemented.");
    }
    getFunctionValueIndexOfId(id: number, level: LevelType): number | null {
        throw new Error("Method not implemented.");
    }
    getCoordsByLevel(level: LevelType): number[][] {
        let coordByLevel: number[][] = [];

        if(level == LevelType.COORDINATES){
            throw Error("Cannot get COORDINATES attached to the layer because it does not have a 2D representation");            
        }

        if(level == LevelType.COORDINATES3D){

            if(this._coordsByCOORDINATES3D.length == 0){
                let coords = this._mesh.getCoordinatesVBO();
    
                for(let i = 0; i < coords.length/3; i++){
                    coordByLevel.push([coords[i*3],coords[i*3+1],coords[i*3+2]]);
                }

                this._coordsByCOORDINATES3D = coordByLevel;
            }else{
                coordByLevel = this._coordsByCOORDINATES3D
            }

        }

        if(level == LevelType.OBJECTS){
            throw Error("Cannot get OBJECTS attached to the layer because it does not have a 2D representation");            
        }

        return coordByLevel;
    }
    getFunctionByLevel(level: LevelType, knotId: string): number[][] {
        let functionByLevel: number[][] = [];

        if(level == LevelType.COORDINATES){
            throw Error("Cannot get abstract information attached to COORDINATES because the layer does not have a 2D representation");            
        }

        if(level == LevelType.COORDINATES3D){

            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x])

            functionByLevel = functionValues; 
        }

        if(level == LevelType.OBJECTS){
            throw Error("Cannot get abstract information attached to OBJECTS because the layer does not have a 2D representation");            
        }

        return functionByLevel;  
    }

    clearPicking(){
        throw new Error("Method not implemented.");
    }
    getHighlightsByLevel(level: LevelType): boolean[] {
        throw new Error("Method not implemented.");
    }
}
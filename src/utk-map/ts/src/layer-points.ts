import { AggregationType, LevelType, RenderStyle } from "./constants";
import { ILayerData, ILayerFeature, IKnot } from "./interfaces";
import { Layer } from "./layer";
import { ShaderFlatColor } from "./shader-flatColor";
import { Shader } from "./shader";
import { AuxiliaryShader } from "./auxiliaryShader";
import { ShaderFlatColorMap } from "./shader-flatColorMap";
import { ShaderSmoothColor } from "./shader-smoothColor";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderSmoothColorMapTex } from "./shader-smoothColorMapTex";
import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";
import { ShaderAbstractSurface } from "./shader-abstractSurface";

export class PointsLayer extends Layer {

    // protected _zOrder: number;
    protected _coordsByCOORDINATES3D: number[][] = [];

    constructor(info: ILayerData, zOrder: number = 0, centroid: number[] | Float32Array) {
        super(
            info.id,
            info.type,
            info.styleKey,
            info.reverseColorMap !== undefined ? info.reverseColorMap : false,
            info.renderStyle !== undefined ? info.renderStyle : [],
            info.selectable !== undefined ? info.selectable : false,
            centroid,
            3,
            zOrder
        );

        // this._zOrder = zOrder;

    }

    supportInteraction(eventName: string): boolean {
        return true;
    }

    updateMeshGeometry(data: ILayerFeature[]){
        this._mesh.load(data, false, this._centroid);
    }

    updateShaders(shaders: (Shader|AuxiliaryShader)[]){
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    
    getSelectedFiltering(): number[] | null {
        throw Error("Filtering not supported for point layer");
    }

    directAddMeshFunction(functionValues: number[], knotId: string): void{
        let distributedValues = this.distributeFunctionValues(functionValues);

        this._mesh.loadFunctionData(distributedValues, knotId);
    }

    updateFunction(knot: IKnot, shaders: (Shader|AuxiliaryShader)[]): void {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }

    render(glContext: WebGL2RenderingContext, shaders: (Shader|AuxiliaryShader)[]): void {

        for (const shader of shaders){
            if(shader instanceof ShaderFlatColor){
                throw Error("FLAT_COLOR not supported for point cloud layer");
            }

            if(shader instanceof ShaderFlatColorMap){
                throw Error("FLAT_COLOR_MAP not supported for point cloud layer");
            }

            if(shader instanceof ShaderSmoothColor){
                throw Error("SMOOTH_COLOR not supported for point cloud layer");
            }

            if(shader instanceof ShaderSmoothColorMap){
                throw Error("SMOOTH_COLOR_MAP not supported for point cloud layer");
            }

            if(shader instanceof ShaderSmoothColorMapTex){
                throw Error("SMOOTH_COLOR_MAP_TEX not supported for point cloud layer");
            }

            if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                throw Error("PICKING not supported for point cloud layer");
            }

            if(shader instanceof ShaderAbstractSurface){
                throw Error("ABSTRACT_SURFACES not supported for point cloud layer");
            }
        }


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
        for (const shader of shaders) {
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

    getHighlightsByLevel(level: LevelType): boolean[] {
        throw new Error("Method not implemented.");
    }
}
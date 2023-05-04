import { OperationType, LevelType } from "./constants";
import { ILayerData, ILayerFeature, IKnot } from "./interfaces";
import { Layer } from "./layer";
import { Shader } from "./shader";
import { AuxiliaryShader } from "./auxiliaryShader";
import { ShaderFlatColorMap } from "./shader-flatColorMap";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderSmoothColorMapTex } from "./shader-smoothColorMapTex";
import { ShaderPicking } from "./shader-picking";
import { ShaderPickingTriangles } from "./shader-picking-triangles";
import { ShaderAbstractSurface } from "./shader-abstractSurface";

export class LinesLayer extends Layer {

    // protected _mesh: Mesh;
    protected _zOrder: number;
    protected _coordsByCOORDINATES: number[][] = [];
    protected _coordsByCOORDINATES3D: number[][] = [];
    protected _coordsByOBJECTS: number[][] = [];

    protected _highlightByCOORDINATES: boolean[][] = [];
    protected _highlightByCOORDINATES3D: boolean[][] = [];
    protected _highlightByOBJECTS: boolean[][] = [];

    constructor(info: ILayerData, dimensions: number = 2, order: number = 0, centroid: number[] | Float32Array, geometryData: ILayerFeature[]) {
        super(
            info.id,
            info.type,
            info.styleKey,
            info.renderStyle !== undefined ? info.renderStyle : [],
            centroid,
            dimensions,
            order
        );

        this.updateMeshGeometry(geometryData);

        // this._mesh = new Mesh(dimensions, order);
        this._zOrder = order;
    }

    supportInteraction(eventName: string): boolean {
        return true;
    }

    updateMeshGeometry(data: ILayerFeature[]){
        this._mesh.load(data, false, this._centroid);
    }

    getSelectedFiltering(): number[] | null {
        throw Error("Filtering not supported for line layer");
    }
    
    updateShaders(shaders: (Shader|AuxiliaryShader)[]){
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
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

    distributeFunctionValues(functionValues: number[] | null): number[] | null{
        return functionValues;
    }

    innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, operation: OperationType): number[] | null {
        throw new Error("The layer lines only have the COORDINATES level, so no INNERAGG is possible");
    }

    setHighlightElements(elements: number[], level: LevelType, value: boolean): void{
        throw new Error("Element highlighting not support for line layer yet");
    }

    getFunctionValueIndexOfId(id: number, level: LevelType): number | null {
        if(level == LevelType.COORDINATES3D){
            throw new Error("COORDINATES3D level is not supported for layer lines");
        }

        if(level == LevelType.COORDINATES){
            return id;
        }

        if(level == LevelType.OBJECTS){
            let readCoords = 0;

            let coordsPerComp = this._mesh.getCoordsPerComp();

            for(let i = 0; i < coordsPerComp.length; i++){

                if(i == id){ // assumes that all coordinates of the same object have the same function value
                    return readCoords;
                }

                readCoords += coordsPerComp[i];
            }
        }

        return null;
    }

    getCoordsByLevel(level: LevelType): number[][] {
        let coordByLevel: number[][] = [];

        if(level == LevelType.COORDINATES3D){
            throw Error("Cannot get COORDINATES3D attached to line layer because it does not have a 3D representation");            
        }

        if(level == LevelType.COORDINATES){

            if(this._coordsByCOORDINATES.length == 0){
                let coords = this._mesh.getCoordinatesVBO();

                for(let i = 0; i < coords.length/3; i++){
                    coordByLevel.push([coords[i*3],coords[i*3+1],coords[i*3+2]]);
                }

                this._coordsByCOORDINATES = coordByLevel;
            }else{
                coordByLevel = this._coordsByCOORDINATES;
            }

        }

        if(level == LevelType.OBJECTS){
            if(this._coordsByOBJECTS.length == 0){

                let coords = this._mesh.getCoordinatesVBO();

                let readCoords = 0;
                
                let coordsPerComp = this._mesh.getCoordsPerComp();

                for(const numCoords of coordsPerComp){
                    let groupedCoords = [];

                    for(let i = 0; i < numCoords; i++){
                        groupedCoords.push(coords[i*3+(readCoords*3)]);
                        groupedCoords.push(coords[i*3+1+(readCoords*3)]);
                        groupedCoords.push(coords[i*3+2+(readCoords*3)]);
                    }

                    readCoords += numCoords;
                    coordByLevel.push(groupedCoords);
                }

                this._coordsByOBJECTS = coordByLevel;

            }else{
                coordByLevel = this._coordsByOBJECTS;
            }
        }

        return coordByLevel;
    }

    getFunctionByLevel(level: LevelType, knotId: string): number[][] {
        let functionByLevel: number[][] = [];

        if(level == LevelType.COORDINATES3D){
            throw Error("It is not possible to get abstract data from COORDINATES3D level in the line layer");;            
        }

        if(level == LevelType.COORDINATES){

            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x])  // TODO: give support to more then one timestamps

            functionByLevel = functionValues; 

        }

        if(level == LevelType.OBJECTS){

            let functionValues = this._mesh.getFunctionVBO(knotId)[0];

            let readFunctions = 0;
            
            let coordsPerComp = this._mesh.getCoordsPerComp();

            for(const numCoords of coordsPerComp){
                let groupedFunctions = [];

                for(let i = 0; i < numCoords; i++){
                    groupedFunctions.push(functionValues[i+readFunctions]);
                }

                readFunctions += numCoords;
                functionByLevel.push(groupedFunctions);
            }

        }

        return functionByLevel;  
    }

    getHighlightsByLevel(level: LevelType): boolean[] {
        let booleanHighlights: boolean[] = [];
        let highlightsByLevel: boolean[][] = [];

        if(level == LevelType.COORDINATES3D){
            throw Error("It is not possible to highlight COORDINATES3D in the line layer");
        }

        let totalNumberOfCoords = this._mesh.getTotalNumberOfCoords();

        for(let i = 0; i < totalNumberOfCoords; i++){
            booleanHighlights.push(false);
        }

        if(level == LevelType.COORDINATES){
            if(this._highlightByCOORDINATES.length == 0){
                highlightsByLevel = booleanHighlights.map(x => [x]);

                this._highlightByCOORDINATES = highlightsByLevel;
            }else{
                highlightsByLevel = this._highlightByCOORDINATES;
            }

        }

        if(level == LevelType.OBJECTS){
            if(this._highlightByOBJECTS.length == 0){
                let readHighlights = 0;
                
                let coordsPerComp = this._mesh.getCoordsPerComp();

                for(const numCoords of coordsPerComp){
                    let groupedHighlights = [];
    
                    for(let i = 0; i < numCoords; i++){
                        groupedHighlights.push(booleanHighlights[i+readHighlights]);
                    }
    
                    readHighlights += numCoords;
                    highlightsByLevel.push(groupedHighlights);
                }

                this._highlightByOBJECTS = highlightsByLevel;
            }else{
                highlightsByLevel = this._highlightByOBJECTS;
            }

        }

        let flattenedHighlights: boolean[] = [];

        // flattening the highlight data
        for(const elemHighlights of highlightsByLevel){
            let allHighlighted = true;

            for(const value of elemHighlights){
                if(!value){
                    allHighlighted = false;
                }
            }

            if(allHighlighted) // all the coordinates of the element must be highlighted for it to be considered highlighted
                flattenedHighlights.push(true)
            else
                flattenedHighlights.push(false)

        }

        return flattenedHighlights;
    }

    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext: WebGL2RenderingContext, shaders: (Shader|AuxiliaryShader)[]): void {
       
        for (const shader of shaders){
            if(shader instanceof ShaderFlatColorMap){
                throw new Error("FLAT_COLOR_MAP is not suitable for line layers");
            }

            if(shader instanceof ShaderSmoothColorMap){
                throw new Error("SMOOTH_COLOR_MAP is not suitable for line layers");
            }

            if(shader instanceof ShaderSmoothColorMapTex){
                throw new Error("SMOOTH_COLOR_MAP_TEX is not suitable for line layers");
            }

            if(shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles){
                throw new Error("PICKING is not suitable for line layers");
            }

            if(shader instanceof ShaderAbstractSurface){
                throw new Error("ABSTRACT_SURFACES is not suitable for line layers");
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
        glContext.enable(glContext.STENCIL_TEST);

        for (const shader of shaders) {
            shader.renderPass(glContext, glContext.LINE_STRIP, this._camera, this._mesh, this._zOrder);
        }

        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }

}
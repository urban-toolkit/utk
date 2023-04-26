import { AggregationType, LevelType } from "./constants";
import { ILayerData, ILayerFeature, IKnot } from "./interfaces";

import { Layer } from "./layer";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderPickingTriangles } from "./shader-picking-triangles";
import { ShaderAbstractSurface } from "./shader-abstractSurface";
import { AuxiliaryShader } from "./auxiliaryShader";
import { Shader } from "./shader";

export class TrianglesLayer extends Layer {
    // protected _mesh: Mesh;
    protected _zOrder: number;
    protected _dimensions: number;
    protected _coordsByCOORDINATES: number[][] = [];
    protected _coordsByCOORDINATES3D: number[][] = [];
    protected _coordsByOBJECTS: number[][] = [];

    protected _highlightByCOORDINATES: boolean[][] = [];
    protected _highlightByCOORDINATES3D: boolean[][] = [];
    protected _highlightByOBJECTS: boolean[][] = [];

    constructor(info: ILayerData, dimensions: number = 2, zOrder: number = 0, centroid: number[] | Float32Array) {
        super(
            info.id,
            info.type,
            info.styleKey,
            info.reverseColorMap !== undefined ? info.reverseColorMap : false,
            info.renderStyle !== undefined ? info.renderStyle : [],
            info.selectable !== undefined ? info.selectable : false,
            centroid,
            dimensions,
            zOrder
        );
        
        this._zOrder = zOrder;
        this._dimensions = dimensions;
    }

    supportInteraction(eventName: string): boolean {
        return true;
    }

    updateMeshGeometry(data: ILayerFeature[]){
        // loads the data
        this._mesh.load(data, false, this._centroid);
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

    setHighlightElements(elements: number[], level: LevelType, value: boolean, shaders: (Shader|AuxiliaryShader)[]): void{

        let coords = this.getCoordsByLevel(level);
        
        for(let i = 0; i < elements.length; i++){
            let offsetCoords = 0;
            let coordsIndex = [];
            let elementIndex = elements[i];

            for(let j = 0; j < elementIndex; j++){
                offsetCoords += (coords[j].length)/this._dimensions;
            }

            for(let k = 0; k < (coords[elementIndex].length)/this._dimensions; k++){
                coordsIndex.push(offsetCoords+k);
            }

            for(const shader of shaders){
                if(shader instanceof ShaderPickingTriangles){
                    shader.setHighlightElements(coordsIndex, value);
                }
            }

        }
    }

    getSelectedFiltering(shaders: (Shader|AuxiliaryShader)[]): number[] | null {
        for(const shader of shaders){
            if(shader instanceof ShaderPickingTriangles){
                return shader.getBboxFiltered(this._mesh);
            }
        }

        return null;
    }

    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext: WebGL2RenderingContext, shaders: (Shader|AuxiliaryShader)[]): void {

        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);

        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);

        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);

        // the abs surfaces are loaded first to update the stencil
        for (const shader of shaders) {
            if(shader instanceof ShaderAbstractSurface){
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }

        for (const shader of shaders) {
            if(shader instanceof ShaderAbstractSurface){
                continue;
            }else{
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }

        // // clear stencil
        // glContext.clearStencil(0);
        // glContext.clear(glContext.STENCIL_BUFFER_BIT);

        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }

    highlightElement(glContext: WebGL2RenderingContext, x: number, y: number, shaders: (Shader|AuxiliaryShader)[]){
        if(!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)){
            return;
        }

        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;

        for(const shader of shaders){
            if(shader instanceof ShaderPickingTriangles){
                shader.updatePickObjectPosition(pixelX, pixelY);
            }
        }
    }

    getIdLastHighlightedElement(shaders: (Shader|AuxiliaryShader)[]){
        for(const shader of shaders){
            if(shader instanceof ShaderSmoothColorMap){
                return shader.currentPickedElement;
            }
        }
    }

    distributeFunctionValues(functionValues: number[] | null): number[] | null{
        return functionValues;
    }

    innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, aggregation: AggregationType): number[] | null {
        if(startLevel == LevelType.COORDINATES && this._dimensions != 2){
            throw new Error('The start level is COORDINATES but the dimensions of the layer is not 2 (COORDINATES are 2D)');
        }

        if(startLevel == LevelType.COORDINATES3D && this._dimensions != 3){
            // TODO: maybe there could have support for two representations of coordinates for the triangle layer
            throw new Error('The start level is COORDINATES but the dimensions of the layer is not 3 (COORDINATES3D are 3D)');
        }

        if(endLevel != LevelType.OBJECTS || startLevel == LevelType.OBJECTS){
            throw new Error('Only aggregations that end in the Object level are currently supported for the triangle layer');
        }  

        if(functionValues == null)
            return null;

        let coordsPerComp = this._mesh.getCoordsPerComp(); // components in the triangle layer can be any set of coordinates semantically grouped (i.e a whole zip code in a zip code layer)

        let acc_functions_per_object = new Array(coordsPerComp.length).fill(null);

        let readCoords = 0;

        for(const numberCoords of coordsPerComp){
            for(let i = 0; i < numberCoords; i++){
                if(acc_functions_per_object[i] == null){
                    acc_functions_per_object[i] = [functionValues[i+readCoords]];
                }
            }
            readCoords += numberCoords;
        }

        for(let i = 0; i < acc_functions_per_object.length; i++){
            if(aggregation == AggregationType.MAX){
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((a: any, b: any) => Math.max(a, b), -Infinity);
            }else if(aggregation == AggregationType.MIN){
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((a: any, b: any) => Math.min(a, b), Infinity);
            }else if(aggregation == AggregationType.AVG){
                let sum = acc_functions_per_object[i].reduce((partialSum: number, value: number) => partialSum + value, 0);
                acc_functions_per_object[i] = sum/acc_functions_per_object[i].length;
            }else if(aggregation == AggregationType.SUM){
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((partialSum: number, value: number) => partialSum + value, 0);
            }else if(aggregation == AggregationType.COUNT){
                acc_functions_per_object[i] = acc_functions_per_object[i].length;
            }else if(aggregation == AggregationType.DISCARD){ // keep the first element of the join
                acc_functions_per_object[i] = acc_functions_per_object[i][0];
            }else if(aggregation == AggregationType.NONE){
                throw new Error('NONE aggregation cannot be used with the predicate INNERAGG in the triangle layer');
            }
        }

        readCoords = 0;

        for(let i = 0; i < acc_functions_per_object.length; i++){
            for(let j = 0; j < coordsPerComp[i]; j++){
                functionValues[j+readCoords] = acc_functions_per_object[i];
            }

            readCoords += coordsPerComp[i];
        }

        return functionValues;
    }

    getFunctionValueIndexOfId(id: number, level: LevelType): number | null {
        if(level == LevelType.COORDINATES){
            if(this._dimensions != 2){
                throw Error("The level specified is COORDINATES but the triangle layer does not have 2 dimensions");
            }

            return id;
        }   

        if(level == LevelType.COORDINATES3D){
            if(this._dimensions != 3){
                throw Error("The level specified is COORDINATES3D but the triangle layer does not have 3 dimensions");
            }

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

    /**
     * 
     * @returns each position of the array contains an element of that level
     */
    getCoordsByLevel(level: LevelType): number[][] {
        let coordByLevel: number[][] = [];

        if(level == LevelType.COORDINATES){
            if(this._dimensions != 2){
                throw Error("Cannot get COORDINATES attached to the layer because it does not have a 2D representation");            
            }

            if(this._coordsByCOORDINATES.length == 0){
                let coords = this._mesh.getCoordinatesVBO();
    
                for(let i = 0; i < coords.length/2; i++){
                    coordByLevel.push([coords[i*2],coords[i*2+1], 0]);
                }

                this._coordsByCOORDINATES = coordByLevel;
            }else{
                coordByLevel = this._coordsByCOORDINATES
            }

        }

        if(level == LevelType.COORDINATES3D){
            if(this._dimensions != 3){
                throw Error("Cannot get COORDINATES3D attached to the layer because it does not have a 3D representation");            
            }

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

            if(this._coordsByOBJECTS.length == 0){
                
                let coords = this._mesh.getCoordinatesVBO();
    
                let readCoords = 0;
                
                let coordsPerComp = this._mesh.getCoordsPerComp();

                for(const numCoords of coordsPerComp){
                    let groupedCoords = [];
    
                    for(let i = 0; i < numCoords; i++){
                        groupedCoords.push(coords[(i*3)+(readCoords*3)]);
                        groupedCoords.push(coords[(i*3)+1+(readCoords*3)]);
                        groupedCoords.push(coords[(i*3)+2+(readCoords*3)]);
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

        if(level == LevelType.COORDINATES){
            if(this._dimensions != 2){
                throw Error("Cannot get abstract information attached to COORDINATES because the layer does not have a 2D representation");            
            }

            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x])

            functionByLevel = functionValues;
 
        }

        if(level == LevelType.COORDINATES3D){
            if(this._dimensions != 3){
                throw Error("Cannot get abstract information attached to COORDINATES3D because the layer does not have a 3D representation");            
            }

            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x])

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

        let totalNumberOfCoords = this._mesh.getTotalNumberOfCoords();

        for(let i = 0; i < totalNumberOfCoords; i++){
            booleanHighlights.push(false);
        }

        if(level == LevelType.COORDINATES){
            if(this._dimensions != 2){
                throw Error("Cannot get highlight information related to COORDINATES because the layer does not have a 2D representation");            
            }

            if(this._highlightByCOORDINATES.length == 0){
                highlightsByLevel = booleanHighlights.map(x => [x])

                this._highlightByCOORDINATES = highlightsByLevel;
            }else{
                highlightsByLevel = this._highlightByCOORDINATES;
            }

        }

        if(level == LevelType.COORDINATES3D){
            if(this._dimensions != 3){
                throw Error("Cannot get highlight information related to COORDINATES3D because the layer does not have a 3D representation");            
            }

            if(this._highlightByCOORDINATES3D.length == 0){
                highlightsByLevel = booleanHighlights.map(x => [x])

                this._highlightByCOORDINATES3D = highlightsByLevel;
            }else{
                highlightsByLevel = this._highlightByCOORDINATES3D;
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

}
import { RenderStyle, AggregationType, LevelType } from "./constants";
import { IKnot, ILayerData, ILayerFeature } from "./interfaces";

import { Layer } from "./layer";
import { MapStyle } from "./map-style";
import { ShaderFlatColor } from "./shader-flatColor";
import { ShaderFlatColorMap } from "./shader-flatColorMap";
import { ShaderSmoothColor } from "./shader-smoothColor";
import { ShaderSmoothColorMap } from "./shader-smoothColorMap";
import { ShaderSmoothColorMapTex } from "./shader-smoothColorMapTex";
import { ShaderAbstractSurface } from "./shader-abstractSurface";
import { ShaderPicking } from "./shader-picking";
import { ShaderOutline } from "./shader-outline";
import { AuxiliaryShader } from "./auxiliaryShader";
import { LayerManager } from "./layer-manager";

export class BuildingsLayer extends Layer {
    protected _zOrder: number;
    protected _coordsByCOORDINATES: number[][] = [];
    protected _coordsByCOORDINATES3D: number[][] = [];
    protected _coordsByOBJECTS: number[][] = [];

    protected _highlightByCOORDINATES: boolean[][] = [];
    protected _highlightByCOORDINATES3D: boolean[][] = [];
    protected _highlightByOBJECTS: boolean[][] = [];

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
            zOrder // TODO: set correct zOrder
        );

        this._zOrder = zOrder;
        // this._zOrder = 10; // TODO: set correct zOrder

    }

    /**
     * Data update signature
     * @param {ILayerFeature[]} data layer data
     */
     updateFeatures(data: ILayerFeature[], knot: IKnot, layerManager: LayerManager): void {
         
        this.updateMeshGeometry(data);
        
        this.addMeshFunction(knot, layerManager);

        this.updateShaders();
    }

    updateMeshGeometry(data: ILayerFeature[]){
        // loads the data
        this._mesh.load(data, false, this._centroid);
    }

    updateShaders(){
        // updates the shader references
        for (const shader of this._shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }

    addMeshFunction(knot: IKnot, layerManager: LayerManager){
        let functionValues: number[] | null = null;
        
        if(knot.linkingScheme != null && knot.aggregationScheme != null){
            functionValues = layerManager.getAbstractDataFromLink(knot.linkingScheme, knot.aggregationScheme)
        }
        
        let distributedValues = this.distributeFunctionValues(functionValues);

        this._mesh.loadFunctionData(distributedValues, knot.id);
    }

    // bypass the data extraction from link and injects it directly
    directAddMeshFunction(functionValues: number[], knotId: string){
        
        let distributedValues = this.distributeFunctionValues(functionValues);

        this._mesh.loadFunctionData(distributedValues, knotId);
    }

    /**
     * Function update signature
     * @param {ILayerFeature[]} data layer data
     * @param {ColorMapType} cmap used color map
     */
     updateFunction(data: ILayerFeature[], knot: IKnot, cmap?: string): void {

        // updates the shader references
        for (const shader of this._shaders) {
            shader.updateShaderData(this._mesh, knot);
        }

    }

    /**
     * Layer style update signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
     updateStyle(glContext: WebGL2RenderingContext): void {
        const color = MapStyle.getColor(this.style);
        
        let id = this._renderStyle.indexOf(RenderStyle.FLAT_COLOR)
        if ( id >= 0 ) { this._shaders[id].updateShaderUniforms(color); }
    }

    setHighlightElements(elements: number[], level: LevelType, value: boolean): void{

        let coords = this.getCoordsByLevel(level);
        
        for(let i = 0; i < elements.length; i++){
            let offsetCoords = 0;
            let coordsIndex = [];
            let elementIndex = elements[i];

            for(let j = 0; j < elementIndex; j++){
                offsetCoords += (coords[j].length)/3;
            }

            for(let k = 0; k < (coords[elementIndex].length)/3; k++){
                coordsIndex.push(offsetCoords+k);
            }

            for(const shader of this._shaders){
                if(shader instanceof ShaderPicking){
                    shader.setHighlightElements(coordsIndex, value);
                }
            }

        }

    }

    getSelectedFiltering(): number[] | null {
        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                return shader.getBboxFiltered(this._mesh);
            }
        }

        return null;
    }

    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext: WebGL2RenderingContext): void {
        
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);

        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);

        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);

        // clear stencil
        glContext.clearStencil(0);
        glContext.clear(glContext.STENCIL_BUFFER_BIT);

        // the abs surfaces are loaded first to update the stencil
        for (const shader of this._shaders) {
            if(shader instanceof ShaderAbstractSurface){
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }

        for (const shader of this._shaders) {
            if(shader instanceof ShaderAbstractSurface || shader instanceof ShaderOutline){
                continue;
            }else{
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        
        // for (const shader of this._shaders) {
        //     if(shader instanceof ShaderOutline){
        //         shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
        //     }
        // }
        
        // clear stencil
        // glContext.clearStencil(0);
        // glContext.clear(glContext.STENCIL_BUFFER_BIT);

        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }

    pick(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): void {
        let result = this._brushingAreaCalculation(glContext, x, y, anchorX, anchorY);

        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
            }
        }

    }

    pickFilter(glContext: WebGL2RenderingContext, x: number, y: number, anchorX: number, anchorY: number): void {
        let result = this._brushingAreaCalculation(glContext, x, y, anchorX, anchorY);
        
        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.updatePickFilterPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
            }
        }
    }

    applyBrushing(){
        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.applyBrushing();
            }
        }
    }

    clearPicking(){
        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.clearPicking();
            }
        }
    }

    async applyTexSelectedCells(glContext: WebGL2RenderingContext, spec: any, specType: string){

        for(const shader of this._shaders){
            if(shader instanceof ShaderSmoothColorMapTex){
                let meshAbsSurfaces = await shader.applyTexSelectedCells(this._camera, spec, specType);
                
                if(meshAbsSurfaces != undefined){
                    for(const secondShader of this._shaders){
                        if(secondShader instanceof ShaderAbstractSurface && meshAbsSurfaces){
                            if(!meshAbsSurfaces.code){
                                meshAbsSurfaces.code = -1;
                            }
    
                            secondShader.addSurface(glContext, meshAbsSurfaces.image, meshAbsSurfaces.coords, meshAbsSurfaces.indices, meshAbsSurfaces.functionValues, "abs", meshAbsSurfaces.code);
                        }   
                    }
                }

            }
        }
    }

    clearAbsSurface(){
        for(const shader of this._shaders){
            if(shader instanceof ShaderAbstractSurface){
                shader.clearSurfaces();
            }

            if(shader instanceof ShaderSmoothColorMapTex){
                shader.clearSurfaces();
            }
        }
    }

    createFootprintPlot(glContext: WebGL2RenderingContext, x: number, y: number, update: boolean){
        
        if(!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)){
            return;
        }

        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        
        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.updateFootPosition(pixelX, pixelY, update);
            }
        }

    }

    async applyFootprintPlot(glContext: WebGL2RenderingContext, spec: any, plotNumber: number, specType: string){
        const startTime: any = new Date();
        
        let buildingId: number = -1;

        for(const shader of this._shaders){
            if(shader instanceof ShaderSmoothColorMapTex){
                let footPrintMesh = await shader.applyFootprintPlot(spec, false, plotNumber, 0, specType);

                buildingId = shader.currentFootPrintBuildingId;

                if(!footPrintMesh)
                    return

                if(footPrintMesh.coords.length == 0){ // the mesh could not be created
                    continue;
                }

                for(const secondShader of this._shaders){
                    if(secondShader instanceof ShaderAbstractSurface && footPrintMesh){
                        if(footPrintMesh.code != undefined)
                            secondShader.addSurface(glContext, footPrintMesh.image, footPrintMesh.coords, footPrintMesh.indices, footPrintMesh.functionValues, "foot", footPrintMesh.code);
                    }   
                }
            }
        }

        const currentTime: any = new Date();

        const timeElapsed = currentTime - startTime;

        return buildingId;
    }

    async updateFootprintPlot(glContext: WebGL2RenderingContext, d3Expec: any, plotNumber: number, deltaHeight: number, specType: string){

        for(const shader of this._shaders){
            if(shader instanceof ShaderSmoothColorMapTex){
                let footPrintMesh = await shader.applyFootprintPlot(d3Expec, true, plotNumber, deltaHeight, specType);

                if(!footPrintMesh)
                    return;

                if(footPrintMesh.coords.length == 0){ // the mesh could not be updated
                    continue;
                }

                for(const secondShader of this._shaders){
                    if(secondShader instanceof ShaderAbstractSurface && footPrintMesh){
                        if(footPrintMesh.code != undefined)
                            secondShader.updateSurface(glContext, footPrintMesh.image, footPrintMesh.coords, footPrintMesh.indices, footPrintMesh.functionValues, "foot", footPrintMesh.code);
                    }   
                }
            }
        }
    }

    perFaceAvg(functionValues: number[], indices: number[], ids: number[]): number[]{

        let maxId = -1;

        for(const id of ids){
            if(id > maxId){
                maxId = id;
            }
        }

        let avg_accumulation_triangle = new Array(Math.trunc(indices.length/3)).fill(0);
        let avg_accumulation_cell = new Array(maxId+1).fill(0);

        let indicesByThree = Math.trunc(indices.length/3);

        // calculate acc by triangle
        for(let i = 0; i < indicesByThree; i++){ 
            let value = 0;

            value += functionValues[indices[i*3]];
            value += functionValues[indices[i*3+1]];
            value += functionValues[indices[i*3+2]];

            avg_accumulation_triangle[i] = value/3; // TODO: /3 or not? (distribute and accumulate?)
        }

        // calculate acc by cell based on the triangles that compose it
        let count_acc_cell = new Array(maxId+1).fill(0);

        indicesByThree = Math.trunc(indices.length/3);

        for(let i = 0; i < indicesByThree; i++){ 
            let cell = ids[i];
            
            avg_accumulation_cell[cell] += avg_accumulation_triangle[i];

            count_acc_cell[cell] += 1;
        }

        indicesByThree = Math.trunc(indices.length/3);

        for(let i = 0; i < indicesByThree; i++){ 
            let cell = ids[i];      

            avg_accumulation_triangle[i] = avg_accumulation_cell[cell]/count_acc_cell[cell]
        }

        return avg_accumulation_triangle
    }

    /**
     * Distributes triangle avg to the coordinates that composes the triangle. 
     * The coordinates need to be duplicated, meaning that there are unique indices. 
     */
    perCoordinatesAvg(avg_accumulation_triangle: number[], coordsLength: number, indices: number[]): number[]{

        let avg_accumulation_per_coordinates = new Array(coordsLength).fill(0);

        for(let i = 0; i < avg_accumulation_triangle.length; i++){
            let elem = avg_accumulation_triangle[i];

            avg_accumulation_per_coordinates[indices[i*3]] = elem
            avg_accumulation_per_coordinates[indices[i*3+1]] = elem
            avg_accumulation_per_coordinates[indices[i*3+2]] = elem            
        }

        return avg_accumulation_per_coordinates
    }

    distributeFunctionValues(functionValues: number[] | null): number[] | null {

        if(functionValues == null){
            return null;
        }

        let ids = this._mesh.getIdsVBO();
        let indices = this._mesh.getIndicesVBO();
        let coordsLength = this._mesh.getTotalNumberOfCoords();

        let per_face_avg_accum = this.perFaceAvg(functionValues, indices, ids);

        let avg_accumulation_per_coordinates = this.perCoordinatesAvg(per_face_avg_accum, coordsLength, indices);
        
        return avg_accumulation_per_coordinates;
    }

    innerAggFunc(functionValues: number[] | null, startLevel: LevelType, endLevel: LevelType, aggregation: AggregationType): number[] | null {

        if(endLevel != LevelType.OBJECTS || startLevel == LevelType.OBJECTS){
            throw new Error('Only aggregations that end in the Object level are currently supported for the buildings layer')
        }  

        if(startLevel == LevelType.COORDINATES){
            throw new Error('Aggregations with the COORDINATES level are currently not support for the buildings layer. Since the COORDINATES level refers to the buildings footprints.')
        }

        if(functionValues == null)
            return null;

        let coordsPerComp = this._mesh.getCoordsPerComp(); // in the buildings layer the components are the buildings

        let acc_functions_per_buildings: number[][] = [];

        let readCoords = 0;

        for(const numberCoords of coordsPerComp){

            let values: number[] = [];

            for(let i = 0; i < numberCoords; i++){
                values.push(functionValues[i+readCoords]);
            }
            readCoords += numberCoords;

            acc_functions_per_buildings.push(values);
        }

        let agg_functions_per_buildings: number[] = new Array(acc_functions_per_buildings.length).fill(0);

        for(let i = 0; i < acc_functions_per_buildings.length; i++){
            if(aggregation == AggregationType.MAX){
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((a: any, b: any) => Math.max(a, b), -Infinity);
            }else if(aggregation == AggregationType.MIN){
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((a: any, b: any) => Math.min(a, b), Infinity);
            }else if(aggregation == AggregationType.AVG){
                let sum = acc_functions_per_buildings[i].reduce((partialSum: number, value: number) => partialSum + value, 0);
                agg_functions_per_buildings[i] = sum/acc_functions_per_buildings[i].length;
            }else if(aggregation == AggregationType.SUM){
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((partialSum: number, value: number) => partialSum + value, 0);
            }else if(aggregation == AggregationType.COUNT){
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].length;
            }else if(aggregation == AggregationType.DISCARD){ // keep the first value of the join
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i][0];
            }else if(aggregation == AggregationType.NONE){
                throw new Error('NONE aggregation cannot be used with the predicate INNERAGG in the buildings layer');
            }
        }

        readCoords = 0;

        for(let i = 0; i < agg_functions_per_buildings.length; i++){
            for(let j = 0; j < coordsPerComp[i]; j++){
                functionValues[j+readCoords] = agg_functions_per_buildings[i];
            }

            readCoords += coordsPerComp[i];
        }

        return functionValues;
    }

    getFunctionValueIndexOfId(id: number, level: LevelType): number | null {

        if(level == LevelType.COORDINATES){
            throw Error("The buildings layer does not have function values attached to COORDINATES");
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

        if(level == LevelType.COORDINATES3D){
            return id;
        }

        return null;
    }

    getCoordsByLevel(level: LevelType): number[][] {
        let coordByLevel: number[][] = [];

        if(level == LevelType.COORDINATES){
            if(this._coordsByCOORDINATES.length == 0){

                let sectionFootPrint = this._mesh.getSectionFootprintVBO();

                for(const footPrintsElement of sectionFootPrint){
                    for(let i = 0; i < footPrintsElement[0].length/2; i++){
                        coordByLevel.push([footPrintsElement[0][i*2], footPrintsElement[0][i*2+1], 0]);
                    }
                }

                this._coordsByCOORDINATES = coordByLevel;
            }else{
                coordByLevel = this._coordsByCOORDINATES;
            }
        }

        if(level == LevelType.COORDINATES3D){
            if(this._coordsByCOORDINATES3D.length == 0){
                let coords = this._mesh.getCoordinatesVBO();
    
                for(let i = 0; i < coords.length/3; i++){
                    coordByLevel.push([coords[i*3],coords[i*3+1],coords[i*3+2]]);
                }

                this._coordsByCOORDINATES3D = coordByLevel;
            }else{
                coordByLevel = this._coordsByCOORDINATES3D;
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

        if(level == LevelType.COORDINATES){
            throw Error("It is not possible to get abstract data from COORDINATES level in the building layer");
        }

        if(level == LevelType.COORDINATES3D){

            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]) // TODO: give support to more then one timestamps

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
        let highlightArray: number[] = [];
        let booleanHighlights: boolean[] = [];
        let highlightsByLevel: boolean[][] = [];

        if(level == LevelType.COORDINATES){
            throw Error("It is not possible to highlight COORDINATES in the building layer");
        }

        for(const shader of this._shaders){
            if(shader instanceof ShaderSmoothColorMapTex){
                highlightArray = shader.colorOrPicked;
            }
        }

        for(const value of highlightArray){
            if(value == 0){
                booleanHighlights.push(false);
            }else{
                booleanHighlights.push(true);
            }
        }

        if(level == LevelType.COORDINATES3D){

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

    getIdLastHighlightedBuilding(){
        for(const shader of this._shaders){
            if(shader instanceof ShaderSmoothColorMapTex){
                return shader.currentPickedBuildingId;
            }
        }
    }

    highlightBuilding(glContext: WebGL2RenderingContext, x: number, y: number){
        if(!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)){
            return;
        }

        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;

        for(const shader of this._shaders){
            if(shader instanceof ShaderPicking){
                shader.updatePickObjectPosition(pixelX, pixelY);
            }
        }
    }

    /**
     * Shader load signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    loadShaders(glContext: WebGL2RenderingContext): void {
        this._shaders = [];
        const color = MapStyle.getColor(this._styleKey);

        const cmap = this._colorMap;
        const revs = this._reverseColorMap;

        for (const type of this._renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    shader = new ShaderFlatColor(glContext, color);
                break;
                case RenderStyle.FLAT_COLOR_MAP:
                    shader = new ShaderFlatColorMap(glContext, cmap, revs);
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
                case RenderStyle.PICKING: // The picking is associated, by default, with the previous shader in this._renderStyle
                    let auxShader = undefined;

                    if(this._shaders.length > 0){
                        auxShader = this._shaders[this._shaders.length-1];
                    }

                    if(auxShader && auxShader instanceof AuxiliaryShader){
                        shader = new ShaderPicking(glContext, auxShader);
                    }else{
                        throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array.");
                    }
                break;
                case RenderStyle.ABSTRACT_SURFACES:
                    shader = new ShaderAbstractSurface(glContext);
                break;
                case RenderStyle.OUTLINE:
                    shader = new ShaderOutline(glContext);
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

}
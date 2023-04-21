import { Shader } from "./shader";
import { Mesh } from "./mesh";
import { AuxiliaryShader } from "./auxiliaryShader";

import { ColorMap } from "./colormap";

// @ts-ignore
import vsSmoothColorMap from './shaders/smoothColorMapTex.vs';
// @ts-ignore
import fsSmoothColorMap from './shaders/smoothColorMapTex.fs';

import {cross, rotateYMatrix, rotateZMatrix, angle, radians, multiplyMatrices, translateMatrix, normalize, dot, euclideanDistance} from './utils';
import { TextureComponent } from "./texture";

import { IKnot } from "./interfaces";

const mathjs = require('mathjs');
const cov = require('compute-covariance');
const d3 = require('d3');

/**
 * This shader should only be used with the buildings layer
 */

export class ShaderSmoothColorMapTex extends AuxiliaryShader {
    // Data to be rendered
    protected _coords:  number[] = [];
    protected _normals: number[] = [];
    protected _function: number[][] = []; // function values that will be sent to the frag shader
    protected _unchangedFunction: number[][] = []; // original function value for each coordinate
    protected _indices: number[] = [];
    protected _idsLength: number;
    protected _heights: number[][] = [];
    protected _minHeights: number[][] = [];
    protected _orientedEnvelope: number[][][] = [];
    protected _sectionFootprint: number[][][] = [];
    protected _footprintPlaneHeightByCoord: number[] = []; // for each coordinate stores, if there is any, the height of the footprint plot that intersects the building

    protected _lastCode: number = -1; // last code used to identify a plot

    // TODO decide which function to use
    protected _functionToUse: number = 0;

    // Color map definition
    private _colorMap: string | null = null;
    private _colorMapReverse: boolean = false;

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glNormals: WebGLBuffer | null = null;
    protected _glFunction: WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;
    protected _glColorOrPicked: WebGLBuffer | null = null;
    protected _glFootprintPlaneHeight: WebGLBuffer | null = null;
    protected _glFiltered: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _functionDirty: boolean = false;
    protected _colorMapDirty: boolean = false;
    protected _colorOrPickedDirty: boolean = false;
    protected _planeHeightDirty: boolean = false;
    protected _filteredDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _normalsId = -1;
    protected _functionId = -1;
    protected _colorOrPickedId = -1;
    protected _planeHeightId = -1;
    protected _filteredId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _uColorMap: WebGLUniformLocation | null = null;
    protected _textureLocation: WebGLUniformLocation | null = null;

    // Color map texture
    protected _texColorMap: WebGLTexture | null;

    // Picking
    protected _colorOrPicked: number[] = [];
    protected _cellIdsByCoordinates: number[][] = []; // stores the cell id of each coordinate grouped by mesh component
    protected _pickedCoordinates: number[] = []; // store index of coordinates not the coordinates themselves

    // Footprint plot
    protected _footprintCoords: number[];
    protected _currentBuildingCoords: number[];
    protected _coordinatesById: number[][];
    protected _currentFootprintBuildingId: number;
    protected _currentPickedBuildingId: number;
    protected _footprintCodesPerBuilding: {buildingId: number, code: number, plotHeight: number, plotType: number}[] = []; // stores the unique identifier of the footprint plot of the building

    protected _auxCoords: number[] = [];
    protected _auxIndices: number[] = [];
    protected _auxNormals: number[] = [];
    protected _auxFunction: number[] = [];

    protected _filtered: number[] = [];

    constructor(glContext: WebGL2RenderingContext, colorMap: string = "interpolateReds", colorMapReverse: boolean = false) {
        super(vsSmoothColorMap, fsSmoothColorMap, glContext);

        // saves the layer color
        this._colorMap = colorMap;
        this._colorMapReverse = colorMapReverse;

        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);

    }

    get colorOrPicked(): number[]{
        return this._colorOrPicked;
    }

    get currentFootPrintBuildingId(): number{
        return this._currentFootprintBuildingId;
    }

    get currentPickedBuildingId(): number{
        return this._currentPickedBuildingId;
    }

    public updateShaderGeometry(mesh: Mesh) {
        this._coordsDirty = true;
        this._planeHeightDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._heights = mesh.getHeightsVBO();
        this._minHeights = mesh.getMinHeightsVBO();
        this._orientedEnvelope = mesh.getOrientedEnvelopesVBO();
        this._sectionFootprint = mesh.getSectionFootprintVBO();

        this._idsLength = mesh.idsLength();

        // start showing only colors by default
        for(let i = 0; i < this._coords.length/3; i++){ // TODO considers that coords is always 3d (dont know if it is true)
            this._colorOrPicked.push(0.0);
            this._filtered.push(1.0); // 1 true to include
        }

        for(let i = 0; i < this._coords.length/3; i++){
            this._footprintPlaneHeightByCoord.push(-1.0);
        }


    }

    public setFiltered(filtered: number[]){ 
        if(filtered.length == 0){
            this._filtered = Array(this._filtered.length).fill(1.0);
        }else{
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
        this._currentKnot = knot;
        this._functionDirty = true;
        this._colorOrPickedDirty = true;
        
        let tempFunction = mesh.getFunctionVBO(knot.id);

        for(let j = 0; j < tempFunction.length; j++){

            let scale = d3.scaleLinear().domain(d3.extent(tempFunction[j])).range([0,1]);

            for(let i = 0; i < tempFunction[j].length; i++){
                tempFunction[j][i] = scale(tempFunction[j][i]);
            }
        }

        this._function = [];
        this._unchangedFunction = [];

        for(let i = 0; i < tempFunction.length; i++){
            this._function.push([]);
            this._unchangedFunction.push([]);

            tempFunction[i].forEach((elem) => {
                this._unchangedFunction[i].push(elem);
                this._function[i].push(elem);
                this._function[i].push(0);
            });
        }

    }

    public updateShaderUniforms(data: any) {
        this._colorMapDirty = true;
        this._colorMap = <string> data;
    }

    public createUniforms(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');

        this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }

    public bindUniforms(glContext: WebGL2RenderingContext, camera: any): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }

    public createTextures(glContext: WebGL2RenderingContext): void {
        if (!this._colorMap) { return; }

        this._uColorMap = glContext.getUniformLocation(this._shaderProgram, 'uColorMap');

        this._texColorMap = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);

        // // Set the parameters so we can render any size image.
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
     
        // Upload the image into the texture.
        const texData = ColorMap.getColorMap(this._colorMap, this._colorMapReverse);

        const size = [256, 1];
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGB32F, size[0], size[1], 0, glContext.RGB, glContext.FLOAT, new Float32Array(texData));
    }

    public bindTextures(glContext: WebGL2RenderingContext): void {
        glContext.uniform1i(this._uColorMap, 0); // texture unit 0

        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
    }

    public createVertexArrayObject(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();

        // Creates the coords id.
        this._normalsId = glContext.getAttribLocation(this._shaderProgram, 'vertNormals');
        // Create a buffer for the positions.
        this._glNormals = glContext.createBuffer();

        // Creates the function id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        this._glFunction = glContext.createBuffer();

        this._colorOrPickedId = glContext.getAttribLocation(this._shaderProgram, 'inColorOrPicked');
        this._glColorOrPicked = glContext.createBuffer();

        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();

        this._planeHeightId = glContext.getAttribLocation(this._shaderProgram, 'inFootprintPlaneHeight');
        this._glFootprintPlaneHeight = glContext.createBuffer();

        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }

    public bindVertexArrayObject(glContext: WebGL2RenderingContext, mesh: Mesh): void {
        if (!this._shaderProgram) {
            return;
        }

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW
            );
        }
        
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormals);

        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._normals), glContext.STATIC_DRAW
            );
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._normalsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._normalsId);

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        if (this._functionDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._function[this._functionToUse]), glContext.STATIC_DRAW
            );
        }

        glContext.vertexAttribPointer(this._functionId, 2, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);     

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorOrPicked);
        if (this._colorOrPickedDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._colorOrPicked), glContext.STATIC_DRAW
            );
        }

        glContext.vertexAttribPointer(this._colorOrPickedId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorOrPickedId); 

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW
            );
        }

        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId); 

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFootprintPlaneHeight);
        if (this._planeHeightDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._footprintPlaneHeightByCoord), glContext.STATIC_DRAW
            );
        }

        glContext.vertexAttribPointer(this._planeHeightId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._planeHeightId); 

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);

        }

        this._planeHeightDirty = false;
        this._colorOrPickedDirty = false;
        this._coordsDirty = false;
        this._functionDirty = false;
        this._filteredDirty = false;
    }

    public setIdsCoordinates(cellIdsByCoordinates: number[][]){
        this._cellIdsByCoordinates = cellIdsByCoordinates;

        this._coordinatesById = new Array(this._idsLength);

        // builds the array of coordinates per cell id
        let coordinateIndexOffset = 0;
        for(let i = 0; i < this._cellIdsByCoordinates.length; i++){
            let compElement = this._cellIdsByCoordinates[i];
            for(let j = 0; j < compElement.length; j++){
                if(!this._coordinatesById[compElement[j]]){
                    this._coordinatesById[compElement[j]] = [];
                }
       
                this._coordinatesById[compElement[j]].push(coordinateIndexOffset+j);
            }
            coordinateIndexOffset += compElement.length;
        }
    }

    public setPickedCells(pickedCells: Set<number>){
        this._colorOrPickedDirty = true;
        this._pickedCoordinates = [];

        let readElements = 0;
        this._cellIdsByCoordinates.forEach((compElement) => {
            compElement.forEach((cellId, index) => {
                let coordinateIndex = index+readElements;

                if(pickedCells.has(cellId)){
                    this._pickedCoordinates.push(coordinateIndex);
                    this._colorOrPicked[coordinateIndex] = 1.0;
                }else{
                    this._colorOrPicked[coordinateIndex] = 0.0;
                }
            });
            readElements += compElement.length;
        });
    }

    /**
     * Return all the coordinates indices of a specific building given that the this._coords array is grouped by building
     * @param buildingId id of the building in the coords array
     */
    public getBuildingCoords(buildingId: number){

        let readCoords = 0;

        for(let i = 0; i < buildingId; i++){
            readCoords += this._cellIdsByCoordinates[i].length; // this list has the ids separated by building
        }

        let buildingCoords = [];

        for(let i = 0; i < this._cellIdsByCoordinates[buildingId].length; i++){
            buildingCoords.push(readCoords+i);

        }

        return buildingCoords;

    }

    /**
     * Calculates footprint coords based on the building coords
     * @param buildingCoords 
     */
    public calcFootprintCoords(buildingCoords: number[]): void{
        this._footprintCoords = [];

        for(let i = 0; i < buildingCoords.length; i++){
            let coordIndex = buildingCoords[i]*3;

            if(this._coords[coordIndex+2] == 0){ // if z == 0 it belongs to the footprint
                this._footprintCoords.push(buildingCoords[i]);
            } 
        }

    }

    /**
     * Calculates the surface mesh for the footprint plot.
     * It uses Principal Component Analysis to create a oriented bounding plane
     * 
     * @param {number} deltaHeight how much to shift the height if it is updating a surface
     * @param {boolean} update if a footprint plot is being updated
     * @param {number} plotType the type of d3 plot to show (-1 in case of update to maintain the plot type)
     * @param {string} specType d3 for d3 plots and vega for vega-lite plots
     */
    async applyFootprintPlot(spec: any, update: boolean, plotType: number = 1, deltaHeight: number = 0, specType: string = 'd3'){

        if(this._currentFootprintBuildingId == -1){ // a building was not picked
            return;
        }

        /**
         * @param {number} nBins total number of bins (circle is divided equally)
         */
        function defineBins(nBins: number){
            let binData: number[] = [];

            let increment = (2*Math.PI)/nBins; // the angles go from 0 to 2pi (radians)

            // adding the angles that define each bin
            for(let i = 0; i < nBins+1; i++){
                binData.push(i*increment);
            }

            return binData;
        }

        /**
         * Generate the radial data in the format expected by D3 TODO: get rid of this external dependence
         * 
         * @param {number[]} peripherals 8 numbers describing the peripherals (auxiliary lines)
         * @param {number[]} bins array describing the start and end of each bin (in radians)
         * @param {number} nTimeSteps number of timesteps to be considered
         * @param {number[]} timeStepData data for each timestep (length = nBins * nTimeSteps)
         */
        function genRadialData(peripherals: number[], bins: number[], timeStepData: number[]){

            if(timeStepData.length%(bins.length-1) != 0){
                throw new Error("There is a mismatch between the size of bins and size of timeStepData");
            }

            if(peripherals.length != 8){
                throw new Error("The number of peripherals is different than 8");
            }

            let radialData: number[] = [];

            let nTimeSteps = timeStepData.length/(bins.length-1);
            let nBins = bins.length-1

            radialData = radialData.concat(peripherals);
            radialData.push(nBins);
            radialData = radialData.concat(bins);
            radialData.push(nTimeSteps);
            radialData = radialData.concat(timeStepData);

            return JSON.stringify(radialData);

        }

        /**
         * 
         * Given a polar coordinate in the world coordinates corverts to pixel coordinates inside the plane
         * 
         * @param planeWidthWorld width of the plane in the world coords
         * @param planeHeightWorld height of the plane in the world coords
         * @param angle in degrees. considering 0 between top left and top right. growing clock wise3
         * @param distanceToCenterWorld distance of the coordinate to the center of the plane in world coords
         * @param conversionFactor the scale used to generate the resolution of the image on the plane
         */
        function worldToPixel(planeWidthWorld: number, planeHeightWorld: number, angle: number, distanceToCenterWorld: number, conversionFactor: number){

            let planeWidthPixel = planeWidthWorld*conversionFactor;
            let planeHeightPixel = planeHeightWorld*conversionFactor;

            let centerPlanePixel = [planeWidthPixel/2, planeHeightPixel/2];

            let distanceToCenterPixel = distanceToCenterWorld*conversionFactor;

            let pixelXRefCenter = Math.sin(radians(angle))*distanceToCenterPixel;
            let pixelYRefCenter = Math.cos(radians(angle))*distanceToCenterPixel;

            // converting from coord system with center in the origin to coord system with top left in the origin
            let pixelXRefOrigin = centerPlanePixel[0] + pixelXRefCenter;
            let pixelYRefOrigin = centerPlanePixel[1] - pixelYRefCenter;

            return [pixelXRefOrigin, pixelYRefOrigin];
        }

        /**
         * 
         * @param centroidsWorldCoords the centroid positions (flat 3d) of all cells that are project into the plot (The coordinates are ordered according to the position of the cell in the building)
         * @param centroidsPixelCoords the centroid positions (flat 2d) in the image coordinate system (The coordinates are ordered according to the position of the cell in the building)
         * @param normalsPixelCoords the normals (flat 2d) of the cells in the image coordinate system
         * @param functionsPerTimestep each position stores all the timesteps for that specific cell (the indices of all arrays with cell info match)
         * @param planeCenterWorld center of the plane in world coordinates
         * @param anglePerCentroid angle of each centroid
         */
        function genPlotData(centroidsWorldCoords: number[], centroidsPixelCoords: number[], normalsPixelCoords: number[], functionsPerTimestep: number[][], functionIndices: number[], planeCenterWorld: number[], anglePerCentroid: number[]){
        
            let info: any = {
                planeCenterWorld: planeCenterWorld,
                pointData: []
            }

            for(let i = 0; i < centroidsWorldCoords.length/3; i++){
                let point: any = {};
                point.worldCoord = [centroidsWorldCoords[i*3], centroidsWorldCoords[i*3+1], centroidsWorldCoords[i*3+2]];
                point.pixelCoord = [centroidsPixelCoords[i*2], centroidsPixelCoords[i*2+1]];
                point.normal = [normalsPixelCoords[i*2], normalsPixelCoords[i*2+1]];
                point.functions = functionsPerTimestep[i];
                point.angle = anglePerCentroid[i];
                point.functionIndex = functionIndices[i];

                info.pointData.push(point);
            }

            return JSON.stringify(info);

        }

        /**
         * @param vec0 vector from center to 0 degrees
         * @param vec270 vector from center to 270 degrees
         * @param point coordinate to be evaluated
         * @param center center of the circle 
         * @returns returns the angle of a point in a circle
         */
        function getAnglePoint(vec0: number[], vec270: number[], point: number[], center: number[]){

            let vecPoint = [point[0] - center[0], point[1] - center[1], point[2] - center[2]];

            // Determine the position of the centroid in relation to the orientation of the radial plot
            let angle0 = angle(vecPoint, vec0);
            let angle270 = angle(vecPoint, vec270);

            // Considering angles in the D3 format (0 correspond to 12 oclock and grows clock-wise)
            if(angle0 >= 0 && angle0 < 90 && angle270 >= 90 && angle270 < 180){ // quadrant 1
                return angle0
            }else if(angle0 >= 90 && angle0 < 180 && angle270 > 90 && angle270 <= 180){ // quadrant 2
                return angle0
            }else if(angle0 > 90 && angle0 <= 180 && angle270 > 0 && angle270 <= 90){ // quadrant 3
                return 180 + (90 - angle270)
            }else if(angle0 > 0 && angle0 <= 90 && angle270 >= 0 && angle270 < 90){ // quadrant 4
                return 270 + angle270
            }
        }

        /**
         * Given the indices of a set of points calculate the average of the points
         */
        function avgPoints(indicesPoints: number[], coords: number[]){
            let avgX = 0;
            let avgY = 0;
            let avgZ = 0;

            for(let i = 0; i < indicesPoints.length; i++){
                let coordinateIndex = indicesPoints[i];

                avgX += coords[coordinateIndex*3];
                avgY += coords[coordinateIndex*3+1];
                avgZ += coords[coordinateIndex*3+2];
            }

            avgX /= indicesPoints.length;
            avgY /= indicesPoints.length;
            avgZ /= indicesPoints.length;

            return [avgX, avgY, avgZ];
        }

        if(!this._footprintCoords){
            return {indices: [], coords: [], functionValues: [], image: undefined};
        }

        let footprintCode = -1;
        let surfaceHeight = 1;
        let plotNumber = plotType;
        if(update){
            surfaceHeight += deltaHeight;
        }

        this._footprintCodesPerBuilding.forEach((elem) => {
            if(elem.buildingId == this._currentFootprintBuildingId){
                footprintCode = elem.code;
                if(update){

                    plotNumber = elem.plotType;
                    surfaceHeight += elem.plotHeight;

                    let buildingCoords = this.getBuildingCoords(this._currentFootprintBuildingId);
                    this._planeHeightDirty = true;
                    // update _footprintPlaneHeightByCoord with new footprint plot heights for the coordinates of the added building
                    buildingCoords.forEach((coordIndex) => {
                        this._footprintPlaneHeightByCoord[coordIndex] = surfaceHeight;
                    });

                }else{
                    surfaceHeight = elem.plotHeight;
                }
                elem.plotHeight = surfaceHeight;
            }
        });

        if(footprintCode == -1){
            this._lastCode += 1;
            footprintCode = this._lastCode;
            this._footprintCodesPerBuilding.push({buildingId: this._currentFootprintBuildingId, code: this._lastCode, plotHeight: surfaceHeight, plotType: plotNumber});

            let buildingCoords = this.getBuildingCoords(this._currentFootprintBuildingId);

            this._planeHeightDirty = true;

            // update _footprintPlaneHeightByCoord with new footprint plot heights for the coordinates of the added building
            buildingCoords.forEach((coordIndex) => {
                this._footprintPlaneHeightByCoord[coordIndex] = surfaceHeight;
            });

        }
        
        let envelope = this._orientedEnvelope[this._currentFootprintBuildingId];
        
        let nodes = [envelope[0][0], envelope[0][1], surfaceHeight, envelope[0][2], envelope[0][3], surfaceHeight, envelope[0][4], envelope[0][5], surfaceHeight, envelope[0][6], envelope[0][7], surfaceHeight]
        
        let centerPlane = [0, 0, 0];

        for(let i = 0; i < nodes.length/3; i++){
            centerPlane[0] += nodes[i*3];
            centerPlane[1] += nodes[i*3+1];
            centerPlane[2] += nodes[i*3+2];
        }

        centerPlane[0] /= nodes.length/3;
        centerPlane[1] /= nodes.length/3;
        centerPlane[2] /= nodes.length/3;

        // let radiusBSphere = getRadiusBSphere(nodes, centerPlane);

        let v1 = [nodes[3] - nodes[0], nodes[4] - nodes[1], nodes[5] - nodes[2]];
        let v2 = [nodes[6] - nodes[0], nodes[7] - nodes[1], nodes[8] - nodes[2]];

        let surfaceNormal = normalize(cross(v1,v2));

        let indices = [3, 0, 2, 2, 0, 1];
        // let indices = [0, 3, 1, 1, 3, 2];

        // let functionValues = [0,1, 0,0, 1,0, 1,1];
        let functionValues = [1,1, 1,0, 0,0, 0,1];

        // storing coordinates to calculate euclidean distances
        let topLeft: number[] = [];
        let bottomLeft: number[] = [];
        let topRight: number[] = [];
        let bottomRight: number[] = [];

        // figure out height and width of the surface
        for(let i = 0; i < 4; i++){
            let value1 = functionValues[i*2];
            let value2 = functionValues[i*2+1];

            if(value1 == 0 && value2 == 0){
                topLeft.push(nodes[i*3]);
                topLeft.push(nodes[i*3+1]);
                topLeft.push(nodes[i*3+2]);
            }else if(value1 == 0 && value2 == 1){
                bottomLeft.push(nodes[i*3]);
                bottomLeft.push(nodes[i*3+1]);
                bottomLeft.push(nodes[i*3+2]);
            }else if(value1 == 1 && value2 == 0){
                topRight.push(nodes[i*3]);
                topRight.push(nodes[i*3+1]);
                topRight.push(nodes[i*3+2]);
            }else if(value1 == 1 && value2 == 1){
                bottomRight.push(nodes[i*3]);
                bottomRight.push(nodes[i*3+1]);
                bottomRight.push(nodes[i*3+2]);
            }
        }
        
        let width = Math.sqrt(Math.pow(topLeft[0] - topRight[0], 2) + Math.pow(topLeft[1] - topRight[1], 2) + Math.pow(topLeft[2] - topRight[2], 2));
        let height = Math.sqrt(Math.pow(topLeft[0] - bottomLeft[0], 2) + Math.pow(topLeft[1] - bottomLeft[1], 2) + Math.pow(topLeft[2] - bottomLeft[2], 2));

        let projectedCentroids: {point: number[], function: number[], normal: number[], functionIndex: number}[] = [];

        let cellsToCheck = new Set<number>(); // cells that belong to the currently picked building

        this._cellIdsByCoordinates[this._currentFootprintBuildingId].forEach((cellIndex) => {
            cellsToCheck.add(cellIndex);
        });

        Array.from(cellsToCheck).forEach((cellIndex) => {
            let cellCoordinates = this._coordinatesById[cellIndex];

            // for a cell to intersect a plane it needs to have at least one point in each side of the plane and be in the range of the plane
            let above = false;
            let under = false;
            // let inRange = false;
        
            for(let i = 0; i < cellCoordinates.length; i++){
                let coordIndex = cellCoordinates[i];

                let x = this._coords[coordIndex*3]; 
                let y = this._coords[coordIndex*3+1]; 
                let z = this._coords[coordIndex*3+2]; 

                let p0p = [x - nodes[0], y - nodes[1], z - nodes[2]]; // vector from a point in the plane to the analyzed point

                let dotProduct = dot(surfaceNormal, p0p);

                if(dotProduct > 0){
                    above = true;
                }else if(dotProduct < 0){
                    under = true;
                }else{ // the point lies on the plane, no need to check other points
                    above = true;
                    under = true;
                    break;
                }

            }

            // if(above && under && inRange){
            if(above && under){
                // cellCoordinates.forEach((coordIndex) => { // configure the shader to show coordinate as picked
                //     this._colorOrTexValues[coordIndex*2] = 1;
                //     this._colorOrTexValues[coordIndex*2+1] = 1;
                // });
                let centroid = avgPoints(cellCoordinates, this._coords);

                let allFunctionsCentroid: number[] = [];

                for(let i = 0; i < this._function.length; i++){
                    allFunctionsCentroid.push(this._unchangedFunction[i][cellCoordinates[0]]); // the value is equal to all cellcoordinates
                }

                let normal = [this._normals[cellCoordinates[0]*3], this._normals[cellCoordinates[0]*3+1], this._normals[cellCoordinates[0]*3+2]]

                projectedCentroids.push({point: [centroid[0], centroid[1], surfaceHeight], function: allFunctionsCentroid, functionIndex: cellCoordinates[0], normal: normal});
            }
        });

        this._colorOrPickedDirty = true;

        let dataRange = [-5,5]; // buffer around the surface from where the data should be collected. It is in meters. The surface begins at 0 height
        let coordsWithinRange: number[] = []; // coords of the building that fall withing the buffer

        this._currentBuildingCoords.forEach((coordIndex) => {
            if(this._coords[coordIndex*3+2] >= dataRange[0] && this._coords[coordIndex*3+2] <= dataRange[1]){
                coordsWithinRange.push(coordIndex);
            }
        });

        // the middle points that represent 0 and 270 degrees in the circle
        let degree0 = [(topLeft[0]+topRight[0])/2, (topLeft[1]+topRight[1])/2, (topLeft[2]+topRight[2])/2];
        let degree270 = [(topLeft[0]+bottomLeft[0])/2, (topLeft[1]+bottomLeft[1])/2, (topLeft[2]+bottomLeft[2])/2];

        let vec0 = [degree0[0] - centerPlane[0], degree0[1] - centerPlane[1], degree0[2] - centerPlane[2]];
        let vec270 = [degree270[0] - centerPlane[0], degree270[1] - centerPlane[1], degree270[2] - centerPlane[2]];

        let binsDescription = defineBins(32);

        /**
         * Returns the index of the bin the angle belongs to
         * @param bins Array describing the beginning and end of all bins
         * @param angle angle in radians
         */
        function checkBin(bins: number[], angle: number){

            for(let i = 0; i < bins.length-1; i++){
                let start = bins[i];
                let end = bins[i+1];

                if(angle >= start && angle <= end){
                    return i;
                }

            }

            return -1; // returns -1 if it does not belong to any bin
        }

        let timestepsData: number[][] = Array(binsDescription.length-1); // each position stores all timesteps for one bin
        let centroidsInEachBin: number[][] = Array(binsDescription.length-1); // stores how many centroids fall into each bin in each timestep

        for(let i = 0; i < timestepsData.length; i++){
            timestepsData[i] = Array(this._function.length).fill(0);
            centroidsInEachBin[i] = Array(this._function.length).fill(0);
        }

        let centroidsWorldCoords: number[] = [];
        let centroidsPixelCoords: number[] = [];
        let normalsPixelCoords: number[] = [];
        let functionsPerTimeStep: number[][] = [];
        let functionIndices: number[] = [];
        let centerPlanePixel = [width*8/2, height*8/2];
        let anglePerCentroid: number[] = [];

        projectedCentroids.forEach((centroid) => {
            
            functionsPerTimeStep.push(centroid.function);
            functionIndices.push(centroid.functionIndex); // the index of the function so values can be later retrieved from various knots

            centroidsWorldCoords.push(centroid.point[0], centroid.point[1], centroid.point[2]);
            let pixelCoord = [0,0];

            let normalPointWorld = [centroid.normal[0]+centerPlane[0], centroid.normal[1]+centerPlane[1], centroid.normal[2]+centerPlane[2]];
            let angleNormalPoint = getAnglePoint(vec0, vec270, normalPointWorld, centerPlane);
            let normalPointPixel = [0,0];

            if(angleNormalPoint != undefined){
                normalPointPixel = worldToPixel(width, height, angleNormalPoint, euclideanDistance(normalPointWorld, centerPlane), 8);
            }

            let normalPixel = normalize([normalPointPixel[0]-centerPlanePixel[0], normalPointPixel[1]-centerPlanePixel[1]]);

            normalsPixelCoords.push(normalPixel[0], normalPixel[1]);

            // let vecCentroid = [centroid.point[0] - centerPlane[0], centroid.point[1] - centerPlane[1], centroid.point[2] - centerPlane[2]];

            // Determine the position of the centroid in relation to the orientation of the radial plot
            // let angle0 = angle(vecCentroid, vec0);
            // let angle270 = angle(vecCentroid, vec270);

            let binIndex = -1;

            let angleCentroid = getAnglePoint(vec0, vec270, centroid.point, centerPlane);

            anglePerCentroid.push(<number>angleCentroid);

            if(angleCentroid != undefined){
                binIndex = checkBin(binsDescription, radians(angleCentroid));
                pixelCoord = worldToPixel(width, height, angleCentroid, euclideanDistance(centroid.point, centerPlane), 8);
            }

            if(binIndex != -1){ // if the centroid belongs to any of the quadrants
                centroid.function.forEach((value, index) => {
                    timestepsData[binIndex][index] += value;
                    centroidsInEachBin[binIndex][index] += 1;
                });
            }
            
            centroidsPixelCoords.push(pixelCoord[0], pixelCoord[1]);

        });

        let biggestAvg = -1;

        // taking the avg of all timesteps of each bin
        for(let i = 0; i < timestepsData.length; i++){
            for(let j = 0; j < timestepsData[i].length; j++){
                if(centroidsInEachBin[i][j] != 0){
                    timestepsData[i][j] /= centroidsInEachBin[i][j];
                }
                if(timestepsData[i][j] > biggestAvg){
                    biggestAvg = timestepsData[i][j];
                }
            }
        }

        let flatTimestepData: number[] = [];

        // normalizing the avg of all timesteps of each bin
        for(let i = 0; i < timestepsData.length; i++){
            for(let j = 0; j < timestepsData[i].length; j++){
                if(biggestAvg != 0){
                    timestepsData[i][j] /= biggestAvg; 
                }
                flatTimestepData.push(timestepsData[i][j]);
            }
        }

        let plotData: string;

        if(plotNumber == 0){ // TODO: make radial plot deal with generic data
            plotData = genRadialData([-1, -1, -1, -1, -1, -1, -1, -1], binsDescription, flatTimestepData);
        }else{
            plotData = genPlotData(centroidsWorldCoords, centroidsPixelCoords, normalsPixelCoords, functionsPerTimeStep, functionIndices, centerPlane, anglePerCentroid); // generic data format that feed all plot types
        }

        // let texImage = await this.generateCustomTextureFoot(spec, radialData, width, height, plotNumber);
        
        let texImage = await this.generateCustomTextureFoot(spec, plotData, width, height, 8, plotNumber, specType);

        return {indices: indices, coords: nodes, functionValues: functionValues, image: texImage, code: footprintCode}

    }

    public setPickedFoot(cellId: number, pickingForUpdate: boolean) {

        let buildingCoords = [];

        let keepSearching = true;
        for(let i = 0; i < this._cellIdsByCoordinates.length; i++){
            let compElement = this._cellIdsByCoordinates[i];
            for(let j = 0; j < compElement.length; j++){
                if(cellId == compElement[j]){
                    let hasPlot = false;
                    this._footprintCodesPerBuilding.forEach((value) => {
                        if(value.buildingId == i){
                            hasPlot = true;
                        }
                    });

                    if(pickingForUpdate){
                        if(hasPlot){ // for the update only proceeds if the building already has a footprint plot
                            this._currentFootprintBuildingId = i;
                            buildingCoords = this.getBuildingCoords(i);
                            this._currentBuildingCoords = buildingCoords;
                            this.calcFootprintCoords(buildingCoords);
                        }else{
                            this._currentFootprintBuildingId = -1;
                            keepSearching = false;
                        }
                    }else{
                        this._currentFootprintBuildingId = i;
                        buildingCoords = this.getBuildingCoords(i);
                        this._currentBuildingCoords = buildingCoords;
                        this.calcFootprintCoords(buildingCoords);
                    }

                    break;
                }
            }
            if(buildingCoords.length > 0 || !keepSearching){ // already found the building or there is no need to keep searching
                break;
            }
        }

    }

    public setPickedObject(cellId: number){

        let buildingCoords: number[] = [];
        let keepSearching = true;

        for(let i = 0; i < this._cellIdsByCoordinates.length; i++){
            let compElement = this._cellIdsByCoordinates[i];
            for(let j = 0; j < compElement.length; j++){
                if(cellId == compElement[j]){
                   
                    this._currentPickedBuildingId = i;
                    buildingCoords = this.getBuildingCoords(i);
                    keepSearching = false;

                    break;
                }
            }
            if(!keepSearching){ // already found the building 
                break;
            }
        }

        if(buildingCoords.length > 0){ // a building was found
            // toggle the highlight in the coordinates of the building
            for(const coordId of buildingCoords){

                if(this._colorOrPicked[coordId] == 1){
                    this._colorOrPicked[coordId] = 0;
                }else if(this._colorOrPicked[coordId] == 0){
                    this._colorOrPicked[coordId] = 1;
                }

            }
            this._colorOrPickedDirty = true;
        }

    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        for(const coordIndex of coordinates){
            if(value)
                this._colorOrPicked[coordIndex] = 1;
            else
                this._colorOrPicked[coordIndex] = 0;
        }

        this._colorOrPickedDirty = true;
    }

    /**
     * Determines the center and radius of smallest sphere that contains the picked coordinates 
     */
    public bSpherePickedCoords(){
        let maxX = -1;
        let maxY = -1;
        let maxZ = -1;

        let minX = -1;
        let minY = -1;
        let minZ = -1;

        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex*3];
            let y = this._coords[coordIndex*3+1];
            let z = this._coords[coordIndex*3+2];

            if(minX == -1){
                minX = x;
            }else if(x < minX){
                minX = x;
            }

            if(minY == -1){
                minY = y;
            }else if(y < minY){
                minY = y;
            }

            if(minZ == -1){
                minZ = z;
            }else if(z < minZ){
                minZ = z;
            }

            if(maxX == -1){
                maxX = x;
            }else if(x > maxX){
                maxX = x;
            }

            if(maxY == -1){
                maxY = y;
            }else if(y > maxY){
                maxY = y;
            }

            if(maxZ == -1){
                maxZ = z;
            }else if(z > maxZ){
                maxZ = z;
            }

        });

        let radius = -1;

        let center = [(minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2];

        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex*3];
            let y = this._coords[coordIndex*3+1];
            let z = this._coords[coordIndex*3+2];

            let distance = Math.sqrt(Math.pow(x-center[0], 2) + Math.pow(y-center[1], 2) + Math.pow(z-center[2], 2)); // euclidean distance

            if(distance > radius){
                radius = distance;
            }

        });

        let radiusAdjustingStep = 0.015;
        let radiusAdjustingFactor = 1;

        // adjusting radius according to the number of coordinates
        radiusAdjustingFactor -= (this._pickedCoordinates.length/3)*radiusAdjustingStep;

        if(radiusAdjustingFactor < 0.15){
            radiusAdjustingFactor = 0.15;
        }

        return {"center": center, "radius": radius*radiusAdjustingFactor}; // tweak the radius to make it closer or further from the building

    }

    /**
     * Handles the generation of a custom texture defined by the user.
     */
    async generateCustomTexture(spec:any, specType: string, data: string, width: number, height: number){

        // let shadowAvg = 0;
        // this._pickedCoordinates.forEach((coordinateIndex) => {
        //     shadowAvg += this._function[this._functionToUse][coordinateIndex*2];
        // });
        // shadowAvg = shadowAvg/this._pickedCoordinates.length;

        let image: any;

        if(specType == 'vega'){
            image = await spec.getSurEmbeddedSvg(data, width * 8, height * 8); 
        }else{
            image = await spec.run(data, width * 8, height * 8, 1); 
        }

        return image;
    }

    /**
     * Handles the generation of a custom texture defined by the user.
     */
    // async generateCustomTextureFoot(d3Expec: any, coords: number[], width: number, height: number){
    async generateCustomTextureFoot(spec: any, data: string, width: number, height: number, conversionFactor: number, plotNumber: number, specType: string){

        let image;

        if(specType == 'd3'){
            image = await spec.run(data, width * conversionFactor, height * conversionFactor, plotNumber); 
        }else{
            image = await spec.getFootEmbeddedSvg(data, width * conversionFactor, height * conversionFactor); // grammar manager
        }

        return image;
    }

    /**
     * Defines transformations necessary to make a surface flat having a z = 0 and to undo it
     * 
     * @param {boolean} centerPlane center point of the plane
     * @param {boolean} normal the normal of the plane
     * 
     */
    public absSurfaceTrans(centerPlane: number[], normal: number[]){

        let zRotation;
        let yRotation;

        // calculating do transformation
        // When x(+), y(-) or x(-), y(-)
        if((normal[0] > 0 && normal[1] < 0) || (normal[0] < 0 && normal[1] < 0)){
            zRotation = radians(angle([1,0,0],[normal[0], normal[1], 0])); // z component does not matter in this rotation
        }else if((normal[0] > 0 && normal[1] > 0) || (normal[0] < 0 && normal[1] > 0)){ // When x(+), y(+) or x(-), y(+)
            zRotation = -1*radians(angle([1,0,0],[normal[0], normal[1], 0])); // z component does not matter in this rotation
        }else{
            zRotation = radians(angle([1,0,0],[normal[0], normal[1], 0])); // when one of the axis is 0 it does not matter the direction of rotation // z component does not matter in this rotation
        }

        // When x(+), z(-) or x(-), z(-)
        if((normal[0] > 0 && normal[2] < 0) || (normal[0] < 0 && normal[2] < 0)){
            yRotation = radians(angle([0,0,1],normal));
        }else if((normal[0] > 0 && normal[2] > 0) || (normal[0] < 0 && normal[2] > 0)){ // When x(+), z(+) or x(-), z(+)
            yRotation = -1*radians(angle([0,0,1],normal));
        }else{
            yRotation = radians(angle([0,0,1],normal)); // when one of the axis is 0 it does not matter the direction of rotation
        }

        let transformations: number[][] = translateMatrix(-1*centerPlane[0], -1*centerPlane[1], -1*centerPlane[2]); // translate plane to origin
        transformations = multiplyMatrices(rotateZMatrix(zRotation), transformations); 
        transformations = multiplyMatrices(rotateYMatrix(yRotation), transformations);

        // calculating undo transformation
        let undoTrans = rotateYMatrix(-1*yRotation); // undo the Y rotation
        undoTrans = multiplyMatrices(rotateZMatrix(-1*zRotation), undoTrans);  // undo the Z rotation
        undoTrans = multiplyMatrices(translateMatrix(centerPlane[0], centerPlane[1], centerPlane[2]), undoTrans); // translate plane back to original position

        return {"do": transformations, "undo": undoTrans};
    }

    /**
     * Get a flat list of numbers and converts to a column matrix
     * @param {number[]} flatArray flat list of nummbers
     * @param {number} dim number of rows in the matrix
     */
    private flatArrayToMatrix(flatArray: number[], dim: number){
        let matrix: number[][] = [];

        for(let i = 0; i < dim; i++){ // one iteration for each row
            let row: number[] = [];
            for(let j = 0; j < flatArray.length/dim; j++){
                row.push(flatArray[j*dim+i]);    
            }   
            matrix.push(row);
        } 

        return matrix;

    }

    async applyTexSelectedCells(camera: any, spec:any, specType: string){
        /**
         * 
         * @param {number[]} point 3D point
         * @param {object} plane Attributes: center (number[]) and unit normal (number[])
         */
        let projectPointOntoPlane = (point: number[], plane: {center: number[], normal: number[]}) => {
            let v = [point[0]-plane.center[0], point[1]-plane.center[1], point[2]-plane.center[2]]; // vector from plane "center" to the point of interest
        
            let dist = plane.normal[0]*v[0]+plane.normal[1]*v[1]+plane.normal[2]*v[2]; // scalar distance from point to plane along normal (dot product between v and normal)

            let normalXDist = [plane.normal[0]*dist, plane.normal[1]*dist, plane.normal[2]*dist];

            return [point[0]-normalXDist[0], point[1]-normalXDist[1], point[2]-normalXDist[2]];
        }

        if(this._pickedCoordinates.length == 0){
            return;
        }

        let abs_surface_indices: number[] = [];
        let abs_surface_coords: number[] = [];
        let abs_surface_normals: number[] = [];
        let abs_surface_function: number[] = [];

        let bSphere = this.bSpherePickedCoords();
        let sumNormals = this.sumPickedNormals();

        if(sumNormals.length == 0){
            return;
        }

        let shiftVector = [sumNormals[0]*bSphere.radius, sumNormals[1]*bSphere.radius, sumNormals[2]*bSphere.radius]; // vector from center of sphere to surface

        let centerPlane = [bSphere.center[0]+shiftVector[0], bSphere.center[1]+shiftVector[1], bSphere.center[2]+shiftVector[2]]; // center of texture plane. This point is tangent to the sphere in the direction of the sumNormals

        let projectedPoints: number[] = [];

        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex*3];
            let y = this._coords[coordIndex*3+1];
            let z = this._coords[coordIndex*3+2];

            let projectedPoint = projectPointOntoPlane([x,y,z], {"center": centerPlane, "normal": sumNormals});

            let projectedX = projectedPoint[0];
            let projectedY = projectedPoint[1];
            let projectedZ = projectedPoint[2];

            projectedPoints.push(projectedX, projectedY, projectedZ);

        });

        let transformations = this.absSurfaceTrans(centerPlane, sumNormals);
        let doTrans = transformations.do;
        let undoTrans = transformations.undo;
        
        let pointsMatrix: number[][] = this.flatArrayToMatrix(projectedPoints, 3);

        // one last row with 1's is needed to complete the matrix
        let row: number[] = [];
        for(let j = 0; j < projectedPoints.length/3; j++){
            row.push(1);
        }
        pointsMatrix.push(row);

        let transformedPoints = multiplyMatrices(doTrans, pointsMatrix);

        // from homogeneous coordinates back to normal
        for(let rowIndex = 0; rowIndex < pointsMatrix.length; rowIndex++){
            for(let columnIndex = 0; columnIndex < pointsMatrix[0].length; columnIndex++){
                transformedPoints[rowIndex][columnIndex] = transformedPoints[rowIndex][columnIndex]/transformedPoints[transformedPoints.length-1][columnIndex]; 
            }
        }

        let transformedPointsList: number[][] = []; // each position represents a point

        for(let columnIndex = 0; columnIndex < pointsMatrix[0].length; columnIndex++){
            let point: number[] = [];
            for(let rowIndex = 0; rowIndex < pointsMatrix.length-1; rowIndex++){ // desconsider last row of homogenous coordinates
                point.push(transformedPoints[rowIndex][columnIndex]);
            }
            transformedPointsList.push(point);
        }

        // definition of the boundaries of the plane
        let maxX = -1;
        let maxY = -1;

        let minX = -1;
        let minY = -1;

        transformedPointsList.forEach((elem) => {

            let x = elem[0];
            let y = elem[1];

            if(minX == -1){
                minX = x;
            }else if(x < minX){
                minX = x;
            }
    
            if(minY == -1){
                minY = y;
            }else if(y < minY){
                minY = y;
            }
    
            if(maxX == -1){
                maxX = x;
            }else if(x > maxX){
                maxX = x;
            }
    
            if(maxY == -1){
                maxY = y;
            }else if(y > maxY){
                maxY = y;
            }
            
        });
        
        let bPlane = [minX, minY, maxX, maxY]; // bounding plane that will receive the texture. After the transformations the bounding plane is parallel to x and y, thus z = 0 to all cordinates

        this._coordsDirty = true;
        this._functionDirty = true;
        this._colorOrPickedDirty = true;

        // Each column is a point
        let nodes = [[bPlane[0],bPlane[2],bPlane[2],bPlane[0]],
                     [bPlane[1],bPlane[1],bPlane[3],bPlane[3]],
                     [0,0,0,0],
                     [1,1,1,1]];        

        nodes = multiplyMatrices(undoTrans, nodes);

        // from homogeneous coordinates back to normal
        for(let rowIndex = 0; rowIndex < nodes.length; rowIndex++){
            for(let columnIndex = 0; columnIndex < nodes[0].length; columnIndex++){
                nodes[rowIndex][columnIndex] = nodes[rowIndex][columnIndex]/nodes[nodes.length-1][columnIndex]; 
            }
        }
        
        let flat_nodes: number[] = [];
        
        // flattening nodes form number[][] to number[]
        for(let columnIndex = 0; columnIndex < nodes[0].length; columnIndex++){ 
            for(let rowIndex = 0; rowIndex < nodes.length-1; rowIndex++){ // no need to consider the last row used for homogeneous coordinates
                flat_nodes.push(nodes[rowIndex][columnIndex]); 
            }
        }
        
        // TODO dont know if this is the best solution
        if(sumNormals[2] > 0){ // if the normal of the plane is facing top or corner top
            let aux = [flat_nodes[3], flat_nodes[4], flat_nodes[5]] // coordinate of index 1
            flat_nodes[3] = flat_nodes[9] // swapping index 1 with 3
            flat_nodes[4] = flat_nodes[10] // swapping index 1 with 3
            flat_nodes[5] = flat_nodes[11] // swapping index 1 with 3

            flat_nodes[9] = aux[0] // swapping index 1 with 4
            flat_nodes[10] = aux[1] // swapping index 1 with 4
            flat_nodes[11] = aux[2] // swapping index 1 with 4
        }

        // let indices = [3, 0, 2, 2, 0, 1];
        let indices = [0, 3, 1, 1, 3, 2];

        abs_surface_indices = indices;

        abs_surface_coords = abs_surface_coords.concat(flat_nodes);

        for(let i = 0; i < 4; i++){ // since there is four new coordinates we need four new normals
            abs_surface_normals.push(sumNormals[0]);
            abs_surface_normals.push(sumNormals[1]);
            abs_surface_normals.push(sumNormals[2]);
        }

        let rightVector = camera.getRightVector();
        let upVector = camera.getUpVector();

        let rightPoint = [centerPlane[0]+rightVector[0], centerPlane[1]+rightVector[1], centerPlane[2]+rightVector[2]] // auxiliary point to represent the right direction
        let upPoint =[centerPlane[0]+upVector[0], centerPlane[1]+upVector[1], centerPlane[2]+upVector[2]] // auxiliary point to represent the up direction

        let cornerDistances: number[][] = []; // stores the distance of the corners of the plane to each vector
        
        let maxMinDistances: {minRight: boolean, minUp: boolean, maxRight: boolean, maxUp: boolean}[] = [] ; // stores if the flat_node has a min or max up or right

        for(let i = 0; i < flat_nodes.length/3; i++){
            let distanceRight = Math.sqrt(Math.pow(flat_nodes[i*3]-rightPoint[0], 2) + Math.pow(flat_nodes[i*3+1]-rightPoint[1], 2) + Math.pow(flat_nodes[i*3+2]-rightPoint[2], 2)); // euclidean distance
            let distanceUp = Math.sqrt(Math.pow(flat_nodes[i*3]-upPoint[0], 2) + Math.pow(flat_nodes[i*3+1]-upPoint[1], 2) + Math.pow(flat_nodes[i*3+2]-upPoint[2], 2)); // euclidean distance
        
            cornerDistances.push([distanceRight, distanceUp, i]);
            maxMinDistances.push({minRight: false, minUp: false, maxRight: false, maxUp: false}); // initialize vector with all positions false
        }

        // minUp, maxRight: 0,0
        // minUp, minRight: 1,0
        // maxUp, maxRight: 0,1
        // maxUp, minRight: 1,1

        // sort by crescent order of right distance
        cornerDistances.sort((a,b) => {
            return a[0]-b[0];
        });

        for(let i = 0; i < 4; i++){
            if(i == 0 || i == 1){
                maxMinDistances[cornerDistances[i][2]].minRight = true;
            }else{
                maxMinDistances[cornerDistances[i][2]].maxRight = true;
            }
        }

        // sort by crescent order of up distance
        cornerDistances.sort((a,b) => {
            return a[1]-b[1];
        });

        for(let i = 0; i < 4; i++){
            if(i == 0 || i == 1){
                maxMinDistances[cornerDistances[i][2]].minUp = true;
            }else{
                maxMinDistances[cornerDistances[i][2]].maxUp = true;
            }
        }

        let function_sequence: number[] = [];
        let sequenceChecker: number[] = [0,0,0,0] // Each position represents one corner of the image and the number, the amount of times that corner was attached to a point 

        maxMinDistances.forEach((elem) => {
            if(elem.minUp && elem.maxRight){
                sequenceChecker[0] += 1;
                function_sequence.push(0); // 0
                function_sequence.push(0);
            }else if(elem.minUp && elem.minRight){
                sequenceChecker[1] += 1;
                function_sequence.push(1); // 1
                function_sequence.push(0);
            }else if(elem.maxUp && elem.maxRight){
                sequenceChecker[2] += 1;
                function_sequence.push(0); // 0
                function_sequence.push(1);
            }else if(elem.maxUp && elem.minRight){
                sequenceChecker[3] += 1;
                function_sequence.push(1); // 1
                function_sequence.push(1);
            }
        });

        let validSequence = true;
        sequenceChecker.forEach((elem) => {
            if(elem != 1){
                validSequence = false;
            }
        });

        if(validSequence){
            abs_surface_function = abs_surface_function.concat(function_sequence);

        }else{ // backup sequence
            // abs_surface_function = abs_surface_function.concat([0,1, 0,0, 1,0, 1,1]);
            abs_surface_function = abs_surface_function.concat([0,1, 0,0, 1,0, 1,1]);

        }

        // storing coordinates to calculate euclidean distances
        let topLeft: number[] = [];
        let bottomLeft: number[] = [];
        let topRight: number[] = [];

        // figure out height and width of the surface
        for(let i = 0; i < 4; i++){
            let value1 = abs_surface_function[i*2];
            let value2 = abs_surface_function[i*2+1];


            if(value1 == 0 && value2 == 0){
                topLeft.push(abs_surface_coords[i*3]);
                topLeft.push(abs_surface_coords[i*3+1]);
                topLeft.push(abs_surface_coords[i*3+2]);
            }else if(value1 == 0 && value2 == 1){
                bottomLeft.push(abs_surface_coords[i*3]);
                bottomLeft.push(abs_surface_coords[i*3+1]);
                bottomLeft.push(abs_surface_coords[i*3+2]);
            }else if(value1 == 1 && value2 == 0){
                topRight.push(abs_surface_coords[i*3]);
                topRight.push(abs_surface_coords[i*3+1]);
                topRight.push(abs_surface_coords[i*3+2]);
            }

        }
        
        let width = Math.sqrt(Math.pow(topLeft[0] - topRight[0], 2) + Math.pow(topLeft[1] - topRight[1], 2) + Math.pow(topLeft[2] - topRight[2], 2));
        let height = Math.sqrt(Math.pow(topLeft[0] - bottomLeft[0], 2) + Math.pow(topLeft[1] - bottomLeft[1], 2) + Math.pow(topLeft[2] - bottomLeft[2], 2));
        
        // calculate function index. Which is the same thing as index. Also retrieve highligh info.

        let plotDataElements: any[] = [];

        this._pickedCoordinates.forEach((coordIndex) => {
            let elem: any = {};

            elem.index = coordIndex; // considers the geometry level
            elem.functionIndex = coordIndex;

            plotDataElements.push(elem);
        });

        let texImage = await this.generateCustomTexture(spec, specType, JSON.stringify(plotDataElements), width, height);

        this._lastCode += 1;

        this._pickedCoordinates = [];

        return {indices: abs_surface_indices, coords: abs_surface_coords, functionValues: abs_surface_function, image: texImage, code: this._lastCode};
    }

    /**
     * Reset the data structures that keep track of instantiated surfaces
     */
    public clearSurfaces(){

        this._footprintPlaneHeightByCoord = [];

        for(let i = 0; i < this._coords.length/3; i++){
            this._footprintPlaneHeightByCoord.push(-1.0);
        }

        this._planeHeightDirty = true;

        this._footprintCodesPerBuilding = [];

    }

    /**
     * Calculate the sum of normals of the picked coordinates
     */
    public sumPickedNormals(){  
        if(this._pickedCoordinates.length == 0){
            return [];
        }

        let sumNormals = [0,0,0];

        this._pickedCoordinates.forEach((indexCoord) => {
            let x = this._normals[indexCoord*3]; // TODO considering that normals are in 3D (dont know if it is always true)
            let y = this._normals[(indexCoord*3)+1];
            let z = this._normals[(indexCoord*3)+2];

            sumNormals = [sumNormals[0]+x, sumNormals[1]+y, sumNormals[2]+z]; 
        });

        let x = sumNormals[0];
        let y = sumNormals[1];
        let z = sumNormals[2];

        // convert result to unit vector
        let nrm = Math.sqrt(x*x+y*y+z*z);

        return [x/nrm,y/nrm,z/nrm];

    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.enable(glContext.BLEND)
        glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);

        glContext.useProgram(this._shaderProgram);

        // binds data
        this.bindUniforms(glContext, camera);

        // was used for the outline
        glContext.stencilFunc(
            glContext.EQUAL,     // the test
            0,            // reference value
            0xFF,         // mask
        );

        // glContext.stencilFunc(
        //     glContext.GEQUAL,     // the test
        //     zOrder,            // reference value
        //     0xFF,         // mask
        // );

        glContext.stencilOp(
            glContext.KEEP,     // what to do if the stencil test fails
            glContext.KEEP,     // what to do if the depth test fails
            glContext.REPLACE,     // what to do if both tests pass
        );

        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);

        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        
        glContext.disable(glContext.BLEND);
        

    }
}
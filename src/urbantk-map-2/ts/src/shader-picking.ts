import { Shader } from "./shader";
import { Mesh } from "./mesh";

import { MapStyle } from './map-style';

// @ts-ignore
import vsPicking from './shaders/picking.vs';
// @ts-ignore
import fsPicking from './shaders/picking.fs';
import { AuxiliaryShader } from "./auxiliaryShader";

import { IKnot } from "./interfaces";

/**
 * This shader should only be used with the buildings layer
 */

export class ShaderPicking extends Shader {
    // Data to be rendered
    protected _coords:  number[] = [];
    protected _indices: number[] = [];
    protected _cellIds: number[] = [];

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;
    protected _glCellIds: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _cellIdsDirty: boolean = false;
    protected _resizeDirty: boolean = true; 
    protected _clickDirty: boolean = false;
    protected _pickFilterDirty: boolean = false;
    protected _footDirty: boolean = false;
    protected _pickObjectDirty: boolean = false;
    protected _pickingForUpdate: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _cellIdsId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _uColorMap: WebGLUniformLocation | null = null;

    // Texture to support picking
    protected _texPicking: WebGLTexture | null = null; 
    protected _depthBuffer: WebGLRenderbuffer | null = null;
    protected _frameBuffer: WebGLFramebuffer | null = null;

    // Picking positions
    protected _pixelX: number;
    protected _pixelY: number;
    protected _pixelXFilter: number;
    protected _pixelYFilter: number;
    protected _pickingWidth: number;
    protected _pickingHeight: number;
    protected _pickingFilterWidth: number;
    protected _pickingFilterHeight: number;
    protected _selectedFiltered: number[]; // ids of elements selected by the user to build the filtering bbox
    protected _cellIdsByCoordinates: number[][] = []; // stores the cell id of each coordinate grouped by mesh component

    // Footprint picking position
    protected _footPixelX: number;
    protected _footPixelY: number;
    protected _currentPickedFoot: number;
    protected _filtered: number[] = []; // coordinates to disconsider in further interactions

    protected _objectPixelX: number;
    protected _objectPixelY: number;

    protected _pickedCells: Set<number> = new Set();
    protected _currentPickedCells: Set<number> = new Set(); // store the current brushed cells while the brushing is still happening

    protected _auxiliaryShader: AuxiliaryShader;

    protected _coordsPerComp: number[];

    /**
     * 
     * @param {AuxiliaryShader} auxiliaryShader The shader responsible for receiving picking data
     */
    constructor(glContext: WebGL2RenderingContext, auxiliaryShader: AuxiliaryShader) {
        super(vsPicking, fsPicking, glContext);

        this._auxiliaryShader = auxiliaryShader;

        // creathe the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }

    /**
     * Sets the resize dirty information
     */
    set resizeDirty(resizeDirty: boolean) {
        this._resizeDirty = resizeDirty;
    }

    get selectedFiltered(): number[]{
        return this._selectedFiltered;
    }

    public updateShaderGeometry(mesh: Mesh) {
        
        this._coordsDirty = true;
        this._cellIdsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        
        this._indices = mesh.getIndicesVBO();

        this._coordsPerComp = mesh.getCoordsPerComp();
        
        this._cellIds = [];
                
        this._cellIdsByCoordinates = mesh.getIdsCoordinates();
      
        this._auxiliaryShader.setIdsCoordinates(this._cellIdsByCoordinates);

        for(const componentElem of this._cellIdsByCoordinates){
            for(const elem of componentElem){
                this._cellIds.push(((elem >>  0) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >>  8) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >> 16) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >> 24) & 0xFF) / 0xFF);
            }
        }

        let totalNumberOfCoords = mesh.getTotalNumberOfCoords()

        for(let i = 0; i < totalNumberOfCoords; i++){
            this._filtered.push(1.0); // 1 true to include
        }

    }

    public setFiltered(filtered: number[]){ 
        if(filtered.length == 0){
            this._filtered = Array(this._filtered.length).fill(1.0);
        }else{
            this._filtered = filtered;
        }
        // this._filteredDirty = true;
    }

    public updatePickPosition(pixelX: number, pixelY: number, width: number, height: number){

        this._clickDirty = true;

        this._pixelX = pixelX;
        this._pixelY = pixelY;

        if(width == 0){
            this._pickingWidth = 1;
        }else{
            this._pickingWidth = width;
        }

        if(height == 0){
            this._pickingHeight = 1;
        }else{
            this._pickingHeight = height;
        }   
    }

    public updatePickFilterPosition(pixelX: number, pixelY: number, width: number, height: number){

        this._pickFilterDirty = true;

        this._pixelXFilter = pixelX;
        this._pixelYFilter = pixelY;

        if(width == 0){
            this._pickingFilterWidth = 1;
        }else{
            this._pickingFilterWidth = width;
        }

        if(height == 0){
            this._pickingFilterHeight = 1;
        }else{
            this._pickingFilterHeight = height;
        }   

    }

    /**
     * 
     * @param pixelX 
     * @param pixelY 
     * @param update indicates if this picking is for creating a new plot or updating
     */
    public updateFootPosition(pixelX: number, pixelY: number, update: boolean){
        this._footDirty = true;
        this._footPixelX = pixelX;
        this._footPixelY = pixelY;
        this._pickingForUpdate = update;
    }

    // when the brushing action ended
    public applyBrushing(){
        for(const id of Array.from(this._currentPickedCells)){
            this._pickedCells.add(id);
        }

        this._currentPickedCells = new Set();
    }

    public isFilteredIn(objectId: number){
        if(this._filtered.length == 0){
            return true;
        }else{
            let readCoords = 0;

            for(let i = 0; i < this._coordsPerComp.length; i++){
                let countCoords = this._coordsPerComp[i];

                if(i == objectId){
                    if(this._filtered[readCoords] == 1){
                        return true;
                    }else{
                        return false;
                    }
                }

                readCoords += countCoords;
            }
        }

        return false;
    }

    public pickPixel(glContext: WebGL2RenderingContext){

        const data = new Uint8Array(Math.ceil(Math.abs(this._pickingHeight)*Math.abs(this._pickingWidth)*4));

        for(let i = 0; i < data.length; i++){ // initializing data array with 255 to recognize not used positions
            data[i] = 255;
        }

        glContext.readPixels(
            this._pixelX,            // x
            this._pixelY,            // y
            this._pickingWidth,                 // width
            this._pickingHeight,                 // height
            glContext.RGBA,           // format
            glContext.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result

        let ids = new Set<number>();

        let dataByFour = Math.floor(data.length/4);

        for(let i = 0; i < dataByFour; i++){
            if(data[i*4] == 255 && data[i*4+1] == 255 && data[i*4+2] == 255 && data[i*4+3] == 255){ // some portions of the data array are not used
                continue;
            }else{
                ids.add(data[i*4] + (data[i*4+1] << 8) + (data[i*4+2] << 16) + (data[i*4+3] << 24));
            }
        }

        this._currentPickedCells = new Set();
        
        let arrayFromIds = Array.from(ids);

        for(const id of arrayFromIds){
            let idBuildingLevel = this.objectFromCell(id);

            if(this.isFilteredIn(idBuildingLevel)){ // it is filtered in, therefore can interact
                this._currentPickedCells.add(id);
            }

        }

        this._auxiliaryShader.setPickedCells(new Set([...Array.from(this._pickedCells), ...Array.from(this._currentPickedCells)]));
    }

    getBboxFiltered(mesh: Mesh){
        let coordsPerComp = mesh.getCoordsPerComp();
    
        let minX = null;
        let minY = null;
        let maxX = null;
        let maxY = null;

        let readCoords = 0;

        for(let i = 0; i < coordsPerComp.length; i++){
            if(this._selectedFiltered.includes(i)){
                for(let j = 0; j < coordsPerComp[i]; j++){

                    let x = this._coords[(readCoords+j)*mesh.dimension];
                    let y = this._coords[(readCoords+j)*mesh.dimension+1];

                    if(minX == null){
                        minX = x;
                    }else if(x < minX){
                        minX = x;
                    }

                    if(minY == null){
                        minY = y;
                    }else if(y < minY){
                        minY = y;
                    }

                    if(maxX == null){
                        maxX = x;
                    }else if(x > maxX){
                        maxX = x;
                    }

                    if(maxY == null){
                        maxY = y;
                    }else if(y > maxY){
                        maxY = y;
                    }
                }
            }

            readCoords += coordsPerComp[i];
        }

        if(minX == null){
            minX = 0;
        }

        if(minY == null){
            minY = 0;
        }

        if(maxX == null){
            maxX = 0;
        }

        if(maxY == null){
            maxY = 0;
        }
        
        return [minX, minY, maxX, maxY];
    }

    protected objectFromCell = (cellId: number) => {

        for(let i = 0; i < this._cellIdsByCoordinates.length; i++){
            let compElement = this._cellIdsByCoordinates[i];
            for(let j = 0; j < compElement.length; j++){
                if(cellId == compElement[j]){
                    return i
                }
            }
        }

        return -1;
       
    }

    public pickPixelFilter(glContext: WebGL2RenderingContext){

        const data = new Uint8Array(Math.ceil(Math.abs(this._pickingFilterHeight)*Math.abs(this._pickingFilterWidth)*4));

        for(let i = 0; i < data.length; i++){ // initializing data array with 255 to recognize not used positions
            data[i] = 255;
        }

        glContext.readPixels(
            this._pixelXFilter,            // x
            this._pixelYFilter,            // y
            this._pickingFilterWidth,                 // width
            this._pickingFilterHeight,                 // height
            glContext.RGBA,           // format
            glContext.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result

        let ids = new Set<number>();

        let dataByFour = Math.floor(data.length/4);

        for(let i = 0; i < dataByFour; i++){
            if(data[i*4] == 255 && data[i*4+1] == 255 && data[i*4+2] == 255 && data[i*4+3] == 255){ // some portions of the data array are not used
                continue;
            }else{
                ids.add(data[i*4] + (data[i*4+1] << 8) + (data[i*4+2] << 16) + (data[i*4+3] << 24));
            }
        }

        let idsBuildingsLevel = new Set<number>();

        let idsArray = Array.from(ids);

        for(const id of idsArray){
            idsBuildingsLevel.add(this.objectFromCell(id));
        }

        this._selectedFiltered = Array.from(idsBuildingsLevel);

    }

    public pickFoot(glContext: WebGL2RenderingContext){

        const data = new Uint8Array(4);

        glContext.readPixels(
            this._footPixelX,            // x
            this._footPixelY,            // y
            1,                 // width
            1,                 // height
            glContext.RGBA,           // format
            glContext.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result
        
        
        let id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

        let idBuildingLevel = this.objectFromCell(id);

        if(this.isFilteredIn(idBuildingLevel)){ // filtered in, therefore can be interacted
            this._currentPickedFoot = id;
    
            this._auxiliaryShader.setPickedFoot(this._currentPickedFoot, this._pickingForUpdate);
        }
    }

    public pickObject(glContext: WebGL2RenderingContext){
        const data = new Uint8Array(4);

        glContext.readPixels(
            this._objectPixelX,            // x
            this._objectPixelY,            // y
            1,                 // width
            1,                 // height
            glContext.RGBA,           // format
            glContext.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result

        let id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
        
        let idBuildingLevel = this.objectFromCell(id);

        console.log("id", idBuildingLevel);
        
        if(this.isFilteredIn(idBuildingLevel)){ // filtered in, therefore can be interacted
            this._auxiliaryShader.setPickedObject(id);
        }

    }

    public updatePickObjectPosition(pixelX: number, pixelY: number){
        this._pickObjectDirty = true;
        this._objectPixelX = pixelX;
        this._objectPixelY = pixelY;
    }

    public clearPicking(){
        this._currentPickedCells = new Set();
        this._pickedCells = new Set();
        this._auxiliaryShader.setPickedCells(this._pickedCells);
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
        return;
    }

    public updateShaderUniforms(data: any) {
        return;
    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        this._auxiliaryShader.setHighlightElements(coordinates, value);
    }

    public createUniforms(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');

        // this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }

    public bindUniforms(glContext: WebGL2RenderingContext, camera: any): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());

    }

    public setFramebufferAttachmentSizes(glContext: WebGL2RenderingContext, width: number, height: number) {
        
        glContext.bindTexture(glContext.TEXTURE_2D, this._texPicking);
        // define size and format of level 0
        const level = 0;
        const internalFormat = glContext.RGBA;
        const border = 0;
        const format = glContext.RGBA;
        const type = glContext.UNSIGNED_BYTE;
        const data = null;

        glContext.texImage2D(glContext.TEXTURE_2D, level, internalFormat,
                      width, height, border,
                      format, type, data);
       
        glContext.bindRenderbuffer(glContext.RENDERBUFFER, this._depthBuffer);
        glContext.renderbufferStorage(glContext.RENDERBUFFER, glContext.DEPTH_COMPONENT16, width, height);
    }

    public createTextures(glContext: WebGL2RenderingContext): void {

        // Create a texture to render to
        this._texPicking = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texPicking);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);

        // create a depth renderbuffer
        this._depthBuffer = glContext.createRenderbuffer();
        glContext.bindRenderbuffer(glContext.RENDERBUFFER, this._depthBuffer);

        // Create and bind the framebuffer
        this._frameBuffer = glContext.createFramebuffer();
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, this._frameBuffer);

        // attach the texture as the first color attachment
        const attachmentPoint = glContext.COLOR_ATTACHMENT0;
        const level = 0;

        glContext.framebufferTexture2D(glContext.FRAMEBUFFER, attachmentPoint, glContext.TEXTURE_2D, this._texPicking, level);

        glContext.framebufferRenderbuffer(glContext.FRAMEBUFFER, glContext.DEPTH_ATTACHMENT, glContext.RENDERBUFFER, this._depthBuffer);

        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null);

    }

    public bindTextures(glContext: WebGL2RenderingContext): void {
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, this._frameBuffer);
    }

    public createVertexArrayObject(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();

        this._cellIdsId = glContext.getAttribLocation(this._shaderProgram, 'cellIds');
        this._glCellIds = glContext.createBuffer();

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
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCellIds);
        // send data to gpu
        if (this._cellIdsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._cellIds), glContext.STATIC_DRAW
            );
        }
        
        // binds the VAO
        glContext.vertexAttribPointer(this._cellIdsId, 4, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._cellIdsId);

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }

        // this._colorOrTexDirty = false;
        this._coordsDirty = false;
        this._cellIdsDirty = false;
        // this._functionDirty = false;
    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.useProgram(this._shaderProgram); 
        
        if(this._resizeDirty){
            this.setFramebufferAttachmentSizes(glContext, glContext.canvas.width, glContext.canvas.height);
            this._resizeDirty = false;
        }

        // binds data
        this.bindTextures(glContext);
        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);

        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);

        if(this._pickFilterDirty){
            this.pickPixelFilter(glContext);
            this._pickFilterDirty = false;
        }

        if(this._clickDirty){
            this.pickPixel(glContext);
            this._clickDirty = false;
        }

        if(this._footDirty){
            this.pickFoot(glContext);
            this._footDirty = false;
            this._pickingForUpdate = false;
        }

        if(this._pickObjectDirty){
            this.pickObject(glContext);
            this._pickObjectDirty = false;
        }
        
        const sky = MapStyle.getColor('sky').concat([1.0]);

        let blankColorRGBA = []

        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);

        glContext.clearColor(blankColorRGBA[0], blankColorRGBA[1], blankColorRGBA[2], blankColorRGBA[3]);
        glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null);

    }
}
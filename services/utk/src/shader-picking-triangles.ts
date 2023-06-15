import { Shader } from "./shader";
import { Mesh } from "./mesh";

import { MapStyle } from './map-style';

// @ts-ignore
import vsPicking from './shaders/picking-triangles.vs';
// @ts-ignore
import fsPicking from './shaders/picking-triangles.fs';
import { AuxiliaryShaderTriangles } from "./auxiliaryShaderTriangles";

import { IKnot } from "./interfaces";

/**
 * This shader should only be used with the buildings layer
 */

export class ShaderPickingTriangles extends Shader {
    // Data to be rendered
    protected _coords:  number[] = [];
    protected _indices: number[] = [];
    protected _objectsIds: number[] = [];

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;
    protected _glObjectsIds: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _resizeDirty: boolean = true; 
    protected _pickObjectDirty: boolean = false;
    protected _objectsIdsDirty: boolean = false;
    protected _pickFilterDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _objectsIdsId = -1;


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
    protected _filtered: number[] = []; // coordinates to disconsider in further interactions

    protected _objectPixelX: number;
    protected _objectPixelY: number;

    protected _auxiliaryShader: AuxiliaryShaderTriangles;

    protected _coordsPerComp: number[];

    /**
     * 
     * @param {AuxiliaryShaderTriangles} auxiliaryShaderTriangles The shader responsible for receiving picking data
     */
    constructor(glContext: WebGL2RenderingContext, auxiliaryShaderTriangles: AuxiliaryShaderTriangles) {
        super(vsPicking, fsPicking, glContext);

        this._auxiliaryShader = auxiliaryShaderTriangles;

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

    getBboxFiltered(mesh: Mesh): number[]{
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

    public updateShaderGeometry(mesh: Mesh) {
        
        this._coordsDirty = true;
        this._objectsIdsDirty = true;

        this._coords = mesh.getCoordinatesVBO();
        
        this._indices = mesh.getIndicesVBO();

        this._objectsIds = [];

        this._coordsPerComp = mesh.getCoordsPerComp();

        for(let i = 0; i < this._coordsPerComp.length; i++){
            for(let k = 0; k < this._coordsPerComp[i]; k++){
                this._objectsIds.push(((i >>  0) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >>  8) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >> 16) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >> 24) & 0xFF) / 0xFF);
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

        this._selectedFiltered = Array.from(ids);
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
        
        if(this.isFilteredIn(id)){ // filtered in so can be interacted
            this._auxiliaryShader.setPickedObject(id);
        }

    }

    public updatePickObjectPosition(pixelX: number, pixelY: number){
        this._pickObjectDirty = true;
        this._objectPixelX = pixelX;
        this._objectPixelY = pixelY;
    }

    public clearPicking(){
        this._auxiliaryShader.clearPicking();
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

        this._objectsIdsId = glContext.getAttribLocation(this._shaderProgram, 'objectsIds');
        this._glObjectsIds = glContext.createBuffer();
        
        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();

        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }

    public bindVertexArrayObject(glContext: WebGL2RenderingContext, mesh: Mesh): void {
        if (!this._shaderProgram) {
            return;
        }

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glObjectsIds);
        // send data to gpu
        if (this._objectsIdsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._objectsIds), glContext.STATIC_DRAW
            );
        }
        
        // binds the VAO
        glContext.vertexAttribPointer(this._objectsIdsId, 4, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._objectsIdsId);

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

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }

        this._coordsDirty = false;
        this._objectsIdsDirty = false;
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
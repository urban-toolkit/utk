import { Shader } from "./shader";
import { Mesh } from "./mesh";

// @ts-ignore
import vsAbsSurface from './shaders/absSurface.vs';
// @ts-ignore
import fsAbsSurface from './shaders/absSurface.fs';

import { TextureComponent } from "./texture";

import { IKnot } from "./interfaces";

/**
 * This shader should only be used with the buildings layer
 */

export class ShaderAbstractSurface extends Shader{
    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glFunction: WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _functionDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _functionId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _textureLocation: WebGLUniformLocation | null = null;

    // Image textures
    // protected _texComponentsGliphs: TextureComponent[];

    // Surface abstraction
    protected _absSurfaces: {indices: number[], coords: number[], functionValues: number[], texComponent: TextureComponent, code: number}[] = [];
    protected _currentIndexTexture: number;

    // Footprint surface
    protected _footprintSurfaces: {indices: number[], coords: number[], functionValues: number[], texComponent: TextureComponent, code: number}[] = [];

    // If a abs surface ("abs") or a footprint plot is being rendered ("foot")
    protected _currentSurfaceType: string;

    protected _filtered: number[] = [];


    constructor(glContext: WebGL2RenderingContext) {
        super(vsAbsSurface, fsAbsSurface, glContext);

        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures();
    }

    /**
     * Get a HTMLImageElement[] containing all the images used in the abstract surfaces
     */
    public getAbsSurfacesImages(){
        let images: HTMLImageElement[] = [];
        
        this._absSurfaces.forEach((surface) => {
            if(surface.texComponent.htmlImage){
                images.push(surface.texComponent.htmlImage);
            }
        });

        return images
    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        throw Error("The abstract surface shader can not highlight elements");
    }

    // TODO: get income data from a mesh object not a list
    public updateShaderGeometry(mesh: Mesh) {
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords()

        for(let i = 0; i < totalNumberOfCoords; i++){
            this._filtered.push(1.0); // 1 true to include
        }
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
    }

    public updateShaderUniforms(data: any) {
    }

    public createTextures(){
    }

    public setFiltered(filtered: number[]){ 
        if(filtered.length == 0){
            this._filtered = Array(this._filtered.length).fill(1.0);
        }else{
            this._filtered = filtered;
        }

        // this._filteredDirty = true;
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

    public bindTextures(glContext: WebGL2RenderingContext): void {
        glContext.uniform1i(this._textureLocation, 0); // texture unit 0

        glContext.activeTexture(glContext.TEXTURE0);

        let surfaces = [];

        if(this._currentSurfaceType == "abs"){
            surfaces = this._absSurfaces;
        }else if(this._currentSurfaceType == "foot"){
            surfaces = this._footprintSurfaces;
        }else{
            throw new Error("Type "+this._currentSurfaceType+" does not exist");
        }

        let texComponent = surfaces[this._currentIndexTexture].texComponent;

        glContext.bindTexture(glContext.TEXTURE_2D, texComponent.texImage);
    }

    public createVertexArrayObject(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();

        // Creates the function id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        this._glFunction = glContext.createBuffer();

        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }

    public bindVertexArrayObject(glContext: WebGL2RenderingContext, mesh: Mesh): void {
        if (!this._shaderProgram) {
            return;
        }

        let surfaces = [];

        if(this._currentSurfaceType == "abs"){
            surfaces = this._absSurfaces;
        }else if(this._currentSurfaceType == "foot"){
            surfaces = this._footprintSurfaces;
        }else{
            throw new Error("Type "+this._currentSurfaceType+" does not exist");
        }

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        
        glContext.bufferData(
            glContext.ARRAY_BUFFER, new Float32Array(surfaces[this._currentIndexTexture].coords), glContext.STATIC_DRAW
        );
        
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu

        glContext.bufferData(
            glContext.ARRAY_BUFFER, new Float32Array(surfaces[this._currentIndexTexture].functionValues), glContext.STATIC_DRAW
        );

        glContext.vertexAttribPointer(this._functionId, 2, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);     

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu

        glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(surfaces[this._currentIndexTexture].indices), glContext.STATIC_DRAW);

    }

    /**
     * 
     * @param glContext WebGL context
     * @param image HTMLImageElement for the surface texture
     * @param coords coordinates of the four corners of the surface
     * @param indices indices of the triangles of the surface
     * @param functionValues texture coordinates
     * @param type "abs" for abstract surfaces, "foot" for footprint plot
     * @param code a unique code that identify the surface
     */
    public addSurface(glContext: WebGL2RenderingContext, image: HTMLImageElement, coords: number[], indices: number[], functionValues: number[], type: string = "abs", code: number){

        let newTextureComponent = new TextureComponent(glContext);
        newTextureComponent.loadTextureFromHtml(image);

        if(type == "abs"){
            this._absSurfaces.push({indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code});
        }else if(type == "foot"){
            this._footprintSurfaces.push({indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code});
        }else{
            throw new Error("Type "+type+" does not exist");
        }

    }

    /**
     * Updates the a specific surface previouly created
     * 
     * @param glContext WebGL context
     * @param image HTMLImageElement for the surface texture
     * @param coords coordinates of the four corners of the surface
     * @param indices indices of the triangles of the surface
     * @param functionValues texture coordinates
     * @param type "abs" for abstract surfaces, "foot" for footprint plot
     * @param code a unique code that identify the surface
     */
    public updateSurface(glContext: WebGL2RenderingContext, image: HTMLImageElement, coords: number[], indices: number[], functionValues: number[], type: string = "abs", code: number){
        
        let surfaces: {indices: number[], coords: number[], functionValues: number[], texComponent: TextureComponent, code: number}[] = [];
        
        let newTextureComponent = new TextureComponent(glContext);
        newTextureComponent.loadTextureFromHtml(image);

        if(type == "abs"){
            surfaces = this._absSurfaces;
        }else if(type == "foot"){
            surfaces = this._footprintSurfaces;
        }

        for(let i = 0; i < surfaces.length; i++){
            if(surfaces[i].code == code){
                surfaces[i] = {indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code};
            }
        }
    }

    public clearSurfaces(){
        this.clearFootprintPlots();
        this.clearAbsSurfaces();
    }

    public clearFootprintPlots(){
        this._footprintSurfaces = [];
    }

    public clearAbsSurfaces(){
        this._absSurfaces = [];
    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.useProgram(this._shaderProgram);

        this.bindUniforms(glContext, camera);
        
        glContext.stencilFunc(
            glContext.ALWAYS,     // the test
            2,            // reference value
            0xFF,         // mask
        );

        glContext.stencilOp(
            glContext.KEEP,     // what to do if the stencil test fails
            glContext.KEEP,     // what to do if the depth test fails
            glContext.REPLACE,     // what to do if both tests pass
        );

        // render footprint plots first
        for(let i = 0; i < this._footprintSurfaces.length; i++){
            // binds data
            this._currentIndexTexture = i; // used in bindVertexArrayObject and bindTextures (bypassing function signature defined in shader.ts)
            this._currentSurfaceType = "foot";
            this.bindVertexArrayObject(glContext, mesh);
            this.bindTextures(glContext);
            // draw the geometry
            glContext.drawElements(glPrimitive, 6, glContext.UNSIGNED_INT, 0); // each surface has 6 indices elements
        }

        // // Only passes when stencil == 0 (there is no abstract surface)
        glContext.stencilFunc(
            glContext.EQUAL,     // the test
            0,            // reference value
            0xFF,         // mask
        );

        glContext.stencilOp(
            glContext.KEEP,     // what to do if the stencil test fails
            glContext.KEEP,     // what to do if the depth test fails
            glContext.KEEP,     // what to do if both tests pass
        );

        // render the surfaces later
        for(let i = 0; i < this._absSurfaces.length; i++){
            // binds data
            this._currentIndexTexture = i; // used in bindVertexArrayObject and bindTextures (bypassing function signature defined in shader.ts)
            this._currentSurfaceType = "abs";
            this.bindVertexArrayObject(glContext, mesh);
            this.bindTextures(glContext);
            // draw the geometry
            glContext.drawElements(glPrimitive, 6, glContext.UNSIGNED_INT, 0); // each surface has 6 indices elements
        }

    }


}
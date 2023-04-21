import { Shader } from "./shader";
import { Mesh } from "./mesh";

import { ColorMap } from "./colormap";

// @ts-ignore
import vsSmoothColorMap from './shaders/smoothColorMap.vs';
// @ts-ignore
import fsSmoothColorMap from './shaders/smoothColorMap.fs';

import { IKnot } from "./interfaces";

import { AuxiliaryShaderTriangles } from "./auxiliaryShaderTriangles";

const d3 = require('d3');

export class ShaderSmoothColorMap extends AuxiliaryShaderTriangles {
    // Data to be rendered
    protected _coords:  number[] = [];
    protected _normals: number[] = [];
    protected _function: number[][] = [];
    protected _indices: number[] = [];
    protected _discardFuncInterval: number[] = [];
    protected _coordsPerComp: number[] = [];
    // protected _varyOpByFunc: number[] = [];

    // TODO remove
    protected _functionToUse: number = 0;

    // Color map definition
    private _colorMap: string | null = null;
    private _colorMapReverse: boolean = false;

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glNormals: WebGLBuffer | null = null;
    protected _glFunction: WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;
    protected _gldiscardFuncInterval: WebGLBuffer | null = null;
    protected _glColorOrPicked: WebGLBuffer | null = null;
    protected _glFiltered: WebGLBuffer | null = null;
    // protected _glVaryOpByFunc: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _functionDirty: boolean = false;
    protected _colorMapDirty: boolean = false;
    protected _colorOrPickedDirty: boolean = false;
    protected _filteredDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _normalsId = -1;
    protected _functionId = -1;
    protected _discardFuncIntervalId = -1;
    protected _colorOrPickedId = -1;
    protected _filteredId = -1;
    // protected _varyOpByFuncId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _uColorMap: WebGLUniformLocation | null = null;

    // Color map texture
    protected _texColorMap: WebGLTexture | null;

    //Picking
    protected _colorOrPicked: number[] = [];
    protected _currentPickedElement: number; // stores the index of the currently picked element
    protected _filtered: number[] = [];

    constructor(glContext: WebGL2RenderingContext, colorMap: string = "interpolateReds", colorMapReverse: boolean = false) {
        super(vsSmoothColorMap, fsSmoothColorMap, glContext);

        // saves the layer color
        this._colorMap = colorMap;
        this._colorMapReverse = colorMapReverse;

        // creathe dhe shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }

    get currentPickedElement(): number{
        return this._currentPickedElement;
    }

    public updateShaderGeometry(mesh: Mesh) {
        this._coordsDirty = true;
        this._filteredDirty = true;

        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._discardFuncInterval = mesh.getDiscardFuncIntervalVBO();

        this._coordsPerComp = mesh.getCoordsPerComp();

        let totalNumberOfCoords = mesh.getTotalNumberOfCoords()

        // start showing only colors without filters by default
        for(let i = 0; i < totalNumberOfCoords; i++){
            this._colorOrPicked.push(0.0);
            this._filtered.push(1.0); // 1 true to include
        }

        // this._varyOpByFunc = mesh.getVaryOpByFuncVBO();
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
        this._function = mesh.getFunctionVBO(knot.id);

        console.log('surface', d3.extent(this._function[this._functionToUse]));

        let scale = d3.scaleLinear().domain(d3.extent(this._function[this._functionToUse])).range([0,1]);

        for(let i = 0; i < this._function[this._functionToUse].length; i++){
            this._function[this._functionToUse][i] = scale(this._function[this._functionToUse][i]);
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

        // Set the parameters so we can render any size image.
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
        // set which texture units to render with.
        glContext.uniform1i(this._uColorMap, 0);

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

        this._colorOrPickedId = glContext.getAttribLocation(this._shaderProgram, 'inColorOrPicked');
        this._glColorOrPicked = glContext.createBuffer();

        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();

        // Creates the coords id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        // Creates the function id
        this._glFunction = glContext.createBuffer();

        this._discardFuncIntervalId = glContext.getAttribLocation(this._shaderProgram, 'inDiscardFuncInterval');
        this._gldiscardFuncInterval = glContext.createBuffer();

        // this._varyOpByFuncId = glContext.getAttribLocation(this._shaderProgram, 'varyOpByFunc');
        // this._glVaryOpByFunc = glContext.createBuffer();

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

        glContext.vertexAttribPointer(this._functionId, 1, glContext.FLOAT, false, 0, 0);
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

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._gldiscardFuncInterval);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._discardFuncInterval), glContext.STATIC_DRAW
            );
        }
        
        glContext.vertexAttribPointer(this._discardFuncIntervalId, 2, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._discardFuncIntervalId);    

        // binds the position buffer
        // glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glVaryOpByFunc);
        // // send data to gpu
        // if (this._coordsDirty) {
        //     glContext.bufferData(
        //         glContext.ARRAY_BUFFER, new Float32Array(this._varyOpByFunc), glContext.STATIC_DRAW
        //     );
        // }

        // glContext.vertexAttribPointer(this._varyOpByFuncId, 1, glContext.FLOAT, false, 0, 0);
        // glContext.enableVertexAttribArray(this._varyOpByFuncId);    

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }

        this._coordsDirty = false;
        this._functionDirty = false;
        this._colorOrPickedDirty = false;
        this._filteredDirty = false;
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

    public clearPicking(){

        for(let i = 0; i < this._colorOrPicked.length; i++){
            this._colorOrPicked[i] = 0;
        }

        this._colorOrPickedDirty = true;
    }

    public setPickedObject(objectId: number): void {
        
        this._currentPickedElement = objectId;

        let readCoords = 0;
        for(let i = 0; i < this._coordsPerComp.length; i++){
            if(objectId == i){
                break;
            }

            readCoords += this._coordsPerComp[i];
        }

        for(let i = 0; i < this._coordsPerComp[objectId]; i++){
            if(this._colorOrPicked[readCoords+i] == 1){
                this._colorOrPicked[readCoords+i] = 0;
            }else if(this._colorOrPicked[readCoords+i] == 0){
                this._colorOrPicked[readCoords+i] = 1;
            }
        }

        this._colorOrPickedDirty = true;

    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        // glContext.enable(glContext.BLEND);
        // glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);

        glContext.useProgram(this._shaderProgram);

        // binds data
        this.bindUniforms(glContext, camera);

        if(glPrimitive != glContext.POINTS){
            glContext.stencilFunc(
                glContext.GEQUAL,     // the test
                zOrder,            // reference value
                0xFF,         // mask
            );
    
            glContext.stencilOp(
                glContext.KEEP,     // what to do if the stencil test fails
                glContext.KEEP,     // what to do if the depth test fails
                glContext.REPLACE,     // what to do if both tests pass
            );
        }

        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);

        if(glPrimitive == glContext.POINTS){
            // draw the geometry
            glContext.drawElements(glPrimitive, this._coords.length/3, glContext.UNSIGNED_INT, 0);
        }else{
            // draw the geometry
            glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        }


        // glContext.disable(glContext.BLEND);
    }
}
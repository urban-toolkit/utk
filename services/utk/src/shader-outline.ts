import { Shader } from "./shader";
import { Mesh } from "./mesh";

// @ts-ignore
import vsOutline from './shaders/outline.vs';
// @ts-ignore
import fsOutline from './shaders/outline.fs';

import { IKnot } from "./interfaces";

/**
 * This shader should only be used with the buildings layer
 */

export class ShaderOutline extends Shader {
    // Data to be rendered
    protected _coords:  number[] = [];
    protected _normals: number[] = [];
    protected _indices: number[] = [];
    protected _heights: number[][] = [];
    protected _minHeights: number[][] = [];
    protected _uv: number[] = [];
    protected _heightInSection: number[] = [];
    protected _sectionHeight: number[] = [];
    protected _width: number[] = [];

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glNormals: WebGLBuffer | null = null;
    protected _glFunction: WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;
    protected _glColorOrTex: WebGLBuffer | null = null;
    protected _glUV: WebGLBuffer | null = null;
    protected _glWidth: WebGLBuffer | null = null;
    protected _glHeightInSection: WebGLBuffer | null = null;
    protected _glSectionHeight: WebGLBuffer | null = null;
    protected _glFiltered: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _filteredDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;
    protected _normalsId = -1;
    protected _functionId = -1;
    protected _colorOrTexId = -1;
    protected _uvId = -1;
    protected _widthId = -1;
    protected _heightInSectionId = -1;
    protected _sectionHeightId = -1;
    protected _filteredId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _textureLocation: WebGLUniformLocation | null = null;

    // Color map texture
    protected _texColorMap: WebGLTexture | null;

    // Picking
    protected _colorOrTexValues: number[] = [];
    protected _cellIdsByCoordinates: number[][] = [];
    protected _pickedCoordinates: number[] = []; // store index of coordinates not the coordinates themselves

    protected _auxCoords: number[] = [];
    protected _auxIndices: number[] = [];
    protected _auxNormals: number[] = [];
    protected _auxFunction: number[] = [];
    protected _auxColorOrTexValues: number[] = [];

    protected _filtered: number[] = [];

    constructor(glContext: WebGL2RenderingContext) {
        super(vsOutline, fsOutline, glContext);

        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);

    }

    public updateShaderGeometry(mesh: Mesh) {
        this._coordsDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._heights = mesh.getHeightsVBO();
        this._minHeights = mesh.getMinHeightsVBO();
        this._uv = mesh.getuvVBO();
        this._width = mesh.getWidthVBO();
        this._heightInSection = mesh.getHeightInSectionVBO();
        this._sectionHeight = mesh.getSectionHeightVBO();

        let totalNumberOfCoords = mesh.getTotalNumberOfCoords()

        for(let i = 0; i < totalNumberOfCoords; i++){
            this._filtered.push(1.0); // 1 true to include
        }
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
    }

    public updateShaderUniforms(data: any) {
    }

    public setFiltered(filtered: number[]){ 
        if(filtered.length == 0){
            this._filtered = Array(this._filtered.length).fill(1.0);
        }else{
            this._filtered = filtered;
        }
        this._filteredDirty = true;
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
    }

    public bindTextures(glContext: WebGL2RenderingContext): void {
    }

    public createVertexArrayObject(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        this._glCoords = glContext.createBuffer();

        this._uvId = glContext.getAttribLocation(this._shaderProgram, 'cornerValues');
        this._glUV = glContext.createBuffer();

        this._widthId = glContext.getAttribLocation(this._shaderProgram, 'inWallWidth');
        this._glWidth = glContext.createBuffer();

        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();

        this._sectionHeightId = glContext.getAttribLocation(this._shaderProgram, 'inSectionHeight');
        this._glSectionHeight = glContext.createBuffer();

        this._heightInSectionId = glContext.getAttribLocation(this._shaderProgram, 'inHeightInSection');
        this._glHeightInSection = glContext.createBuffer();

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
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glHeightInSection);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._heightInSection), glContext.STATIC_DRAW
            );
        }
        
        // binds the VAO
        glContext.vertexAttribPointer(this._heightInSectionId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._heightInSectionId);

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW
            );
        }

        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId); 

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glSectionHeight);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._sectionHeight), glContext.STATIC_DRAW
            );
        }
        
        // binds the VAO
        glContext.vertexAttribPointer(this._sectionHeightId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._sectionHeightId);

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glUV);
        // send data to gpu
        if (this._coordsDirty) {

            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._uv), glContext.STATIC_DRAW
            );
        }

        // binds the VAO
        glContext.vertexAttribPointer(this._uvId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._uvId);

        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glWidth);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
                glContext.ARRAY_BUFFER, new Float32Array(this._width), glContext.STATIC_DRAW
            );
        }

        // binds the VAO
        glContext.vertexAttribPointer(this._widthId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._widthId);

        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);

        }

        this._coordsDirty = false;
        this._filteredDirty = false;
    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        throw Error("The outline shader can not highlight elements");
    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.disable(glContext.CULL_FACE);

        glContext.useProgram(this._shaderProgram);

        // binds data
        this.bindUniforms(glContext, camera);

        // Always pass. Setting the reference value to 1
        glContext.stencilFunc(
            glContext.ALWAYS,    // the test
            1,            // reference value
            0xFF,         // mask
        );

        // Set stencil to the reference value when both the stencil and depth tests pass
        glContext.stencilOp(
            glContext.KEEP,     // what to do if the stencil test fails
            glContext.KEEP,     // what to do if the depth test fails
            glContext.REPLACE,  // what to do if both tests pass
        );
        
        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);

        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);

        glContext.enable(glContext.CULL_FACE);

    }
}
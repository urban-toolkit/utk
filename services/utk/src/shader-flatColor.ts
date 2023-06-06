import { Shader } from "./shader";
import { Mesh } from "./mesh";

// @ts-ignore
import vsFlatColor from './shaders/flatColor.vs';
// @ts-ignore
import fsFlatColor from './shaders/flatColor.fs';

import { IKnot } from "./interfaces";

export class ShaderFlatColor extends Shader {

    // Data to be rendered
    protected _coords:  number[] = [];
    protected _indices: number[] = [];
    protected _coordsPerComp: number[] = [];

    // Global color used on the layer
    protected _globalColor: number[] = [];

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glIndices: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _uGlobalColor: WebGLUniformLocation | null = null;

    protected _filtered: number[] = [];

    constructor(glContext: WebGL2RenderingContext, color: number[]) {
        super(vsFlatColor, fsFlatColor, glContext);

        // saves the layer color
        this._globalColor = color;

        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
    }

    public updateShaderGeometry(mesh: Mesh) {
        this._coordsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._indices = mesh.getIndicesVBO();
        this._coordsPerComp = mesh.getCoordsPerComp();

        let totalNumberOfCoords = mesh.getTotalNumberOfCoords()

        for(let i = 0; i < totalNumberOfCoords; i++){
            this._filtered.push(1.0); // 1 true to include
        }
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
        return;
    }

    public updateShaderUniforms(data: any) {
        this._globalColor = <number[]> data;
    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        throw Error("The flat color shader can not highlight elements yet");
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
        this._uGlobalColor = glContext.getUniformLocation(this._shaderProgram, 'uGlobalColor');
    }

    public bindUniforms(glContext: WebGL2RenderingContext, camera: any): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
        glContext.uniform3fv(this._uGlobalColor, this._globalColor);
    }

    public createTextures(glContext: WebGL2RenderingContext): void {
        throw new Error("Method not implemented.");
    }

    public bindTextures(glContext: WebGL2RenderingContext): void {
        throw new Error("Method not implemented.");
    }

    public createVertexArrayObject(glContext: WebGL2RenderingContext): void {
        if (!this._shaderProgram) {
            return;
        }

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

        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(
            glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }

        this._coordsDirty = false;
    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.useProgram(this._shaderProgram);

        this.bindUniforms(glContext, camera);

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

        this.bindVertexArrayObject(glContext, mesh);

        if(glPrimitive == glContext.LINE_STRIP){ 
            let alreadyDrawn = 0;
            glContext.lineWidth(1);

            for(let i = 0; i < this._coordsPerComp.length; i++){ // draw each component individually
                glContext.drawArrays(glPrimitive, alreadyDrawn, this._coordsPerComp[i]);
                alreadyDrawn += this._coordsPerComp[i];

            }

        }else{
            // draw the geometry
            glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        }

    }
}
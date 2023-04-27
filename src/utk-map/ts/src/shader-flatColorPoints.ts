import { Shader } from "./shader";
import { Mesh } from "./mesh";

// @ts-ignore
import vsFlatColorPoints from './shaders/flatColorPoints.vs';
// @ts-ignore
import fsFlatColorPoints from './shaders/flatColorPoints.fs';

import { IKnot } from "./interfaces";

const d3 = require('d3');

export class ShaderFlatColorPoints extends Shader {

    // Data to be rendered
    protected _coords:  number[] = [];
    protected _function: number[][] = [];

    // Global color used on the layer
    protected _globalColor: number[] = [];

    // Data loaction on GPU
    protected _glCoords:  WebGLBuffer | null = null;
    protected _glFunction: WebGLBuffer | null = null;

    // Data has chaged
    protected _coordsDirty: boolean = false;
    protected _functionDirty: boolean = false;

    // Id of each property in the VAO
    protected _coordsId = -1;

    // Uniforms location
    protected _uModelViewMatrix: WebGLUniformLocation | null = null;
    protected _uProjectionMatrix: WebGLUniformLocation | null = null;
    protected _uWorldOrigin: WebGLUniformLocation | null = null;
    protected _uGlobalColor: WebGLUniformLocation | null = null;

    constructor(glContext: WebGL2RenderingContext, color: number[]) {
        super(vsFlatColorPoints, fsFlatColorPoints, glContext);

        // saves the layer color
        this._globalColor = color;

        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
    }

    public updateShaderGeometry(mesh: Mesh) {
        this._coordsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
    }

    public updateShaderData(mesh: Mesh, knot: IKnot): void {
        return;
    }

    public updateShaderUniforms(data: any) {
        this._globalColor = <number[]> data;
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

        this._coordsDirty = false;
    }

    public setFiltered(filtered: number[]){ 
    }

    public setHighlightElements(coordinates: number[], value: boolean): void {
        throw Error("Method not implemented yet");
    }

    public renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void {
        if (!this._shaderProgram) {
            return;
        }

        glContext.useProgram(this._shaderProgram);

        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);

        // glContext.drawElements(glPrimitive, this._coords.length/3, glContext.UNSIGNED_INT, 0);
        glContext.drawArrays(glPrimitive, 0, this._coords.length/3);

    }
}
import { Mesh } from "./mesh";

import { IKnot } from "./interfaces";

export abstract class Shader {

    // layer's shader
    protected _shaderProgram: WebGLShader;
    protected _currentKnot: IKnot; // current knot supplying abstract data for this layer

    /**
     * Default constructor
     * @param vsSource 
     * @param fsSource 
     * @param glContext 
     */
    constructor(vsSource: string, fsSource: string, glContext: WebGL2RenderingContext) {
        this.initShaderProgram(vsSource, fsSource, glContext);  
    }

    get currentKnot(): IKnot{
        return this._currentKnot;
    }

    /**
     * Update the VBOs of the layer
     * @param {Mesh} mesh Updates the mesh data 
     */
    public abstract updateShaderGeometry(mesh: Mesh): void;

    /**
     * Update the VBOs of the layer
     * @param {Mesh} mesh Updates the mesh data 
     */
    public abstract updateShaderData(mesh: Mesh, knot: IKnot): void;

    /**
    * Update the VBOs of the layer
    * @param {any} data Updates the layer data 
    */
    public abstract updateShaderUniforms(data: any): void;

    /**
     * Creates the uniforms name
     * @param {WebGL2RenderingContext} glContext WebGL context 
     */
    public abstract createUniforms(glContext: WebGL2RenderingContext): void;

    /**
     * Associates data to the uniforms
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {Camera} camera The camera object
     */
    public abstract bindUniforms(glContext: WebGL2RenderingContext, camera: any): void;

    /**
     * Creates the array of VBOs
     * @param {WebGL2RenderingContext} glContext WebGL context 
     */
    public abstract createTextures(glContext: WebGL2RenderingContext): void;

    /**
     * Associates data to the VBO
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {Mesh} mesh The layer mesh
     */
    public abstract bindTextures(glContext: WebGL2RenderingContext): void;

    /**
     * Creates the array of VBOs
     * @param {WebGL2RenderingContext} glContext WebGL context 
     */
    public abstract createVertexArrayObject(glContext: WebGL2RenderingContext): void;

    /**
     * Associates data to the VBO
     * @param {WebGL2RenderingContext} glContext WebGL context
     * @param {Mesh} mesh The layer mesh
     */
    public abstract bindVertexArrayObject(glContext: WebGL2RenderingContext, mesh: Mesh): void;

    /**
     * Render pass
     * @param {WebGL2RenderingContext} glContext WebGL context 
     * @param {Camera} camera The camera object 
     * @param {Mesh} mesh The layer mesh 
     */
    public abstract renderPass(glContext: WebGL2RenderingContext, glPrimitive: number, camera: any, mesh: Mesh, zOrder: number): void;

    /**
     * 
     * @param coordinates coordinates index to highlight
     */
    public abstract setHighlightElements(coordinates: number[], value: boolean): void;

    public abstract setFiltered(filtered: number[]): void;

    /**
    * Inits the layer's shader program
    * @param {string} vsSource Vertex shader source
    * @param {string} fsSource Fragment shader source
    * @param {WebGL2RenderingContext} glContext WebGL context
    */
    protected initShaderProgram(vsSource: string, fsSource: string, glContext: WebGL2RenderingContext): void {
        // load the shaders
        const vertexShader = this.buildShader(glContext.VERTEX_SHADER, vsSource, glContext);
        const fragmentShader = this.buildShader(glContext.FRAGMENT_SHADER, fsSource, glContext);

        // Create the shader program
        const shader = glContext.createProgram();
        // There was a problem loading the shaders
        if (!shader || !vertexShader || !fragmentShader) { return; }

        glContext.attachShader(shader, vertexShader);
        glContext.attachShader(shader, fragmentShader);
        glContext.linkProgram(shader);

        // If creating the shader program failed, alert
        if (!glContext.getProgramParameter(shader, glContext.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + glContext.getProgramInfoLog(shader));
        }

        // stores the shader
        this._shaderProgram = shader;
    }

    /**
     * Builds the layer shader
     * @param {number} type The shader type
     * @param {string} source The shader source string
     * @param {WebGL2RenderingContext} glContext The WebGL context
     * @returns {WebGLShader} The shader object
     */
    protected buildShader(type: number, source: string, glContext: WebGL2RenderingContext): WebGLShader | null {
        // creates the shader
        const shader = glContext.createShader(type);
        if (!shader) { return null; }

        // Send the source to the shader object
        glContext.shaderSource(shader, source);
        // Compile the shader program
        glContext.compileShader(shader);

        // See if it compiled successfully
        if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ');
            console.error(source);
            console.error(glContext.getShaderInfoLog(shader));

            glContext.deleteShader(shader);
            throw new Error('Unable to load the shader');
        }
        return shader;
    }

}

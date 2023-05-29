export class TextureComponent {

    protected _glContext: WebGL2RenderingContext;
    protected _texImage: WebGLTexture | null = null;
    protected _htmlImage: HTMLImageElement | null = null;

    constructor(glContext: WebGL2RenderingContext) {
        this._glContext = glContext;
    }

    get texImage(){
        return this._texImage;
    }

    get htmlImage(){
        return this._htmlImage;
    }

    // load image from html image element
    public loadTextureFromHtml(img: any){
        this._htmlImage = img;

        this._texImage = this._glContext.createTexture();

        // Now that the image has loaded make copy it to the texture.
        this._glContext.bindTexture(this._glContext.TEXTURE_2D, this._texImage);

        // Set the parameters so we can render any size image.
        this._glContext.texParameteri(this._glContext.TEXTURE_2D, this._glContext.TEXTURE_WRAP_S, this._glContext.CLAMP_TO_EDGE);
        this._glContext.texParameteri(this._glContext.TEXTURE_2D, this._glContext.TEXTURE_WRAP_T, this._glContext.CLAMP_TO_EDGE);
        this._glContext.texParameteri(this._glContext.TEXTURE_2D, this._glContext.TEXTURE_MIN_FILTER, this._glContext.NEAREST);
        this._glContext.texParameteri(this._glContext.TEXTURE_2D, this._glContext.TEXTURE_MAG_FILTER, this._glContext.NEAREST);

        // Upload the image into the texture
        this._glContext.texImage2D(this._glContext.TEXTURE_2D, 0, this._glContext.RGBA, this._glContext.RGBA,this._glContext.UNSIGNED_BYTE, img);
        this._glContext.generateMipmap(this._glContext.TEXTURE_2D);
    }

    /**
     * 
     * Calculates the distance between two vertexes in the list.
     * 
     * @param {number[]} vertices Flattened list with 3D vertices
     * @param {number} i Index of first vertice
     * @param {number} j Index of second vertice
     * @param {number} dim Dimensions of the vertices
     * @returns 
     */
    // public calcDistance(vertices: number[], i: number, j: number, dim = 3) {
    //     let sum = 0;
    //     for (let k = 0; k < dim; k++) {
    //         sum += Math.pow(vertices[dim * i + k] - vertices[dim * j + k], 2);
    //     }
    //     return Math.sqrt(sum);
    // }

    // TODO: get new version of the function
    /**
     * 
     * Creates a buffer of texture coordinates for the given vertices. Assumes vertices are ordered from top left to bottom right.
     * 
     * @param {number[]} vertices Flattened list of vertices you want to generate the texture coordinates for. They should be ordered from Top Left to Bottom Right. The number of vertices in each row should be the same. Results will be best if distances between vertices in each row are consistent.
     * @param x The number of vertices in each row
     * @param y The number of vertices in each column
     * @param dim Dimensions of the vertices
     * @returns Texture coordinates as a number[] where each two positions compose a coordinate
     */
    // public getTextureCoord(vertices: number[], x: number, y: number, dim: number = 3) {
    //     if (vertices.length / dim != x * y) {
    //         throw new Error("createTextureCoordBuffer : Number of vertices doesn't align with given dimensions.");
    //     }
    
    //     // Calculates X Distances
    //     let xDistances = [];
    //     for (let i = 0; i < y; i++) { // Row Indexing
    //         xDistances.push([0]);
    //         for (let j = 1; j < x; j++) {  // Column Indexing (Start at 1 because we already pushed [0])
    //             xDistances[i].push(xDistances[i][j - 1] + this.calcDistance(vertices, (i * x) + (j - 1), (i * x) + j), dim);
    //         }
    //     }
    
    //     // Calculates Y Distances
    //     let yDistances = []
    //     yDistances.push(Array(x).fill(0));
    //     for (let i = 1; i < y; i++) { // Row Indexing (Start at 1 cause we already pushed row of 0s)
    //         yDistances.push([]);
    //         for (let j = 0; j < x; j++) { // Column Indexing
    //             // Calculate moving up the rows here, not down (has to do with texture coordinate system)
    //             yDistances[i].push(yDistances[i - 1][j] + this.calcDistance(vertices, ((y - i) * x) + j, ((y - (i + 1)) * x) + j, dim));
    //         }
    //     }
    //     yDistances = yDistances.reverse();
    
    //     // Generates Texture Coordinates
    //     let textureCoordinates: number[] = [];
    //     for (let i = 0; i < y; i++) {
    //         for (let j = 0; j < x; j++) {
    //             const xDist = xDistances[i][j] / xDistances[i][x - 1];
    //             const yDist = yDistances[i][j] / yDistances[0][j];
    //             textureCoordinates = textureCoordinates.concat([xDist, yDist]);
    //         }
    //     }
    
    //     return textureCoordinates;

    // }


}

import { IFeatureGeometry, ILayerFeature, IJoinedLayer, IJoinedObjects } from "./interfaces";

/**
 * Half-Edge mesh component
 */
 export class MeshComponent {
    public dimension: number;

    public coordinates: number[] = [];
    public normals: number[] = [];
    public functions: {"knot": string, "timesteps": number[][]}[] = []; // all attached abtract data must come from a knot. functions always contain values between [0,1]
    public ids: number[] = [];
    public heights: number[] = [];
    public minHeights: number[] = [];
    public orientedEnvelope: number[][] = [];
    public sectionFootprint: number[][] = [];
    public uv: number[] = [];
    public width: number[] = [];
    public heightInSection: number[] = []; // the height of the coordinate inside a specific section of the building
    public sectionHeight: number[] = []; // the height of the section where the coordinate is
    public pointsPerSection: number[] = [];
    public discardFuncInterval: number[] = [-1,-1]; // indicates which coordinates of the mesh to discard in the redering process based on the function values
    public varyOpByFunc: number; // if the opacity should vary according to the function value

    public vertHe: number[] = [];
    public vTable: number[] = [];
    public oTable: number[] = [];

    constructor(dimension: number) {
        this.dimension = dimension;
    }

    nVertex(): number {
        return this.coordinates.length / this.dimension;
    }

    nHalfEdge(): number {
        return this.vTable.length;
    }

    nTriangle(): number {
        return this.vTable.length / 3;
    }

    trig(he: number): number {
        return Math.floor(he / 3);
    }

    next(he: number): number {
        return 3 * Math.floor(he / 3) + (he + 1) % 3;
    }

    prev(he: number): number {
        return 3 * Math.floor(he / 3) + (he + 2) % 3;
    }

}

export class Mesh {
    protected _dimension: number;
    protected _zOrder: number;
    protected _components: MeshComponent[];
    protected _allCoordinates: number[];
    protected _allIds: number[];
    protected _allIndices: number[];
    protected _allNormals: number[];
    protected _allFunctions: number[];
    protected _filtered: number[]; // filtered by coordinate

    /**
     * Mesh default constructor
     * @param dimension number of dimensions of the input vertices
     */
    constructor(dimension = 2, zOrder = 0) {
        // number of dimensions
        this._dimension = dimension;
        // z order
        this._zOrder = zOrder;
        // erases the components
        this._components = [];

        this._allCoordinates = [];
        this._allIds = [];
        this._allIndices = [];
        this._allNormals = [];
        this._allFunctions = [];
        this._filtered = [];

    }

    /**
     * Get the dimension of the vertices
     */
    get dimension(): number {
        return this._dimension;
    }

    get filtered(){
        return this._filtered;
    }

    /**
     * Converts the local component id to the global mesh id
     * @param cId Component Id
     * @param vId Vertex component Id 
     */
    vMeshId(cId: number, vId: number): number { // this is not being used and does not look correct
        let total = 0;
        for (let cId = 0; cId < cId; cId++) {
            total += this._components[cId].nVertex();
        }

        return total + vId;
    }

    /**
     * Converts the global mesh id to the local component id
     * @param vId Vertex mesh Id 
     */
    vCompId(vId: number): [number, number] {
        let cId = 0;
        while (vId > this._components[cId].nVertex()) {
            vId -= this._components[cId].nVertex();
            cId++;
        };

        return [cId, vId];
    }

    /**
     * Converts the local component id to the global mesh id
     * @param cId Component Id
     * @param vId Vertex component Id 
     */
    hMeshId(comp: number, heId: number): number {
        return 0;
    }

    /**
     * Converts the global mesh id to the local component id
     * @param hId Vertex mesh Id 
     */
     hCompId(hId: number): [number, number] {
        return [0, 0];
    }

    tMeshId(comp: number, tId: number): number {
        return 0;
    }

    tCompId(tId: number): [number, number] {
        return [0, 0];
    }    

    /**
     * 
     * @param data Layer data
     * @param updateNormals Force normals computation
     */
    load(data: ILayerFeature[], updateNormals = false, centroid:number[] | Float32Array = [0,0,0]): void {

        // boolean
        let computeNormals = false;

        // load each feature
        for (const feature of data) {

            const geometry = feature.geometry;

            this.addComponent(geometry, centroid);

            // if a component doesnt have normals
            if ( !('normals' in geometry) ) {
                computeNormals = true;
            }
        }

        // builds the data structure
        this.buildOpposites();
        this.buildVertexHe();
        this.fixOrientation();

        // recomputes the normals
        if (!computeNormals && !updateNormals) { return; }
        this.computeNormals();

        this._filtered = Array(this.getTotalNumberOfCoords()).fill(1);

    }

    // this function override all timesteps
    private setFunctionValues(functionValues: number[][], knotId: string, comp: MeshComponent){
        for(const funcVer of comp.functions){
            if(funcVer.knot == knotId){
                funcVer.timesteps = functionValues;
                return
            }
        }

        comp.functions.push({"knot": knotId, "timesteps": functionValues});
    }

    private getFunctionValues(knotId: string, comp: MeshComponent): number[][] | null {
        for(const funcVer of comp.functions){
            if(funcVer.knot == knotId){
                return funcVer.timesteps;
            }
        }

        return null;
    }

    loadFunctionData(functionValues: number[] | null = null, knotId: string){

        let functionIndex = 0;

        // load each feature
        for (const comp of this._components) {

            let coordinates = comp.coordinates;

            let functionValuesCurrentGeometry = [];

            if(functionValues != null){

                let coordsByThree = Math.trunc(coordinates.length/3);

                for(let i = 0; i < coordsByThree; i++){
                    functionValuesCurrentGeometry.push(functionValues[functionIndex]);
                    functionIndex += 1;
                }

                this.setFunctionValues([functionValuesCurrentGeometry], knotId, comp); // TODO: give support to different timesteps
            }
        }
    }

    /**
     * Adds a new component to the mesh.
     * @param geometry triangulation of the feature
     */
    // addComponent(geometry: IFeatureGeometry | IFeatureGeometry[], centroid : any) {
    addComponent(geometry: IFeatureGeometry, centroid : any) {
        // new component
        const comp = new MeshComponent(this._dimension);
       
        // check if an array was provided
        // const _geometry = (!Array.isArray(geometry)) ? [geometry] : geometry;
        const _geometry = [geometry];

        let nv = 0;
        // iterate over the geometry parts
        for (const part of _geometry) {

            part.coordinates.forEach( (v, i)  => {
                if(i%3 == 0) {
                    comp.coordinates.push(v - centroid[0]);
                }
                else if(i%3 == 1) {
                    comp.coordinates.push(v - centroid[1])
                }else if(i%3 === 2) {
                    // comp.coordinates.push(v + this._zOrder);
                    comp.coordinates.push(v);
                }
                
                    // } else {
                    // comp.coordinates.push(v)
                // }
            });

            if(part['varyOpByFunc'] !== undefined){
                comp.varyOpByFunc = part.varyOpByFunc;
            }

            if(part['discardFuncInterval'] !== undefined){
                comp.discardFuncInterval = part.discardFuncInterval;
            }

            if (part['normals'] !== undefined) {
                part.normals.forEach( v => comp.normals.push(v) );
            }

            // if (part['function'] !== undefined) {
            //     part.function.forEach( v => comp.function.push(v) );
            // }else {
            //     comp.function.push([]);
            //     for(let vid = 0; vid < part.coordinates.length / this._dimension; vid++) {
            //         comp.function[0].push(this._components.length);
            //     }
            // }

            if (part['indices'] !== undefined) {
                part.indices.forEach( v => comp.vTable.push(v + nv) );
            }

            if (part['ids'] !== undefined) {
                part.ids.forEach( v => comp.ids.push(v + nv) ); // add the ids to the component turning them into in relation to the other parts of this geometry
            }

            if(part['heights'] !== undefined){
                // part.heights.forEach( v => comp.heights.push(v + this._zOrder));
                part.heights.forEach( v => comp.heights.push(v));
            }

            if(part['minHeights'] !== undefined){
                // part.minHeights.forEach( v => comp.minHeights.push(v + this._zOrder));
                part.minHeights.forEach( v => comp.minHeights.push(v));
            }

            if(part['uv'] !== undefined){
                comp.uv = comp.uv.concat(part.uv);
            }

            if(part['width'] !== undefined){
                comp.width = comp.width.concat(part.width);
            }

            if(part['pointsPerSection'] !== undefined){
                comp.pointsPerSection = comp.pointsPerSection.concat(part.pointsPerSection);
            }

            if(part['orientedEnvelope'] !== undefined){
                part.orientedEnvelope.forEach((envelope) => {
                    comp.orientedEnvelope.push([]);
                    envelope.forEach((v, i) => {
                        let index = comp.orientedEnvelope.length - 1;

                        if(i%2 == 0){
                            comp.orientedEnvelope[index].push(v - centroid[0]);
                        }else if(i%2 == 1){
                            comp.orientedEnvelope[index].push(v - centroid[1]);
                        }
                    });
                    
                });
            }

            if(part['sectionFootprint'] !== undefined){
                part.sectionFootprint.forEach((footprint) => {
                    comp.sectionFootprint.push([]);
                    footprint.forEach((v, i) => {
                        let index = comp.sectionFootprint.length - 1;

                        if(i%2 == 0){
                            comp.sectionFootprint[index].push(v - centroid[0]);
                        }else if(i%2 == 1){
                            comp.sectionFootprint[index].push(v - centroid[1]);
                        }
                    });
                    
                });
            }

            nv += part.coordinates.length / this._dimension;
        }

        // activate to make the outline work
        // let readPoints = 0;
        // for(let i = 0; i < comp.pointsPerSection.length; i++){
        //     for(let j = 0; j < comp.pointsPerSection[i]; j++){
        //         comp.heightInSection.push(comp.coordinates[(j+readPoints)*3+2] - comp.minHeights[i]);
        //         comp.sectionHeight.push(comp.heights[i] - comp.minHeights[i]);
        //     }
        //     readPoints += comp.pointsPerSection[i];
        // }

        // saves the component
        this._components.push(comp);
    }

    buildOpposites() {
        for (const comp of this._components) {
            // number of half-edges
            const len = comp.nHalfEdge();

            // fills with invalid
            comp.oTable = new Array(len).fill(-1);

            // edges map
            const edges = new Map();

            // iterates over the base half-edges
            for (let he = 0; he < len; he++) {
                const nhe = comp.next(he);
                const e = [comp.vTable[he], comp.vTable[nhe]].sort().join();

                if (edges.has(e)) {
                    const op = edges.get(e);
                    comp.oTable[op] = he;
                    comp.oTable[he] = op;

                    edges.delete(e);
                }
                else {
                    edges.set(e, he);
                }
            }
        }
    }

    buildVertexHe() {

        for (const comps of this._components) {

            //  gets the number of vertices
            const len = comps.coordinates.length / this._dimension;
            // fills with invalid
            comps.vertHe = new Array(len).fill(-1);

            // computes the table
            comps.vTable.forEach( (v, he) => {
                // current half-edge associated to vertex v
                const vhe = comps.vertHe[v];
                
                // updates if still invalid or not at the boundary
                if (vhe === -1 || comps.oTable[vhe] !== -1) {
                    comps.vertHe[v] = he;
                }
            });
        }
    }

    fixOrientation() {
        for (const comp of this._components) {
            const stack = [];
            const visited = new Array(comp.nTriangle()).fill(false);

            // adds the half-edges of the first triangle
            stack.push(0, 1, 2);

            while( stack.length ) {
                const he = <number> stack.pop();

                // boundary he
                const op = comp.oTable[he];
                if (op < 0) { continue; }

                // already visited
                const trig = comp.trig(op);
                if (visited[trig]) { continue; }

                // get the vertices of he
                const v1 = comp.vTable[he];
                const v2 = comp.vTable[comp.next(he)];
            
                // get the vertices of the opposite
                const v3 = comp.vTable[op];
                const v4 = comp.vTable[comp.next(op)];
            
                // orientation is not correct
                if ( !(v1 === v4 && v2 === v3) ) {
                    // gets the next and prev
                    const no = comp.next(op);
                    const po = comp.prev(op);

                    // vertices of next and pref
                    const vNo = comp.vTable[no];
                    const vOp = comp.vTable[op];

                    // changes the vTable
                    comp.vTable[no] = vOp;
                    comp.vTable[op] = vNo;

                    // opposites of next and prev
                    const oNo = comp.oTable[no];
                    const oPo = comp.oTable[po];

                    // changes the oTable
                    comp.oTable[no] = oPo;
                    comp.oTable[po] = oNo;

                    if(oPo >= 0) { comp.oTable[oPo] = no; }
                    if(oNo >= 0) { comp.oTable[oNo] = po; }
                }

                // mark as visited
                visited[trig] = true;

                // add the half-edges to the stack
                stack.push(op, comp.next(op), comp.prev(op));
            }
        }
        
    }

    computeNormals() {
        for (const comp of this._components) {
            //  gets the number of vertices
            const len = comp.coordinates.length;

            // gets the dimension
            const dim = comp.dimension;

            // fills with invalid
            comp.normals = new Array(len).fill(0);

            // iterate over the triangles
            for (let che = 0; che < comp.nHalfEdge(); che += 3) {
                // half-edges of the face
                const phe = comp.prev(che);
                const nhe = comp.next(che);

                // vertices of the face
                const vaId = dim * comp.vTable[che];
                const vbId = dim * comp.vTable[nhe];
                const vcId = dim * comp.vTable[phe];

                // coordinates of the vertices of the face
                const va = comp.coordinates.slice(vaId, 3);
                const vb = comp.coordinates.slice(vbId, 3);
                const vc = comp.coordinates.slice(vcId, 3);

                // face vectors
                const ab = [vb[0]-va[0], vb[1]-va[1], vb[2]-va[2]];
                const ac = [vc[0]-va[0], vc[1]-va[1], vc[2]-va[2]];

                // cross product
                const cross = [ab[1]*ac[2] - ab[2]*ac[1], ab[2]*ac[0] - ab[0]*ac[2], ab[0]*ac[1]- ab[1]*ac[0]];

                // accumulate
                for (let i = 0; i < 3; i++) {
                    comp.normals[vaId + i] += cross[i];
                    comp.normals[vbId + i] += cross[i];
                    comp.normals[vcId + i] += cross[i];
                }
            }

            // normalization
            for (let vid = 0; vid < comp.normals.length; vid += 3) {
                const nrm = comp.normals.slice(vid, 3);
                const size = Math.sqrt(nrm[0]*nrm[0] + nrm[1]*nrm[1] + nrm[2]*nrm[2]);

                // divide each coordinate
                for (let i = 0; i < 3; i++) {
                    comp.normals[vid + i] /= size;
                    comp.normals[vid + i] /= size;
                    comp.normals[vid + i] /= size;
                }
            }
        }
    }

    getCoordinatesVBO(): number[] {
        // const vbo: number[] = [];

        // for (const comp of this._components) {
        //     comp.coordinates.forEach( v => vbo.push(v) );
        // }

        if(this._allCoordinates.length == 0){
            for (const comp of this._components) {
                comp.coordinates.forEach( v => this._allCoordinates.push(v) );
            }   
        }

        return this._allCoordinates;

        // return vbo;
    }

    getNormalsVBO(): number[] {
        // const vbo: number[] = [];

        // for (const comp of this._components) {
        //     comp.normals.forEach( v => vbo.push(v) );
        // }

        // return vbo;

        if(this._allNormals.length == 0){
            for (const comp of this._components) {
                comp.normals.forEach( v => this._allNormals.push(v) );
            }   
        }

        return this._allNormals;

    }

    getFunctionVBO(knotId: string): number[][] {
        const vbo: number[][] = [];

        if(this._components.length > 0){

            let timesteps = this.getFunctionValues(knotId, this._components[0]);

            if(timesteps == null){
                throw new Error(knotId+" not found while trying to recover function values");
            }

            for(let i = 0; i < timesteps.length; i++){ // all components must have the same number of functions
                // let min =  Infinity;
                // let max = -Infinity;
                // for (const comp of this._components) {
                //     // max value
                //     max = comp.function[i].reduce(function(a, b) {
                //         return Math.max(a, b);
                //     }, max);
        
                //     // min value
                //     min = comp.function[i].reduce(function(a, b) {
                //         return Math.min(a, b);
                //     }, min);
                // };
                
                let currentFunctionVbo: number[] = [];

                for (const comp of this._components) { 

                    // if((max - min) == 0){
                    //     comp.function[i].forEach( v => currentFunctionVbo.push( v ) );
                    // }else{
                    //     comp.function[i].forEach( v => currentFunctionVbo.push( (v - min) / (max - min) ) );
                    // }

                    let currentTimesteps = this.getFunctionValues(knotId, comp);

                    if(currentTimesteps == null){
                        throw new Error("Knot id not found while trying to recover function values");
                    }

                    currentTimesteps[i].forEach( v => currentFunctionVbo.push( v ) );
                }

                vbo.push(currentFunctionVbo);
            }
        }

        return vbo;
    }

    getIndicesVBO() {
        // const vbo: number[] = [];

        // let nv = 0;
        // for (const comp of this._components) {
        //     comp.vTable.forEach( v => vbo.push(v + nv) );

        //     nv += comp.nVertex();
        // }

        // return vbo;
    
        let nv = 0;
        if(this._allIndices.length == 0){
            for (const comp of this._components) {
                comp.vTable.forEach( v => this._allIndices.push(v + nv) ); // turn ids into global in relation to all geometries

                nv += comp.nVertex();
            }   
        }

        return this._allIndices;
    
    }

    getIdsVBO(){
        // const vbo: number[] = [];
        
        // let nv = 0;
        // for (const comp of this._components) {
        //     comp.ids.forEach( v => vbo.push(v + nv) ); // turn ids into global in relation to all geometries

        //     nv += comp.nVertex();
        // }

        // return vbo;

        let nv = 0;
        if(this._allIds.length == 0){
            for (const comp of this._components) {
                comp.ids.forEach( v => this._allIds.push(v + nv) ); // turn ids into global in relation to all geometries

                nv += comp.nVertex();
            }   
        }

        return this._allIds;
    }

    getHeightsVBO(){
        let vbo: number[][] = [];
        
        for (const comp of this._components) {
            vbo.push(comp.heights); 
        }

        return vbo;
    }

    getMinHeightsVBO(){
        let vbo: number[][] = [];
        
        for (const comp of this._components) {
            vbo.push(comp.minHeights); 
        }

        return vbo; 
    }

    getOrientedEnvelopesVBO(){
        let vbo: number[][][] = [];
        
        for (const comp of this._components) {
            vbo.push(comp.orientedEnvelope); 
        }

        return vbo; 
    }

    getSectionFootprintVBO(){
        let vbo: number[][][] = [];
        
        for (const comp of this._components) {
            vbo.push(comp.sectionFootprint); 
        }

        return vbo; 
    }

    getuvVBO(){
        let vbo: number[] = [];

        for (const comp of this._components) {
            vbo = vbo.concat(comp.uv);
        }

        return vbo;
    }

    getWidthVBO(){
        let vbo: number[] = [];

        for (const comp of this._components) {
            vbo = vbo.concat(comp.width);
        }

        return vbo;
    }

    getHeightInSectionVBO(){
        let vbo: number[] = [];

        for (const comp of this._components) {
            vbo = vbo.concat(comp.heightInSection);
        }

        return vbo;
    }

    getSectionHeightVBO(){
        let vbo: number[] = [];

        for (const comp of this._components) {
            vbo = vbo.concat(comp.sectionHeight);
        }

        return vbo;
    }

    getDiscardFuncIntervalVBO(){
        let vbo: number[] = [];

        for(const comp of this._components){
            for(let i = 0; i < comp.coordinates.length/this._dimension; i++){
                vbo.push(comp.discardFuncInterval[0]);
                vbo.push(comp.discardFuncInterval[1]);
            }
        }

        return vbo;
    }

    // getVaryOpByFuncVBO(){
    //     let vbo: number[] = [];

    //     for(const comp of this._components){
    //         for(let i = 0; i < comp.coordinates.length/this._dimension; i++){
    //             vbo.push(comp.varyOpByFunc);
    //         }
    //     }

    //     return vbo;
    // }

    /**
     * Returns the amount of cells in the mesh
     */
    idsLength(){
        let count = 0;
        
        for (const comp of this._components) {
            count += comp.ids.length;
        }

        return count;
    }

    /**
     * Returns the cells ids of all coordinates in the mesh. The cells ids are separated by component of the mesh. But in the context of each component each position stores the cell id of the corresponding coordinate as if the whole vector was flat.
     */
    getIdsCoordinates(){

        let coordsLength = this.getTotalNumberOfCoords();
        let ids = this.getIdsVBO();
        let indices = this.getIndicesVBO();

        let idsCoordinates = new Array(coordsLength);

        // get the cell id of each coordinate
        indices.forEach((elem, indexIndices) => {
            let triangleIndex = Math.floor(indexIndices/this.dimension);

            idsCoordinates[elem] = ids[triangleIndex];
        });

        let idsCoodinatesPerComponent: number[][] = [];
        
        let indexOffset = 0;
        // separate the vector considering the components
        for(const comp of this._components){
            idsCoodinatesPerComponent.push([]);
            
            for(let i = 0; i < comp.coordinates.length/comp.dimension; i++){
                let shiftedIndex = i + indexOffset;
                idsCoodinatesPerComponent[idsCoodinatesPerComponent.length-1].push(idsCoordinates[shiftedIndex]);
            }
            
            indexOffset += comp.coordinates.length/comp.dimension;
            
        }
        
        return idsCoodinatesPerComponent;

    }

    /**
     * Returns the number of coordinates per component of the mesh
     */
    getCoordsPerComp(){

        let coordsPerComp: number[] = [];

        // separate the vector considering the components
        for(const comp of this._components){
            coordsPerComp.push(comp.coordinates.length/this._dimension);
            
        }

        return coordsPerComp;
    }

    /**
     * Returns the number of ids per component of the mesh
     */
    getNumIdsPerComp(){

        let idsPerComp: number[] = [];

        for(const comp of this._components){
            idsPerComp.push(comp.ids.length);
        }

        return idsPerComp;

    }

    /**
     * 
     * @returns total number of coordinates considering all components
     */
    getTotalNumberOfCoords(){
        let numberOfCoords = 0; 

        for (const comp of this._components) { 
            numberOfCoords += comp.nVertex();
        }

        return numberOfCoords;
    }

    setFiltered(bbox: number[]){

        // let include = [91,109,42,108,168,2,125,137,78,80,90,152,92,94,74,77,123,151,95,21,124,41,1,81,11,73,82,75,172,126,93,12,3,79,119];

        if(bbox.length != 0){
            this._filtered = Array(this.getTotalNumberOfCoords()).fill(0);

            let readCoords = 0;
    
            for(let i = 0; i < this._components.length; i++){
                let comp = this._components[i];
    
                let inside = false;
    
                for(let j = 0; j < comp.coordinates.length/comp.dimension; j++){
    
                    let x = comp.coordinates[j*comp.dimension];
                    let y = comp.coordinates[j*comp.dimension+1];
    
                    // check if coordinate is inside bbox
                    if(x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3]){
                        inside = true;
                        break;
                    }
                }
    
                if(inside){
                    for(let j = 0; j < comp.coordinates.length/comp.dimension; j++){
                        this._filtered[readCoords+j] = 1;
                    }
                }
    
                // if(include.includes(i)){
                //     for(let j = 0; j < comp.coordinates.length/comp.dimension; j++){
                //         this._filtered[readCoords+j] = 1;
                //     }
                // }

                readCoords += comp.coordinates.length/comp.dimension;


            }
        }else{
            this._filtered = Array(this.getTotalNumberOfCoords()).fill(1);
        }
    }

    // get ids of all attached knots
    getAttachedKnots(){

        let knots = [];

        for(const functionValues of this._components[0].functions){
            knots.push(functionValues.knot);
        }

        return knots;

    }

}
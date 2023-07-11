import * as React$1 from 'react';
import React__default, { useRef, useEffect, useState, forwardRef, useContext } from 'react';
import require$$2 from 'react-dom';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Button, Row, Col, Form } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 * Layer types definition
 */
var LayerType;
(function (LayerType) {
    LayerType["POINTS_LAYER"] = "POINTS_LAYER";
    LayerType["LINES_2D_LAYER"] = "LINES_2D_LAYER";
    LayerType["LINES_3D_LAYER"] = "LINES_3D_LAYER";
    LayerType["TRIANGLES_2D_LAYER"] = "TRIANGLES_2D_LAYER";
    LayerType["TRIANGLES_3D_LAYER"] = "TRIANGLES_3D_LAYER";
    LayerType["BUILDINGS_LAYER"] = "BUILDINGS_LAYER";
    LayerType["HEATMAP_LAYER"] = "HEATMAP_LAYER";
})(LayerType || (LayerType = {}));
/**
 * Render styles definition
 */
var RenderStyle;
(function (RenderStyle) {
    RenderStyle["FLAT_COLOR"] = "FLAT_COLOR";
    RenderStyle["FLAT_COLOR_MAP"] = "FLAT_COLOR_MAP";
    RenderStyle["FLAT_COLOR_POINTS"] = "FLAT_COLOR_POINTS";
    RenderStyle["SMOOTH_COLOR"] = "SMOOTH_COLOR";
    RenderStyle["SMOOTH_COLOR_MAP"] = "SMOOTH_COLOR_MAP";
    RenderStyle["SMOOTH_COLOR_MAP_TEX"] = "SMOOTH_COLOR_MAP_TEX";
    RenderStyle["PICKING"] = "PICKING";
    RenderStyle["ABSTRACT_SURFACES"] = "ABSTRACT_SURFACES";
    RenderStyle["OUTLINE"] = "OUTLINE";
    RenderStyle["COLOR_POINTS"] = "COLOR_POINTS";
})(RenderStyle || (RenderStyle = {}));
/**
 * Supported aggregations for layer linking
 */
var OperationType;
(function (OperationType) {
    OperationType["MAX"] = "MAX";
    OperationType["MIN"] = "MIN";
    OperationType["AVG"] = "AVG";
    OperationType["SUM"] = "SUM";
    OperationType["COUNT"] = "COUNT";
    OperationType["NONE"] = "NONE";
    OperationType["DISCARD"] = "DISCARD"; // keeps the first element of the join
})(OperationType || (OperationType = {}));
var ViewArrangementType;
(function (ViewArrangementType) {
    ViewArrangementType["LINKED"] = "LINKED";
    ViewArrangementType["EMBEDDED"] = "EMBEDDED";
})(ViewArrangementType || (ViewArrangementType = {}));
var PlotArrangementType;
(function (PlotArrangementType) {
    PlotArrangementType["LINKED"] = "LINKED";
    PlotArrangementType["SUR_EMBEDDED"] = "SUR_EMBEDDED";
    PlotArrangementType["FOOT_EMBEDDED"] = "FOOT_EMBEDDED";
})(PlotArrangementType || (PlotArrangementType = {}));
var SpatialRelationType;
(function (SpatialRelationType) {
    SpatialRelationType["INTERSECTS"] = "INTERSECTS";
    SpatialRelationType["CONTAINS"] = "CONTAINS";
    SpatialRelationType["WITHIN"] = "WITHIN";
    SpatialRelationType["TOUCHES"] = "TOUCHES";
    SpatialRelationType["CROSSES"] = "CROSSES";
    SpatialRelationType["OVERLAPS"] = "OVERLAPS";
    SpatialRelationType["NEAREST"] = "NEAREST";
    SpatialRelationType["DIRECT"] = "DIRECT";
    SpatialRelationType["INNERAGG"] = "INNERAGG"; // used when chaging geometry levels inside the same layer
})(SpatialRelationType || (SpatialRelationType = {}));
var LevelType;
(function (LevelType) {
    LevelType["COORDINATES"] = "COORDINATES";
    LevelType["OBJECTS"] = "OBJECTS";
    LevelType["COORDINATES3D"] = "COORDINATES3D";
})(LevelType || (LevelType = {}));
var InteractionType;
(function (InteractionType) {
    InteractionType["BRUSHING"] = "BRUSHING";
    InteractionType["PICKING"] = "PICKING";
    InteractionType["NONE"] = "NONE";
})(InteractionType || (InteractionType = {}));
var PlotInteractionType;
(function (PlotInteractionType) {
    PlotInteractionType["CLICK"] = "CLICK";
    PlotInteractionType["HOVER"] = "HOVER";
    PlotInteractionType["BRUSH"] = "BRUSH";
})(PlotInteractionType || (PlotInteractionType = {}));
var ComponentIdentifier;
(function (ComponentIdentifier) {
    ComponentIdentifier["MAP"] = "MAP";
    ComponentIdentifier["WIDGET"] = "WIDGET";
})(ComponentIdentifier || (ComponentIdentifier = {}));
var WidgetType;
(function (WidgetType) {
    WidgetType["TOGGLE_KNOT"] = "TOGGLE_KNOT";
    WidgetType["RESOLUTION"] = "RESOLUTION";
    WidgetType["GRAMMAR"] = "GRAMMAR";
    WidgetType["SEARCH"] = "SEARCH";
})(WidgetType || (WidgetType = {}));
/**
 * Mapview interaction status
 */
class MapViewStatu {
    static IDLE = 0;
    static DRAG = 1; // left click dragging
    static DRAG_RIGHT = 2;
}

/**
 * Half-Edge mesh component
 */
class MeshComponent {
    dimension;
    coordinates = [];
    normals = [];
    functions = []; // all attached abtract data must come from a knot. functions always contain values between [0,1]
    ids = [];
    heights = [];
    minHeights = [];
    orientedEnvelope = [];
    sectionFootprint = [];
    uv = [];
    width = [];
    heightInSection = []; // the height of the coordinate inside a specific section of the building
    sectionHeight = []; // the height of the section where the coordinate is
    pointsPerSection = [];
    discardFuncInterval = [-1, -1]; // indicates which coordinates of the mesh to discard in the redering process based on the function values
    varyOpByFunc; // if the opacity should vary according to the function value
    vertHe = [];
    vTable = [];
    oTable = [];
    constructor(dimension) {
        this.dimension = dimension;
    }
    nVertex() {
        return this.coordinates.length / this.dimension;
    }
    nHalfEdge() {
        return this.vTable.length;
    }
    nTriangle() {
        return this.vTable.length / 3;
    }
    trig(he) {
        return Math.floor(he / 3);
    }
    next(he) {
        return 3 * Math.floor(he / 3) + (he + 1) % 3;
    }
    prev(he) {
        return 3 * Math.floor(he / 3) + (he + 2) % 3;
    }
}
class Mesh {
    _dimension;
    _zOrder;
    _components;
    _allCoordinates;
    _allIds;
    _allIndices;
    _allNormals;
    _allFunctions;
    _filtered; // filtered by coordinate
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
    get dimension() {
        return this._dimension;
    }
    get filtered() {
        return this._filtered;
    }
    /**
     * Converts the local component id to the global mesh id
     * @param cId Component Id
     * @param vId Vertex component Id
     */
    vMeshId(cId, vId) {
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
    vCompId(vId) {
        let cId = 0;
        while (vId > this._components[cId].nVertex()) {
            vId -= this._components[cId].nVertex();
            cId++;
        }
        return [cId, vId];
    }
    /**
     * Converts the local component id to the global mesh id
     * @param cId Component Id
     * @param vId Vertex component Id
     */
    hMeshId(comp, heId) {
        return 0;
    }
    /**
     * Converts the global mesh id to the local component id
     * @param hId Vertex mesh Id
     */
    hCompId(hId) {
        return [0, 0];
    }
    tMeshId(comp, tId) {
        return 0;
    }
    tCompId(tId) {
        return [0, 0];
    }
    /**
     *
     * @param data Layer data
     * @param updateNormals Force normals computation
     */
    load(data, updateNormals = false, centroid = [0, 0, 0]) {
        // boolean
        let computeNormals = false;
        // load each feature
        for (const feature of data) {
            const geometry = feature.geometry;
            this.addComponent(geometry, centroid);
            // if a component doesnt have normals
            if (!('normals' in geometry)) {
                computeNormals = true;
            }
        }
        // builds the data structure
        this.buildOpposites();
        this.buildVertexHe();
        this.fixOrientation();
        // recomputes the normals
        if (!computeNormals && !updateNormals) {
            return;
        }
        this.computeNormals();
        this._filtered = Array(this.getTotalNumberOfCoords()).fill(1);
    }
    // this function override all timesteps
    setFunctionValues(functionValues, knotId, comp) {
        for (const funcVer of comp.functions) {
            if (funcVer.knot == knotId) {
                funcVer.timesteps = functionValues;
                return;
            }
        }
        comp.functions.push({ "knot": knotId, "timesteps": functionValues });
    }
    getFunctionValues(knotId, comp) {
        for (const funcVer of comp.functions) {
            if (funcVer.knot == knotId) {
                return funcVer.timesteps;
            }
        }
        return null;
    }
    loadFunctionData(functionValues = null, knotId) {
        let functionIndex = 0;
        // load each feature
        for (const comp of this._components) {
            let coordinates = comp.coordinates;
            let functionValuesCurrentGeometry = [];
            if (functionValues != null) {
                let coordsByThree = Math.trunc(coordinates.length / 3);
                for (let i = 0; i < coordsByThree; i++) {
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
    addComponent(geometry, centroid) {
        // new component
        const comp = new MeshComponent(this._dimension);
        // check if an array was provided
        // const _geometry = (!Array.isArray(geometry)) ? [geometry] : geometry;
        const _geometry = [geometry];
        let nv = 0;
        // iterate over the geometry parts
        for (const part of _geometry) {
            part.coordinates.forEach((v, i) => {
                if (i % 3 == 0) {
                    comp.coordinates.push(v - centroid[0]);
                }
                else if (i % 3 == 1) {
                    comp.coordinates.push(v - centroid[1]);
                }
                else if (i % 3 === 2) {
                    // comp.coordinates.push(v + this._zOrder);
                    comp.coordinates.push(v);
                }
                // } else {
                // comp.coordinates.push(v)
                // }
            });
            if (part['varyOpByFunc'] !== undefined) {
                comp.varyOpByFunc = part.varyOpByFunc;
            }
            if (part['discardFuncInterval'] !== undefined) {
                comp.discardFuncInterval = part.discardFuncInterval;
            }
            if (part['normals'] !== undefined) {
                part.normals.forEach(v => comp.normals.push(v));
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
                part.indices.forEach(v => comp.vTable.push(v + nv));
            }
            if (part['ids'] !== undefined) {
                part.ids.forEach(v => comp.ids.push(v + nv)); // add the ids to the component turning them into in relation to the other parts of this geometry
            }
            if (part['heights'] !== undefined) {
                // part.heights.forEach( v => comp.heights.push(v + this._zOrder));
                part.heights.forEach(v => comp.heights.push(v));
            }
            if (part['minHeights'] !== undefined) {
                // part.minHeights.forEach( v => comp.minHeights.push(v + this._zOrder));
                part.minHeights.forEach(v => comp.minHeights.push(v));
            }
            if (part['uv'] !== undefined) {
                comp.uv = comp.uv.concat(part.uv);
            }
            if (part['width'] !== undefined) {
                comp.width = comp.width.concat(part.width);
            }
            if (part['pointsPerSection'] !== undefined) {
                comp.pointsPerSection = comp.pointsPerSection.concat(part.pointsPerSection);
            }
            if (part['orientedEnvelope'] !== undefined) {
                part.orientedEnvelope.forEach((envelope) => {
                    comp.orientedEnvelope.push([]);
                    envelope.forEach((v, i) => {
                        let index = comp.orientedEnvelope.length - 1;
                        if (i % 2 == 0) {
                            comp.orientedEnvelope[index].push(v - centroid[0]);
                        }
                        else if (i % 2 == 1) {
                            comp.orientedEnvelope[index].push(v - centroid[1]);
                        }
                    });
                });
            }
            if (part['sectionFootprint'] !== undefined) {
                part.sectionFootprint.forEach((footprint) => {
                    comp.sectionFootprint.push([]);
                    footprint.forEach((v, i) => {
                        let index = comp.sectionFootprint.length - 1;
                        if (i % 2 == 0) {
                            comp.sectionFootprint[index].push(v - centroid[0]);
                        }
                        else if (i % 2 == 1) {
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
            comps.vTable.forEach((v, he) => {
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
            while (stack.length) {
                const he = stack.pop();
                // boundary he
                const op = comp.oTable[he];
                if (op < 0) {
                    continue;
                }
                // already visited
                const trig = comp.trig(op);
                if (visited[trig]) {
                    continue;
                }
                // get the vertices of he
                const v1 = comp.vTable[he];
                const v2 = comp.vTable[comp.next(he)];
                // get the vertices of the opposite
                const v3 = comp.vTable[op];
                const v4 = comp.vTable[comp.next(op)];
                // orientation is not correct
                if (!(v1 === v4 && v2 === v3)) {
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
                    if (oPo >= 0) {
                        comp.oTable[oPo] = no;
                    }
                    if (oNo >= 0) {
                        comp.oTable[oNo] = po;
                    }
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
                const ab = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]];
                const ac = [vc[0] - va[0], vc[1] - va[1], vc[2] - va[2]];
                // cross product
                const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
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
                const size = Math.sqrt(nrm[0] * nrm[0] + nrm[1] * nrm[1] + nrm[2] * nrm[2]);
                // divide each coordinate
                for (let i = 0; i < 3; i++) {
                    comp.normals[vid + i] /= size;
                    comp.normals[vid + i] /= size;
                    comp.normals[vid + i] /= size;
                }
            }
        }
    }
    getCoordinatesVBO() {
        // const vbo: number[] = [];
        // for (const comp of this._components) {
        //     comp.coordinates.forEach( v => vbo.push(v) );
        // }
        if (this._allCoordinates.length == 0) {
            for (const comp of this._components) {
                comp.coordinates.forEach(v => this._allCoordinates.push(v));
            }
        }
        return this._allCoordinates;
        // return vbo;
    }
    getNormalsVBO() {
        // const vbo: number[] = [];
        // for (const comp of this._components) {
        //     comp.normals.forEach( v => vbo.push(v) );
        // }
        // return vbo;
        if (this._allNormals.length == 0) {
            for (const comp of this._components) {
                comp.normals.forEach(v => this._allNormals.push(v));
            }
        }
        return this._allNormals;
    }
    getFunctionVBO(knotId) {
        const vbo = [];
        if (this._components.length > 0) {
            let timesteps = this.getFunctionValues(knotId, this._components[0]);
            if (timesteps == null) {
                return vbo;
            }
            for (let i = 0; i < timesteps.length; i++) { // all components must have the same number of functions
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
                let currentFunctionVbo = [];
                for (const comp of this._components) {
                    // if((max - min) == 0){
                    //     comp.function[i].forEach( v => currentFunctionVbo.push( v ) );
                    // }else{
                    //     comp.function[i].forEach( v => currentFunctionVbo.push( (v - min) / (max - min) ) );
                    // }
                    let currentTimesteps = this.getFunctionValues(knotId, comp);
                    if (currentTimesteps == null) {
                        throw new Error("Knot id not found while trying to recover function values");
                    }
                    currentTimesteps[i].forEach(v => currentFunctionVbo.push(v));
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
        if (this._allIndices.length == 0) {
            for (const comp of this._components) {
                comp.vTable.forEach(v => this._allIndices.push(v + nv)); // turn ids into global in relation to all geometries
                nv += comp.nVertex();
            }
        }
        return this._allIndices;
    }
    getIdsVBO() {
        // const vbo: number[] = [];
        // let nv = 0;
        // for (const comp of this._components) {
        //     comp.ids.forEach( v => vbo.push(v + nv) ); // turn ids into global in relation to all geometries
        //     nv += comp.nVertex();
        // }
        // return vbo;
        let nv = 0;
        if (this._allIds.length == 0) {
            for (const comp of this._components) {
                comp.ids.forEach(v => this._allIds.push(v + nv)); // turn ids into global in relation to all geometries
                nv += comp.nVertex();
            }
        }
        return this._allIds;
    }
    getHeightsVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo.push(comp.heights);
        }
        return vbo;
    }
    getMinHeightsVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo.push(comp.minHeights);
        }
        return vbo;
    }
    getOrientedEnvelopesVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo.push(comp.orientedEnvelope);
        }
        return vbo;
    }
    getSectionFootprintVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo.push(comp.sectionFootprint);
        }
        return vbo;
    }
    getuvVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo = vbo.concat(comp.uv);
        }
        return vbo;
    }
    getWidthVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo = vbo.concat(comp.width);
        }
        return vbo;
    }
    getHeightInSectionVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo = vbo.concat(comp.heightInSection);
        }
        return vbo;
    }
    getSectionHeightVBO() {
        let vbo = [];
        for (const comp of this._components) {
            vbo = vbo.concat(comp.sectionHeight);
        }
        return vbo;
    }
    getDiscardFuncIntervalVBO() {
        let vbo = [];
        for (const comp of this._components) {
            for (let i = 0; i < comp.coordinates.length / this._dimension; i++) {
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
    idsLength() {
        let count = 0;
        for (const comp of this._components) {
            count += comp.ids.length;
        }
        return count;
    }
    /**
     * Returns the cells ids of all coordinates in the mesh. The cells ids are separated by component of the mesh. But in the context of each component each position stores the cell id of the corresponding coordinate as if the whole vector was flat.
     */
    getIdsCoordinates() {
        let coordsLength = this.getTotalNumberOfCoords();
        let ids = this.getIdsVBO();
        let indices = this.getIndicesVBO();
        let idsCoordinates = new Array(coordsLength);
        // get the cell id of each coordinate
        indices.forEach((elem, indexIndices) => {
            let triangleIndex = Math.floor(indexIndices / this.dimension);
            idsCoordinates[elem] = ids[triangleIndex];
        });
        let idsCoodinatesPerComponent = [];
        let indexOffset = 0;
        // separate the vector considering the components
        for (const comp of this._components) {
            idsCoodinatesPerComponent.push([]);
            for (let i = 0; i < comp.coordinates.length / comp.dimension; i++) {
                let shiftedIndex = i + indexOffset;
                idsCoodinatesPerComponent[idsCoodinatesPerComponent.length - 1].push(idsCoordinates[shiftedIndex]);
            }
            indexOffset += comp.coordinates.length / comp.dimension;
        }
        return idsCoodinatesPerComponent;
    }
    /**
     * Returns the number of coordinates per component of the mesh
     */
    getCoordsPerComp() {
        let coordsPerComp = [];
        // separate the vector considering the components
        for (const comp of this._components) {
            coordsPerComp.push(comp.coordinates.length / this._dimension);
        }
        return coordsPerComp;
    }
    /**
     * Returns the number of ids per component of the mesh
     */
    getNumIdsPerComp() {
        let idsPerComp = [];
        for (const comp of this._components) {
            idsPerComp.push(comp.ids.length);
        }
        return idsPerComp;
    }
    /**
     *
     * @returns total number of coordinates considering all components
     */
    getTotalNumberOfCoords() {
        let numberOfCoords = 0;
        for (const comp of this._components) {
            numberOfCoords += comp.nVertex();
        }
        return numberOfCoords;
    }
    setFiltered(bbox) {
        // let include = [91,109,42,108,168,2,125,137,78,80,90,152,92,94,74,77,123,151,95,21,124,41,1,81,11,73,82,75,172,126,93,12,3,79,119];
        if (bbox.length != 0) {
            this._filtered = Array(this.getTotalNumberOfCoords()).fill(0);
            let readCoords = 0;
            for (let i = 0; i < this._components.length; i++) {
                let comp = this._components[i];
                let inside = false;
                for (let j = 0; j < comp.coordinates.length / comp.dimension; j++) {
                    let x = comp.coordinates[j * comp.dimension];
                    let y = comp.coordinates[j * comp.dimension + 1];
                    // check if coordinate is inside bbox
                    if (x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3]) {
                        inside = true;
                        break;
                    }
                }
                if (inside) {
                    for (let j = 0; j < comp.coordinates.length / comp.dimension; j++) {
                        this._filtered[readCoords + j] = 1;
                    }
                }
                // if(include.includes(i)){
                //     for(let j = 0; j < comp.coordinates.length/comp.dimension; j++){
                //         this._filtered[readCoords+j] = 1;
                //     }
                // }
                readCoords += comp.coordinates.length / comp.dimension;
            }
        }
        else {
            this._filtered = Array(this.getTotalNumberOfCoords()).fill(1);
        }
    }
    // get ids of all attached knots
    getAttachedKnots() {
        let knots = [];
        for (const functionValues of this._components[0].functions) {
            knots.push(functionValues.knot);
        }
        return knots;
    }
}

/// <reference types="@types/webgl2" />
class Layer {
    // layer id
    _id;
    // layer type
    _type;
    // style key used to color the layer
    _styleKey;
    // render styles available
    _renderStyle;
    // store link information with other layers
    _joinedLayers;
    _joinedObjects;
    // layer's camera
    _camera;
    _centroid;
    _mesh;
    constructor(id, type, styleKey, renderStyle = [], centroid = [0, 0, 0], dimension, zOrder) {
        this._id = id;
        this._type = type;
        this._styleKey = styleKey;
        // this._colorMap = colorMap;
        this._renderStyle = renderStyle;
        this._centroid = centroid;
        this._mesh = new Mesh(dimension, zOrder);
    }
    setJoinedJson(joinedJson) {
        this._joinedLayers = joinedJson.joinedLayers;
        this._joinedObjects = joinedJson.joinedObjects;
    }
    /**
     * Accessor for the layer id
     */
    get id() {
        return this._id;
    }
    /**
     * Accessor for the layer style
     */
    get style() {
        return this._styleKey;
    }
    get joinedLayers() {
        return this._joinedLayers;
    }
    get joinedObjects() {
        return this._joinedObjects;
    }
    /**
     * Sends the camera to the layer
     */
    set camera(camera) {
        this._camera = camera;
    }
    get mesh() {
        return this._mesh;
    }
    set mesh(mesh) {
        this._mesh = mesh;
    }
    get centroid() {
        return this._centroid;
    }
    get renderStyle() {
        return this._renderStyle;
    }
}

class Shader {
    // layer's shader
    _shaderProgram;
    _currentKnot; // current knot supplying abstract data for this layer
    /**
     * Default constructor
     * @param vsSource
     * @param fsSource
     * @param glContext
     */
    constructor(vsSource, fsSource, glContext) {
        this.initShaderProgram(vsSource, fsSource, glContext);
    }
    get currentKnot() {
        return this._currentKnot;
    }
    /**
    * Inits the layer's shader program
    * @param {string} vsSource Vertex shader source
    * @param {string} fsSource Fragment shader source
    * @param {WebGL2RenderingContext} glContext WebGL context
    */
    initShaderProgram(vsSource, fsSource, glContext) {
        // load the shaders
        const vertexShader = this.buildShader(glContext.VERTEX_SHADER, vsSource, glContext);
        const fragmentShader = this.buildShader(glContext.FRAGMENT_SHADER, fsSource, glContext);
        // Create the shader program
        const shader = glContext.createProgram();
        // There was a problem loading the shaders
        if (!shader || !vertexShader || !fragmentShader) {
            return;
        }
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
    buildShader(type, source, glContext) {
        // creates the shader
        const shader = glContext.createShader(type);
        if (!shader) {
            return null;
        }
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

/**
 * Abstract class for the picking auxiliary shaders
 */
class AuxiliaryShader extends Shader {
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var Accent = colors("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

var Dark2 = colors("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

var Paired = colors("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

var Pastel1 = colors("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

var Pastel2 = colors("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

var Set1 = colors("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

var Set2 = colors("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

var Set3 = colors("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

var Tableau10 = colors("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color$1, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color$1(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

const radians$1 = Math.PI / 180;
const degrees$1 = 180 / Math.PI;

var A$1 = -0.14861,
    B$1 = +1.78277,
    C$1 = -0.29227,
    D$1 = -0.90649,
    E$1 = +1.97294,
    ED$1 = E$1 * D$1,
    EB$1 = E$1 * B$1,
    BC_DA = B$1 * C$1 - D$1 * A$1;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED$1 * r - EB$1 * g) / (BC_DA + ED$1 - EB$1),
      bl = b - l,
      k = (E$1 * (g - l) - C$1 * bl) / D$1,
      s = Math.sqrt(k * k + bl * bl) / (E$1 * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * degrees$1 - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix$2(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix$2, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * radians$1,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A$1 * cosh + B$1 * sinh)),
      255 * (l + a * (C$1 * cosh + D$1 * sinh)),
      255 * (l + a * (E$1 * cosh)),
      this.opacity
    );
  }
}));

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

function basis$1(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

var constant$1 = x => () => x;

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color;
    for (i = 0; i < n; ++i) {
      color = rgb(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function(t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$1);

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var degrees = 180 / Math.PI;

var identity$1 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity$1 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}

function parseSvg(value) {
  if (value == null) return identity$1;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

function cubehelix$1(hue) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix(start, end) {
      var h = hue((start = cubehelix$2(start)).h, (end = cubehelix$2(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix.gamma = cubehelixGamma;

    return cubehelix;
  })(1);
}

cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var ramp$1 = scheme => rgbBasis(scheme[scheme.length - 1]);

var scheme$q = new Array(3).concat(
  "d8b365f5f5f55ab4ac",
  "a6611adfc27d80cdc1018571",
  "a6611adfc27df5f5f580cdc1018571",
  "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
  "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
  "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
  "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
  "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
  "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
).map(colors);

var BrBG = ramp$1(scheme$q);

var scheme$p = new Array(3).concat(
  "af8dc3f7f7f77fbf7b",
  "7b3294c2a5cfa6dba0008837",
  "7b3294c2a5cff7f7f7a6dba0008837",
  "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
  "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
  "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
  "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
  "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
  "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
).map(colors);

var PRGn = ramp$1(scheme$p);

var scheme$o = new Array(3).concat(
  "e9a3c9f7f7f7a1d76a",
  "d01c8bf1b6dab8e1864dac26",
  "d01c8bf1b6daf7f7f7b8e1864dac26",
  "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
  "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
  "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
  "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
  "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
  "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
).map(colors);

var PiYG = ramp$1(scheme$o);

var scheme$n = new Array(3).concat(
  "998ec3f7f7f7f1a340",
  "5e3c99b2abd2fdb863e66101",
  "5e3c99b2abd2f7f7f7fdb863e66101",
  "542788998ec3d8daebfee0b6f1a340b35806",
  "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
  "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
  "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
  "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
  "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors);

var PuOr = ramp$1(scheme$n);

var scheme$m = new Array(3).concat(
  "ef8a62f7f7f767a9cf",
  "ca0020f4a58292c5de0571b0",
  "ca0020f4a582f7f7f792c5de0571b0",
  "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
  "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
  "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
  "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
  "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
  "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
).map(colors);

var RdBu = ramp$1(scheme$m);

var scheme$l = new Array(3).concat(
  "ef8a62ffffff999999",
  "ca0020f4a582bababa404040",
  "ca0020f4a582ffffffbababa404040",
  "b2182bef8a62fddbc7e0e0e09999994d4d4d",
  "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
  "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
  "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
  "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
  "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
).map(colors);

var RdGy = ramp$1(scheme$l);

var scheme$k = new Array(3).concat(
  "fc8d59ffffbf91bfdb",
  "d7191cfdae61abd9e92c7bb6",
  "d7191cfdae61ffffbfabd9e92c7bb6",
  "d73027fc8d59fee090e0f3f891bfdb4575b4",
  "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
  "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
  "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
  "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
  "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
).map(colors);

var RdYlBu = ramp$1(scheme$k);

var scheme$j = new Array(3).concat(
  "fc8d59ffffbf91cf60",
  "d7191cfdae61a6d96a1a9641",
  "d7191cfdae61ffffbfa6d96a1a9641",
  "d73027fc8d59fee08bd9ef8b91cf601a9850",
  "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
  "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
  "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
  "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
  "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
).map(colors);

var RdYlGn = ramp$1(scheme$j);

var scheme$i = new Array(3).concat(
  "fc8d59ffffbf99d594",
  "d7191cfdae61abdda42b83ba",
  "d7191cfdae61ffffbfabdda42b83ba",
  "d53e4ffc8d59fee08be6f59899d5943288bd",
  "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
  "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
  "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
  "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
  "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
).map(colors);

var Spectral = ramp$1(scheme$i);

var scheme$h = new Array(3).concat(
  "e5f5f999d8c92ca25f",
  "edf8fbb2e2e266c2a4238b45",
  "edf8fbb2e2e266c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
).map(colors);

var BuGn = ramp$1(scheme$h);

var scheme$g = new Array(3).concat(
  "e0ecf49ebcda8856a7",
  "edf8fbb3cde38c96c688419d",
  "edf8fbb3cde38c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
).map(colors);

var BuPu = ramp$1(scheme$g);

var scheme$f = new Array(3).concat(
  "e0f3dba8ddb543a2ca",
  "f0f9e8bae4bc7bccc42b8cbe",
  "f0f9e8bae4bc7bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
).map(colors);

var GnBu = ramp$1(scheme$f);

var scheme$e = new Array(3).concat(
  "fee8c8fdbb84e34a33",
  "fef0d9fdcc8afc8d59d7301f",
  "fef0d9fdcc8afc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
).map(colors);

var OrRd = ramp$1(scheme$e);

var scheme$d = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(colors);

var PuBuGn = ramp$1(scheme$d);

var scheme$c = new Array(3).concat(
  "ece7f2a6bddb2b8cbe",
  "f1eef6bdc9e174a9cf0570b0",
  "f1eef6bdc9e174a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
).map(colors);

var PuBu = ramp$1(scheme$c);

var scheme$b = new Array(3).concat(
  "e7e1efc994c7dd1c77",
  "f1eef6d7b5d8df65b0ce1256",
  "f1eef6d7b5d8df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
).map(colors);

var PuRd = ramp$1(scheme$b);

var scheme$a = new Array(3).concat(
  "fde0ddfa9fb5c51b8a",
  "feebe2fbb4b9f768a1ae017e",
  "feebe2fbb4b9f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
).map(colors);

var RdPu = ramp$1(scheme$a);

var scheme$9 = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(colors);

var YlGnBu = ramp$1(scheme$9);

var scheme$8 = new Array(3).concat(
  "f7fcb9addd8e31a354",
  "ffffccc2e69978c679238443",
  "ffffccc2e69978c67931a354006837",
  "ffffccd9f0a3addd8e78c67931a354006837",
  "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
).map(colors);

var YlGn = ramp$1(scheme$8);

var scheme$7 = new Array(3).concat(
  "fff7bcfec44fd95f0e",
  "ffffd4fed98efe9929cc4c02",
  "ffffd4fed98efe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
).map(colors);

var YlOrBr = ramp$1(scheme$7);

var scheme$6 = new Array(3).concat(
  "ffeda0feb24cf03b20",
  "ffffb2fecc5cfd8d3ce31a1c",
  "ffffb2fecc5cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
).map(colors);

var YlOrRd = ramp$1(scheme$6);

var scheme$5 = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(colors);

var Blues = ramp$1(scheme$5);

var scheme$4 = new Array(3).concat(
  "e5f5e0a1d99b31a354",
  "edf8e9bae4b374c476238b45",
  "edf8e9bae4b374c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
).map(colors);

var Greens = ramp$1(scheme$4);

var scheme$3 = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(colors);

var Greys = ramp$1(scheme$3);

var scheme$2 = new Array(3).concat(
  "efedf5bcbddc756bb1",
  "f2f0f7cbc9e29e9ac86a51a3",
  "f2f0f7cbc9e29e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
).map(colors);

var Purples = ramp$1(scheme$2);

var scheme$1 = new Array(3).concat(
  "fee0d2fc9272de2d26",
  "fee5d9fcae91fb6a4acb181d",
  "fee5d9fcae91fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
).map(colors);

var Reds = ramp$1(scheme$1);

var scheme = new Array(3).concat(
  "fee6cefdae6be6550d",
  "feeddefdbe85fd8d3cd94701",
  "feeddefdbe85fd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
).map(colors);

var Oranges = ramp$1(scheme);

function cividis(t) {
  t = Math.max(0, Math.min(1, t));
  return "rgb("
      + Math.max(0, Math.min(255, Math.round(-4.54 - t * (35.34 - t * (2381.73 - t * (6402.7 - t * (7024.72 - t * 2710.57))))))) + ", "
      + Math.max(0, Math.min(255, Math.round(32.49 + t * (170.73 + t * (52.82 - t * (131.46 - t * (176.58 - t * 67.37))))))) + ", "
      + Math.max(0, Math.min(255, Math.round(81.24 + t * (442.36 - t * (2482.43 - t * (6167.24 - t * (6614.94 - t * 2475.67)))))))
      + ")";
}

var cubehelix = cubehelixLong(cubehelix$2(300, 0.5, 0.0), cubehelix$2(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix$2(-100, 0.75, 0.35), cubehelix$2(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix$2(260, 0.75, 0.35), cubehelix$2(80, 1.50, 0.8));

var c$2 = cubehelix$2();

function rainbow(t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  c$2.h = 360 * t - 100;
  c$2.s = 1.5 - 1.5 * ts;
  c$2.l = 0.8 - 0.9 * ts;
  return c$2 + "";
}

var c$1 = rgb(),
    pi_1_3 = Math.PI / 3,
    pi_2_3 = Math.PI * 2 / 3;

function sinebow(t) {
  var x;
  t = (0.5 - t) * Math.PI;
  c$1.r = 255 * (x = Math.sin(t)) * x;
  c$1.g = 255 * (x = Math.sin(t + pi_1_3)) * x;
  c$1.b = 255 * (x = Math.sin(t + pi_2_3)) * x;
  return c$1 + "";
}

function turbo(t) {
  t = Math.max(0, Math.min(1, t));
  return "rgb("
      + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", "
      + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", "
      + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))))
      + ")";
}

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

var d3$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    interpolateBlues: Blues,
    interpolateBrBG: BrBG,
    interpolateBuGn: BuGn,
    interpolateBuPu: BuPu,
    interpolateCividis: cividis,
    interpolateCool: cool,
    interpolateCubehelixDefault: cubehelix,
    interpolateGnBu: GnBu,
    interpolateGreens: Greens,
    interpolateGreys: Greys,
    interpolateInferno: inferno,
    interpolateMagma: magma,
    interpolateOrRd: OrRd,
    interpolateOranges: Oranges,
    interpolatePRGn: PRGn,
    interpolatePiYG: PiYG,
    interpolatePlasma: plasma,
    interpolatePuBu: PuBu,
    interpolatePuBuGn: PuBuGn,
    interpolatePuOr: PuOr,
    interpolatePuRd: PuRd,
    interpolatePurples: Purples,
    interpolateRainbow: rainbow,
    interpolateRdBu: RdBu,
    interpolateRdGy: RdGy,
    interpolateRdPu: RdPu,
    interpolateRdYlBu: RdYlBu,
    interpolateRdYlGn: RdYlGn,
    interpolateReds: Reds,
    interpolateSinebow: sinebow,
    interpolateSpectral: Spectral,
    interpolateTurbo: turbo,
    interpolateViridis: viridis,
    interpolateWarm: warm,
    interpolateYlGn: YlGn,
    interpolateYlGnBu: YlGnBu,
    interpolateYlOrBr: YlOrBr,
    interpolateYlOrRd: YlOrRd,
    schemeAccent: Accent,
    schemeBlues: scheme$5,
    schemeBrBG: scheme$q,
    schemeBuGn: scheme$h,
    schemeBuPu: scheme$g,
    schemeCategory10: category10,
    schemeDark2: Dark2,
    schemeGnBu: scheme$f,
    schemeGreens: scheme$4,
    schemeGreys: scheme$3,
    schemeOrRd: scheme$e,
    schemeOranges: scheme,
    schemePRGn: scheme$p,
    schemePaired: Paired,
    schemePastel1: Pastel1,
    schemePastel2: Pastel2,
    schemePiYG: scheme$o,
    schemePuBu: scheme$c,
    schemePuBuGn: scheme$d,
    schemePuOr: scheme$n,
    schemePuRd: scheme$b,
    schemePurples: scheme$2,
    schemeRdBu: scheme$m,
    schemeRdGy: scheme$l,
    schemeRdPu: scheme$a,
    schemeRdYlBu: scheme$k,
    schemeRdYlGn: scheme$j,
    schemeReds: scheme$1,
    schemeSet1: Set1,
    schemeSet2: Set2,
    schemeSet3: Set3,
    schemeSpectral: scheme$i,
    schemeTableau10: Tableau10,
    schemeYlGn: scheme$8,
    schemeYlGnBu: scheme$9,
    schemeYlOrBr: scheme$7,
    schemeYlOrRd: scheme$6
});

class ColorMap {
    static interpolator;
    static getColor(value, color) {
        // @ts-ignore
        if (d3$4[color] == undefined) {
            throw Error("Color scale does not exist (refer to d3-scale-chromatic)");
        }
        // @ts-ignore
        ColorMap.interpolator = d3$4[color];
        const numberPattern = /\d+/g;
        const rgbStr = ColorMap.interpolator(value).match(numberPattern);
        if (rgbStr === null) {
            return [0, 0, 0];
        }
        return rgbStr.map(el => +el / 255);
    }
    static getColorMap(color, res = 256) {
        const tex = [];
        for (let id = 0; id < res; id++) {
            const val = id / (res - 1);
            const col = ColorMap.getColor(val, color);
            tex.push(...col);
        }
        return tex;
    }
}

var vsSmoothColorMap$1 = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec3 vertNormals;in highp float inFootprintPlaneHeight;in highp vec2 funcValues;in lowp float inColorOrPicked;in lowp float inFiltered;out highp vec2 texCoords;out highp vec3 fragNormals;out lowp float vColorOrPicked;out lowp float filtered;out highp float footprintPlaneHeight;out highp vec3 vsCoords;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;texCoords=funcValues;fragNormals=vertNormals;vColorOrPicked=inColorOrPicked;filtered=inFiltered;footprintPlaneHeight=inFootprintPlaneHeight;vsCoords=vertCoords;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsSmoothColorMap$1 = "#version 300 es\nuniform sampler2D uColorMap;uniform highp sampler2D u_texture;in highp vec2 texCoords;in highp vec3 fragNormals;in lowp float vColorOrPicked;in highp float footprintPlaneHeight;in highp vec3 vsCoords;in lowp float filtered;out highp vec4 fragColor;void main(){highp vec3 texColor=texture(uColorMap,texCoords).rgb;highp vec3 light=normalize(vec3(1.0,0.0,1.0));highp vec3 normal=normalize(fragNormals);highp float diffuse=max(dot(normal,light)*0.7,0.0);highp float ambient=0.6;highp vec3 shade=texColor*(diffuse+ambient);if(filtered<=0.5){fragColor=vec4(0.5,0.5,0.5,0.7);}else{if(vColorOrPicked>0.5){fragColor=vec4(0,1,0,1);}else{if(footprintPlaneHeight>=0.0&&vsCoords[2]>=footprintPlaneHeight){fragColor=vec4(1,1,1,0.3);}else{fragColor=vec4(shade,1);}}}}";

/**
 * Multiply matrices of any dimensions given compatible columns and rows.
 */
function multiplyMatrices(A, B) {
    var result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));
    return result.map((row, i) => {
        return row.map((val, j) => {
            return A[i].reduce((sum, elm, k) => sum + (elm * B[k][j]), 0);
        });
    });
}
function rotateYMatrix(a) {
    var cos = Math.cos;
    var sin = Math.sin;
    return [[cos(a), 0, sin(a), 0], [0, 1, 0, 0], [-sin(a), 0, cos(a), 0], [0, 0, 0, 1]];
}
function rotateZMatrix(a) {
    var cos = Math.cos;
    var sin = Math.sin;
    return [[cos(a), -sin(a), 0, 0], [sin(a), cos(a), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}
function translateMatrix(x, y, z) {
    return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
}
function dot(v1, v2) {
    if (v1.length != v2.length) {
        throw new Error("v1 and v2 have different number of dimensions");
    }
    let result = 0;
    for (let i = 0; i < v1.length; i++) {
        result += v1[i] * v2[i];
    }
    return result;
}
function angle(v1, v2) {
    if (v1.length != v2.length) {
        throw new Error("v1 and v2 have different number of dimensions");
    }
    let zero = true;
    for (let i = 0; i < v1.length; i++) {
        if (v1[i] != 0) {
            zero = false;
            break;
        }
    }
    if (zero)
        return 0;
    zero = true;
    for (let i = 0; i < v2.length; i++) {
        if (v2[i] != 0) {
            zero = false;
            break;
        }
    }
    if (zero)
        return 0;
    let unit_1 = normalize$1(v1);
    let unit_2 = normalize$1(v2);
    let dot_product = dot(unit_1, unit_2);
    let angle_vectors = Math.acos(dot_product) * 180.0 / Math.PI;
    return angle_vectors;
}
function radians(angle) {
    return angle * Math.PI / 180;
}
// From glMatrix
function cross$1(a, b) {
    var out = [0, 0, 0];
    let ax = a[0], ay = a[1], az = a[2];
    let bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
}
// From glMatrix
function normalize$1(a) {
    let out = [];
    let len = 0;
    for (let i = 0; i < a.length; i++) {
        len += a[i] * a[i];
    }
    if (len > 0) {
        len = 1 / Math.sqrt(len);
    }
    for (let i = 0; i < a.length; i++) {
        out.push(a[i] * len);
    }
    return out;
}
function euclideanDistance(p1, p2) {
    if (p1.length != p2.length) {
        throw new Error("p1 and p2 have different number of dimensions");
    }
    let result = 0;
    for (let i = 0; i < p1.length; i++) {
        result += Math.pow(p1[i] - p2[i], 2);
    }
    return Math.sqrt(result);
}

require('mathjs');
const d3$3 = require('d3');
/**
 * This shader should only be used with the buildings layer
 */
class ShaderSmoothColorMapTex extends AuxiliaryShader {
    // Data to be rendered
    _coords = [];
    _normals = [];
    _function = []; // function values that will be sent to the frag shader
    _unchangedFunction = []; // original function value for each coordinate
    _indices = [];
    _idsLength;
    _heights = [];
    _minHeights = [];
    _orientedEnvelope = [];
    _sectionFootprint = [];
    _footprintPlaneHeightByCoord = []; // for each coordinate stores, if there is any, the height of the footprint plot that intersects the building
    _lastCode = -1; // last code used to identify a plot
    // TODO decide which function to use
    _functionToUse = 0;
    // Color map definition
    _colorMap = null;
    _colorMapReverse = false;
    // Data loaction on GPU
    _glCoords = null;
    _glNormals = null;
    _glFunction = null;
    _glIndices = null;
    _glColorOrPicked = null;
    _glFootprintPlaneHeight = null;
    _glFiltered = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    _colorMapDirty = false;
    _colorOrPickedDirty = false;
    _planeHeightDirty = false;
    _filteredDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _normalsId = -1;
    _functionId = -1;
    _colorOrPickedId = -1;
    _planeHeightId = -1;
    _filteredId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uColorMap = null;
    _textureLocation = null;
    // Color map texture
    _texColorMap;
    // Picking
    _colorOrPicked = [];
    _cellIdsByCoordinates = []; // stores the cell id of each coordinate grouped by mesh component
    _pickedCoordinates = []; // store index of coordinates not the coordinates themselves
    // Footprint plot
    _footprintCoords;
    _currentBuildingCoords;
    _coordinatesById;
    _currentFootprintBuildingId;
    _currentPickedBuildingId;
    _footprintCodesPerBuilding = []; // stores the unique identifier of the footprint plot of the building
    _auxCoords = [];
    _auxIndices = [];
    _auxNormals = [];
    _auxFunction = [];
    _filtered = [];
    constructor(glContext, colorMap = "interpolateReds", colorMapReverse = false) {
        super(vsSmoothColorMap$1, fsSmoothColorMap$1, glContext);
        // saves the layer color
        this._colorMap = colorMap;
        this._colorMapReverse = colorMapReverse;
        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    get colorOrPicked() {
        return this._colorOrPicked;
    }
    get currentFootPrintBuildingId() {
        return this._currentFootprintBuildingId;
    }
    get currentPickedBuildingId() {
        return this._currentPickedBuildingId;
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._planeHeightDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._heights = mesh.getHeightsVBO();
        this._minHeights = mesh.getMinHeightsVBO();
        this._orientedEnvelope = mesh.getOrientedEnvelopesVBO();
        this._sectionFootprint = mesh.getSectionFootprintVBO();
        this._idsLength = mesh.idsLength();
        // start showing only colors by default
        for (let i = 0; i < this._coords.length / 3; i++) { // TODO considers that coords is always 3d (dont know if it is true)
            this._colorOrPicked.push(0.0);
            this._filtered.push(1.0); // 1 true to include
        }
        for (let i = 0; i < this._coords.length / 3; i++) {
            this._footprintPlaneHeightByCoord.push(-1.0);
        }
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }
    updateShaderData(mesh, knot) {
        this._currentKnot = knot;
        this._functionDirty = true;
        this._colorOrPickedDirty = true;
        let tempFunction = mesh.getFunctionVBO(knot.id);
        for (let j = 0; j < tempFunction.length; j++) {
            let scale = d3$3.scaleLinear().domain(d3$3.extent(tempFunction[j])).range([0, 1]);
            for (let i = 0; i < tempFunction[j].length; i++) {
                tempFunction[j][i] = scale(tempFunction[j][i]);
            }
        }
        this._function = [];
        this._unchangedFunction = [];
        for (let i = 0; i < tempFunction.length; i++) {
            this._function.push([]);
            this._unchangedFunction.push([]);
            tempFunction[i].forEach((elem) => {
                this._unchangedFunction[i].push(elem);
                this._function[i].push(elem);
                this._function[i].push(0);
            });
        }
    }
    updateShaderUniforms(data) {
        this._colorMapDirty = true;
        this._colorMap = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    createTextures(glContext) {
        if (!this._colorMap) {
            return;
        }
        this._uColorMap = glContext.getUniformLocation(this._shaderProgram, 'uColorMap');
        this._texColorMap = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
        // // Set the parameters so we can render any size image.
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
        // Upload the image into the texture.
        const texData = ColorMap.getColorMap(this._colorMap);
        const size = [256, 1];
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGB32F, size[0], size[1], 0, glContext.RGB, glContext.FLOAT, new Float32Array(texData));
    }
    bindTextures(glContext) {
        glContext.uniform1i(this._uColorMap, 0); // texture unit 0
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
    }
    createVertexArrayObject(glContext) {
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
        // Creates the function id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        this._glFunction = glContext.createBuffer();
        this._colorOrPickedId = glContext.getAttribLocation(this._shaderProgram, 'inColorOrPicked');
        this._glColorOrPicked = glContext.createBuffer();
        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();
        this._planeHeightId = glContext.getAttribLocation(this._shaderProgram, 'inFootprintPlaneHeight');
        this._glFootprintPlaneHeight = glContext.createBuffer();
        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormals);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._normals), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._normalsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._normalsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        if (this._functionDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._function[this._functionToUse]), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._functionId, 2, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorOrPicked);
        if (this._colorOrPickedDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._colorOrPicked), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._colorOrPickedId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorOrPickedId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFootprintPlaneHeight);
        if (this._planeHeightDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._footprintPlaneHeightByCoord), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._planeHeightId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._planeHeightId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._planeHeightDirty = false;
        this._colorOrPickedDirty = false;
        this._coordsDirty = false;
        this._functionDirty = false;
        this._filteredDirty = false;
    }
    setIdsCoordinates(cellIdsByCoordinates) {
        this._cellIdsByCoordinates = cellIdsByCoordinates;
        this._coordinatesById = new Array(this._idsLength);
        // builds the array of coordinates per cell id
        let coordinateIndexOffset = 0;
        for (let i = 0; i < this._cellIdsByCoordinates.length; i++) {
            let compElement = this._cellIdsByCoordinates[i];
            for (let j = 0; j < compElement.length; j++) {
                if (!this._coordinatesById[compElement[j]]) {
                    this._coordinatesById[compElement[j]] = [];
                }
                this._coordinatesById[compElement[j]].push(coordinateIndexOffset + j);
            }
            coordinateIndexOffset += compElement.length;
        }
    }
    setPickedCells(pickedCells) {
        this._colorOrPickedDirty = true;
        this._pickedCoordinates = [];
        let readElements = 0;
        this._cellIdsByCoordinates.forEach((compElement) => {
            compElement.forEach((cellId, index) => {
                let coordinateIndex = index + readElements;
                if (pickedCells.has(cellId)) {
                    this._pickedCoordinates.push(coordinateIndex);
                    this._colorOrPicked[coordinateIndex] = 1.0;
                }
                else {
                    this._colorOrPicked[coordinateIndex] = 0.0;
                }
            });
            readElements += compElement.length;
        });
    }
    /**
     * Return all the coordinates indices of a specific building given that the this._coords array is grouped by building
     * @param buildingId id of the building in the coords array
     */
    getBuildingCoords(buildingId) {
        let readCoords = 0;
        for (let i = 0; i < buildingId; i++) {
            readCoords += this._cellIdsByCoordinates[i].length; // this list has the ids separated by building
        }
        let buildingCoords = [];
        for (let i = 0; i < this._cellIdsByCoordinates[buildingId].length; i++) {
            buildingCoords.push(readCoords + i);
        }
        return buildingCoords;
    }
    /**
     * Calculates footprint coords based on the building coords
     * @param buildingCoords
     */
    calcFootprintCoords(buildingCoords) {
        this._footprintCoords = [];
        for (let i = 0; i < buildingCoords.length; i++) {
            let coordIndex = buildingCoords[i] * 3;
            if (this._coords[coordIndex + 2] == 0) { // if z == 0 it belongs to the footprint
                this._footprintCoords.push(buildingCoords[i]);
            }
        }
    }
    /**
     * Calculates the surface mesh for the footprint plot.
     * It uses Principal Component Analysis to create a oriented bounding plane
     *
     * @param {number} deltaHeight how much to shift the height if it is updating a surface
     * @param {boolean} update if a footprint plot is being updated
     * @param {number} plotType the type of d3 plot to show (-1 in case of update to maintain the plot type)
     * @param {string} specType d3 for d3 plots and vega for vega-lite plots
     */
    async applyFootprintPlot(spec, update, plotType = 1, deltaHeight = 0, specType = 'd3') {
        if (this._currentFootprintBuildingId == -1) { // a building was not picked
            return;
        }
        /**
         * @param {number} nBins total number of bins (circle is divided equally)
         */
        function defineBins(nBins) {
            let binData = [];
            let increment = (2 * Math.PI) / nBins; // the angles go from 0 to 2pi (radians)
            // adding the angles that define each bin
            for (let i = 0; i < nBins + 1; i++) {
                binData.push(i * increment);
            }
            return binData;
        }
        /**
         * Generate the radial data in the format expected by D3 TODO: get rid of this external dependence
         *
         * @param {number[]} peripherals 8 numbers describing the peripherals (auxiliary lines)
         * @param {number[]} bins array describing the start and end of each bin (in radians)
         * @param {number} nTimeSteps number of timesteps to be considered
         * @param {number[]} timeStepData data for each timestep (length = nBins * nTimeSteps)
         */
        function genRadialData(peripherals, bins, timeStepData) {
            if (timeStepData.length % (bins.length - 1) != 0) {
                throw new Error("There is a mismatch between the size of bins and size of timeStepData");
            }
            if (peripherals.length != 8) {
                throw new Error("The number of peripherals is different than 8");
            }
            let radialData = [];
            let nTimeSteps = timeStepData.length / (bins.length - 1);
            let nBins = bins.length - 1;
            radialData = radialData.concat(peripherals);
            radialData.push(nBins);
            radialData = radialData.concat(bins);
            radialData.push(nTimeSteps);
            radialData = radialData.concat(timeStepData);
            return JSON.stringify(radialData);
        }
        /**
         *
         * Given a polar coordinate in the world coordinates corverts to pixel coordinates inside the plane
         *
         * @param planeWidthWorld width of the plane in the world coords
         * @param planeHeightWorld height of the plane in the world coords
         * @param angle in degrees. considering 0 between top left and top right. growing clock wise3
         * @param distanceToCenterWorld distance of the coordinate to the center of the plane in world coords
         * @param conversionFactor the scale used to generate the resolution of the image on the plane
         */
        function worldToPixel(planeWidthWorld, planeHeightWorld, angle, distanceToCenterWorld, conversionFactor) {
            let planeWidthPixel = planeWidthWorld * conversionFactor;
            let planeHeightPixel = planeHeightWorld * conversionFactor;
            let centerPlanePixel = [planeWidthPixel / 2, planeHeightPixel / 2];
            let distanceToCenterPixel = distanceToCenterWorld * conversionFactor;
            let pixelXRefCenter = Math.sin(radians(angle)) * distanceToCenterPixel;
            let pixelYRefCenter = Math.cos(radians(angle)) * distanceToCenterPixel;
            // converting from coord system with center in the origin to coord system with top left in the origin
            let pixelXRefOrigin = centerPlanePixel[0] + pixelXRefCenter;
            let pixelYRefOrigin = centerPlanePixel[1] - pixelYRefCenter;
            return [pixelXRefOrigin, pixelYRefOrigin];
        }
        /**
         *
         * @param centroidsWorldCoords the centroid positions (flat 3d) of all cells that are project into the plot (The coordinates are ordered according to the position of the cell in the building)
         * @param centroidsPixelCoords the centroid positions (flat 2d) in the image coordinate system (The coordinates are ordered according to the position of the cell in the building)
         * @param normalsPixelCoords the normals (flat 2d) of the cells in the image coordinate system
         * @param functionsPerTimestep each position stores all the timesteps for that specific cell (the indices of all arrays with cell info match)
         * @param planeCenterWorld center of the plane in world coordinates
         * @param anglePerCentroid angle of each centroid
         */
        function genPlotData(centroidsWorldCoords, centroidsPixelCoords, normalsPixelCoords, functionsPerTimestep, functionIndices, planeCenterWorld, anglePerCentroid) {
            let info = {
                planeCenterWorld: planeCenterWorld,
                pointData: []
            };
            for (let i = 0; i < centroidsWorldCoords.length / 3; i++) {
                let point = {};
                point.worldCoord = [centroidsWorldCoords[i * 3], centroidsWorldCoords[i * 3 + 1], centroidsWorldCoords[i * 3 + 2]];
                point.pixelCoord = [centroidsPixelCoords[i * 2], centroidsPixelCoords[i * 2 + 1]];
                point.normal = [normalsPixelCoords[i * 2], normalsPixelCoords[i * 2 + 1]];
                point.functions = functionsPerTimestep[i];
                point.angle = anglePerCentroid[i];
                point.functionIndex = functionIndices[i];
                info.pointData.push(point);
            }
            return JSON.stringify(info);
        }
        /**
         * @param vec0 vector from center to 0 degrees
         * @param vec270 vector from center to 270 degrees
         * @param point coordinate to be evaluated
         * @param center center of the circle
         * @returns returns the angle of a point in a circle
         */
        function getAnglePoint(vec0, vec270, point, center) {
            let vecPoint = [point[0] - center[0], point[1] - center[1], point[2] - center[2]];
            // Determine the position of the centroid in relation to the orientation of the radial plot
            let angle0 = angle(vecPoint, vec0);
            let angle270 = angle(vecPoint, vec270);
            // Considering angles in the D3 format (0 correspond to 12 oclock and grows clock-wise)
            if (angle0 >= 0 && angle0 < 90 && angle270 >= 90 && angle270 < 180) { // quadrant 1
                return angle0;
            }
            else if (angle0 >= 90 && angle0 < 180 && angle270 > 90 && angle270 <= 180) { // quadrant 2
                return angle0;
            }
            else if (angle0 > 90 && angle0 <= 180 && angle270 > 0 && angle270 <= 90) { // quadrant 3
                return 180 + (90 - angle270);
            }
            else if (angle0 > 0 && angle0 <= 90 && angle270 >= 0 && angle270 < 90) { // quadrant 4
                return 270 + angle270;
            }
        }
        /**
         * Given the indices of a set of points calculate the average of the points
         */
        function avgPoints(indicesPoints, coords) {
            let avgX = 0;
            let avgY = 0;
            let avgZ = 0;
            for (let i = 0; i < indicesPoints.length; i++) {
                let coordinateIndex = indicesPoints[i];
                avgX += coords[coordinateIndex * 3];
                avgY += coords[coordinateIndex * 3 + 1];
                avgZ += coords[coordinateIndex * 3 + 2];
            }
            avgX /= indicesPoints.length;
            avgY /= indicesPoints.length;
            avgZ /= indicesPoints.length;
            return [avgX, avgY, avgZ];
        }
        if (!this._footprintCoords) {
            return { indices: [], coords: [], functionValues: [], image: undefined };
        }
        let footprintCode = -1;
        let surfaceHeight = 1;
        let plotNumber = plotType;
        if (update) {
            surfaceHeight += deltaHeight;
        }
        this._footprintCodesPerBuilding.forEach((elem) => {
            if (elem.buildingId == this._currentFootprintBuildingId) {
                footprintCode = elem.code;
                if (update) {
                    plotNumber = elem.plotType;
                    surfaceHeight += elem.plotHeight;
                    let buildingCoords = this.getBuildingCoords(this._currentFootprintBuildingId);
                    this._planeHeightDirty = true;
                    // update _footprintPlaneHeightByCoord with new footprint plot heights for the coordinates of the added building
                    buildingCoords.forEach((coordIndex) => {
                        this._footprintPlaneHeightByCoord[coordIndex] = surfaceHeight;
                    });
                }
                else {
                    surfaceHeight = elem.plotHeight;
                }
                elem.plotHeight = surfaceHeight;
            }
        });
        if (footprintCode == -1) {
            this._lastCode += 1;
            footprintCode = this._lastCode;
            this._footprintCodesPerBuilding.push({ buildingId: this._currentFootprintBuildingId, code: this._lastCode, plotHeight: surfaceHeight, plotType: plotNumber });
            let buildingCoords = this.getBuildingCoords(this._currentFootprintBuildingId);
            this._planeHeightDirty = true;
            // update _footprintPlaneHeightByCoord with new footprint plot heights for the coordinates of the added building
            buildingCoords.forEach((coordIndex) => {
                this._footprintPlaneHeightByCoord[coordIndex] = surfaceHeight;
            });
        }
        let envelope = this._orientedEnvelope[this._currentFootprintBuildingId];
        let nodes = [envelope[0][0], envelope[0][1], surfaceHeight, envelope[0][2], envelope[0][3], surfaceHeight, envelope[0][4], envelope[0][5], surfaceHeight, envelope[0][6], envelope[0][7], surfaceHeight];
        let centerPlane = [0, 0, 0];
        for (let i = 0; i < nodes.length / 3; i++) {
            centerPlane[0] += nodes[i * 3];
            centerPlane[1] += nodes[i * 3 + 1];
            centerPlane[2] += nodes[i * 3 + 2];
        }
        centerPlane[0] /= nodes.length / 3;
        centerPlane[1] /= nodes.length / 3;
        centerPlane[2] /= nodes.length / 3;
        // let radiusBSphere = getRadiusBSphere(nodes, centerPlane);
        let v1 = [nodes[3] - nodes[0], nodes[4] - nodes[1], nodes[5] - nodes[2]];
        let v2 = [nodes[6] - nodes[0], nodes[7] - nodes[1], nodes[8] - nodes[2]];
        let surfaceNormal = normalize$1(cross$1(v1, v2));
        let indices = [3, 0, 2, 2, 0, 1];
        // let indices = [0, 3, 1, 1, 3, 2];
        // let functionValues = [0,1, 0,0, 1,0, 1,1];
        let functionValues = [1, 1, 1, 0, 0, 0, 0, 1];
        // storing coordinates to calculate euclidean distances
        let topLeft = [];
        let bottomLeft = [];
        let topRight = [];
        let bottomRight = [];
        // figure out height and width of the surface
        for (let i = 0; i < 4; i++) {
            let value1 = functionValues[i * 2];
            let value2 = functionValues[i * 2 + 1];
            if (value1 == 0 && value2 == 0) {
                topLeft.push(nodes[i * 3]);
                topLeft.push(nodes[i * 3 + 1]);
                topLeft.push(nodes[i * 3 + 2]);
            }
            else if (value1 == 0 && value2 == 1) {
                bottomLeft.push(nodes[i * 3]);
                bottomLeft.push(nodes[i * 3 + 1]);
                bottomLeft.push(nodes[i * 3 + 2]);
            }
            else if (value1 == 1 && value2 == 0) {
                topRight.push(nodes[i * 3]);
                topRight.push(nodes[i * 3 + 1]);
                topRight.push(nodes[i * 3 + 2]);
            }
            else if (value1 == 1 && value2 == 1) {
                bottomRight.push(nodes[i * 3]);
                bottomRight.push(nodes[i * 3 + 1]);
                bottomRight.push(nodes[i * 3 + 2]);
            }
        }
        let width = Math.sqrt(Math.pow(topLeft[0] - topRight[0], 2) + Math.pow(topLeft[1] - topRight[1], 2) + Math.pow(topLeft[2] - topRight[2], 2));
        let height = Math.sqrt(Math.pow(topLeft[0] - bottomLeft[0], 2) + Math.pow(topLeft[1] - bottomLeft[1], 2) + Math.pow(topLeft[2] - bottomLeft[2], 2));
        let projectedCentroids = [];
        let cellsToCheck = new Set(); // cells that belong to the currently picked building
        this._cellIdsByCoordinates[this._currentFootprintBuildingId].forEach((cellIndex) => {
            cellsToCheck.add(cellIndex);
        });
        Array.from(cellsToCheck).forEach((cellIndex) => {
            let cellCoordinates = this._coordinatesById[cellIndex];
            // for a cell to intersect a plane it needs to have at least one point in each side of the plane and be in the range of the plane
            let above = false;
            let under = false;
            // let inRange = false;
            for (let i = 0; i < cellCoordinates.length; i++) {
                let coordIndex = cellCoordinates[i];
                let x = this._coords[coordIndex * 3];
                let y = this._coords[coordIndex * 3 + 1];
                let z = this._coords[coordIndex * 3 + 2];
                let p0p = [x - nodes[0], y - nodes[1], z - nodes[2]]; // vector from a point in the plane to the analyzed point
                let dotProduct = dot(surfaceNormal, p0p);
                if (dotProduct > 0) {
                    above = true;
                }
                else if (dotProduct < 0) {
                    under = true;
                }
                else { // the point lies on the plane, no need to check other points
                    above = true;
                    under = true;
                    break;
                }
            }
            // if(above && under && inRange){
            if (above && under) {
                // cellCoordinates.forEach((coordIndex) => { // configure the shader to show coordinate as picked
                //     this._colorOrTexValues[coordIndex*2] = 1;
                //     this._colorOrTexValues[coordIndex*2+1] = 1;
                // });
                let centroid = avgPoints(cellCoordinates, this._coords);
                let allFunctionsCentroid = [];
                for (let i = 0; i < this._function.length; i++) {
                    allFunctionsCentroid.push(this._unchangedFunction[i][cellCoordinates[0]]); // the value is equal to all cellcoordinates
                }
                let normal = [this._normals[cellCoordinates[0] * 3], this._normals[cellCoordinates[0] * 3 + 1], this._normals[cellCoordinates[0] * 3 + 2]];
                projectedCentroids.push({ point: [centroid[0], centroid[1], surfaceHeight], function: allFunctionsCentroid, functionIndex: cellCoordinates[0], normal: normal });
            }
        });
        this._colorOrPickedDirty = true;
        let dataRange = [-5, 5]; // buffer around the surface from where the data should be collected. It is in meters. The surface begins at 0 height
        this._currentBuildingCoords.forEach((coordIndex) => {
            if (this._coords[coordIndex * 3 + 2] >= dataRange[0] && this._coords[coordIndex * 3 + 2] <= dataRange[1]) ;
        });
        // the middle points that represent 0 and 270 degrees in the circle
        let degree0 = [(topLeft[0] + topRight[0]) / 2, (topLeft[1] + topRight[1]) / 2, (topLeft[2] + topRight[2]) / 2];
        let degree270 = [(topLeft[0] + bottomLeft[0]) / 2, (topLeft[1] + bottomLeft[1]) / 2, (topLeft[2] + bottomLeft[2]) / 2];
        let vec0 = [degree0[0] - centerPlane[0], degree0[1] - centerPlane[1], degree0[2] - centerPlane[2]];
        let vec270 = [degree270[0] - centerPlane[0], degree270[1] - centerPlane[1], degree270[2] - centerPlane[2]];
        let binsDescription = defineBins(32);
        /**
         * Returns the index of the bin the angle belongs to
         * @param bins Array describing the beginning and end of all bins
         * @param angle angle in radians
         */
        function checkBin(bins, angle) {
            for (let i = 0; i < bins.length - 1; i++) {
                let start = bins[i];
                let end = bins[i + 1];
                if (angle >= start && angle <= end) {
                    return i;
                }
            }
            return -1; // returns -1 if it does not belong to any bin
        }
        let timestepsData = Array(binsDescription.length - 1); // each position stores all timesteps for one bin
        let centroidsInEachBin = Array(binsDescription.length - 1); // stores how many centroids fall into each bin in each timestep
        for (let i = 0; i < timestepsData.length; i++) {
            timestepsData[i] = Array(this._function.length).fill(0);
            centroidsInEachBin[i] = Array(this._function.length).fill(0);
        }
        let centroidsWorldCoords = [];
        let centroidsPixelCoords = [];
        let normalsPixelCoords = [];
        let functionsPerTimeStep = [];
        let functionIndices = [];
        let centerPlanePixel = [width * 8 / 2, height * 8 / 2];
        let anglePerCentroid = [];
        projectedCentroids.forEach((centroid) => {
            functionsPerTimeStep.push(centroid.function);
            functionIndices.push(centroid.functionIndex); // the index of the function so values can be later retrieved from various knots
            centroidsWorldCoords.push(centroid.point[0], centroid.point[1], centroid.point[2]);
            let pixelCoord = [0, 0];
            let normalPointWorld = [centroid.normal[0] + centerPlane[0], centroid.normal[1] + centerPlane[1], centroid.normal[2] + centerPlane[2]];
            let angleNormalPoint = getAnglePoint(vec0, vec270, normalPointWorld, centerPlane);
            let normalPointPixel = [0, 0];
            if (angleNormalPoint != undefined) {
                normalPointPixel = worldToPixel(width, height, angleNormalPoint, euclideanDistance(normalPointWorld, centerPlane), 8);
            }
            let normalPixel = normalize$1([normalPointPixel[0] - centerPlanePixel[0], normalPointPixel[1] - centerPlanePixel[1]]);
            normalsPixelCoords.push(normalPixel[0], normalPixel[1]);
            // let vecCentroid = [centroid.point[0] - centerPlane[0], centroid.point[1] - centerPlane[1], centroid.point[2] - centerPlane[2]];
            // Determine the position of the centroid in relation to the orientation of the radial plot
            // let angle0 = angle(vecCentroid, vec0);
            // let angle270 = angle(vecCentroid, vec270);
            let binIndex = -1;
            let angleCentroid = getAnglePoint(vec0, vec270, centroid.point, centerPlane);
            anglePerCentroid.push(angleCentroid);
            if (angleCentroid != undefined) {
                binIndex = checkBin(binsDescription, radians(angleCentroid));
                pixelCoord = worldToPixel(width, height, angleCentroid, euclideanDistance(centroid.point, centerPlane), 8);
            }
            if (binIndex != -1) { // if the centroid belongs to any of the quadrants
                centroid.function.forEach((value, index) => {
                    timestepsData[binIndex][index] += value;
                    centroidsInEachBin[binIndex][index] += 1;
                });
            }
            centroidsPixelCoords.push(pixelCoord[0], pixelCoord[1]);
        });
        let biggestAvg = -1;
        // taking the avg of all timesteps of each bin
        for (let i = 0; i < timestepsData.length; i++) {
            for (let j = 0; j < timestepsData[i].length; j++) {
                if (centroidsInEachBin[i][j] != 0) {
                    timestepsData[i][j] /= centroidsInEachBin[i][j];
                }
                if (timestepsData[i][j] > biggestAvg) {
                    biggestAvg = timestepsData[i][j];
                }
            }
        }
        let flatTimestepData = [];
        // normalizing the avg of all timesteps of each bin
        for (let i = 0; i < timestepsData.length; i++) {
            for (let j = 0; j < timestepsData[i].length; j++) {
                if (biggestAvg != 0) {
                    timestepsData[i][j] /= biggestAvg;
                }
                flatTimestepData.push(timestepsData[i][j]);
            }
        }
        let plotData;
        if (plotNumber == 0) { // TODO: make radial plot deal with generic data
            plotData = genRadialData([-1, -1, -1, -1, -1, -1, -1, -1], binsDescription, flatTimestepData);
        }
        else {
            plotData = genPlotData(centroidsWorldCoords, centroidsPixelCoords, normalsPixelCoords, functionsPerTimeStep, functionIndices, centerPlane, anglePerCentroid); // generic data format that feed all plot types
        }
        // let texImage = await this.generateCustomTextureFoot(spec, radialData, width, height, plotNumber);
        let texImage = await this.generateCustomTextureFoot(spec, plotData, width, height, 8, plotNumber, specType);
        return { indices: indices, coords: nodes, functionValues: functionValues, image: texImage, code: footprintCode };
    }
    setPickedFoot(cellId, pickingForUpdate) {
        let buildingCoords = [];
        let keepSearching = true;
        for (let i = 0; i < this._cellIdsByCoordinates.length; i++) {
            let compElement = this._cellIdsByCoordinates[i];
            for (let j = 0; j < compElement.length; j++) {
                if (cellId == compElement[j]) {
                    let hasPlot = false;
                    this._footprintCodesPerBuilding.forEach((value) => {
                        if (value.buildingId == i) {
                            hasPlot = true;
                        }
                    });
                    if (pickingForUpdate) {
                        if (hasPlot) { // for the update only proceeds if the building already has a footprint plot
                            this._currentFootprintBuildingId = i;
                            buildingCoords = this.getBuildingCoords(i);
                            this._currentBuildingCoords = buildingCoords;
                            this.calcFootprintCoords(buildingCoords);
                        }
                        else {
                            this._currentFootprintBuildingId = -1;
                            keepSearching = false;
                        }
                    }
                    else {
                        this._currentFootprintBuildingId = i;
                        buildingCoords = this.getBuildingCoords(i);
                        this._currentBuildingCoords = buildingCoords;
                        this.calcFootprintCoords(buildingCoords);
                    }
                    break;
                }
            }
            if (buildingCoords.length > 0 || !keepSearching) { // already found the building or there is no need to keep searching
                break;
            }
        }
    }
    setPickedObject(cellId) {
        let buildingCoords = [];
        let keepSearching = true;
        for (let i = 0; i < this._cellIdsByCoordinates.length; i++) {
            let compElement = this._cellIdsByCoordinates[i];
            for (let j = 0; j < compElement.length; j++) {
                if (cellId == compElement[j]) {
                    this._currentPickedBuildingId = i;
                    buildingCoords = this.getBuildingCoords(i);
                    keepSearching = false;
                    break;
                }
            }
            if (!keepSearching) { // already found the building 
                break;
            }
        }
        if (buildingCoords.length > 0) { // a building was found
            // toggle the highlight in the coordinates of the building
            for (const coordId of buildingCoords) {
                if (this._colorOrPicked[coordId] == 1) {
                    this._colorOrPicked[coordId] = 0;
                }
                else if (this._colorOrPicked[coordId] == 0) {
                    this._colorOrPicked[coordId] = 1;
                }
            }
            this._colorOrPickedDirty = true;
        }
    }
    setHighlightElements(coordinates, value) {
        for (const coordIndex of coordinates) {
            if (value)
                this._colorOrPicked[coordIndex] = 1;
            else
                this._colorOrPicked[coordIndex] = 0;
        }
        this._colorOrPickedDirty = true;
    }
    /**
     * Determines the center and radius of smallest sphere that contains the picked coordinates
     */
    bSpherePickedCoords() {
        let maxX = -1;
        let maxY = -1;
        let maxZ = -1;
        let minX = -1;
        let minY = -1;
        let minZ = -1;
        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex * 3];
            let y = this._coords[coordIndex * 3 + 1];
            let z = this._coords[coordIndex * 3 + 2];
            if (minX == -1) {
                minX = x;
            }
            else if (x < minX) {
                minX = x;
            }
            if (minY == -1) {
                minY = y;
            }
            else if (y < minY) {
                minY = y;
            }
            if (minZ == -1) {
                minZ = z;
            }
            else if (z < minZ) {
                minZ = z;
            }
            if (maxX == -1) {
                maxX = x;
            }
            else if (x > maxX) {
                maxX = x;
            }
            if (maxY == -1) {
                maxY = y;
            }
            else if (y > maxY) {
                maxY = y;
            }
            if (maxZ == -1) {
                maxZ = z;
            }
            else if (z > maxZ) {
                maxZ = z;
            }
        });
        let radius = -1;
        let center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex * 3];
            let y = this._coords[coordIndex * 3 + 1];
            let z = this._coords[coordIndex * 3 + 2];
            let distance = Math.sqrt(Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2) + Math.pow(z - center[2], 2)); // euclidean distance
            if (distance > radius) {
                radius = distance;
            }
        });
        let radiusAdjustingStep = 0.015;
        let radiusAdjustingFactor = 1;
        // adjusting radius according to the number of coordinates
        radiusAdjustingFactor -= (this._pickedCoordinates.length / 3) * radiusAdjustingStep;
        if (radiusAdjustingFactor < 0.15) {
            radiusAdjustingFactor = 0.15;
        }
        return { "center": center, "radius": radius * radiusAdjustingFactor }; // tweak the radius to make it closer or further from the building
    }
    /**
     * Handles the generation of a custom texture defined by the user.
     */
    async generateCustomTexture(spec, specType, data, width, height) {
        // let shadowAvg = 0;
        // this._pickedCoordinates.forEach((coordinateIndex) => {
        //     shadowAvg += this._function[this._functionToUse][coordinateIndex*2];
        // });
        // shadowAvg = shadowAvg/this._pickedCoordinates.length;
        let image;
        if (specType == 'vega') {
            image = await spec.getSurEmbeddedSvg(data, width * 8, height * 8);
        }
        else {
            image = await spec.run(data, width * 8, height * 8, 1);
        }
        return image;
    }
    /**
     * Handles the generation of a custom texture defined by the user.
     */
    // async generateCustomTextureFoot(d3Expec: any, coords: number[], width: number, height: number){
    async generateCustomTextureFoot(spec, data, width, height, conversionFactor, plotNumber, specType) {
        let image;
        if (specType == 'd3') {
            image = await spec.run(data, width * conversionFactor, height * conversionFactor, plotNumber);
        }
        else {
            image = await spec.getFootEmbeddedSvg(data, width * conversionFactor, height * conversionFactor); // grammar manager
        }
        return image;
    }
    /**
     * Defines transformations necessary to make a surface flat having a z = 0 and to undo it
     *
     * @param {boolean} centerPlane center point of the plane
     * @param {boolean} normal the normal of the plane
     *
     */
    absSurfaceTrans(centerPlane, normal) {
        let zRotation;
        let yRotation;
        // calculating do transformation
        // When x(+), y(-) or x(-), y(-)
        if ((normal[0] > 0 && normal[1] < 0) || (normal[0] < 0 && normal[1] < 0)) {
            zRotation = radians(angle([1, 0, 0], [normal[0], normal[1], 0])); // z component does not matter in this rotation
        }
        else if ((normal[0] > 0 && normal[1] > 0) || (normal[0] < 0 && normal[1] > 0)) { // When x(+), y(+) or x(-), y(+)
            zRotation = -1 * radians(angle([1, 0, 0], [normal[0], normal[1], 0])); // z component does not matter in this rotation
        }
        else {
            zRotation = radians(angle([1, 0, 0], [normal[0], normal[1], 0])); // when one of the axis is 0 it does not matter the direction of rotation // z component does not matter in this rotation
        }
        // When x(+), z(-) or x(-), z(-)
        if ((normal[0] > 0 && normal[2] < 0) || (normal[0] < 0 && normal[2] < 0)) {
            yRotation = radians(angle([0, 0, 1], normal));
        }
        else if ((normal[0] > 0 && normal[2] > 0) || (normal[0] < 0 && normal[2] > 0)) { // When x(+), z(+) or x(-), z(+)
            yRotation = -1 * radians(angle([0, 0, 1], normal));
        }
        else {
            yRotation = radians(angle([0, 0, 1], normal)); // when one of the axis is 0 it does not matter the direction of rotation
        }
        let transformations = translateMatrix(-1 * centerPlane[0], -1 * centerPlane[1], -1 * centerPlane[2]); // translate plane to origin
        transformations = multiplyMatrices(rotateZMatrix(zRotation), transformations);
        transformations = multiplyMatrices(rotateYMatrix(yRotation), transformations);
        // calculating undo transformation
        let undoTrans = rotateYMatrix(-1 * yRotation); // undo the Y rotation
        undoTrans = multiplyMatrices(rotateZMatrix(-1 * zRotation), undoTrans); // undo the Z rotation
        undoTrans = multiplyMatrices(translateMatrix(centerPlane[0], centerPlane[1], centerPlane[2]), undoTrans); // translate plane back to original position
        return { "do": transformations, "undo": undoTrans };
    }
    /**
     * Get a flat list of numbers and converts to a column matrix
     * @param {number[]} flatArray flat list of nummbers
     * @param {number} dim number of rows in the matrix
     */
    flatArrayToMatrix(flatArray, dim) {
        let matrix = [];
        for (let i = 0; i < dim; i++) { // one iteration for each row
            let row = [];
            for (let j = 0; j < flatArray.length / dim; j++) {
                row.push(flatArray[j * dim + i]);
            }
            matrix.push(row);
        }
        return matrix;
    }
    async applyTexSelectedCells(camera, spec, specType) {
        /**
         *
         * @param {number[]} point 3D point
         * @param {object} plane Attributes: center (number[]) and unit normal (number[])
         */
        let projectPointOntoPlane = (point, plane) => {
            let v = [point[0] - plane.center[0], point[1] - plane.center[1], point[2] - plane.center[2]]; // vector from plane "center" to the point of interest
            let dist = plane.normal[0] * v[0] + plane.normal[1] * v[1] + plane.normal[2] * v[2]; // scalar distance from point to plane along normal (dot product between v and normal)
            let normalXDist = [plane.normal[0] * dist, plane.normal[1] * dist, plane.normal[2] * dist];
            return [point[0] - normalXDist[0], point[1] - normalXDist[1], point[2] - normalXDist[2]];
        };
        if (this._pickedCoordinates.length == 0) {
            return;
        }
        let abs_surface_indices = [];
        let abs_surface_coords = [];
        let abs_surface_normals = [];
        let abs_surface_function = [];
        let bSphere = this.bSpherePickedCoords();
        let sumNormals = this.sumPickedNormals();
        if (sumNormals.length == 0) {
            return;
        }
        let shiftVector = [sumNormals[0] * bSphere.radius, sumNormals[1] * bSphere.radius, sumNormals[2] * bSphere.radius]; // vector from center of sphere to surface
        let centerPlane = [bSphere.center[0] + shiftVector[0], bSphere.center[1] + shiftVector[1], bSphere.center[2] + shiftVector[2]]; // center of texture plane. This point is tangent to the sphere in the direction of the sumNormals
        let projectedPoints = [];
        this._pickedCoordinates.forEach((coordIndex) => {
            let x = this._coords[coordIndex * 3];
            let y = this._coords[coordIndex * 3 + 1];
            let z = this._coords[coordIndex * 3 + 2];
            let projectedPoint = projectPointOntoPlane([x, y, z], { "center": centerPlane, "normal": sumNormals });
            let projectedX = projectedPoint[0];
            let projectedY = projectedPoint[1];
            let projectedZ = projectedPoint[2];
            projectedPoints.push(projectedX, projectedY, projectedZ);
        });
        let transformations = this.absSurfaceTrans(centerPlane, sumNormals);
        let doTrans = transformations.do;
        let undoTrans = transformations.undo;
        let pointsMatrix = this.flatArrayToMatrix(projectedPoints, 3);
        // one last row with 1's is needed to complete the matrix
        let row = [];
        for (let j = 0; j < projectedPoints.length / 3; j++) {
            row.push(1);
        }
        pointsMatrix.push(row);
        let transformedPoints = multiplyMatrices(doTrans, pointsMatrix);
        // from homogeneous coordinates back to normal
        for (let rowIndex = 0; rowIndex < pointsMatrix.length; rowIndex++) {
            for (let columnIndex = 0; columnIndex < pointsMatrix[0].length; columnIndex++) {
                transformedPoints[rowIndex][columnIndex] = transformedPoints[rowIndex][columnIndex] / transformedPoints[transformedPoints.length - 1][columnIndex];
            }
        }
        let transformedPointsList = []; // each position represents a point
        for (let columnIndex = 0; columnIndex < pointsMatrix[0].length; columnIndex++) {
            let point = [];
            for (let rowIndex = 0; rowIndex < pointsMatrix.length - 1; rowIndex++) { // desconsider last row of homogenous coordinates
                point.push(transformedPoints[rowIndex][columnIndex]);
            }
            transformedPointsList.push(point);
        }
        // definition of the boundaries of the plane
        let maxX = -1;
        let maxY = -1;
        let minX = -1;
        let minY = -1;
        transformedPointsList.forEach((elem) => {
            let x = elem[0];
            let y = elem[1];
            if (minX == -1) {
                minX = x;
            }
            else if (x < minX) {
                minX = x;
            }
            if (minY == -1) {
                minY = y;
            }
            else if (y < minY) {
                minY = y;
            }
            if (maxX == -1) {
                maxX = x;
            }
            else if (x > maxX) {
                maxX = x;
            }
            if (maxY == -1) {
                maxY = y;
            }
            else if (y > maxY) {
                maxY = y;
            }
        });
        let bPlane = [minX, minY, maxX, maxY]; // bounding plane that will receive the texture. After the transformations the bounding plane is parallel to x and y, thus z = 0 to all cordinates
        this._coordsDirty = true;
        this._functionDirty = true;
        this._colorOrPickedDirty = true;
        // Each column is a point
        let nodes = [[bPlane[0], bPlane[2], bPlane[2], bPlane[0]],
            [bPlane[1], bPlane[1], bPlane[3], bPlane[3]],
            [0, 0, 0, 0],
            [1, 1, 1, 1]];
        nodes = multiplyMatrices(undoTrans, nodes);
        // from homogeneous coordinates back to normal
        for (let rowIndex = 0; rowIndex < nodes.length; rowIndex++) {
            for (let columnIndex = 0; columnIndex < nodes[0].length; columnIndex++) {
                nodes[rowIndex][columnIndex] = nodes[rowIndex][columnIndex] / nodes[nodes.length - 1][columnIndex];
            }
        }
        let flat_nodes = [];
        // flattening nodes form number[][] to number[]
        for (let columnIndex = 0; columnIndex < nodes[0].length; columnIndex++) {
            for (let rowIndex = 0; rowIndex < nodes.length - 1; rowIndex++) { // no need to consider the last row used for homogeneous coordinates
                flat_nodes.push(nodes[rowIndex][columnIndex]);
            }
        }
        // TODO dont know if this is the best solution
        if (sumNormals[2] > 0) { // if the normal of the plane is facing top or corner top
            let aux = [flat_nodes[3], flat_nodes[4], flat_nodes[5]]; // coordinate of index 1
            flat_nodes[3] = flat_nodes[9]; // swapping index 1 with 3
            flat_nodes[4] = flat_nodes[10]; // swapping index 1 with 3
            flat_nodes[5] = flat_nodes[11]; // swapping index 1 with 3
            flat_nodes[9] = aux[0]; // swapping index 1 with 4
            flat_nodes[10] = aux[1]; // swapping index 1 with 4
            flat_nodes[11] = aux[2]; // swapping index 1 with 4
        }
        // let indices = [3, 0, 2, 2, 0, 1];
        let indices = [0, 3, 1, 1, 3, 2];
        abs_surface_indices = indices;
        abs_surface_coords = abs_surface_coords.concat(flat_nodes);
        for (let i = 0; i < 4; i++) { // since there is four new coordinates we need four new normals
            abs_surface_normals.push(sumNormals[0]);
            abs_surface_normals.push(sumNormals[1]);
            abs_surface_normals.push(sumNormals[2]);
        }
        let rightVector = camera.getRightVector();
        let upVector = camera.getUpVector();
        let rightPoint = [centerPlane[0] + rightVector[0], centerPlane[1] + rightVector[1], centerPlane[2] + rightVector[2]]; // auxiliary point to represent the right direction
        let upPoint = [centerPlane[0] + upVector[0], centerPlane[1] + upVector[1], centerPlane[2] + upVector[2]]; // auxiliary point to represent the up direction
        let cornerDistances = []; // stores the distance of the corners of the plane to each vector
        let maxMinDistances = []; // stores if the flat_node has a min or max up or right
        for (let i = 0; i < flat_nodes.length / 3; i++) {
            let distanceRight = Math.sqrt(Math.pow(flat_nodes[i * 3] - rightPoint[0], 2) + Math.pow(flat_nodes[i * 3 + 1] - rightPoint[1], 2) + Math.pow(flat_nodes[i * 3 + 2] - rightPoint[2], 2)); // euclidean distance
            let distanceUp = Math.sqrt(Math.pow(flat_nodes[i * 3] - upPoint[0], 2) + Math.pow(flat_nodes[i * 3 + 1] - upPoint[1], 2) + Math.pow(flat_nodes[i * 3 + 2] - upPoint[2], 2)); // euclidean distance
            cornerDistances.push([distanceRight, distanceUp, i]);
            maxMinDistances.push({ minRight: false, minUp: false, maxRight: false, maxUp: false }); // initialize vector with all positions false
        }
        // minUp, maxRight: 0,0
        // minUp, minRight: 1,0
        // maxUp, maxRight: 0,1
        // maxUp, minRight: 1,1
        // sort by crescent order of right distance
        cornerDistances.sort((a, b) => {
            return a[0] - b[0];
        });
        for (let i = 0; i < 4; i++) {
            if (i == 0 || i == 1) {
                maxMinDistances[cornerDistances[i][2]].minRight = true;
            }
            else {
                maxMinDistances[cornerDistances[i][2]].maxRight = true;
            }
        }
        // sort by crescent order of up distance
        cornerDistances.sort((a, b) => {
            return a[1] - b[1];
        });
        for (let i = 0; i < 4; i++) {
            if (i == 0 || i == 1) {
                maxMinDistances[cornerDistances[i][2]].minUp = true;
            }
            else {
                maxMinDistances[cornerDistances[i][2]].maxUp = true;
            }
        }
        let function_sequence = [];
        let sequenceChecker = [0, 0, 0, 0]; // Each position represents one corner of the image and the number, the amount of times that corner was attached to a point 
        maxMinDistances.forEach((elem) => {
            if (elem.minUp && elem.maxRight) {
                sequenceChecker[0] += 1;
                function_sequence.push(0); // 0
                function_sequence.push(0);
            }
            else if (elem.minUp && elem.minRight) {
                sequenceChecker[1] += 1;
                function_sequence.push(1); // 1
                function_sequence.push(0);
            }
            else if (elem.maxUp && elem.maxRight) {
                sequenceChecker[2] += 1;
                function_sequence.push(0); // 0
                function_sequence.push(1);
            }
            else if (elem.maxUp && elem.minRight) {
                sequenceChecker[3] += 1;
                function_sequence.push(1); // 1
                function_sequence.push(1);
            }
        });
        let validSequence = true;
        sequenceChecker.forEach((elem) => {
            if (elem != 1) {
                validSequence = false;
            }
        });
        if (validSequence) {
            abs_surface_function = abs_surface_function.concat(function_sequence);
        }
        else { // backup sequence
            // abs_surface_function = abs_surface_function.concat([0,1, 0,0, 1,0, 1,1]);
            abs_surface_function = abs_surface_function.concat([0, 1, 0, 0, 1, 0, 1, 1]);
        }
        // storing coordinates to calculate euclidean distances
        let topLeft = [];
        let bottomLeft = [];
        let topRight = [];
        // figure out height and width of the surface
        for (let i = 0; i < 4; i++) {
            let value1 = abs_surface_function[i * 2];
            let value2 = abs_surface_function[i * 2 + 1];
            if (value1 == 0 && value2 == 0) {
                topLeft.push(abs_surface_coords[i * 3]);
                topLeft.push(abs_surface_coords[i * 3 + 1]);
                topLeft.push(abs_surface_coords[i * 3 + 2]);
            }
            else if (value1 == 0 && value2 == 1) {
                bottomLeft.push(abs_surface_coords[i * 3]);
                bottomLeft.push(abs_surface_coords[i * 3 + 1]);
                bottomLeft.push(abs_surface_coords[i * 3 + 2]);
            }
            else if (value1 == 1 && value2 == 0) {
                topRight.push(abs_surface_coords[i * 3]);
                topRight.push(abs_surface_coords[i * 3 + 1]);
                topRight.push(abs_surface_coords[i * 3 + 2]);
            }
        }
        let width = Math.sqrt(Math.pow(topLeft[0] - topRight[0], 2) + Math.pow(topLeft[1] - topRight[1], 2) + Math.pow(topLeft[2] - topRight[2], 2));
        let height = Math.sqrt(Math.pow(topLeft[0] - bottomLeft[0], 2) + Math.pow(topLeft[1] - bottomLeft[1], 2) + Math.pow(topLeft[2] - bottomLeft[2], 2));
        // calculate function index. Which is the same thing as index. Also retrieve highligh info.
        let plotDataElements = [];
        this._pickedCoordinates.forEach((coordIndex) => {
            let elem = {};
            elem.index = coordIndex; // considers the geometry level
            elem.functionIndex = coordIndex;
            plotDataElements.push(elem);
        });
        let texImage = await this.generateCustomTexture(spec, specType, JSON.stringify(plotDataElements), width, height);
        this._lastCode += 1;
        this._pickedCoordinates = [];
        return { indices: abs_surface_indices, coords: abs_surface_coords, functionValues: abs_surface_function, image: texImage, code: this._lastCode };
    }
    /**
     * Reset the data structures that keep track of instantiated surfaces
     */
    clearSurfaces() {
        this._footprintPlaneHeightByCoord = [];
        for (let i = 0; i < this._coords.length / 3; i++) {
            this._footprintPlaneHeightByCoord.push(-1.0);
        }
        this._planeHeightDirty = true;
        this._footprintCodesPerBuilding = [];
    }
    /**
     * Calculate the sum of normals of the picked coordinates
     */
    sumPickedNormals() {
        if (this._pickedCoordinates.length == 0) {
            return [];
        }
        let sumNormals = [0, 0, 0];
        this._pickedCoordinates.forEach((indexCoord) => {
            let x = this._normals[indexCoord * 3]; // TODO considering that normals are in 3D (dont know if it is always true)
            let y = this._normals[(indexCoord * 3) + 1];
            let z = this._normals[(indexCoord * 3) + 2];
            sumNormals = [sumNormals[0] + x, sumNormals[1] + y, sumNormals[2] + z];
        });
        let x = sumNormals[0];
        let y = sumNormals[1];
        let z = sumNormals[2];
        // convert result to unit vector
        let nrm = Math.sqrt(x * x + y * y + z * z);
        return [x / nrm, y / nrm, z / nrm];
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.enable(glContext.BLEND);
        glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
        glContext.useProgram(this._shaderProgram);
        // binds data
        this.bindUniforms(glContext, camera);
        // was used for the outline
        // glContext.stencilFunc(
        //     glContext.EQUAL,     // the test
        //     0,            // reference value
        //     0xFF,         // mask
        // );
        glContext.stencilFunc(glContext.GEQUAL, // the test
        zOrder, // reference value
        0xFF);
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.REPLACE);
        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);
        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        glContext.disable(glContext.BLEND);
    }
}

var vsAbsSurface = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec2 funcValues;out highp vec2 texCoords;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;texCoords=funcValues;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsAbsSurface = "#version 300 es\nuniform highp sampler2D u_texture;in highp vec2 texCoords;out highp vec4 fragColor;void main(){fragColor=texture(u_texture,texCoords);if(fragColor==vec4(0,1,0,1)){discard;}}";

class TextureComponent {
    _glContext;
    _texImage = null;
    _htmlImage = null;
    constructor(glContext) {
        this._glContext = glContext;
    }
    get texImage() {
        return this._texImage;
    }
    get htmlImage() {
        return this._htmlImage;
    }
    // load image from html image element
    loadTextureFromHtml(img) {
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
        this._glContext.texImage2D(this._glContext.TEXTURE_2D, 0, this._glContext.RGBA, this._glContext.RGBA, this._glContext.UNSIGNED_BYTE, img);
        this._glContext.generateMipmap(this._glContext.TEXTURE_2D);
    }
}

/**
 * This shader should only be used with the buildings layer
 */
class ShaderAbstractSurface extends Shader {
    // Data loaction on GPU
    _glCoords = null;
    _glFunction = null;
    _glIndices = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _functionId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _textureLocation = null;
    // Image textures
    // protected _texComponentsGliphs: TextureComponent[];
    // Surface abstraction
    _absSurfaces = [];
    _currentIndexTexture;
    // Footprint surface
    _footprintSurfaces = [];
    // If a abs surface ("abs") or a footprint plot is being rendered ("foot")
    _currentSurfaceType;
    _filtered = [];
    constructor(glContext) {
        super(vsAbsSurface, fsAbsSurface, glContext);
        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures();
    }
    /**
     * Get a HTMLImageElement[] containing all the images used in the abstract surfaces
     */
    getAbsSurfacesImages() {
        let images = [];
        this._absSurfaces.forEach((surface) => {
            if (surface.texComponent.htmlImage) {
                images.push(surface.texComponent.htmlImage);
            }
        });
        return images;
    }
    setHighlightElements(coordinates, value) {
        throw Error("The abstract surface shader can not highlight elements");
    }
    // TODO: get income data from a mesh object not a list
    updateShaderGeometry(mesh) {
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    updateShaderData(mesh, knot) {
    }
    updateShaderUniforms(data) {
    }
    createTextures() {
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        // this._filteredDirty = true;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    bindTextures(glContext) {
        glContext.uniform1i(this._textureLocation, 0); // texture unit 0
        glContext.activeTexture(glContext.TEXTURE0);
        let surfaces = [];
        if (this._currentSurfaceType == "abs") {
            surfaces = this._absSurfaces;
        }
        else if (this._currentSurfaceType == "foot") {
            surfaces = this._footprintSurfaces;
        }
        else {
            throw new Error("Type " + this._currentSurfaceType + " does not exist");
        }
        let texComponent = surfaces[this._currentIndexTexture].texComponent;
        glContext.bindTexture(glContext.TEXTURE_2D, texComponent.texImage);
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        let surfaces = [];
        if (this._currentSurfaceType == "abs") {
            surfaces = this._absSurfaces;
        }
        else if (this._currentSurfaceType == "foot") {
            surfaces = this._footprintSurfaces;
        }
        else {
            throw new Error("Type " + this._currentSurfaceType + " does not exist");
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(surfaces[this._currentIndexTexture].coords), glContext.STATIC_DRAW);
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(surfaces[this._currentIndexTexture].functionValues), glContext.STATIC_DRAW);
        glContext.vertexAttribPointer(this._functionId, 2, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(surfaces[this._currentIndexTexture].indices), glContext.STATIC_DRAW);
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
    addSurface(glContext, image, coords, indices, functionValues, type = "abs", code) {
        let newTextureComponent = new TextureComponent(glContext);
        newTextureComponent.loadTextureFromHtml(image);
        if (type == "abs") {
            this._absSurfaces.push({ indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code });
        }
        else if (type == "foot") {
            this._footprintSurfaces.push({ indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code });
        }
        else {
            throw new Error("Type " + type + " does not exist");
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
    updateSurface(glContext, image, coords, indices, functionValues, type = "abs", code) {
        let surfaces = [];
        let newTextureComponent = new TextureComponent(glContext);
        newTextureComponent.loadTextureFromHtml(image);
        if (type == "abs") {
            surfaces = this._absSurfaces;
        }
        else if (type == "foot") {
            surfaces = this._footprintSurfaces;
        }
        for (let i = 0; i < surfaces.length; i++) {
            if (surfaces[i].code == code) {
                surfaces[i] = { indices: indices, coords: coords, functionValues: functionValues, texComponent: newTextureComponent, code: code };
            }
        }
    }
    clearSurfaces() {
        this.clearFootprintPlots();
        this.clearAbsSurfaces();
    }
    clearFootprintPlots() {
        this._footprintSurfaces = [];
    }
    clearAbsSurfaces() {
        this._absSurfaces = [];
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        this.bindUniforms(glContext, camera);
        glContext.stencilFunc(glContext.ALWAYS, // the test
        2, // reference value
        0xFF);
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.REPLACE);
        // render footprint plots first
        for (let i = 0; i < this._footprintSurfaces.length; i++) {
            // binds data
            this._currentIndexTexture = i; // used in bindVertexArrayObject and bindTextures (bypassing function signature defined in shader.ts)
            this._currentSurfaceType = "foot";
            this.bindVertexArrayObject(glContext, mesh);
            this.bindTextures(glContext);
            // draw the geometry
            glContext.drawElements(glPrimitive, 6, glContext.UNSIGNED_INT, 0); // each surface has 6 indices elements
        }
        // // Only passes when stencil == 0 (there is no abstract surface)
        glContext.stencilFunc(glContext.EQUAL, // the test
        0, // reference value
        0xFF);
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.KEEP);
        // render the surfaces later
        for (let i = 0; i < this._absSurfaces.length; i++) {
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

class Environment {
    // App environment parameters
    static backend = 'localhost';
    // public static dataFolder = '../data'
    /**
     * Set environment parameters
     * @param {{backend: string}} env Environment parameters
     */
    // public static setEnvironment(env: {backend: string, dataFolder: string}): void {
    static setEnvironment(env) {
        Environment.backend = env.backend;
        // Environment.dataFolder = env.dataFolder;
    }
}

class DataLoader {
    /**
     * Loads a json file
     * @param {string} url json file url
     * @returns {Promise<unknown>} The load json promise
     */
    static async getJsonData(url) {
        function parseFile(file, callback) {
            var fileSize = file.size;
            var chunkSize = 64 * 1024; // bytes
            var offset = 0;
            // var self:any = this; // we need a reference to the current object
            var chunkReaderBlock = null;
            var readEventHandler = function (evt) {
                if (evt.target.error == null) {
                    offset += evt.target.result.length;
                    callback.add(evt.target.result); // callback for handling read chunk
                }
                else {
                    console.log("Read error: " + evt.target.error);
                    return;
                }
                if (offset >= fileSize) {
                    callback.done(undefined);
                    return;
                }
                // of to the next chunk
                chunkReaderBlock(offset, chunkSize, file);
            };
            chunkReaderBlock = function (_offset, length, _file) {
                var r = new FileReader();
                var blob = _file.slice(_offset, length + _offset);
                r.onload = readEventHandler;
                r.readAsText(blob);
            };
            // now let's start the read with the first block
            chunkReaderBlock(offset, chunkSize, file);
        }
        // Return a new promise.
        const response = await fetch(url, {
            headers: {
                'Accept-Encoding': 'gzip',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            return null;
        }
        let json = {};
        let jsonString = '';
        const contentEncoding = response.headers.get('Content-Encoding');
        if (contentEncoding && contentEncoding.includes('gzip')) { // if the response is encoded
            const blob = await response.blob();
            await new Promise((resolve, reject) => {
                const addFunc = (value) => {
                    jsonString += value;
                };
                parseFile(blob, { add: addFunc, done: resolve }); // Read in chunks
            });
            json = JSON.parse(jsonString);
        }
        else {
            json = await response.json();
        }
        return json;
    }
    static async getBinaryData(url, type) {
        function readFile(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
            });
        }
        // Return a new promise.
        const response = await fetch(url, {
            headers: {
                'Accept-Encoding': 'gzip'
            }
        });
        if (!response.ok)
            throw Error("Loading binary data failed");
        const blob = await response.blob();
        let arrayResult = await readFile(blob);
        if (type == 'f') {
            return new Float32Array(arrayResult);
        }
        if (type == 'd') {
            return new Float64Array(arrayResult);
        }
        if (type == 'I') {
            return new Uint32Array(arrayResult);
        }
        return null;
    }
    /**
     * Loads a text file
     * @param {string} url text file url
     * @returns {Promise<string>} The load text promise
     */
    static async getTextData(url) {
        // Return a new promise.
        const response = await fetch(url);
        const txt = await response.text();
        return txt;
    }
}

class DataApi {
    /**
     * Load all layers
     * @param {string} index The layers index file
     */
    static async getMapData(index) {
        const url = `${Environment.backend}/files/${index}`;
        const datasets = await DataLoader.getJsonData(url);
        return datasets;
    }
    /**
     * Load a custom style
     * @param {string} style The style file
     */
    static async getCustomStyle(style) {
        const url = `${Environment.backend}/files/${style}.json`;
        const custom = await DataLoader.getJsonData(url);
        return custom;
    }
    /**
     * Load the camera
     * @param {string} camera The camera file
     */
    static async getCameraParameters(camera) {
        const url = `${Environment.backend}/files/${camera}.json`;
        const params = await DataLoader.getJsonData(url);
        return params;
    }
    /**
     * Gets the layer data
     * @param {string} layerId the layer data
     */
    static async getLayer(layerId) {
        const url_base = `${Environment.backend}/files/${layerId}.json`;
        const url_coordinates = `${Environment.backend}/files/${layerId}_coordinates.data`;
        const url_indices = `${Environment.backend}/files/${layerId}_indices.data`;
        const url_normals = `${Environment.backend}/files/${layerId}_normals.data`;
        const url_ids = `${Environment.backend}/files/${layerId}_ids.data`;
        const base_feature = await DataLoader.getJsonData(url_base);
        let coordinates;
        let indices;
        let normals;
        let ids;
        if (base_feature.data != undefined) {
            if (base_feature.data[0].geometry.coordinates != undefined) {
                console.log(url_coordinates);
                coordinates = await DataLoader.getBinaryData(url_coordinates, 'd');
            }
            if (base_feature.data[0].geometry.indices != undefined) {
                console.log(url_indices);
                indices = await DataLoader.getBinaryData(url_indices, 'I');
            }
            if (base_feature.data[0].geometry.normals != undefined) {
                console.log(url_normals);
                normals = await DataLoader.getBinaryData(url_normals, 'f');
            }
            if (base_feature.data[0].geometry.ids != undefined) {
                console.log(url_ids);
                ids = await DataLoader.getBinaryData(url_ids, 'I');
            }
            for (let i = 0; i < base_feature.data.length; i++) {
                if (coordinates != undefined) {
                    let startAndSize = base_feature.data[i].geometry.coordinates;
                    base_feature.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0] + startAndSize[1]));
                }
                if (indices != undefined) {
                    let startAndSize = base_feature.data[i].geometry.indices;
                    base_feature.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0] + startAndSize[1]));
                }
                if (normals != undefined) {
                    let startAndSize = base_feature.data[i].geometry.normals;
                    base_feature.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0] + startAndSize[1]));
                }
                if (ids != undefined) {
                    let startAndSize = base_feature.data[i].geometry.ids;
                    base_feature.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0] + startAndSize[1]));
                }
            }
        }
        return base_feature;
    }
    /**
     * Gets the layer data
     * @param {string} layerId the layer data
     */
    static async getLayerFeature(layerId) {
        const url = `${Environment.backend}/files/${layerId}.json`;
        const feature = await DataLoader.getJsonData(url);
        return feature;
    }
    /**
     * Gets the layer function
     * @param {string} layerId the layer data
     */
    static async getLayerFunction(layerId) {
        // TODO
        const url = `${Environment.backend}/files/${layerId}.json`;
        const feature = await DataLoader.getJsonData(url);
        return feature;
    }
    /**
     * Gets the layer function
     * @param {string} layerId the layer data
     */
    static async getLayerHighlight(layerId) {
        // TODO
        const url = `${Environment.backend}/files/${layerId}.json`;
        const feature = await DataLoader.getJsonData(url);
        return feature;
    }
    static async getJoinedJson(layerId) {
        const url = `${Environment.backend}/files/${layerId + "_joined"}.json`;
        const joinedJson = await DataLoader.getJsonData(url);
        return joinedJson;
    }
}

var land$1 = "#F6F6F4";
var roads$1 = "#FFFFFF";
var parks$1 = "#cccccd";
var water$1 = "#cad2d4";
var sky$1 = "#FFFFFF";
var building$1 = "#DFDFDF";
var light$1 = {
	land: land$1,
	roads: roads$1,
	parks: parks$1,
	water: water$1,
	sky: sky$1,
	building: building$1
};

var land = "#343331";
var roads = "#454545";
var parks = "#191b1a";
var water = "#191b1a";
var sky = "#000000";
var building = "#DFDFDF";
var dark$1 = {
	land: land,
	roads: roads,
	parks: parks,
	water: water,
	sky: sky,
	building: building
};

class MapStyle {
    // default color map
    static default = {
        land: '#DFDFDF',
        roads: '#d9b504',
        parks: '#C3D0B2',
        water: '#BED2D7',
        sky: '#ffffff',
        building: '#DFDFDF'
    };
    // sky: '#BED2D7',
    // default color for unknown layers
    static notFound = "#FFFFFF";
    // default highlight color
    static highlight = "#FFDD00";
    // custom style
    static custom = MapStyle.default;
    /**
     * Converts from hex colors to rgb colors
     * @param hex
     * @returns
     */
    static hexToRgb(hex) {
        const str = hex.slice(1, 7);
        const rgb = [0, 2, 4].map((start) => {
            return parseInt(str.slice(start, start + 2), 16) / 255;
        });
        return rgb;
    }
    /**
     * Get the feature color
     * @param {string} type Feature type
     */
    static getColor(type) {
        // uses the default style if available
        const style = MapStyle.custom || MapStyle.default;
        const hex = style[type] || MapStyle.notFound;
        return MapStyle.hexToRgb(hex);
    }
    /**
     * Set the feature color
     * @param {any} style new map style in id: #rrggbb format
     */
    // @ts-ignore
    static async setColor(style) {
        let styleObj = MapStyle.default;
        if (typeof style === 'string' && style === 'light') {
            // @ts-ignore
            styleObj = light$1;
        }
        else if (typeof style === 'string' && style === 'dark') {
            // @ts-ignore
            styleObj = dark$1;
        }
        else if (typeof style === 'string') {
            // Load style from path
            const custom = await DataApi.getCustomStyle(style);
            styleObj = custom;
        }
        else {
            styleObj = style;
        }
        MapStyle.custom = styleObj;
    }
    static getHighlightColor() {
        return MapStyle.hexToRgb(MapStyle.highlight);
    }
}

var vsPicking$1 = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec4 cellIds;out highp vec4 idColors;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;idColors=cellIds;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsPicking$1 = "#version 300 es\nin highp vec4 idColors;out highp vec4 fragColor;void main(){fragColor=idColors;}";

/**
 * This shader should only be used with the buildings layer
 */
class ShaderPicking extends Shader {
    // Data to be rendered
    _coords = [];
    _indices = [];
    _cellIds = [];
    // Data loaction on GPU
    _glCoords = null;
    _glIndices = null;
    _glCellIds = null;
    // Data has chaged
    _coordsDirty = false;
    _cellIdsDirty = false;
    _resizeDirty = true;
    _clickDirty = false;
    _pickFilterDirty = false;
    _footDirty = false;
    _pickObjectDirty = false;
    _pickingForUpdate = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _cellIdsId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uColorMap = null;
    // Texture to support picking
    _texPicking = null;
    _depthBuffer = null;
    _frameBuffer = null;
    // Picking positions
    _pixelX;
    _pixelY;
    _pixelXFilter;
    _pixelYFilter;
    _pickingWidth;
    _pickingHeight;
    _pickingFilterWidth;
    _pickingFilterHeight;
    _selectedFiltered; // ids of elements selected by the user to build the filtering bbox
    _cellIdsByCoordinates = []; // stores the cell id of each coordinate grouped by mesh component
    // Footprint picking position
    _footPixelX;
    _footPixelY;
    _currentPickedFoot;
    _filtered = []; // coordinates to disconsider in further interactions
    _objectPixelX;
    _objectPixelY;
    _pickedCells = new Set();
    _currentPickedCells = new Set(); // store the current brushed cells while the brushing is still happening
    _auxiliaryShader;
    _coordsPerComp;
    /**
     *
     * @param {AuxiliaryShader} auxiliaryShader The shader responsible for receiving picking data
     */
    constructor(glContext, auxiliaryShader) {
        super(vsPicking$1, fsPicking$1, glContext);
        this._auxiliaryShader = auxiliaryShader;
        // creathe the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    /**
     * Sets the resize dirty information
     */
    set resizeDirty(resizeDirty) {
        this._resizeDirty = resizeDirty;
    }
    get selectedFiltered() {
        return this._selectedFiltered;
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._cellIdsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._indices = mesh.getIndicesVBO();
        this._coordsPerComp = mesh.getCoordsPerComp();
        this._cellIds = [];
        this._cellIdsByCoordinates = mesh.getIdsCoordinates();
        this._auxiliaryShader.setIdsCoordinates(this._cellIdsByCoordinates);
        for (const componentElem of this._cellIdsByCoordinates) {
            for (const elem of componentElem) {
                this._cellIds.push(((elem >> 0) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >> 8) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >> 16) & 0xFF) / 0xFF);
                this._cellIds.push(((elem >> 24) & 0xFF) / 0xFF);
            }
        }
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        // this._filteredDirty = true;
    }
    updatePickPosition(pixelX, pixelY, width, height) {
        this._clickDirty = true;
        this._pixelX = pixelX;
        this._pixelY = pixelY;
        if (width == 0) {
            this._pickingWidth = 1;
        }
        else {
            this._pickingWidth = width;
        }
        if (height == 0) {
            this._pickingHeight = 1;
        }
        else {
            this._pickingHeight = height;
        }
    }
    updatePickFilterPosition(pixelX, pixelY, width, height) {
        this._pickFilterDirty = true;
        this._pixelXFilter = pixelX;
        this._pixelYFilter = pixelY;
        if (width == 0) {
            this._pickingFilterWidth = 1;
        }
        else {
            this._pickingFilterWidth = width;
        }
        if (height == 0) {
            this._pickingFilterHeight = 1;
        }
        else {
            this._pickingFilterHeight = height;
        }
    }
    /**
     *
     * @param pixelX
     * @param pixelY
     * @param update indicates if this picking is for creating a new plot or updating
     */
    updateFootPosition(pixelX, pixelY, update) {
        this._footDirty = true;
        this._footPixelX = pixelX;
        this._footPixelY = pixelY;
        this._pickingForUpdate = update;
    }
    // when the brushing action ended
    applyBrushing() {
        for (const id of Array.from(this._currentPickedCells)) {
            this._pickedCells.add(id);
        }
        this._currentPickedCells = new Set();
    }
    isFilteredIn(objectId) {
        if (this._filtered.length == 0) {
            return true;
        }
        else {
            let readCoords = 0;
            for (let i = 0; i < this._coordsPerComp.length; i++) {
                let countCoords = this._coordsPerComp[i];
                if (i == objectId) {
                    if (this._filtered[readCoords] == 1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                readCoords += countCoords;
            }
        }
        return false;
    }
    pickPixel(glContext) {
        const data = new Uint8Array(Math.ceil(Math.abs(this._pickingHeight) * Math.abs(this._pickingWidth) * 4));
        for (let i = 0; i < data.length; i++) { // initializing data array with 255 to recognize not used positions
            data[i] = 255;
        }
        glContext.readPixels(this._pixelX, // x
        this._pixelY, // y
        this._pickingWidth, // width
        this._pickingHeight, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let ids = new Set();
        let dataByFour = Math.floor(data.length / 4);
        for (let i = 0; i < dataByFour; i++) {
            if (data[i * 4] == 255 && data[i * 4 + 1] == 255 && data[i * 4 + 2] == 255 && data[i * 4 + 3] == 255) { // some portions of the data array are not used
                continue;
            }
            else {
                ids.add(data[i * 4] + (data[i * 4 + 1] << 8) + (data[i * 4 + 2] << 16) + (data[i * 4 + 3] << 24));
            }
        }
        this._currentPickedCells = new Set();
        let arrayFromIds = Array.from(ids);
        for (const id of arrayFromIds) {
            let idBuildingLevel = this.objectFromCell(id);
            if (this.isFilteredIn(idBuildingLevel)) { // it is filtered in, therefore can interact
                this._currentPickedCells.add(id);
            }
        }
        this._auxiliaryShader.setPickedCells(new Set([...Array.from(this._pickedCells), ...Array.from(this._currentPickedCells)]));
    }
    getBboxFiltered(mesh) {
        let coordsPerComp = mesh.getCoordsPerComp();
        let minX = null;
        let minY = null;
        let maxX = null;
        let maxY = null;
        let readCoords = 0;
        for (let i = 0; i < coordsPerComp.length; i++) {
            if (this._selectedFiltered.includes(i)) {
                for (let j = 0; j < coordsPerComp[i]; j++) {
                    let x = this._coords[(readCoords + j) * mesh.dimension];
                    let y = this._coords[(readCoords + j) * mesh.dimension + 1];
                    if (minX == null) {
                        minX = x;
                    }
                    else if (x < minX) {
                        minX = x;
                    }
                    if (minY == null) {
                        minY = y;
                    }
                    else if (y < minY) {
                        minY = y;
                    }
                    if (maxX == null) {
                        maxX = x;
                    }
                    else if (x > maxX) {
                        maxX = x;
                    }
                    if (maxY == null) {
                        maxY = y;
                    }
                    else if (y > maxY) {
                        maxY = y;
                    }
                }
            }
            readCoords += coordsPerComp[i];
        }
        if (minX == null) {
            minX = 0;
        }
        if (minY == null) {
            minY = 0;
        }
        if (maxX == null) {
            maxX = 0;
        }
        if (maxY == null) {
            maxY = 0;
        }
        return [minX, minY, maxX, maxY];
    }
    objectFromCell = (cellId) => {
        for (let i = 0; i < this._cellIdsByCoordinates.length; i++) {
            let compElement = this._cellIdsByCoordinates[i];
            for (let j = 0; j < compElement.length; j++) {
                if (cellId == compElement[j]) {
                    return i;
                }
            }
        }
        return -1;
    };
    pickPixelFilter(glContext) {
        const data = new Uint8Array(Math.ceil(Math.abs(this._pickingFilterHeight) * Math.abs(this._pickingFilterWidth) * 4));
        for (let i = 0; i < data.length; i++) { // initializing data array with 255 to recognize not used positions
            data[i] = 255;
        }
        glContext.readPixels(this._pixelXFilter, // x
        this._pixelYFilter, // y
        this._pickingFilterWidth, // width
        this._pickingFilterHeight, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let ids = new Set();
        let dataByFour = Math.floor(data.length / 4);
        for (let i = 0; i < dataByFour; i++) {
            if (data[i * 4] == 255 && data[i * 4 + 1] == 255 && data[i * 4 + 2] == 255 && data[i * 4 + 3] == 255) { // some portions of the data array are not used
                continue;
            }
            else {
                ids.add(data[i * 4] + (data[i * 4 + 1] << 8) + (data[i * 4 + 2] << 16) + (data[i * 4 + 3] << 24));
            }
        }
        let idsBuildingsLevel = new Set();
        let idsArray = Array.from(ids);
        for (const id of idsArray) {
            idsBuildingsLevel.add(this.objectFromCell(id));
        }
        this._selectedFiltered = Array.from(idsBuildingsLevel);
    }
    pickFoot(glContext) {
        const data = new Uint8Array(4);
        glContext.readPixels(this._footPixelX, // x
        this._footPixelY, // y
        1, // width
        1, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
        let idBuildingLevel = this.objectFromCell(id);
        if (this.isFilteredIn(idBuildingLevel)) { // filtered in, therefore can be interacted
            this._currentPickedFoot = id;
            this._auxiliaryShader.setPickedFoot(this._currentPickedFoot, this._pickingForUpdate);
        }
    }
    pickObject(glContext) {
        const data = new Uint8Array(4);
        glContext.readPixels(this._objectPixelX, // x
        this._objectPixelY, // y
        1, // width
        1, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
        let idBuildingLevel = this.objectFromCell(id);
        if (this.isFilteredIn(idBuildingLevel)) { // filtered in, therefore can be interacted
            this._auxiliaryShader.setPickedObject(id);
        }
    }
    updatePickObjectPosition(pixelX, pixelY) {
        this._pickObjectDirty = true;
        this._objectPixelX = pixelX;
        this._objectPixelY = pixelY;
    }
    clearPicking() {
        this._currentPickedCells = new Set();
        this._pickedCells = new Set();
        this._auxiliaryShader.setPickedCells(this._pickedCells);
    }
    updateShaderData(mesh, knot) {
        return;
    }
    updateShaderUniforms(data) {
        return;
    }
    setHighlightElements(coordinates, value) {
        this._auxiliaryShader.setHighlightElements(coordinates, value);
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        // this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    setFramebufferAttachmentSizes(glContext, width, height) {
        glContext.bindTexture(glContext.TEXTURE_2D, this._texPicking);
        // define size and format of level 0
        const level = 0;
        const internalFormat = glContext.RGBA;
        const border = 0;
        const format = glContext.RGBA;
        const type = glContext.UNSIGNED_BYTE;
        const data = null;
        glContext.texImage2D(glContext.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);
        glContext.bindRenderbuffer(glContext.RENDERBUFFER, this._depthBuffer);
        glContext.renderbufferStorage(glContext.RENDERBUFFER, glContext.DEPTH_COMPONENT16, width, height);
    }
    createTextures(glContext) {
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
    bindTextures(glContext) {
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, this._frameBuffer);
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCellIds);
        // send data to gpu
        if (this._cellIdsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._cellIds), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._cellIdsId, 4, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._cellIdsId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        // this._colorOrTexDirty = false;
        this._coordsDirty = false;
        this._cellIdsDirty = false;
        // this._functionDirty = false;
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        if (this._resizeDirty) {
            this.setFramebufferAttachmentSizes(glContext, glContext.canvas.width, glContext.canvas.height);
            this._resizeDirty = false;
        }
        // binds data
        this.bindTextures(glContext);
        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);
        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        if (this._pickFilterDirty) {
            this.pickPixelFilter(glContext);
            this._pickFilterDirty = false;
        }
        if (this._clickDirty) {
            this.pickPixel(glContext);
            this._clickDirty = false;
        }
        if (this._footDirty) {
            this.pickFoot(glContext);
            this._footDirty = false;
            this._pickingForUpdate = false;
        }
        if (this._pickObjectDirty) {
            this.pickObject(glContext);
            this._pickObjectDirty = false;
        }
        MapStyle.getColor('sky').concat([1.0]);
        let blankColorRGBA = [];
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        glContext.clearColor(blankColorRGBA[0], blankColorRGBA[1], blankColorRGBA[2], blankColorRGBA[3]);
        glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null);
    }
}

var vsOutline = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp float cornerValues;in highp float inWallWidth;in highp float inSectionHeight;in highp float inHeightInSection;in lowp float inFiltered;out highp float cornerBool;out highp float wallWidth;out highp float surfaceHeight;out highp float heightInSection;out lowp float filtered;void main(){highp vec3 finalPos=vertCoords;cornerBool=cornerValues;wallWidth=inWallWidth;surfaceHeight=inSectionHeight;heightInSection=inHeightInSection;filtered=inFiltered;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsOutline = "#version 300 es\nin highp float cornerBool;in highp float wallWidth;in highp float surfaceHeight;in highp float heightInSection;in lowp float filtered;out highp vec4 fragColor;void main(){if(filtered<=0.5){discard;}else{if(cornerBool>=-0.1&&((cornerBool<=0.4||cornerBool>=(wallWidth-0.4))||(heightInSection<=0.4||heightInSection>=(surfaceHeight-0.4)))){fragColor=vec4(0,0,0,1);}else{discard;}}}";

/**
 * This shader should only be used with the buildings layer
 */
class ShaderOutline extends Shader {
    // Data to be rendered
    _coords = [];
    _normals = [];
    _indices = [];
    _heights = [];
    _minHeights = [];
    _uv = [];
    _heightInSection = [];
    _sectionHeight = [];
    _width = [];
    // Data loaction on GPU
    _glCoords = null;
    _glNormals = null;
    _glFunction = null;
    _glIndices = null;
    _glColorOrTex = null;
    _glUV = null;
    _glWidth = null;
    _glHeightInSection = null;
    _glSectionHeight = null;
    _glFiltered = null;
    // Data has chaged
    _coordsDirty = false;
    _filteredDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _normalsId = -1;
    _functionId = -1;
    _colorOrTexId = -1;
    _uvId = -1;
    _widthId = -1;
    _heightInSectionId = -1;
    _sectionHeightId = -1;
    _filteredId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _textureLocation = null;
    // Color map texture
    _texColorMap;
    // Picking
    _colorOrTexValues = [];
    _cellIdsByCoordinates = [];
    _pickedCoordinates = []; // store index of coordinates not the coordinates themselves
    _auxCoords = [];
    _auxIndices = [];
    _auxNormals = [];
    _auxFunction = [];
    _auxColorOrTexValues = [];
    _filtered = [];
    constructor(glContext) {
        super(vsOutline, fsOutline, glContext);
        // create the shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    updateShaderGeometry(mesh) {
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
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    updateShaderData(mesh, knot) {
    }
    updateShaderUniforms(data) {
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._textureLocation = glContext.getUniformLocation(this._shaderProgram, "u_texture");
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    createTextures(glContext) {
    }
    bindTextures(glContext) {
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glHeightInSection);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._heightInSection), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._heightInSectionId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._heightInSectionId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glSectionHeight);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._sectionHeight), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._sectionHeightId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._sectionHeightId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glUV);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._uv), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._uvId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._uvId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glWidth);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._width), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._widthId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._widthId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
        this._filteredDirty = false;
    }
    setHighlightElements(coordinates, value) {
        throw Error("The outline shader can not highlight elements");
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.disable(glContext.CULL_FACE);
        glContext.useProgram(this._shaderProgram);
        // binds data
        this.bindUniforms(glContext, camera);
        // Always pass. Setting the reference value to 1
        glContext.stencilFunc(glContext.ALWAYS, // the test
        1, // reference value
        0xFF);
        // Set stencil to the reference value when both the stencil and depth tests pass
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.REPLACE);
        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);
        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        glContext.enable(glContext.CULL_FACE);
    }
}

class BuildingsLayer extends Layer {
    _zOrder;
    _coordsByCOORDINATES = [];
    _coordsByCOORDINATES3D = [];
    _coordsByOBJECTS = [];
    _highlightByCOORDINATES = [];
    _highlightByCOORDINATES3D = [];
    _highlightByOBJECTS = [];
    constructor(info, zOrder = 0, centroid, geometryData) {
        super(info.id, info.type, info.styleKey, info.renderStyle !== undefined ? info.renderStyle : [], centroid, 3, zOrder // TODO: set correct zOrder
        );
        console.log("buildings", zOrder);
        this._zOrder = zOrder;
        this.updateMeshGeometry(geometryData);
        // this._zOrder = 10; // TODO: set correct zOrder
    }
    supportInteraction(eventName) {
        return true;
    }
    updateMeshGeometry(data) {
        // loads the data
        this._mesh.load(data, false, this._centroid);
    }
    updateShaders(shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    // bypass the data extraction from link and injects it directly
    directAddMeshFunction(functionValues, knotId) {
        let distributedValues = this.distributeFunctionValues(functionValues);
        this._mesh.loadFunctionData(distributedValues, knotId);
    }
    updateFunction(knot, shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }
    setHighlightElements(elements, level, value, shaders) {
        let coords = this.getCoordsByLevel(level);
        for (let i = 0; i < elements.length; i++) {
            let offsetCoords = 0;
            let coordsIndex = [];
            let elementIndex = elements[i];
            for (let j = 0; j < elementIndex; j++) {
                offsetCoords += (coords[j].length) / 3;
            }
            for (let k = 0; k < (coords[elementIndex].length) / 3; k++) {
                coordsIndex.push(offsetCoords + k);
            }
            for (const shader of shaders) {
                if (shader instanceof ShaderPicking) {
                    shader.setHighlightElements(coordsIndex, value);
                }
            }
        }
    }
    getSelectedFiltering(shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderPicking) {
                return shader.getBboxFiltered(this._mesh);
            }
        }
        return null;
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext, shaders) {
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);
        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);
        // clear stencil
        glContext.clearStencil(0);
        glContext.clear(glContext.STENCIL_BUFFER_BIT);
        // the abs surfaces are loaded first to update the stencil
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface || shader instanceof ShaderOutline) {
                continue;
            }
            else {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        // for (const shader of shaders) {
        //     if(shader instanceof ShaderOutline){
        //         shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
        //     }
        // }
        // clear stencil
        // glContext.clearStencil(0);
        // glContext.clear(glContext.STENCIL_BUFFER_BIT);
        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
    async applyTexSelectedCells(glContext, spec, specType, shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                let meshAbsSurfaces = await shader.applyTexSelectedCells(this._camera, spec, specType);
                if (meshAbsSurfaces != undefined) {
                    for (const secondShader of shaders) {
                        if (secondShader instanceof ShaderAbstractSurface && meshAbsSurfaces) {
                            if (!meshAbsSurfaces.code) {
                                meshAbsSurfaces.code = -1;
                            }
                            secondShader.addSurface(glContext, meshAbsSurfaces.image, meshAbsSurfaces.coords, meshAbsSurfaces.indices, meshAbsSurfaces.functionValues, "abs", meshAbsSurfaces.code);
                        }
                    }
                }
            }
        }
    }
    clearAbsSurface(shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                shader.clearSurfaces();
            }
            if (shader instanceof ShaderSmoothColorMapTex) {
                shader.clearSurfaces();
            }
        }
    }
    createFootprintPlot(glContext, x, y, update, shaders) {
        if (!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)) {
            return;
        }
        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        for (const shader of shaders) {
            if (shader instanceof ShaderPicking) {
                shader.updateFootPosition(pixelX, pixelY, update);
            }
        }
    }
    async applyFootprintPlot(glContext, spec, plotNumber, specType, shaders) {
        let buildingId = -1;
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                let footPrintMesh = await shader.applyFootprintPlot(spec, false, plotNumber, 0, specType);
                buildingId = shader.currentFootPrintBuildingId;
                if (!footPrintMesh)
                    return;
                if (footPrintMesh.coords.length == 0) { // the mesh could not be created
                    continue;
                }
                for (const secondShader of shaders) {
                    if (secondShader instanceof ShaderAbstractSurface && footPrintMesh) {
                        if (footPrintMesh.code != undefined)
                            secondShader.addSurface(glContext, footPrintMesh.image, footPrintMesh.coords, footPrintMesh.indices, footPrintMesh.functionValues, "foot", footPrintMesh.code);
                    }
                }
            }
        }
        return buildingId;
    }
    async updateFootprintPlot(glContext, d3Expec, plotNumber, deltaHeight, specType, shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                let footPrintMesh = await shader.applyFootprintPlot(d3Expec, true, plotNumber, deltaHeight, specType);
                if (!footPrintMesh)
                    return;
                if (footPrintMesh.coords.length == 0) { // the mesh could not be updated
                    continue;
                }
                for (const secondShader of shaders) {
                    if (secondShader instanceof ShaderAbstractSurface && footPrintMesh) {
                        if (footPrintMesh.code != undefined)
                            secondShader.updateSurface(glContext, footPrintMesh.image, footPrintMesh.coords, footPrintMesh.indices, footPrintMesh.functionValues, "foot", footPrintMesh.code);
                    }
                }
            }
        }
    }
    perFaceAvg(functionValues, indices, ids) {
        let maxId = -1;
        for (const id of ids) {
            if (id > maxId) {
                maxId = id;
            }
        }
        let avg_accumulation_triangle = new Array(Math.trunc(indices.length / 3)).fill(0);
        let avg_accumulation_cell = new Array(maxId + 1).fill(0);
        let indicesByThree = Math.trunc(indices.length / 3);
        // calculate acc by triangle
        for (let i = 0; i < indicesByThree; i++) {
            let value = 0;
            value += functionValues[indices[i * 3]];
            value += functionValues[indices[i * 3 + 1]];
            value += functionValues[indices[i * 3 + 2]];
            avg_accumulation_triangle[i] = value / 3; // TODO: /3 or not? (distribute and accumulate?)
        }
        // calculate acc by cell based on the triangles that compose it
        let count_acc_cell = new Array(maxId + 1).fill(0);
        indicesByThree = Math.trunc(indices.length / 3);
        for (let i = 0; i < indicesByThree; i++) {
            let cell = ids[i];
            avg_accumulation_cell[cell] += avg_accumulation_triangle[i];
            count_acc_cell[cell] += 1;
        }
        indicesByThree = Math.trunc(indices.length / 3);
        for (let i = 0; i < indicesByThree; i++) {
            let cell = ids[i];
            avg_accumulation_triangle[i] = avg_accumulation_cell[cell] / count_acc_cell[cell];
        }
        return avg_accumulation_triangle;
    }
    /**
     * Distributes triangle avg to the coordinates that composes the triangle.
     * The coordinates need to be duplicated, meaning that there are unique indices.
     */
    perCoordinatesAvg(avg_accumulation_triangle, coordsLength, indices) {
        let avg_accumulation_per_coordinates = new Array(coordsLength).fill(0);
        for (let i = 0; i < avg_accumulation_triangle.length; i++) {
            let elem = avg_accumulation_triangle[i];
            avg_accumulation_per_coordinates[indices[i * 3]] = elem;
            avg_accumulation_per_coordinates[indices[i * 3 + 1]] = elem;
            avg_accumulation_per_coordinates[indices[i * 3 + 2]] = elem;
        }
        return avg_accumulation_per_coordinates;
    }
    distributeFunctionValues(functionValues) {
        if (functionValues == null) {
            return null;
        }
        let ids = this._mesh.getIdsVBO();
        let indices = this._mesh.getIndicesVBO();
        let coordsLength = this._mesh.getTotalNumberOfCoords();
        let per_face_avg_accum = this.perFaceAvg(functionValues, indices, ids);
        let avg_accumulation_per_coordinates = this.perCoordinatesAvg(per_face_avg_accum, coordsLength, indices);
        return avg_accumulation_per_coordinates;
    }
    innerAggFunc(functionValues, startLevel, endLevel, operation) {
        if (endLevel != LevelType.OBJECTS || startLevel == LevelType.OBJECTS) {
            throw new Error('Only operations that end in the Object level are currently supported for the buildings layer');
        }
        if (startLevel == LevelType.COORDINATES) {
            throw new Error('Operations with the COORDINATES level are currently not support for the buildings layer. Since the COORDINATES level refers to the buildings footprints.');
        }
        if (functionValues == null)
            return null;
        let coordsPerComp = this._mesh.getCoordsPerComp(); // in the buildings layer the components are the buildings
        let acc_functions_per_buildings = [];
        let readCoords = 0;
        for (const numberCoords of coordsPerComp) {
            let values = [];
            for (let i = 0; i < numberCoords; i++) {
                values.push(functionValues[i + readCoords]);
            }
            readCoords += numberCoords;
            acc_functions_per_buildings.push(values);
        }
        let agg_functions_per_buildings = new Array(acc_functions_per_buildings.length).fill(0);
        for (let i = 0; i < acc_functions_per_buildings.length; i++) {
            if (operation == OperationType.MAX) {
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((a, b) => Math.max(a, b), -Infinity);
            }
            else if (operation == OperationType.MIN) {
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((a, b) => Math.min(a, b), Infinity);
            }
            else if (operation == OperationType.AVG) {
                let sum = acc_functions_per_buildings[i].reduce((partialSum, value) => partialSum + value, 0);
                agg_functions_per_buildings[i] = sum / acc_functions_per_buildings[i].length;
            }
            else if (operation == OperationType.SUM) {
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].reduce((partialSum, value) => partialSum + value, 0);
            }
            else if (operation == OperationType.COUNT) {
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i].length;
            }
            else if (operation == OperationType.DISCARD) { // keep the first value of the join
                agg_functions_per_buildings[i] = acc_functions_per_buildings[i][0];
            }
            else if (operation == OperationType.NONE) {
                throw new Error('NONE operation cannot be used with the spatial_relation INNERAGG in the buildings layer');
            }
        }
        readCoords = 0;
        for (let i = 0; i < agg_functions_per_buildings.length; i++) {
            for (let j = 0; j < coordsPerComp[i]; j++) {
                functionValues[j + readCoords] = agg_functions_per_buildings[i];
            }
            readCoords += coordsPerComp[i];
        }
        return functionValues;
    }
    getFunctionValueIndexOfId(id, level) {
        if (level == LevelType.COORDINATES) {
            throw Error("The buildings layer does not have function values attached to COORDINATES");
        }
        if (level == LevelType.OBJECTS) {
            let readCoords = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (let i = 0; i < coordsPerComp.length; i++) {
                if (i == id) { // assumes that all coordinates of the same object have the same function value
                    return readCoords;
                }
                readCoords += coordsPerComp[i];
            }
        }
        if (level == LevelType.COORDINATES3D) {
            return id;
        }
        return null;
    }
    getCoordsByLevel(level) {
        let coordByLevel = [];
        if (level == LevelType.COORDINATES) {
            if (this._coordsByCOORDINATES.length == 0) {
                let sectionFootPrint = this._mesh.getSectionFootprintVBO();
                for (const footPrintsElement of sectionFootPrint) {
                    for (let i = 0; i < footPrintsElement[0].length / 2; i++) {
                        coordByLevel.push([footPrintsElement[0][i * 2], footPrintsElement[0][i * 2 + 1], 0]);
                    }
                }
                this._coordsByCOORDINATES = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES;
            }
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._coordsByCOORDINATES3D.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 3; i++) {
                    coordByLevel.push([coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]]);
                }
                this._coordsByCOORDINATES3D = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES3D;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._coordsByOBJECTS.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                let readCoords = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedCoords = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedCoords.push(coords[i * 3 + (readCoords * 3)]);
                        groupedCoords.push(coords[i * 3 + 1 + (readCoords * 3)]);
                        groupedCoords.push(coords[i * 3 + 2 + (readCoords * 3)]);
                    }
                    readCoords += numCoords;
                    coordByLevel.push(groupedCoords);
                }
                this._coordsByOBJECTS = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByOBJECTS;
            }
        }
        return coordByLevel;
    }
    getFunctionByLevel(level, knotId) {
        let functionByLevel = [];
        if (level == LevelType.COORDINATES) {
            throw Error("It is not possible to get abstract data from COORDINATES level in the building layer");
        }
        if (level == LevelType.COORDINATES3D) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]); // TODO: give support to more then one timestamps
            functionByLevel = functionValues;
        }
        if (level == LevelType.OBJECTS) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0];
            let readFunctions = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (const numCoords of coordsPerComp) {
                let groupedFunctions = [];
                for (let i = 0; i < numCoords; i++) {
                    groupedFunctions.push(functionValues[i + readFunctions]);
                }
                readFunctions += numCoords;
                functionByLevel.push(groupedFunctions);
            }
        }
        return functionByLevel;
    }
    getHighlightsByLevel(level, shaders) {
        let highlightArray = [];
        let booleanHighlights = [];
        let highlightsByLevel = [];
        if (level == LevelType.COORDINATES) {
            throw Error("It is not possible to highlight COORDINATES in the building layer");
        }
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                highlightArray = shader.colorOrPicked;
            }
        }
        for (const value of highlightArray) {
            if (value == 0) {
                booleanHighlights.push(false);
            }
            else {
                booleanHighlights.push(true);
            }
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._highlightByCOORDINATES3D.length == 0) {
                highlightsByLevel = booleanHighlights.map(x => [x]);
                this._highlightByCOORDINATES3D = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByCOORDINATES3D;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._highlightByOBJECTS.length == 0) {
                let readHighlights = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedHighlights = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedHighlights.push(booleanHighlights[i + readHighlights]);
                    }
                    readHighlights += numCoords;
                    highlightsByLevel.push(groupedHighlights);
                }
                this._highlightByOBJECTS = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByOBJECTS;
            }
        }
        let flattenedHighlights = [];
        // flattening the highlight data
        for (const elemHighlights of highlightsByLevel) {
            let allHighlighted = true;
            for (const value of elemHighlights) {
                if (!value) {
                    allHighlighted = false;
                }
            }
            if (allHighlighted) // all the coordinates of the element must be highlighted for it to be considered highlighted
                flattenedHighlights.push(true);
            else
                flattenedHighlights.push(false);
        }
        return flattenedHighlights;
    }
    getIdLastHighlightedBuilding(shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                return shader.currentPickedBuildingId;
            }
        }
    }
    highlightBuilding(glContext, x, y, shaders) {
        if (!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)) {
            return;
        }
        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        for (const shader of shaders) {
            if (shader instanceof ShaderPicking) {
                shader.updatePickObjectPosition(pixelX, pixelY);
            }
        }
    }
}

class GeoUtils {
    static res = 256.0;
    static wLevel = 22;
    /**
     * Converts from lat, lng to world coordinates
     * @param {number} latitude the latitude of the point
     * @param {number} longitude the longitude of the point
     */
    static latLng2Coord_old(latitude, longitude) {
        const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
        const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;
        const sinLatitude = Math.sin(latitude * pi_180);
        const pixelY = 256.0 - ((0.5 - Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude)) / (pi_4)) * 256.0);
        const pixelX = ((longitude + 180.0) / 360.0) * 256.0;
        return [pixelX, pixelY];
    }
    static latLng2Coord(latitude, longitude) {
        let y = 0;
        if (latitude == 90.0) {
            y = GeoUtils.res;
        }
        else if (latitude == -90.0) {
            y = 0.0;
        }
        else {
            y = (Math.PI - Math.atanh(Math.sin(latitude * Math.PI / 180))) / Math.PI * GeoUtils.res / 2.0;
        }
        return [
            y * Math.pow(2, GeoUtils.wLevel),
            -(longitude + 180.0) / 360.0 * GeoUtils.res * Math.pow(2, GeoUtils.wLevel),
        ];
    }
    /**
     * Converts from world coordinates to lat, lng
     * @param {number} x the x coordinate of the point
     * @param {number} y the y coordinate of the point
     */
    static coord2LatLng_old(x, y) {
        const pi_4 = 12.56637061435917295385057353311801153678867759750042328389;
        const pi_180 = 0.017453292519943295769236907684886127134428718885417254560;
        const longitude = ((x / GeoUtils.res) * 360.0) - 180.0;
        let latitude = (256.0 - y) / GeoUtils.res;
        latitude = Math.exp((0.5 - latitude) * pi_4);
        latitude = (latitude - 1.0) / (1.0 + latitude);
        latitude = Math.asin(latitude) / pi_180;
        return [latitude, longitude];
    }
    static coord2LatLng(x, y) {
        return [
            Math.atan(Math.sinh(Math.PI * (1 - y / GeoUtils.wLevel / 128))) * 180 / Math.PI,
            x * 360 / GeoUtils.wLevel / GeoUtils.res - 180
        ];
    }
    /**
     * Computes the ground resolution
     * @param {number} lat the latitude value
     * @param {number} lng the longitude value
     * @param {number} zoom the zoom leevl
     */
    static groundResolution(lat, lng, zoom) {
        return Math.cos(lat * Math.PI / 180) * 6378137 * 2 * Math.PI / Math.pow(2, zoom);
    }
}

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$3() {
  var out = new ARRAY_TYPE(16);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */

function set$2(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply;

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$2() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length$1(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues$1(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$2();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create$1() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

/**
 * 3D Camera representation
 */
class Camera {
    // View parameters
    wOrigin = create$1();
    wEye = create$2();
    wEyeDir = create$2();
    wEyeLength;
    wLookAt = create$2();
    wUp = create$2();
    wNear;
    wFar;
    // 1 unit in worldspace equals to {groundRes} meters in the z-axis
    groundRes;
    fovy = 45 * Math.PI / 180.0;
    // Transformation matrices
    mProjectionMatrix = create$3();
    mViewMatrix = create$3();
    mModelMatrix = create$3();
    _updateStatusCallback;
    // view resolution
    viewportWidth;
    viewportHeight;
    resetCamera(initialPosition, wUp, wLookAt, wEye, updateStatusCallback) {
        this.wEyeDir = create$2();
        this.fovy = 45 * Math.PI / 180.0;
        this.mProjectionMatrix = create$3();
        this.mViewMatrix = create$3();
        this.mModelMatrix = create$3();
        this._updateStatusCallback = updateStatusCallback;
        // z-values start from here are in meters
        this.wNear = 1;
        // this.wFar = 1e5;
        this.wFar = 1e10;
        this.groundRes = 1;
        this.wOrigin = fromValues(initialPosition[0], initialPosition[1]);
        this.wLookAt = fromValues$1(wLookAt[0], wLookAt[1], wLookAt[2]);
        this.wEye = fromValues$1(wEye[0], wEye[1], wEye[2]);
        this.zScaling(1);
        // meter is no longer used in the remaining code
        this.wUp = fromValues$1(wUp[0], wUp[1], wUp[2]);
        // ============ manhattan
        // this.wEye = vec3.fromValues(3373.32275390625, -3327.14892578125, 4355.8701171875);
        // this.wLookAt = vec3.fromValues(2775.06201171875, -2736.633056640625, 3814.228759765625);
        // this.wUp = vec3.fromValues(-0.3854859173297882, 0.38049426674842834, 0.8406097292900085);
        // ============ manhattan
        // this.wEye = vec3.fromValues(25.537822723388672, 44.76106262207031, 1299.8607177734375);
        // this.wLookAt = vec3.fromValues(572.3938598632812, -504.5278625488281, 668.0140380859375);
        // this.wUp = vec3.fromValues(0.4457886517047882, -0.4477752149105072, 0.7750934362411499);
        // ============ chicago
        // this.wEye = vec3.fromValues(-18.267929077148438, 759.4937744140625, 3000);
        // this.wLookAt = vec3.fromValues(-18.316102981567383, 747.6268310546875, 0.023424625396728516);
        // this.wUp = vec3.fromValues(0.004059492610394955, 0.9999839067459106, -0.0039556859992444515);
    }
    getProjectionMatrix() {
        return this.mProjectionMatrix;
    }
    getViewMatrix() {
        return this.mViewMatrix;
    }
    getModelViewMatrix() {
        const modelViewMatrix = mul(create$3(), this.mViewMatrix, this.mModelMatrix);
        return modelViewMatrix;
    }
    getWorldOrigin() {
        return this.wOrigin;
    }
    getEye() {
        return this.wEye;
    }
    getGroundResolution() {
        return this.groundRes;
    }
    setViewportResolution(x, y) {
        this.viewportWidth = x;
        this.viewportHeight = y;
    }
    getViewportResolution() {
        return [
            this.viewportWidth,
            this.viewportHeight
        ];
    }
    updateEyeDirAndLen() {
        sub(this.wEyeDir, this.wLookAt, this.wEye);
        this.wEyeLength = length$1(this.wEyeDir);
        normalize(this.wEyeDir, this.wEyeDir);
    }
    zScaling(scale) {
        this.wEye[2] = this.wEye[2] * scale;
        this.wLookAt[2] = this.wLookAt[2] * scale;
        this.updateEyeDirAndLen();
    }
    zoom(delta, x, y) {
        delta = delta < 0 ? 100 * (this.wEye[2] * 0.001) : -100 * (this.wEye[2] * 0.001);
        const dir = this.screenCoordToWorldDir(x, y);
        scaleAndAdd(this.wEye, this.wEye, dir, delta);
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    translate(dx, dy) {
        const scale$1 = this.wEye[2];
        const X = create$2();
        normalize(X, cross(X, this.wEyeDir, this.wUp));
        const D = add(create$2(), scale(create$2(), X, dx * scale$1), scale(create$2(), this.wUp, dy * scale$1));
        add(this.wEye, this.wEye, D);
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    yaw(delta) {
        rotateZ(this.wEyeDir, this.wEyeDir, fromValues$1(0, 0, 0), delta);
        rotateZ(this.wUp, this.wUp, fromValues$1(0, 0, 0), delta);
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    pitch(delta) {
        delta = -delta;
        add(this.wEyeDir, scale(create$2(), this.wUp, Math.sin(delta)), scale(create$2(), this.wEyeDir, Math.cos(delta)));
        normalize(this.wEyeDir, this.wEyeDir);
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
        cross(this.wUp, cross(create$2(), this.wEyeDir, this.wUp), this.wEyeDir);
        normalize(this.wUp, this.wUp);
    }
    update() {
        // model matrix
        this.mModelMatrix = fromScaling(create$3(), fromValues$1(1, 1, 1 / this.groundRes));
        // view matrix
        lookAt(this.mViewMatrix, this.wEye, this.wLookAt, this.wUp);
        // TODO: get the aspect ratio from canvas?
        // mat4.ortho(this.mProjectionMatrix, -4500, 4500, -4500, 4500, -1500, this.wFar);
        perspective(this.mProjectionMatrix, this.fovy, 1, this.wNear, this.wFar);
        this._updateStatusCallback("camera", { position: [this.wOrigin[0], this.wOrigin[1], this.wEye[2] / 1000], direction: { right: [this.wEye[0], this.wEye[1], this.wEye[2]], lookAt: [this.wLookAt[0], this.wLookAt[1], this.wLookAt[2]], up: [this.wUp[0], this.wUp[1], this.wUp[2]] } });
    }
    getZoomLevel() {
        return this.wEye[2] / 1000;
    }
    loadPosition(state) {
        const stateObj = JSON.parse(state);
        const viewData = Object.values(stateObj.mViewMatrix);
        const modelData = Object.values(stateObj.mModelMatrix);
        const projData = Object.values(stateObj.mProjectionMatrix);
        const oData = Object.values(stateObj.wOrigin);
        this.mViewMatrix = create$3();
        set$2(this.mViewMatrix, viewData[0], viewData[1], viewData[2], viewData[3], viewData[4], viewData[5], viewData[6], viewData[7], viewData[8], viewData[9], viewData[10], viewData[11], viewData[12], viewData[13], viewData[14], viewData[15]);
        this.mModelMatrix = create$3();
        set$2(this.mModelMatrix, modelData[0], modelData[1], modelData[2], modelData[3], modelData[4], modelData[5], modelData[6], modelData[7], modelData[8], modelData[9], modelData[10], modelData[11], modelData[12], modelData[13], modelData[14], modelData[15]);
        this.mProjectionMatrix = create$3();
        set$2(this.mProjectionMatrix, projData[0], projData[1], projData[2], projData[3], projData[4], projData[5], projData[6], projData[7], projData[8], projData[9], projData[10], projData[11], projData[12], projData[13], projData[14], projData[15]);
        this.wOrigin = fromValues(oData[0], oData[1]);
    }
    screenCoordToWorldDir(x, y) {
        const wRight = create$2();
        normalize(wRight, cross(wRight, this.wEyeDir, this.wUp));
        const upOffset = scale(create$2(), this.wUp, Math.tan(this.fovy / 2) * (y - 0.5) * 2);
        const rightOffset = scale(create$2(), wRight, Math.tan(this.fovy / 2) * (x - 0.5) * 2);
        const offset = add(create$2(), upOffset, rightOffset);
        const dir = add(create$2(), this.wEyeDir, offset);
        normalize(dir, dir);
        return dir;
    }
    getUpVector() {
        return this.wUp;
    }
    // Calculates the right vector of the camera
    getRightVector() {
        const wRight = create$2();
        normalize(wRight, cross(wRight, this.wEyeDir, this.wUp));
        return wRight;
    }
    screenCoordToLatLng(x, y) {
        const dir = this.screenCoordToWorldDir(x, y);
        const t = -this.wEye[2] / dir[2];
        if (t > 0) {
            const intersectPoint = scaleAndAdd(create$2(), this.wEye, dir, t);
            const originCoord = GeoUtils.latLng2Coord(this.wOrigin[0], this.wOrigin[1]);
            const latLng = GeoUtils.coord2LatLng(intersectPoint[0] + originCoord[0], intersectPoint[1] + originCoord[1]);
            return latLng;
        }
        return null;
    }
    setPosition(x, y) {
        let newEye = [x - this.wOrigin[0], y - this.wOrigin[1]];
        add(this.wEye, this.wEye, [newEye[0] - this.wEye[0], newEye[1] - this.wEye[1], 0]);
        scaleAndAdd(this.wLookAt, this.wEye, this.wEyeDir, this.wEyeLength);
    }
    activateBirdsEye() {
        throw Error("BirdsEye view not implemented yet");
    }
}
var CameraFactory = (function () {
    var instance;
    return {
        getInstance: function () {
            if (instance == null) {
                instance = new Camera();
            }
            return instance;
        }
    };
})();

class KeyEvents {
    // div to attach the events
    _map;
    setMap(map) {
        this._map = map;
    }
    bindEvents() {
        // sets the key listeners
        window.addEventListener('keyup', this.keyUp.bind(this), false);
    }
    /**
    * Handles key up event
    * @param {KeyboardEvent} event The fired event
    */
    async keyUp(event) {
        // plot texture based of brush
        if (event.key == "Enter") {
            for (const knot of this._map.knotManager.knots) {
                knot.interact(this._map.glContext, "enter");
            }
            this._map.render();
        }
        // clean abstract surfaces
        if (event.key == "r") {
            for (const knot of this._map.knotManager.knots) {
                knot.interact(this._map.glContext, "r");
            }
            this._map.render();
        }
        // select a building to do the footprint plot
        if (event.key == "t") {
            for (const knot of this._map.knotManager.knots) {
                knot.interact(this._map.glContext, "t", this._map.mouse.currentPoint);
            }
        }
        if (event.key == "q") {
            this._map.layerManager.filterBbox = []; // reset filter
            this._map.updateGrammarPlotsData();
            this._map.render();
        }
    }
}
var KeyEventsFactory = (function () {
    var instance;
    return {
        getInstance: function () {
            if (instance == null) {
                instance = new KeyEvents();
                instance.bindEvents();
            }
            return instance;
        }
    };
})();

var vsFlatColorMap = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp float funcValues;in lowp float inFiltered;out highp vec2 texCoords;out lowp float filtered;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;filtered=inFiltered;texCoords=vec2(funcValues,0);gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsFlatColorMap = "#version 300 es\nuniform sampler2D uColorMap;in highp vec2 texCoords;in lowp float filtered;out highp vec4 fragColor;void main(){if(filtered<=0.5){fragColor=vec4(0.5,0.5,0.5,0.7);}else{fragColor=vec4(texture(uColorMap,texCoords).rgb,1.0);}}";

class ShaderFlatColorMap extends Shader {
    // Data to be rendered
    _coords = [];
    _function = [];
    _indices = [];
    // TODO decide which function to use
    _functionToUse = 0;
    // Color map definition
    _colorMap = null;
    // Data loaction on GPU
    _glCoords = null;
    _glFunction = null;
    _glIndices = null;
    _glFiltered = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    _colorMapDirty = false;
    _filteredDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _functionId = -1;
    _filteredId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uColorMap = null;
    _filtered = [];
    // Color map texture
    _texColorMap;
    constructor(glContext, colorMap = "interpolateReds") {
        super(vsFlatColorMap, fsFlatColorMap, glContext);
        // saves the layer color
        this._colorMap = colorMap;
        // creathe dhe shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._indices = mesh.getIndicesVBO();
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    updateShaderData(mesh, knot) {
        this._currentKnot = knot;
        this._functionDirty = true;
        this._function = mesh.getFunctionVBO(knot.id);
        let maxFuncValue = null;
        let minFuncValue = null;
        for (let i = 0; i < this._function[this._functionToUse].length; i++) {
            let value = this._function[this._functionToUse][i];
            // get param for min max normalization only for filtered elements
            if (this._filtered.length == 0 || this._filtered[i] == 1) {
                if (maxFuncValue == null) {
                    maxFuncValue = value;
                }
                else if (value > maxFuncValue) {
                    maxFuncValue = value;
                }
                if (minFuncValue == null) {
                    minFuncValue = value;
                }
                else if (value < minFuncValue) {
                    minFuncValue = value;
                }
            }
        }
        // min max normalization
        if (maxFuncValue != null && minFuncValue != null && maxFuncValue - minFuncValue != 0 && maxFuncValue >= 0 && minFuncValue >= 0) {
            for (let i = 0; i < this._function[this._functionToUse].length; i++) {
                this._function[this._functionToUse][i] = (this._function[this._functionToUse][i] - minFuncValue) / (maxFuncValue - minFuncValue);
            }
        }
    }
    updateShaderUniforms(data) {
        this._colorMapDirty = true;
        this._colorMap = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }
    createTextures(glContext) {
        if (!this._colorMap) {
            return;
        }
        this._uColorMap = glContext.getUniformLocation(this._shaderProgram, 'uColorMap');
        this._texColorMap = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
        // Set the parameters so we can render any size image.
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
        // Upload the image into the texture.
        const texData = ColorMap.getColorMap(this._colorMap);
        const size = [256, 1];
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGB32F, size[0], size[1], 0, glContext.RGB, glContext.FLOAT, new Float32Array(texData));
    }
    bindTextures(glContext) {
        // set which texture units to render with.
        glContext.uniform1i(this._uColorMap, 0);
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
    }
    createVertexArrayObject(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();
        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();
        // Creates the coords id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        // Creates the function id
        this._glFunction = glContext.createBuffer();
        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        if (this._functionDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._function[this._functionToUse]), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._functionId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
        this._functionDirty = false;
        this._filteredDirty = false;
    }
    setHighlightElements(coordinates, value) {
        throw Error("The shader flat color map can not highlight elements yet");
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        // binds data
        this.bindUniforms(glContext, camera);
        glContext.stencilFunc(glContext.GEQUAL, // the test
        zOrder, // reference value
        0xFF);
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.REPLACE);
        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);
        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
    }
}

var vsSmoothColorMap = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec3 vertNormals;in highp float funcValues;in lowp float inColorOrPicked;in highp vec2 inDiscardFuncInterval;in lowp float inFiltered;out highp vec2 texCoords;out highp vec3 fragNormals;out lowp float vColorOrPicked;out lowp float filtered;out highp vec2 discardFuncInterval;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;texCoords=vec2(funcValues,0);fragNormals=vertNormals;vColorOrPicked=inColorOrPicked;filtered=inFiltered;discardFuncInterval=inDiscardFuncInterval;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsSmoothColorMap = "#version 300 es\nuniform sampler2D uColorMap;in highp vec2 texCoords;in highp vec3 fragNormals;in highp vec2 discardFuncInterval;in highp float varyOpByFunc;in lowp float vColorOrPicked;in lowp float filtered;out highp vec4 fragColor;void main(){highp vec3 texColor=texture(uColorMap,texCoords).rgb;highp vec3 light=normalize(vec3(1.0,0.0,1.0));highp vec3 normal=normalize(fragNormals);highp float diffuse=max(dot(normal,light)*0.7,0.0);highp float ambient=0.25;highp vec3 shade=vec3(1.0,1.0,1.0)*(diffuse+ambient);if((discardFuncInterval[0]!=-1.0||discardFuncInterval[1]!=-1.0)&&(texCoords[0]>=discardFuncInterval[0]&&texCoords[0]<=discardFuncInterval[1])){discard;}else if(filtered<=0.5){fragColor=vec4(0.5,0.5,0.5,0.7);}else{if(vColorOrPicked>0.5){fragColor=vec4(0,0,1,1);}else{fragColor=vec4(texColor,1.0);}}}";

/**
 * Abstract class for the picking auxiliary shaders
 */
class AuxiliaryShaderTriangles extends Shader {
}

const d3$2 = require('d3');
class ShaderSmoothColorMap extends AuxiliaryShaderTriangles {
    // Data to be rendered
    _coords = [];
    _normals = [];
    _function = [];
    _indices = [];
    _discardFuncInterval = [];
    _coordsPerComp = [];
    // protected _varyOpByFunc: number[] = [];
    // TODO remove
    _functionToUse = 0;
    // Color map definition
    _colorMap = null;
    _colorMapReverse = false;
    // Data loaction on GPU
    _glCoords = null;
    _glNormals = null;
    _glFunction = null;
    _glIndices = null;
    _gldiscardFuncInterval = null;
    _glColorOrPicked = null;
    _glFiltered = null;
    // protected _glVaryOpByFunc: WebGLBuffer | null = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    _colorMapDirty = false;
    _colorOrPickedDirty = false;
    _filteredDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _normalsId = -1;
    _functionId = -1;
    _discardFuncIntervalId = -1;
    _colorOrPickedId = -1;
    _filteredId = -1;
    // protected _varyOpByFuncId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uColorMap = null;
    // Color map texture
    _texColorMap;
    //Picking
    _colorOrPicked = [];
    _currentPickedElement; // stores the index of the currently picked element
    _filtered = [];
    constructor(glContext, colorMap = "interpolateReds") {
        super(vsSmoothColorMap, fsSmoothColorMap, glContext);
        // saves the layer color
        this._colorMap = colorMap;
        // creathe dhe shader variables    
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    get currentPickedElement() {
        return this._currentPickedElement;
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._discardFuncInterval = mesh.getDiscardFuncIntervalVBO();
        this._coordsPerComp = mesh.getCoordsPerComp();
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        // start showing only colors without filters by default
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._colorOrPicked.push(0.0);
            this._filtered.push(1.0); // 1 true to include
        }
        // this._varyOpByFunc = mesh.getVaryOpByFuncVBO();
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }
    updateShaderData(mesh, knot) {
        this._currentKnot = knot;
        this._functionDirty = true;
        this._colorOrPickedDirty = true;
        this._function = mesh.getFunctionVBO(knot.id);
        let scale = d3$2.scaleLinear().domain(d3$2.extent(this._function[this._functionToUse])).range([0, 1]);
        for (let i = 0; i < this._function[this._functionToUse].length; i++) {
            this._function[this._functionToUse][i] = scale(this._function[this._functionToUse][i]);
        }
    }
    updateShaderUniforms(data) {
        this._colorMapDirty = true;
        this._colorMap = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    createTextures(glContext) {
        if (!this._colorMap) {
            return;
        }
        this._uColorMap = glContext.getUniformLocation(this._shaderProgram, 'uColorMap');
        this._texColorMap = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
        // Set the parameters so we can render any size image.
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
        // Upload the image into the texture.
        const texData = ColorMap.getColorMap(this._colorMap);
        const size = [256, 1];
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGB32F, size[0], size[1], 0, glContext.RGB, glContext.FLOAT, new Float32Array(texData));
    }
    bindTextures(glContext) {
        // set which texture units to render with.
        glContext.uniform1i(this._uColorMap, 0);
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormals);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._normals), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._normalsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._normalsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        if (this._functionDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._function[this._functionToUse]), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._functionId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glColorOrPicked);
        if (this._colorOrPickedDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._colorOrPicked), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._colorOrPickedId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._colorOrPickedId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._gldiscardFuncInterval);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._discardFuncInterval), glContext.STATIC_DRAW);
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
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
        this._functionDirty = false;
        this._colorOrPickedDirty = false;
        this._filteredDirty = false;
    }
    setHighlightElements(coordinates, value) {
        for (const coordIndex of coordinates) {
            if (value)
                this._colorOrPicked[coordIndex] = 1;
            else
                this._colorOrPicked[coordIndex] = 0;
        }
        this._colorOrPickedDirty = true;
    }
    clearPicking() {
        for (let i = 0; i < this._colorOrPicked.length; i++) {
            this._colorOrPicked[i] = 0;
        }
        this._colorOrPickedDirty = true;
    }
    setPickedObject(objectId) {
        this._currentPickedElement = objectId;
        let readCoords = 0;
        for (let i = 0; i < this._coordsPerComp.length; i++) {
            if (objectId == i) {
                break;
            }
            readCoords += this._coordsPerComp[i];
        }
        for (let i = 0; i < this._coordsPerComp[objectId]; i++) {
            if (this._colorOrPicked[readCoords + i] == 1) {
                this._colorOrPicked[readCoords + i] = 0;
            }
            else if (this._colorOrPicked[readCoords + i] == 0) {
                this._colorOrPicked[readCoords + i] = 1;
            }
        }
        this._colorOrPickedDirty = true;
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        // glContext.enable(glContext.BLEND);
        // glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
        glContext.useProgram(this._shaderProgram);
        // binds data
        this.bindUniforms(glContext, camera);
        if (glPrimitive != glContext.POINTS) {
            glContext.stencilFunc(glContext.GEQUAL, // the test
            zOrder, // reference value
            0xFF);
            glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
            glContext.KEEP, // what to do if the depth test fails
            glContext.REPLACE);
        }
        this.bindVertexArrayObject(glContext, mesh);
        this.bindTextures(glContext);
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        // glContext.disable(glContext.BLEND);
    }
}

var vsPicking = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec4 objectsIds;out highp vec4 idColors;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;idColors=objectsIds;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsPicking = "#version 300 es\nin highp vec4 idColors;out highp vec4 fragColor;void main(){fragColor=idColors;}";

/**
 * This shader should only be used with the buildings layer
 */
class ShaderPickingTriangles extends Shader {
    // Data to be rendered
    _coords = [];
    _indices = [];
    _objectsIds = [];
    // Data loaction on GPU
    _glCoords = null;
    _glIndices = null;
    _glObjectsIds = null;
    // Data has chaged
    _coordsDirty = false;
    _resizeDirty = true;
    _pickObjectDirty = false;
    _objectsIdsDirty = false;
    _pickFilterDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _objectsIdsId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uColorMap = null;
    // Texture to support picking
    _texPicking = null;
    _depthBuffer = null;
    _frameBuffer = null;
    // Picking positions
    _pixelX;
    _pixelY;
    _pixelXFilter;
    _pixelYFilter;
    _pickingWidth;
    _pickingHeight;
    _pickingFilterWidth;
    _pickingFilterHeight;
    _selectedFiltered; // ids of elements selected by the user to build the filtering bbox
    _filtered = []; // coordinates to disconsider in further interactions
    _objectPixelX;
    _objectPixelY;
    _auxiliaryShader;
    _coordsPerComp;
    /**
     *
     * @param {AuxiliaryShaderTriangles} auxiliaryShaderTriangles The shader responsible for receiving picking data
     */
    constructor(glContext, auxiliaryShaderTriangles) {
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
    set resizeDirty(resizeDirty) {
        this._resizeDirty = resizeDirty;
    }
    get selectedFiltered() {
        return this._selectedFiltered;
    }
    getBboxFiltered(mesh) {
        let coordsPerComp = mesh.getCoordsPerComp();
        let minX = null;
        let minY = null;
        let maxX = null;
        let maxY = null;
        let readCoords = 0;
        for (let i = 0; i < coordsPerComp.length; i++) {
            if (this._selectedFiltered.includes(i)) {
                for (let j = 0; j < coordsPerComp[i]; j++) {
                    let x = this._coords[(readCoords + j) * mesh.dimension];
                    let y = this._coords[(readCoords + j) * mesh.dimension + 1];
                    if (minX == null) {
                        minX = x;
                    }
                    else if (x < minX) {
                        minX = x;
                    }
                    if (minY == null) {
                        minY = y;
                    }
                    else if (y < minY) {
                        minY = y;
                    }
                    if (maxX == null) {
                        maxX = x;
                    }
                    else if (x > maxX) {
                        maxX = x;
                    }
                    if (maxY == null) {
                        maxY = y;
                    }
                    else if (y > maxY) {
                        maxY = y;
                    }
                }
            }
            readCoords += coordsPerComp[i];
        }
        if (minX == null) {
            minX = 0;
        }
        if (minY == null) {
            minY = 0;
        }
        if (maxX == null) {
            maxX = 0;
        }
        if (maxY == null) {
            maxY = 0;
        }
        return [minX, minY, maxX, maxY];
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._objectsIdsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._indices = mesh.getIndicesVBO();
        this._objectsIds = [];
        this._coordsPerComp = mesh.getCoordsPerComp();
        for (let i = 0; i < this._coordsPerComp.length; i++) {
            for (let k = 0; k < this._coordsPerComp[i]; k++) {
                this._objectsIds.push(((i >> 0) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >> 8) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >> 16) & 0xFF) / 0xFF);
                this._objectsIds.push(((i >> 24) & 0xFF) / 0xFF);
            }
        }
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        // this._filteredDirty = true;
    }
    updatePickPosition(pixelX, pixelY, width, height) {
        this._pixelX = pixelX;
        this._pixelY = pixelY;
        if (width == 0) {
            this._pickingWidth = 1;
        }
        else {
            this._pickingWidth = width;
        }
        if (height == 0) {
            this._pickingHeight = 1;
        }
        else {
            this._pickingHeight = height;
        }
    }
    updatePickFilterPosition(pixelX, pixelY, width, height) {
        this._pickFilterDirty = true;
        this._pixelXFilter = pixelX;
        this._pixelYFilter = pixelY;
        if (width == 0) {
            this._pickingFilterWidth = 1;
        }
        else {
            this._pickingFilterWidth = width;
        }
        if (height == 0) {
            this._pickingFilterHeight = 1;
        }
        else {
            this._pickingFilterHeight = height;
        }
    }
    pickPixelFilter(glContext) {
        const data = new Uint8Array(Math.ceil(Math.abs(this._pickingFilterHeight) * Math.abs(this._pickingFilterWidth) * 4));
        for (let i = 0; i < data.length; i++) { // initializing data array with 255 to recognize not used positions
            data[i] = 255;
        }
        glContext.readPixels(this._pixelXFilter, // x
        this._pixelYFilter, // y
        this._pickingFilterWidth, // width
        this._pickingFilterHeight, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let ids = new Set();
        let dataByFour = Math.floor(data.length / 4);
        for (let i = 0; i < dataByFour; i++) {
            if (data[i * 4] == 255 && data[i * 4 + 1] == 255 && data[i * 4 + 2] == 255 && data[i * 4 + 3] == 255) { // some portions of the data array are not used
                continue;
            }
            else {
                ids.add(data[i * 4] + (data[i * 4 + 1] << 8) + (data[i * 4 + 2] << 16) + (data[i * 4 + 3] << 24));
            }
        }
        this._selectedFiltered = Array.from(ids);
    }
    isFilteredIn(objectId) {
        if (this._filtered.length == 0) {
            return true;
        }
        else {
            let readCoords = 0;
            for (let i = 0; i < this._coordsPerComp.length; i++) {
                let countCoords = this._coordsPerComp[i];
                if (i == objectId) {
                    if (this._filtered[readCoords] == 1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                readCoords += countCoords;
            }
        }
        return false;
    }
    pickObject(glContext) {
        const data = new Uint8Array(4);
        glContext.readPixels(this._objectPixelX, // x
        this._objectPixelY, // y
        1, // width
        1, // height
        glContext.RGBA, // format
        glContext.UNSIGNED_BYTE, // type
        data); // typed array to hold result
        let id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
        if (this.isFilteredIn(id)) { // filtered in so can be interacted
            this._auxiliaryShader.setPickedObject(id);
        }
    }
    updatePickObjectPosition(pixelX, pixelY) {
        this._pickObjectDirty = true;
        this._objectPixelX = pixelX;
        this._objectPixelY = pixelY;
    }
    clearPicking() {
        this._auxiliaryShader.clearPicking();
    }
    updateShaderData(mesh, knot) {
        return;
    }
    updateShaderUniforms(data) {
        return;
    }
    setHighlightElements(coordinates, value) {
        this._auxiliaryShader.setHighlightElements(coordinates, value);
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
    }
    setFramebufferAttachmentSizes(glContext, width, height) {
        glContext.bindTexture(glContext.TEXTURE_2D, this._texPicking);
        // define size and format of level 0
        const level = 0;
        const internalFormat = glContext.RGBA;
        const border = 0;
        const format = glContext.RGBA;
        const type = glContext.UNSIGNED_BYTE;
        const data = null;
        glContext.texImage2D(glContext.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);
        glContext.bindRenderbuffer(glContext.RENDERBUFFER, this._depthBuffer);
        glContext.renderbufferStorage(glContext.RENDERBUFFER, glContext.DEPTH_COMPONENT16, width, height);
    }
    createTextures(glContext) {
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
    bindTextures(glContext) {
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, this._frameBuffer);
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glObjectsIds);
        // send data to gpu
        if (this._objectsIdsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._objectsIds), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._objectsIdsId, 4, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._objectsIdsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to g4pu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
        this._objectsIdsDirty = false;
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        if (this._resizeDirty) {
            this.setFramebufferAttachmentSizes(glContext, glContext.canvas.width, glContext.canvas.height);
            this._resizeDirty = false;
        }
        // binds data
        this.bindTextures(glContext);
        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);
        // draw the geometry
        glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        if (this._pickFilterDirty) {
            this.pickPixelFilter(glContext);
            this._pickFilterDirty = false;
        }
        if (this._pickObjectDirty) {
            this.pickObject(glContext);
            this._pickObjectDirty = false;
        }
        MapStyle.getColor('sky').concat([1.0]);
        let blankColorRGBA = [];
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        blankColorRGBA.push(255);
        glContext.clearColor(blankColorRGBA[0], blankColorRGBA[1], blankColorRGBA[2], blankColorRGBA[3]);
        glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null);
    }
}

class LinesLayer extends Layer {
    // protected _mesh: Mesh;
    _zOrder;
    _coordsByCOORDINATES = [];
    _coordsByCOORDINATES3D = [];
    _coordsByOBJECTS = [];
    _highlightByCOORDINATES = [];
    _highlightByCOORDINATES3D = [];
    _highlightByOBJECTS = [];
    constructor(info, dimensions = 2, order = 0, centroid, geometryData) {
        super(info.id, info.type, info.styleKey, info.renderStyle !== undefined ? info.renderStyle : [], centroid, dimensions, order);
        this.updateMeshGeometry(geometryData);
        // this._mesh = new Mesh(dimensions, order);
        this._zOrder = order;
    }
    supportInteraction(eventName) {
        return true;
    }
    updateMeshGeometry(data) {
        this._mesh.load(data, false, this._centroid);
    }
    getSelectedFiltering() {
        throw Error("Filtering not supported for line layer");
    }
    updateShaders(shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    directAddMeshFunction(functionValues, knotId) {
        let distributedValues = this.distributeFunctionValues(functionValues);
        this._mesh.loadFunctionData(distributedValues, knotId);
    }
    updateFunction(knot, shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }
    distributeFunctionValues(functionValues) {
        return functionValues;
    }
    innerAggFunc(functionValues, startLevel, endLevel, operation) {
        throw new Error("The layer lines only have the COORDINATES level, so no INNERAGG is possible");
    }
    setHighlightElements(elements, level, value) {
        throw new Error("Element highlighting not support for line layer yet");
    }
    getFunctionValueIndexOfId(id, level) {
        if (level == LevelType.COORDINATES3D) {
            throw new Error("COORDINATES3D level is not supported for layer lines");
        }
        if (level == LevelType.COORDINATES) {
            return id;
        }
        if (level == LevelType.OBJECTS) {
            let readCoords = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (let i = 0; i < coordsPerComp.length; i++) {
                if (i == id) { // assumes that all coordinates of the same object have the same function value
                    return readCoords;
                }
                readCoords += coordsPerComp[i];
            }
        }
        return null;
    }
    getCoordsByLevel(level) {
        let coordByLevel = [];
        if (level == LevelType.COORDINATES3D) {
            throw Error("Cannot get COORDINATES3D attached to line layer because it does not have a 3D representation");
        }
        if (level == LevelType.COORDINATES) {
            if (this._coordsByCOORDINATES.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 3; i++) {
                    coordByLevel.push([coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]]);
                }
                this._coordsByCOORDINATES = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._coordsByOBJECTS.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                let readCoords = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedCoords = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedCoords.push(coords[i * 3 + (readCoords * 3)]);
                        groupedCoords.push(coords[i * 3 + 1 + (readCoords * 3)]);
                        groupedCoords.push(coords[i * 3 + 2 + (readCoords * 3)]);
                    }
                    readCoords += numCoords;
                    coordByLevel.push(groupedCoords);
                }
                this._coordsByOBJECTS = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByOBJECTS;
            }
        }
        return coordByLevel;
    }
    getFunctionByLevel(level, knotId) {
        let functionByLevel = [];
        if (level == LevelType.COORDINATES3D) {
            throw Error("It is not possible to get abstract data from COORDINATES3D level in the line layer");
        }
        if (level == LevelType.COORDINATES) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]); // TODO: give support to more then one timestamps
            functionByLevel = functionValues;
        }
        if (level == LevelType.OBJECTS) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0];
            let readFunctions = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (const numCoords of coordsPerComp) {
                let groupedFunctions = [];
                for (let i = 0; i < numCoords; i++) {
                    groupedFunctions.push(functionValues[i + readFunctions]);
                }
                readFunctions += numCoords;
                functionByLevel.push(groupedFunctions);
            }
        }
        return functionByLevel;
    }
    getHighlightsByLevel(level) {
        let booleanHighlights = [];
        let highlightsByLevel = [];
        if (level == LevelType.COORDINATES3D) {
            throw Error("It is not possible to highlight COORDINATES3D in the line layer");
        }
        let totalNumberOfCoords = this._mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            booleanHighlights.push(false);
        }
        if (level == LevelType.COORDINATES) {
            if (this._highlightByCOORDINATES.length == 0) {
                highlightsByLevel = booleanHighlights.map(x => [x]);
                this._highlightByCOORDINATES = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByCOORDINATES;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._highlightByOBJECTS.length == 0) {
                let readHighlights = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedHighlights = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedHighlights.push(booleanHighlights[i + readHighlights]);
                    }
                    readHighlights += numCoords;
                    highlightsByLevel.push(groupedHighlights);
                }
                this._highlightByOBJECTS = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByOBJECTS;
            }
        }
        let flattenedHighlights = [];
        // flattening the highlight data
        for (const elemHighlights of highlightsByLevel) {
            let allHighlighted = true;
            for (const value of elemHighlights) {
                if (!value) {
                    allHighlighted = false;
                }
            }
            if (allHighlighted) // all the coordinates of the element must be highlighted for it to be considered highlighted
                flattenedHighlights.push(true);
            else
                flattenedHighlights.push(false);
        }
        return flattenedHighlights;
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext, shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderFlatColorMap) {
                throw new Error("FLAT_COLOR_MAP is not suitable for line layers");
            }
            if (shader instanceof ShaderSmoothColorMap) {
                throw new Error("SMOOTH_COLOR_MAP is not suitable for line layers");
            }
            if (shader instanceof ShaderSmoothColorMapTex) {
                throw new Error("SMOOTH_COLOR_MAP_TEX is not suitable for line layers");
            }
            if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                throw new Error("PICKING is not suitable for line layers");
            }
            if (shader instanceof ShaderAbstractSurface) {
                throw new Error("ABSTRACT_SURFACES is not suitable for line layers");
            }
        }
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);
        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);
        for (const shader of shaders) {
            shader.renderPass(glContext, glContext.LINE_STRIP, this._camera, this._mesh, this._zOrder);
        }
        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
}

var vsFlatColor = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsFlatColor = "#version 300 es\nuniform highp vec3 uGlobalColor;out highp vec4 fragColor;void main(){fragColor=vec4(uGlobalColor,1.0);}";

class ShaderFlatColor extends Shader {
    // Data to be rendered
    _coords = [];
    _indices = [];
    _coordsPerComp = [];
    // Global color used on the layer
    _globalColor = [];
    // Data loaction on GPU
    _glCoords = null;
    _glIndices = null;
    // Data has chaged
    _coordsDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uGlobalColor = null;
    _filtered = [];
    constructor(glContext, color) {
        super(vsFlatColor, fsFlatColor, glContext);
        // saves the layer color
        this._globalColor = color;
        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._indices = mesh.getIndicesVBO();
        this._coordsPerComp = mesh.getCoordsPerComp();
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    updateShaderData(mesh, knot) {
        return;
    }
    updateShaderUniforms(data) {
        this._globalColor = data;
    }
    setHighlightElements(coordinates, value) {
        throw Error("The flat color shader can not highlight elements yet");
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        // this._filteredDirty = true;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._uGlobalColor = glContext.getUniformLocation(this._shaderProgram, 'uGlobalColor');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
        glContext.uniform3fv(this._uGlobalColor, this._globalColor);
    }
    createTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    bindTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    createVertexArrayObject(glContext) {
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
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        this.bindUniforms(glContext, camera);
        glContext.stencilFunc(glContext.GEQUAL, // the test
        zOrder, // reference value
        0xFF);
        glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
        glContext.KEEP, // what to do if the depth test fails
        glContext.REPLACE);
        this.bindVertexArrayObject(glContext, mesh);
        if (glPrimitive == glContext.LINE_STRIP) {
            let alreadyDrawn = 0;
            glContext.lineWidth(1);
            for (let i = 0; i < this._coordsPerComp.length; i++) { // draw each component individually
                glContext.drawArrays(glPrimitive, alreadyDrawn, this._coordsPerComp[i]);
                alreadyDrawn += this._coordsPerComp[i];
            }
        }
        else {
            // draw the geometry
            glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        }
    }
}

var vsSmoothColor = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp vec3 vertNormals;in lowp float inFiltered;out highp vec3 fragNormals;out lowp float filtered;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;filtered=inFiltered;fragNormals=vertNormals;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);}";

var fsSmoothColor = "#version 300 es\nuniform highp vec3 uGlobalColor;in highp vec3 fragNormals;in lowp float filtered;out highp vec4 fragColor;void main(){if(filtered<=0.5){fragColor=vec4(0.5,0.5,0.5,0.7);}else{highp vec3 light=normalize(vec3(1.0,1.0,1.0));highp vec3 normal=normalize(fragNormals);highp float diffuse=max(dot(normal,light)*0.7,0.0);highp float ambient=0.25;highp vec3 shade=vec3(1.0,1.0,1.0)*(diffuse+ambient);fragColor=vec4(0.6*shade+0.4*uGlobalColor,1.0);}}";

class ShaderSmoothColor extends Shader {
    // Data to be rendered
    _coords = [];
    _normals = [];
    _indices = [];
    _coordsPerComp = [];
    // Global color used on the layer
    _globalColor = [];
    // Data loaction on GPU
    _glCoords = null;
    _glNormals = null;
    _glIndices = null;
    _glFiltered = null;
    // Data has chaged
    _coordsDirty = false;
    _filteredDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _normalsId = -1;
    _filteredId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uGlobalColor = null;
    _filtered = [];
    constructor(glContext, color) {
        super(vsSmoothColor, fsSmoothColor, glContext);
        // saves the layer color
        this._globalColor = color;
        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._filteredDirty = true;
        this._coords = mesh.getCoordinatesVBO();
        this._normals = mesh.getNormalsVBO();
        this._indices = mesh.getIndicesVBO();
        this._coordsPerComp = mesh.getCoordsPerComp();
        let totalNumberOfCoords = mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            this._filtered.push(1.0); // 1 true to include
        }
    }
    updateShaderData(mesh, knot) {
        return;
    }
    updateShaderUniforms(data) {
        this._globalColor = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._uGlobalColor = glContext.getUniformLocation(this._shaderProgram, 'uGlobalColor');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
        glContext.uniform3fv(this._uGlobalColor, this._globalColor);
    }
    createTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    bindTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    createVertexArrayObject(glContext) {
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
        this._filteredId = glContext.getAttribLocation(this._shaderProgram, 'inFiltered');
        this._glFiltered = glContext.createBuffer();
        // Creates the elements buffer
        this._glIndices = glContext.createBuffer();
    }
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFiltered);
        if (this._filteredDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._filtered), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._filteredId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._filteredId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glNormals);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._normals), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._normalsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._normalsId);
        // binds the indices buffer
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this._glIndices);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
        this._filteredDirty = false;
    }
    setFiltered(filtered) {
        if (filtered.length == 0) {
            this._filtered = Array(this._filtered.length).fill(1.0);
        }
        else {
            this._filtered = filtered;
        }
        this._filteredDirty = true;
    }
    setHighlightElements(coordinates, value) {
        throw Error("The smooth color shader can not highlight elements yet");
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        this.bindUniforms(glContext, camera);
        if (glPrimitive != glContext.POINTS) {
            glContext.stencilFunc(glContext.GEQUAL, // the test
            zOrder, // reference value
            0xFF);
            glContext.stencilOp(glContext.KEEP, // what to do if the stencil test fails
            glContext.KEEP, // what to do if the depth test fails
            glContext.REPLACE);
        }
        this.bindVertexArrayObject(glContext, mesh);
        if (glPrimitive == glContext.LINE_STRIP) {
            let alreadyDrawn = 0;
            for (let i = 0; i < this._coordsPerComp.length; i++) { // draw each component individually
                glContext.drawArrays(glPrimitive, alreadyDrawn, this._coordsPerComp[i]);
                alreadyDrawn += this._coordsPerComp[i];
            }
        }
        else if (glPrimitive == glContext.POINTS) {
            glContext.drawElements(glPrimitive, this._coords.length / 3, glContext.UNSIGNED_INT, 0);
        }
        else {
            // draw the geometry
            glContext.drawElements(glPrimitive, this._indices.length, glContext.UNSIGNED_INT, 0);
        }
    }
}

class PointsLayer extends Layer {
    // protected _zOrder: number;
    _coordsByCOORDINATES3D = [];
    constructor(info, zOrder = 0, centroid, geometryData) {
        super(info.id, info.type, info.styleKey, info.renderStyle !== undefined ? info.renderStyle : [], centroid, 3, zOrder);
        this.updateMeshGeometry(geometryData);
        // this._zOrder = zOrder;
    }
    supportInteraction(eventName) {
        return true;
    }
    updateMeshGeometry(data) {
        this._mesh.load(data, false, this._centroid);
    }
    updateShaders(shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    getSelectedFiltering() {
        throw Error("Filtering not supported for point layer");
    }
    directAddMeshFunction(functionValues, knotId) {
        let distributedValues = this.distributeFunctionValues(functionValues);
        this._mesh.loadFunctionData(distributedValues, knotId);
    }
    updateFunction(knot, shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }
    render(glContext, shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderFlatColor) {
                throw Error("FLAT_COLOR not supported for point cloud layer");
            }
            if (shader instanceof ShaderFlatColorMap) {
                throw Error("FLAT_COLOR_MAP not supported for point cloud layer");
            }
            if (shader instanceof ShaderSmoothColor) {
                throw Error("SMOOTH_COLOR not supported for point cloud layer");
            }
            if (shader instanceof ShaderSmoothColorMap) {
                throw Error("SMOOTH_COLOR_MAP not supported for point cloud layer");
            }
            if (shader instanceof ShaderSmoothColorMapTex) {
                throw Error("SMOOTH_COLOR_MAP_TEX not supported for point cloud layer");
            }
            if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                throw Error("PICKING not supported for point cloud layer");
            }
            if (shader instanceof ShaderAbstractSurface) {
                throw Error("ABSTRACT_SURFACES not supported for point cloud layer");
            }
        }
        // enables the depth test
        glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);
        // enables stencil
        // glContext.enable(glContext.STENCIL_TEST);
        // the abs surfaces are loaded first to update the stencil
        for (const shader of shaders) {
            shader.renderPass(glContext, glContext.POINTS, this._camera, this._mesh, -1);
        }
        // disables stencil
        // glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
    setHighlightElements(elements, level, value) {
        throw new Error("Method not implemented.");
    }
    distributeFunctionValues(functionValues) {
        return functionValues;
    }
    innerAggFunc(functionValues, startLevel, endLevel, operation) {
        throw new Error("Method not implemented.");
    }
    getFunctionValueIndexOfId(id, level) {
        throw new Error("Method not implemented.");
    }
    getCoordsByLevel(level) {
        let coordByLevel = [];
        if (level == LevelType.COORDINATES) {
            throw Error("Cannot get COORDINATES attached to the layer because it does not have a 2D representation");
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._coordsByCOORDINATES3D.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 3; i++) {
                    coordByLevel.push([coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]]);
                }
                this._coordsByCOORDINATES3D = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES3D;
            }
        }
        if (level == LevelType.OBJECTS) {
            throw Error("Cannot get OBJECTS attached to the layer because it does not have a 2D representation");
        }
        return coordByLevel;
    }
    getFunctionByLevel(level, knotId) {
        let functionByLevel = [];
        if (level == LevelType.COORDINATES) {
            throw Error("Cannot get abstract information attached to COORDINATES because the layer does not have a 2D representation");
        }
        if (level == LevelType.COORDINATES3D) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]);
            functionByLevel = functionValues;
        }
        if (level == LevelType.OBJECTS) {
            throw Error("Cannot get abstract information attached to OBJECTS because the layer does not have a 2D representation");
        }
        return functionByLevel;
    }
    getHighlightsByLevel(level) {
        throw new Error("Method not implemented.");
    }
}

class TrianglesLayer extends Layer {
    // protected _mesh: Mesh;
    _zOrder;
    _dimensions;
    _coordsByCOORDINATES = [];
    _coordsByCOORDINATES3D = [];
    _coordsByOBJECTS = [];
    _highlightByCOORDINATES = [];
    _highlightByCOORDINATES3D = [];
    _highlightByOBJECTS = [];
    constructor(info, dimensions = 2, zOrder = 0, centroid, geometryData) {
        super(info.id, info.type, info.styleKey, info.renderStyle !== undefined ? info.renderStyle : [], centroid, dimensions, zOrder);
        this._zOrder = zOrder;
        this._dimensions = dimensions;
        this.updateMeshGeometry(geometryData);
    }
    supportInteraction(eventName) {
        return true;
    }
    updateMeshGeometry(data) {
        // loads the data
        this._mesh.load(data, false, this._centroid);
    }
    updateShaders(shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    directAddMeshFunction(functionValues, knotId) {
        let distributedValues = this.distributeFunctionValues(functionValues);
        this._mesh.loadFunctionData(distributedValues, knotId);
    }
    updateFunction(knot, shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }
    setHighlightElements(elements, level, value, shaders) {
        if (elements[0] == undefined)
            return;
        let coords = this.getCoordsByLevel(level);
        for (let i = 0; i < elements.length; i++) {
            let offsetCoords = 0;
            let coordsIndex = [];
            let elementIndex = elements[i];
            for (let j = 0; j < elementIndex; j++) {
                offsetCoords += (coords[j].length) / this._dimensions;
            }
            for (let k = 0; k < (coords[elementIndex].length) / this._dimensions; k++) {
                coordsIndex.push(offsetCoords + k);
            }
            for (const shader of shaders) {
                if (shader instanceof ShaderPickingTriangles) {
                    shader.setHighlightElements(coordsIndex, value);
                }
            }
        }
    }
    getSelectedFiltering(shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderPickingTriangles) {
                return shader.getBboxFiltered(this._mesh);
            }
        }
        return null;
    }
    /**
     * Layer render function signature
     * @param {WebGL2RenderingContext} glContext WebGL context
     */
    render(glContext, shaders) {
        // enables the depth test
        // glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);
        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);
        // the abs surfaces are loaded first to update the stencil
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                continue;
            }
            else {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        // // clear stencil
        // glContext.clearStencil(0);
        // glContext.clear(glContext.STENCIL_BUFFER_BIT);
        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        // glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
    highlightElement(glContext, x, y, shaders) {
        if (!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)) {
            return;
        }
        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        for (const shader of shaders) {
            if (shader instanceof ShaderPickingTriangles) {
                shader.updatePickObjectPosition(pixelX, pixelY);
            }
        }
    }
    getIdLastHighlightedElement(shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMap) {
                return shader.currentPickedElement;
            }
        }
    }
    distributeFunctionValues(functionValues) {
        return functionValues;
    }
    innerAggFunc(functionValues, startLevel, endLevel, operation) {
        if (startLevel == LevelType.COORDINATES && this._dimensions != 2) {
            throw new Error('The start level is COORDINATES but the dimensions of the layer is not 2 (COORDINATES are 2D)');
        }
        if (startLevel == LevelType.COORDINATES3D && this._dimensions != 3) {
            // TODO: maybe there could have support for two representations of coordinates for the triangle layer
            throw new Error('The start level is COORDINATES but the dimensions of the layer is not 3 (COORDINATES3D are 3D)');
        }
        if (endLevel != LevelType.OBJECTS || startLevel == LevelType.OBJECTS) {
            throw new Error('Only operations that end in the Object level are currently supported for the triangle layer');
        }
        if (functionValues == null)
            return null;
        let coordsPerComp = this._mesh.getCoordsPerComp(); // components in the triangle layer can be any set of coordinates semantically grouped (i.e a whole zip code in a zip code layer)
        let acc_functions_per_object = new Array(coordsPerComp.length).fill(null);
        let readCoords = 0;
        for (const numberCoords of coordsPerComp) {
            for (let i = 0; i < numberCoords; i++) {
                if (acc_functions_per_object[i] == null) {
                    acc_functions_per_object[i] = [functionValues[i + readCoords]];
                }
            }
            readCoords += numberCoords;
        }
        for (let i = 0; i < acc_functions_per_object.length; i++) {
            if (operation == OperationType.MAX) {
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((a, b) => Math.max(a, b), -Infinity);
            }
            else if (operation == OperationType.MIN) {
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((a, b) => Math.min(a, b), Infinity);
            }
            else if (operation == OperationType.AVG) {
                let sum = acc_functions_per_object[i].reduce((partialSum, value) => partialSum + value, 0);
                acc_functions_per_object[i] = sum / acc_functions_per_object[i].length;
            }
            else if (operation == OperationType.SUM) {
                acc_functions_per_object[i] = acc_functions_per_object[i].reduce((partialSum, value) => partialSum + value, 0);
            }
            else if (operation == OperationType.COUNT) {
                acc_functions_per_object[i] = acc_functions_per_object[i].length;
            }
            else if (operation == OperationType.DISCARD) { // keep the first element of the join
                acc_functions_per_object[i] = acc_functions_per_object[i][0];
            }
            else if (operation == OperationType.NONE) {
                throw new Error('NONE operation cannot be used with the spatial_relation INNERAGG in the triangle layer');
            }
        }
        readCoords = 0;
        for (let i = 0; i < acc_functions_per_object.length; i++) {
            for (let j = 0; j < coordsPerComp[i]; j++) {
                functionValues[j + readCoords] = acc_functions_per_object[i];
            }
            readCoords += coordsPerComp[i];
        }
        return functionValues;
    }
    getFunctionValueIndexOfId(id, level) {
        if (level == LevelType.COORDINATES) {
            if (this._dimensions != 2) {
                throw Error("The level specified is COORDINATES but the triangle layer does not have 2 dimensions");
            }
            return id;
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._dimensions != 3) {
                throw Error("The level specified is COORDINATES3D but the triangle layer does not have 3 dimensions");
            }
            return id;
        }
        if (level == LevelType.OBJECTS) {
            let readCoords = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (let i = 0; i < coordsPerComp.length; i++) {
                if (i == id) { // assumes that all coordinates of the same object have the same function value
                    return readCoords;
                }
                readCoords += coordsPerComp[i];
            }
        }
        return null;
    }
    /**
     *
     * @returns each position of the array contains an element of that level
     */
    getCoordsByLevel(level) {
        let coordByLevel = [];
        if (level == LevelType.COORDINATES) {
            if (this._dimensions != 2) {
                throw Error("Cannot get COORDINATES attached to the layer because it does not have a 2D representation");
            }
            if (this._coordsByCOORDINATES.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 2; i++) {
                    coordByLevel.push([coords[i * 2], coords[i * 2 + 1], 0]);
                }
                this._coordsByCOORDINATES = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES;
            }
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._dimensions != 3) {
                throw Error("Cannot get COORDINATES3D attached to the layer because it does not have a 3D representation");
            }
            if (this._coordsByCOORDINATES3D.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 3; i++) {
                    coordByLevel.push([coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]]);
                }
                this._coordsByCOORDINATES3D = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES3D;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._coordsByOBJECTS.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                let readCoords = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedCoords = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedCoords.push(coords[(i * 3) + (readCoords * 3)]);
                        groupedCoords.push(coords[(i * 3) + 1 + (readCoords * 3)]);
                        groupedCoords.push(coords[(i * 3) + 2 + (readCoords * 3)]);
                    }
                    readCoords += numCoords;
                    coordByLevel.push(groupedCoords);
                }
                this._coordsByOBJECTS = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByOBJECTS;
            }
        }
        return coordByLevel;
    }
    getFunctionByLevel(level, knotId) {
        let functionByLevel = [];
        if (level == LevelType.COORDINATES) {
            if (this._dimensions != 2) {
                throw Error("Cannot get abstract information attached to COORDINATES because the layer does not have a 2D representation");
            }
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]);
            functionByLevel = functionValues;
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._dimensions != 3) {
                throw Error("Cannot get abstract information attached to COORDINATES3D because the layer does not have a 3D representation");
            }
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]);
            functionByLevel = functionValues;
        }
        if (level == LevelType.OBJECTS) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0];
            let readFunctions = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (const numCoords of coordsPerComp) {
                let groupedFunctions = [];
                for (let i = 0; i < numCoords; i++) {
                    groupedFunctions.push(functionValues[i + readFunctions]);
                }
                readFunctions += numCoords;
                functionByLevel.push(groupedFunctions);
            }
        }
        return functionByLevel;
    }
    getHighlightsByLevel(level) {
        let booleanHighlights = [];
        let highlightsByLevel = [];
        let totalNumberOfCoords = this._mesh.getTotalNumberOfCoords();
        for (let i = 0; i < totalNumberOfCoords; i++) {
            booleanHighlights.push(false);
        }
        if (level == LevelType.COORDINATES) {
            if (this._dimensions != 2) {
                throw Error("Cannot get highlight information related to COORDINATES because the layer does not have a 2D representation");
            }
            if (this._highlightByCOORDINATES.length == 0) {
                highlightsByLevel = booleanHighlights.map(x => [x]);
                this._highlightByCOORDINATES = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByCOORDINATES;
            }
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._dimensions != 3) {
                throw Error("Cannot get highlight information related to COORDINATES3D because the layer does not have a 3D representation");
            }
            if (this._highlightByCOORDINATES3D.length == 0) {
                highlightsByLevel = booleanHighlights.map(x => [x]);
                this._highlightByCOORDINATES3D = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByCOORDINATES3D;
            }
        }
        if (level == LevelType.OBJECTS) {
            if (this._highlightByOBJECTS.length == 0) {
                let readHighlights = 0;
                let coordsPerComp = this._mesh.getCoordsPerComp();
                for (const numCoords of coordsPerComp) {
                    let groupedHighlights = [];
                    for (let i = 0; i < numCoords; i++) {
                        groupedHighlights.push(booleanHighlights[i + readHighlights]);
                    }
                    readHighlights += numCoords;
                    highlightsByLevel.push(groupedHighlights);
                }
                this._highlightByOBJECTS = highlightsByLevel;
            }
            else {
                highlightsByLevel = this._highlightByOBJECTS;
            }
        }
        let flattenedHighlights = [];
        // flattening the highlight data
        for (const elemHighlights of highlightsByLevel) {
            let allHighlighted = true;
            for (const value of elemHighlights) {
                if (!value) {
                    allHighlighted = false;
                }
            }
            if (allHighlighted) // all the coordinates of the element must be highlighted for it to be considered highlighted
                flattenedHighlights.push(true);
            else
                flattenedHighlights.push(false);
        }
        return flattenedHighlights;
    }
}

class HeatmapLayer extends Layer {
    _zOrder;
    _dimensions;
    _coordsByCOORDINATES = [];
    _coordsByCOORDINATES3D = [];
    _coordsByOBJECTS = [];
    _highlightByCOORDINATES = [];
    _highlightByCOORDINATES3D = [];
    _highlightByOBJECTS = [];
    constructor(info, zOrder = 0, centroid, geometryData) {
        super(info.id, info.type, info.styleKey, info.renderStyle !== undefined ? info.renderStyle : [], centroid, 3, zOrder);
        console.log("heatmap", zOrder);
        this._zOrder = zOrder;
        this.updateMeshGeometry(geometryData);
    }
    updateMeshGeometry(data) {
        this._mesh.load(data, false, this._centroid);
    }
    updateShaders(shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderGeometry(this._mesh);
        }
    }
    directAddMeshFunction(functionValues, knotId) {
        let distributedValues = this.distributeFunctionValues(functionValues);
        this._mesh.loadFunctionData(distributedValues, knotId);
    }
    getSelectedFiltering() {
        throw Error("Filtering not supported for heatmap layer");
    }
    updateFunction(knot, shaders) {
        // updates the shader references
        for (const shader of shaders) {
            shader.updateShaderData(this._mesh, knot);
        }
    }
    supportInteraction(interaction) {
        return true;
    }
    setHighlightElements(elements, level, value, shaders) {
        throw Error("It is not possible to highlight a heatmap layer");
    }
    render(glContext, shaders) {
        for (const shader of shaders) {
            if (shader instanceof ShaderSmoothColorMapTex) {
                throw Error("SMOOTH_COLOR_MAP_TEX shader is not supported for the heatmap layer");
            }
            if (shader instanceof ShaderPicking) {
                throw Error("PICKING shader is not supported for the heatmap layer");
            }
            if (shader instanceof ShaderAbstractSurface) {
                throw Error("ABSTRACT_SURFACES shader is not supported for the heatmap layer");
            }
        }
        // enables the depth test
        // glContext.enable(glContext.DEPTH_TEST);
        glContext.depthFunc(glContext.LEQUAL);
        // enable culling
        glContext.frontFace(glContext.CCW);
        glContext.enable(glContext.CULL_FACE);
        glContext.cullFace(glContext.BACK);
        // enables stencil
        glContext.enable(glContext.STENCIL_TEST);
        // the abs surfaces are loaded first to update the stencil
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        for (const shader of shaders) {
            if (shader instanceof ShaderAbstractSurface) {
                continue;
            }
            else {
                shader.renderPass(glContext, glContext.TRIANGLES, this._camera, this._mesh, this._zOrder);
            }
        }
        // disables stencil
        glContext.disable(glContext.STENCIL_TEST);
        // disables the depth test
        // glContext.disable(glContext.DEPTH_TEST);
        // disables culling
        glContext.disable(glContext.CULL_FACE);
    }
    perFaceAvg(functionValues, indices, ids) {
        let maxId = -1;
        for (const id of ids) {
            if (id > maxId) {
                maxId = id;
            }
        }
        let avg_accumulation_triangle = new Array(Math.trunc(indices.length / 3)).fill(0);
        let avg_accumulation_cell = new Array(maxId + 1).fill(0);
        let indicesByThree = Math.trunc(indices.length / 3);
        // calculate acc by triangle
        for (let i = 0; i < indicesByThree; i++) {
            let value = 0;
            value += functionValues[indices[i * 3]];
            value += functionValues[indices[i * 3 + 1]];
            value += functionValues[indices[i * 3 + 2]];
            avg_accumulation_triangle[i] = value / 3; // TODO: /3 or not? (distribute and accumulate?)
        }
        // calculate acc by cell based on the triangles that compose it
        let count_acc_cell = new Array(maxId + 1).fill(0);
        indicesByThree = Math.trunc(indices.length / 3);
        for (let i = 0; i < indicesByThree; i++) {
            let cell = ids[i];
            avg_accumulation_cell[cell] += avg_accumulation_triangle[i];
            count_acc_cell[cell] += 1;
        }
        indicesByThree = Math.trunc(indices.length / 3);
        for (let i = 0; i < indicesByThree; i++) {
            let cell = ids[i];
            avg_accumulation_triangle[i] = avg_accumulation_cell[cell] / count_acc_cell[cell];
        }
        return avg_accumulation_triangle;
    }
    /**
     * Distributes triangle avg to the coordinates that composes the triangle.
     * The coordinates need to be duplicated, meaning that there are unique indices.
     */
    perCoordinatesAvg(avg_accumulation_triangle, coordsLength, indices) {
        let avg_accumulation_per_coordinates = new Array(coordsLength).fill(0);
        for (let i = 0; i < avg_accumulation_triangle.length; i++) {
            let elem = avg_accumulation_triangle[i];
            avg_accumulation_per_coordinates[indices[i * 3]] = elem;
            avg_accumulation_per_coordinates[indices[i * 3 + 1]] = elem;
            avg_accumulation_per_coordinates[indices[i * 3 + 2]] = elem;
        }
        return avg_accumulation_per_coordinates;
    }
    distributeFunctionValues(functionValues) {
        if (functionValues == null) {
            return null;
        }
        let ids = this._mesh.getIdsVBO();
        let indices = this._mesh.getIndicesVBO();
        let coordsLength = this._mesh.getTotalNumberOfCoords();
        let per_face_avg_accum = this.perFaceAvg(functionValues, indices, ids);
        let avg_accumulation_per_coordinates = this.perCoordinatesAvg(per_face_avg_accum, coordsLength, indices);
        return avg_accumulation_per_coordinates;
    }
    innerAggFunc(functionValues, startLevel, endLevel, operation) {
        throw Error("Inner operation is not supported for the heatmap layer");
    }
    getFunctionValueIndexOfId(id, level) {
        if (level == LevelType.COORDINATES3D) {
            throw Error("The heatmap layer does not have function values attached to COORDINATES3D");
        }
        if (level == LevelType.COORDINATES) {
            return id;
        }
        if (level == LevelType.OBJECTS) {
            let readCoords = 0;
            let coordsPerComp = this._mesh.getCoordsPerComp();
            for (let i = 0; i < coordsPerComp.length; i++) {
                if (i == id) { // assumes that all coordinates of the same object have the same function value
                    return readCoords;
                }
                readCoords += coordsPerComp[i];
            }
        }
        return null;
    }
    /**
     *
     * @returns each position of the array contains an element of that level
     */
    getCoordsByLevel(level) {
        let coordByLevel = [];
        if (level == LevelType.COORDINATES || level == LevelType.OBJECTS) {
            throw Error("The heatmap layer can only be operated in the COORDINATES3D level");
        }
        if (level == LevelType.COORDINATES3D) {
            if (this._coordsByCOORDINATES3D.length == 0) {
                let coords = this._mesh.getCoordinatesVBO();
                for (let i = 0; i < coords.length / 3; i++) {
                    coordByLevel.push([coords[i * 3], coords[i * 3 + 1], coords[i * 3 + 2]]);
                }
                this._coordsByCOORDINATES3D = coordByLevel;
            }
            else {
                coordByLevel = this._coordsByCOORDINATES3D;
            }
        }
        return coordByLevel;
    }
    getFunctionByLevel(level, knotId) {
        let functionByLevel = [];
        if (level == LevelType.COORDINATES || level == LevelType.OBJECTS) {
            throw Error("The heatmap layer can only be operated in the COORDINATES3D level");
        }
        if (level == LevelType.COORDINATES3D) {
            let functionValues = this._mesh.getFunctionVBO(knotId)[0].map(x => [x]);
            functionByLevel = functionValues;
        }
        return functionByLevel;
    }
    getHighlightsByLevel(level) {
        throw Error("The heatmap layer has no highlight attributes");
    }
}

class LayerManager {
    // Loaded layers
    _layers = [];
    _filterBbox = []; // minx, miny, maxx, maxy
    _updateStatusCallback;
    _map;
    constructor(updateStatusCallback = null, map) {
        this._updateStatusCallback = updateStatusCallback;
        this._map = map;
    }
    /**
     * Layers vector accessor
     * @returns {Layer[]} The array of layers
     */
    get layers() {
        return this._layers;
    }
    set filterBbox(bbox) {
        this._updateStatusCallback("filterKnots", bbox);
        this._filterBbox = bbox;
        for (const knot of this._map.knotManager.knots) {
            knot.physicalLayer.mesh.setFiltered(bbox);
            for (const shader of knot.shaders) {
                shader.setFiltered(knot.physicalLayer.mesh.filtered);
                if (shader.currentKnot != undefined) { // if layer is being rendered
                    shader.updateShaderData(knot.physicalLayer.mesh, shader.currentKnot); // recalculating normalization
                }
            }
        }
    }
    /**
    * Creates a layer from the server
    * @param {string} layerType layer type
    * @param {string} layerId layer identifier
    * @returns {Layer | null} The load layer promise
    */
    createLayer(layerInfo, centroid, features) {
        // loaded layer
        let layer = null;
        // z order
        let zOrder = this._layers.length + 1;
        // loads based on type
        switch (layerInfo.type) {
            case LayerType.TRIANGLES_2D_LAYER:
                layer = new TrianglesLayer(layerInfo, 2, zOrder, centroid, features);
                break;
            case LayerType.TRIANGLES_3D_LAYER:
                layer = new TrianglesLayer(layerInfo, 3, zOrder, centroid, features);
                break;
            case LayerType.LINES_2D_LAYER:
                layer = new LinesLayer(layerInfo, 2, zOrder, centroid, features);
                break;
            case LayerType.LINES_3D_LAYER:
                layer = new LinesLayer(layerInfo, 3, zOrder, centroid, features);
                break;
            case LayerType.BUILDINGS_LAYER:
                layer = new BuildingsLayer(layerInfo, zOrder, centroid, features);
                break;
            case LayerType.HEATMAP_LAYER:
                layer = new HeatmapLayer(layerInfo, zOrder, centroid, features);
                break;
            case LayerType.POINTS_LAYER:
                layer = new PointsLayer(layerInfo, zOrder, centroid, features);
                break;
            default:
                console.error(`File ${layerInfo.id}.json has an unknown layer type: ${layerInfo.type}.`);
                break;
        }
        if (layer) {
            // adds the the list of layers
            this._layers.push(layer);
        }
        // returns the layer
        return layer;
    }
    getJoinedObjects(layer, linkDescription) {
        let targetLinkId = -1;
        let idCounter = 0;
        for (const joinedLayer of layer.joinedLayers) {
            if (joinedLayer.abstract == linkDescription.abstract && linkDescription.in != undefined && joinedLayer.layerId == linkDescription.in.name && linkDescription.in.level == joinedLayer.inLevel
                && linkDescription.spatial_relation == joinedLayer.spatial_relation && linkDescription.out.level == joinedLayer.outLevel) {
                targetLinkId = idCounter;
            }
            idCounter += 1;
        }
        if (targetLinkId == -1) {
            return null;
        }
        for (const joinedObject of layer.joinedObjects) {
            if (joinedObject.joinedLayerIndex == targetLinkId) {
                return joinedObject;
            }
        }
        return null;
    }
    getAbstractDataFromLink(linkScheme) {
        if (linkScheme.length < 1) {
            throw new Error("Can not get abstract data from link. Link scheme must have at least one element");
        }
        let functionValues = null; // always in the coordinate level
        if (linkScheme[0].abstract == false) {
            throw new Error("The first link in the link scheme must be between an abstract and physical layer");
        }
        for (let i = 0; i < linkScheme.length; i++) {
            let left_side = this.searchByLayerId(linkScheme[i].out.name);
            if (left_side == null) {
                throw new Error("Layer " + linkScheme[i].out.name + " not found while trying to get abstract data from the link");
            }
            if (linkScheme[i].abstract == true) {
                let joinedObjects = this.getJoinedObjects(left_side, linkScheme[i]);
                if (joinedObjects == null) {
                    throw new Error("Joined objects not found in " + linkScheme[i].out.name);
                }
                if (joinedObjects != null && joinedObjects.inValues != undefined) {
                    functionValues = [];
                    if (linkScheme[i].out.level == LevelType.COORDINATES || linkScheme[i].out.level == LevelType.COORDINATES3D) {
                        for (const value of joinedObjects.inValues) {
                            functionValues.push(value);
                        }
                    }
                    else if (linkScheme[i].out.level == LevelType.OBJECTS) { // distributing the values to the coordinates of the object
                        let coordsPerComp = left_side.mesh.getCoordsPerComp();
                        let distributedValues = [];
                        for (let j = 0; j < joinedObjects.inValues.length; j++) {
                            for (let k = 0; k < coordsPerComp[j]; k++) {
                                distributedValues.push(joinedObjects.inValues[j]);
                            }
                        }
                        functionValues = distributedValues;
                    }
                }
            }
            // if(linkScheme[i].abstract == undefined){
            //     throw new Error("abstract field cannot be undefined when extracting function values");
            // }
            if (linkScheme[i].abstract == false) {
                // inner operation (changing geometry levels inside the same layer)
                if (linkScheme[i].spatial_relation == SpatialRelationType.INNERAGG && functionValues != null && linkScheme[i].in != undefined && linkScheme[i].out.level != undefined) {
                    functionValues = left_side.innerAggFunc(functionValues, linkScheme[i].in.level, linkScheme[i].out.level, linkScheme[i].operation);
                }
                else if (functionValues != null && linkScheme[i].in != undefined && linkScheme[i].out.level != undefined) { // sjoin with another physical layer
                    if (linkScheme[i].in.name == linkScheme[i].out.name) {
                        throw new Error("Only the spatial_relation INNERAGG can be used inside the context of the same layer");
                    }
                    let joinedObjects = this.getJoinedObjects(left_side, linkScheme[i]);
                    if (joinedObjects == null) {
                        throw new Error("Joined objects not found in " + linkScheme[i].out.name);
                    }
                    if (joinedObjects != null && joinedObjects.inIds != undefined && linkScheme[i].in != undefined) {
                        let joinedFunctionValues = [];
                        let right_side = this.searchByLayerId(linkScheme[i].in.name);
                        if (right_side == null) {
                            throw new Error("Layer " + linkScheme[i].in.name + " not found while trying to get abstract data from the link");
                        }
                        for (let j = 0; j < joinedObjects.inIds.length; j++) {
                            let idList = joinedObjects.inIds[j];
                            if (idList == null) {
                                joinedFunctionValues.push([null]);
                            }
                            else {
                                let idsFuncValues = [];
                                for (const id of idList) {
                                    let functionIndex = right_side.getFunctionValueIndexOfId(id, linkScheme[i].in.level);
                                    if (functionIndex == null) {
                                        throw Error("Function index not found");
                                    }
                                    idsFuncValues.push(functionValues[functionIndex]);
                                }
                                joinedFunctionValues.push(idsFuncValues);
                            }
                        }
                        let aggregatedValues = [];
                        // aggregate values
                        for (let j = 0; j < joinedFunctionValues.length; j++) {
                            if (joinedFunctionValues[j][0] != null) {
                                if (linkScheme[i].operation == OperationType.MAX) {
                                    aggregatedValues.push(Math.max(...joinedFunctionValues[j]));
                                }
                                else if (linkScheme[i].operation == OperationType.MIN) {
                                    aggregatedValues.push(Math.min(...joinedFunctionValues[j]));
                                }
                                else if (linkScheme[i].operation == OperationType.AVG) {
                                    let sum = joinedFunctionValues[j].reduce((partialSum, value) => partialSum + value, 0);
                                    aggregatedValues.push(sum / joinedFunctionValues[j].length);
                                }
                                else if (linkScheme[i].operation == OperationType.SUM) {
                                    aggregatedValues.push(joinedFunctionValues[j].reduce((partialSum, value) => partialSum + value, 0));
                                }
                                else if (linkScheme[i].operation == OperationType.COUNT) {
                                    aggregatedValues.push(joinedFunctionValues[j].length);
                                }
                                else if (linkScheme[i].operation == OperationType.NONE) {
                                    throw new Error('NONE operation cannot be used with when linking two physical layers');
                                }
                            }
                            else {
                                aggregatedValues.push(0); // TODO: which value to use with null joins?
                            }
                        }
                        let distributedValues = [];
                        let groupedDistributedValues = [];
                        if (linkScheme[i].out.level == LevelType.COORDINATES || linkScheme[i].out.level == LevelType.COORDINATES3D) {
                            distributedValues = aggregatedValues;
                        }
                        else if (linkScheme[i].out.level == LevelType.OBJECTS) {
                            let coordsPerComp = left_side.mesh.getCoordsPerComp();
                            for (let j = 0; j < aggregatedValues.length; j++) {
                                groupedDistributedValues.push([]);
                                for (let k = 0; k < coordsPerComp[j]; k++) {
                                    groupedDistributedValues[groupedDistributedValues.length - 1].push(aggregatedValues[j]);
                                    distributedValues.push(aggregatedValues[j]);
                                }
                            }
                        }
                        functionValues = distributedValues;
                    }
                }
            }
        }
        return functionValues;
    }
    searchByLayerInfo(layerInfo) {
        // searches the layer
        let layer = null;
        for (const lay of this.layers) {
            if (lay.id === layerInfo.id) {
                layer = lay;
                break;
            }
        }
        return layer;
    }
    searchByLayerId(layerId) {
        // searches the layer
        let layer = null;
        for (const lay of this.layers) {
            if (lay.id === layerId) {
                layer = lay;
                break;
            }
        }
        return layer;
    }
}

// import { MapView } from './mapview';
class MouseEvents {
    // div to attach the events
    _map;
    // mouse movement control.
    _status;
    _lastPoint;
    _brushing;
    _brushingPivot;
    _brushingFilter;
    _brushingFilterPivot;
    _currentPoint; // tracks the cursor current point
    get lastPoint() {
        return this._lastPoint;
    }
    get currentPoint() {
        return this._currentPoint;
    }
    setMap(map) {
        // map reference
        this._map = map;
        // default values
        this._status = MapViewStatu.IDLE;
        this._lastPoint = [0, 0];
        this._brushing = false;
        this._brushingPivot = [0, 0];
        this._brushingFilter = false;
        this._brushingFilterPivot = [0, 0];
        this._currentPoint = [];
    }
    /**
     * Mouse events binding function
     */
    bindEvents() {
        // sets the canvas listeners
        this._map.canvas.addEventListener('wheel', this.mouseWheel.bind(this), false);
        this._map.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
        this._map.canvas.addEventListener('contextmenu', this.contextMenu.bind(this), false);
        this._map.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
    }
    oneTimeBind() {
        // sets the document listeners
        document.addEventListener('mouseup', this.mouseUp.bind(this), false);
    }
    /**
     * Handles mouse right click event
     * @param {MouseEvent} event The fired event
     */
    contextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    /**
     * Handles mouse down event
     * @param {MouseEvent} event The fired event
     */
    mouseDown(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        if (event.button == 0 || event.button == 1) { // left click
            this._lastPoint = [event.offsetX, event.offsetY];
            if (event.ctrlKey) {
                // mouseX and mouseY are in CSS pixels in display space 
                const rect = this._map.canvas.getBoundingClientRect();
                let mouseX = event.clientX - rect.left;
                let mouseY = event.clientY - rect.top;
                // left click + ctrlKey
                for (const knot of this._map.knotManager.knots) {
                    knot.interact(this._map.glContext, "left+ctrl", [mouseX, mouseY]);
                }
            }
            else {
                this._status = MapViewStatu.DRAG;
            }
        }
        else if (event.button == 2) { // right click
            // right click - altKey
            if (!event.altKey) {
                for (const knot of this._map.knotManager.knots) {
                    knot.interact(this._map.glContext, 'right-alt');
                }
            }
            this._status = MapViewStatu.DRAG_RIGHT;
        }
        this._map.render();
    }
    /**
     * Handles mouse move event
     * @param {MouseEvent} event The fired event
     */
    mouseMove(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        const rect = this._map.canvas.getBoundingClientRect();
        this._currentPoint[0] = event.clientX - rect.left;
        this._currentPoint[1] = event.clientY - rect.top;
        // left click drag
        if (this._status === MapViewStatu.DRAG) {
            if (event.altKey) {
                let mouseX = this._currentPoint[0];
                let mouseY = this._currentPoint[1];
                if (!this._brushing) {
                    // left click + drag + alt - brushing
                    for (const knot of this._map.knotManager.knots) {
                        knot.interact(this._map.glContext, "left+drag+alt-brushing", [mouseX, mouseY], [mouseX, mouseY]);
                    }
                    this._brushingPivot[0] = mouseX;
                    this._brushingPivot[1] = mouseY;
                    this._brushing = true;
                }
                else {
                    // left click + drag + alt + brushing
                    for (const knot of this._map.knotManager.knots) {
                        knot.interact(this._map.glContext, "left+drag+alt+brushing", [mouseX, mouseY], [this._brushingPivot[0], this._brushingPivot[1]]);
                    }
                }
            }
            else {
                if (this._brushing) {
                    // left click + drag - alt + brushing
                    // brush ended, need to apply it
                    for (const knot of this._map.knotManager.knots) {
                        knot.interact(this._map.glContext, "left+drag-alt+brushing");
                    }
                    this._brushing = false;
                }
                const dx = (-event.offsetX + this._lastPoint[0]);
                const dy = event.offsetY - this._lastPoint[1];
                if (event.buttons === 1 && event.shiftKey) { // left button
                    this._map.camera.yaw(dx / this._map.canvas.clientWidth);
                    this._map.camera.pitch(dy / this._map.canvas.clientHeight);
                }
                else {
                    this._map.camera.translate(dx / this._map.canvas.clientWidth, dy / this._map.canvas.clientHeight);
                }
                this._lastPoint = [event.offsetX, event.offsetY];
            }
            this._map.render();
        }
        else {
            if (this._brushing) {
                // -drag-alt+brushing
                // brush ended, need to apply it
                for (const knot of this._map.knotManager.knots) {
                    knot.interact(this._map.glContext, "-drag-alt+brushing");
                }
                this._map.render();
            }
            this._brushing = false;
        }
        // right click drag
        if (this._status === MapViewStatu.DRAG_RIGHT) {
            if (event.altKey) {
                let mouseX = this._currentPoint[0];
                let mouseY = this._currentPoint[1];
                if (!this._brushingFilter) {
                    // right click + drag - brushingFilter
                    for (const knot of this._map.knotManager.knots) {
                        knot.interact(this._map.glContext, "right+drag-brushingFilter", [mouseX, mouseY], [mouseX, mouseY]);
                    }
                    this._brushingFilterPivot[0] = mouseX;
                    this._brushingFilterPivot[1] = mouseY;
                    this._brushingFilter = true;
                }
                else {
                    // right click + drag + brushingFilter
                    for (const knot of this._map.knotManager.knots) {
                        knot.interact(this._map.glContext, "right+drag+brushingFilter", [mouseX, mouseY], [this._brushingFilterPivot[0], this._brushingFilterPivot[1]]);
                    }
                }
            }
            else {
                if (this._brushingFilter) {
                    let largerBbox = [null, null, null, null];
                    for (const knot of this._map.knotManager.knots) {
                        if (knot.physicalLayer instanceof BuildingsLayer || knot.physicalLayer instanceof TrianglesLayer) {
                            let bbox = knot.physicalLayer.getSelectedFiltering(knot.shaders);
                            if (bbox != null) {
                                if (largerBbox[0] == null) {
                                    largerBbox[0] = bbox[0];
                                }
                                else if (bbox[0] < largerBbox[0]) {
                                    largerBbox[0] = bbox[0];
                                }
                                if (largerBbox[1] == null) {
                                    largerBbox[1] = bbox[1];
                                }
                                else if (bbox[1] < largerBbox[1]) {
                                    largerBbox[1] = bbox[1];
                                }
                                if (largerBbox[2] == null) {
                                    largerBbox[2] = bbox[2];
                                }
                                else if (bbox[2] > largerBbox[2]) {
                                    largerBbox[2] = bbox[2];
                                }
                                if (largerBbox[3] == null) {
                                    largerBbox[3] = bbox[3];
                                }
                                else if (bbox[3] > largerBbox[3]) {
                                    largerBbox[3] = bbox[3];
                                }
                            }
                        }
                    }
                    this._map.layerManager.filterBbox = largerBbox;
                    this._map.updateGrammarPlotsData();
                    this._brushingFilter = false;
                }
            }
            this._map.render();
        }
        else {
            if (this._brushingFilter) {
                let largerBbox = [null, null, null, null];
                for (const knot of this._map.knotManager.knots) {
                    if (knot.physicalLayer instanceof BuildingsLayer || knot.physicalLayer instanceof TrianglesLayer) {
                        let bbox = knot.physicalLayer.getSelectedFiltering(knot.shaders);
                        if (bbox != null) {
                            if (largerBbox[0] == null) {
                                largerBbox[0] = bbox[0];
                            }
                            else if (bbox[0] < largerBbox[0]) {
                                largerBbox[0] = bbox[0];
                            }
                            if (largerBbox[1] == null) {
                                largerBbox[1] = bbox[1];
                            }
                            else if (bbox[1] < largerBbox[1]) {
                                largerBbox[1] = bbox[1];
                            }
                            if (largerBbox[2] == null) {
                                largerBbox[2] = bbox[2];
                            }
                            else if (bbox[2] > largerBbox[2]) {
                                largerBbox[2] = bbox[2];
                            }
                            if (largerBbox[3] == null) {
                                largerBbox[3] = bbox[3];
                            }
                            else if (bbox[3] > largerBbox[3]) {
                                largerBbox[3] = bbox[3];
                            }
                        }
                    }
                }
                this._map.layerManager.filterBbox = largerBbox;
                this._map.updateGrammarPlotsData();
                this._map.render();
            }
            this._brushingFilter = false;
        }
    }
    /**
     * Handles mouse up event
     */
    mouseUp(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        // changes the values
        this._status = MapViewStatu.IDLE;
        this._map.render();
    }
    /**
     * Handles mouse down event
     * @param {WheelEvent} event The fired event
     */
    async mouseWheel(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();
        if (event.altKey) {
            // wheel + alt
            for (const knot of this._map.knotManager.knots) {
                let currentPoint = this._currentPoint;
                knot.interact(this._map.glContext, "wheel+alt", [currentPoint[0], currentPoint[1]], null, event);
            }
            this._map.render();
        }
        else {
            // changes the values
            const maxAxisLength = Math.max(this._map.canvas.clientWidth, this._map.canvas.clientHeight);
            const x = event.offsetX / maxAxisLength;
            const y = (this._map.canvas.height - event.offsetY) / maxAxisLength;
            this._map.camera.zoom(event.deltaY * 0.01, x, y);
            this._map.render();
        }
    }
}
var MouseEventsFactory = (function () {
    var instance;
    return {
        getInstance: function () {
            if (instance == null) {
                instance = new MouseEvents();
                instance.oneTimeBind();
                // instance.constructor = null;
            }
            return instance;
        }
    };
})();

var noop = {value: () => {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root);
}

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(elapsed => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color$1 ? interpolateRgb
      : (c = color$1(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error;
    set(this, id).ease = v;
  };
}

function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error;
  return this.each(easeVarying(this._id, value));
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection = selection.prototype.constructor;

function transition_selection() {
  return new Selection(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });

    // The selection was empty, resolve end immediately
    if (size === 0) resolve();
  });
}

var id$1 = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function newId() {
  return ++id$1;
}

var selection_prototype = selection.prototype;

Transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id} not found`);
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

Transform.prototype;

const vega = require('vega');
const lite = require('vega-lite');
class LockFlag {
    _flag;
    constructor() {
        this._flag = false;
    }
    set() {
        this._flag = true;
    }
    get flag() {
        return this._flag;
    }
}
// TODO: Generalize grammar manager to work with several components
class GrammarManager {
    _viewData; // TODO: only one active view is currently supported
    _grammarSpec;
    _updateStatusCallback;
    _setGrammarUpdateCallback;
    _plotsKnotsData;
    _setHighlightElementCallback;
    _plotsReferences;
    _needToUnHighlight;
    _highlightedVegaElements = [];
    /**
     *
     * @param viewData
     * @param setGrammarUpdateCallback Function that sets the callback that will be called in the frontend to update the grammar
     */
    constructor(grammar, updateStatusCallback, plotsKnotsData, setHighlightElementCallback) {
        for (const component of grammar['components']) {
            if ("map" in component) {
                this._viewData = component;
            }
        }
        this._updateStatusCallback = updateStatusCallback;
        this._setHighlightElementCallback = setHighlightElementCallback;
        this._plotsReferences = new Array(this._viewData.plots.length);
        this._needToUnHighlight = false;
        this.updateGrammarPlotsData(plotsKnotsData);
    }
    async updateGrammarPlotsData(plotsKnotsData) {
        this._plotsKnotsData = plotsKnotsData;
        let processedKnotData = this.proccessKnotData();
        this.attachPlots(processedKnotData);
    }
    proccessKnotData() {
        let processedKnotData = {};
        for (let i = 0; i < this._plotsKnotsData.length; i++) {
            let knotData = this._plotsKnotsData[i];
            processedKnotData[knotData.knotId] = { 'values': [] };
            for (let j = 0; j < knotData.elements.length; j++) {
                let element = knotData.elements[j];
                let value = {};
                value[knotData.knotId + "_index"] = element.index;
                value[knotData.knotId + "_abstract"] = element.abstract;
                value[knotData.knotId + "_highlight"] = element.highlighted;
                processedKnotData[knotData.knotId].values.push(value);
            }
        }
        return processedKnotData;
    }
    clearHighlightsLocally(knotsIds) {
        // update local data
        for (const plotKnotData of this._plotsKnotsData) {
            if (knotsIds.includes(plotKnotData.knotId)) {
                for (const element of plotKnotData.elements) {
                    element.highlighted = false;
                }
            }
        }
        // update plots data
        for (let i = 0; i < this._viewData.plots.length; i++) {
            let elem = this._viewData.plots[i];
            if (elem.plot.data != undefined) {
                for (const value of elem.plot.data.values) {
                    for (const knotId of knotsIds) {
                        if (value[knotId + "_index"] != undefined) {
                            value[knotId + "_highlight"] = false;
                        }
                    }
                }
                let valuesCopy = [];
                for (const value of elem.plot.data.values) {
                    let valueCopy = {};
                    let valueKeys = Object.keys(value);
                    for (const key of valueKeys) {
                        if (key != "Symbol(vega_id)") {
                            valueCopy[key] = value[key];
                        }
                    }
                    valuesCopy.push(valueCopy);
                }
                let changeset = vega.changeset().remove(() => true).insert(valuesCopy);
                if (this._plotsReferences[i] != undefined) {
                    this._plotsReferences[i].change('source_0', changeset).runAsync();
                }
            }
        }
    }
    // if toggle if activate ignore the truth value and just toggle the highlight
    setHighlightElementsLocally(elements, truthValue, toggle = false) {
        // update local data
        for (const plotKnotData of this._plotsKnotsData) {
            if (elements[plotKnotData.knotId] != undefined) {
                for (const element of plotKnotData.elements) {
                    if (element.index == elements[plotKnotData.knotId]) {
                        if (toggle) {
                            element.highlighted = !element.highlighted;
                        }
                        else {
                            element.highlighted = truthValue;
                        }
                        break;
                    }
                }
            }
        }
        // update plots data
        for (let i = 0; i < this._viewData.plots.length; i++) {
            let elem = this._viewData.plots[i];
            if (elem.plot.data != undefined) {
                for (const value of elem.plot.data.values) {
                    let elementsKeys = Object.keys(elements);
                    for (const knotId of elementsKeys) {
                        if (value[knotId + "_index"] != undefined && value[knotId + "_index"] == elements[knotId]) {
                            if (toggle) {
                                value[knotId + "_highlight"] = !value[knotId + "_highlight"];
                            }
                            else {
                                value[knotId + "_highlight"] = truthValue;
                            }
                        }
                    }
                }
                let valuesCopy = [];
                for (const value of elem.plot.data.values) {
                    let valueCopy = {};
                    let valueKeys = Object.keys(value);
                    for (const key of valueKeys) {
                        if (key != "Symbol(vega_id)") {
                            valueCopy[key] = value[key];
                        }
                    }
                    valuesCopy.push(valueCopy);
                }
                let changeset = vega.changeset().remove(() => true).insert(valuesCopy);
                if (this._plotsReferences[i] != undefined) {
                    this._plotsReferences[i].change('source_0', changeset).runAsync();
                }
            }
        }
    }
    async attachPlots(processedKnotData) {
        function mergeKnotData(values1, values2) {
            let values3 = [];
            if (values1.length != values2.length) {
                throw Error("The knots of a plot must have the same number of elements"); // TODO: enforce that knots of the same plot must end in the same layer and geometry level
            }
            for (let i = 0; i < values1.length; i++) {
                let currentObj = {};
                let values1Keys = Object.keys(values1[0]);
                for (const key of values1Keys) {
                    currentObj[key] = values1[i][key];
                }
                let values2Keys = Object.keys(values2[0]);
                for (const key of values2Keys) {
                    currentObj[key] = values2[i][key];
                }
                values3.push(currentObj);
            }
            return { "values": values3 };
        }
        let linkedPlots = [];
        let names = [];
        for (let i = 0; i < this._viewData.plots.length; i++) {
            if (this._viewData.plots[i].arrangement == PlotArrangementType.LINKED) {
                linkedPlots.push(this._viewData.plots[i]);
                if (this._viewData.plots[i].name != undefined) {
                    names.push(this._viewData.plots[i].name);
                }
                else {
                    names.push('');
                }
            }
        }
        let ids = await this._updateStatusCallback("containerGenerator", linkedPlots.length, names);
        for (let i = 0; i < linkedPlots.length; i++) {
            // TODO: this checking can be done earlier to avoid unecesary calculations
            if (linkedPlots[i].arrangement != PlotArrangementType.LINKED) {
                continue;
            }
            let elem = linkedPlots[i];
            let plotId = ids[i];
            let mergedKnots = processedKnotData[elem.knots[0]];
            for (let j = 1; j < elem.knots.length; j++) {
                mergedKnots = mergeKnotData(mergedKnots.values, processedKnotData[elem.knots[j]].values);
            }
            elem.plot.data = mergedKnots;
            let vegaspec = lite.compile(elem.plot).spec;
            var view = new vega.View(vega.parse(vegaspec))
                .logLevel(vega.Warn) // set view logging level
                .renderer('svg')
                .initialize("#" + plotId)
                .hover();
            this._plotsReferences[i] = view;
            if (elem.interaction != undefined) {
                if (elem.interaction == PlotInteractionType.HOVER) {
                    let _this = this;
                    view.addEventListener('mouseover', function (event, item) {
                        if (item != undefined && item.datum != undefined) {
                            let elementsToHighlight = {};
                            for (const key of elem.knots) {
                                if (item.datum[key + '_highlight'] == false) {
                                    _this._setHighlightElementCallback.function(key, item.datum[key + '_index'], true, _this._setHighlightElementCallback.arg);
                                    elementsToHighlight[key] = item.datum[key + "_index"];
                                }
                            }
                            if (Object.keys(elementsToHighlight).length > 0) {
                                _this.setHighlightElementsLocally(elementsToHighlight, true);
                                _this._needToUnHighlight = true;
                                _this._highlightedVegaElements.push(item);
                            }
                        }
                    });
                    view.addEventListener('mouseout', function (event, item) {
                        if (item != undefined && item.datum != undefined) {
                            let elementsToUnHighlight = {};
                            for (const key of elem.knots) {
                                _this._setHighlightElementCallback.function(key, item.datum[key + '_index'], false, _this._setHighlightElementCallback.arg);
                                elementsToUnHighlight[key] = item.datum[key + "_index"];
                            }
                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                        }
                        for (const highlightedItem of _this._highlightedVegaElements) {
                            let elementsToUnHighlight = {};
                            for (const key of elem.knots) {
                                _this._setHighlightElementCallback.function(key, highlightedItem.datum[key + '_index'], false, _this._setHighlightElementCallback.arg);
                                elementsToUnHighlight[key] = highlightedItem.datum[key + "_index"];
                            }
                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                        }
                        _this._highlightedVegaElements = [];
                    });
                }
                if (elem.interaction == PlotInteractionType.BRUSH) {
                    throw Error("Plot " + PlotInteractionType.BRUSH + " not implemented yet");
                }
                if (elem.interaction == PlotInteractionType.CLICK) {
                    let _this = this;
                    view.addEventListener('click', function (event, item) {
                        if (item == undefined || item.datum == undefined) {
                            let elementsToUnHighlight = {};
                            for (const key of elem.knots) {
                                // unhighlight all elements of this plot
                                for (const value of elem.plot.data.values) {
                                    if (value[key + '_index'] != undefined) {
                                        _this._setHighlightElementCallback.function(key, value[key + '_index'], false, _this._setHighlightElementCallback.arg);
                                        elementsToUnHighlight[key] = value[key + '_index'];
                                    }
                                }
                            }
                            _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                        }
                        else {
                            let unhighlight = false;
                            for (const key of elem.knots) {
                                if (item.datum[key + "_highlight"] == true) {
                                    unhighlight = true;
                                    break;
                                }
                            }
                            if (unhighlight) {
                                let elementsToUnHighlight = {};
                                // highlight the clicked element
                                for (const key of elem.knots) {
                                    _this._setHighlightElementCallback.function(key, item.datum[key + '_index'], false, _this._setHighlightElementCallback.arg);
                                    elementsToUnHighlight[key] = item.datum[key + "_index"];
                                }
                                _this.setHighlightElementsLocally(elementsToUnHighlight, false);
                            }
                            else {
                                let elementsToHighlight = {};
                                // highlight the clicked element
                                for (const key of elem.knots) {
                                    _this._setHighlightElementCallback.function(key, item.datum[key + '_index'], true, _this._setHighlightElementCallback.arg);
                                    elementsToHighlight[key] = item.datum[key + "_index"];
                                }
                                _this.setHighlightElementsLocally(elementsToHighlight, true);
                            }
                        }
                    });
                }
            }
            view.runAsync();
            select("#" + plotId).style("background-color", "white");
        }
    }
    getAbstractValues(functionIndex, knotsId, plotsKnotsData) {
        let abstractValues = {};
        for (const knotId of knotsId) {
            for (const knotData of plotsKnotsData) {
                if (knotId == knotData.knotId) {
                    let readCoords = 0;
                    for (let i = 0; i < knotData.elements.length; i++) {
                        if (functionIndex >= readCoords && functionIndex < (knotData.elements[i].coordinates.length / 3) + readCoords) {
                            abstractValues[knotId] = knotData.elements[i].abstract;
                            break;
                        }
                        readCoords += knotData.elements[i].coordinates.length / 3;
                    }
                    break;
                }
            }
        }
        return abstractValues;
    }
    async getHTMLFromVega(plot) {
        // generate HTMLImageElement from vega-spec
        let vegaspec = lite.compile(plot).spec;
        let view = new vega.View(vega.parse(vegaspec), { renderer: 'none' }); // create a Vega view based on the spec
        if (view == undefined) {
            throw Error("There is no plot defined for this embedding interaction");
        }
        let svgStringElement = await view.toSVG();
        let parser = new DOMParser();
        let svgElement = parser.parseFromString(svgStringElement, "image/svg+xml").querySelector('svg');
        if (svgElement == null)
            throw Error("Error while creating svg element from vega-lite plot spec");
        // creating a blob object
        let outerHTML = svgElement.outerHTML;
        let blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' });
        // creating URL from the blob Object
        let urlCreator = window.URL || window.webkitURL || window;
        let blobURL = urlCreator.createObjectURL(blob);
        let lockFlag = new LockFlag(); // flag to indicate if the image was loaded
        // loading image to html image element
        let image = new Image();
        image.addEventListener('load', function () {
            urlCreator.revokeObjectURL(blobURL);
            lockFlag.set();
        });
        image.src = blobURL;
        let checkFlag = async () => {
            if (lockFlag.flag == false) {
                await new Promise(r => setTimeout(r, 100));
                checkFlag();
            }
        };
        await checkFlag();
        return image;
    }
    async getFootEmbeddedSvg(data, plotWidth, plotHeight) {
        console.log("data", data);
        /**
         * @param {number} nBins total number of bins (circle is divided equally)
         */
        function defineBins(nBins) {
            let binData = [];
            let increment = (2 * Math.PI) / nBins; // the angles go from 0 to 2pi (radians)
            // adding the angles that define each bin
            for (let i = 0; i < nBins + 1; i++) {
                binData.push(i * increment);
            }
            return binData;
        }
        /**
         * Returns the index of the bin the angle belongs to
         * @param bins Array describing the beginning and end of all bins
         * @param angle angle in radians
         */
        function checkBin(bins, angle) {
            for (let i = 0; i < bins.length - 1; i++) {
                let start = bins[i];
                let end = bins[i + 1];
                if (angle >= start && angle <= end) {
                    return i;
                }
            }
            return -1; // returns -1 if it does not belong to any bin
        }
        let bins = 0;
        let selectedPlot;
        for (let i = 0; i < this._viewData.plots.length; i++) { // TODO: support multiple embedded plots
            if (this._viewData.plots[i].arrangement == PlotArrangementType.FOOT_EMBEDDED) {
                if (this._viewData.plots[i].args != undefined) {
                    bins = this._viewData.plots[i].args.bins;
                }
                selectedPlot = this._viewData.plots[i];
            }
        }
        let data_arr = JSON.parse(data);
        let vegaValues = [];
        let binsDescription;
        if (bins == 0) {
            binsDescription = [0, 360];
        }
        else {
            binsDescription = defineBins(bins);
        }
        for (let i = 0; i < data_arr.pointData.length; i++) {
            let point = data_arr.pointData[i];
            let value = {};
            value.x = point.pixelCoord[0];
            value.y = point.pixelCoord[1];
            value.bin = checkBin(binsDescription, radians(point.angle));
            value.normalX = point.normal[0];
            value.normalY = point.normal[1];
            let abstractValues = this.getAbstractValues(point.functionIndex, selectedPlot.knots, this._plotsKnotsData);
            let abstractValuesKeys = Object.keys(abstractValues);
            for (const key of abstractValuesKeys) {
                value[key + "_abstract"] = abstractValues[key];
            }
            vegaValues.push(value);
        }
        console.log("vegaValues", vegaValues);
        selectedPlot.plot.data = { "values": vegaValues };
        selectedPlot.plot.width = plotWidth;
        selectedPlot.plot.height = plotHeight;
        let image = await this.getHTMLFromVega(selectedPlot.plot);
        return image;
    }
    async getSurEmbeddedSvg(data, plotWidth, plotHeight) {
        let selectedPlot;
        for (let i = 0; i < this._viewData.plots.length; i++) { // TODO: support multiple embedded plots
            if (this._viewData.plots[i].arrangement == PlotArrangementType.SUR_EMBEDDED) {
                selectedPlot = this._viewData.plots[i];
            }
        }
        let data_arr = JSON.parse(data);
        let vegaValues = [];
        for (let i = 0; i < data_arr.length; i++) {
            let point = data_arr[i];
            let value = {};
            let abstractValues = this.getAbstractValues(point.functionIndex, selectedPlot.knots, this._plotsKnotsData);
            let abstractValuesKeys = Object.keys(abstractValues);
            for (const key of abstractValuesKeys) {
                value[key + "_abstract"] = abstractValues[key];
                value[key + "_index"] = point.index;
            }
            vegaValues.push(value);
        }
        selectedPlot.plot.data = { "values": vegaValues };
        selectedPlot.plot.width = plotWidth;
        selectedPlot.plot.height = plotHeight;
        let image = await this.getHTMLFromVega(selectedPlot.plot);
        return image;
    }
}

var vsColorPoints = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;in highp float funcValues;out highp vec2 texCoords;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){texCoords=vec2(funcValues,0);highp vec3 finalPos=vertCoords;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);gl_PointSize=10.0;}";

var fsColorPoints = "#version 300 es\nuniform sampler2D uColorMap;in highp vec2 texCoords;out highp vec4 fragColor;void main(){highp vec3 texColor=texture(uColorMap,texCoords).rgb;fragColor=vec4(texColor,1.0);}";

const d3$1 = require('d3');
class ShaderColorPoints extends Shader {
    // Data to be rendered
    _coords = [];
    _function = [];
    // Color map definition
    _colorMap = null;
    // Global color used on the layer
    // protected _globalColor: number[] = [];
    // Data loaction on GPU
    _glCoords = null;
    _glFunction = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    _colorMapDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    _functionId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    // protected _uGlobalColor: WebGLUniformLocation | null = null;
    _uColorMap = null;
    // Color map texture
    _texColorMap;
    constructor(glContext, colorMap = "interpolateReds") {
        super(vsColorPoints, fsColorPoints, glContext);
        // saves the layer color
        // this._globalColor = color;
        // saves the layer color
        this._colorMap = colorMap;
        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
        this.createTextures(glContext);
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
    }
    updateShaderData(mesh, knot) {
        this._currentKnot = knot;
        this._functionDirty = true;
        this._function = mesh.getFunctionVBO(knot.id);
        let scale = d3$1.scaleLinear().domain(d3$1.extent(this._function[0])).range([0, 1]);
        for (let i = 0; i < this._function[0].length; i++) {
            // this._function[0][i] = (this._function[0][i] - minFuncValue)/(maxFuncValue - minFuncValue);
            this._function[0][i] = scale(this._function[0][i]);
        }
    }
    updateShaderUniforms(data) {
        // this._globalColor = <number[]> data;
        this._colorMapDirty = true;
        this._colorMap = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        // this._uGlobalColor = glContext.getUniformLocation(this._shaderProgram, 'uGlobalColor');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
        // glContext.uniform3fv(this._uGlobalColor, this._globalColor);
    }
    createTextures(glContext) {
        if (!this._colorMap) {
            return;
        }
        this._uColorMap = glContext.getUniformLocation(this._shaderProgram, 'uColorMap');
        this._texColorMap = glContext.createTexture();
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
        // Set the parameters so we can render any size image.
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.NEAREST);
        glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.NEAREST);
        // Upload the image into the texture.
        const texData = ColorMap.getColorMap(this._colorMap);
        const size = [256, 1];
        glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGB32F, size[0], size[1], 0, glContext.RGB, glContext.FLOAT, new Float32Array(texData));
    }
    bindTextures(glContext) {
        // set which texture units to render with.
        glContext.uniform1i(this._uColorMap, 0);
        glContext.activeTexture(glContext.TEXTURE0);
        glContext.bindTexture(glContext.TEXTURE_2D, this._texColorMap);
    }
    createVertexArrayObject(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();
        // Creates the coords id.
        this._functionId = glContext.getAttribLocation(this._shaderProgram, 'funcValues');
        // Creates the function id
        this._glFunction = glContext.createBuffer();
    }
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        // binds the VAO
        glContext.vertexAttribPointer(this._coordsId, mesh.dimension, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._coordsId);
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glFunction);
        // send data to gpu
        if (this._functionDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._function[0]), glContext.STATIC_DRAW);
        }
        glContext.vertexAttribPointer(this._functionId, 1, glContext.FLOAT, false, 0, 0);
        glContext.enableVertexAttribArray(this._functionId);
        this._coordsDirty = false;
        this._functionDirty = false;
    }
    setFiltered(filtered) {
    }
    setHighlightElements(coordinates, value) {
        throw Error("Method not implemented yet");
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);
        // glContext.drawElements(glPrimitive, this._coords.length/3, glContext.UNSIGNED_INT, 0);
        glContext.drawArrays(glPrimitive, 0, this._coords.length / 3);
    }
}

var vsFlatColorPoints = "#version 300 es\nconst float pi=3.1415926535897932384626433832795;const float pi_180=0.017453292519943295769236907684886127134428718885417254560;const float pi_4=12.56637061435917295385057353311801153678867759750042328389;uniform highp mat4 uModelViewMatrix;uniform highp mat4 uProjectionMatrix;uniform highp vec2 uWorldOrigin;in highp vec3 vertCoords;vec2 latLngToPixel(highp float latitude,highp float longitude){highp float sinLatitude=sin(latitude*pi_180);highp float pixelY=256.0-((0.5-log((1.0+sinLatitude)/(1.0-sinLatitude))/(pi_4))*256.0);highp float pixelX=((longitude+180.0)/360.0)*256.0;return vec2(pixelX,pixelY);}void main(){highp vec3 finalPos=vertCoords;gl_Position=uProjectionMatrix*uModelViewMatrix*vec4(finalPos,1.0);gl_PointSize=10.0;}";

var fsFlatColorPoints = "#version 300 es\nuniform highp vec3 uGlobalColor;out highp vec4 fragColor;void main(){fragColor=vec4(uGlobalColor,1.0);}";

require('d3');
class ShaderFlatColorPoints extends Shader {
    // Data to be rendered
    _coords = [];
    _function = [];
    // Global color used on the layer
    _globalColor = [];
    // Data loaction on GPU
    _glCoords = null;
    _glFunction = null;
    // Data has chaged
    _coordsDirty = false;
    _functionDirty = false;
    // Id of each property in the VAO
    _coordsId = -1;
    // Uniforms location
    _uModelViewMatrix = null;
    _uProjectionMatrix = null;
    _uWorldOrigin = null;
    _uGlobalColor = null;
    constructor(glContext, color) {
        super(vsFlatColorPoints, fsFlatColorPoints, glContext);
        // saves the layer color
        this._globalColor = color;
        // creathe dhe shader variables
        this.createUniforms(glContext);
        this.createVertexArrayObject(glContext);
    }
    updateShaderGeometry(mesh) {
        this._coordsDirty = true;
        this._coords = mesh.getCoordinatesVBO();
    }
    updateShaderData(mesh, knot) {
        return;
    }
    updateShaderUniforms(data) {
        this._globalColor = data;
    }
    createUniforms(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        this._uModelViewMatrix = glContext.getUniformLocation(this._shaderProgram, 'uModelViewMatrix');
        this._uProjectionMatrix = glContext.getUniformLocation(this._shaderProgram, 'uProjectionMatrix');
        this._uWorldOrigin = glContext.getUniformLocation(this._shaderProgram, 'uWorldOrigin');
        this._uGlobalColor = glContext.getUniformLocation(this._shaderProgram, 'uGlobalColor');
    }
    bindUniforms(glContext, camera) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.uniformMatrix4fv(this._uModelViewMatrix, false, camera.getModelViewMatrix());
        glContext.uniformMatrix4fv(this._uProjectionMatrix, false, camera.getProjectionMatrix());
        glContext.uniform2fv(this._uWorldOrigin, camera.getWorldOrigin());
        glContext.uniform3fv(this._uGlobalColor, this._globalColor);
    }
    createTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    bindTextures(glContext) {
        throw new Error("Method not implemented.");
    }
    createVertexArrayObject(glContext) {
        if (!this._shaderProgram) {
            return;
        }
        // Creates the coords id.
        this._coordsId = glContext.getAttribLocation(this._shaderProgram, 'vertCoords');
        // Create a buffer for the positions.
        this._glCoords = glContext.createBuffer();
    }
    bindVertexArrayObject(glContext, mesh) {
        if (!this._shaderProgram) {
            return;
        }
        // binds the position buffer
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this._glCoords);
        // send data to gpu
        if (this._coordsDirty) {
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(this._coords), glContext.STATIC_DRAW);
        }
        this._coordsDirty = false;
    }
    setFiltered(filtered) {
    }
    setHighlightElements(coordinates, value) {
        throw Error("Method not implemented yet");
    }
    renderPass(glContext, glPrimitive, camera, mesh, zOrder) {
        if (!this._shaderProgram) {
            return;
        }
        glContext.useProgram(this._shaderProgram);
        this.bindUniforms(glContext, camera);
        this.bindVertexArrayObject(glContext, mesh);
        // glContext.drawElements(glPrimitive, this._coords.length/3, glContext.UNSIGNED_INT, 0);
        glContext.drawArrays(glPrimitive, 0, this._coords.length / 3);
    }
}

class Knot {
    _physicalLayer; // the physical format the data will assume
    _thematicData;
    _knotSpecification;
    _id;
    _shaders = [];
    _visible;
    _grammarInterpreter;
    _viewId;
    _map;
    constructor(id, physicalLayer, knotSpecification, grammarInterpreter, viewId, visible, map) {
        this._physicalLayer = physicalLayer;
        this._knotSpecification = knotSpecification;
        this._id = id;
        this._visible = visible;
        this._grammarInterpreter = grammarInterpreter;
        this._viewId = viewId;
        this._map = map;
    }
    get id() {
        return this._id;
    }
    get visible() {
        return this._visible;
    }
    get shaders() {
        return this._shaders;
    }
    get physicalLayer() {
        return this._physicalLayer;
    }
    get knotSpecification() {
        return this._knotSpecification;
    }
    set visible(visible) {
        this._visible = visible;
    }
    set thematicData(thematicData) {
        this._thematicData = thematicData;
    }
    render(glContext, camera) {
        if (!this._visible) {
            return;
        }
        this._physicalLayer.camera = camera;
        this._physicalLayer.render(glContext, this._shaders);
    }
    loadShaders(glContext) {
        this._shaders = [];
        const color = MapStyle.getColor(this._physicalLayer.style);
        let cmap = 'interpolateReds';
        if (this._knotSpecification['colorMap'] != undefined) {
            cmap = this._knotSpecification['colorMap'];
        }
        for (const type of this._physicalLayer.renderStyle) {
            let shader = undefined;
            switch (type) {
                case RenderStyle.FLAT_COLOR:
                    shader = new ShaderFlatColor(glContext, color);
                    break;
                case RenderStyle.FLAT_COLOR_MAP:
                    shader = new ShaderFlatColorMap(glContext, cmap);
                    break;
                case RenderStyle.SMOOTH_COLOR:
                    shader = new ShaderSmoothColor(glContext, color);
                    break;
                case RenderStyle.SMOOTH_COLOR_MAP:
                    shader = new ShaderSmoothColorMap(glContext, cmap);
                    break;
                case RenderStyle.SMOOTH_COLOR_MAP_TEX:
                    shader = new ShaderSmoothColorMapTex(glContext, cmap);
                    break;
                case RenderStyle.PICKING:
                    if (this._physicalLayer instanceof TrianglesLayer) {
                        let auxShader = undefined;
                        if (this._shaders.length > 0) {
                            auxShader = this._shaders[this._shaders.length - 1];
                        }
                        if (auxShader && auxShader instanceof AuxiliaryShaderTriangles) {
                            shader = new ShaderPickingTriangles(glContext, auxShader);
                        }
                        else {
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array. SMOOTH_COLOR_MAP can be used as an auxiliary array");
                        }
                    }
                    else if (this._physicalLayer instanceof BuildingsLayer) {
                        let auxShader = undefined;
                        if (this._shaders.length > 0) {
                            auxShader = this._shaders[this._shaders.length - 1];
                        }
                        if (auxShader && auxShader instanceof AuxiliaryShader) {
                            shader = new ShaderPicking(glContext, auxShader);
                        }
                        else {
                            throw new Error("The shader picking needs an auxiliary shader. The auxiliary shader is the one right before (order matters) shader picking in renderStyle array.");
                        }
                    }
                    break;
                case RenderStyle.ABSTRACT_SURFACES:
                    shader = new ShaderAbstractSurface(glContext);
                    break;
                case RenderStyle.COLOR_POINTS:
                    shader = new ShaderColorPoints(glContext, cmap);
                    break;
                case RenderStyle.FLAT_COLOR_POINTS:
                    shader = new ShaderFlatColorPoints(glContext, color);
                    break;
                default:
                    shader = new ShaderFlatColor(glContext, color);
                    break;
            }
            this._shaders.push(shader);
            // // load message
            // console.log("------------------------------------------------------");
            // console.log(`Layer ${this._id} of type ${this._type}.`);
            // console.log(`Render styles: ${this._renderStyle.join(", ")}`);
            // console.log(`Successfully loaded ${this._shaders.length} shader(s).`);
            // console.log("------------------------------------------------------");
        }
        this._physicalLayer.updateShaders(this._shaders); // send mesh data to the shaders
        this._physicalLayer.updateFunction(this._knotSpecification, this._shaders);
    }
    // send function values to the mesh of the layer
    addMeshFunction(layerManager) {
        let functionValues = null;
        if (this._knotSpecification.integration_scheme != null) {
            functionValues = layerManager.getAbstractDataFromLink(this._knotSpecification.integration_scheme);
        }
        this._thematicData = functionValues;
        let distributedValues = this._physicalLayer.distributeFunctionValues(functionValues);
        this._physicalLayer.mesh.loadFunctionData(distributedValues, this._knotSpecification.id);
    }
    processThematicData(layerManager) {
        if (this._knotSpecification.knotOp != true) {
            this.addMeshFunction(layerManager);
        }
        else { // TODO: knot should not have to retrieve the subknots they should be given
            let functionsPerKnot = {};
            for (const scheme of this._knotSpecification.integration_scheme) {
                if (functionsPerKnot[scheme.out.name] == undefined) {
                    let knot = this._grammarInterpreter.getKnotById(scheme.out.name, this._viewId);
                    if (knot == undefined) {
                        throw Error("Could not retrieve knot that composes knotOp " + this._knotSpecification.id);
                    }
                    functionsPerKnot[scheme.out.name] = layerManager.getAbstractDataFromLink(knot.integration_scheme);
                }
                if (scheme.in != undefined && functionsPerKnot[scheme.in.name] == undefined) {
                    let knot = this._grammarInterpreter.getKnotById(scheme.in.name, this._viewId);
                    if (knot == undefined) {
                        throw Error("Could not retrieve knot that composes knotOp " + this._knotSpecification.id);
                    }
                    functionsPerKnot[scheme.in.name] = layerManager.getAbstractDataFromLink(knot.integration_scheme);
                }
            }
            let functionSize = -1;
            let functionsPerKnotsKeys = Object.keys(functionsPerKnot);
            for (const key of functionsPerKnotsKeys) {
                if (functionSize == -1) {
                    functionSize = functionsPerKnot[key].length;
                }
                else if (functionSize != functionsPerKnot[key].length) {
                    throw Error("All knots used in knotOp must have the same length");
                }
            }
            if (functionSize == -1) {
                throw Error("Could not retrieve valid function values for knotOp " + this._knotSpecification.id);
            }
            let prevResult = new Array(functionSize);
            let linkIndex = 0;
            for (const scheme of this._knotSpecification.integration_scheme) {
                if (linkIndex == 0 && scheme.op.includes("prevResult")) {
                    throw Error("It is not possible to access a previous result (prevResult) for the first link");
                }
                let functionValue0 = functionsPerKnot[scheme.out.name];
                let functionValue1 = functionsPerKnot[scheme.in.name];
                for (let j = 0; j < functionValue0.length; j++) {
                    let operation = scheme.op.replaceAll(scheme.out.name, functionValue0[j] + '').replaceAll(scheme.in.name, functionValue1[j] + '');
                    if (linkIndex != 0) {
                        operation = operation.replaceAll("prevResult", prevResult[j] + '');
                    }
                    prevResult[j] = eval(operation); // TODO deal with security problem
                }
                linkIndex += 1;
            }
            this._physicalLayer.directAddMeshFunction(prevResult, this._knotSpecification.id);
        }
    }
    _getPickingArea(glContext, x, y, anchorX, anchorY) {
        if (!glContext.canvas || !(glContext.canvas instanceof HTMLCanvasElement)) {
            return {
                pixelAnchorX: 0,
                pixelAnchorY: 0,
                width: 0,
                height: 0
            };
        }
        // Converting mouse position in the CSS pixels display into pixel coordinate
        let pixelX = x * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelY = glContext.canvas.height - y * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        let pixelAnchorX = anchorX * glContext.canvas.width / glContext.canvas.clientWidth;
        let pixelAnchorY = glContext.canvas.height - anchorY * glContext.canvas.height / glContext.canvas.clientHeight - 1;
        let width = 0;
        let height = 0;
        if (pixelX - pixelAnchorX > 0 && pixelY - pixelAnchorY < 0) { //bottom right
            width = Math.abs(pixelX - pixelAnchorX);
            height = Math.abs(pixelY - pixelAnchorY);
            pixelAnchorY = pixelY; // shift the anchor point for the width and height be always positive
        }
        else if (pixelX - pixelAnchorX < 0 && pixelY - pixelAnchorY < 0) { //  bottom left
            width = Math.abs(pixelX - pixelAnchorX);
            height = Math.abs(pixelY - pixelAnchorY);
            pixelAnchorY = pixelY; // shift the anchor point for the width and height be always positive
            pixelAnchorX = pixelX; // shift the anchor point for the width and height be always positive
        }
        else if (pixelX - pixelAnchorX > 0 && pixelY - pixelAnchorY > 0) { // top right
            width = Math.abs(pixelX - pixelAnchorX);
            height = Math.abs(pixelY - pixelAnchorY);
        }
        else if (pixelX - pixelAnchorX < 0 && pixelY - pixelAnchorY > 0) { // top left
            width = Math.abs(pixelX - pixelAnchorX);
            height = Math.abs(pixelY - pixelAnchorY);
            pixelAnchorX = pixelX; // shift the anchor point for the width and height be always positive
        }
        return {
            pixelAnchorX: pixelAnchorX,
            pixelAnchorY: pixelAnchorY,
            width: width,
            height: height
        };
    }
    // handles map interaction with the knot
    async interact(glContext, eventName, cursorPosition = null, brushingPivot = null, eventObject = null) {
        if (!this._visible || !this._physicalLayer.supportInteraction(eventName)) {
            return;
        }
        let mapGrammar = this._grammarInterpreter.getMap();
        let interaction = '';
        for (let i = 0; i < mapGrammar.knots.length; i++) {
            if (mapGrammar.knots[i] == this._id) {
                interaction = mapGrammar.interactions[i];
                break;
            }
        }
        if (interaction == '') {
            return;
        }
        let plotsGrammar = this._grammarInterpreter.getPlots();
        let plotArrangements = [];
        for (const plot of plotsGrammar) {
            if (plot.knots.includes(this._id)) {
                plotArrangements.push(plot.arrangement);
            }
        }
        let embedFootInteraction = false;
        let highlightCellInteraction = false;
        let highlightBuildingInteraction = false;
        let embedSurfaceInteraction = false;
        let highlightTriangleObject = false;
        if (interaction == InteractionType.BRUSHING) {
            highlightCellInteraction = true;
            if (plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)) {
                embedSurfaceInteraction = true;
            }
        }
        if (interaction == InteractionType.PICKING) {
            if (plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED)) {
                embedFootInteraction = true;
            }
            if (plotArrangements.includes(PlotArrangementType.LINKED)) {
                highlightBuildingInteraction = true;
                highlightTriangleObject = true;
            }
            if (plotArrangements.length == 0) {
                highlightBuildingInteraction = true;
                highlightTriangleObject = true;
            }
        }
        // mouse down
        if (eventName == "left+ctrl" && cursorPosition != null) {
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.clearPicking();
                    if (highlightCellInteraction)
                        shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }
        if (eventName == 'right-alt') {
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.clearPicking();
                }
            }
            this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, null, null, true); // letting plots manager know that this knot was interacted with
        }
        // mouse move
        if (eventName == "left+drag+alt-brushing" && cursorPosition != null && highlightCellInteraction) {
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }
        if (eventName == "left+drag+alt+brushing" && cursorPosition != null && brushingPivot != null) {
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], brushingPivot[0], brushingPivot[1]);
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.updatePickPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }
        if (eventName == "left+drag-alt+brushing" || eventName == "-drag-alt+brushing") {
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking) {
                    shader.applyBrushing();
                }
            }
        }
        if (eventName == "right+drag-brushingFilter" && cursorPosition != null) {
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], cursorPosition[0], cursorPosition[1]);
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.updatePickFilterPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }
        if (eventName == "right+drag+brushingFilter" && cursorPosition != null && brushingPivot != null) {
            let result = this._getPickingArea(glContext, cursorPosition[0], cursorPosition[1], brushingPivot[0], brushingPivot[1]);
            for (const shader of this._shaders) {
                if (shader instanceof ShaderPicking || shader instanceof ShaderPickingTriangles) {
                    shader.updatePickFilterPosition(result.pixelAnchorX, result.pixelAnchorY, result.width, result.height);
                }
            }
        }
        // mouse wheel
        if (eventName == "wheel+alt" && cursorPosition != null && embedFootInteraction) {
            if (this._physicalLayer instanceof BuildingsLayer) { // TODO: generalize this
                this._physicalLayer.createFootprintPlot(this._map.glContext, cursorPosition[0], cursorPosition[1], true, this._shaders);
                this._map.render(); // TODO: get rid of the need to render the map
                await this._physicalLayer.updateFootprintPlot(this._map.glContext, this._map.grammarManager, -1, eventObject.deltaY * 0.02, 'vega', this._shaders);
            }
        }
        if (eventName == "Enter" && highlightCellInteraction && embedSurfaceInteraction) {
            if (this._physicalLayer instanceof BuildingsLayer) { // TODO: generalize this
                await this._physicalLayer.applyTexSelectedCells(this._map.glContext, this._map.grammarManager, 'vega', this._shaders);
            }
        }
        if (eventName == "r") {
            if (this._physicalLayer instanceof BuildingsLayer) { // TODO: generalize this
                this._physicalLayer.clearAbsSurface(this._shaders);
            }
        }
        // keyUp
        if (eventName == "t") {
            if (highlightTriangleObject) {
                //triangles layer interactions
                if (this._physicalLayer instanceof TrianglesLayer) { // TODO: generalize this
                    let currentPoint = this._map.mouse.currentPoint;
                    this._physicalLayer.highlightElement(this._map.glContext, currentPoint[0], currentPoint[1], this._shaders);
                }
                this._map.render();
                this._map.render();
                if (this._physicalLayer instanceof TrianglesLayer) { // TODO: generalize this
                    let objectId = this._physicalLayer.getIdLastHighlightedElement(this._shaders);
                    this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, LevelType.OBJECTS, objectId); // letting plots manager know that this knot was interacted with
                }
            }
            if (embedFootInteraction && cursorPosition != null) { // TODO: simplify this footprint plot application
                if (this._physicalLayer instanceof BuildingsLayer) {
                    this._physicalLayer.createFootprintPlot(this._map.glContext, cursorPosition[0], cursorPosition[1], false, this._shaders);
                    this._map.render();
                    await this._physicalLayer.applyFootprintPlot(this._map.glContext, this._map.grammarManager, 1, 'vega', this._shaders);
                }
                this._map.render();
            }
            if (highlightBuildingInteraction && cursorPosition != null) {
                // call functions to highlight building
                if (this._physicalLayer instanceof BuildingsLayer) {
                    this._physicalLayer.highlightBuilding(this._map.glContext, cursorPosition[0], cursorPosition[1], this._shaders);
                }
                // the two renderings are required
                this._map.render();
                this._map.render();
                if (this._physicalLayer instanceof BuildingsLayer) {
                    let buildingId = this._physicalLayer.getIdLastHighlightedBuilding(this._shaders);
                    this._map.updateGrammarPlotsHighlight(this._physicalLayer.id, LevelType.OBJECTS, buildingId); // letting plots manager know that this knot was interacted with
                }
            }
        }
        this._map.render();
    }
}

class KnotManager {
    _knots = [];
    _updateStatusCallback;
    constructor(updateStatusCallback) {
        this._updateStatusCallback = updateStatusCallback;
    }
    get knots() {
        return this._knots;
    }
    createKnot(id, physicalLayer, knotSpecification, grammarInterpreter, viewId, visible, map) {
        let knot = new Knot(id, physicalLayer, knotSpecification, grammarInterpreter, viewId, visible, map);
        this._knots.push(knot);
        this.toggleKnot(""); // just to update the knots in the view
        return knot;
    }
    toggleKnot(id, value = null) {
        let knotVisibility = {};
        for (const knot of this._knots) {
            if (knot.id == id) {
                if (value != null) {
                    knot.visible = value;
                }
                else {
                    knot.visible = !knot.visible;
                }
            }
            knotVisibility[knot.id] = knot.visible;
        }
        this._updateStatusCallback("knotVisibility", knotVisibility);
    }
    getKnotById(knotId) {
        for (const knot of this._knots) {
            if (knot.id == knotId) {
                return knot;
            }
        }
        return null;
    }
}

/// <reference types="@types/webgl2" />
class MapView {
    // Html div that will host the map
    _mapDiv;
    // Html canvas used to draw the map
    _canvas;
    // WebGL context of the canvas
    _glContext;
    // Layer manager object
    _layerManager;
    _knotManager;
    // Manages the view configuration loaded (including plots and its interactions)
    _grammarManager;
    _grammarInterpreter;
    _updateStatusCallback;
    // interaction variables
    _camera;
    // mouse events
    _mouse;
    // keyboard events
    _keyboard;
    _knotVisibilityMonitor;
    // private _mapViewData: IGrammar;
    _embeddedKnots;
    _linkedKnots;
    _viewId; // the view to which this map belongs
    resetMap(mapDiv, grammarInterpreter) {
        this._grammarInterpreter = grammarInterpreter;
    }
    get mouse() {
        return this._mouse;
    }
    /**
     * gets the map div
     */
    get div() {
        return this._mapDiv;
    }
    /**
     * gets the canvas element
     */
    get canvas() {
        return this._canvas;
    }
    /**
     * gets the opengl context
     */
    get glContext() {
        return this._glContext;
    }
    /**
     * gets the camera object
     */
    get camera() {
        return this._camera;
    }
    /**
     * gets the layers
     */
    get layerManager() {
        return this._layerManager;
    }
    get knotManager() {
        return this._knotManager;
    }
    get grammarManager() {
        return this._grammarManager;
    }
    /**
     * Map initialization function
     */
    async init(mapDivId, updateStatusCallback) {
        let mapDiv = document.getElementById(mapDivId);
        if (mapDiv == null) {
            return;
        }
        mapDiv.innerHTML = "";
        this._mapDiv = mapDiv;
        this._canvas = document.createElement('canvas');
        this._canvas.id = mapDiv.id + "_mapCanvas";
        this._canvas.className = "mapView";
        this._glContext = this._canvas.getContext('webgl2', { preserveDrawingBuffer: true, stencil: true }); // preserve drawing buffer is used to generate valid blobs for the cave
        this._mapDiv.appendChild(this._canvas);
        this._viewId = 0; // TODO: should change depending on in what view the map is
        this._updateStatusCallback = updateStatusCallback;
        this._layerManager = new LayerManager(this._updateStatusCallback, this);
        this._knotManager = new KnotManager(this._updateStatusCallback);
        if (this._knotVisibilityMonitor) {
            clearInterval(this._knotVisibilityMonitor);
        }
        // inits the mouse events
        this.initMouseEvents();
        // bind the window events
        this.initWindowEvents();
        // inits the keyboard events
        this.initKeyboardEvents();
        this.monitorKnotVisibility();
        await this.initCamera(this._grammarInterpreter.getCamera(this._viewId));
        // resizes the canvas
        this.resize();
        await this.initLayers();
        this.initKnots();
        let knotsGroups = {};
        for (const knot of this._knotManager.knots) {
            let knotSpecification = knot.knotSpecification;
            if (knotSpecification.group != undefined) {
                if (!(knotSpecification.group.group_name in knotsGroups)) {
                    knotsGroups[knotSpecification.group.group_name] = [{
                            id: knot.id,
                            position: knotSpecification.group.position
                        }];
                }
                else {
                    knotsGroups[knotSpecification.group.group_name].push({
                        id: knot.id,
                        position: knotSpecification.group.position
                    });
                }
            }
            else {
                knotsGroups[knot.id] = [knot.id]; // group of single knot
            }
        }
        for (const group of Object.keys(knotsGroups)) {
            if (knotsGroups[group].length > 1) {
                knotsGroups[group].sort((a, b) => { a.position - b.position; });
                let ids = [];
                for (const element of knotsGroups[group]) {
                    ids.push(element.id);
                }
                knotsGroups[group] = ids;
            }
        }
        this._updateStatusCallback("layersIds", knotsGroups);
        this.initGrammarManager(this._grammarInterpreter.getProcessedGrammar());
        if (this._grammarInterpreter.getFilterKnots(this._viewId) != undefined) {
            this._layerManager.filterBbox = this._grammarInterpreter.getFilterKnots(this._viewId);
        }
        else {
            this._layerManager.filterBbox = [];
        }
        this.render();
    }
    parsePlotsKnotData() {
        let plotsKnots = [];
        for (const plotAttributes of this._grammarInterpreter.getPlots(this._viewId)) {
            for (const knotId of plotAttributes.knots) {
                if (!plotsKnots.includes(knotId)) {
                    plotsKnots.push(knotId);
                }
            }
        }
        let plotsKnotData = [];
        for (const knotId of plotsKnots) {
            for (const knot of this._grammarInterpreter.getKnots(this._viewId)) {
                if (knotId == knot.id) {
                    let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);
                    let left_layer = this._layerManager.searchByLayerId(this._grammarInterpreter.getKnotOutputLayer(knot, this._viewId));
                    // let left_layer = this._layerManager.searchByLayerId(lastLink.out.name);
                    if (left_layer == null) {
                        throw Error("Layer not found while processing knot");
                    }
                    let elements = [];
                    if (lastLink.out.level == undefined) { // this is a pure knot
                        continue;
                    }
                    let coordinates = left_layer.getCoordsByLevel(lastLink.out.level);
                    let functionValues = left_layer.getFunctionByLevel(lastLink.out.level, knotId);
                    let knotStructure = this._knotManager.getKnotById(knotId);
                    let highlighted = left_layer.getHighlightsByLevel(lastLink.out.level, knotStructure.shaders);
                    let readCoords = 0;
                    let filtered = left_layer.mesh.filtered;
                    for (let i = 0; i < coordinates.length; i++) {
                        // if(elements.length >= 1000){ // preventing plot from having too many elements TODO: let the user know that plot is cropped
                        //     break;
                        // }
                        if (filtered.length == 0 || filtered[readCoords] == 1) {
                            elements.push({
                                coordinates: coordinates[i],
                                abstract: functionValues[i][0],
                                highlighted: highlighted[i],
                                index: i
                            });
                        }
                        readCoords += coordinates[i].length / left_layer.mesh.dimension;
                    }
                    let knotData = {
                        knotId: knotId,
                        elements: elements
                    };
                    plotsKnotData.push(knotData);
                }
            }
        }
        return plotsKnotData;
    }
    updateGrammarPlotsData() {
        let plotsKnotData = this.parsePlotsKnotData();
        this._grammarManager.updateGrammarPlotsData(plotsKnotData);
    }
    // if clear == true, elementIndex and level are ignored and all selections are deactivated
    updateGrammarPlotsHighlight(layerId, level, elementIndex, clear = false) {
        if (!clear) {
            let elements = {};
            for (const knot of this._grammarInterpreter.getKnots(this._viewId)) {
                let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);
                if (lastLink.out.name == layerId && lastLink.out.level == level) {
                    elements[knot.id] = elementIndex;
                }
            }
            this.grammarManager.setHighlightElementsLocally(elements, true, true);
        }
        else {
            let knotsToClear = [];
            for (const knot of this._grammarInterpreter.getKnots(this._viewId)) {
                let lastLink = this._grammarInterpreter.getKnotLastLink(knot, this._viewId);
                if (lastLink.out.name == layerId) {
                    knotsToClear.push(knot.id);
                }
            }
            this.grammarManager.clearHighlightsLocally(knotsToClear);
        }
    }
    initGrammarManager(grammar) {
        this._grammarManager = new GrammarManager(grammar, this._updateStatusCallback, this.parsePlotsKnotData(), { "function": this.setHighlightElement, "arg": this });
    }
    //TODO: not sure if mapview should contain this logic
    setHighlightElement(knotId, elementIndex, value, _this) {
        let knot = _this._grammarInterpreter.getKnotById(knotId, this._viewId);
        if (knot == undefined) {
            throw Error("Cannot highlight element knot not found");
        }
        let layerId = _this._grammarInterpreter.getKnotOutputLayer(knot, _this._viewId);
        let lastLink = _this._grammarInterpreter.getKnotLastLink(knot, _this._viewId);
        if (lastLink.out.level == undefined)
            return;
        let knotObject = _this.knotManager.getKnotById(knotId);
        let shaders = knotObject.shaders;
        // not sure if layer should be accessed directly or knot.ts be used
        for (const layer of _this._layerManager.layers) {
            if (layer.id == layerId) {
                layer.setHighlightElements([elementIndex], lastLink.out.level, value, shaders);
                break;
            }
        }
        _this.render();
    }
    toggleKnot(id, value = null) {
        this._knotManager.toggleKnot(id, value);
        this.render();
    }
    /**
     * Camera initialization function
     * @param {string | ICameraData} data Object containing the camera. If data is a string, then it loads data from disk.
     */
    async initCamera(camera) {
        // load the index file and its layers
        const params = typeof camera === 'string' ? await DataApi.getCameraParameters(camera) : camera;
        // sets the camera
        this._camera = CameraFactory.getInstance();
        this._camera.resetCamera(params.position, params.direction.up, params.direction.lookAt, params.direction.right, this._updateStatusCallback);
    }
    async initLayers() {
        let layers = [];
        let joinedList = [];
        let centroid = this.camera.getWorldOrigin();
        for (const knot of this._grammarInterpreter.getKnots(this._viewId)) {
            if (!knot.knotOp) {
                // load layers from knots if they dont already exist
                for (let i = 0; i < knot.integration_scheme.length; i++) {
                    let joined = false; // if the layers was joined with another layer
                    if (knot.integration_scheme[i].in != undefined && knot.integration_scheme[i].in.name != knot.integration_scheme[i].out) {
                        joined = true;
                    }
                    if (!layers.includes(knot.integration_scheme[i].out.name)) {
                        layers.push(knot.integration_scheme[i].out.name);
                        joinedList.push(joined);
                    }
                    else if (joined) {
                        joinedList[layers.indexOf(knot.integration_scheme[i].out.name)] = joined;
                    }
                }
            }
        }
        for (let i = 0; i < layers.length; i++) {
            let element = layers[i];
            // loads from file if not provided
            const layer = await DataApi.getLayer(element);
            // adds the new layer
            await this.addLayer(layer, centroid, joinedList[i]);
        }
    }
    /**
     * Add layer geometry and function
     */
    async addLayer(layerData, centroid, joined) {
        // gets the layer data if available
        const features = 'data' in layerData ? layerData.data : undefined;
        if (!features) {
            return;
        }
        // loads the layers data
        const layer = this._layerManager.createLayer(layerData, centroid, features);
        // not able to create the layer
        if (!layer) {
            return;
        }
        if (joined) {
            let joinedJson = await DataApi.getJoinedJson(layer.id);
            if (joinedJson)
                layer.setJoinedJson(joinedJson);
        }
        // render
        this.render();
    }
    initKnots() {
        let knotsMap = this._grammarInterpreter.getMap(this._viewId).knots;
        for (const knotGrammar of this._grammarInterpreter.getKnots(this._viewId)) {
            let layerId = this._grammarInterpreter.getKnotOutputLayer(knotGrammar, this._viewId);
            let layer = this._layerManager.searchByLayerId(layerId);
            let knot = this._knotManager.createKnot(knotGrammar.id, layer, knotGrammar, this._grammarInterpreter, this._viewId, knotsMap.includes(knotGrammar.id), this);
            knot.processThematicData(this._layerManager); // send thematic data to the mesh of the physical layer TODO: put this inside the constructor of Knot
            knot.loadShaders(this._glContext); // instantiate the shaders inside the knot TODO: put this inside the constructor of Knot
        }
    }
    /**
     * Inits the mouse events
     */
    initMouseEvents() {
        // creates the mouse events manager
        this._mouse = MouseEventsFactory.getInstance();
        this._mouse.setMap(this);
        // binds the mouse events
        this._mouse.bindEvents();
    }
    /**
     * Inits the mouse events
     */
    initKeyboardEvents() {
        // creates the mouse events manager
        this._keyboard = KeyEventsFactory.getInstance();
        this._keyboard.setMap(this);
    }
    /**
     * inits the window events
     */
    initWindowEvents() {
        // resize listener
        window.addEventListener('resize', () => {
            // resizes the canvas
            this.resize();
            this.render();
        });
    }
    setCamera(camera) {
        this._camera.setPosition(camera.position[0], camera.position[1]);
        this.render();
    }
    /**
     * Renders the map
     */
    render() {
        // no camera defined
        if (!this._camera) {
            return;
        }
        // sky definition
        const sky = MapStyle.getColor('sky').concat([1.0]);
        this._glContext.clearColor(sky[0], sky[1], sky[2], sky[3]);
        // tslint:disable-next-line:no-bitwise
        this._glContext.clear(this._glContext.COLOR_BUFFER_BIT | this._glContext.DEPTH_BUFFER_BIT);
        this._glContext.clearStencil(0);
        this._glContext.clear(this._glContext.STENCIL_BUFFER_BIT);
        // updates the camera
        this._camera.update();
        this._camera.loadPosition(JSON.stringify(this.camera));
        // // render the layers
        // for (const layer of this._layerManager.layers) {
        //     // skips based on visibility
        //     if (!layer.visible) { continue; }
        //     if(this._grammarInterpreter.evaluateLayerVisibility(layer.id, this._viewId)){
        //         // sends the camera
        //         layer.camera = this.camera;
        //         // render
        //         // layer.render(this._glContext);
        //     }
        // }
        for (const knot of this._knotManager.knots) {
            if (this._grammarInterpreter.evaluateKnotVisibility(knot, this._viewId)) {
                if (!knot.visible)
                    this._knotManager.toggleKnot(knot.id, true);
                knot.render(this._glContext, this.camera);
            }
            else {
                if (knot.visible)
                    this._knotManager.toggleKnot(knot.id, false);
            }
        }
    }
    monitorKnotVisibility() {
        let previousKnotVisibility = [];
        for (const knot of this._knotManager.knots) {
            previousKnotVisibility.push(knot.visible);
        }
        let _this = this;
        this._knotVisibilityMonitor = window.setInterval(function () {
            for (let i = 0; i < _this._knotManager.knots.length; i++) {
                let currentVisibility = _this._grammarInterpreter.evaluateKnotVisibility(_this._knotManager.knots[i], _this._viewId);
                // if visibility of some knot changed need to rerender the map
                if (previousKnotVisibility[i] != currentVisibility) {
                    previousKnotVisibility[i] = currentVisibility;
                    _this.render();
                }
            }
        }, 100);
    }
    /**
     * Resizes the html canvas
     */
    resize() {
        const targetWidth = this._mapDiv.clientWidth;
        const targetHeight = this._mapDiv.clientHeight;
        const value = Math.max(targetWidth, targetHeight);
        this._glContext.viewport(0, 0, value, value);
        this._canvas.width = targetWidth;
        this._canvas.height = targetHeight;
        // stores in the camera
        this._camera.setViewportResolution(targetWidth, targetHeight);
        for (const knot of this._knotManager.knots) {
            if (!knot.visible) {
                continue;
            }
            for (const shader of knot.shaders) {
                if (shader instanceof ShaderPicking) {
                    shader.resizeDirty = true;
                }
                if (shader instanceof ShaderPickingTriangles) {
                    shader.resizeDirty = true;
                }
            }
        }
    }
}
var MapViewFactory = (function () {
    var instance;
    return {
        getInstance: function (mapDiv, grammarInterpreter) {
            if (instance == null) {
                instance = new MapView();
            }
            instance.resetMap(mapDiv, grammarInterpreter);
            return instance;
        }
    };
})();

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
				var args = [null];
				args.push.apply(args, arguments);
				var Ctor = Function.bind.apply(f, args);
				return new Ctor();
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var createRoot;

var m$1 = require$$2;
if (process.env.NODE_ENV === 'production') {
  createRoot = m$1.createRoot;
  m$1.hydrateRoot;
} else {
  var i$1 = m$1.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  createRoot = function(c, o) {
    i$1.usingClientEntryPoint = true;
    try {
      return m$1.createRoot(c, o);
    } finally {
      i$1.usingClientEntryPoint = false;
    }
  };
}

var e,t,n,r$1,i,o,a,s,c,u,l,f,h,d,v,p,m,g,y,b,w,x,k,j,S,C,$,_,O,M,E,A,P,T,R,N,I,D,L,B,z,q,F,V,W,H,U,J,K,G,Q,Y,X,Z,ee,te,ne,re,ie,oe,ae,se,ce,ue,le,fe,he,de,ve,pe,me,ge,ye,be,we,xe,ke,je,Se,Ce,$e,_e,Oe,Me,Ee,Ae,Pe,Te,Re,Ne,Ie,De,Le,Be,ze,qe,Fe,Ve,We,He,Ue,Je,Ke,Ge,Qe,Ye,Xe,Ze,et,tt,nt,rt,it,ot,at,st,ct,ut,lt,ft,ht,dt,vt,pt,mt,gt,yt,bt,wt,xt,kt,jt,St,Ct,$t,_t,Ot,Mt,Et,At,Pt,Tt,Rt,Nt,It,Dt,Lt,Bt,zt,qt,Ft,Vt,Wt,Ht,Ut,Jt,Kt,Gt,Qt,Yt,Xt,Zt,en,tn,nn,rn,on,an,sn,cn,un,ln,fn,hn,dn,vn,pn,mn,gn,yn,bn,wn,xn,kn,jn,Sn,Cn,$n,_n,On,Mn,En,An,Pn,Tn,Rn,Nn,In,Dn,Ln,Bn,zn,qn,Fn,Vn,Wn,Hn,Un,Jn,Kn,Gn,Qn,Yn,Xn,Zn,er,tr,nr,rr,ir,or,ar,sr,cr,ur,lr,fr,hr,dr,vr,pr,mr,gr,yr,br,wr,xr,kr,jr,Sr,Cr,$r,_r,Or,Mr,Er,Ar,Pr,Tr,Rr,Nr,Ir,Dr,Lr,Br,zr,qr,Fr,Vr,Wr,Hr,Ur,Jr,Kr,Gr,Qr,Yr,Xr,Zr,ei,ti,ni,ri,ii,oi,ai,si,ci,ui,li,fi,hi,di,vi=["mainAxis","crossAxis","fallbackPlacements","fallbackStrategy","fallbackAxisSideDirection","flipAlignment"],pi=["mainAxis","crossAxis","limiter"];function mi(e){var t="function"==typeof Map?new Map:void 0;return mi=function(e){if(null===e||(n=e,-1===Function.toString.call(n).indexOf("[native code]")))return e;var n;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,r);}function r(){return gi(e,arguments,Li(this).constructor)}return r.prototype=Object.create(e.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),Ti(r,e)},mi(e)}function gi(e,t,n){return gi=Di()?Reflect.construct.bind():function(e,t,n){var r=[null];r.push.apply(r,t);var i=new(Function.bind.apply(e,r));return n&&Ti(i,n.prototype),i},gi.apply(null,arguments)}function yi(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function bi(e,t){if(null==e)return {};var n,r,i=function(e,t){if(null==e)return {};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n]);}return i}function wi(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=Wi(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,i=function(){};return {s:i,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,a=!0,s=!1;return {s:function(){n=n.call(e);},n:function(){var e=n.next();return a=e.done,e},e:function(e){s=!0,o=e;},f:function(){try{a||null==n.return||n.return();}finally{if(s)throw o}}}}function xi(){/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */xi=function(){return e};var e={},t=Object.prototype,n=t.hasOwnProperty,r=Object.defineProperty||function(e,t,n){e[t]=n.value;},i="function"==typeof Symbol?Symbol:{},o=i.iterator||"@@iterator",a=i.asyncIterator||"@@asyncIterator",s=i.toStringTag||"@@toStringTag";function c(e,t,n){return Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}),e[t]}try{c({},"");}catch(e){c=function(e,t,n){return e[t]=n};}function u(e,t,n,i){var o=t&&t.prototype instanceof h?t:h,a=Object.create(o.prototype),s=new C(i||[]);return r(a,"_invoke",{value:x(e,n,s)}),a}function l(e,t,n){try{return {type:"normal",arg:e.call(t,n)}}catch(e){return {type:"throw",arg:e}}}e.wrap=u;var f={};function h(){}function d(){}function v(){}var p={};c(p,o,(function(){return this}));var m=Object.getPrototypeOf,g=m&&m(m($([])));g&&g!==t&&n.call(g,o)&&(p=g);var y=v.prototype=h.prototype=Object.create(p);function b(e){["next","throw","return"].forEach((function(t){c(e,t,(function(e){return this._invoke(t,e)}));}));}function w(e,t){function i(r,o,a,s){var c=l(e[r],e,o);if("throw"!==c.type){var u=c.arg,f=u.value;return f&&"object"==Ji(f)&&n.call(f,"__await")?t.resolve(f.__await).then((function(e){i("next",e,a,s);}),(function(e){i("throw",e,a,s);})):t.resolve(f).then((function(e){u.value=e,a(u);}),(function(e){return i("throw",e,a,s)}))}s(c.arg);}var o;r(this,"_invoke",{value:function(e,n){function r(){return new t((function(t,r){i(e,n,t,r);}))}return o=o?o.then(r,r):r()}});}function x(e,t,n){var r="suspendedStart";return function(i,o){if("executing"===r)throw new Error("Generator is already running");if("completed"===r){if("throw"===i)throw o;return _()}for(n.method=i,n.arg=o;;){var a=n.delegate;if(a){var s=k(a,n);if(s){if(s===f)continue;return s}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if("suspendedStart"===r)throw r="completed",n.arg;n.dispatchException(n.arg);}else "return"===n.method&&n.abrupt("return",n.arg);r="executing";var c=l(e,t,n);if("normal"===c.type){if(r=n.done?"completed":"suspendedYield",c.arg===f)continue;return {value:c.arg,done:n.done}}"throw"===c.type&&(r="completed",n.method="throw",n.arg=c.arg);}}}function k(e,t){var n=t.method,r=e.iterator[n];if(void 0===r)return t.delegate=null,"throw"===n&&e.iterator.return&&(t.method="return",t.arg=void 0,k(e,t),"throw"===t.method)||"return"!==n&&(t.method="throw",t.arg=new TypeError("The iterator does not provide a '"+n+"' method")),f;var i=l(r,e.iterator,t.arg);if("throw"===i.type)return t.method="throw",t.arg=i.arg,t.delegate=null,f;var o=i.arg;return o?o.done?(t[e.resultName]=o.value,t.next=e.nextLoc,"return"!==t.method&&(t.method="next",t.arg=void 0),t.delegate=null,f):o:(t.method="throw",t.arg=new TypeError("iterator result is not an object"),t.delegate=null,f)}function j(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t);}function S(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t;}function C(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(j,this),this.reset(!0);}function $(e){if(e){var t=e[o];if(t)return t.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var r=-1,i=function t(){for(;++r<e.length;)if(n.call(e,r))return t.value=e[r],t.done=!1,t;return t.value=void 0,t.done=!0,t};return i.next=i}}return {next:_}}function _(){return {value:void 0,done:!0}}return d.prototype=v,r(y,"constructor",{value:v,configurable:!0}),r(v,"constructor",{value:d,configurable:!0}),d.displayName=c(v,s,"GeneratorFunction"),e.isGeneratorFunction=function(e){var t="function"==typeof e&&e.constructor;return !!t&&(t===d||"GeneratorFunction"===(t.displayName||t.name))},e.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,v):(e.__proto__=v,c(e,s,"GeneratorFunction")),e.prototype=Object.create(y),e},e.awrap=function(e){return {__await:e}},b(w.prototype),c(w.prototype,a,(function(){return this})),e.AsyncIterator=w,e.async=function(t,n,r,i,o){void 0===o&&(o=Promise);var a=new w(u(t,n,r,i),o);return e.isGeneratorFunction(n)?a:a.next().then((function(e){return e.done?e.value:a.next()}))},b(y),c(y,s,"Generator"),c(y,o,(function(){return this})),c(y,"toString",(function(){return "[object Generator]"})),e.keys=function(e){var t=Object(e),n=[];for(var r in t)n.push(r);return n.reverse(),function e(){for(;n.length;){var r=n.pop();if(r in t)return e.value=r,e.done=!1,e}return e.done=!0,e}},e.values=$,C.prototype={constructor:C,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(S),!e)for(var t in this)"t"===t.charAt(0)&&n.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=void 0);},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var t=this;function r(n,r){return a.type="throw",a.arg=e,t.next=n,r&&(t.method="next",t.arg=void 0),!!r}for(var i=this.tryEntries.length-1;i>=0;--i){var o=this.tryEntries[i],a=o.completion;if("root"===o.tryLoc)return r("end");if(o.tryLoc<=this.prev){var s=n.call(o,"catchLoc"),c=n.call(o,"finallyLoc");if(s&&c){if(this.prev<o.catchLoc)return r(o.catchLoc,!0);if(this.prev<o.finallyLoc)return r(o.finallyLoc)}else if(s){if(this.prev<o.catchLoc)return r(o.catchLoc,!0)}else {if(!c)throw new Error("try statement without catch or finally");if(this.prev<o.finallyLoc)return r(o.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;r>=0;--r){var i=this.tryEntries[r];if(i.tryLoc<=this.prev&&n.call(i,"finallyLoc")&&this.prev<i.finallyLoc){var o=i;break}}o&&("break"===e||"continue"===e)&&o.tryLoc<=t&&t<=o.finallyLoc&&(o=null);var a=o?o.completion:{};return a.type=e,a.arg=t,o?(this.method="next",this.next=o.finallyLoc,f):this.complete(a)},complete:function(e,t){if("throw"===e.type)throw e.arg;return "break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):"normal"===e.type&&t&&(this.next=t),f},finish:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var n=this.tryEntries[t];if(n.finallyLoc===e)return this.complete(n.completion,n.afterLoc),S(n),f}},catch:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var n=this.tryEntries[t];if(n.tryLoc===e){var r=n.completion;if("throw"===r.type){var i=r.arg;S(n);}return i}}throw new Error("illegal catch attempt")},delegateYield:function(e,t,n){return this.delegate={iterator:$(e),resultName:t,nextLoc:n},"next"===this.method&&(this.arg=void 0),f}},e}function ki(e,t,n,r,i,o,a){try{var s=e[o](a),c=s.value;}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(r,i);}function ji(e){return function(){var t=this,n=arguments;return new Promise((function(r,i){var o=e.apply(t,n);function a(e){ki(o,r,i,a,s,"next",e);}function s(e){ki(o,r,i,a,s,"throw",e);}a(void 0);}))}}function Si(e,t){return $i(e)||function(e,t){var n=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var r,i,o,a,s=[],c=!0,u=!1;try{if(o=(n=n.call(e)).next,0===t){if(Object(n)!==n)return;c=!1;}else for(;!(c=(r=o.call(n)).done)&&(s.push(r.value),s.length!==t);c=!0);}catch(e){u=!0,i=e;}finally{try{if(!c&&null!=n.return&&(a=n.return(),Object(a)!==a))return}finally{if(u)throw i}}return s}}(e,t)||Wi(e,t)||Ci()}function Ci(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function $i(e){if(Array.isArray(e))return e}function _i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function Oi(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?_i(Object(n),!0).forEach((function(t){Mi(e,t,n[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):_i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t));}));}return e}function Mi(e,t,n){return (t=Fi(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Ei(){return Ei="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(e,t,n){var r=Ai(e,t);if(r){var i=Object.getOwnPropertyDescriptor(r,t);return i.get?i.get.call(arguments.length<3?e:n):i.value}},Ei.apply(this,arguments)}function Ai(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=Li(e)););return e}function Pi(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&Ti(e,t);}function Ti(e,t){return Ti=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},Ti(e,t)}function Ri(e){var t=Di();return function(){var n,r=Li(e);if(t){var i=Li(this).constructor;n=Reflect.construct(r,arguments,i);}else n=r.apply(this,arguments);return Ni(this,n)}}function Ni(e,t){if(t&&("object"===Ji(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return Ii(e)}function Ii(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function Di(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return !1}}function Li(e){return Li=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},Li(e)}function Bi(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function zi(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,Fi(r.key),r);}}function qi(e,t,n){return t&&zi(e.prototype,t),n&&zi(e,n),Object.defineProperty(e,"prototype",{writable:!1}),e}function Fi(e){var t=function(e,t){if("object"!==Ji(e)||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,t||"default");if("object"!==Ji(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return ("string"===t?String:Number)(e)}(e,"string");return "symbol"===Ji(t)?t:String(t)}function Vi(e){return function(e){if(Array.isArray(e))return Ui(e)}(e)||Hi(e)||Wi(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Wi(e,t){if(e){if("string"==typeof e)return Ui(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Ui(e,t):void 0}}function Hi(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}function Ui(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function Ji(e){return Ji="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ji(e)}function Ki(){}var Gi=function(e){return e};function Qi(e,t){for(var n in t)e[n]=t[n];return e}function Yi(e){return e()}function Xi(){return Object.create(null)}function Zi(e){e.forEach(Yi);}function eo(e){return "function"==typeof e}function to(e,t){return e!=e?t==t:e!==t||e&&"object"===Ji(e)||"function"==typeof e}function no(e,t){return e!=e?t==t:e!==t}function ro(e,t,n,r){if(e){var i=io(e,t,n,r);return e[0](i)}}function io(e,t,n,r){return e[1]&&r?Qi(n.ctx.slice(),e[1](r(t))):n.ctx}function oo(e,t,n,r){if(e[2]&&r){var i=e[2](r(n));if(void 0===t.dirty)return i;if("object"===Ji(i)){for(var o=[],a=Math.max(t.dirty.length,i.length),s=0;s<a;s+=1)o[s]=t.dirty[s]|i[s];return o}return t.dirty|i}return t.dirty}function ao(e,t,n,r,i,o){if(i){var a=io(t,n,r,o);e.p(a,i);}}function so(e){if(e.ctx.length>32){for(var t=[],n=e.ctx.length/32,r=0;r<n;r++)t[r]=-1;return t}return -1}function co(e){var t={};for(var n in e)"$"!==n[0]&&(t[n]=e[n]);return t}function uo(e,t){var n={};for(var r in t=new Set(t),e)t.has(r)||"$"===r[0]||(n[r]=e[r]);return n}function lo(e){return null==e?"":e}function fo(e){return e&&eo(e.destroy)?e.destroy:Ki}var ho="undefined"!=typeof window,vo=ho?function(){return window.performance.now()}:function(){return Date.now()},po=ho?function(e){return requestAnimationFrame(e)}:Ki,mo=new Set;function go(e){mo.forEach((function(t){t.c(e)||(mo.delete(t),t.f());})),0!==mo.size&&po(go);}function yo(e,t){e.appendChild(t);}function bo(e,t,n){var r=wo(e);if(!r.getElementById(t)){var i=$o("style");i.id=t,i.textContent=n,ko(r,i);}}function wo(e){if(!e)return document;var t=e.getRootNode?e.getRootNode():e.ownerDocument;return t&&t.host?t:e.ownerDocument}function xo(e){var t=$o("style");return ko(wo(e),t),t.sheet}function ko(e,t){return yo(e.head||e,t),t.sheet}function jo(e,t,n){e.insertBefore(t,n||null);}function So(e){e.parentNode&&e.parentNode.removeChild(e);}function Co(e,t){for(var n=0;n<e.length;n+=1)e[n]&&e[n].d(t);}function $o(e){return document.createElement(e)}function _o(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}function Oo(e){return document.createTextNode(e)}function Mo(){return Oo(" ")}function Eo(){return Oo("")}function Ao(e,t,n,r){return e.addEventListener(t,n,r),function(){return e.removeEventListener(t,n,r)}}function Po(e){return function(t){return t.preventDefault(),e.call(this,t)}}function To(e){return function(t){return t.stopPropagation(),e.call(this,t)}}function Ro(e,t,n){null==n?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n);}function No(e,t){var n=Object.getOwnPropertyDescriptors(e.__proto__);for(var r in t)null==t[r]?e.removeAttribute(r):"style"===r?e.style.cssText=t[r]:"__value"===r?e.value=e[r]=t[r]:n[r]&&n[r].set?e[r]=t[r]:Ro(e,r,t[r]);}function Io(e,t){for(var n in t)Ro(e,n,t[n]);}function Do(e){return Array.from(e.childNodes)}function Lo(e,t){t=""+t,e.data!==t&&(e.data=t);}function Bo(e,t){e.value=null==t?"":t;}function zo(e,t,n,r){null===n?e.style.removeProperty(t):e.style.setProperty(t,n,r?"important":"");}function qo(e,t,n){for(var r=0;r<e.options.length;r+=1){var i=e.options[r];if(i.__value===t)return void(i.selected=!0)}n&&void 0===t||(e.selectedIndex=-1);}function Fo(e,t,n){e.classList[n?"add":"remove"](t);}function Vo(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=n.bubbles,i=void 0!==r&&r,o=n.cancelable,a=void 0!==o&&o,s=document.createEvent("CustomEvent");return s.initCustomEvent(e,i,a,t),s}function Wo(e,t){return new e(t)}var Ho,Uo=new Map,Jo=0;function Ko(e){for(var t=5381,n=e.length;n--;)t=(t<<5)-t^e.charCodeAt(n);return t>>>0}function Go(e,t){var n={stylesheet:xo(t),rules:{}};return Uo.set(e,n),n}function Qo(e,t,n,r,i,o,a){for(var s=arguments.length>7&&void 0!==arguments[7]?arguments[7]:0,c=16.666/r,u="{\n",l=0;l<=1;l+=c){var f=t+(n-t)*o(l);u+=100*l+"%{".concat(a(f,1-f),"}\n");}var h=u+"100% {".concat(a(n,1-n),"}\n}"),d="__svelte_".concat(Ko(h),"_").concat(s),v=wo(e),p=Uo.get(v)||Go(v,e),m=p.stylesheet,g=p.rules;g[d]||(g[d]=!0,m.insertRule("@keyframes ".concat(d," ").concat(h),m.cssRules.length));var y=e.style.animation||"";return e.style.animation="".concat(y?"".concat(y,", "):"").concat(d," ").concat(r,"ms linear ").concat(i,"ms 1 both"),Jo+=1,d}function Yo(e,t){var n=(e.style.animation||"").split(", "),r=n.filter(t?function(e){return e.indexOf(t)<0}:function(e){return -1===e.indexOf("__svelte")}),i=n.length-r.length;i&&(e.style.animation=r.join(", "),(Jo-=i)||po((function(){Jo||(Uo.forEach((function(e){var t=e.stylesheet.ownerNode;t&&So(t);})),Uo.clear());})));}function Xo(e){Ho=e;}function Zo(){if(!Ho)throw new Error("Function called outside component initialization");return Ho}function ea(e){Zo().$$.on_mount.push(e);}function ta(e){Zo().$$.on_destroy.push(e);}function na(){var e=Zo();return function(t,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},i=r.cancelable,o=void 0!==i&&i,a=e.$$.callbacks[t];if(a){var s=Vo(t,n,{cancelable:o});return a.slice().forEach((function(t){t.call(e,s);})),!s.defaultPrevented}return !0}}function ra(e,t){return Zo().$$.context.set(e,t),t}function ia(e){return Zo().$$.context.get(e)}function oa(e,t){var n=this,r=e.$$.callbacks[t.type];r&&r.slice().forEach((function(e){return e.call(n,t)}));}var aa=[],sa=[],ca=[],ua=[],la=Promise.resolve(),fa=!1;function ha(){fa||(fa=!0,la.then(ba));}function da(){return ha(),la}function va(e){ca.push(e);}function pa(e){ua.push(e);}var ma,ga=new Set,ya=0;function ba(){if(0===ya){var e=Ho;do{try{for(;ya<aa.length;){var t=aa[ya];ya++,Xo(t),wa(t.$$);}}catch(e){throw aa.length=0,ya=0,e}for(Xo(null),aa.length=0,ya=0;sa.length;)sa.pop()();for(var n=0;n<ca.length;n+=1){var r=ca[n];ga.has(r)||(ga.add(r),r());}ca.length=0;}while(aa.length);for(;ua.length;)ua.pop()();fa=!1,ga.clear(),Xo(e);}}function wa(e){if(null!==e.fragment){e.update(),Zi(e.before_update);var t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(va);}}function xa(e,t,n){e.dispatchEvent(Vo("".concat(t?"intro":"outro").concat(n)));}var ka,ja=new Set;function Sa(){ka={r:0,c:[],p:ka};}function Ca(){ka.r||Zi(ka.c),ka=ka.p;}function $a(e,t){e&&e.i&&(ja.delete(e),e.i(t));}function _a(e,t,n,r){if(e&&e.o){if(ja.has(e))return;ja.add(e),ka.c.push((function(){ja.delete(e),r&&(n&&e.d(1),r());})),e.o(t);}else r&&r();}var Oa={duration:0};function Ma(e,t,n,r){var i={direction:"both"},o=t(e,n,i),a=r?0:1,s=null,c=null,u=null;function l(){u&&Yo(e,u);}function f(e,t){var n=e.b-a;return t*=Math.abs(n),{a:a,b:e.b,d:n,duration:t,start:e.start,end:e.start+t,group:e.group}}function h(t){var n,r=o||Oa,i=r.delay,h=void 0===i?0:i,d=r.duration,v=void 0===d?300:d,p=r.easing,m=void 0===p?Gi:p,g=r.tick,y=void 0===g?Ki:g,b=r.css,w={start:vo()+h,b:t};t||(w.group=ka,ka.r+=1),s||c?c=w:(b&&(l(),u=Qo(e,a,t,v,h,m,b)),t&&y(0,1),s=f(w,v),va((function(){return xa(e,t,"start")})),n=function(t){if(c&&t>c.start&&(s=f(c,v),c=null,xa(e,s.b,"start"),b&&(l(),u=Qo(e,a,s.b,s.duration,0,m,o.css))),s)if(t>=s.end)y(a=s.b,1-a),xa(e,s.b,"end"),c||(s.b?l():--s.group.r||Zi(s.group.c)),s=null;else if(t>=s.start){var n=t-s.start;a=s.a+s.d*m(n/s.duration),y(a,1-a);}return !(!s&&!c)},0===mo.size&&po(go),new Promise((function(e){mo.add({c:n,f:e});})));}return {run:function(e){eo(o)?(ma||(ma=Promise.resolve()).then((function(){ma=null;})),ma).then((function(){o=o(i),h(e);})):h(e);},end:function(){l(),s=c=null;}}}var Ea="undefined"!=typeof window?window:"undefined"!=typeof globalThis?globalThis:global;function Aa(e,t){e.d(1),t.delete(e.key);}function Pa(e,t){_a(e,1,1,(function(){t.delete(e.key);}));}function Ta(e,t,n,r,i,o,a,s,c,u,l,f){for(var h=e.length,d=o.length,v=h,p={};v--;)p[e[v].key]=v;var m=[],g=new Map,y=new Map,b=[];v=d;for(var w=function(){var e=f(i,o,v),s=n(e),c=a.get(s);c?r&&b.push((function(){return c.p(e,t)})):(c=u(s,e)).c(),g.set(s,m[v]=c),s in p&&y.set(s,Math.abs(v-p[s]));};v--;)w();var x=new Set,k=new Set;function j(e){$a(e,1),e.m(s,l),a.set(e.key,e),l=e.first,d--;}for(;h&&d;){var S=m[d-1],C=e[h-1],$=S.key,_=C.key;S===C?(l=S.first,h--,d--):g.has(_)?!a.has($)||x.has($)?j(S):k.has(_)?h--:y.get($)>y.get(_)?(k.add($),j(S)):(x.add(_),h--):(c(C,a),h--);}for(;h--;){var O=e[h];g.has(O.key)||c(O,a);}for(;d;)j(m[d-1]);return Zi(b),m}function Ra(e,t){for(var n={},r={},i={$$scope:1},o=e.length;o--;){var a=e[o],s=t[o];if(s){for(var c in a)c in s||(r[c]=1);for(var u in s)i[u]||(n[u]=s[u],i[u]=1);e[o]=s;}else for(var l in a)i[l]=1;}for(var f in r)f in n||(n[f]=void 0);return n}function Na(e){return "object"===Ji(e)&&null!==e?e:{}}function Ia(e,t,n){var r=e.$$.props[t];void 0!==r&&(e.$$.bound[r]=n,n(e.$$.ctx[r]));}function Da(e){e&&e.c();}function La(e,t,n,r){var i=e.$$,o=i.fragment,a=i.after_update;o&&o.m(t,n),r||va((function(){var t,n=e.$$.on_mount.map(Yi).filter(eo);e.$$.on_destroy?(t=e.$$.on_destroy).push.apply(t,Vi(n)):Zi(n);e.$$.on_mount=[];})),a.forEach(va);}function Ba(e,t){var n,r,i,o=e.$$;null!==o.fragment&&(n=o.after_update,r=[],i=[],ca.forEach((function(e){return -1===n.indexOf(e)?r.push(e):i.push(e)})),i.forEach((function(e){return e()})),ca=r,Zi(o.on_destroy),o.fragment&&o.fragment.d(t),o.on_destroy=o.fragment=null,o.ctx=[]);}function za(e,t){-1===e.$$.dirty[0]&&(aa.push(e),ha(),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31;}function qa(e,t,n,r,i,o,a){var s=arguments.length>7&&void 0!==arguments[7]?arguments[7]:[-1],c=Ho;Xo(e);var u=e.$$={fragment:null,ctx:[],props:o,update:Ki,not_equal:i,bound:Xi(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(t.context||(c?c.$$.context:[])),callbacks:Xi(),dirty:s,skip_bound:!1,root:t.target||c.$$.root};a&&a(u.root);var l=!1;if(u.ctx=n?n(e,t.props||{},(function(t,n){var r=!(arguments.length<=2)&&arguments.length-2?arguments.length<=2?void 0:arguments[2]:n;return u.ctx&&i(u.ctx[t],u.ctx[t]=r)&&(!u.skip_bound&&u.bound[t]&&u.bound[t](r),l&&za(e,t)),n})):[],u.update(),l=!0,Zi(u.before_update),u.fragment=!!r&&r(u.ctx),t.target){if(t.hydrate){var f=Do(t.target);u.fragment&&u.fragment.l(f),f.forEach(So);}else u.fragment&&u.fragment.c();t.intro&&$a(e.$$.fragment),La(e,t.target,t.anchor,t.customElement),ba();}Xo(c);}new Set([].concat(["allowfullscreen","allowpaymentrequest","async","autofocus","autoplay","checked","controls","default","defer","disabled","formnovalidate","hidden","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","selected"]));var Fa=function(){function e(){Bi(this,e);}return qi(e,[{key:"$destroy",value:function(){Ba(this,1),this.$destroy=Ki;}},{key:"$on",value:function(e,t){if(!eo(t))return Ki;var n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),function(){var e=n.indexOf(t);-1!==e&&n.splice(e,1);}}},{key:"$set",value:function(e){var t;this.$$set&&(t=e,0!==Object.keys(t).length)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1);}}]),e}(),Va=function(e){Pi(n,Fa);var t=Ri(n);function n(e){if(Bi(this,n),!e||!e.target&&!e.$$inline)throw new Error("'target' is a required option");return t.call(this)}return qi(n,[{key:"$destroy",value:function(){Ei(Li(n.prototype),"$destroy",this).call(this),this.$destroy=function(){console.warn("Component was already destroyed");};}},{key:"$capture_state",value:function(){}},{key:"$inject_state",value:function(){}}]),n}();(function(e){Pi(n,Va);var t=Ri(n);function n(e){return Bi(this,n),t.call(this,e)}return qi(n)})();function Ha(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:!!Ja("debug");if(t){var n=Ka(e);return function(){for(var t,r=arguments.length,i=new Array(r),o=0;o<r;o++)i[o]=arguments[o];(t=console).log.apply(t,["%c".concat(e),"color:".concat(n)].concat(i));}}return Ua}function Ua(){}function Ja(e){try{if("undefined"!=typeof window&&void 0!==window.localStorage)return window.localStorage[e]}catch(e){}}function Ka(e){for(var t=0,n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t|=0;return Ga[Math.abs(t)%Ga.length]}var Ga=["#0000CC","#0099FF","#009400","#8dd200","#CCCC00","#CC9933","#ae04e7","#ff35d7","#FF3333","#FF6600","#FF9933","#FFCC33"];function Qa(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.delay,r=void 0===n?0:n,i=t.duration,o=void 0===i?400:i,a=t.easing,s=void 0===a?Gi:a,c=+getComputedStyle(e).opacity;return {delay:r,duration:o,easing:s,css:function(e){return "opacity: ".concat(e*c)}}}var Ya=Ea.window;function Xa(e){bo(e,"svelte-n7cvum",".svelte-n7cvum{box-sizing:border-box}.bg.svelte-n7cvum{position:fixed;z-index:1000;top:0;left:0;display:flex;flex-direction:column;justify-content:center;width:100vw;height:100vh;background:rgba(0, 0, 0, 0.66)}@supports (-webkit-touch-callout: none){}.wrap.svelte-n7cvum{position:relative;margin:2rem;max-height:100%}.window.svelte-n7cvum{position:relative;width:40rem;max-width:100%;max-height:100%;margin:2rem auto;color:black;border-radius:0.5rem;background:white}.content.svelte-n7cvum{position:relative;padding:1rem;max-height:calc(100vh - 4rem);overflow:auto}.close.svelte-n7cvum{display:block;box-sizing:border-box;position:absolute;z-index:1000;top:1rem;right:1rem;margin:0;padding:0;width:1.5rem;height:1.5rem;border:0;color:black;border-radius:1.5rem;background:white;box-shadow:0 0 0 1px black;transition:transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),\n      background 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);-webkit-appearance:none}.close.svelte-n7cvum:before,.close.svelte-n7cvum:after{content:'';display:block;box-sizing:border-box;position:absolute;top:50%;width:1rem;height:1px;background:black;transform-origin:center;transition:height 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),\n      background 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)}.close.svelte-n7cvum:before{-webkit-transform:translate(0, -50%) rotate(45deg);-moz-transform:translate(0, -50%) rotate(45deg);transform:translate(0, -50%) rotate(45deg);left:0.25rem}.close.svelte-n7cvum:after{-webkit-transform:translate(0, -50%) rotate(-45deg);-moz-transform:translate(0, -50%) rotate(-45deg);transform:translate(0, -50%) rotate(-45deg);left:0.25rem}.close.svelte-n7cvum:hover{background:black}.close.svelte-n7cvum:hover:before,.close.svelte-n7cvum:hover:after{height:2px;background:white}.close.svelte-n7cvum:focus{border-color:#3399ff;box-shadow:0 0 0 2px #3399ff}.close.svelte-n7cvum:active{transform:scale(0.9)}.close.svelte-n7cvum:hover,.close.svelte-n7cvum:focus,.close.svelte-n7cvum:active{outline:none}");}function Za(e){var t,n,r,i,o,a,s,c,u,l,f,h,d,v,p,m,g,y,b=e[1].closeButton&&es(e),w=e[2];return w&&(a=Wo(w,{})),{c:function(){t=$o("div"),n=$o("div"),r=$o("div"),b&&b.c(),i=Mo(),o=$o("div"),a&&Da(a.$$.fragment),Ro(o,"class",s=lo(e[1].classContent)+" svelte-n7cvum"),Ro(o,"style",e[9]),Fo(o,"content",!e[0]),Ro(r,"class",c=lo(e[1].classWindow)+" svelte-n7cvum"),Ro(r,"role","dialog"),Ro(r,"aria-modal","true"),Ro(r,"aria-label",u=e[1].ariaLabelledBy?null:e[1].ariaLabel||null),Ro(r,"aria-labelledby",l=e[1].ariaLabelledBy||null),Ro(r,"style",e[8]),Fo(r,"window",!e[0]),Ro(n,"class",h=lo(e[1].classWindowWrap)+" svelte-n7cvum"),Ro(n,"style",e[7]),Fo(n,"wrap",!e[0]),Ro(t,"id",d=e[1].id),Ro(t,"class",v=lo(e[1].classBg)+" svelte-n7cvum"),Ro(t,"style",e[6]),Fo(t,"bg",!e[0]);},m:function(s,c){jo(s,t,c),yo(t,n),yo(n,r),b&&b.m(r,null),yo(r,i),yo(r,o),a&&La(a,o,null),e[50](r),e[51](n),e[52](t),m=!0,g||(y=[Ao(r,"introstart",(function(){eo(e[13])&&e[13].apply(this,arguments);})),Ao(r,"outrostart",(function(){eo(e[14])&&e[14].apply(this,arguments);})),Ao(r,"introend",(function(){eo(e[15])&&e[15].apply(this,arguments);})),Ao(r,"outroend",(function(){eo(e[16])&&e[16].apply(this,arguments);})),Ao(t,"mousedown",e[20]),Ao(t,"mouseup",e[21])],g=!0);},p:function(f,p){if((e=f)[1].closeButton?b?(b.p(e,p),2&p[0]&&$a(b,1)):((b=es(e)).c(),$a(b,1),b.m(r,i)):b&&(Sa(),_a(b,1,1,(function(){b=null;})),Ca()),4&p[0]&&w!==(w=e[2])){if(a){Sa();var g=a;_a(g.$$.fragment,1,0,(function(){Ba(g,1);})),Ca();}w?(Da((a=Wo(w,{})).$$.fragment),$a(a.$$.fragment,1),La(a,o,null)):a=null;}(!m||2&p[0]&&s!==(s=lo(e[1].classContent)+" svelte-n7cvum"))&&Ro(o,"class",s),(!m||512&p[0])&&Ro(o,"style",e[9]),(!m||3&p[0])&&Fo(o,"content",!e[0]),(!m||2&p[0]&&c!==(c=lo(e[1].classWindow)+" svelte-n7cvum"))&&Ro(r,"class",c),(!m||2&p[0]&&u!==(u=e[1].ariaLabelledBy?null:e[1].ariaLabel||null))&&Ro(r,"aria-label",u),(!m||2&p[0]&&l!==(l=e[1].ariaLabelledBy||null))&&Ro(r,"aria-labelledby",l),(!m||256&p[0])&&Ro(r,"style",e[8]),(!m||3&p[0])&&Fo(r,"window",!e[0]),(!m||2&p[0]&&h!==(h=lo(e[1].classWindowWrap)+" svelte-n7cvum"))&&Ro(n,"class",h),(!m||128&p[0])&&Ro(n,"style",e[7]),(!m||3&p[0])&&Fo(n,"wrap",!e[0]),(!m||2&p[0]&&d!==(d=e[1].id))&&Ro(t,"id",d),(!m||2&p[0]&&v!==(v=lo(e[1].classBg)+" svelte-n7cvum"))&&Ro(t,"class",v),(!m||64&p[0])&&Ro(t,"style",e[6]),(!m||3&p[0])&&Fo(t,"bg",!e[0]);},i:function(n){m||($a(b),a&&$a(a.$$.fragment,n),va((function(){m&&(f||(f=Ma(r,e[12],e[1].transitionWindowProps,!0)),f.run(1));})),va((function(){m&&(p||(p=Ma(t,e[11],e[1].transitionBgProps,!0)),p.run(1));})),m=!0);},o:function(n){_a(b),a&&_a(a.$$.fragment,n),f||(f=Ma(r,e[12],e[1].transitionWindowProps,!1)),f.run(0),p||(p=Ma(t,e[11],e[1].transitionBgProps,!1)),p.run(0),m=!1;},d:function(n){n&&So(t),b&&b.d(),a&&Ba(a),e[50](null),n&&f&&f.end(),e[51](null),e[52](null),n&&p&&p.end(),g=!1,Zi(y);}}}function es(e){var t,n,r,i,o,a=[ns,ts],s=[];function c(e,n){return 2&n[0]&&(t=null),null==t&&(t=!!e[17](e[1].closeButton)),t?0:1}return n=c(e,[-1,-1,-1]),r=s[n]=a[n](e),{c:function(){r.c(),i=Eo();},m:function(e,t){s[n].m(e,t),jo(e,i,t),o=!0;},p:function(e,t){var o=n;(n=c(e,t))===o?s[n].p(e,t):(Sa(),_a(s[o],1,1,(function(){s[o]=null;})),Ca(),(r=s[n])?r.p(e,t):(r=s[n]=a[n](e)).c(),$a(r,1),r.m(i.parentNode,i));},i:function(e){o||($a(r),o=!0);},o:function(e){_a(r),o=!1;},d:function(e){s[n].d(e),e&&So(i);}}}function ts(e){var t,n,r,i;return {c:function(){Ro(t=$o("button"),"class",n=lo(e[1].classCloseButton)+" svelte-n7cvum"),Ro(t,"aria-label","Close modal"),Ro(t,"style",e[10]),Ro(t,"type","button"),Fo(t,"close",!e[0]);},m:function(n,o){jo(n,t,o),r||(i=Ao(t,"click",e[18]),r=!0);},p:function(e,r){2&r[0]&&n!==(n=lo(e[1].classCloseButton)+" svelte-n7cvum")&&Ro(t,"class",n),1024&r[0]&&Ro(t,"style",e[10]),3&r[0]&&Fo(t,"close",!e[0]);},i:Ki,o:Ki,d:function(e){e&&So(t),r=!1,i();}}}function ns(e){var t,n,r,i=e[1].closeButton;function o(e){return {props:{onClose:e[18]}}}return i&&(t=Wo(i,o(e))),{c:function(){t&&Da(t.$$.fragment),n=Eo();},m:function(e,i){t&&La(t,e,i),jo(e,n,i),r=!0;},p:function(e,r){if(2&r[0]&&i!==(i=e[1].closeButton)){if(t){Sa();var a=t;_a(a.$$.fragment,1,0,(function(){Ba(a,1);})),Ca();}i?(Da((t=Wo(i,o(e))).$$.fragment),$a(t.$$.fragment,1),La(t,n.parentNode,n)):t=null;}},i:function(e){r||(t&&$a(t.$$.fragment,e),r=!0);},o:function(e){t&&_a(t.$$.fragment,e),r=!1;},d:function(e){e&&So(n),t&&Ba(t,e);}}}function rs(e){var t,n,r,i,o=e[2]&&Za(e),a=e[49].default,s=ro(a,e,e[48],null);return {c:function(){o&&o.c(),t=Mo(),s&&s.c();},m:function(a,c){o&&o.m(a,c),jo(a,t,c),s&&s.m(a,c),n=!0,r||(i=Ao(Ya,"keydown",e[19]),r=!0);},p:function(e,r){e[2]?o?(o.p(e,r),4&r[0]&&$a(o,1)):((o=Za(e)).c(),$a(o,1),o.m(t.parentNode,t)):o&&(Sa(),_a(o,1,1,(function(){o=null;})),Ca()),s&&s.p&&(!n||131072&r[1])&&ao(s,a,e,e[48],n?oo(a,e[48],r,null):so(e[48]),null);},i:function(e){n||($a(o),$a(s,e),n=!0);},o:function(e){_a(o),_a(s,e),n=!1;},d:function(e){o&&o.d(e),e&&So(t),s&&s.d(e),r=!1,i();}}}function is(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return function(n){return new e(Oi(Oi({},n),{},{props:Oi(Oi({},t),n.props)}))}}function os(e,t,n){var r,i,o,a,s,c,u,l,f,h,d,v,p,m,g,y=t.$$slots,b=void 0===y?{}:y,w=t.$$scope,x=na(),k=ra,j=t.isTabbable,S=void 0===j?function(e){return e.tabIndex>=0&&!e.hidden&&!e.disabled&&"none"!==e.style.display&&"hidden"!==e.type&&Boolean(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}:j,C=t.show,$=void 0===C?null:C,_=t.id,O=void 0===_?null:_,M=t.key,E=void 0===M?"simple-modal":M,A=t.ariaLabel,P=void 0===A?null:A,T=t.ariaLabelledBy,R=void 0===T?null:T,N=t.closeButton,I=void 0===N||N,D=t.closeOnEsc,L=void 0===D||D,B=t.closeOnOuterClick,z=void 0===B||B,q=t.styleBg,F=void 0===q?{}:q,V=t.styleWindowWrap,W=void 0===V?{}:V,H=t.styleWindow,U=void 0===H?{}:H,J=t.styleContent,K=void 0===J?{}:J,G=t.styleCloseButton,Q=void 0===G?{}:G,Y=t.classBg,X=void 0===Y?null:Y,Z=t.classWindowWrap,ee=void 0===Z?null:Z,te=t.classWindow,ne=void 0===te?null:te,re=t.classContent,ie=void 0===re?null:re,oe=t.classCloseButton,ae=void 0===oe?null:oe,se=t.unstyled,ce=void 0!==se&&se,ue=t.setContext,le=void 0===ue?k:ue,fe=t.transitionBg,he=void 0===fe?Qa:fe,de=t.transitionBgProps,ve=void 0===de?{duration:250}:de,pe=t.transitionWindow,me=void 0===pe?he:pe,ge=t.transitionWindowProps,ye=void 0===ge?ve:ge,be=t.disableFocusTrap,we=void 0!==be&&be,xe={id:O,ariaLabel:P,ariaLabelledBy:R,closeButton:I,closeOnEsc:L,closeOnOuterClick:z,styleBg:F,styleWindowWrap:W,styleWindow:U,styleContent:K,styleCloseButton:Q,classBg:X,classWindowWrap:ee,classWindow:ne,classContent:ie,classCloseButton:ae,transitionBg:he,transitionBgProps:ve,transitionWindow:me,transitionWindowProps:ye,disableFocusTrap:we,isTabbable:S,unstyled:ce},ke=Oi({},xe),je=null,Se=function(e){return e?Object.keys(e).reduce((function(t,n){return "".concat(t,"; ").concat(function(e){return e.replace(/([a-zA-Z])(?=[A-Z])/g,"$1-").toLowerCase()}(n),": ").concat(e[n])}),""):""},Ce=function(e){return !!(e&&e.constructor&&e.call&&e.apply)},$e=function(){n(6,s=Se(Object.assign({},{width:window.innerWidth,height:window.innerHeight},ke.styleBg))),n(7,c=Se(ke.styleWindowWrap)),n(8,u=Se(ke.styleWindow)),n(9,l=Se(ke.styleContent)),n(10,f=Se(ke.styleCloseButton)),n(11,h=ke.transitionBg),n(12,d=ke.transitionWindow);},_e=function(){},Oe=_e,Me=_e,Ee=_e,Ae=_e,Pe=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},i=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{};n(2,je=is(e,t)),n(1,ke=Oi(Oi({},xe),r)),$e(),Re(),n(13,Oe=function(e){i.onOpen&&i.onOpen(e),x("open"),x("opening");}),n(14,Me=function(e){i.onClose&&i.onClose(e),x("close"),x("closing");}),n(15,Ee=function(e){i.onOpened&&i.onOpened(e),x("opened");}),n(16,Ae=function(e){i.onClosed&&i.onClosed(e),x("closed");});},Te=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};je&&(n(14,Me=e.onClose||Me),n(16,Ae=e.onClosed||Ae),n(2,je=null),Ne());},Re=function(){a=window.scrollY,v=document.body.style.position,p=document.body.style.overflow,m=document.body.style.width,document.body.style.position="fixed",document.body.style.top="-".concat(a,"px"),document.body.style.overflow="hidden",document.body.style.width="100%";},Ne=function(){document.body.style.position=v||"",document.body.style.top="",document.body.style.overflow=p||"",document.body.style.width=m||"",window.scrollTo({top:a,left:0,behavior:"instant"});};le(E,{open:Pe,close:Te});var Ie=!1;return ta((function(){Ie&&Te();})),ea((function(){n(47,Ie=!0);})),e.$$set=function(e){"isTabbable"in e&&n(22,S=e.isTabbable),"show"in e&&n(23,$=e.show),"id"in e&&n(24,O=e.id),"key"in e&&n(25,E=e.key),"ariaLabel"in e&&n(26,P=e.ariaLabel),"ariaLabelledBy"in e&&n(27,R=e.ariaLabelledBy),"closeButton"in e&&n(28,I=e.closeButton),"closeOnEsc"in e&&n(29,L=e.closeOnEsc),"closeOnOuterClick"in e&&n(30,z=e.closeOnOuterClick),"styleBg"in e&&n(31,F=e.styleBg),"styleWindowWrap"in e&&n(32,W=e.styleWindowWrap),"styleWindow"in e&&n(33,U=e.styleWindow),"styleContent"in e&&n(34,K=e.styleContent),"styleCloseButton"in e&&n(35,Q=e.styleCloseButton),"classBg"in e&&n(36,X=e.classBg),"classWindowWrap"in e&&n(37,ee=e.classWindowWrap),"classWindow"in e&&n(38,ne=e.classWindow),"classContent"in e&&n(39,ie=e.classContent),"classCloseButton"in e&&n(40,ae=e.classCloseButton),"unstyled"in e&&n(0,ce=e.unstyled),"setContext"in e&&n(41,le=e.setContext),"transitionBg"in e&&n(42,he=e.transitionBg),"transitionBgProps"in e&&n(43,ve=e.transitionBgProps),"transitionWindow"in e&&n(44,me=e.transitionWindow),"transitionWindowProps"in e&&n(45,ye=e.transitionWindowProps),"disableFocusTrap"in e&&n(46,we=e.disableFocusTrap),"$$scope"in e&&n(48,w=e.$$scope);},e.$$.update=function(){8388608&e.$$.dirty[0]|65536&e.$$.dirty[1]&&Ie&&(Ce($)?Pe($):Te());},[ce,ke,je,r,i,o,s,c,u,l,f,h,d,Oe,Me,Ee,Ae,Ce,Te,function(e){if(ke.closeOnEsc&&je&&"Escape"===e.key&&(e.preventDefault(),Te()),je&&"Tab"===e.key&&!ke.disableFocusTrap){var t=o.querySelectorAll("*"),n=Array.from(t).filter(ke.isTabbable).sort((function(e,t){return e.tabIndex-t.tabIndex})),r=n.indexOf(document.activeElement);-1===r&&e.shiftKey&&(r=0),r+=n.length+(e.shiftKey?-1:1),n[r%=n.length].focus(),e.preventDefault();}},function(e){!ke.closeOnOuterClick||e.target!==r&&e.target!==i||(g=e.target);},function(e){ke.closeOnOuterClick&&e.target===g&&(e.preventDefault(),Te());},S,$,O,E,P,R,I,L,z,F,W,U,K,Q,X,ee,ne,ie,ae,le,he,ve,me,ye,we,Ie,w,b,function(e){sa[e?"unshift":"push"]((function(){n(5,o=e);}));},function(e){sa[e?"unshift":"push"]((function(){n(4,i=e);}));},function(e){sa[e?"unshift":"push"]((function(){n(3,r=e);}));}]}var as,ss,cs,us,ls,fs,hs=function(e){Pi(n,Fa);var t=Ri(n);function n(e){var r;return Bi(this,n),qa(Ii(r=t.call(this)),e,os,rs,to,{isTabbable:22,show:23,id:24,key:25,ariaLabel:26,ariaLabelledBy:27,closeButton:28,closeOnEsc:29,closeOnOuterClick:30,styleBg:31,styleWindowWrap:32,styleWindow:33,styleContent:34,styleCloseButton:35,classBg:36,classWindowWrap:37,classWindow:38,classContent:39,classCloseButton:40,unstyled:0,setContext:41,transitionBg:42,transitionBgProps:43,transitionWindow:44,transitionWindowProps:45,disableFocusTrap:46},Xa,[-1,-1,-1]),r}return qi(n)}();!function(e){e.text="text",e.tree="tree",e.table="table";}(as||(as={})),function(e){e.after="after",e.inside="inside",e.key="key",e.value="value",e.multi="multi";}(ss||(ss={})),function(e){e.after="after",e.key="key",e.value="value",e.inside="inside";}(cs||(cs={})),function(e){e.info="info",e.warning="warning",e.error="error";}(us||(us={})),function(e){e.key="key",e.value="value";}(ls||(ls={})),function(e){e.asc="asc",e.desc="desc";}(fs||(fs={}));var ds=[{start:0,end:100}],vs={closeButton:!1,classBg:"jse-modal-bg",classWindow:"jse-modal-window",classWindowWrap:"jse-modal-window-wrap",classContent:"jse-modal-content"},ps=Oi(Oi({},vs),{},{classWindow:"jse-modal-window jse-modal-window-sort"}),ms=Oi(Oi({},vs),{},{classWindow:"jse-modal-window jse-modal-window-transform"}),gs=Oi(Oi({},vs),{},{classWindow:"jse-modal-window jse-modal-window-jsoneditor"}),ys="Insert or paste contents, enter [ insert a new array, enter { to insert a new object, or start typing to insert a new value",bs="Open context menu (Click here, right click on the selection, or use the context menu button or Ctrl+Q)",ws="NO",xs="SELF",ks="NEXT_INSIDE",js=(Mi(e={},fs.asc,"ascending"),Mi(e,fs.desc,"descending"),e),Ss=0;function Cs(){return ++Ss}function $s(e){return $s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},$s(e)}function _s(e){return Array.isArray(e)}function Os(e){return null!==e&&"object"===$s(e)&&e.constructor===Object}function Ms(e){return !(!e||"object"!==$s(e))&&"add"===e.op}function Es(e){return !(!e||"object"!==$s(e))&&"remove"===e.op}function As(e){return !(!e||"object"!==$s(e))&&"replace"===e.op}function Ps(e){return !(!e||"object"!==$s(e))&&"copy"===e.op}function Ts(e){return !(!e||"object"!==$s(e))&&"move"===e.op}function Rs(e){return Rs="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Rs(e)}function Ns(e,t){return e===t}function Is(e){return e.slice(0,e.length-1)}function Ds(e){return "object"===Rs(e)&&null!==e}function Ls(e){return Ls="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ls(e)}function Bs(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function zs(e,t,n){return (t=function(e){var t=function(e,t){if("object"!==Ls(e)||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,t||"default");if("object"!==Ls(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return ("string"===t?String:Number)(e)}(e,"string");return "symbol"===Ls(t)?t:String(t)}(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function qs(e){if(_s(e)){var t=e.slice();return Object.getOwnPropertySymbols(e).forEach((function(n){t[n]=e[n];})),t}if(Os(e)){var n=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?Bs(Object(n),!0).forEach((function(t){zs(e,t,n[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Bs(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t));}));}return e}({},e);return Object.getOwnPropertySymbols(e).forEach((function(t){n[t]=e[t];})),n}return e}function Fs(e,t,n){if(e[t]===n)return e;var r=qs(e);return r[t]=n,r}function Vs(e,t){for(var n=e,r=0;r<t.length;)n=Os(n)?n[t[r]]:_s(n)?n[parseInt(t[r])]:void 0,r++;return n}function Ws(e,t,n){var r=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(0===t.length)return n;var i=t[0],o=Ws(e?e[i]:void 0,t.slice(1),n,r);if(Os(e)||_s(e))return Fs(e,i,o);if(r){var a=Hs.test(i)?[]:{};return a[i]=o,a}throw new Error("Path does not exist")}var Hs=/^\d+$/;function Us(e,t,n){if(0===t.length)return n(e);if(!Ds(e))throw new Error("Path doesn't exist");var r=t[0];return Fs(e,r,Us(e[r],t.slice(1),n))}function Js(e,t){if(0===t.length)return e;if(!Ds(e))throw new Error("Path does not exist");if(1===t.length){var n=t[0];if(n in e){var r=qs(e);return _s(r)&&r.splice(parseInt(n),1),Os(r)&&delete r[n],r}return e}var i=t[0];return Fs(e,i,Js(e[i],t.slice(1)))}function Ks(e,t,n){var r=t.slice(0,t.length-1),i=t[t.length-1];return Us(e,r,(function(e){if(!Array.isArray(e))throw new TypeError("Array expected at path "+JSON.stringify(r));var t=qs(e);return t.splice(parseInt(i),0,n),t}))}function Gs(e,t){return void 0!==e&&(0===t.length||null!==e&&Gs(e[t[0]],t.slice(1)))}function Qs(e){var t=e.split("/");return t.shift(),t.map((function(e){return e.replace(/~1/g,"/").replace(/~0/g,"~")}))}function Ys(e){return e.map(Xs).join("")}function Xs(e){return "/"+String(e).replace(/~/g,"~0").replace(/\//g,"~1")}function Zs(e,t){return e+Xs(t)}function ec(e,t){return e.startsWith(t)&&(e.length===t.length||"/"===e[t.length])}function tc(e,t,n){for(var r=e,i=0;i<t.length;i++){uc(t[i]);var o=t[i];if(n&&n.before){var a=n.before(r,o);if(void 0!==a){if(void 0!==a.document&&(r=a.document),void 0!==a.json)throw new Error('Deprecation warning: returned object property ".json" has been renamed to ".document"');void 0!==a.operation&&(o=a.operation);}}var s=r,c=lc(r,o.path);if("add"===o.op)r=ic(r,c,o.value);else if("remove"===o.op)r=rc(r,c);else if("replace"===o.op)r=nc(r,c,o.value);else if("copy"===o.op)r=oc(r,c,fc(o.from));else if("move"===o.op)r=ac(r,c,fc(o.from));else {if("test"!==o.op)throw new Error("Unknown JSONPatch operation "+JSON.stringify(o));sc(r,c,o.value);}if(n&&n.after){var u=n.after(r,o,s);void 0!==u&&(r=u);}}return r}function nc(e,t,n){return Ws(e,t,n)}function rc(e,t){return Js(e,t)}function ic(e,t,n){return cc(e,t)?Ks(e,t,n):Ws(e,t,n)}function oc(e,t,n){var r=Vs(e,n);return cc(e,t)?Ks(e,t,r):Ws(e,t,Vs(e,n))}function ac(e,t,n){var r=Vs(e,n),i=Js(e,n);return cc(i,t)?Ks(i,t,r):Ws(i,t,r)}function sc(e,t,n){if(void 0===n)throw new Error('Test failed: no value provided (path: "'.concat(Ys(t),'")'));if(!Gs(e,t))throw new Error('Test failed: path not found (path: "'.concat(Ys(t),'")'));if(!function(e,t){return JSON.stringify(e)===JSON.stringify(t)}(Vs(e,t),n))throw new Error('Test failed, value differs (path: "'.concat(Ys(t),'")'))}function cc(e,t){if(0===t.length)return !1;var n=Vs(e,Is(t));return Array.isArray(n)}function uc(e){if(!["add","remove","replace","copy","move","test"].includes(e.op))throw new Error("Unknown JSONPatch op "+JSON.stringify(e.op));if("string"!=typeof e.path)throw new Error('Required property "path" missing or not a string in operation '+JSON.stringify(e));if(("copy"===e.op||"move"===e.op)&&"string"!=typeof e.from)throw new Error('Required property "from" missing or not a string in operation '+JSON.stringify(e))}function lc(e,t){return function(e,t){if("-"!==function(e){return e[e.length-1]}(t))return t;var n=Is(t),r=Vs(e,n);return n.concat(r.length)}(e,Qs(t))}function fc(e){return Qs(e)}function hc(e){return function(e){if(Array.isArray(e))return dc(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(!e)return;if("string"==typeof e)return dc(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(e);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return dc(e,t)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function dc(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function vc(e,t,n){var r=[];return tc(e,t,{before:function(e,t){var i,o,a=lc(e,t.path);if("add"===t.op)i=gc(e,a);else if("remove"===t.op)i=mc(e,a);else if("replace"===t.op)i=pc(e,a);else if("copy"===t.op)i=function(e,t){return gc(e,t)}(e,a);else if("move"===t.op)i=function(e,t,n){if(t.length<n.length&&function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:Ns;if(e.length<t.length)return !1;for(var r=0;r<t.length;r++)if(!n(e[r],t[r]))return !1;return !0}(n,t))return [{op:"replace",path:Ys(t),value:e}];var r={op:"move",from:Ys(t),path:Ys(n)};return !cc(e,t)&&Gs(e,t)?[r].concat(hc(mc(e,t))):[r]}(e,a,fc(t.from));else {if("test"!==t.op)throw new Error("Unknown JSONPatch operation "+JSON.stringify(t));i=[];}if(n&&n.before){var s=n.before(e,t,i);if(s&&s.revertOperations&&(i=s.revertOperations),s&&s.document&&(o=s.document),s&&s.json)throw new Error('Deprecation warning: returned object property ".json" has been renamed to ".document"')}if(r=i.concat(r),void 0!==o)return {document:o}}}),r}function pc(e,t){return [{op:"replace",path:Ys(t),value:Vs(e,t)}]}function mc(e,t){return [{op:"add",path:Ys(t),value:Vs(e,t)}]}function gc(e,t){return cc(e,t)||!Gs(e,t)?[{op:"remove",path:Ys(t)}]:pc(e,t)}function yc(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var bc={},wc={b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",'"':'"',"/":"/","\\":"\\"},xc="a".charCodeAt();bc.parse=function(e,t,n){var r={},i=0,o=0,a=0,s=n&&n.bigint&&"undefined"!=typeof BigInt;return {data:c("",!0),pointers:r};function c(t,n){var r;u(),m(t,"value");var i=h();switch(i){case"t":f("rue"),r=!0;break;case"f":f("alse"),r=!1;break;case"n":f("ull"),r=null;break;case'"':r=l();break;case"[":r=function(e){u();var t=[],n=0;if("]"==h())return t;d();for(;;){var r=e+"/"+n;t.push(c(r)),u();var i=h();if("]"==i)break;","!=i&&w(),u(),n++;}return t}(t);break;case"{":r=function(e){u();var t={};if("}"==h())return t;d();for(;;){var n=y();'"'!=h()&&w();var r=l(),i=e+"/"+Tc(r);g(i,"key",n),m(i,"keyEnd"),u(),":"!=h()&&w(),u(),t[r]=c(i),u();var o=h();if("}"==o)break;","!=o&&w(),u();}return t}(t);break;default:d(),"-0123456789".indexOf(i)>=0?r=function(){var t="",n=!0;"-"==e[a]&&(t+=h());t+="0"==e[a]?h():p(),"."==e[a]&&(t+=h()+p(),n=!1);"e"!=e[a]&&"E"!=e[a]||(t+=h(),"+"!=e[a]&&"-"!=e[a]||(t+=h()),t+=p(),n=!1);var r=+t;return s&&n&&(r>Number.MAX_SAFE_INTEGER||r<Number.MIN_SAFE_INTEGER)?BigInt(t):r}():b();}return m(t,"valueEnd"),u(),n&&a<e.length&&b(),r}function u(){e:for(;a<e.length;){switch(e[a]){case" ":o++;break;case"\t":o+=4;break;case"\r":o=0;break;case"\n":o=0,i++;break;default:break e}a++;}}function l(){for(var e,t="";'"'!=(e=h());)"\\"==e?(e=h())in wc?t+=wc[e]:"u"==e?t+=v():w():t+=e;return t}function f(e){for(var t=0;t<e.length;t++)h()!==e[t]&&w();}function h(){x();var t=e[a];return a++,o++,t}function d(){a--,o--;}function v(){for(var e=4,t=0;e--;){t<<=4;var n=h().toLowerCase();n>="a"&&n<="f"?t+=n.charCodeAt()-xc+10:n>="0"&&n<="9"?t+=+n:w();}return String.fromCharCode(t)}function p(){for(var t="";e[a]>="0"&&e[a]<="9";)t+=h();if(t.length)return t;x(),b();}function m(e,t){g(e,t,y());}function g(e,t,n){r[e]=r[e]||{},r[e][t]=n;}function y(){return {line:i,column:o,pos:a}}function b(){throw new SyntaxError("Unexpected token "+e[a]+" in JSON at position "+a)}function w(){d(),b();}function x(){if(a>=e.length)throw new SyntaxError("Unexpected end of JSON input")}},bc.stringify=function(e,t,n){if(jc(e)){var r,i,o=0,a="object"==Ji(n)?n.space:n;switch(Ji(a)){case"number":var s=a>10?10:a<0?0:Math.floor(a);a=s&&y(s," "),r=s,i=s;break;case"string":a=a.slice(0,10),r=0,i=0;for(var c=0;c<a.length;c++){switch(a[c]){case" ":i++;break;case"\t":i+=4;break;case"\r":i=0;break;case"\n":i=0,o++;break;default:throw new Error("whitespace characters not allowed in JSON")}r++;}break;default:a=void 0;}var u="",l={},f=0,h=0,d=0,v=n&&n.es6&&"function"==typeof Map;return function e(t,n,r){switch(g(r,"value"),Ji(t)){case"number":case"bigint":case"boolean":p(""+t);break;case"string":p(Ec(t));break;case"object":null===t?p("null"):"function"==typeof t.toJSON?p(Ec(t.toJSON())):Array.isArray(t)?i():v?t.constructor.BYTES_PER_ELEMENT?i():t instanceof Map?s():t instanceof Set?s(!0):o():o();}function i(){if(t.length){p("[");for(var i=n+1,o=0;o<t.length;o++){o&&p(","),m(i);var a=jc(t[o])?t[o]:null;e(a,i,r+"/"+o);}m(n),p("]");}else p("[]");}function o(){var i=Object.keys(t);if(i.length){p("{");for(var o=n+1,s=0;s<i.length;s++){var c=i[s],u=t[c];if(jc(u)){s&&p(",");var l=r+"/"+Tc(c);m(o),g(l,"key"),p(Ec(c)),g(l,"keyEnd"),p(":"),a&&p(" "),e(u,o,l);}}m(n),p("}");}else p("{}");}function s(i){if(t.size){p("{");for(var o=n+1,s=!0,c=t.entries(),u=c.next();!u.done;){var l=u.value,f=l[0],h=!!i||l[1];if(jc(h)){s||p(","),s=!1;var d=r+"/"+Tc(f);m(o),g(d,"key"),p(Ec(f)),g(d,"keyEnd"),p(":"),a&&p(" "),e(h,o,d);}u=c.next();}m(n),p("}");}else p("{}");}g(r,"valueEnd");}(e,0,""),{json:u,pointers:l}}function p(e){h+=e.length,d+=e.length,u+=e;}function m(e){if(a){for(u+="\n"+y(e,a),f++,h=0;e--;)o?(f+=o,h=i):h+=i,d+=r;d+=1;}}function g(e,t){l[e]=l[e]||{},l[e][t]={line:f,column:h,pos:d};}function y(e,t){return Array(e+1).join(t)}};var kc=["number","bigint","boolean","string","object"];function jc(e){return kc.indexOf(Ji(e))>=0}var Sc=/"|\\/g,Cc=/[\b]/g,$c=/\f/g,_c=/\n/g,Oc=/\r/g,Mc=/\t/g;function Ec(e){return '"'+(e=e.replace(Sc,"\\$&").replace($c,"\\f").replace(Cc,"\\b").replace(_c,"\\n").replace(Oc,"\\r").replace(Mc,"\\t"))+'"'}var Ac=/~/g,Pc=/\//g;function Tc(e){return e.replace(Ac,"~0").replace(Pc,"~1")}function Rc(e){return Rc="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Rc(e)}function Ic(e,t){if(t&&("object"===Rc(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Dc(e){var t="function"==typeof Map?new Map:void 0;return Dc=function(e){if(null===e||(n=e,-1===Function.toString.call(n).indexOf("[native code]")))return e;var n;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,r);}function r(){return Lc(e,arguments,qc(this).constructor)}return r.prototype=Object.create(e.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),zc(r,e)},Dc(e)}function Lc(e,t,n){return Lc=Bc()?Reflect.construct.bind():function(e,t,n){var r=[null];r.push.apply(r,t);var i=new(Function.bind.apply(e,r));return n&&zc(i,n.prototype),i},Lc.apply(null,arguments)}function Bc(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return !1}}function zc(e,t){return zc=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},zc(e,t)}function qc(e){return qc=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},qc(e)}var Fc=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&zc(e,t);}(s,Dc(Error));var t,n,r,a=(t=s,n=Bc(),function(){var e,r=qc(t);if(n){var i=qc(this).constructor;e=Reflect.construct(r,arguments,i);}else e=r.apply(this,arguments);return Ic(this,e)});function s(e,t){var n;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,s),(n=a.call(this,e+" at position "+t)).position=t,n}return r=s,Object.defineProperty(r,"prototype",{writable:!1}),r}();function Vc(e){return e>=48&&e<=57||e>=65&&e<=70||e>=97&&e<=102}function Wc(e){return e>=48&&e<=57}function Hc(e){return e>=32&&e<=1114111}var Uc=/^[,:[\]{}()\n]$/;function Jc(e){return Kc.test(e)||e&&Xc(e.charCodeAt(0))}var Kc=/^[[{\w-]$/;function Gc(e){return 10===e||13===e||9===e||8===e||12===e}function Qc(e){return 32===e||10===e||9===e||13===e}function Yc(e){return 160===e||e>=8192&&e<=8202||8239===e||8287===e||12288===e}function Xc(e){return Zc(e)||tu(e)}function Zc(e){return 34===e||8220===e||8221===e}function eu(e){return 34===e}function tu(e){return 39===e||8216===e||8217===e||96===e||180===e}function nu(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=e.lastIndexOf(t);return -1!==r?e.substring(0,r)+(n?"":e.substring(r+1)):e}function ru(e,t){var n=e.length;if(!Qc(e.charCodeAt(n-1)))return e+t;for(;Qc(e.charCodeAt(n-1));)n--;return e.substring(0,n)+t+e.substring(n)}function iu(e,t,n){return e.substring(0,t)+e.substring(t+n)}var ou={"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"},au={'"':'"',"\\":"\\","/":"/",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"};function su(e){var t=0,n="";i()||function(){throw new Fc("Unexpected end of json string",e.length)}();var r=c(44);if(r&&o(),Jc(e[t])&&function(e){return /[,\n][ \t\r]*$/.test(e)}(n)?(r||(n=ru(n,",")),function(){var e=!0,t=!0;for(;t;){if(e)e=!1;else c(44)||(n=ru(n,","));t=i();}t||(n=nu(n,","));n="[\n".concat(n,"\n]");}()):r&&(n=nu(n,",")),t>=e.length)return n;function i(){o();var r=function(){if(123===e.charCodeAt(t)){n+="{",t++,o();for(var r=!0;t<e.length&&125!==e.charCodeAt(t);){if(r?(r=!1):(c(44)||(n=ru(n,",")),o()),!(l()||h())){125===e.charCodeAt(t)||123===e.charCodeAt(t)||93===e.charCodeAt(t)||91===e.charCodeAt(t)||void 0===e[t]?n=nu(n,","):m();break}o();var a=c(58);a||(Jc(e[t])?n=ru(n,":"):y()),i()||(a?g():y());}return 125===e.charCodeAt(t)?(n+="}",t++):n=ru(n,"}"),!0}return !1}()||function(){if(91===e.charCodeAt(t)){n+="[",t++,o();for(var r=!0;t<e.length&&93!==e.charCodeAt(t);){if(r)r=!1;else c(44)||(n=ru(n,","));if(!i()){n=nu(n,",");break}}return 93===e.charCodeAt(t)?(n+="]",t++):n=ru(n,"]"),!0}return !1}()||l()||function(){var r=t;if(45===e.charCodeAt(t)&&(t++,v(r)))return !0;if(48===e.charCodeAt(t))t++;else if(function(e){return e>=49&&e<=57}(e.charCodeAt(t)))for(t++;Wc(e.charCodeAt(t));)t++;if(46===e.charCodeAt(t)){if(t++,v(r))return !0;for(;Wc(e.charCodeAt(t));)t++;}if(101===e.charCodeAt(t)||69===e.charCodeAt(t)){if(t++,45!==e.charCodeAt(t)&&43!==e.charCodeAt(t)||t++,v(r))return !0;for(;Wc(e.charCodeAt(t));)t++;}if(t>r)return n+=e.slice(r,t),!0;return !1}()||f("true","true")||f("false","false")||f("null","null")||f("True","true")||f("False","false")||f("None","null")||h();return o(),r}function o(){var e=t,n=a();do{(n=s())&&(n=a());}while(n);return t>e}function a(){for(var r,i="";(r=Qc(e.charCodeAt(t)))||Yc(e.charCodeAt(t));)i+=r?e[t]:" ",t++;return i.length>0&&(n+=i,!0)}function s(){if(47===e.charCodeAt(t)&&42===e.charCodeAt(t+1)){for(;t<e.length&&!cu(e,t);)t++;return t+=2,!0}if(47===e.charCodeAt(t)&&47===e.charCodeAt(t+1)){for(;t<e.length&&10!==e.charCodeAt(t);)t++;return !0}return !1}function c(r){return e.charCodeAt(t)===r&&(n+=e[t],t++,!0)}function u(){return function(n){return e.charCodeAt(t)===n&&(t++,!0)}(92)}function l(){var r=92===e.charCodeAt(t);if(r&&(t++,r=!0),Xc(e.charCodeAt(t))){var i=tu(e.charCodeAt(t))?tu:eu(e.charCodeAt(t))?eu:Zc;for(n+='"',t++;t<e.length&&!i(e.charCodeAt(t));){if(92===e.charCodeAt(t)){var a=e[t+1];void 0!==au[a]?(n+=e.slice(t,t+2),t+=2):"u"===a?Vc(e.charCodeAt(t+2))&&Vc(e.charCodeAt(t+3))&&Vc(e.charCodeAt(t+4))&&Vc(e.charCodeAt(t+5))?(n+=e.slice(t,t+6),t+=6):b(t):(n+=a,t+=2);}else {var s=e[t],c=e.charCodeAt(t);34===c&&92!==e.charCodeAt(t-1)?(n+="\\"+s,t++):Gc(c)?(n+=ou[s],t++):(Hc(c)||p(s),n+=s,t++);}r&&u();}return Xc(e.charCodeAt(t))?(e.charCodeAt(t),n+='"',t++):n+='"',function(){o();for(;43===e.charCodeAt(t);){t++,o();var i=(n=nu(n,'"',!0)).length;l(),n=iu(n,i,1);}}(),!0}return !1}function f(r,i){return e.slice(t,t+r.length)===r&&(n+=i,t+=r.length,!0)}function h(){for(var r,o=t;t<e.length&&(r=e[t],!(Uc.test(r)||r&&Xc(r.charCodeAt(0))));)t++;if(t>o){if(40===e.charCodeAt(t))return t++,i(),41===e.charCodeAt(t)&&(t++,59===e.charCodeAt(t)&&t++),!0;for(;Qc(e.charCodeAt(t-1))&&t>0;)t--;var a=e.slice(o,t);return n+=JSON.stringify(a),!0}}function d(n){if(!Wc(e.charCodeAt(t))){var r=e.slice(n,t);throw new Fc("Invalid number '".concat(r,"', expecting a digit ").concat(e[t]?"but got '".concat(e[t],"'"):"but reached end of input"),2)}}function v(r){return t>=e.length?(n+=e.slice(r,t)+"0",!0):(d(r),!1)}function p(e){throw new Fc("Invalid character "+JSON.stringify(e),t)}function m(){throw new Fc("Object key expected",t)}function g(){throw new Fc("Object value expected",t)}function y(){throw new Fc("Colon expected",t)}function b(n){for(var r=n+2;/\w/.test(e[r]);)r++;var i=e.slice(n,r);throw new Fc('Invalid unicode character "'.concat(i,'"'),t)}!function(){throw new Fc("Unexpected character "+JSON.stringify(e[t]),t)}();}function cu(e,t){return "*"===e[t]&&"/"===e[t+1]}function uu(e){return parseInt(e,10)}function lu(e){return fu.test(e)}var fu=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;function hu(e){return "object"===Ji(e)&&null!==e&&e.constructor===Object}function du(e){return "object"===Ji(e)&&null!==e&&(e.constructor===Object||e.constructor===Array)}function vu(e){if("number"==typeof e)return e>9466848e5&&isFinite(e)&&Math.floor(e)===e&&!isNaN(new Date(e).valueOf());if("bigint"==typeof e)return vu(Number(e));try{var t=e?e.valueOf():e;if(t!==e)return vu(t)}catch(e){return !1}return !1}function pu(e){var t=window.document.createElement("div");t.style.color=e;var n=t.style.color;return ""!==n?n.replace(/\s+/g,"").toLowerCase():null}function mu(e,t){if("number"==typeof e||"string"==typeof e||"boolean"==typeof e||void 0===e)return Ji(e);if("bigint"==typeof e)return "number";if(null===e)return "null";if(Array.isArray(e))return "array";if(hu(e))return "object";var n=t.stringify(e);return n&&lu(n)?"number":"true"===n||"false"===n?"boolean":"null"===n?"null":"unknown"}var gu=/^https?:\/\/\S+$/;function yu(e){return "string"==typeof e&&gu.test(e)}function bu(e,t){if(""===e)return "";var n=e.trim();return "null"===n?null:"true"===n||"false"!==n&&(lu(n)?t.parse(n):e)}function wu(e){return xu.test(e)}var xu=/^-?[0-9]+$/,ku="object"==("undefined"==typeof global?"undefined":Ji(global))&&global&&global.Object===Object&&global,ju="object"==("undefined"==typeof self?"undefined":Ji(self))&&self&&self.Object===Object&&self,Su=ku||ju||Function("return this")(),Cu=Su.Symbol,$u=Object.prototype,_u=$u.hasOwnProperty,Ou=$u.toString,Mu=Cu?Cu.toStringTag:void 0;var Eu=Object.prototype.toString;var Au=Cu?Cu.toStringTag:void 0;function Pu(e){return null==e?void 0===e?"[object Undefined]":"[object Null]":Au&&Au in Object(e)?function(e){var t=_u.call(e,Mu),n=e[Mu];try{e[Mu]=void 0;var r=!0;}catch(e){}var i=Ou.call(e);return r&&(t?e[Mu]=n:delete e[Mu]),i}(e):function(e){return Eu.call(e)}(e)}function Tu(e){return null!=e&&"object"==Ji(e)}function Ru(e){return "symbol"==Ji(e)||Tu(e)&&"[object Symbol]"==Pu(e)}function Nu(e){return "number"==typeof e?e:Ru(e)?NaN:+e}function Iu(e,t){for(var n=-1,r=null==e?0:e.length,i=Array(r);++n<r;)i[n]=t(e[n],n,e);return i}var Du=Array.isArray,Lu=Cu?Cu.prototype:void 0,Bu=Lu?Lu.toString:void 0;function zu(e){if("string"==typeof e)return e;if(Du(e))return Iu(e,zu)+"";if(Ru(e))return Bu?Bu.call(e):"";var t=e+"";return "0"==t&&1/e==-Infinity?"-0":t}function qu(e,t){return function(n,r){var i;if(void 0===n&&void 0===r)return t;if(void 0!==n&&(i=n),void 0!==r){if(void 0===i)return r;"string"==typeof n||"string"==typeof r?(n=zu(n),r=zu(r)):(n=Nu(n),r=Nu(r)),i=e(n,r);}return i}}var Fu=qu((function(e,t){return e+t}),0),Vu=/\s/;function Wu(e){for(var t=e.length;t--&&Vu.test(e.charAt(t)););return t}var Hu=/^\s+/;function Uu(e){return e?e.slice(0,Wu(e)+1).replace(Hu,""):e}function Ju(e){var t=Ji(e);return null!=e&&("object"==t||"function"==t)}var Ku=/^[-+]0x[0-9a-f]+$/i,Gu=/^0b[01]+$/i,Qu=/^0o[0-7]+$/i,Yu=parseInt;function Xu(e){if("number"==typeof e)return e;if(Ru(e))return NaN;if(Ju(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=Ju(t)?t+"":t;}if("string"!=typeof e)return 0===e?e:+e;e=Uu(e);var n=Gu.test(e);return n||Qu.test(e)?Yu(e.slice(2),n?2:8):Ku.test(e)?NaN:+e}function Zu(e){return e?Infinity===(e=Xu(e))||-Infinity===e?17976931348623157e292*(e<0?-1:1):e==e?e:0:0===e?e:0}function el(e){var t=Zu(e),n=t%1;return t==t?n?t-n:t:0}function tl(e,t){if("function"!=typeof t)throw new TypeError("Expected a function");return e=el(e),function(){if(--e<1)return t.apply(this,arguments)}}function nl(e){return e}function rl(e){if(!Ju(e))return !1;var t=Pu(e);return "[object Function]"==t||"[object GeneratorFunction]"==t||"[object AsyncFunction]"==t||"[object Proxy]"==t}var il,ol=Su["__core-js_shared__"],al=(il=/[^.]+$/.exec(ol&&ol.keys&&ol.keys.IE_PROTO||""))?"Symbol(src)_1."+il:"";var sl=Function.prototype.toString;function cl(e){if(null!=e){try{return sl.call(e)}catch(e){}try{return e+""}catch(e){}}return ""}var ul=/^\[object .+?Constructor\]$/,ll=Function.prototype,fl=Object.prototype,hl=ll.toString,dl=fl.hasOwnProperty,vl=RegExp("^"+hl.call(dl).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function pl(e){return !(!Ju(e)||function(e){return !!al&&al in e}(e))&&(rl(e)?vl:ul).test(cl(e))}function ml(e,t){var n=function(e,t){return null==e?void 0:e[t]}(e,t);return pl(n)?n:void 0}var gl=ml(Su,"WeakMap"),yl=gl&&new gl,bl=yl?function(e,t){return yl.set(e,t),e}:nl,wl=bl,xl=Object.create,kl=function(){function e(){}return function(t){if(!Ju(t))return {};if(xl)return xl(t);e.prototype=t;var n=new e;return e.prototype=void 0,n}}(),jl=kl;function Sl(e){return function(){var t=arguments;switch(t.length){case 0:return new e;case 1:return new e(t[0]);case 2:return new e(t[0],t[1]);case 3:return new e(t[0],t[1],t[2]);case 4:return new e(t[0],t[1],t[2],t[3]);case 5:return new e(t[0],t[1],t[2],t[3],t[4]);case 6:return new e(t[0],t[1],t[2],t[3],t[4],t[5]);case 7:return new e(t[0],t[1],t[2],t[3],t[4],t[5],t[6])}var n=jl(e.prototype),r=e.apply(n,t);return Ju(r)?r:n}}function Cl(e,t,n){switch(n.length){case 0:return e.call(t);case 1:return e.call(t,n[0]);case 2:return e.call(t,n[0],n[1]);case 3:return e.call(t,n[0],n[1],n[2])}return e.apply(t,n)}var $l=Math.max;function _l(e,t,n,r){for(var i=-1,o=e.length,a=n.length,s=-1,c=t.length,u=$l(o-a,0),l=Array(c+u),f=!r;++s<c;)l[s]=t[s];for(;++i<a;)(f||i<o)&&(l[n[i]]=e[i]);for(;u--;)l[s++]=e[i++];return l}var Ol=Math.max;function Ml(e,t,n,r){for(var i=-1,o=e.length,a=-1,s=n.length,c=-1,u=t.length,l=Ol(o-s,0),f=Array(l+u),h=!r;++i<l;)f[i]=e[i];for(var d=i;++c<u;)f[d+c]=t[c];for(;++a<s;)(h||i<o)&&(f[d+n[a]]=e[i++]);return f}function El(e,t){for(var n=e.length,r=0;n--;)e[n]===t&&++r;return r}function Al(){}function Pl(e){this.__wrapped__=e,this.__actions__=[],this.__dir__=1,this.__filtered__=!1,this.__iteratees__=[],this.__takeCount__=4294967295,this.__views__=[];}function Tl(){}Pl.prototype=jl(Al.prototype),Pl.prototype.constructor=Pl;var Rl=yl?function(e){return yl.get(e)}:Tl,Nl=Rl,Il={},Dl=Object.prototype.hasOwnProperty;function Ll(e){for(var t=e.name+"",n=Il[t],r=Dl.call(Il,t)?n.length:0;r--;){var i=n[r],o=i.func;if(null==o||o==e)return i.name}return t}function Bl(e,t){this.__wrapped__=e,this.__actions__=[],this.__chain__=!!t,this.__index__=0,this.__values__=void 0;}function zl(e,t){var n=-1,r=e.length;for(t||(t=Array(r));++n<r;)t[n]=e[n];return t}function ql(e){if(e instanceof Pl)return e.clone();var t=new Bl(e.__wrapped__,e.__chain__);return t.__actions__=zl(e.__actions__),t.__index__=e.__index__,t.__values__=e.__values__,t}Bl.prototype=jl(Al.prototype),Bl.prototype.constructor=Bl;var Fl=Object.prototype.hasOwnProperty;function Vl(e){if(Tu(e)&&!Du(e)&&!(e instanceof Pl)){if(e instanceof Bl)return e;if(Fl.call(e,"__wrapped__"))return ql(e)}return new Bl(e)}function Wl(e){var t=Ll(e),n=Vl[t];if("function"!=typeof n||!(t in Pl.prototype))return !1;if(e===n)return !0;var r=Nl(n);return !!r&&e===r[0]}Vl.prototype=Al.prototype,Vl.prototype.constructor=Vl;var Hl=Date.now;function Ul(e){var t=0,n=0;return function(){var r=Hl(),i=16-(r-n);if(n=r,i>0){if(++t>=800)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}var Jl=Ul(wl),Kl=/\{\n\/\* \[wrapped with (.+)\] \*/,Gl=/,? & /;var Ql=/\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;function Yl(e){return function(){return e}}var Xl=function(){try{var e=ml(Object,"defineProperty");return e({},"",{}),e}catch(e){}}(),Zl=Xl,ef=Zl?function(e,t){return Zl(e,"toString",{configurable:!0,enumerable:!1,value:Yl(t),writable:!0})}:nl,tf=Ul(ef);function nf(e,t){for(var n=-1,r=null==e?0:e.length;++n<r&&!1!==t(e[n],n,e););return e}function rf(e,t,n,r){for(var i=e.length,o=n+(r?1:-1);r?o--:++o<i;)if(t(e[o],o,e))return o;return -1}function of(e){return e!=e}function af(e,t,n){return t==t?function(e,t,n){for(var r=n-1,i=e.length;++r<i;)if(e[r]===t)return r;return -1}(e,t,n):rf(e,of,n)}function sf(e,t){return !!(null==e?0:e.length)&&af(e,t,0)>-1}var cf=[["ary",128],["bind",1],["bindKey",2],["curry",8],["curryRight",16],["flip",512],["partial",32],["partialRight",64],["rearg",256]];function uf(e,t,n){var r=t+"";return tf(e,function(e,t){var n=t.length;if(!n)return e;var r=n-1;return t[r]=(n>1?"& ":"")+t[r],t=t.join(n>2?", ":" "),e.replace(Ql,"{\n/* [wrapped with "+t+"] */\n")}(r,function(e,t){return nf(cf,(function(n){var r="_."+n[0];t&n[1]&&!sf(e,r)&&e.push(r);})),e.sort()}(function(e){var t=e.match(Kl);return t?t[1].split(Gl):[]}(r),n)))}function lf(e,t,n,r,i,o,a,s,c,u){var l=8&t;t|=l?32:64,4&(t&=~(l?64:32))||(t&=-4);var f=[e,t,i,l?o:void 0,l?a:void 0,l?void 0:o,l?void 0:a,s,c,u],h=n.apply(void 0,f);return Wl(e)&&Jl(h,f),h.placeholder=r,uf(h,e,t)}function ff(e){return e.placeholder}var hf=/^(?:0|[1-9]\d*)$/;function df(e,t){var n=Ji(e);return !!(t=null==t?9007199254740991:t)&&("number"==n||"symbol"!=n&&hf.test(e))&&e>-1&&e%1==0&&e<t}var vf=Math.min;function pf(e,t){for(var n=e.length,r=vf(t.length,n),i=zl(e);r--;){var o=t[r];e[r]=df(o,n)?i[o]:void 0;}return e}function mf(e,t){for(var n=-1,r=e.length,i=0,o=[];++n<r;){var a=e[n];a!==t&&"__lodash_placeholder__"!==a||(e[n]="__lodash_placeholder__",o[i++]=n);}return o}function gf(e,t,n,r,i,o,a,s,c,u){var l=128&t,f=1&t,h=2&t,d=24&t,v=512&t,p=h?void 0:Sl(e);return function m(){for(var g=arguments.length,y=Array(g),b=g;b--;)y[b]=arguments[b];if(d)var w=ff(m),x=El(y,w);if(r&&(y=_l(y,r,i,d)),o&&(y=Ml(y,o,a,d)),g-=x,d&&g<u){var k=mf(y,w);return lf(e,t,gf,m.placeholder,n,y,k,s,c,u-g)}var j=f?n:this,S=h?j[e]:e;return g=y.length,s?y=pf(y,s):v&&g>1&&y.reverse(),l&&c<g&&(y.length=c),this&&this!==Su&&this instanceof m&&(S=p||Sl(S)),S.apply(j,y)}}var yf=Math.min;var bf=Math.max;function wf(e,t,n,r,i,o,a,s){var c=2&t;if(!c&&"function"!=typeof e)throw new TypeError("Expected a function");var u=r?r.length:0;if(u||(t&=-97,r=i=void 0),a=void 0===a?a:bf(el(a),0),s=void 0===s?s:el(s),u-=i?i.length:0,64&t){var l=r,f=i;r=i=void 0;}var h=c?void 0:Nl(e),d=[e,t,n,r,i,l,f,o,a,s];if(h&&function(e,t){var n=e[1],r=t[1],i=n|r,o=i<131,a=128==r&&8==n||128==r&&256==n&&e[7].length<=t[8]||384==r&&t[7].length<=t[8]&&8==n;if(!o&&!a)return e;1&r&&(e[2]=t[2],i|=1&n?0:4);var s=t[3];if(s){var c=e[3];e[3]=c?_l(c,s,t[4]):s,e[4]=c?mf(e[3],"__lodash_placeholder__"):t[4];}(s=t[5])&&(c=e[5],e[5]=c?Ml(c,s,t[6]):s,e[6]=c?mf(e[5],"__lodash_placeholder__"):t[6]),(s=t[7])&&(e[7]=s),128&r&&(e[8]=null==e[8]?t[8]:yf(e[8],t[8])),null==e[9]&&(e[9]=t[9]),e[0]=t[0],e[1]=i;}(d,h),e=d[0],t=d[1],n=d[2],r=d[3],i=d[4],!(s=d[9]=void 0===d[9]?c?0:e.length:bf(d[9]-u,0))&&24&t&&(t&=-25),t&&1!=t)v=8==t||16==t?function(e,t,n){var r=Sl(e);return function i(){for(var o=arguments.length,a=Array(o),s=o,c=ff(i);s--;)a[s]=arguments[s];var u=o<3&&a[0]!==c&&a[o-1]!==c?[]:mf(a,c);return (o-=u.length)<n?lf(e,t,gf,i.placeholder,void 0,a,u,void 0,void 0,n-o):Cl(this&&this!==Su&&this instanceof i?r:e,this,a)}}(e,t,s):32!=t&&33!=t||i.length?gf.apply(void 0,d):function(e,t,n,r){var i=1&t,o=Sl(e);return function t(){for(var a=-1,s=arguments.length,c=-1,u=r.length,l=Array(u+s),f=this&&this!==Su&&this instanceof t?o:e;++c<u;)l[c]=r[c];for(;s--;)l[c++]=arguments[++a];return Cl(f,i?n:this,l)}}(e,t,n,r);else var v=function(e,t,n){var r=1&t,i=Sl(e);return function t(){return (this&&this!==Su&&this instanceof t?i:e).apply(r?n:this,arguments)}}(e,t,n);return uf((h?wl:Jl)(v,d),e,t)}function xf(e,t,n){return t=n?void 0:t,wf(e,128,void 0,void 0,void 0,void 0,t=e&&null==t?e.length:t)}function kf(e,t,n){"__proto__"==t&&Zl?Zl(e,t,{configurable:!0,enumerable:!0,value:n,writable:!0}):e[t]=n;}function jf(e,t){return e===t||e!=e&&t!=t}var Sf=Object.prototype.hasOwnProperty;function Cf(e,t,n){var r=e[t];Sf.call(e,t)&&jf(r,n)&&(void 0!==n||t in e)||kf(e,t,n);}function $f(e,t,n,r){var i=!n;n||(n={});for(var o=-1,a=t.length;++o<a;){var s=t[o],c=r?r(n[s],e[s],s,n,e):void 0;void 0===c&&(c=e[s]),i?kf(n,s,c):Cf(n,s,c);}return n}var _f=Math.max;function Of(e,t,n){return t=_f(void 0===t?e.length-1:t,0),function(){for(var r=arguments,i=-1,o=_f(r.length-t,0),a=Array(o);++i<o;)a[i]=r[t+i];i=-1;for(var s=Array(t+1);++i<t;)s[i]=r[i];return s[t]=n(a),Cl(e,this,s)}}function Mf(e,t){return tf(Of(e,t,nl),e+"")}function Ef(e){return "number"==typeof e&&e>-1&&e%1==0&&e<=9007199254740991}function Af(e){return null!=e&&Ef(e.length)&&!rl(e)}function Pf(e,t,n){if(!Ju(n))return !1;var r=Ji(t);return !!("number"==r?Af(n)&&df(t,n.length):"string"==r&&t in n)&&jf(n[t],e)}function Tf(e){return Mf((function(t,n){var r=-1,i=n.length,o=i>1?n[i-1]:void 0,a=i>2?n[2]:void 0;for(o=e.length>3&&"function"==typeof o?(i--,o):void 0,a&&Pf(n[0],n[1],a)&&(o=i<3?void 0:o,i=1),t=Object(t);++r<i;){var s=n[r];s&&e(t,s,r,o);}return t}))}var Rf=Object.prototype;function Nf(e){var t=e&&e.constructor;return e===("function"==typeof t&&t.prototype||Rf)}function If(e,t){for(var n=-1,r=Array(e);++n<e;)r[n]=t(n);return r}function Df(e){return Tu(e)&&"[object Arguments]"==Pu(e)}var Lf=Object.prototype,Bf=Lf.hasOwnProperty,zf=Lf.propertyIsEnumerable,qf=Df(function(){return arguments}())?Df:function(e){return Tu(e)&&Bf.call(e,"callee")&&!zf.call(e,"callee")};function Ff(){return !1}var Vf="object"==("undefined"==typeof exports?"undefined":Ji(exports))&&exports&&!exports.nodeType&&exports,Wf=Vf&&"object"==("undefined"==typeof module?"undefined":Ji(module))&&module&&!module.nodeType&&module,Hf=Wf&&Wf.exports===Vf?Su.Buffer:void 0,Uf=(Hf?Hf.isBuffer:void 0)||Ff,Jf={};function Kf(e){return function(t){return e(t)}}Jf["[object Float32Array]"]=Jf["[object Float64Array]"]=Jf["[object Int8Array]"]=Jf["[object Int16Array]"]=Jf["[object Int32Array]"]=Jf["[object Uint8Array]"]=Jf["[object Uint8ClampedArray]"]=Jf["[object Uint16Array]"]=Jf["[object Uint32Array]"]=!0,Jf["[object Arguments]"]=Jf["[object Array]"]=Jf["[object ArrayBuffer]"]=Jf["[object Boolean]"]=Jf["[object DataView]"]=Jf["[object Date]"]=Jf["[object Error]"]=Jf["[object Function]"]=Jf["[object Map]"]=Jf["[object Number]"]=Jf["[object Object]"]=Jf["[object RegExp]"]=Jf["[object Set]"]=Jf["[object String]"]=Jf["[object WeakMap]"]=!1;var Gf="object"==("undefined"==typeof exports?"undefined":Ji(exports))&&exports&&!exports.nodeType&&exports,Qf=Gf&&"object"==("undefined"==typeof module?"undefined":Ji(module))&&module&&!module.nodeType&&module,Yf=Qf&&Qf.exports===Gf&&ku.process,Xf=function(){try{var e=Qf&&Qf.require&&Qf.require("util").types;return e||Yf&&Yf.binding&&Yf.binding("util")}catch(e){}}(),Zf=Xf,eh=Zf&&Zf.isTypedArray,th=eh?Kf(eh):function(e){return Tu(e)&&Ef(e.length)&&!!Jf[Pu(e)]},nh=Object.prototype.hasOwnProperty;function rh(e,t){var n=Du(e),r=!n&&qf(e),i=!n&&!r&&Uf(e),o=!n&&!r&&!i&&th(e),a=n||r||i||o,s=a?If(e.length,String):[],c=s.length;for(var u in e)!t&&!nh.call(e,u)||a&&("length"==u||i&&("offset"==u||"parent"==u)||o&&("buffer"==u||"byteLength"==u||"byteOffset"==u)||df(u,c))||s.push(u);return s}function ih(e,t){return function(n){return e(t(n))}}var oh=ih(Object.keys,Object),ah=Object.prototype.hasOwnProperty;function sh(e){if(!Nf(e))return oh(e);var t=[];for(var n in Object(e))ah.call(e,n)&&"constructor"!=n&&t.push(n);return t}function ch(e){return Af(e)?rh(e):sh(e)}var uh=Object.prototype.hasOwnProperty,lh=Tf((function(e,t){if(Nf(t)||Af(t))$f(t,ch(t),e);else for(var n in t)uh.call(t,n)&&Cf(e,n,t[n]);})),fh=lh;var hh=Object.prototype.hasOwnProperty;function dh(e){if(!Ju(e))return function(e){var t=[];if(null!=e)for(var n in Object(e))t.push(n);return t}(e);var t=Nf(e),n=[];for(var r in e)("constructor"!=r||!t&&hh.call(e,r))&&n.push(r);return n}function vh(e){return Af(e)?rh(e,!0):dh(e)}var ph=Tf((function(e,t){$f(t,vh(t),e);})),mh=ph,gh=Tf((function(e,t,n,r){$f(t,vh(t),e,r);})),yh=gh,bh=Tf((function(e,t,n,r){$f(t,ch(t),e,r);})),wh=bh,xh=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,kh=/^\w*$/;function jh(e,t){if(Du(e))return !1;var n=Ji(e);return !("number"!=n&&"symbol"!=n&&"boolean"!=n&&null!=e&&!Ru(e))||(kh.test(e)||!xh.test(e)||null!=t&&e in Object(t))}var Sh=ml(Object,"create");var Ch=Object.prototype.hasOwnProperty;var $h=Object.prototype.hasOwnProperty;function _h(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1]);}}function Oh(e,t){for(var n=e.length;n--;)if(jf(e[n][0],t))return n;return -1}_h.prototype.clear=function(){this.__data__=Sh?Sh(null):{},this.size=0;},_h.prototype.delete=function(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t},_h.prototype.get=function(e){var t=this.__data__;if(Sh){var n=t[e];return "__lodash_hash_undefined__"===n?void 0:n}return Ch.call(t,e)?t[e]:void 0},_h.prototype.has=function(e){var t=this.__data__;return Sh?void 0!==t[e]:$h.call(t,e)},_h.prototype.set=function(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=Sh&&void 0===t?"__lodash_hash_undefined__":t,this};var Mh=Array.prototype.splice;function Eh(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1]);}}Eh.prototype.clear=function(){this.__data__=[],this.size=0;},Eh.prototype.delete=function(e){var t=this.__data__,n=Oh(t,e);return !(n<0)&&(n==t.length-1?t.pop():Mh.call(t,n,1),--this.size,!0)},Eh.prototype.get=function(e){var t=this.__data__,n=Oh(t,e);return n<0?void 0:t[n][1]},Eh.prototype.has=function(e){return Oh(this.__data__,e)>-1},Eh.prototype.set=function(e,t){var n=this.__data__,r=Oh(n,e);return r<0?(++this.size,n.push([e,t])):n[r][1]=t,this};var Ah=ml(Su,"Map");function Ph(e,t){var n=e.__data__;return function(e){var t=Ji(e);return "string"==t||"number"==t||"symbol"==t||"boolean"==t?"__proto__"!==e:null===e}(t)?n["string"==typeof t?"string":"hash"]:n.map}function Th(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1]);}}Th.prototype.clear=function(){this.size=0,this.__data__={hash:new _h,map:new(Ah||Eh),string:new _h};},Th.prototype.delete=function(e){var t=Ph(this,e).delete(e);return this.size-=t?1:0,t},Th.prototype.get=function(e){return Ph(this,e).get(e)},Th.prototype.has=function(e){return Ph(this,e).has(e)},Th.prototype.set=function(e,t){var n=Ph(this,e),r=n.size;return n.set(e,t),this.size+=n.size==r?0:1,this};function Rh(e,t){if("function"!=typeof e||null!=t&&"function"!=typeof t)throw new TypeError("Expected a function");var n=function n(){var r=arguments,i=t?t.apply(this,r):r[0],o=n.cache;if(o.has(i))return o.get(i);var a=e.apply(this,r);return n.cache=o.set(i,a)||o,a};return n.cache=new(Rh.Cache||Th),n}Rh.Cache=Th;var Nh=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Ih=/\\(\\)?/g,Dh=function(e){var t=Rh(e,(function(e){return 500===n.size&&n.clear(),e})),n=t.cache;return t}((function(e){var t=[];return 46===e.charCodeAt(0)&&t.push(""),e.replace(Nh,(function(e,n,r,i){t.push(r?i.replace(Ih,"$1"):n||e);})),t})),Lh=Dh;function Bh(e){return null==e?"":zu(e)}function zh(e,t){return Du(e)?e:jh(e,t)?[e]:Lh(Bh(e))}function qh(e){if("string"==typeof e||Ru(e))return e;var t=e+"";return "0"==t&&1/e==-Infinity?"-0":t}function Fh(e,t){for(var n=0,r=(t=zh(t,e)).length;null!=e&&n<r;)e=e[qh(t[n++])];return n&&n==r?e:void 0}function Vh(e,t,n){var r=null==e?void 0:Fh(e,t);return void 0===r?n:r}function Wh(e,t){for(var n=-1,r=t.length,i=Array(r),o=null==e;++n<r;)i[n]=o?void 0:Vh(e,t[n]);return i}function Hh(e,t){for(var n=-1,r=t.length,i=e.length;++n<r;)e[i+n]=t[n];return e}var Uh=Cu?Cu.isConcatSpreadable:void 0;function Jh(e){return Du(e)||qf(e)||!!(Uh&&e&&e[Uh])}function Kh(e,t,n,r,i){var o=-1,a=e.length;for(n||(n=Jh),i||(i=[]);++o<a;){var s=e[o];t>0&&n(s)?t>1?Kh(s,t-1,n,r,i):Hh(i,s):r||(i[i.length]=s);}return i}function Gh(e){return (null==e?0:e.length)?Kh(e,1):[]}function Qh(e){return tf(Of(e,void 0,Gh),e+"")}var Yh=Qh(Wh),Xh=ih(Object.getPrototypeOf,Object),Zh=Function.prototype,ed=Object.prototype,td=Zh.toString,nd=ed.hasOwnProperty,rd=td.call(Object);function id(e){if(!Tu(e)||"[object Object]"!=Pu(e))return !1;var t=Xh(e);if(null===t)return !0;var n=nd.call(t,"constructor")&&t.constructor;return "function"==typeof n&&n instanceof n&&td.call(n)==rd}function od(e){if(!Tu(e))return !1;var t=Pu(e);return "[object Error]"==t||"[object DOMException]"==t||"string"==typeof e.message&&"string"==typeof e.name&&!id(e)}var ad=Mf((function(e,t){try{return Cl(e,void 0,t)}catch(e){return od(e)?e:new Error(e)}})),sd=ad;function cd(e,t){var n;if("function"!=typeof t)throw new TypeError("Expected a function");return e=el(e),function(){return --e>0&&(n=t.apply(this,arguments)),e<=1&&(t=void 0),n}}var ud=Mf((function(e,t,n){var r=1;if(n.length){var i=mf(n,ff(ud));r|=32;}return wf(e,r,t,n,i)}));ud.placeholder={};var ld=ud,fd=Qh((function(e,t){return nf(t,(function(t){t=qh(t),kf(e,t,ld(e[t],e));})),e})),hd=fd,dd=Mf((function(e,t,n){var r=3;if(n.length){var i=mf(n,ff(dd));r|=32;}return wf(t,r,e,n,i)}));dd.placeholder={};var vd=dd;function pd(e,t,n){var r=-1,i=e.length;t<0&&(t=-t>i?0:i+t),(n=n>i?i:n)<0&&(n+=i),i=t>n?0:n-t>>>0,t>>>=0;for(var o=Array(i);++r<i;)o[r]=e[r+t];return o}function md(e,t,n){var r=e.length;return n=void 0===n?r:n,!t&&n>=r?e:pd(e,t,n)}var gd=RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]");function yd(e){return gd.test(e)}var bd="[\\ud800-\\udfff]",wd="[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]",xd="\\ud83c[\\udffb-\\udfff]",kd="[^\\ud800-\\udfff]",jd="(?:\\ud83c[\\udde6-\\uddff]){2}",Sd="[\\ud800-\\udbff][\\udc00-\\udfff]",Cd="(?:"+wd+"|"+xd+")"+"?",$d="[\\ufe0e\\ufe0f]?"+Cd+("(?:\\u200d(?:"+[kd,jd,Sd].join("|")+")[\\ufe0e\\ufe0f]?"+Cd+")*"),_d="(?:"+[kd+wd+"?",wd,jd,Sd,bd].join("|")+")",Od=RegExp(xd+"(?="+xd+")|"+_d+$d,"g");function Md(e){return yd(e)?function(e){return e.match(Od)||[]}(e):function(e){return e.split("")}(e)}function Ed(e){return function(t){var n=yd(t=Bh(t))?Md(t):void 0,r=n?n[0]:t.charAt(0),i=n?md(n,1).join(""):t.slice(1);return r[e]()+i}}var Ad=Ed("toUpperCase");function Pd(e){return Ad(Bh(e).toLowerCase())}function Td(e,t,n,r){var i=-1,o=null==e?0:e.length;for(r&&o&&(n=e[++i]);++i<o;)n=t(n,e[i],i,e);return n}function Rd(e){return function(t){return null==e?void 0:e[t]}}var Nd=Rd({"À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A","à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","Ç":"C","ç":"c","Ð":"D","ð":"d","È":"E","É":"E","Ê":"E","Ë":"E","è":"e","é":"e","ê":"e","ë":"e","Ì":"I","Í":"I","Î":"I","Ï":"I","ì":"i","í":"i","î":"i","ï":"i","Ñ":"N","ñ":"n","Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O","Ø":"O","ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o","Ù":"U","Ú":"U","Û":"U","Ü":"U","ù":"u","ú":"u","û":"u","ü":"u","Ý":"Y","ý":"y","ÿ":"y","Æ":"Ae","æ":"ae","Þ":"Th","þ":"th","ß":"ss","Ā":"A","Ă":"A","Ą":"A","ā":"a","ă":"a","ą":"a","Ć":"C","Ĉ":"C","Ċ":"C","Č":"C","ć":"c","ĉ":"c","ċ":"c","č":"c","Ď":"D","Đ":"D","ď":"d","đ":"d","Ē":"E","Ĕ":"E","Ė":"E","Ę":"E","Ě":"E","ē":"e","ĕ":"e","ė":"e","ę":"e","ě":"e","Ĝ":"G","Ğ":"G","Ġ":"G","Ģ":"G","ĝ":"g","ğ":"g","ġ":"g","ģ":"g","Ĥ":"H","Ħ":"H","ĥ":"h","ħ":"h","Ĩ":"I","Ī":"I","Ĭ":"I","Į":"I","İ":"I","ĩ":"i","ī":"i","ĭ":"i","į":"i","ı":"i","Ĵ":"J","ĵ":"j","Ķ":"K","ķ":"k","ĸ":"k","Ĺ":"L","Ļ":"L","Ľ":"L","Ŀ":"L","Ł":"L","ĺ":"l","ļ":"l","ľ":"l","ŀ":"l","ł":"l","Ń":"N","Ņ":"N","Ň":"N","Ŋ":"N","ń":"n","ņ":"n","ň":"n","ŋ":"n","Ō":"O","Ŏ":"O","Ő":"O","ō":"o","ŏ":"o","ő":"o","Ŕ":"R","Ŗ":"R","Ř":"R","ŕ":"r","ŗ":"r","ř":"r","Ś":"S","Ŝ":"S","Ş":"S","Š":"S","ś":"s","ŝ":"s","ş":"s","š":"s","Ţ":"T","Ť":"T","Ŧ":"T","ţ":"t","ť":"t","ŧ":"t","Ũ":"U","Ū":"U","Ŭ":"U","Ů":"U","Ű":"U","Ų":"U","ũ":"u","ū":"u","ŭ":"u","ů":"u","ű":"u","ų":"u","Ŵ":"W","ŵ":"w","Ŷ":"Y","ŷ":"y","Ÿ":"Y","Ź":"Z","Ż":"Z","Ž":"Z","ź":"z","ż":"z","ž":"z","Ĳ":"IJ","ĳ":"ij","Œ":"Oe","œ":"oe","ŉ":"'n","ſ":"s"}),Id=/[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,Dd=RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]","g");function Ld(e){return (e=Bh(e))&&e.replace(Id,Nd).replace(Dd,"")}var Bd=/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;var zd=/[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;var qd="\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",Fd="["+qd+"]",Vd="\\d+",Wd="[\\u2700-\\u27bf]",Hd="[a-z\\xdf-\\xf6\\xf8-\\xff]",Ud="[^\\ud800-\\udfff"+qd+Vd+"\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde]",Jd="(?:\\ud83c[\\udde6-\\uddff]){2}",Kd="[\\ud800-\\udbff][\\udc00-\\udfff]",Gd="[A-Z\\xc0-\\xd6\\xd8-\\xde]",Qd="(?:"+Hd+"|"+Ud+")",Yd="(?:"+Gd+"|"+Ud+")",Xd="(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?",Zd="[\\ufe0e\\ufe0f]?"+Xd+("(?:\\u200d(?:"+["[^\\ud800-\\udfff]",Jd,Kd].join("|")+")[\\ufe0e\\ufe0f]?"+Xd+")*"),ev="(?:"+[Wd,Jd,Kd].join("|")+")"+Zd,tv=RegExp([Gd+"?"+Hd+"+(?:['’](?:d|ll|m|re|s|t|ve))?(?="+[Fd,Gd,"$"].join("|")+")",Yd+"+(?:['’](?:D|LL|M|RE|S|T|VE))?(?="+[Fd,Gd+Qd,"$"].join("|")+")",Gd+"?"+Qd+"+(?:['’](?:d|ll|m|re|s|t|ve))?",Gd+"+(?:['’](?:D|LL|M|RE|S|T|VE))?","\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])","\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])",Vd,ev].join("|"),"g");function nv(e,t,n){return e=Bh(e),void 0===(t=n?void 0:t)?function(e){return zd.test(e)}(e)?function(e){return e.match(tv)||[]}(e):function(e){return e.match(Bd)||[]}(e):e.match(t)||[]}var rv=RegExp("['’]","g");function iv(e){return function(t){return Td(nv(Ld(t).replace(rv,"")),e,"")}}var ov=iv((function(e,t,n){return t=t.toLowerCase(),e+(n?Pd(t):t)})),av=ov;function sv(){if(!arguments.length)return [];var e=arguments[0];return Du(e)?e:[e]}var cv=Su.isFinite,uv=Math.min;function lv(e){var t=Math[e];return function(e,n){if(e=Xu(e),(n=null==n?0:uv(el(n),292))&&cv(e)){var r=(Bh(e)+"e").split("e");return +((r=(Bh(t(r[0]+"e"+(+r[1]+n)))+"e").split("e"))[0]+"e"+(+r[1]-n))}return t(e)}}var fv=lv("ceil");function hv(e){var t=Vl(e);return t.__chain__=!0,t}var dv=Math.ceil,vv=Math.max;function pv(e,t,n){t=(n?Pf(e,t,n):void 0===t)?1:vv(el(t),0);var r=null==e?0:e.length;if(!r||t<1)return [];for(var i=0,o=0,a=Array(dv(r/t));i<r;)a[o++]=pd(e,i,i+=t);return a}function mv(e,t,n){return e==e&&(void 0!==n&&(e=e<=n?e:n),void 0!==t&&(e=e>=t?e:t)),e}function gv(e,t,n){return void 0===n&&(n=t,t=void 0),void 0!==n&&(n=(n=Xu(n))==n?n:0),void 0!==t&&(t=(t=Xu(t))==t?t:0),mv(Xu(e),t,n)}function yv(e){var t=this.__data__=new Eh(e);this.size=t.size;}function bv(e,t){return e&&$f(t,ch(t),e)}yv.prototype.clear=function(){this.__data__=new Eh,this.size=0;},yv.prototype.delete=function(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n},yv.prototype.get=function(e){return this.__data__.get(e)},yv.prototype.has=function(e){return this.__data__.has(e)},yv.prototype.set=function(e,t){var n=this.__data__;if(n instanceof Eh){var r=n.__data__;if(!Ah||r.length<199)return r.push([e,t]),this.size=++n.size,this;n=this.__data__=new Th(r);}return n.set(e,t),this.size=n.size,this};var wv="object"==("undefined"==typeof exports?"undefined":Ji(exports))&&exports&&!exports.nodeType&&exports,xv=wv&&"object"==("undefined"==typeof module?"undefined":Ji(module))&&module&&!module.nodeType&&module,kv=xv&&xv.exports===wv?Su.Buffer:void 0,jv=kv?kv.allocUnsafe:void 0;function Sv(e,t){if(t)return e.slice();var n=e.length,r=jv?jv(n):new e.constructor(n);return e.copy(r),r}function Cv(e,t){for(var n=-1,r=null==e?0:e.length,i=0,o=[];++n<r;){var a=e[n];t(a,n,e)&&(o[i++]=a);}return o}function $v(){return []}var _v=Object.prototype.propertyIsEnumerable,Ov=Object.getOwnPropertySymbols,Mv=Ov?function(e){return null==e?[]:(e=Object(e),Cv(Ov(e),(function(t){return _v.call(e,t)})))}:$v,Ev=Mv;var Av=Object.getOwnPropertySymbols?function(e){for(var t=[];e;)Hh(t,Ev(e)),e=Xh(e);return t}:$v,Pv=Av;function Tv(e,t,n){var r=t(e);return Du(e)?r:Hh(r,n(e))}function Rv(e){return Tv(e,ch,Ev)}function Nv(e){return Tv(e,vh,Pv)}var Iv=ml(Su,"DataView"),Dv=ml(Su,"Promise"),Lv=ml(Su,"Set"),Bv=cl(Iv),zv=cl(Ah),qv=cl(Dv),Fv=cl(Lv),Vv=cl(gl),Wv=Pu;(Iv&&"[object DataView]"!=Wv(new Iv(new ArrayBuffer(1)))||Ah&&"[object Map]"!=Wv(new Ah)||Dv&&"[object Promise]"!=Wv(Dv.resolve())||Lv&&"[object Set]"!=Wv(new Lv)||gl&&"[object WeakMap]"!=Wv(new gl))&&(Wv=function(e){var t=Pu(e),n="[object Object]"==t?e.constructor:void 0,r=n?cl(n):"";if(r)switch(r){case Bv:return "[object DataView]";case zv:return "[object Map]";case qv:return "[object Promise]";case Fv:return "[object Set]";case Vv:return "[object WeakMap]"}return t});var Hv=Wv,Uv=Object.prototype.hasOwnProperty;var Jv=Su.Uint8Array;function Kv(e){var t=new e.constructor(e.byteLength);return new Jv(t).set(new Jv(e)),t}var Gv=/\w*$/;var Qv=Cu?Cu.prototype:void 0,Yv=Qv?Qv.valueOf:void 0;function Xv(e,t){var n=t?Kv(e.buffer):e.buffer;return new e.constructor(n,e.byteOffset,e.length)}function Zv(e,t,n){var r,i=e.constructor;switch(t){case"[object ArrayBuffer]":return Kv(e);case"[object Boolean]":case"[object Date]":return new i(+e);case"[object DataView]":return function(e,t){var n=t?Kv(e.buffer):e.buffer;return new e.constructor(n,e.byteOffset,e.byteLength)}(e,n);case"[object Float32Array]":case"[object Float64Array]":case"[object Int8Array]":case"[object Int16Array]":case"[object Int32Array]":case"[object Uint8Array]":case"[object Uint8ClampedArray]":case"[object Uint16Array]":case"[object Uint32Array]":return Xv(e,n);case"[object Map]":case"[object Set]":return new i;case"[object Number]":case"[object String]":return new i(e);case"[object RegExp]":return function(e){var t=new e.constructor(e.source,Gv.exec(e));return t.lastIndex=e.lastIndex,t}(e);case"[object Symbol]":return r=e,Yv?Object(Yv.call(r)):{}}}function ep(e){return "function"!=typeof e.constructor||Nf(e)?{}:jl(Xh(e))}var tp=Zf&&Zf.isMap,np=tp?Kf(tp):function(e){return Tu(e)&&"[object Map]"==Hv(e)};var rp=Zf&&Zf.isSet,ip=rp?Kf(rp):function(e){return Tu(e)&&"[object Set]"==Hv(e)},op={};function ap(e,t,n,r,i,o){var a,s=1&t,c=2&t,u=4&t;if(n&&(a=i?n(e,r,i,o):n(e)),void 0!==a)return a;if(!Ju(e))return e;var l=Du(e);if(l){if(a=function(e){var t=e.length,n=new e.constructor(t);return t&&"string"==typeof e[0]&&Uv.call(e,"index")&&(n.index=e.index,n.input=e.input),n}(e),!s)return zl(e,a)}else {var f=Hv(e),h="[object Function]"==f||"[object GeneratorFunction]"==f;if(Uf(e))return Sv(e,s);if("[object Object]"==f||"[object Arguments]"==f||h&&!i){if(a=c||h?{}:ep(e),!s)return c?function(e,t){return $f(e,Pv(e),t)}(e,function(e,t){return e&&$f(t,vh(t),e)}(a,e)):function(e,t){return $f(e,Ev(e),t)}(e,bv(a,e))}else {if(!op[f])return i?e:{};a=Zv(e,f,s);}}o||(o=new yv);var d=o.get(e);if(d)return d;o.set(e,a),ip(e)?e.forEach((function(r){a.add(ap(r,t,n,r,e,o));})):np(e)&&e.forEach((function(r,i){a.set(i,ap(r,t,n,i,e,o));}));var v=l?void 0:(u?c?Nv:Rv:c?vh:ch)(e);return nf(v||e,(function(r,i){v&&(r=e[i=r]),Cf(a,i,ap(r,t,n,i,e,o));})),a}op["[object Arguments]"]=op["[object Array]"]=op["[object ArrayBuffer]"]=op["[object DataView]"]=op["[object Boolean]"]=op["[object Date]"]=op["[object Float32Array]"]=op["[object Float64Array]"]=op["[object Int8Array]"]=op["[object Int16Array]"]=op["[object Int32Array]"]=op["[object Map]"]=op["[object Number]"]=op["[object Object]"]=op["[object RegExp]"]=op["[object Set]"]=op["[object String]"]=op["[object Symbol]"]=op["[object Uint8Array]"]=op["[object Uint8ClampedArray]"]=op["[object Uint16Array]"]=op["[object Uint32Array]"]=!0,op["[object Error]"]=op["[object Function]"]=op["[object WeakMap]"]=!1;function sp(e){return ap(e,4)}function cp(e){return ap(e,5)}function up(e,t){return ap(e,5,t="function"==typeof t?t:void 0)}function lp(e,t){return ap(e,4,t="function"==typeof t?t:void 0)}function fp(){return new Bl(this.value(),this.__chain__)}function hp(e){for(var t=-1,n=null==e?0:e.length,r=0,i=[];++t<n;){var o=e[t];o&&(i[r++]=o);}return i}function dp(){var e=arguments.length;if(!e)return [];for(var t=Array(e-1),n=arguments[0],r=e;r--;)t[r-1]=arguments[r];return Hh(Du(n)?zl(n):[n],Kh(t,1))}function vp(e){var t=-1,n=null==e?0:e.length;for(this.__data__=new Th;++t<n;)this.add(e[t]);}function pp(e,t){for(var n=-1,r=null==e?0:e.length;++n<r;)if(t(e[n],n,e))return !0;return !1}function mp(e,t){return e.has(t)}vp.prototype.add=vp.prototype.push=function(e){return this.__data__.set(e,"__lodash_hash_undefined__"),this},vp.prototype.has=function(e){return this.__data__.has(e)};function gp(e,t,n,r,i,o){var a=1&n,s=e.length,c=t.length;if(s!=c&&!(a&&c>s))return !1;var u=o.get(e),l=o.get(t);if(u&&l)return u==t&&l==e;var f=-1,h=!0,d=2&n?new vp:void 0;for(o.set(e,t),o.set(t,e);++f<s;){var v=e[f],p=t[f];if(r)var m=a?r(p,v,f,t,e,o):r(v,p,f,e,t,o);if(void 0!==m){if(m)continue;h=!1;break}if(d){if(!pp(t,(function(e,t){if(!mp(d,t)&&(v===e||i(v,e,n,r,o)))return d.push(t)}))){h=!1;break}}else if(v!==p&&!i(v,p,n,r,o)){h=!1;break}}return o.delete(e),o.delete(t),h}function yp(e){var t=-1,n=Array(e.size);return e.forEach((function(e,r){n[++t]=[r,e];})),n}function bp(e){var t=-1,n=Array(e.size);return e.forEach((function(e){n[++t]=e;})),n}var wp=Cu?Cu.prototype:void 0,xp=wp?wp.valueOf:void 0;var kp=Object.prototype.hasOwnProperty;var jp="[object Object]",Sp=Object.prototype.hasOwnProperty;function Cp(e,t,n,r,i,o){var a=Du(e),s=Du(t),c=a?"[object Array]":Hv(e),u=s?"[object Array]":Hv(t),l=(c="[object Arguments]"==c?jp:c)==jp,f=(u="[object Arguments]"==u?jp:u)==jp,h=c==u;if(h&&Uf(e)){if(!Uf(t))return !1;a=!0,l=!1;}if(h&&!l)return o||(o=new yv),a||th(e)?gp(e,t,n,r,i,o):function(e,t,n,r,i,o,a){switch(n){case"[object DataView]":if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return !1;e=e.buffer,t=t.buffer;case"[object ArrayBuffer]":return !(e.byteLength!=t.byteLength||!o(new Jv(e),new Jv(t)));case"[object Boolean]":case"[object Date]":case"[object Number]":return jf(+e,+t);case"[object Error]":return e.name==t.name&&e.message==t.message;case"[object RegExp]":case"[object String]":return e==t+"";case"[object Map]":var s=yp;case"[object Set]":var c=1&r;if(s||(s=bp),e.size!=t.size&&!c)return !1;var u=a.get(e);if(u)return u==t;r|=2,a.set(e,t);var l=gp(s(e),s(t),r,i,o,a);return a.delete(e),l;case"[object Symbol]":if(xp)return xp.call(e)==xp.call(t)}return !1}(e,t,c,n,r,i,o);if(!(1&n)){var d=l&&Sp.call(e,"__wrapped__"),v=f&&Sp.call(t,"__wrapped__");if(d||v){var p=d?e.value():e,m=v?t.value():t;return o||(o=new yv),i(p,m,n,r,o)}}return !!h&&(o||(o=new yv),function(e,t,n,r,i,o){var a=1&n,s=Rv(e),c=s.length;if(c!=Rv(t).length&&!a)return !1;for(var u=c;u--;){var l=s[u];if(!(a?l in t:kp.call(t,l)))return !1}var f=o.get(e),h=o.get(t);if(f&&h)return f==t&&h==e;var d=!0;o.set(e,t),o.set(t,e);for(var v=a;++u<c;){var p=e[l=s[u]],m=t[l];if(r)var g=a?r(m,p,l,t,e,o):r(p,m,l,e,t,o);if(!(void 0===g?p===m||i(p,m,n,r,o):g)){d=!1;break}v||(v="constructor"==l);}if(d&&!v){var y=e.constructor,b=t.constructor;y==b||!("constructor"in e)||!("constructor"in t)||"function"==typeof y&&y instanceof y&&"function"==typeof b&&b instanceof b||(d=!1);}return o.delete(e),o.delete(t),d}(e,t,n,r,i,o))}function $p(e,t,n,r,i){return e===t||(null==e||null==t||!Tu(e)&&!Tu(t)?e!=e&&t!=t:Cp(e,t,n,r,$p,i))}function _p(e,t,n,r){var i=n.length,o=i,a=!r;if(null==e)return !o;for(e=Object(e);i--;){var s=n[i];if(a&&s[2]?s[1]!==e[s[0]]:!(s[0]in e))return !1}for(;++i<o;){var c=(s=n[i])[0],u=e[c],l=s[1];if(a&&s[2]){if(void 0===u&&!(c in e))return !1}else {var f=new yv;if(r)var h=r(u,l,c,e,t,f);if(!(void 0===h?$p(l,u,3,r,f):h))return !1}}return !0}function Op(e){return e==e&&!Ju(e)}function Mp(e){for(var t=ch(e),n=t.length;n--;){var r=t[n],i=e[r];t[n]=[r,i,Op(i)];}return t}function Ep(e,t){return function(n){return null!=n&&(n[e]===t&&(void 0!==t||e in Object(n)))}}function Ap(e){var t=Mp(e);return 1==t.length&&t[0][2]?Ep(t[0][0],t[0][1]):function(n){return n===e||_p(n,e,t)}}function Pp(e,t){return null!=e&&t in Object(e)}function Tp(e,t,n){for(var r=-1,i=(t=zh(t,e)).length,o=!1;++r<i;){var a=qh(t[r]);if(!(o=null!=e&&n(e,a)))break;e=e[a];}return o||++r!=i?o:!!(i=null==e?0:e.length)&&Ef(i)&&df(a,i)&&(Du(e)||qf(e))}function Rp(e,t){return null!=e&&Tp(e,t,Pp)}function Np(e,t){return jh(e)&&Op(t)?Ep(qh(e),t):function(n){var r=Vh(n,e);return void 0===r&&r===t?Rp(n,e):$p(t,r,3)}}function Ip(e){return function(t){return null==t?void 0:t[e]}}function Dp(e){return jh(e)?Ip(qh(e)):function(e){return function(t){return Fh(t,e)}}(e)}function Lp(e){return "function"==typeof e?e:null==e?nl:"object"==Ji(e)?Du(e)?Np(e[0],e[1]):Ap(e):Dp(e)}function Bp(e){var t=null==e?0:e.length,n=Lp;return e=t?Iu(e,(function(e){if("function"!=typeof e[1])throw new TypeError("Expected a function");return [n(e[0]),e[1]]})):[],Mf((function(n){for(var r=-1;++r<t;){var i=e[r];if(Cl(i[0],this,n))return Cl(i[1],this,n)}}))}function zp(e,t,n){var r=n.length;if(null==e)return !r;for(e=Object(e);r--;){var i=n[r],o=t[i],a=e[i];if(void 0===a&&!(i in e)||!o(a))return !1}return !0}function qp(e){return function(e){var t=ch(e);return function(n){return zp(n,e,t)}}(ap(e,1))}function Fp(e,t){return null==t||zp(e,t,ch(t))}function Vp(e,t,n,r){for(var i=-1,o=null==e?0:e.length;++i<o;){var a=e[i];t(r,a,n(a),e);}return r}function Wp(e){return function(t,n,r){for(var i=-1,o=Object(t),a=r(t),s=a.length;s--;){var c=a[e?s:++i];if(!1===n(o[c],c,o))break}return t}}var Hp=Wp();function Up(e,t){return e&&Hp(e,t,ch)}function Jp(e,t){return function(n,r){if(null==n)return n;if(!Af(n))return e(n,r);for(var i=n.length,o=t?i:-1,a=Object(n);(t?o--:++o<i)&&!1!==r(a[o],o,a););return n}}var Kp=Jp(Up);function Gp(e,t,n,r){return Kp(e,(function(e,i,o){t(r,e,n(e),o);})),r}function Qp(e,t){return function(n,r){var i=Du(n)?Vp:Gp,o=t?t():{};return i(n,e,Lp(r),o)}}var Yp=Object.prototype.hasOwnProperty,Xp=Qp((function(e,t,n){Yp.call(e,n)?++e[n]:kf(e,n,1);})),Zp=Xp;function em(e,t){var n=jl(e);return null==t?n:bv(n,t)}function tm(e,t,n){var r=wf(e,8,void 0,void 0,void 0,void 0,void 0,t=n?void 0:t);return r.placeholder=tm.placeholder,r}tm.placeholder={};function nm(e,t,n){var r=wf(e,16,void 0,void 0,void 0,void 0,void 0,t=n?void 0:t);return r.placeholder=nm.placeholder,r}nm.placeholder={};var rm=function(){return Su.Date.now()},im=Math.max,om=Math.min;function am(e,t,n){var r,i,o,a,s,c,u=0,l=!1,f=!1,h=!0;if("function"!=typeof e)throw new TypeError("Expected a function");function d(t){var n=r,o=i;return r=i=void 0,u=t,a=e.apply(o,n)}function v(e){return u=e,s=setTimeout(m,t),l?d(e):a}function p(e){var n=e-c;return void 0===c||n>=t||n<0||f&&e-u>=o}function m(){var e=rm();if(p(e))return g(e);s=setTimeout(m,function(e){var n=t-(e-c);return f?om(n,o-(e-u)):n}(e));}function g(e){return s=void 0,h&&r?d(e):(r=i=void 0,a)}function y(){var e=rm(),n=p(e);if(r=arguments,i=this,c=e,n){if(void 0===s)return v(c);if(f)return clearTimeout(s),s=setTimeout(m,t),d(c)}return void 0===s&&(s=setTimeout(m,t)),a}return t=Xu(t)||0,Ju(n)&&(l=!!n.leading,o=(f="maxWait"in n)?im(Xu(n.maxWait)||0,t):o,h="trailing"in n?!!n.trailing:h),y.cancel=function(){void 0!==s&&clearTimeout(s),u=0,r=c=i=s=void 0;},y.flush=function(){return void 0===s?a:g(rm())},y}function sm(e,t){return null==e||e!=e?t:e}var cm=Object.prototype,um=cm.hasOwnProperty,lm=Mf((function(e,t){e=Object(e);var n=-1,r=t.length,i=r>2?t[2]:void 0;for(i&&Pf(t[0],t[1],i)&&(r=1);++n<r;)for(var o=t[n],a=vh(o),s=-1,c=a.length;++s<c;){var u=a[s],l=e[u];(void 0===l||jf(l,cm[u])&&!um.call(e,u))&&(e[u]=o[u]);}return e})),fm=lm;function hm(e,t,n){(void 0!==n&&!jf(e[t],n)||void 0===n&&!(t in e))&&kf(e,t,n);}function dm(e){return Tu(e)&&Af(e)}function vm(e,t){if(("constructor"!==t||"function"!=typeof e[t])&&"__proto__"!=t)return e[t]}function pm(e){return $f(e,vh(e))}function mm(e,t,n,r,i){e!==t&&Hp(t,(function(o,a){if(i||(i=new yv),Ju(o))!function(e,t,n,r,i,o,a){var s=vm(e,n),c=vm(t,n),u=a.get(c);if(u)hm(e,n,u);else {var l=o?o(s,c,n+"",e,t,a):void 0,f=void 0===l;if(f){var h=Du(c),d=!h&&Uf(c),v=!h&&!d&&th(c);l=c,h||d||v?Du(s)?l=s:dm(s)?l=zl(s):d?(f=!1,l=Sv(c,!0)):v?(f=!1,l=Xv(c,!0)):l=[]:id(c)||qf(c)?(l=s,qf(s)?l=pm(s):Ju(s)&&!rl(s)||(l=ep(c))):f=!1;}f&&(a.set(c,l),i(l,c,r,o,a),a.delete(c)),hm(e,n,l);}}(e,t,a,n,mm,r,i);else {var s=r?r(vm(e,a),o,a+"",e,t,i):void 0;void 0===s&&(s=o),hm(e,a,s);}}),vh);}function gm(e,t,n,r,i,o){return Ju(e)&&Ju(t)&&(o.set(t,e),mm(e,t,void 0,gm,o),o.delete(t)),e}var ym=Tf((function(e,t,n,r){mm(e,t,n,r);})),bm=ym,wm=Mf((function(e){return e.push(void 0,gm),Cl(bm,void 0,e)}));function xm(e,t,n){if("function"!=typeof e)throw new TypeError("Expected a function");return setTimeout((function(){e.apply(void 0,n);}),t)}var km=Mf((function(e,t){return xm(e,1,t)})),jm=km,Sm=Mf((function(e,t,n){return xm(e,Xu(t)||0,n)})),Cm=Sm;function $m(e,t,n){for(var r=-1,i=null==e?0:e.length;++r<i;)if(n(t,e[r]))return !0;return !1}function _m(e,t,n,r){var i=-1,o=sf,a=!0,s=e.length,c=[],u=t.length;if(!s)return c;n&&(t=Iu(t,Kf(n))),r?(o=$m,a=!1):t.length>=200&&(o=mp,a=!1,t=new vp(t));e:for(;++i<s;){var l=e[i],f=null==n?l:n(l);if(l=r||0!==l?l:0,a&&f==f){for(var h=u;h--;)if(t[h]===f)continue e;c.push(l);}else o(t,f,r)||c.push(l);}return c}var Om=Mf((function(e,t){return dm(e)?_m(e,Kh(t,1,dm,!0)):[]})),Mm=Om;function Em(e){var t=null==e?0:e.length;return t?e[t-1]:void 0}var Am=Mf((function(e,t){var n=Em(t);return dm(n)&&(n=void 0),dm(e)?_m(e,Kh(t,1,dm,!0),Lp(n)):[]})),Pm=Am,Tm=Mf((function(e,t){var n=Em(t);return dm(n)&&(n=void 0),dm(e)?_m(e,Kh(t,1,dm,!0),void 0,n):[]})),Rm=Tm,Nm=qu((function(e,t){return e/t}),1);function Im(e,t,n){var r=null==e?0:e.length;return r?pd(e,(t=n||void 0===t?1:el(t))<0?0:t,r):[]}function Dm(e,t,n){var r=null==e?0:e.length;return r?pd(e,0,(t=r-(t=n||void 0===t?1:el(t)))<0?0:t):[]}function Lm(e,t,n,r){for(var i=e.length,o=r?i:-1;(r?o--:++o<i)&&t(e[o],o,e););return n?pd(e,r?0:o,r?o+1:i):pd(e,r?o+1:0,r?i:o)}function Bm(e,t){return e&&e.length?Lm(e,Lp(t),!0,!0):[]}function zm(e,t){return e&&e.length?Lm(e,Lp(t),!0):[]}function qm(e){return "function"==typeof e?e:nl}function Fm(e,t){return (Du(e)?nf:Kp)(e,qm(t))}function Vm(e,t){for(var n=null==e?0:e.length;n--&&!1!==t(e[n],n,e););return e}var Wm=Wp(!0);function Hm(e,t){return e&&Wm(e,t,ch)}var Um=Jp(Hm,!0);function Jm(e,t){return (Du(e)?Vm:Um)(e,qm(t))}function Km(e,t,n){e=Bh(e),t=zu(t);var r=e.length,i=n=void 0===n?r:mv(el(n),0,r);return (n-=t.length)>=0&&e.slice(n,i)==t}function Gm(e){return function(t){var n=Hv(t);return "[object Map]"==n?yp(t):"[object Set]"==n?function(e){var t=-1,n=Array(e.size);return e.forEach((function(e){n[++t]=[e,e];})),n}(t):function(e,t){return Iu(t,(function(t){return [t,e[t]]}))}(t,e(t))}}var Qm=Gm(ch),Ym=Gm(vh),Xm=Rd({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}),Zm=/[&<>"']/g,eg=RegExp(Zm.source);function tg(e){return (e=Bh(e))&&eg.test(e)?e.replace(Zm,Xm):e}var ng=/[\\^$.*+?()[\]{}|]/g,rg=RegExp(ng.source);function ig(e){return (e=Bh(e))&&rg.test(e)?e.replace(ng,"\\$&"):e}function og(e,t){for(var n=-1,r=null==e?0:e.length;++n<r;)if(!t(e[n],n,e))return !1;return !0}function ag(e,t){var n=!0;return Kp(e,(function(e,r,i){return n=!!t(e,r,i)})),n}function sg(e,t,n){var r=Du(e)?og:ag;return n&&Pf(e,t,n)&&(t=void 0),r(e,Lp(t))}function cg(e){return e?mv(el(e),0,4294967295):0}function ug(e,t,n,r){var i=null==e?0:e.length;return i?(n&&"number"!=typeof n&&Pf(e,t,n)&&(n=0,r=i),function(e,t,n,r){var i=e.length;for((n=el(n))<0&&(n=-n>i?0:i+n),(r=void 0===r||r>i?i:el(r))<0&&(r+=i),r=n>r?0:cg(r);n<r;)e[n++]=t;return e}(e,t,n,r)):[]}function lg(e,t){var n=[];return Kp(e,(function(e,r,i){t(e,r,i)&&n.push(e);})),n}function fg(e,t){return (Du(e)?Cv:lg)(e,Lp(t))}function hg(e){return function(t,n,r){var i=Object(t);if(!Af(t)){var o=Lp(n);t=ch(t),n=function(e){return o(i[e],e,i)};}var a=e(t,n,r);return a>-1?i[o?t[a]:a]:void 0}}var dg=Math.max;function vg(e,t,n){var r=null==e?0:e.length;if(!r)return -1;var i=null==n?0:el(n);return i<0&&(i=dg(r+i,0)),rf(e,Lp(t),i)}var pg=hg(vg);function mg(e,t,n){var r;return n(e,(function(e,n,i){if(t(e,n,i))return r=n,!1})),r}function gg(e,t){return mg(e,Lp(t),Up)}var yg=Math.max,bg=Math.min;function wg(e,t,n){var r=null==e?0:e.length;if(!r)return -1;var i=r-1;return void 0!==n&&(i=el(n),i=n<0?yg(r+i,0):bg(i,r-1)),rf(e,Lp(t),i,!0)}var xg=hg(wg);function kg(e,t){return mg(e,Lp(t),Hm)}function jg(e){return e&&e.length?e[0]:void 0}function Sg(e,t){var n=-1,r=Af(e)?Array(e.length):[];return Kp(e,(function(e,i,o){r[++n]=t(e,i,o);})),r}function Cg(e,t){return (Du(e)?Iu:Sg)(e,Lp(t))}function $g(e,t){return Kh(Cg(e,t),1)}function _g(e,t){return Kh(Cg(e,t),Infinity)}function Og(e,t,n){return n=void 0===n?1:el(n),Kh(Cg(e,t),n)}function Mg(e){return (null==e?0:e.length)?Kh(e,Infinity):[]}function Eg(e,t){return (null==e?0:e.length)?Kh(e,t=void 0===t?1:el(t)):[]}function Ag(e){return wf(e,512)}var Pg=lv("floor");function Tg(e){return Qh((function(t){var n=t.length,r=n,i=Bl.prototype.thru;for(e&&t.reverse();r--;){var o=t[r];if("function"!=typeof o)throw new TypeError("Expected a function");if(i&&!a&&"wrapper"==Ll(o))var a=new Bl([],!0);}for(r=a?r:n;++r<n;){var s=Ll(o=t[r]),c="wrapper"==s?Nl(o):void 0;a=c&&Wl(c[0])&&424==c[1]&&!c[4].length&&1==c[9]?a[Ll(c[0])].apply(a,c[3]):1==o.length&&Wl(o)?a[s]():a.thru(o);}return function(){var e=arguments,r=e[0];if(a&&1==e.length&&Du(r))return a.plant(r).value();for(var i=0,o=n?t[i].apply(this,e):r;++i<n;)o=t[i].call(this,o);return o}}))}var Rg=Tg(),Ng=Tg(!0);function Ig(e,t){return null==e?e:Hp(e,qm(t),vh)}function Dg(e,t){return null==e?e:Wm(e,qm(t),vh)}function Lg(e,t){return e&&Up(e,qm(t))}function Bg(e,t){return e&&Hm(e,qm(t))}function zg(e){for(var t=-1,n=null==e?0:e.length,r={};++t<n;){var i=e[t];r[i[0]]=i[1];}return r}function qg(e,t){return Cv(t,(function(t){return rl(e[t])}))}function Fg(e){return null==e?[]:qg(e,ch(e))}function Vg(e){return null==e?[]:qg(e,vh(e))}var Wg=Object.prototype.hasOwnProperty,Hg=Qp((function(e,t,n){Wg.call(e,n)?e[n].push(t):kf(e,n,[t]);})),Ug=Hg;function Jg(e,t){return e>t}function Kg(e){return function(t,n){return "string"==typeof t&&"string"==typeof n||(t=Xu(t),n=Xu(n)),e(t,n)}}var Gg=Kg(Jg),Qg=Kg((function(e,t){return e>=t})),Yg=Object.prototype.hasOwnProperty;function Xg(e,t){return null!=e&&Yg.call(e,t)}function Zg(e,t){return null!=e&&Tp(e,t,Xg)}var ey=Math.max,ty=Math.min;function ny(e,t,n){return t=Zu(t),void 0===n?(n=t,t=0):n=Zu(n),function(e,t,n){return e>=ty(t,n)&&e<ey(t,n)}(e=Xu(e),t,n)}function ry(e){return "string"==typeof e||!Du(e)&&Tu(e)&&"[object String]"==Pu(e)}function iy(e,t){return Iu(t,(function(t){return e[t]}))}function oy(e){return null==e?[]:iy(e,ch(e))}var ay=Math.max;function sy(e,t,n,r){e=Af(e)?e:oy(e),n=n&&!r?el(n):0;var i=e.length;return n<0&&(n=ay(i+n,0)),ry(e)?n<=i&&e.indexOf(t,n)>-1:!!i&&af(e,t,n)>-1}var cy=Math.max;function uy(e,t,n){var r=null==e?0:e.length;if(!r)return -1;var i=null==n?0:el(n);return i<0&&(i=cy(r+i,0)),af(e,t,i)}function ly(e){return (null==e?0:e.length)?pd(e,0,-1):[]}var fy=Math.min;function hy(e,t,n){for(var r=n?$m:sf,i=e[0].length,o=e.length,a=o,s=Array(o),c=1/0,u=[];a--;){var l=e[a];a&&t&&(l=Iu(l,Kf(t))),c=fy(l.length,c),s[a]=!n&&(t||i>=120&&l.length>=120)?new vp(a&&l):void 0;}l=e[0];var f=-1,h=s[0];e:for(;++f<i&&u.length<c;){var d=l[f],v=t?t(d):d;if(d=n||0!==d?d:0,!(h?mp(h,v):r(u,v,n))){for(a=o;--a;){var p=s[a];if(!(p?mp(p,v):r(e[a],v,n)))continue e}h&&h.push(v),u.push(d);}}return u}function dy(e){return dm(e)?e:[]}var vy=Mf((function(e){var t=Iu(e,dy);return t.length&&t[0]===e[0]?hy(t):[]})),py=Mf((function(e){var t=Em(e),n=Iu(e,dy);return t===Em(n)?t=void 0:n.pop(),n.length&&n[0]===e[0]?hy(n,Lp(t)):[]})),my=py,gy=Mf((function(e){var t=Em(e),n=Iu(e,dy);return (t="function"==typeof t?t:void 0)&&n.pop(),n.length&&n[0]===e[0]?hy(n,void 0,t):[]}));function yy(e,t){return function(n,r){return function(e,t,n,r){return Up(e,(function(e,i,o){t(r,n(e),i,o);})),r}(n,e,t(r),{})}}var by=Object.prototype.toString,wy=yy((function(e,t,n){null!=t&&"function"!=typeof t.toString&&(t=by.call(t)),e[t]=n;}),Yl(nl)),xy=wy,ky=Object.prototype,jy=ky.hasOwnProperty,Sy=ky.toString,Cy=yy((function(e,t,n){null!=t&&"function"!=typeof t.toString&&(t=Sy.call(t)),jy.call(e,t)?e[t].push(n):e[t]=[n];}),Lp),$y=Cy;function _y(e,t){return t.length<2?e:Fh(e,pd(t,0,-1))}function Oy(e,t,n){var r=null==(e=_y(e,t=zh(t,e)))?e:e[qh(Em(t))];return null==r?void 0:Cl(r,e,n)}var My=Mf(Oy),Ey=Mf((function(e,t,n){var r=-1,i="function"==typeof t,o=Af(e)?Array(e.length):[];return Kp(e,(function(e){o[++r]=i?Cl(t,e,n):Oy(e,t,n);})),o})),Ay=Ey;var Py=Zf&&Zf.isArrayBuffer,Ty=Py?Kf(Py):function(e){return Tu(e)&&"[object ArrayBuffer]"==Pu(e)};function Ry(e){return !0===e||!1===e||Tu(e)&&"[object Boolean]"==Pu(e)}var Ny=Zf&&Zf.isDate,Iy=Ny?Kf(Ny):function(e){return Tu(e)&&"[object Date]"==Pu(e)};function Dy(e){return Tu(e)&&1===e.nodeType&&!id(e)}var Ly=Object.prototype.hasOwnProperty;function By(e){if(null==e)return !0;if(Af(e)&&(Du(e)||"string"==typeof e||"function"==typeof e.splice||Uf(e)||th(e)||qf(e)))return !e.length;var t=Hv(e);if("[object Map]"==t||"[object Set]"==t)return !e.size;if(Nf(e))return !sh(e).length;for(var n in e)if(Ly.call(e,n))return !1;return !0}function zy(e,t){return $p(e,t)}function qy(e,t,n){var r=(n="function"==typeof n?n:void 0)?n(e,t):void 0;return void 0===r?$p(e,t,void 0,n):!!r}var Fy=Su.isFinite;function Vy(e){return "number"==typeof e&&Fy(e)}function Wy(e){return "number"==typeof e&&e==el(e)}function Hy(e,t){return e===t||_p(e,t,Mp(t))}function Uy(e,t,n){return n="function"==typeof n?n:void 0,_p(e,t,Mp(t),n)}function Jy(e){return "number"==typeof e||Tu(e)&&"[object Number]"==Pu(e)}function Ky(e){return Jy(e)&&e!=+e}var Gy=ol?rl:Ff;function Qy(e){if(Gy(e))throw new Error("Unsupported core-js use. Try https://npms.io/search?q=ponyfill.");return pl(e)}function Yy(e){return null==e}function Xy(e){return null===e}var Zy=Zf&&Zf.isRegExp,eb=Zy?Kf(Zy):function(e){return Tu(e)&&"[object RegExp]"==Pu(e)};function tb(e){return Wy(e)&&e>=-9007199254740991&&e<=9007199254740991}function nb(e){return void 0===e}function rb(e){return Tu(e)&&"[object WeakMap]"==Hv(e)}function ib(e){return Tu(e)&&"[object WeakSet]"==Pu(e)}function ob(e){return Lp("function"==typeof e?e:ap(e,1))}var ab=Array.prototype.join;function sb(e,t){return null==e?"":ab.call(e,t)}var cb=iv((function(e,t,n){return e+(n?"-":"")+t.toLowerCase()})),ub=cb,lb=Qp((function(e,t,n){kf(e,n,t);})),fb=lb;var hb=Math.max,db=Math.min;function vb(e,t,n){var r=null==e?0:e.length;if(!r)return -1;var i=r;return void 0!==n&&(i=(i=el(n))<0?hb(r+i,0):db(i,r-1)),t==t?function(e,t,n){for(var r=n+1;r--;)if(e[r]===t)return r;return r}(e,t,i):rf(e,of,i,!0)}var pb=iv((function(e,t,n){return e+(n?" ":"")+t.toLowerCase()})),mb=pb,gb=Ed("toLowerCase");function yb(e,t){return e<t}var bb=Kg(yb),wb=Kg((function(e,t){return e<=t}));function xb(e,t){var n={};return t=Lp(t),Up(e,(function(e,r,i){kf(n,t(e,r,i),e);})),n}function kb(e,t){var n={};return t=Lp(t),Up(e,(function(e,r,i){kf(n,r,t(e,r,i));})),n}function jb(e){return Ap(ap(e,1))}function Sb(e,t){return Np(e,ap(t,1))}function Cb(e,t,n){for(var r=-1,i=e.length;++r<i;){var o=e[r],a=t(o);if(null!=a&&(void 0===s?a==a&&!Ru(a):n(a,s)))var s=a,c=o;}return c}function $b(e){return e&&e.length?Cb(e,nl,Jg):void 0}function _b(e,t){return e&&e.length?Cb(e,Lp(t),Jg):void 0}function Ob(e,t){for(var n,r=-1,i=e.length;++r<i;){var o=t(e[r]);void 0!==o&&(n=void 0===n?o:n+o);}return n}function Mb(e,t){var n=null==e?0:e.length;return n?Ob(e,t)/n:NaN}function Eb(e){return Mb(e,nl)}function Ab(e,t){return Mb(e,Lp(t))}var Pb=Tf((function(e,t,n){mm(e,t,n);})),Tb=Pb,Rb=Mf((function(e,t){return function(n){return Oy(n,e,t)}})),Nb=Rb,Ib=Mf((function(e,t){return function(n){return Oy(e,n,t)}})),Db=Ib;function Lb(e){return e&&e.length?Cb(e,nl,yb):void 0}function Bb(e,t){return e&&e.length?Cb(e,Lp(t),yb):void 0}function zb(e,t,n){var r=ch(t),i=qg(t,r),o=!(Ju(n)&&"chain"in n&&!n.chain),a=rl(e);return nf(i,(function(n){var r=t[n];e[n]=r,a&&(e.prototype[n]=function(){var t=this.__chain__;if(o||t){var n=e(this.__wrapped__),i=n.__actions__=zl(this.__actions__);return i.push({func:r,args:arguments,thisArg:e}),n.__chain__=t,n}return r.apply(e,Hh([this.value()],arguments))});})),e}var qb=qu((function(e,t){return e*t}),1);function Fb(e){if("function"!=typeof e)throw new TypeError("Expected a function");return function(){var t=arguments;switch(t.length){case 0:return !e.call(this);case 1:return !e.call(this,t[0]);case 2:return !e.call(this,t[0],t[1]);case 3:return !e.call(this,t[0],t[1],t[2])}return !e.apply(this,t)}}var Vb=Cu?Cu.iterator:void 0;function Wb(e){if(!e)return [];if(Af(e))return ry(e)?Md(e):zl(e);if(Vb&&e[Vb])return function(e){for(var t,n=[];!(t=e.next()).done;)n.push(t.value);return n}(e[Vb]());var t=Hv(e);return ("[object Map]"==t?yp:"[object Set]"==t?bp:oy)(e)}function Hb(){void 0===this.__values__&&(this.__values__=Wb(this.value()));var e=this.__index__>=this.__values__.length;return {done:e,value:e?void 0:this.__values__[this.__index__++]}}function Ub(e,t){var n=e.length;if(n)return df(t+=t<0?n:0,n)?e[t]:void 0}function Jb(e,t){return e&&e.length?Ub(e,el(t)):void 0}function Kb(e){return e=el(e),Mf((function(t){return Ub(t,e)}))}function Gb(e,t){return null==(e=_y(e,t=zh(t,e)))||delete e[qh(Em(t))]}function Qb(e){return id(e)?void 0:e}var Yb=Qh((function(e,t){var n={};if(null==e)return n;var r=!1;t=Iu(t,(function(t){return t=zh(t,e),r||(r=t.length>1),t})),$f(e,Nv(e),n),r&&(n=ap(n,7,Qb));for(var i=t.length;i--;)Gb(n,t[i]);return n})),Xb=Yb;function Zb(e,t,n,r){if(!Ju(e))return e;for(var i=-1,o=(t=zh(t,e)).length,a=o-1,s=e;null!=s&&++i<o;){var c=qh(t[i]),u=n;if("__proto__"===c||"constructor"===c||"prototype"===c)return e;if(i!=a){var l=s[c];void 0===(u=r?r(l,c,s):void 0)&&(u=Ju(l)?l:df(t[i+1])?[]:{});}Cf(s,c,u),s=s[c];}return e}function ew(e,t,n){for(var r=-1,i=t.length,o={};++r<i;){var a=t[r],s=Fh(e,a);n(s,a)&&Zb(o,zh(a,e),s);}return o}function tw(e,t){if(null==e)return {};var n=Iu(Nv(e),(function(e){return [e]}));return t=Lp(t),ew(e,n,(function(e,n){return t(e,n[0])}))}function nw(e,t){return tw(e,Fb(Lp(t)))}function rw(e){return cd(2,e)}function iw(e,t){if(e!==t){var n=void 0!==e,r=null===e,i=e==e,o=Ru(e),a=void 0!==t,s=null===t,c=t==t,u=Ru(t);if(!s&&!u&&!o&&e>t||o&&a&&c&&!s&&!u||r&&a&&c||!n&&c||!i)return 1;if(!r&&!o&&!u&&e<t||u&&n&&i&&!r&&!o||s&&n&&i||!a&&i||!c)return -1}return 0}function ow(e,t,n){t=t.length?Iu(t,(function(e){return Du(e)?function(t){return Fh(t,1===e.length?e[0]:e)}:e})):[nl];var r=-1;t=Iu(t,Kf(Lp));var i=Sg(e,(function(e,n,i){var o=Iu(t,(function(t){return t(e)}));return {criteria:o,index:++r,value:e}}));return function(e,t){var n=e.length;for(e.sort(t);n--;)e[n]=e[n].value;return e}(i,(function(e,t){return function(e,t,n){for(var r=-1,i=e.criteria,o=t.criteria,a=i.length,s=n.length;++r<a;){var c=iw(i[r],o[r]);if(c)return r>=s?c:c*("desc"==n[r]?-1:1)}return e.index-t.index}(e,t,n)}))}function aw(e,t,n,r){return null==e?[]:(Du(t)||(t=null==t?[]:[t]),Du(n=r?void 0:n)||(n=null==n?[]:[n]),ow(e,t,n))}function sw(e){return Qh((function(t){return t=Iu(t,Kf(Lp)),Mf((function(n){var r=this;return e(t,(function(e){return Cl(e,r,n)}))}))}))}var cw=sw(Iu),uw=Mf,lw=Math.min,fw=uw((function(e,t){var n=(t=1==t.length&&Du(t[0])?Iu(t[0],Kf(Lp)):Iu(Kh(t,1),Kf(Lp))).length;return Mf((function(r){for(var i=-1,o=lw(r.length,n);++i<o;)r[i]=t[i].call(this,r[i]);return Cl(e,this,r)}))})),hw=fw,dw=sw(og),vw=sw(pp),pw=Math.floor;function mw(e,t){var n="";if(!e||t<1||t>9007199254740991)return n;do{t%2&&(n+=e),(t=pw(t/2))&&(e+=e);}while(t);return n}var gw=Ip("length"),yw="[\\ud800-\\udfff]",bw="[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]",ww="\\ud83c[\\udffb-\\udfff]",xw="[^\\ud800-\\udfff]",kw="(?:\\ud83c[\\udde6-\\uddff]){2}",jw="[\\ud800-\\udbff][\\udc00-\\udfff]",Sw="(?:"+bw+"|"+ww+")"+"?",Cw="[\\ufe0e\\ufe0f]?"+Sw+("(?:\\u200d(?:"+[xw,kw,jw].join("|")+")[\\ufe0e\\ufe0f]?"+Sw+")*"),$w="(?:"+[xw+bw+"?",bw,kw,jw,yw].join("|")+")",_w=RegExp(ww+"(?="+ww+")|"+$w+Cw,"g");function Ow(e){return yd(e)?function(e){for(var t=_w.lastIndex=0;_w.test(e);)++t;return t}(e):gw(e)}var Mw=Math.ceil;function Ew(e,t){var n=(t=void 0===t?" ":zu(t)).length;if(n<2)return n?mw(t,e):t;var r=mw(t,Mw(e/Ow(t)));return yd(t)?md(Md(r),0,e).join(""):r.slice(0,e)}var Aw=Math.ceil,Pw=Math.floor;function Tw(e,t,n){e=Bh(e);var r=(t=el(t))?Ow(e):0;if(!t||r>=t)return e;var i=(t-r)/2;return Ew(Pw(i),n)+e+Ew(Aw(i),n)}function Rw(e,t,n){e=Bh(e);var r=(t=el(t))?Ow(e):0;return t&&r<t?e+Ew(t-r,n):e}function Nw(e,t,n){e=Bh(e);var r=(t=el(t))?Ow(e):0;return t&&r<t?Ew(t-r,n)+e:e}var Iw=/^\s+/,Dw=Su.parseInt;function Lw(e,t,n){return n||null==t?t=0:t&&(t=+t),Dw(Bh(e).replace(Iw,""),t||0)}var Bw=Mf((function(e,t){return wf(e,32,void 0,t,mf(t,ff(Bw)))}));Bw.placeholder={};var zw=Bw,qw=Mf((function(e,t){return wf(e,64,void 0,t,mf(t,ff(qw)))}));qw.placeholder={};var Fw=qw,Vw=Qp((function(e,t,n){e[n?0:1].push(t);}),(function(){return [[],[]]})),Ww=Vw;var Hw=Qh((function(e,t){return null==e?{}:function(e,t){return ew(e,t,(function(t,n){return Rp(e,n)}))}(e,t)})),Uw=Hw;function Jw(e){for(var t,n=this;n instanceof Al;){var r=ql(n);r.__index__=0,r.__values__=void 0,t?i.__wrapped__=r:t=r;var i=r;n=n.__wrapped__;}return i.__wrapped__=e,t}function Kw(e){return function(t){return null==e?void 0:Fh(e,t)}}function Gw(e,t,n,r){for(var i=n-1,o=e.length;++i<o;)if(r(e[i],t))return i;return -1}var Qw=Array.prototype.splice;function Yw(e,t,n,r){var i=r?Gw:af,o=-1,a=t.length,s=e;for(e===t&&(t=zl(t)),n&&(s=Iu(e,Kf(n)));++o<a;)for(var c=0,u=t[o],l=n?n(u):u;(c=i(s,l,c,r))>-1;)s!==e&&Qw.call(s,c,1),Qw.call(e,c,1);return e}function Xw(e,t){return e&&e.length&&t&&t.length?Yw(e,t):e}var Zw=Mf(Xw);function ex(e,t,n){return e&&e.length&&t&&t.length?Yw(e,t,Lp(n)):e}function tx(e,t,n){return e&&e.length&&t&&t.length?Yw(e,t,void 0,n):e}var nx=Array.prototype.splice;function rx(e,t){for(var n=e?t.length:0,r=n-1;n--;){var i=t[n];if(n==r||i!==o){var o=i;df(i)?nx.call(e,i,1):Gb(e,i);}}return e}var ix=Qh((function(e,t){var n=null==e?0:e.length,r=Wh(e,t);return rx(e,Iu(t,(function(e){return df(e,n)?+e:e})).sort(iw)),r})),ox=ix,ax=Math.floor,sx=Math.random;function cx(e,t){return e+ax(sx()*(t-e+1))}var ux=parseFloat,lx=Math.min,fx=Math.random;function hx(e,t,n){if(n&&"boolean"!=typeof n&&Pf(e,t,n)&&(t=n=void 0),void 0===n&&("boolean"==typeof t?(n=t,t=void 0):"boolean"==typeof e&&(n=e,e=void 0)),void 0===e&&void 0===t?(e=0,t=1):(e=Zu(e),void 0===t?(t=e,e=0):t=Zu(t)),e>t){var r=e;e=t,t=r;}if(n||e%1||t%1){var i=fx();return lx(e+i*(t-e+ux("1e-"+((i+"").length-1))),t)}return cx(e,t)}var dx=Math.ceil,vx=Math.max;function px(e){return function(t,n,r){return r&&"number"!=typeof r&&Pf(t,n,r)&&(n=r=void 0),t=Zu(t),void 0===n?(n=t,t=0):n=Zu(n),function(e,t,n,r){for(var i=-1,o=vx(dx((t-e)/(n||1)),0),a=Array(o);o--;)a[r?o:++i]=e,e+=n;return a}(t,n,r=void 0===r?t<n?1:-1:Zu(r),e)}}var mx=px(),gx=px(!0),yx=Qh((function(e,t){return wf(e,256,void 0,void 0,void 0,t)})),bx=yx;function wx(e,t,n,r,i){return i(e,(function(e,i,o){n=r?(r=!1,e):t(n,e,i,o);})),n}function xx(e,t,n){var r=Du(e)?Td:wx,i=arguments.length<3;return r(e,Lp(t),n,i,Kp)}function kx(e,t,n,r){var i=null==e?0:e.length;for(r&&i&&(n=e[--i]);i--;)n=t(n,e[i],i,e);return n}function jx(e,t,n){var r=Du(e)?kx:wx,i=arguments.length<3;return r(e,Lp(t),n,i,Um)}function Sx(e,t){return (Du(e)?Cv:lg)(e,Fb(Lp(t)))}function Cx(e,t){var n=[];if(!e||!e.length)return n;var r=-1,i=[],o=e.length;for(t=Lp(t);++r<o;){var a=e[r];t(a,r,e)&&(n.push(a),i.push(r));}return rx(e,i),n}function $x(e,t,n){return t=(n?Pf(e,t,n):void 0===t)?1:el(t),mw(Bh(e),t)}function _x(){var e=arguments,t=Bh(e[0]);return e.length<3?t:t.replace(e[1],e[2])}function Ox(e,t){if("function"!=typeof e)throw new TypeError("Expected a function");return Mf(e,t=void 0===t?t:el(t))}function Mx(e,t,n){var r=-1,i=(t=zh(t,e)).length;for(i||(i=1,e=void 0);++r<i;){var o=null==e?void 0:e[qh(t[r])];void 0===o&&(r=i,o=n),e=rl(o)?o.call(e):o;}return e}var Ex=Array.prototype.reverse;function Ax(e){return null==e?e:Ex.call(e)}var Px=lv("round");function Tx(e){var t=e.length;return t?e[cx(0,t-1)]:void 0}function Rx(e){return Tx(oy(e))}function Nx(e){return (Du(e)?Tx:Rx)(e)}function Ix(e,t){var n=-1,r=e.length,i=r-1;for(t=void 0===t?r:t;++n<t;){var o=cx(n,i),a=e[o];e[o]=e[n],e[n]=a;}return e.length=t,e}function Dx(e,t){return Ix(zl(e),mv(t,0,e.length))}function Lx(e,t){var n=oy(e);return Ix(n,mv(t,0,n.length))}function Bx(e,t,n){return t=(n?Pf(e,t,n):void 0===t)?1:el(t),(Du(e)?Dx:Lx)(e,t)}function zx(e,t,n){return null==e?e:Zb(e,t,n)}function qx(e,t,n,r){return r="function"==typeof r?r:void 0,null==e?e:Zb(e,t,n,r)}function Fx(e){return Ix(zl(e))}function Vx(e){return Ix(oy(e))}function Wx(e){return (Du(e)?Fx:Vx)(e)}function Hx(e){if(null==e)return 0;if(Af(e))return ry(e)?Ow(e):e.length;var t=Hv(e);return "[object Map]"==t||"[object Set]"==t?e.size:sh(e).length}function Ux(e,t,n){var r=null==e?0:e.length;return r?(n&&"number"!=typeof n&&Pf(e,t,n)?(t=0,n=r):(t=null==t?0:el(t),n=void 0===n?r:el(n)),pd(e,t,n)):[]}var Jx=iv((function(e,t,n){return e+(n?"_":"")+t.toLowerCase()})),Kx=Jx;function Gx(e,t){var n;return Kp(e,(function(e,r,i){return !(n=t(e,r,i))})),!!n}function Qx(e,t,n){var r=Du(e)?pp:Gx;return n&&Pf(e,t,n)&&(t=void 0),r(e,Lp(t))}var Yx=Mf((function(e,t){if(null==e)return [];var n=t.length;return n>1&&Pf(e,t[0],t[1])?t=[]:n>2&&Pf(t[0],t[1],t[2])&&(t=[t[0]]),ow(e,Kh(t,1),[])})),Xx=Yx,Zx=Math.floor,ek=Math.min;function tk(e,t,n,r){var i=0,o=null==e?0:e.length;if(0===o)return 0;for(var a=(t=n(t))!=t,s=null===t,c=Ru(t),u=void 0===t;i<o;){var l=Zx((i+o)/2),f=n(e[l]),h=void 0!==f,d=null===f,v=f==f,p=Ru(f);if(a)var m=r||v;else m=u?v&&(r||h):s?v&&h&&(r||!d):c?v&&h&&!d&&(r||!p):!d&&!p&&(r?f<=t:f<t);m?i=l+1:o=l;}return ek(o,4294967294)}function nk(e,t,n){var r=0,i=null==e?r:e.length;if("number"==typeof t&&t==t&&i<=2147483647){for(;r<i;){var o=r+i>>>1,a=e[o];null!==a&&!Ru(a)&&(n?a<=t:a<t)?r=o+1:i=o;}return i}return tk(e,t,nl,n)}function rk(e,t){return nk(e,t)}function ik(e,t,n){return tk(e,t,Lp(n))}function ok(e,t){var n=null==e?0:e.length;if(n){var r=nk(e,t);if(r<n&&jf(e[r],t))return r}return -1}function ak(e,t){return nk(e,t,!0)}function sk(e,t,n){return tk(e,t,Lp(n),!0)}function ck(e,t){if(null==e?0:e.length){var n=nk(e,t,!0)-1;if(jf(e[n],t))return n}return -1}function uk(e,t){for(var n=-1,r=e.length,i=0,o=[];++n<r;){var a=e[n],s=t?t(a):a;if(!n||!jf(s,c)){var c=s;o[i++]=0===a?0:a;}}return o}function lk(e){return e&&e.length?uk(e):[]}function fk(e,t){return e&&e.length?uk(e,Lp(t)):[]}function hk(e,t,n){return n&&"number"!=typeof n&&Pf(e,t,n)&&(t=n=void 0),(n=void 0===n?4294967295:n>>>0)?(e=Bh(e))&&("string"==typeof t||null!=t&&!eb(t))&&!(t=zu(t))&&yd(e)?md(Md(e),0,n):e.split(t,n):[]}var dk=Math.max;function vk(e,t){if("function"!=typeof e)throw new TypeError("Expected a function");return t=null==t?0:dk(el(t),0),Mf((function(n){var r=n[t],i=md(n,0,t);return r&&Hh(i,r),Cl(e,this,i)}))}var pk=iv((function(e,t,n){return e+(n?" ":"")+Ad(t)})),mk=pk;function gk(e,t,n){return e=Bh(e),n=null==n?0:mv(el(n),0,e.length),t=zu(t),e.slice(n,n+t.length)==t}function yk(){return {}}function bk(){return ""}function wk(){return !0}var xk=qu((function(e,t){return e-t}),0);function kk(e){return e&&e.length?Ob(e,nl):0}function jk(e,t){return e&&e.length?Ob(e,Lp(t)):0}function Sk(e){var t=null==e?0:e.length;return t?pd(e,1,t):[]}function Ck(e,t,n){return e&&e.length?pd(e,0,(t=n||void 0===t?1:el(t))<0?0:t):[]}function $k(e,t,n){var r=null==e?0:e.length;return r?pd(e,(t=r-(t=n||void 0===t?1:el(t)))<0?0:t,r):[]}function _k(e,t){return e&&e.length?Lm(e,Lp(t),!1,!0):[]}function Ok(e,t){return e&&e.length?Lm(e,Lp(t)):[]}function Mk(e,t){return t(e),e}var Ek=Object.prototype,Ak=Ek.hasOwnProperty;function Pk(e,t,n,r){return void 0===e||jf(e,Ek[n])&&!Ak.call(r,n)?t:e}var Tk={"\\":"\\","'":"'","\n":"n","\r":"r","\u2028":"u2028","\u2029":"u2029"};function Rk(e){return "\\"+Tk[e]}var Nk=/<%=([\s\S]+?)%>/g,Ik={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:Nk,variable:"",imports:{_:{escape:tg}}},Dk=/\b__p \+= '';/g,Lk=/\b(__p \+=) '' \+/g,Bk=/(__e\(.*?\)|\b__t\)) \+\n'';/g,zk=/[()=,{}\[\]\/\s]/,qk=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,Fk=/($^)/,Vk=/['\n\r\u2028\u2029\\]/g,Wk=Object.prototype.hasOwnProperty;function Hk(e,t,n){var r=Ik.imports._.templateSettings||Ik;n&&Pf(e,t,n)&&(t=void 0),e=Bh(e),t=yh({},t,r,Pk);var i,o,a=yh({},t.imports,r.imports,Pk),s=ch(a),c=iy(a,s),u=0,l=t.interpolate||Fk,f="__p += '",h=RegExp((t.escape||Fk).source+"|"+l.source+"|"+(l===Nk?qk:Fk).source+"|"+(t.evaluate||Fk).source+"|$","g"),d=Wk.call(t,"sourceURL")?"//# sourceURL="+(t.sourceURL+"").replace(/\s/g," ")+"\n":"";e.replace(h,(function(t,n,r,a,s,c){return r||(r=a),f+=e.slice(u,c).replace(Vk,Rk),n&&(i=!0,f+="' +\n__e("+n+") +\n'"),s&&(o=!0,f+="';\n"+s+";\n__p += '"),r&&(f+="' +\n((__t = ("+r+")) == null ? '' : __t) +\n'"),u=c+t.length,t})),f+="';\n";var v=Wk.call(t,"variable")&&t.variable;if(v){if(zk.test(v))throw new Error("Invalid `variable` option passed into `_.template`")}else f="with (obj) {\n"+f+"\n}\n";f=(o?f.replace(Dk,""):f).replace(Lk,"$1").replace(Bk,"$1;"),f="function("+(v||"obj")+") {\n"+(v?"":"obj || (obj = {});\n")+"var __t, __p = ''"+(i?", __e = _.escape":"")+(o?", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n":";\n")+f+"return __p\n}";var p=sd((function(){return Function(s,d+"return "+f).apply(void 0,c)}));if(p.source=f,od(p))throw p;return p}function Uk(e,t,n){var r=!0,i=!0;if("function"!=typeof e)throw new TypeError("Expected a function");return Ju(n)&&(r="leading"in n?!!n.leading:r,i="trailing"in n?!!n.trailing:i),am(e,t,{leading:r,maxWait:t,trailing:i})}function Jk(e,t){return t(e)}var Kk=Math.min;function Gk(e,t){if((e=el(e))<1||e>9007199254740991)return [];var n=4294967295,r=Kk(e,4294967295);e-=4294967295;for(var i=If(r,t=qm(t));++n<e;)t(n);return i}function Qk(){return this}function Yk(e,t){var n=e;return n instanceof Pl&&(n=n.value()),Td(t,(function(e,t){return t.func.apply(t.thisArg,Hh([e],t.args))}),n)}function Xk(){return Yk(this.__wrapped__,this.__actions__)}function Zk(e){return Bh(e).toLowerCase()}function ej(e){return Du(e)?Iu(e,qh):Ru(e)?[e]:zl(Lh(Bh(e)))}function tj(e){return e?mv(el(e),-9007199254740991,9007199254740991):0===e?e:0}function nj(e){return Bh(e).toUpperCase()}function rj(e,t,n){var r=Du(e),i=r||Uf(e)||th(e);if(t=Lp(t),null==n){var o=e&&e.constructor;n=i?r?new o:[]:Ju(e)&&rl(o)?jl(Xh(e)):{};}return (i?nf:Up)(e,(function(e,r,i){return t(n,e,r,i)})),n}function ij(e,t){for(var n=e.length;n--&&af(t,e[n],0)>-1;);return n}function oj(e,t){for(var n=-1,r=e.length;++n<r&&af(t,e[n],0)>-1;);return n}function aj(e,t,n){if((e=Bh(e))&&(n||void 0===t))return Uu(e);if(!e||!(t=zu(t)))return e;var r=Md(e),i=Md(t);return md(r,oj(r,i),ij(r,i)+1).join("")}function sj(e,t,n){if((e=Bh(e))&&(n||void 0===t))return e.slice(0,Wu(e)+1);if(!e||!(t=zu(t)))return e;var r=Md(e);return md(r,0,ij(r,Md(t))+1).join("")}var cj=/^\s+/;function uj(e,t,n){if((e=Bh(e))&&(n||void 0===t))return e.replace(cj,"");if(!e||!(t=zu(t)))return e;var r=Md(e);return md(r,oj(r,Md(t))).join("")}var lj=/\w*$/;function fj(e,t){var n=30,r="...";if(Ju(t)){var i="separator"in t?t.separator:i;n="length"in t?el(t.length):n,r="omission"in t?zu(t.omission):r;}var o=(e=Bh(e)).length;if(yd(e)){var a=Md(e);o=a.length;}if(n>=o)return e;var s=n-Ow(r);if(s<1)return r;var c=a?md(a,0,s).join(""):e.slice(0,s);if(void 0===i)return c+r;if(a&&(s+=c.length-s),eb(i)){if(e.slice(s).search(i)){var u,l=c;for(i.global||(i=RegExp(i.source,Bh(lj.exec(i))+"g")),i.lastIndex=0;u=i.exec(l);)var f=u.index;c=c.slice(0,void 0===f?s:f);}}else if(e.indexOf(zu(i),s)!=s){var h=c.lastIndexOf(i);h>-1&&(c=c.slice(0,h));}return c+r}function hj(e){return xf(e,1)}var dj=Rd({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"}),vj=/&(?:amp|lt|gt|quot|#39);/g,pj=RegExp(vj.source);function mj(e){return (e=Bh(e))&&pj.test(e)?e.replace(vj,dj):e}var gj=Lv&&1/bp(new Lv([,-0]))[1]==1/0?function(e){return new Lv(e)}:Tl,yj=gj;function bj(e,t,n){var r=-1,i=sf,o=e.length,a=!0,s=[],c=s;if(n)a=!1,i=$m;else if(o>=200){var u=t?null:yj(e);if(u)return bp(u);a=!1,i=mp,c=new vp;}else c=t?[]:s;e:for(;++r<o;){var l=e[r],f=t?t(l):l;if(l=n||0!==l?l:0,a&&f==f){for(var h=c.length;h--;)if(c[h]===f)continue e;t&&c.push(f),s.push(l);}else i(c,f,n)||(c!==s&&c.push(f),s.push(l));}return s}var wj=Mf((function(e){return bj(Kh(e,1,dm,!0))})),xj=Mf((function(e){var t=Em(e);return dm(t)&&(t=void 0),bj(Kh(e,1,dm,!0),Lp(t))})),kj=xj,jj=Mf((function(e){var t=Em(e);return t="function"==typeof t?t:void 0,bj(Kh(e,1,dm,!0),void 0,t)}));function Sj(e){return e&&e.length?bj(e):[]}function Cj(e,t){return e&&e.length?bj(e,Lp(t)):[]}function $j(e,t){return t="function"==typeof t?t:void 0,e&&e.length?bj(e,void 0,t):[]}var _j=0;function Oj(e){var t=++_j;return Bh(e)+t}function Mj(e,t){return null==e||Gb(e,t)}var Ej=Math.max;function Aj(e){if(!e||!e.length)return [];var t=0;return e=Cv(e,(function(e){if(dm(e))return t=Ej(e.length,t),!0})),If(t,(function(t){return Iu(e,Ip(t))}))}function Pj(e,t){if(!e||!e.length)return [];var n=Aj(e);return null==t?n:Iu(n,(function(e){return Cl(t,void 0,e)}))}function Tj(e,t,n,r){return Zb(e,t,n(Fh(e,t)),r)}function Rj(e,t,n){return null==e?e:Tj(e,t,qm(n))}function Nj(e,t,n,r){return r="function"==typeof r?r:void 0,null==e?e:Tj(e,t,qm(n),r)}var Ij=iv((function(e,t,n){return e+(n?" ":"")+t.toUpperCase()})),Dj=Ij;function Lj(e){return null==e?[]:iy(e,vh(e))}var Bj=Mf((function(e,t){return dm(e)?_m(e,t):[]})),zj=Bj;function qj(e,t){return zw(qm(t),e)}var Fj=Qh((function(e){var t=e.length,n=t?e[0]:0,r=this.__wrapped__,i=function(t){return Wh(t,e)};return !(t>1||this.__actions__.length)&&r instanceof Pl&&df(n)?((r=r.slice(n,+n+(t?1:0))).__actions__.push({func:Jk,args:[i],thisArg:void 0}),new Bl(r,this.__chain__).thru((function(e){return t&&!e.length&&e.push(void 0),e}))):this.thru(i)})),Vj=Fj;function Wj(){return hv(this)}function Hj(){var e=this.__wrapped__;if(e instanceof Pl){var t=e;return this.__actions__.length&&(t=new Pl(this)),(t=t.reverse()).__actions__.push({func:Jk,args:[Ax],thisArg:void 0}),new Bl(t,this.__chain__)}return this.thru(Ax)}function Uj(e,t,n){var r=e.length;if(r<2)return r?bj(e[0]):[];for(var i=-1,o=Array(r);++i<r;)for(var a=e[i],s=-1;++s<r;)s!=i&&(o[i]=_m(o[i]||a,e[s],t,n));return bj(Kh(o,1),t,n)}var Jj=Mf((function(e){return Uj(Cv(e,dm))})),Kj=Mf((function(e){var t=Em(e);return dm(t)&&(t=void 0),Uj(Cv(e,dm),Lp(t))})),Gj=Kj,Qj=Mf((function(e){var t=Em(e);return t="function"==typeof t?t:void 0,Uj(Cv(e,dm),void 0,t)})),Yj=Mf(Aj);function Xj(e,t,n){for(var r=-1,i=e.length,o=t.length,a={};++r<i;){var s=r<o?t[r]:void 0;n(a,e[r],s);}return a}function Zj(e,t){return Xj(e||[],t||[],Cf)}function eS(e,t){return Xj(e||[],t||[],Zb)}var tS=Mf((function(e){var t=e.length,n=t>1?e[t-1]:void 0;return n="function"==typeof n?(e.pop(),n):void 0,Pj(e,n)})),nS=tS,rS={chunk:pv,compact:hp,concat:dp,difference:Mm,differenceBy:Pm,differenceWith:Rm,drop:Im,dropRight:Dm,dropRightWhile:Bm,dropWhile:zm,fill:ug,findIndex:vg,findLastIndex:wg,first:jg,flatten:Gh,flattenDeep:Mg,flattenDepth:Eg,fromPairs:zg,head:jg,indexOf:uy,initial:ly,intersection:vy,intersectionBy:my,intersectionWith:gy,join:sb,last:Em,lastIndexOf:vb,nth:Jb,pull:Zw,pullAll:Xw,pullAllBy:ex,pullAllWith:tx,pullAt:ox,remove:Cx,reverse:Ax,slice:Ux,sortedIndex:rk,sortedIndexBy:ik,sortedIndexOf:ok,sortedLastIndex:ak,sortedLastIndexBy:sk,sortedLastIndexOf:ck,sortedUniq:lk,sortedUniqBy:fk,tail:Sk,take:Ck,takeRight:$k,takeRightWhile:_k,takeWhile:Ok,union:wj,unionBy:kj,unionWith:jj,uniq:Sj,uniqBy:Cj,uniqWith:$j,unzip:Aj,unzipWith:Pj,without:zj,xor:Jj,xorBy:Gj,xorWith:Qj,zip:Yj,zipObject:Zj,zipObjectDeep:eS,zipWith:nS},iS={countBy:Zp,each:Fm,eachRight:Jm,every:sg,filter:fg,find:pg,findLast:xg,flatMap:$g,flatMapDeep:_g,flatMapDepth:Og,forEach:Fm,forEachRight:Jm,groupBy:Ug,includes:sy,invokeMap:Ay,keyBy:fb,map:Cg,orderBy:aw,partition:Ww,reduce:xx,reduceRight:jx,reject:Sx,sample:Nx,sampleSize:Bx,shuffle:Wx,size:Hx,some:Qx,sortBy:Xx},oS={now:rm},aS={after:tl,ary:xf,before:cd,bind:ld,bindKey:vd,curry:tm,curryRight:nm,debounce:am,defer:jm,delay:Cm,flip:Ag,memoize:Rh,negate:Fb,once:rw,overArgs:hw,partial:zw,partialRight:Fw,rearg:bx,rest:Ox,spread:vk,throttle:Uk,unary:hj,wrap:qj},sS={castArray:sv,clone:sp,cloneDeep:cp,cloneDeepWith:up,cloneWith:lp,conformsTo:Fp,eq:jf,gt:Gg,gte:Qg,isArguments:qf,isArray:Du,isArrayBuffer:Ty,isArrayLike:Af,isArrayLikeObject:dm,isBoolean:Ry,isBuffer:Uf,isDate:Iy,isElement:Dy,isEmpty:By,isEqual:zy,isEqualWith:qy,isError:od,isFinite:Vy,isFunction:rl,isInteger:Wy,isLength:Ef,isMap:np,isMatch:Hy,isMatchWith:Uy,isNaN:Ky,isNative:Qy,isNil:Yy,isNull:Xy,isNumber:Jy,isObject:Ju,isObjectLike:Tu,isPlainObject:id,isRegExp:eb,isSafeInteger:tb,isSet:ip,isString:ry,isSymbol:Ru,isTypedArray:th,isUndefined:nb,isWeakMap:rb,isWeakSet:ib,lt:bb,lte:wb,toArray:Wb,toFinite:Zu,toInteger:el,toLength:cg,toNumber:Xu,toPlainObject:pm,toSafeInteger:tj,toString:Bh},cS={add:Fu,ceil:fv,divide:Nm,floor:Pg,max:$b,maxBy:_b,mean:Eb,meanBy:Ab,min:Lb,minBy:Bb,multiply:qb,round:Px,subtract:xk,sum:kk,sumBy:jk},uS=gv,lS=ny,fS=hx,hS={assign:fh,assignIn:mh,assignInWith:yh,assignWith:wh,at:Yh,create:em,defaults:fm,defaultsDeep:wm,entries:Qm,entriesIn:Ym,extend:mh,extendWith:yh,findKey:gg,findLastKey:kg,forIn:Ig,forInRight:Dg,forOwn:Lg,forOwnRight:Bg,functions:Fg,functionsIn:Vg,get:Vh,has:Zg,hasIn:Rp,invert:xy,invertBy:$y,invoke:My,keys:ch,keysIn:vh,mapKeys:xb,mapValues:kb,merge:Tb,mergeWith:bm,omit:Xb,omitBy:nw,pick:Uw,pickBy:tw,result:Mx,set:zx,setWith:qx,toPairs:Qm,toPairsIn:Ym,transform:rj,unset:Mj,update:Rj,updateWith:Nj,values:oy,valuesIn:Lj},dS={at:Vj,chain:hv,commit:fp,lodash:Vl,next:Hb,plant:Jw,reverse:Hj,tap:Mk,thru:Jk,toIterator:Qk,toJSON:Xk,value:Xk,valueOf:Xk,wrapperChain:Wj},vS={camelCase:av,capitalize:Pd,deburr:Ld,endsWith:Km,escape:tg,escapeRegExp:ig,kebabCase:ub,lowerCase:mb,lowerFirst:gb,pad:Tw,padEnd:Rw,padStart:Nw,parseInt:Lw,repeat:$x,replace:_x,snakeCase:Kx,split:hk,startCase:mk,startsWith:gk,template:Hk,templateSettings:Ik,toLower:Zk,toUpper:nj,trim:aj,trimEnd:sj,trimStart:uj,truncate:fj,unescape:mj,upperCase:Dj,upperFirst:Ad,words:nv},pS={attempt:sd,bindAll:hd,cond:Bp,conforms:qp,constant:Yl,defaultTo:sm,flow:Rg,flowRight:Ng,identity:nl,iteratee:ob,matches:jb,matchesProperty:Sb,method:Nb,methodOf:Db,mixin:zb,noop:Tl,nthArg:Kb,over:cw,overEvery:dw,overSome:vw,property:Dp,propertyOf:Kw,range:mx,rangeRight:gx,stubArray:$v,stubFalse:Ff,stubObject:yk,stubString:bk,stubTrue:wk,times:Gk,toPath:ej,uniqueId:Oj};var mS=Math.max,gS=Math.min;var yS=Math.min;
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */var bS,wS=Array.prototype,xS=Object.prototype.hasOwnProperty,kS=Cu?Cu.iterator:void 0,jS=Math.max,SS=Math.min,CS=function(e){return function(t,n,r){if(null==r){var i=Ju(n),o=i&&ch(n),a=o&&o.length&&qg(n,o);(a?a.length:i)||(r=n,n=t,t=this);}return e(t,n,r)}}(zb);Vl.after=aS.after,Vl.ary=aS.ary,Vl.assign=hS.assign,Vl.assignIn=hS.assignIn,Vl.assignInWith=hS.assignInWith,Vl.assignWith=hS.assignWith,Vl.at=hS.at,Vl.before=aS.before,Vl.bind=aS.bind,Vl.bindAll=pS.bindAll,Vl.bindKey=aS.bindKey,Vl.castArray=sS.castArray,Vl.chain=dS.chain,Vl.chunk=rS.chunk,Vl.compact=rS.compact,Vl.concat=rS.concat,Vl.cond=pS.cond,Vl.conforms=pS.conforms,Vl.constant=pS.constant,Vl.countBy=iS.countBy,Vl.create=hS.create,Vl.curry=aS.curry,Vl.curryRight=aS.curryRight,Vl.debounce=aS.debounce,Vl.defaults=hS.defaults,Vl.defaultsDeep=hS.defaultsDeep,Vl.defer=aS.defer,Vl.delay=aS.delay,Vl.difference=rS.difference,Vl.differenceBy=rS.differenceBy,Vl.differenceWith=rS.differenceWith,Vl.drop=rS.drop,Vl.dropRight=rS.dropRight,Vl.dropRightWhile=rS.dropRightWhile,Vl.dropWhile=rS.dropWhile,Vl.fill=rS.fill,Vl.filter=iS.filter,Vl.flatMap=iS.flatMap,Vl.flatMapDeep=iS.flatMapDeep,Vl.flatMapDepth=iS.flatMapDepth,Vl.flatten=rS.flatten,Vl.flattenDeep=rS.flattenDeep,Vl.flattenDepth=rS.flattenDepth,Vl.flip=aS.flip,Vl.flow=pS.flow,Vl.flowRight=pS.flowRight,Vl.fromPairs=rS.fromPairs,Vl.functions=hS.functions,Vl.functionsIn=hS.functionsIn,Vl.groupBy=iS.groupBy,Vl.initial=rS.initial,Vl.intersection=rS.intersection,Vl.intersectionBy=rS.intersectionBy,Vl.intersectionWith=rS.intersectionWith,Vl.invert=hS.invert,Vl.invertBy=hS.invertBy,Vl.invokeMap=iS.invokeMap,Vl.iteratee=pS.iteratee,Vl.keyBy=iS.keyBy,Vl.keys=ch,Vl.keysIn=hS.keysIn,Vl.map=iS.map,Vl.mapKeys=hS.mapKeys,Vl.mapValues=hS.mapValues,Vl.matches=pS.matches,Vl.matchesProperty=pS.matchesProperty,Vl.memoize=aS.memoize,Vl.merge=hS.merge,Vl.mergeWith=hS.mergeWith,Vl.method=pS.method,Vl.methodOf=pS.methodOf,Vl.mixin=CS,Vl.negate=Fb,Vl.nthArg=pS.nthArg,Vl.omit=hS.omit,Vl.omitBy=hS.omitBy,Vl.once=aS.once,Vl.orderBy=iS.orderBy,Vl.over=pS.over,Vl.overArgs=aS.overArgs,Vl.overEvery=pS.overEvery,Vl.overSome=pS.overSome,Vl.partial=aS.partial,Vl.partialRight=aS.partialRight,Vl.partition=iS.partition,Vl.pick=hS.pick,Vl.pickBy=hS.pickBy,Vl.property=pS.property,Vl.propertyOf=pS.propertyOf,Vl.pull=rS.pull,Vl.pullAll=rS.pullAll,Vl.pullAllBy=rS.pullAllBy,Vl.pullAllWith=rS.pullAllWith,Vl.pullAt=rS.pullAt,Vl.range=pS.range,Vl.rangeRight=pS.rangeRight,Vl.rearg=aS.rearg,Vl.reject=iS.reject,Vl.remove=rS.remove,Vl.rest=aS.rest,Vl.reverse=rS.reverse,Vl.sampleSize=iS.sampleSize,Vl.set=hS.set,Vl.setWith=hS.setWith,Vl.shuffle=iS.shuffle,Vl.slice=rS.slice,Vl.sortBy=iS.sortBy,Vl.sortedUniq=rS.sortedUniq,Vl.sortedUniqBy=rS.sortedUniqBy,Vl.split=vS.split,Vl.spread=aS.spread,Vl.tail=rS.tail,Vl.take=rS.take,Vl.takeRight=rS.takeRight,Vl.takeRightWhile=rS.takeRightWhile,Vl.takeWhile=rS.takeWhile,Vl.tap=dS.tap,Vl.throttle=aS.throttle,Vl.thru=Jk,Vl.toArray=sS.toArray,Vl.toPairs=hS.toPairs,Vl.toPairsIn=hS.toPairsIn,Vl.toPath=pS.toPath,Vl.toPlainObject=sS.toPlainObject,Vl.transform=hS.transform,Vl.unary=aS.unary,Vl.union=rS.union,Vl.unionBy=rS.unionBy,Vl.unionWith=rS.unionWith,Vl.uniq=rS.uniq,Vl.uniqBy=rS.uniqBy,Vl.uniqWith=rS.uniqWith,Vl.unset=hS.unset,Vl.unzip=rS.unzip,Vl.unzipWith=rS.unzipWith,Vl.update=hS.update,Vl.updateWith=hS.updateWith,Vl.values=hS.values,Vl.valuesIn=hS.valuesIn,Vl.without=rS.without,Vl.words=vS.words,Vl.wrap=aS.wrap,Vl.xor=rS.xor,Vl.xorBy=rS.xorBy,Vl.xorWith=rS.xorWith,Vl.zip=rS.zip,Vl.zipObject=rS.zipObject,Vl.zipObjectDeep=rS.zipObjectDeep,Vl.zipWith=rS.zipWith,Vl.entries=hS.toPairs,Vl.entriesIn=hS.toPairsIn,Vl.extend=hS.assignIn,Vl.extendWith=hS.assignInWith,CS(Vl,Vl),Vl.add=cS.add,Vl.attempt=pS.attempt,Vl.camelCase=vS.camelCase,Vl.capitalize=vS.capitalize,Vl.ceil=cS.ceil,Vl.clamp=uS,Vl.clone=sS.clone,Vl.cloneDeep=sS.cloneDeep,Vl.cloneDeepWith=sS.cloneDeepWith,Vl.cloneWith=sS.cloneWith,Vl.conformsTo=sS.conformsTo,Vl.deburr=vS.deburr,Vl.defaultTo=pS.defaultTo,Vl.divide=cS.divide,Vl.endsWith=vS.endsWith,Vl.eq=sS.eq,Vl.escape=vS.escape,Vl.escapeRegExp=vS.escapeRegExp,Vl.every=iS.every,Vl.find=iS.find,Vl.findIndex=rS.findIndex,Vl.findKey=hS.findKey,Vl.findLast=iS.findLast,Vl.findLastIndex=rS.findLastIndex,Vl.findLastKey=hS.findLastKey,Vl.floor=cS.floor,Vl.forEach=iS.forEach,Vl.forEachRight=iS.forEachRight,Vl.forIn=hS.forIn,Vl.forInRight=hS.forInRight,Vl.forOwn=hS.forOwn,Vl.forOwnRight=hS.forOwnRight,Vl.get=hS.get,Vl.gt=sS.gt,Vl.gte=sS.gte,Vl.has=hS.has,Vl.hasIn=hS.hasIn,Vl.head=rS.head,Vl.identity=nl,Vl.includes=iS.includes,Vl.indexOf=rS.indexOf,Vl.inRange=lS,Vl.invoke=hS.invoke,Vl.isArguments=sS.isArguments,Vl.isArray=Du,Vl.isArrayBuffer=sS.isArrayBuffer,Vl.isArrayLike=sS.isArrayLike,Vl.isArrayLikeObject=sS.isArrayLikeObject,Vl.isBoolean=sS.isBoolean,Vl.isBuffer=sS.isBuffer,Vl.isDate=sS.isDate,Vl.isElement=sS.isElement,Vl.isEmpty=sS.isEmpty,Vl.isEqual=sS.isEqual,Vl.isEqualWith=sS.isEqualWith,Vl.isError=sS.isError,Vl.isFinite=sS.isFinite,Vl.isFunction=sS.isFunction,Vl.isInteger=sS.isInteger,Vl.isLength=sS.isLength,Vl.isMap=sS.isMap,Vl.isMatch=sS.isMatch,Vl.isMatchWith=sS.isMatchWith,Vl.isNaN=sS.isNaN,Vl.isNative=sS.isNative,Vl.isNil=sS.isNil,Vl.isNull=sS.isNull,Vl.isNumber=sS.isNumber,Vl.isObject=Ju,Vl.isObjectLike=sS.isObjectLike,Vl.isPlainObject=sS.isPlainObject,Vl.isRegExp=sS.isRegExp,Vl.isSafeInteger=sS.isSafeInteger,Vl.isSet=sS.isSet,Vl.isString=sS.isString,Vl.isSymbol=sS.isSymbol,Vl.isTypedArray=sS.isTypedArray,Vl.isUndefined=sS.isUndefined,Vl.isWeakMap=sS.isWeakMap,Vl.isWeakSet=sS.isWeakSet,Vl.join=rS.join,Vl.kebabCase=vS.kebabCase,Vl.last=Em,Vl.lastIndexOf=rS.lastIndexOf,Vl.lowerCase=vS.lowerCase,Vl.lowerFirst=vS.lowerFirst,Vl.lt=sS.lt,Vl.lte=sS.lte,Vl.max=cS.max,Vl.maxBy=cS.maxBy,Vl.mean=cS.mean,Vl.meanBy=cS.meanBy,Vl.min=cS.min,Vl.minBy=cS.minBy,Vl.stubArray=pS.stubArray,Vl.stubFalse=pS.stubFalse,Vl.stubObject=pS.stubObject,Vl.stubString=pS.stubString,Vl.stubTrue=pS.stubTrue,Vl.multiply=cS.multiply,Vl.nth=rS.nth,Vl.noop=pS.noop,Vl.now=oS.now,Vl.pad=vS.pad,Vl.padEnd=vS.padEnd,Vl.padStart=vS.padStart,Vl.parseInt=vS.parseInt,Vl.random=fS,Vl.reduce=iS.reduce,Vl.reduceRight=iS.reduceRight,Vl.repeat=vS.repeat,Vl.replace=vS.replace,Vl.result=hS.result,Vl.round=cS.round,Vl.sample=iS.sample,Vl.size=iS.size,Vl.snakeCase=vS.snakeCase,Vl.some=iS.some,Vl.sortedIndex=rS.sortedIndex,Vl.sortedIndexBy=rS.sortedIndexBy,Vl.sortedIndexOf=rS.sortedIndexOf,Vl.sortedLastIndex=rS.sortedLastIndex,Vl.sortedLastIndexBy=rS.sortedLastIndexBy,Vl.sortedLastIndexOf=rS.sortedLastIndexOf,Vl.startCase=vS.startCase,Vl.startsWith=vS.startsWith,Vl.subtract=cS.subtract,Vl.sum=cS.sum,Vl.sumBy=cS.sumBy,Vl.template=vS.template,Vl.times=pS.times,Vl.toFinite=sS.toFinite,Vl.toInteger=el,Vl.toLength=sS.toLength,Vl.toLower=vS.toLower,Vl.toNumber=sS.toNumber,Vl.toSafeInteger=sS.toSafeInteger,Vl.toString=sS.toString,Vl.toUpper=vS.toUpper,Vl.trim=vS.trim,Vl.trimEnd=vS.trimEnd,Vl.trimStart=vS.trimStart,Vl.truncate=vS.truncate,Vl.unescape=vS.unescape,Vl.uniqueId=pS.uniqueId,Vl.upperCase=vS.upperCase,Vl.upperFirst=vS.upperFirst,Vl.each=iS.forEach,Vl.eachRight=iS.forEachRight,Vl.first=rS.head,CS(Vl,(bS={},Up(Vl,(function(e,t){xS.call(Vl.prototype,t)||(bS[t]=e);})),bS),{chain:!1}),Vl.VERSION="4.17.21",(Vl.templateSettings=vS.templateSettings).imports._=Vl,nf(["bind","bindKey","curry","curryRight","partial","partialRight"],(function(e){Vl[e].placeholder=Vl;})),nf(["drop","take"],(function(e,t){Pl.prototype[e]=function(n){n=void 0===n?1:jS(el(n),0);var r=this.__filtered__&&!t?new Pl(this):this.clone();return r.__filtered__?r.__takeCount__=SS(n,r.__takeCount__):r.__views__.push({size:SS(n,4294967295),type:e+(r.__dir__<0?"Right":"")}),r},Pl.prototype[e+"Right"]=function(t){return this.reverse()[e](t).reverse()};})),nf(["filter","map","takeWhile"],(function(e,t){var n=t+1,r=1==n||3==n;Pl.prototype[e]=function(e){var t=this.clone();return t.__iteratees__.push({iteratee:Lp(e),type:n}),t.__filtered__=t.__filtered__||r,t};})),nf(["head","last"],(function(e,t){var n="take"+(t?"Right":"");Pl.prototype[e]=function(){return this[n](1).value()[0]};})),nf(["initial","tail"],(function(e,t){var n="drop"+(t?"":"Right");Pl.prototype[e]=function(){return this.__filtered__?new Pl(this):this[n](1)};})),Pl.prototype.compact=function(){return this.filter(nl)},Pl.prototype.find=function(e){return this.filter(e).head()},Pl.prototype.findLast=function(e){return this.reverse().find(e)},Pl.prototype.invokeMap=Mf((function(e,t){return "function"==typeof e?new Pl(this):this.map((function(n){return Oy(n,e,t)}))})),Pl.prototype.reject=function(e){return this.filter(Fb(Lp(e)))},Pl.prototype.slice=function(e,t){e=el(e);var n=this;return n.__filtered__&&(e>0||t<0)?new Pl(n):(e<0?n=n.takeRight(-e):e&&(n=n.drop(e)),void 0!==t&&(n=(t=el(t))<0?n.dropRight(-t):n.take(t-e)),n)},Pl.prototype.takeRightWhile=function(e){return this.reverse().takeWhile(e).reverse()},Pl.prototype.toArray=function(){return this.take(4294967295)},Up(Pl.prototype,(function(e,t){var n=/^(?:filter|find|map|reject)|While$/.test(t),r=/^(?:head|last)$/.test(t),i=Vl[r?"take"+("last"==t?"Right":""):t],o=r||/^find/.test(t);i&&(Vl.prototype[t]=function(){var t=this.__wrapped__,a=r?[1]:arguments,s=t instanceof Pl,c=a[0],u=s||Du(t),l=function(e){var t=i.apply(Vl,Hh([e],a));return r&&f?t[0]:t};u&&n&&"function"==typeof c&&1!=c.length&&(s=u=!1);var f=this.__chain__,h=!!this.__actions__.length,d=o&&!f,v=s&&!h;if(!o&&u){t=v?t:new Pl(this);var p=e.apply(t,a);return p.__actions__.push({func:Jk,args:[l],thisArg:void 0}),new Bl(p,f)}return d&&v?e.apply(this,a):(p=this.thru(l),d?r?p.value()[0]:p.value():p)});})),nf(["pop","push","shift","sort","splice","unshift"],(function(e){var t=wS[e],n=/^(?:push|sort|unshift)$/.test(e)?"tap":"thru",r=/^(?:pop|shift)$/.test(e);Vl.prototype[e]=function(){var e=arguments;if(r&&!this.__chain__){var i=this.value();return t.apply(Du(i)?i:[],e)}return this[n]((function(n){return t.apply(Du(n)?n:[],e)}))};})),Up(Pl.prototype,(function(e,t){var n=Vl[t];if(n){var r=n.name+"";xS.call(Il,r)||(Il[r]=[]),Il[r].push({name:t,func:n});}})),Il[gf(void 0,2).name]=[{name:"wrapper",func:void 0}],Pl.prototype.clone=function(){var e=new Pl(this.__wrapped__);return e.__actions__=zl(this.__actions__),e.__dir__=this.__dir__,e.__filtered__=this.__filtered__,e.__iteratees__=zl(this.__iteratees__),e.__takeCount__=this.__takeCount__,e.__views__=zl(this.__views__),e},Pl.prototype.reverse=function(){if(this.__filtered__){var e=new Pl(this);e.__dir__=-1,e.__filtered__=!0;}else (e=this.clone()).__dir__*=-1;return e},Pl.prototype.value=function(){var e=this.__wrapped__.value(),t=this.__dir__,n=Du(e),r=t<0,i=n?e.length:0,o=function(e,t,n){for(var r=-1,i=n.length;++r<i;){var o=n[r],a=o.size;switch(o.type){case"drop":e+=a;break;case"dropRight":t-=a;break;case"take":t=gS(t,e+a);break;case"takeRight":e=mS(e,t-a);}}return {start:e,end:t}}(0,i,this.__views__),a=o.start,s=o.end,c=s-a,u=r?s:a-1,l=this.__iteratees__,f=l.length,h=0,d=yS(c,this.__takeCount__);if(!n||!r&&i==c&&d==c)return Yk(e,this.__actions__);var v=[];e:for(;c--&&h<d;){for(var p=-1,m=e[u+=t];++p<f;){var g=l[p],y=g.iteratee,b=g.type,w=y(m);if(2==b)m=w;else if(!w){if(1==b)continue e;break e}}v[h++]=m;}return v},Vl.prototype.at=dS.at,Vl.prototype.chain=dS.wrapperChain,Vl.prototype.commit=dS.commit,Vl.prototype.next=dS.next,Vl.prototype.plant=dS.plant,Vl.prototype.reverse=dS.reverse,Vl.prototype.toJSON=Vl.prototype.valueOf=Vl.prototype.value=dS.value,Vl.prototype.first=Vl.prototype.head,kS&&(Vl.prototype[kS]=dS.toIterator)
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * vanilla-picker v2.12.1
 * https://vanilla-picker.js.org
 *
 * Copyright 2017-2021 Andreas Borgen (https://github.com/Sphinxxxx), Adam Brooks (https://github.com/dissimulate)
 * Released under the ISC license.
 */var s6=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},c6=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u6=function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var n=[],r=!0,i=!1,o=void 0;try{for(var a,s=e[Symbol.iterator]();!(r=(a=s.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){i=!0,o=e;}finally{try{!r&&s.return&&s.return();}finally{if(i)throw o}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")};String.prototype.startsWith=String.prototype.startsWith||function(e){return 0===this.indexOf(e)},String.prototype.padStart=String.prototype.padStart||function(e,t){for(var n=this;n.length<e;)n=t+n;return n};var l6={cb:"0f8ff",tqw:"aebd7",q:"-ffff",qmrn:"7fffd4",zr:"0ffff",bg:"5f5dc",bsq:"e4c4",bck:"---",nch:"ebcd",b:"--ff",bvt:"8a2be2",brwn:"a52a2a",brw:"deb887",ctb:"5f9ea0",hrt:"7fff-",chcT:"d2691e",cr:"7f50",rnw:"6495ed",crns:"8dc",crms:"dc143c",cn:"-ffff",Db:"--8b",Dcn:"-8b8b",Dgnr:"b8860b",Dgr:"a9a9a9",Dgrn:"-64-",Dkhk:"bdb76b",Dmgn:"8b-8b",Dvgr:"556b2f",Drng:"8c-",Drch:"9932cc",Dr:"8b--",Dsmn:"e9967a",Dsgr:"8fbc8f",DsTb:"483d8b",DsTg:"2f4f4f",Dtrq:"-ced1",Dvt:"94-d3",ppnk:"1493",pskb:"-bfff",mgr:"696969",grb:"1e90ff",rbrc:"b22222",rwht:"af0",stg:"228b22",chs:"-ff",gnsb:"dcdcdc",st:"8f8ff",g:"d7-",gnr:"daa520",gr:"808080",grn:"-8-0",grnw:"adff2f",hnw:"0fff0",htpn:"69b4",nnr:"cd5c5c",ng:"4b-82",vr:"0",khk:"0e68c",vnr:"e6e6fa",nrb:"0f5",wngr:"7cfc-",mnch:"acd",Lb:"add8e6",Lcr:"08080",Lcn:"e0ffff",Lgnr:"afad2",Lgr:"d3d3d3",Lgrn:"90ee90",Lpnk:"b6c1",Lsmn:"a07a",Lsgr:"20b2aa",Lskb:"87cefa",LsTg:"778899",Lstb:"b0c4de",Lw:"e0",m:"-ff-",mgrn:"32cd32",nn:"af0e6",mgnt:"-ff",mrn:"8--0",mqm:"66cdaa",mmb:"--cd",mmrc:"ba55d3",mmpr:"9370db",msg:"3cb371",mmsT:"7b68ee","":"-fa9a",mtr:"48d1cc",mmvt:"c71585",mnLb:"191970",ntc:"5fffa",mstr:"e4e1",mccs:"e4b5",vjw:"dead",nv:"--80",c:"df5e6",v:"808-0",vrb:"6b8e23",rng:"a5-",rngr:"45-",rch:"da70d6",pgnr:"eee8aa",pgrn:"98fb98",ptrq:"afeeee",pvtr:"db7093",ppwh:"efd5",pchp:"dab9",pr:"cd853f",pnk:"c0cb",pm:"dda0dd",pwrb:"b0e0e6",prp:"8-080",cc:"663399",r:"--",sbr:"bc8f8f",rb:"4169e1",sbrw:"8b4513",smn:"a8072",nbr:"4a460",sgrn:"2e8b57",ssh:"5ee",snn:"a0522d",svr:"c0c0c0",skb:"87ceeb",sTb:"6a5acd",sTgr:"708090",snw:"afa",n:"-ff7f",stb:"4682b4",tn:"d2b48c",t:"-8080",thst:"d8bfd8",tmT:"6347",trqs:"40e0d0",vt:"ee82ee",whT:"5deb3",wht:"",hts:"5f5f5",w:"-",wgrn:"9acd32"};function f6(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,n=t>0?e.toFixed(t).replace(/0+$/,"").replace(/\.$/,""):e.toString();return n||"0"}var h6=function(){function e(t,n,r,i){s6(this,e);var o=this;if(void 0===t);else if(Array.isArray(t))this.rgba=t;else if(void 0===r){var a=t&&""+t;a&&function(t){if(t.startsWith("hsl")){var n=t.match(/([\-\d\.e]+)/g).map(Number),r=u6(n,4),i=r[0],a=r[1],s=r[2],c=r[3];void 0===c&&(c=1),i/=360,a/=100,s/=100,o.hsla=[i,a,s,c];}else if(t.startsWith("rgb")){var u=t.match(/([\-\d\.e]+)/g).map(Number),l=u6(u,4),f=l[0],h=l[1],d=l[2],v=l[3];void 0===v&&(v=1),o.rgba=[f,h,d,v];}else t.startsWith("#")?o.rgba=e.hexToRgb(t):o.rgba=e.nameToRgb(t)||e.hexToRgb(t);}(a.toLowerCase());}else this.rgba=[t,n,r,void 0===i?1:i];}return c6(e,[{key:"printRGB",value:function(e){var t=(e?this.rgba:this.rgba.slice(0,3)).map((function(e,t){return f6(e,3===t?3:0)}));return e?"rgba("+t+")":"rgb("+t+")"}},{key:"printHSL",value:function(e){var t=[360,100,100,1],n=["","%","%",""],r=(e?this.hsla:this.hsla.slice(0,3)).map((function(e,r){return f6(e*t[r],3===r?3:1)+n[r]}));return e?"hsla("+r+")":"hsl("+r+")"}},{key:"printHex",value:function(e){var t=this.hex;return e?t:t.substring(0,7)}},{key:"rgba",get:function(){if(this._rgba)return this._rgba;if(!this._hsla)throw new Error("No color is set");return this._rgba=e.hslToRgb(this._hsla)},set:function(e){3===e.length&&(e[3]=1),this._rgba=e,this._hsla=null;}},{key:"rgbString",get:function(){return this.printRGB()}},{key:"rgbaString",get:function(){return this.printRGB(!0)}},{key:"hsla",get:function(){if(this._hsla)return this._hsla;if(!this._rgba)throw new Error("No color is set");return this._hsla=e.rgbToHsl(this._rgba)},set:function(e){3===e.length&&(e[3]=1),this._hsla=e,this._rgba=null;}},{key:"hslString",get:function(){return this.printHSL()}},{key:"hslaString",get:function(){return this.printHSL(!0)}},{key:"hex",get:function(){var e=this.rgba.map((function(e,t){return t<3?e.toString(16):Math.round(255*e).toString(16)}));return "#"+e.map((function(e){return e.padStart(2,"0")})).join("")},set:function(t){this.rgba=e.hexToRgb(t);}}],[{key:"hexToRgb",value:function(e){var t=(e.startsWith("#")?e.slice(1):e).replace(/^(\w{3})$/,"$1F").replace(/^(\w)(\w)(\w)(\w)$/,"$1$1$2$2$3$3$4$4").replace(/^(\w{6})$/,"$1FF");if(!t.match(/^([0-9a-fA-F]{8})$/))throw new Error("Unknown hex color; "+e);var n=t.match(/^(\w\w)(\w\w)(\w\w)(\w\w)$/).slice(1).map((function(e){return parseInt(e,16)}));return n[3]=n[3]/255,n}},{key:"nameToRgb",value:function(t){var n=t.toLowerCase().replace("at","T").replace(/[aeiouyldf]/g,"").replace("ght","L").replace("rk","D").slice(-5,4),r=l6[n];return void 0===r?r:e.hexToRgb(r.replace(/\-/g,"00").padStart(6,"f"))}},{key:"rgbToHsl",value:function(e){var t=u6(e,4),n=t[0],r=t[1],i=t[2],o=t[3];n/=255,r/=255,i/=255;var a=Math.max(n,r,i),s=Math.min(n,r,i),c=void 0,u=void 0,l=(a+s)/2;if(a===s)c=u=0;else {var f=a-s;switch(u=l>.5?f/(2-a-s):f/(a+s),a){case n:c=(r-i)/f+(r<i?6:0);break;case r:c=(i-n)/f+2;break;case i:c=(n-r)/f+4;}c/=6;}return [c,u,l,o]}},{key:"hslToRgb",value:function(e){var t=u6(e,4),n=t[0],r=t[1],i=t[2],o=t[3],a=void 0,s=void 0,c=void 0;if(0===r)a=s=c=i;else {var u=function(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+6*(t-e)*n:n<.5?t:n<2/3?e+(t-e)*(2/3-n)*6:e},l=i<.5?i*(1+r):i+r-i*r,f=2*i-l;a=u(f,l,n+1/3),s=u(f,l,n),c=u(f,l,n-1/3);}var h=[255*a,255*s,255*c].map(Math.round);return h[3]=o,h}}]),e}(),d6=function(){function e(){s6(this,e),this._events=[];}return c6(e,[{key:"add",value:function(e,t,n){e.addEventListener(t,n,!1),this._events.push({target:e,type:t,handler:n});}},{key:"remove",value:function(t,n,r){this._events=this._events.filter((function(i){var o=!0;return t&&t!==i.target&&(o=!1),n&&n!==i.type&&(o=!1),r&&r!==i.handler&&(o=!1),o&&e._doRemove(i.target,i.type,i.handler),!o}));}},{key:"destroy",value:function(){this._events.forEach((function(t){return e._doRemove(t.target,t.type,t.handler)})),this._events=[];}}],[{key:"_doRemove",value:function(e,t,n){e.removeEventListener(t,n,!1);}}]),e}();function v6(e,t,n){var r=!1;function i(e,t,n){return Math.max(t,Math.min(e,n))}function o(e,o,a){if(a&&(r=!0),r){e.preventDefault();var s=t.getBoundingClientRect(),c=s.width,u=s.height,l=o.clientX,f=o.clientY,h=i(l-s.left,0,c),d=i(f-s.top,0,u);n(h/c,d/u);}}function a(e,t){1===(void 0===e.buttons?e.which:e.buttons)?o(e,e,t):r=!1;}function s(e,t){1===e.touches.length?o(e,e.touches[0],t):r=!1;}e.add(t,"mousedown",(function(e){a(e,!0);})),e.add(t,"touchstart",(function(e){s(e,!0);})),e.add(window,"mousemove",a),e.add(t,"touchmove",s),e.add(window,"mouseup",(function(e){r=!1;})),e.add(t,"touchend",(function(e){r=!1;})),e.add(t,"touchcancel",(function(e){r=!1;}));}function p6(e,t){return (t||document).querySelector(e)}function m6(e){e.preventDefault(),e.stopPropagation();}function g6(e,t,n,r,i){e.add(t,"keydown",(function(e){n.indexOf(e.key)>=0&&(i&&m6(e),r(e));}));}var y6=function(){function e(t){s6(this,e),this.settings={popup:"right",layout:"default",alpha:!0,editor:!0,editorFormat:"hex",cancelButton:!1,defaultColor:"#0cf"},this._events=new d6,this.onChange=null,this.onDone=null,this.onOpen=null,this.onClose=null,this.setOptions(t);}return c6(e,[{key:"setOptions",value:function(e){var t=this;if(e){var n=this.settings;if(e instanceof HTMLElement)n.parent=e;else {n.parent&&e.parent&&n.parent!==e.parent&&(this._events.remove(n.parent),this._popupInited=!1),function(e,t,n){for(var r in e)n&&n.indexOf(r)>=0||(t[r]=e[r]);}(e,n),e.onChange&&(this.onChange=e.onChange),e.onDone&&(this.onDone=e.onDone),e.onOpen&&(this.onOpen=e.onOpen),e.onClose&&(this.onClose=e.onClose);var r=e.color||e.colour;r&&this._setColor(r);}var i=n.parent;if(i&&n.popup&&!this._popupInited){var o=function(e){return t.openHandler(e)};this._events.add(i,"click",o),g6(this._events,i,[" ","Spacebar","Enter"],o),this._popupInited=!0;}else e.parent&&!n.popup&&this.show();}}},{key:"openHandler",value:function(e){if(this.show()){e&&e.preventDefault(),this.settings.parent.style.pointerEvents="none";var t=e&&"keydown"===e.type?this._domEdit:this.domElement;setTimeout((function(){return t.focus()}),100),this.onOpen&&this.onOpen(this.colour);}}},{key:"closeHandler",value:function(e){var t=e&&e.type,n=!1;if(e)if("mousedown"===t||"focusin"===t){var r=(this.__containedEvent||0)+100;e.timeStamp>r&&(n=!0);}else m6(e),n=!0;else n=!0;n&&this.hide()&&(this.settings.parent.style.pointerEvents="","mousedown"!==t&&this.settings.parent.focus(),this.onClose&&this.onClose(this.colour));}},{key:"movePopup",value:function(e,t){this.closeHandler(),this.setOptions(e),t&&this.openHandler();}},{key:"setColor",value:function(e,t){this._setColor(e,{silent:t});}},{key:"_setColor",value:function(e,t){if("string"==typeof e&&(e=e.trim()),e){t=t||{};var n=void 0;try{n=new h6(e);}catch(e){if(t.failSilently)return;throw e}if(!this.settings.alpha){var r=n.hsla;r[3]=1,n.hsla=r;}this.colour=this.color=n,this._setHSLA(null,null,null,null,t);}}},{key:"setColour",value:function(e,t){this.setColor(e,t);}},{key:"show",value:function(){if(!this.settings.parent)return !1;if(this.domElement){var e=this._toggleDOM(!0);return this._setPosition(),e}var t,n,r=this.settings.template||'<div class="picker_wrapper" tabindex="-1"><div class="picker_arrow"></div><div class="picker_hue picker_slider"><div class="picker_selector"></div></div><div class="picker_sl"><div class="picker_selector"></div></div><div class="picker_alpha picker_slider"><div class="picker_selector"></div></div><div class="picker_editor"><input aria-label="Type a color name or hex value"/></div><div class="picker_sample"></div><div class="picker_done"><button>Ok</button></div><div class="picker_cancel"><button>Cancel</button></div></div>',i=(t=r,(n=document.createElement("div")).innerHTML=t,n.firstElementChild);return this.domElement=i,this._domH=p6(".picker_hue",i),this._domSL=p6(".picker_sl",i),this._domA=p6(".picker_alpha",i),this._domEdit=p6(".picker_editor input",i),this._domSample=p6(".picker_sample",i),this._domOkay=p6(".picker_done button",i),this._domCancel=p6(".picker_cancel button",i),i.classList.add("layout_"+this.settings.layout),this.settings.alpha||i.classList.add("no_alpha"),this.settings.editor||i.classList.add("no_editor"),this.settings.cancelButton||i.classList.add("no_cancel"),this._ifPopup((function(){return i.classList.add("popup")})),this._setPosition(),this.colour?this._updateUI():this._setColor(this.settings.defaultColor),this._bindEvents(),!0}},{key:"hide",value:function(){return this._toggleDOM(!1)}},{key:"destroy",value:function(){this._events.destroy(),this.domElement&&this.settings.parent.removeChild(this.domElement);}},{key:"_bindEvents",value:function(){var e=this,t=this,n=this.domElement,r=this._events;function i(e,t,n){r.add(e,t,n);}i(n,"click",(function(e){return e.preventDefault()})),v6(r,this._domH,(function(e,n){return t._setHSLA(e)})),v6(r,this._domSL,(function(e,n){return t._setHSLA(null,e,1-n)})),this.settings.alpha&&v6(r,this._domA,(function(e,n){return t._setHSLA(null,null,null,1-n)}));var o=this._domEdit;i(o,"input",(function(e){t._setColor(this.value,{fromEditor:!0,failSilently:!0});})),i(o,"focus",(function(e){var t=this;t.selectionStart===t.selectionEnd&&t.select();})),this._ifPopup((function(){var t=function(t){return e.closeHandler(t)};i(window,"mousedown",t),i(window,"focusin",t),g6(r,n,["Esc","Escape"],t);var o=function(t){e.__containedEvent=t.timeStamp;};i(n,"mousedown",o),i(n,"focusin",o),i(e._domCancel,"click",t);}));var a=function(t){e._ifPopup((function(){return e.closeHandler(t)})),e.onDone&&e.onDone(e.colour);};i(this._domOkay,"click",a),g6(r,n,["Enter"],a);}},{key:"_setPosition",value:function(){var e=this.settings.parent,t=this.domElement;e!==t.parentNode&&e.appendChild(t),this._ifPopup((function(n){"static"===getComputedStyle(e).position&&(e.style.position="relative");var r=!0===n?"popup_right":"popup_"+n;["popup_top","popup_bottom","popup_left","popup_right"].forEach((function(e){e===r?t.classList.add(e):t.classList.remove(e);})),t.classList.add(r);}));}},{key:"_setHSLA",value:function(e,t,n,r,i){i=i||{};var o=this.colour,a=o.hsla;[e,t,n,r].forEach((function(e,t){(e||0===e)&&(a[t]=e);})),o.hsla=a,this._updateUI(i),this.onChange&&!i.silent&&this.onChange(o);}},{key:"_updateUI",value:function(e){if(this.domElement){e=e||{};var t=this.colour,n=t.hsla,r="hsl("+360*n[0]+", 100%, 50%)",i=t.hslString,o=t.hslaString,a=this._domH,s=this._domSL,c=this._domA,u=p6(".picker_selector",a),l=p6(".picker_selector",s),f=p6(".picker_selector",c);y(0,u,n[0]),this._domSL.style.backgroundColor=this._domH.style.color=r,y(0,l,n[1]),b(0,l,1-n[2]),s.style.color=i,b(0,f,1-n[3]);var h=i,d=h.replace("hsl","hsla").replace(")",", 0)"),v="linear-gradient("+[h,d]+")";if(this._domA.style.background=v+", linear-gradient(45deg, lightgrey 25%, transparent 25%, transparent 75%, lightgrey 75%) 0 0 / 2em 2em,\n                   linear-gradient(45deg, lightgrey 25%,       white 25%,       white 75%, lightgrey 75%) 1em 1em / 2em 2em",!e.fromEditor){var p=this.settings.editorFormat,m=this.settings.alpha,g=void 0;switch(p){case"rgb":g=t.printRGB(m);break;case"hsl":g=t.printHSL(m);break;default:g=t.printHex(m);}this._domEdit.value=g;}this._domSample.style.color=o;}function y(e,t,n){t.style.left=100*n+"%";}function b(e,t,n){t.style.top=100*n+"%";}}},{key:"_ifPopup",value:function(e,t){this.settings.parent&&this.settings.popup?e&&e(this.settings.popup):t&&t();}},{key:"_toggleDOM",value:function(e){var t=this.domElement;if(!t)return !1;var n=e?"":"none",r=t.style.display!==n;return r&&(t.style.display=n),r}}]),e}(),b6=document.createElement("style");b6.textContent='.picker_wrapper.no_alpha .picker_alpha{display:none}.picker_wrapper.no_editor .picker_editor{position:absolute;z-index:-1;opacity:0}.picker_wrapper.no_cancel .picker_cancel{display:none}.layout_default.picker_wrapper{display:flex;flex-flow:row wrap;justify-content:space-between;align-items:stretch;font-size:10px;width:25em;padding:.5em}.layout_default.picker_wrapper input,.layout_default.picker_wrapper button{font-size:1rem}.layout_default.picker_wrapper>*{margin:.5em}.layout_default.picker_wrapper::before{content:"";display:block;width:100%;height:0;order:1}.layout_default .picker_slider,.layout_default .picker_selector{padding:1em}.layout_default .picker_hue{width:100%}.layout_default .picker_sl{flex:1 1 auto}.layout_default .picker_sl::before{content:"";display:block;padding-bottom:100%}.layout_default .picker_editor{order:1;width:6.5rem}.layout_default .picker_editor input{width:100%;height:100%}.layout_default .picker_sample{order:1;flex:1 1 auto}.layout_default .picker_done,.layout_default .picker_cancel{order:1}.picker_wrapper{box-sizing:border-box;background:#f2f2f2;box-shadow:0 0 0 1px silver;cursor:default;font-family:sans-serif;color:#444;pointer-events:auto}.picker_wrapper:focus{outline:none}.picker_wrapper button,.picker_wrapper input{box-sizing:border-box;border:none;box-shadow:0 0 0 1px silver;outline:none}.picker_wrapper button:focus,.picker_wrapper button:active,.picker_wrapper input:focus,.picker_wrapper input:active{box-shadow:0 0 2px 1px #1e90ff}.picker_wrapper button{padding:.4em .6em;cursor:pointer;background-color:#f5f5f5;background-image:linear-gradient(0deg, gainsboro, transparent)}.picker_wrapper button:active{background-image:linear-gradient(0deg, transparent, gainsboro)}.picker_wrapper button:hover{background-color:#fff}.picker_selector{position:absolute;z-index:1;display:block;-webkit-transform:translate(-50%, -50%);transform:translate(-50%, -50%);border:2px solid #fff;border-radius:100%;box-shadow:0 0 3px 1px #67b9ff;background:currentColor;cursor:pointer}.picker_slider .picker_selector{border-radius:2px}.picker_hue{position:relative;background-image:linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red);box-shadow:0 0 0 1px silver}.picker_sl{position:relative;box-shadow:0 0 0 1px silver;background-image:linear-gradient(180deg, white, rgba(255, 255, 255, 0) 50%),linear-gradient(0deg, black, rgba(0, 0, 0, 0) 50%),linear-gradient(90deg, #808080, rgba(128, 128, 128, 0))}.picker_alpha,.picker_sample{position:relative;background:linear-gradient(45deg, lightgrey 25%, transparent 25%, transparent 75%, lightgrey 75%) 0 0/2em 2em,linear-gradient(45deg, lightgrey 25%, white 25%, white 75%, lightgrey 75%) 1em 1em/2em 2em;box-shadow:0 0 0 1px silver}.picker_alpha .picker_selector,.picker_sample .picker_selector{background:none}.picker_editor input{font-family:monospace;padding:.2em .4em}.picker_sample::before{content:"";position:absolute;display:block;width:100%;height:100%;background:currentColor}.picker_arrow{position:absolute;z-index:-1}.picker_wrapper.popup{position:absolute;z-index:2;margin:1.5em}.picker_wrapper.popup,.picker_wrapper.popup .picker_arrow::before,.picker_wrapper.popup .picker_arrow::after{background:#f2f2f2;box-shadow:0 0 10px 1px rgba(0,0,0,.4)}.picker_wrapper.popup .picker_arrow{width:3em;height:3em;margin:0}.picker_wrapper.popup .picker_arrow::before,.picker_wrapper.popup .picker_arrow::after{content:"";display:block;position:absolute;top:0;left:0;z-index:-99}.picker_wrapper.popup .picker_arrow::before{width:100%;height:100%;-webkit-transform:skew(45deg);transform:skew(45deg);-webkit-transform-origin:0 100%;transform-origin:0 100%}.picker_wrapper.popup .picker_arrow::after{width:150%;height:150%;box-shadow:none}.popup.popup_top{bottom:100%;left:0}.popup.popup_top .picker_arrow{bottom:0;left:0;-webkit-transform:rotate(-90deg);transform:rotate(-90deg)}.popup.popup_bottom{top:100%;left:0}.popup.popup_bottom .picker_arrow{top:0;left:0;-webkit-transform:rotate(90deg) scale(1, -1);transform:rotate(90deg) scale(1, -1)}.popup.popup_left{top:0;right:100%}.popup.popup_left .picker_arrow{top:0;right:0;-webkit-transform:scale(-1, 1);transform:scale(-1, 1)}.popup.popup_right{top:0;left:100%}.popup.popup_right .picker_arrow{top:0;left:0}',document.documentElement.firstElementChild.appendChild(b6),y6.StyleElement=b6;var w6=Object.freeze({__proto__:null,default:y6});

function SvelteJSONEditor(props) {
    const refContainer = useRef(null);
    const refEditor = useRef(null);
    useEffect(() => {
        // @ts-ignore
        refEditor.current = new W1({
            // @ts-ignore
            target: refContainer.current,
            props: {}
        });
        return () => {
            // destroy editor
            if (refEditor.current) {
                // @ts-ignore
                refEditor.current.destroy();
                refEditor.current = null;
            }
        };
    }, []);
    // update props
    useEffect(() => {
        if (refEditor.current) {
            // @ts-ignore
            refEditor.current.updateProps(props);
        }
    }, [props]);
    return jsx("div", { className: "vanilla-jsoneditor-react", ref: refContainer });
}

const GrammarPanelContainer = ({ obj, viewId, initialGrammar, camera, filterKnots, inputId, setCamera, addNewMessage, applyGrammarButtonId, linkMapAndGrammarId }) => {
    const [grammar, _setCode] = useState('');
    const grammarStateRef = useRef(grammar);
    const setCode = (data) => {
        grammarStateRef.current = data;
        _setCode(data);
    };
    const [tempGrammar, _setTempGrammar] = useState('');
    const tempGrammarStateRef = useRef(tempGrammar);
    const setTempGrammar = (data) => {
        tempGrammarStateRef.current = data;
        _setTempGrammar(data);
    };
    const [refresh, setRefresh] = useState(false);
    const [showEditor, setShowEditor] = useState(true);
    const [readOnly, setReadOnly] = useState(false);
    const url = process.env.REACT_APP_BACKEND_SERVICE_URL;
    const applyGrammar = async () => {
        if (tempGrammarStateRef.current != '') {
            try {
                JSON.parse(tempGrammarStateRef.current); // testing if temp grammar contains a valid grammar
            }
            catch (err) {
                console.error('Grammar is not valid');
                return;
            }
        }
        // let sendGrammar = addCamera(grammar, camera);
        let sendGrammar = '';
        if (select('#' + linkMapAndGrammarId).property("checked")) {
            if (tempGrammarStateRef.current == '') {
                sendGrammar = addCameraAndFilter(grammarStateRef.current, camera, filterKnots);
            }
            else {
                sendGrammar = addCameraAndFilter(tempGrammarStateRef.current, camera, filterKnots);
            }
        }
        else {
            if (tempGrammarStateRef.current == '') {
                sendGrammar = grammarStateRef.current;
            }
            else {
                sendGrammar = tempGrammarStateRef.current;
            }
        }
        setCode(sendGrammar);
        setTempGrammar('');
        const data = { "grammar": sendGrammar };
        fetch(url + "/updateGrammar", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then((response) => {
            // await createLinksAndRenderStyles(url);
            obj.processGrammar(JSON.parse(grammarStateRef.current));
        })
            .catch(error => {
            console.error('Request to update grammar failed: ', error);
        });
    };
    const addCameraAndFilter = (grammar, camera, filterKnots) => {
        if (grammar == '') {
            return '';
        }
        if (camera.position.length == 0 && filterKnots.length == 0) {
            return grammar;
        }
        let parsedGrammar = JSON.parse(grammar);
        for (const component of parsedGrammar.components) { // Grammar camera is the same for all map views
            if ("map" in component) {
                if (camera.position.length != 0)
                    component.map.camera = camera;
                if (filterKnots.length != 0)
                    component.map.filterKnots = filterKnots;
                else if (component.map.filterKnots != undefined)
                    delete component.map.filterKnots;
            }
        }
        return JSON.stringify(parsedGrammar, null, 4);
    };
    const updateLocalNominatim = (camera, filterKnots) => {
        setTempGrammar(addCameraAndFilter(grammarStateRef.current, camera, filterKnots)); // overwrite previous changes with grammar integrated with camera and filter knots
    };
    const updateCameraNominatim = (place) => {
        fetch(url + "/solveNominatim?text=" + place, {
            method: 'GET'
        })
            .then(async (response) => {
            let responseJson = await response.json();
            updateLocalNominatim(responseJson, filterKnots);
            setCamera(responseJson);
            select('#' + linkMapAndGrammarId).property("checked", true);
        })
            .catch(error => {
            console.error('Error trying to resolve nominatim: ', error);
        });
    };
    // run only once to load the initial data
    useEffect(() => {
        let stringData = JSON.stringify(initialGrammar, null, 4);
        setCode(stringData);
        select('#' + inputId).on("keydown", function (e) {
            if (e.key == 'Enter') {
                select('#' + linkMapAndGrammarId).property("checked", false);
                let inputValue = select('#' + inputId).attr("value");
                if (inputValue != undefined && !Array.isArray(inputValue)) {
                    updateCameraNominatim(inputValue.toString());
                }
                else {
                    throw Error("Invalid place");
                }
            }
        });
        select('#' + applyGrammarButtonId).on("click", function (e) {
            applyGrammar();
        });
        select('#' + linkMapAndGrammarId).on('change', function (e) {
            setRefresh(!refresh);
        });
    }, []);
    const checkIfAddCameraAndFilter = (grammar, camera, tempGrammar, filterKnots) => {
        let inputLink = select('#' + linkMapAndGrammarId);
        let returnedGrammar = {};
        if (inputLink.empty()) {
            if (tempGrammar != '') {
                returnedGrammar.text = tempGrammar;
            }
            else if (grammar != '') {
                returnedGrammar.json = JSON.parse(grammar);
            }
            else {
                returnedGrammar.json = {};
            }
            return returnedGrammar;
        }
        let mapAndGrammarLinked = inputLink.property("checked");
        if (mapAndGrammarLinked) {
            let mergedGrammar = addCameraAndFilter(grammar, camera, filterKnots);
            if (mergedGrammar != '') {
                returnedGrammar.json = JSON.parse(mergedGrammar);
            }
            else {
                returnedGrammar.json = {};
            }
            return returnedGrammar;
        }
        else {
            if (tempGrammar != '') {
                returnedGrammar.text = tempGrammar;
            }
            else if (grammar != '') {
                returnedGrammar.json = JSON.parse(grammar);
            }
            else {
                returnedGrammar.json = {};
            }
            return returnedGrammar;
        }
    };
    const updateGrammarContent = (grammarObj) => {
        if (grammarObj.text != undefined) {
            setTempGrammar(grammarObj.text);
        }
        else {
            setTempGrammar(JSON.stringify(grammarObj.json, null, 4));
        }
    };
    return (jsx(React__default.Fragment, { children: showEditor && (jsxs(Fragment, { children: [jsx("div", { className: "my-editor", style: { overflow: "auto", fontSize: "24px", height: "max(90%,calc(100% - 40px))" }, children: jsx(SvelteJSONEditor, { content: checkIfAddCameraAndFilter(grammar, camera, tempGrammar, filterKnots), readOnly: readOnly, onChange: updateGrammarContent, mode: 'text', indentation: 4 }) }), jsxs("div", { className: "d-flex align-items-center justify-content-center", style: { overflow: "auto", height: "min(10%, 40px)" }, children: [jsx(Button, { variant: "secondary", id: applyGrammarButtonId, style: { marginRight: "10px" }, children: "Apply Grammar" }), jsx("input", { name: "linkMapAndGrammar", type: "checkbox", id: linkMapAndGrammarId, style: { marginRight: "5px" } }), jsx("label", { htmlFor: "linkMapAndGrammar", children: "Link" })] })] })) }));
};

const MapRendererContainer = ({ obj, viewId }) => {
    return (jsx(React__default.Fragment, { children: jsxs("div", { style: { padding: 0, width: "100%", height: "100%" }, children: [jsx("div", { id: viewId, className: "mapView" }), jsx("div", { id: 'svg_div', children: jsx("svg", { id: 'svg_element', xmlns: "http://www.w3.org/2000/svg", style: { "display": "none" } }) })] }) }));
};

var cjs = {exports: {}};

var Draggable$2 = {};

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);else for(t in e)e[t]&&(n&&(n+=" "),n+=t);return n}function clsx(){for(var e,t,f=0,n="";f<arguments.length;)(e=arguments[f++])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

var clsx_m = /*#__PURE__*/Object.freeze({
    __proto__: null,
    clsx: clsx,
    default: clsx
});

var require$$3 = /*@__PURE__*/getAugmentedNamespace(clsx_m);

var domFns = {};

var shims = {};

Object.defineProperty(shims, "__esModule", {
  value: true
});
shims.dontSetMe = dontSetMe;
shims.findInArray = findInArray;
shims.int = int;
shims.isFunction = isFunction;
shims.isNum = isNum;

// @credits https://gist.github.com/rogozhnikoff/a43cfed27c41e4e68cdc
function findInArray(array
/*: Array<any> | TouchList*/
, callback
/*: Function*/
)
/*: any*/
{
  for (var i = 0, length = array.length; i < length; i++) {
    if (callback.apply(callback, [array[i], i, array])) return array[i];
  }
}

function isFunction(func
/*: any*/
)
/*: boolean %checks*/
{
  // $FlowIgnore[method-unbinding]
  return typeof func === 'function' || Object.prototype.toString.call(func) === '[object Function]';
}

function isNum(num
/*: any*/
)
/*: boolean %checks*/
{
  return typeof num === 'number' && !isNaN(num);
}

function int(a
/*: string*/
)
/*: number*/
{
  return parseInt(a, 10);
}

function dontSetMe(props
/*: Object*/
, propName
/*: string*/
, componentName
/*: string*/
)
/*: ?Error*/
{
  if (props[propName]) {
    return new Error("Invalid prop ".concat(propName, " passed to ").concat(componentName, " - do not set this, set it on the child."));
  }
}

var getPrefix$1 = {};

Object.defineProperty(getPrefix$1, "__esModule", {
  value: true
});
getPrefix$1.browserPrefixToKey = browserPrefixToKey;
getPrefix$1.browserPrefixToStyle = browserPrefixToStyle;
getPrefix$1.default = void 0;
getPrefix$1.getPrefix = getPrefix;
var prefixes = ['Moz', 'Webkit', 'O', 'ms'];

function getPrefix()
/*: string*/
{
  var _window$document, _window$document$docu;

  var prop
  /*: string*/
  = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'transform';
  // Ensure we're running in an environment where there is actually a global
  // `window` obj
  if (typeof window === 'undefined') return ''; // If we're in a pseudo-browser server-side environment, this access
  // path may not exist, so bail out if it doesn't.

  var style = (_window$document = window.document) === null || _window$document === void 0 ? void 0 : (_window$document$docu = _window$document.documentElement) === null || _window$document$docu === void 0 ? void 0 : _window$document$docu.style;
  if (!style) return '';
  if (prop in style) return '';

  for (var i = 0; i < prefixes.length; i++) {
    if (browserPrefixToKey(prop, prefixes[i]) in style) return prefixes[i];
  }

  return '';
}

function browserPrefixToKey(prop
/*: string*/
, prefix
/*: string*/
)
/*: string*/
{
  return prefix ? "".concat(prefix).concat(kebabToTitleCase(prop)) : prop;
}

function browserPrefixToStyle(prop
/*: string*/
, prefix
/*: string*/
)
/*: string*/
{
  return prefix ? "-".concat(prefix.toLowerCase(), "-").concat(prop) : prop;
}

function kebabToTitleCase(str
/*: string*/
)
/*: string*/
{
  var out = '';
  var shouldCapitalize = true;

  for (var i = 0; i < str.length; i++) {
    if (shouldCapitalize) {
      out += str[i].toUpperCase();
      shouldCapitalize = false;
    } else if (str[i] === '-') {
      shouldCapitalize = true;
    } else {
      out += str[i];
    }
  }

  return out;
} // Default export is the prefix itself, like 'Moz', 'Webkit', etc
// Note that you may have to re-test for certain things; for instance, Chrome 50
// can handle unprefixed `transform`, but not unprefixed `user-select`


var _default = (getPrefix()
/*: string*/
);

getPrefix$1.default = _default;

function _typeof$1(obj) { "@babel/helpers - typeof"; return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$1(obj); }

Object.defineProperty(domFns, "__esModule", {
  value: true
});
domFns.addClassName = addClassName;
domFns.addEvent = addEvent;
domFns.addUserSelectStyles = addUserSelectStyles;
domFns.createCSSTransform = createCSSTransform;
domFns.createSVGTransform = createSVGTransform;
domFns.getTouch = getTouch;
domFns.getTouchIdentifier = getTouchIdentifier;
domFns.getTranslation = getTranslation;
domFns.innerHeight = innerHeight$1;
domFns.innerWidth = innerWidth$1;
domFns.matchesSelector = matchesSelector;
domFns.matchesSelectorAndParentsTo = matchesSelectorAndParentsTo;
domFns.offsetXYFromParent = offsetXYFromParent;
domFns.outerHeight = outerHeight;
domFns.outerWidth = outerWidth;
domFns.removeClassName = removeClassName;
domFns.removeEvent = removeEvent;
domFns.removeUserSelectStyles = removeUserSelectStyles;

var _shims$2 = shims;

var _getPrefix = _interopRequireWildcard$1(getPrefix$1);

function _getRequireWildcardCache$1(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache$1 = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard$1(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof$1(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache$1(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty$1(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var matchesSelectorFunc = '';

function matchesSelector(el
/*: Node*/
, selector
/*: string*/
)
/*: boolean*/
{
  if (!matchesSelectorFunc) {
    matchesSelectorFunc = (0, _shims$2.findInArray)(['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'], function (method) {
      // $FlowIgnore: Doesn't think elements are indexable
      return (0, _shims$2.isFunction)(el[method]);
    });
  } // Might not be found entirely (not an Element?) - in that case, bail
  // $FlowIgnore: Doesn't think elements are indexable


  if (!(0, _shims$2.isFunction)(el[matchesSelectorFunc])) return false; // $FlowIgnore: Doesn't think elements are indexable

  return el[matchesSelectorFunc](selector);
} // Works up the tree to the draggable itself attempting to match selector.


function matchesSelectorAndParentsTo(el
/*: Node*/
, selector
/*: string*/
, baseNode
/*: Node*/
)
/*: boolean*/
{
  var node = el;

  do {
    if (matchesSelector(node, selector)) return true;
    if (node === baseNode) return false;
    node = node.parentNode;
  } while (node);

  return false;
}

function addEvent(el
/*: ?Node*/
, event
/*: string*/
, handler
/*: Function*/
, inputOptions
/*: Object*/
)
/*: void*/
{
  if (!el) return;

  var options = _objectSpread({
    capture: true
  }, inputOptions); // $FlowIgnore[method-unbinding]


  if (el.addEventListener) {
    el.addEventListener(event, handler, options);
  } else if (el.attachEvent) {
    el.attachEvent('on' + event, handler);
  } else {
    // $FlowIgnore: Doesn't think elements are indexable
    el['on' + event] = handler;
  }
}

function removeEvent(el
/*: ?Node*/
, event
/*: string*/
, handler
/*: Function*/
, inputOptions
/*: Object*/
)
/*: void*/
{
  if (!el) return;

  var options = _objectSpread({
    capture: true
  }, inputOptions); // $FlowIgnore[method-unbinding]


  if (el.removeEventListener) {
    el.removeEventListener(event, handler, options);
  } else if (el.detachEvent) {
    el.detachEvent('on' + event, handler);
  } else {
    // $FlowIgnore: Doesn't think elements are indexable
    el['on' + event] = null;
  }
}

function outerHeight(node
/*: HTMLElement*/
)
/*: number*/
{
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  var height = node.clientHeight;
  var computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height += (0, _shims$2.int)(computedStyle.borderTopWidth);
  height += (0, _shims$2.int)(computedStyle.borderBottomWidth);
  return height;
}

function outerWidth(node
/*: HTMLElement*/
)
/*: number*/
{
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetLeft which is including margin. See getBoundPosition
  var width = node.clientWidth;
  var computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width += (0, _shims$2.int)(computedStyle.borderLeftWidth);
  width += (0, _shims$2.int)(computedStyle.borderRightWidth);
  return width;
}

function innerHeight$1(node
/*: HTMLElement*/
)
/*: number*/
{
  var height = node.clientHeight;
  var computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height -= (0, _shims$2.int)(computedStyle.paddingTop);
  height -= (0, _shims$2.int)(computedStyle.paddingBottom);
  return height;
}

function innerWidth$1(node
/*: HTMLElement*/
)
/*: number*/
{
  var width = node.clientWidth;
  var computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width -= (0, _shims$2.int)(computedStyle.paddingLeft);
  width -= (0, _shims$2.int)(computedStyle.paddingRight);
  return width;
}
/*:: interface EventWithOffset {
  clientX: number, clientY: number
}*/


// Get from offsetParent
function offsetXYFromParent(evt
/*: EventWithOffset*/
, offsetParent
/*: HTMLElement*/
, scale
/*: number*/
)
/*: ControlPosition*/
{
  var isBody = offsetParent === offsetParent.ownerDocument.body;
  var offsetParentRect = isBody ? {
    left: 0,
    top: 0
  } : offsetParent.getBoundingClientRect();
  var x = (evt.clientX + offsetParent.scrollLeft - offsetParentRect.left) / scale;
  var y = (evt.clientY + offsetParent.scrollTop - offsetParentRect.top) / scale;
  return {
    x: x,
    y: y
  };
}

function createCSSTransform(controlPos
/*: ControlPosition*/
, positionOffset
/*: PositionOffsetControlPosition*/
)
/*: Object*/
{
  var translation = getTranslation(controlPos, positionOffset, 'px');
  return _defineProperty$1({}, (0, _getPrefix.browserPrefixToKey)('transform', _getPrefix.default), translation);
}

function createSVGTransform(controlPos
/*: ControlPosition*/
, positionOffset
/*: PositionOffsetControlPosition*/
)
/*: string*/
{
  var translation = getTranslation(controlPos, positionOffset, '');
  return translation;
}

function getTranslation(_ref2, positionOffset
/*: PositionOffsetControlPosition*/
, unitSuffix
/*: string*/
)
/*: string*/
{
  var x = _ref2.x,
      y = _ref2.y;
  var translation = "translate(".concat(x).concat(unitSuffix, ",").concat(y).concat(unitSuffix, ")");

  if (positionOffset) {
    var defaultX = "".concat(typeof positionOffset.x === 'string' ? positionOffset.x : positionOffset.x + unitSuffix);
    var defaultY = "".concat(typeof positionOffset.y === 'string' ? positionOffset.y : positionOffset.y + unitSuffix);
    translation = "translate(".concat(defaultX, ", ").concat(defaultY, ")") + translation;
  }

  return translation;
}

function getTouch(e
/*: MouseTouchEvent*/
, identifier
/*: number*/
)
/*: ?{clientX: number, clientY: number}*/
{
  return e.targetTouches && (0, _shims$2.findInArray)(e.targetTouches, function (t) {
    return identifier === t.identifier;
  }) || e.changedTouches && (0, _shims$2.findInArray)(e.changedTouches, function (t) {
    return identifier === t.identifier;
  });
}

function getTouchIdentifier(e
/*: MouseTouchEvent*/
)
/*: ?number*/
{
  if (e.targetTouches && e.targetTouches[0]) return e.targetTouches[0].identifier;
  if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].identifier;
} // User-select Hacks:
//
// Useful for preventing blue highlights all over everything when dragging.
// Note we're passing `document` b/c we could be iframed


function addUserSelectStyles(doc
/*: ?Document*/
) {
  if (!doc) return;
  var styleEl = doc.getElementById('react-draggable-style-el');

  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.type = 'text/css';
    styleEl.id = 'react-draggable-style-el';
    styleEl.innerHTML = '.react-draggable-transparent-selection *::-moz-selection {all: inherit;}\n';
    styleEl.innerHTML += '.react-draggable-transparent-selection *::selection {all: inherit;}\n';
    doc.getElementsByTagName('head')[0].appendChild(styleEl);
  }

  if (doc.body) addClassName(doc.body, 'react-draggable-transparent-selection');
}

function removeUserSelectStyles(doc
/*: ?Document*/
) {
  if (!doc) return;

  try {
    if (doc.body) removeClassName(doc.body, 'react-draggable-transparent-selection'); // $FlowIgnore: IE

    if (doc.selection) {
      // $FlowIgnore: IE
      doc.selection.empty();
    } else {
      // Remove selection caused by scroll, unless it's a focused input
      // (we use doc.defaultView in case we're in an iframe)
      var selection = (doc.defaultView || window).getSelection();

      if (selection && selection.type !== 'Caret') {
        selection.removeAllRanges();
      }
    }
  } catch (e) {// probably IE
  }
}

function addClassName(el
/*: HTMLElement*/
, className
/*: string*/
) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    if (!el.className.match(new RegExp("(?:^|\\s)".concat(className, "(?!\\S)")))) {
      el.className += " ".concat(className);
    }
  }
}

function removeClassName(el
/*: HTMLElement*/
, className
/*: string*/
) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp("(?:^|\\s)".concat(className, "(?!\\S)"), 'g'), '');
  }
}

var positionFns = {};

Object.defineProperty(positionFns, "__esModule", {
  value: true
});
positionFns.canDragX = canDragX;
positionFns.canDragY = canDragY;
positionFns.createCoreData = createCoreData;
positionFns.createDraggableData = createDraggableData;
positionFns.getBoundPosition = getBoundPosition;
positionFns.getControlPosition = getControlPosition;
positionFns.snapToGrid = snapToGrid;

var _shims$1 = shims;

var _domFns$1 = domFns;

function getBoundPosition(draggable
/*: Draggable*/
, x
/*: number*/
, y
/*: number*/
)
/*: [number, number]*/
{
  // If no bounds, short-circuit and move on
  if (!draggable.props.bounds) return [x, y]; // Clone new bounds

  var bounds = draggable.props.bounds;
  bounds = typeof bounds === 'string' ? bounds : cloneBounds(bounds);
  var node = findDOMNode(draggable);

  if (typeof bounds === 'string') {
    var ownerDocument = node.ownerDocument;
    var ownerWindow = ownerDocument.defaultView;
    var boundNode;

    if (bounds === 'parent') {
      boundNode = node.parentNode;
    } else {
      boundNode = ownerDocument.querySelector(bounds);
    }

    if (!(boundNode instanceof ownerWindow.HTMLElement)) {
      throw new Error('Bounds selector "' + bounds + '" could not find an element.');
    }

    var boundNodeEl
    /*: HTMLElement*/
    = boundNode; // for Flow, can't seem to refine correctly

    var nodeStyle = ownerWindow.getComputedStyle(node);
    var boundNodeStyle = ownerWindow.getComputedStyle(boundNodeEl); // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.

    bounds = {
      left: -node.offsetLeft + (0, _shims$1.int)(boundNodeStyle.paddingLeft) + (0, _shims$1.int)(nodeStyle.marginLeft),
      top: -node.offsetTop + (0, _shims$1.int)(boundNodeStyle.paddingTop) + (0, _shims$1.int)(nodeStyle.marginTop),
      right: (0, _domFns$1.innerWidth)(boundNodeEl) - (0, _domFns$1.outerWidth)(node) - node.offsetLeft + (0, _shims$1.int)(boundNodeStyle.paddingRight) - (0, _shims$1.int)(nodeStyle.marginRight),
      bottom: (0, _domFns$1.innerHeight)(boundNodeEl) - (0, _domFns$1.outerHeight)(node) - node.offsetTop + (0, _shims$1.int)(boundNodeStyle.paddingBottom) - (0, _shims$1.int)(nodeStyle.marginBottom)
    };
  } // Keep x and y below right and bottom limits...


  if ((0, _shims$1.isNum)(bounds.right)) x = Math.min(x, bounds.right);
  if ((0, _shims$1.isNum)(bounds.bottom)) y = Math.min(y, bounds.bottom); // But above left and top limits.

  if ((0, _shims$1.isNum)(bounds.left)) x = Math.max(x, bounds.left);
  if ((0, _shims$1.isNum)(bounds.top)) y = Math.max(y, bounds.top);
  return [x, y];
}

function snapToGrid(grid
/*: [number, number]*/
, pendingX
/*: number*/
, pendingY
/*: number*/
)
/*: [number, number]*/
{
  var x = Math.round(pendingX / grid[0]) * grid[0];
  var y = Math.round(pendingY / grid[1]) * grid[1];
  return [x, y];
}

function canDragX(draggable
/*: Draggable*/
)
/*: boolean*/
{
  return draggable.props.axis === 'both' || draggable.props.axis === 'x';
}

function canDragY(draggable
/*: Draggable*/
)
/*: boolean*/
{
  return draggable.props.axis === 'both' || draggable.props.axis === 'y';
} // Get {x, y} positions from event.


function getControlPosition(e
/*: MouseTouchEvent*/
, touchIdentifier
/*: ?number*/
, draggableCore
/*: DraggableCore*/
)
/*: ?ControlPosition*/
{
  var touchObj = typeof touchIdentifier === 'number' ? (0, _domFns$1.getTouch)(e, touchIdentifier) : null;
  if (typeof touchIdentifier === 'number' && !touchObj) return null; // not the right touch

  var node = findDOMNode(draggableCore); // User can provide an offsetParent if desired.

  var offsetParent = draggableCore.props.offsetParent || node.offsetParent || node.ownerDocument.body;
  return (0, _domFns$1.offsetXYFromParent)(touchObj || e, offsetParent, draggableCore.props.scale);
} // Create an data object exposed by <DraggableCore>'s events


function createCoreData(draggable
/*: DraggableCore*/
, x
/*: number*/
, y
/*: number*/
)
/*: DraggableData*/
{
  var state = draggable.state;
  var isStart = !(0, _shims$1.isNum)(state.lastX);
  var node = findDOMNode(draggable);

  if (isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      node: node,
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
      x: x,
      y: y
    };
  } else {
    // Otherwise calculate proper values.
    return {
      node: node,
      deltaX: x - state.lastX,
      deltaY: y - state.lastY,
      lastX: state.lastX,
      lastY: state.lastY,
      x: x,
      y: y
    };
  }
} // Create an data exposed by <Draggable>'s events


function createDraggableData(draggable
/*: Draggable*/
, coreData
/*: DraggableData*/
)
/*: DraggableData*/
{
  var scale = draggable.props.scale;
  return {
    node: coreData.node,
    x: draggable.state.x + coreData.deltaX / scale,
    y: draggable.state.y + coreData.deltaY / scale,
    deltaX: coreData.deltaX / scale,
    deltaY: coreData.deltaY / scale,
    lastX: draggable.state.x,
    lastY: draggable.state.y
  };
} // A lot faster than stringify/parse


function cloneBounds(bounds
/*: Bounds*/
)
/*: Bounds*/
{
  return {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom
  };
}

function findDOMNode(draggable
/*: Draggable | DraggableCore*/
)
/*: HTMLElement*/
{
  var node = draggable.findDOMNode();

  if (!node) {
    throw new Error('<DraggableCore>: Unmounted during event!');
  } // $FlowIgnore we can't assert on HTMLElement due to tests... FIXME


  return node;
}

var DraggableCore$2 = {};

var log$1 = {};

Object.defineProperty(log$1, "__esModule", {
  value: true
});
log$1.default = log;

/*eslint no-console:0*/
function log() {
}

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(DraggableCore$2, "__esModule", {
  value: true
});
DraggableCore$2.default = void 0;

var React = _interopRequireWildcard(React__default);

var _propTypes = _interopRequireDefault(PropTypes);

var _reactDom = _interopRequireDefault(require$$2);

var _domFns = domFns;

var _positionFns = positionFns;

var _shims = shims;

var _log = _interopRequireDefault(log$1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Simple abstraction for dragging events names.
var eventsFor = {
  touch: {
    start: 'touchstart',
    move: 'touchmove',
    stop: 'touchend'
  },
  mouse: {
    start: 'mousedown',
    move: 'mousemove',
    stop: 'mouseup'
  }
}; // Default to mouse events.

var dragEventFor = eventsFor.mouse;
/*:: type DraggableCoreState = {
  dragging: boolean,
  lastX: number,
  lastY: number,
  touchIdentifier: ?number
};*/

/*:: export type DraggableData = {
  node: HTMLElement,
  x: number, y: number,
  deltaX: number, deltaY: number,
  lastX: number, lastY: number,
};*/

/*:: export type DraggableEventHandler = (e: MouseEvent, data: DraggableData) => void | false;*/

/*:: export type ControlPosition = {x: number, y: number};*/

/*:: export type PositionOffsetControlPosition = {x: number|string, y: number|string};*/

/*:: export type DraggableCoreDefaultProps = {
  allowAnyClick: boolean,
  disabled: boolean,
  enableUserSelectHack: boolean,
  onStart: DraggableEventHandler,
  onDrag: DraggableEventHandler,
  onStop: DraggableEventHandler,
  onMouseDown: (e: MouseEvent) => void,
  scale: number,
};*/

/*:: export type DraggableCoreProps = {
  ...DraggableCoreDefaultProps,
  cancel: string,
  children: ReactElement<any>,
  offsetParent: HTMLElement,
  grid: [number, number],
  handle: string,
  nodeRef?: ?React.ElementRef<any>,
};*/

//
// Define <DraggableCore>.
//
// <DraggableCore> is for advanced usage of <Draggable>. It maintains minimal internal state so it can
// work well with libraries that require more control over the element.
//
var DraggableCore$1 = /*#__PURE__*/function (_React$Component) {
  _inherits(DraggableCore, _React$Component);

  var _super = _createSuper(DraggableCore);

  function DraggableCore() {
    var _this;

    _classCallCheck(this, DraggableCore);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "state", {
      dragging: false,
      // Used while dragging to determine deltas.
      lastX: NaN,
      lastY: NaN,
      touchIdentifier: null
    });

    _defineProperty(_assertThisInitialized(_this), "mounted", false);

    _defineProperty(_assertThisInitialized(_this), "handleDragStart", function (e) {
      // Make it possible to attach event handlers on top of this one.
      _this.props.onMouseDown(e); // Only accept left-clicks.


      if (!_this.props.allowAnyClick && typeof e.button === 'number' && e.button !== 0) return false; // Get nodes. Be sure to grab relative document (could be iframed)

      var thisNode = _this.findDOMNode();

      if (!thisNode || !thisNode.ownerDocument || !thisNode.ownerDocument.body) {
        throw new Error('<DraggableCore> not mounted on DragStart!');
      }

      var ownerDocument = thisNode.ownerDocument; // Short circuit if handle or cancel prop was provided and selector doesn't match.

      if (_this.props.disabled || !(e.target instanceof ownerDocument.defaultView.Node) || _this.props.handle && !(0, _domFns.matchesSelectorAndParentsTo)(e.target, _this.props.handle, thisNode) || _this.props.cancel && (0, _domFns.matchesSelectorAndParentsTo)(e.target, _this.props.cancel, thisNode)) {
        return;
      } // Prevent scrolling on mobile devices, like ipad/iphone.
      // Important that this is after handle/cancel.


      if (e.type === 'touchstart') e.preventDefault(); // Set touch identifier in component state if this is a touch event. This allows us to
      // distinguish between individual touches on multitouch screens by identifying which
      // touchpoint was set to this element.

      var touchIdentifier = (0, _domFns.getTouchIdentifier)(e);

      _this.setState({
        touchIdentifier: touchIdentifier
      }); // Get the current drag point from the event. This is used as the offset.


      var position = (0, _positionFns.getControlPosition)(e, touchIdentifier, _assertThisInitialized(_this));
      if (position == null) return; // not possible but satisfies flow

      var x = position.x,
          y = position.y; // Create an event object with all the data parents need to make a decision here.

      var coreEvent = (0, _positionFns.createCoreData)(_assertThisInitialized(_this), x, y);
      (0, _log.default)('DraggableCore: handleDragStart: %j', coreEvent); // Call event handler. If it returns explicit false, cancel.

      (0, _log.default)('calling', _this.props.onStart);

      var shouldUpdate = _this.props.onStart(e, coreEvent);

      if (shouldUpdate === false || _this.mounted === false) return; // Add a style to the body to disable user-select. This prevents text from
      // being selected all over the page.

      if (_this.props.enableUserSelectHack) (0, _domFns.addUserSelectStyles)(ownerDocument); // Initiate dragging. Set the current x and y as offsets
      // so we know how much we've moved during the drag. This allows us
      // to drag elements around even if they have been moved, without issue.

      _this.setState({
        dragging: true,
        lastX: x,
        lastY: y
      }); // Add events to the document directly so we catch when the user's mouse/touch moves outside of
      // this element. We use different events depending on whether or not we have detected that this
      // is a touch-capable device.


      (0, _domFns.addEvent)(ownerDocument, dragEventFor.move, _this.handleDrag);
      (0, _domFns.addEvent)(ownerDocument, dragEventFor.stop, _this.handleDragStop);
    });

    _defineProperty(_assertThisInitialized(_this), "handleDrag", function (e) {
      // Get the current drag point from the event. This is used as the offset.
      var position = (0, _positionFns.getControlPosition)(e, _this.state.touchIdentifier, _assertThisInitialized(_this));
      if (position == null) return;
      var x = position.x,
          y = position.y; // Snap to grid if prop has been provided

      if (Array.isArray(_this.props.grid)) {
        var deltaX = x - _this.state.lastX,
            deltaY = y - _this.state.lastY;

        var _snapToGrid = (0, _positionFns.snapToGrid)(_this.props.grid, deltaX, deltaY);

        var _snapToGrid2 = _slicedToArray(_snapToGrid, 2);

        deltaX = _snapToGrid2[0];
        deltaY = _snapToGrid2[1];
        if (!deltaX && !deltaY) return; // skip useless drag

        x = _this.state.lastX + deltaX, y = _this.state.lastY + deltaY;
      }

      var coreEvent = (0, _positionFns.createCoreData)(_assertThisInitialized(_this), x, y);
      (0, _log.default)('DraggableCore: handleDrag: %j', coreEvent); // Call event handler. If it returns explicit false, trigger end.

      var shouldUpdate = _this.props.onDrag(e, coreEvent);

      if (shouldUpdate === false || _this.mounted === false) {
        try {
          // $FlowIgnore
          _this.handleDragStop(new MouseEvent('mouseup'));
        } catch (err) {
          // Old browsers
          var event = ((document.createEvent('MouseEvents')
          /*: any*/
          )
          /*: MouseTouchEvent*/
          ); // I see why this insanity was deprecated
          // $FlowIgnore

          event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

          _this.handleDragStop(event);
        }

        return;
      }

      _this.setState({
        lastX: x,
        lastY: y
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleDragStop", function (e) {
      if (!_this.state.dragging) return;
      var position = (0, _positionFns.getControlPosition)(e, _this.state.touchIdentifier, _assertThisInitialized(_this));
      if (position == null) return;
      var x = position.x,
          y = position.y; // Snap to grid if prop has been provided

      if (Array.isArray(_this.props.grid)) {
        var deltaX = x - _this.state.lastX || 0;
        var deltaY = y - _this.state.lastY || 0;

        var _snapToGrid3 = (0, _positionFns.snapToGrid)(_this.props.grid, deltaX, deltaY);

        var _snapToGrid4 = _slicedToArray(_snapToGrid3, 2);

        deltaX = _snapToGrid4[0];
        deltaY = _snapToGrid4[1];
        x = _this.state.lastX + deltaX, y = _this.state.lastY + deltaY;
      }

      var coreEvent = (0, _positionFns.createCoreData)(_assertThisInitialized(_this), x, y); // Call event handler

      var shouldContinue = _this.props.onStop(e, coreEvent);

      if (shouldContinue === false || _this.mounted === false) return false;

      var thisNode = _this.findDOMNode();

      if (thisNode) {
        // Remove user-select hack
        if (_this.props.enableUserSelectHack) (0, _domFns.removeUserSelectStyles)(thisNode.ownerDocument);
      }

      (0, _log.default)('DraggableCore: handleDragStop: %j', coreEvent); // Reset the el.

      _this.setState({
        dragging: false,
        lastX: NaN,
        lastY: NaN
      });

      if (thisNode) {
        // Remove event handlers
        (0, _log.default)('DraggableCore: Removing handlers');
        (0, _domFns.removeEvent)(thisNode.ownerDocument, dragEventFor.move, _this.handleDrag);
        (0, _domFns.removeEvent)(thisNode.ownerDocument, dragEventFor.stop, _this.handleDragStop);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "onMouseDown", function (e) {
      dragEventFor = eventsFor.mouse; // on touchscreen laptops we could switch back to mouse

      return _this.handleDragStart(e);
    });

    _defineProperty(_assertThisInitialized(_this), "onMouseUp", function (e) {
      dragEventFor = eventsFor.mouse;
      return _this.handleDragStop(e);
    });

    _defineProperty(_assertThisInitialized(_this), "onTouchStart", function (e) {
      // We're on a touch device now, so change the event handlers
      dragEventFor = eventsFor.touch;
      return _this.handleDragStart(e);
    });

    _defineProperty(_assertThisInitialized(_this), "onTouchEnd", function (e) {
      // We're on a touch device now, so change the event handlers
      dragEventFor = eventsFor.touch;
      return _this.handleDragStop(e);
    });

    return _this;
  }

  _createClass(DraggableCore, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.mounted = true; // Touch handlers must be added with {passive: false} to be cancelable.
      // https://developers.google.com/web/updates/2017/01/scrolling-intervention

      var thisNode = this.findDOMNode();

      if (thisNode) {
        (0, _domFns.addEvent)(thisNode, eventsFor.touch.start, this.onTouchStart, {
          passive: false
        });
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.mounted = false; // Remove any leftover event handlers. Remove both touch and mouse handlers in case
      // some browser quirk caused a touch event to fire during a mouse move, or vice versa.

      var thisNode = this.findDOMNode();

      if (thisNode) {
        var ownerDocument = thisNode.ownerDocument;
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.mouse.move, this.handleDrag);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.touch.move, this.handleDrag);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.mouse.stop, this.handleDragStop);
        (0, _domFns.removeEvent)(ownerDocument, eventsFor.touch.stop, this.handleDragStop);
        (0, _domFns.removeEvent)(thisNode, eventsFor.touch.start, this.onTouchStart, {
          passive: false
        });
        if (this.props.enableUserSelectHack) (0, _domFns.removeUserSelectStyles)(ownerDocument);
      }
    } // React Strict Mode compatibility: if `nodeRef` is passed, we will use it instead of trying to find
    // the underlying DOM node ourselves. See the README for more information.

  }, {
    key: "findDOMNode",
    value: function findDOMNode()
    /*: ?HTMLElement*/
    {
      var _this$props, _this$props2, _this$props2$nodeRef;

      return (_this$props = this.props) !== null && _this$props !== void 0 && _this$props.nodeRef ? (_this$props2 = this.props) === null || _this$props2 === void 0 ? void 0 : (_this$props2$nodeRef = _this$props2.nodeRef) === null || _this$props2$nodeRef === void 0 ? void 0 : _this$props2$nodeRef.current : _reactDom.default.findDOMNode(this);
    }
  }, {
    key: "render",
    value: function render()
    /*: React.Element<any>*/
    {
      // Reuse the child provided
      // This makes it flexible to use whatever element is wanted (div, ul, etc)
      return /*#__PURE__*/React.cloneElement(React.Children.only(this.props.children), {
        // Note: mouseMove handler is attached to document so it will still function
        // when the user drags quickly and leaves the bounds of the element.
        onMouseDown: this.onMouseDown,
        onMouseUp: this.onMouseUp,
        // onTouchStart is added on `componentDidMount` so they can be added with
        // {passive: false}, which allows it to cancel. See
        // https://developers.google.com/web/updates/2017/01/scrolling-intervention
        onTouchEnd: this.onTouchEnd
      });
    }
  }]);

  return DraggableCore;
}(React.Component);

DraggableCore$2.default = DraggableCore$1;

_defineProperty(DraggableCore$1, "displayName", 'DraggableCore');

_defineProperty(DraggableCore$1, "propTypes", {
  /**
   * `allowAnyClick` allows dragging using any mouse button.
   * By default, we only accept the left button.
   *
   * Defaults to `false`.
   */
  allowAnyClick: _propTypes.default.bool,

  /**
   * `disabled`, if true, stops the <Draggable> from dragging. All handlers,
   * with the exception of `onMouseDown`, will not fire.
   */
  disabled: _propTypes.default.bool,

  /**
   * By default, we add 'user-select:none' attributes to the document body
   * to prevent ugly text selection during drag. If this is causing problems
   * for your app, set this to `false`.
   */
  enableUserSelectHack: _propTypes.default.bool,

  /**
   * `offsetParent`, if set, uses the passed DOM node to compute drag offsets
   * instead of using the parent node.
   */
  offsetParent: function offsetParent(props
  /*: DraggableCoreProps*/
  , propName
  /*: $Keys<DraggableCoreProps>*/
  ) {
    if (props[propName] && props[propName].nodeType !== 1) {
      throw new Error('Draggable\'s offsetParent must be a DOM Node.');
    }
  },

  /**
   * `grid` specifies the x and y that dragging should snap to.
   */
  grid: _propTypes.default.arrayOf(_propTypes.default.number),

  /**
   * `handle` specifies a selector to be used as the handle that initiates drag.
   *
   * Example:
   *
   * ```jsx
   *   let App = React.createClass({
   *       render: function () {
   *         return (
   *            <Draggable handle=".handle">
   *              <div>
   *                  <div className="handle">Click me to drag</div>
   *                  <div>This is some other content</div>
   *              </div>
   *           </Draggable>
   *         );
   *       }
   *   });
   * ```
   */
  handle: _propTypes.default.string,

  /**
   * `cancel` specifies a selector to be used to prevent drag initialization.
   *
   * Example:
   *
   * ```jsx
   *   let App = React.createClass({
   *       render: function () {
   *           return(
   *               <Draggable cancel=".cancel">
   *                   <div>
   *                     <div className="cancel">You can't drag from here</div>
   *                     <div>Dragging here works fine</div>
   *                   </div>
   *               </Draggable>
   *           );
   *       }
   *   });
   * ```
   */
  cancel: _propTypes.default.string,

  /* If running in React Strict mode, ReactDOM.findDOMNode() is deprecated.
   * Unfortunately, in order for <Draggable> to work properly, we need raw access
   * to the underlying DOM node. If you want to avoid the warning, pass a `nodeRef`
   * as in this example:
   *
   * function MyComponent() {
   *   const nodeRef = React.useRef(null);
   *   return (
   *     <Draggable nodeRef={nodeRef}>
   *       <div ref={nodeRef}>Example Target</div>
   *     </Draggable>
   *   );
   * }
   *
   * This can be used for arbitrarily nested components, so long as the ref ends up
   * pointing to the actual child DOM node and not a custom component.
   */
  nodeRef: _propTypes.default.object,

  /**
   * Called when dragging starts.
   * If this function returns the boolean false, dragging will be canceled.
   */
  onStart: _propTypes.default.func,

  /**
   * Called while dragging.
   * If this function returns the boolean false, dragging will be canceled.
   */
  onDrag: _propTypes.default.func,

  /**
   * Called when dragging stops.
   * If this function returns the boolean false, the drag will remain active.
   */
  onStop: _propTypes.default.func,

  /**
   * A workaround option which can be passed if onMouseDown needs to be accessed,
   * since it'll always be blocked (as there is internal use of onMouseDown)
   */
  onMouseDown: _propTypes.default.func,

  /**
   * `scale`, if set, applies scaling while dragging an element
   */
  scale: _propTypes.default.number,

  /**
   * These properties should be defined on the child, not here.
   */
  className: _shims.dontSetMe,
  style: _shims.dontSetMe,
  transform: _shims.dontSetMe
});

_defineProperty(DraggableCore$1, "defaultProps", {
  allowAnyClick: false,
  // by default only accept left click
  disabled: false,
  enableUserSelectHack: true,
  onStart: function onStart() {},
  onDrag: function onDrag() {},
  onStop: function onStop() {},
  onMouseDown: function onMouseDown() {},
  scale: 1
});

(function (exports) {

	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	Object.defineProperty(exports, "DraggableCore", {
	  enumerable: true,
	  get: function get() {
	    return _DraggableCore.default;
	  }
	});
	exports.default = void 0;

	var React = _interopRequireWildcard(React__default);

	var _propTypes = _interopRequireDefault(PropTypes);

	var _reactDom = _interopRequireDefault(require$$2);

	var _clsx2 = _interopRequireDefault(require$$3);

	var _domFns = domFns;

	var _positionFns = positionFns;

	var _shims = shims;

	var _DraggableCore = _interopRequireDefault(DraggableCore$2);

	var _log = _interopRequireDefault(log$1);

	var _excluded = ["axis", "bounds", "children", "defaultPosition", "defaultClassName", "defaultClassNameDragging", "defaultClassNameDragged", "position", "positionOffset", "scale"];

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

	function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

	function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

	function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

	function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	//
	// Define <Draggable>
	//
	var Draggable = /*#__PURE__*/function (_React$Component) {
	  _inherits(Draggable, _React$Component);

	  var _super = _createSuper(Draggable);

	  function Draggable(props
	  /*: DraggableProps*/
	  ) {
	    var _this;

	    _classCallCheck(this, Draggable);

	    _this = _super.call(this, props);

	    _defineProperty(_assertThisInitialized(_this), "onDragStart", function (e, coreData) {
	      (0, _log.default)('Draggable: onDragStart: %j', coreData); // Short-circuit if user's callback killed it.

	      var shouldStart = _this.props.onStart(e, (0, _positionFns.createDraggableData)(_assertThisInitialized(_this), coreData)); // Kills start event on core as well, so move handlers are never bound.


	      if (shouldStart === false) return false;

	      _this.setState({
	        dragging: true,
	        dragged: true
	      });
	    });

	    _defineProperty(_assertThisInitialized(_this), "onDrag", function (e, coreData) {
	      if (!_this.state.dragging) return false;
	      (0, _log.default)('Draggable: onDrag: %j', coreData);
	      var uiData = (0, _positionFns.createDraggableData)(_assertThisInitialized(_this), coreData);
	      var newState
	      /*: $Shape<DraggableState>*/
	      = {
	        x: uiData.x,
	        y: uiData.y
	      }; // Keep within bounds.

	      if (_this.props.bounds) {
	        // Save original x and y.
	        var x = newState.x,
	            y = newState.y; // Add slack to the values used to calculate bound position. This will ensure that if
	        // we start removing slack, the element won't react to it right away until it's been
	        // completely removed.

	        newState.x += _this.state.slackX;
	        newState.y += _this.state.slackY; // Get bound position. This will ceil/floor the x and y within the boundaries.

	        var _getBoundPosition = (0, _positionFns.getBoundPosition)(_assertThisInitialized(_this), newState.x, newState.y),
	            _getBoundPosition2 = _slicedToArray(_getBoundPosition, 2),
	            newStateX = _getBoundPosition2[0],
	            newStateY = _getBoundPosition2[1];

	        newState.x = newStateX;
	        newState.y = newStateY; // Recalculate slack by noting how much was shaved by the boundPosition handler.

	        newState.slackX = _this.state.slackX + (x - newState.x);
	        newState.slackY = _this.state.slackY + (y - newState.y); // Update the event we fire to reflect what really happened after bounds took effect.

	        uiData.x = newState.x;
	        uiData.y = newState.y;
	        uiData.deltaX = newState.x - _this.state.x;
	        uiData.deltaY = newState.y - _this.state.y;
	      } // Short-circuit if user's callback killed it.


	      var shouldUpdate = _this.props.onDrag(e, uiData);

	      if (shouldUpdate === false) return false;

	      _this.setState(newState);
	    });

	    _defineProperty(_assertThisInitialized(_this), "onDragStop", function (e, coreData) {
	      if (!_this.state.dragging) return false; // Short-circuit if user's callback killed it.

	      var shouldContinue = _this.props.onStop(e, (0, _positionFns.createDraggableData)(_assertThisInitialized(_this), coreData));

	      if (shouldContinue === false) return false;
	      (0, _log.default)('Draggable: onDragStop: %j', coreData);
	      var newState
	      /*: $Shape<DraggableState>*/
	      = {
	        dragging: false,
	        slackX: 0,
	        slackY: 0
	      }; // If this is a controlled component, the result of this operation will be to
	      // revert back to the old position. We expect a handler on `onDragStop`, at the least.

	      var controlled = Boolean(_this.props.position);

	      if (controlled) {
	        var _this$props$position = _this.props.position,
	            x = _this$props$position.x,
	            y = _this$props$position.y;
	        newState.x = x;
	        newState.y = y;
	      }

	      _this.setState(newState);
	    });

	    _this.state = {
	      // Whether or not we are currently dragging.
	      dragging: false,
	      // Whether or not we have been dragged before.
	      dragged: false,
	      // Current transform x and y.
	      x: props.position ? props.position.x : props.defaultPosition.x,
	      y: props.position ? props.position.y : props.defaultPosition.y,
	      prevPropsPosition: _objectSpread({}, props.position),
	      // Used for compensating for out-of-bounds drags
	      slackX: 0,
	      slackY: 0,
	      // Can only determine if SVG after mounting
	      isElementSVG: false
	    };

	    if (props.position && !(props.onDrag || props.onStop)) {
	      // eslint-disable-next-line no-console
	      console.warn('A `position` was applied to this <Draggable>, without drag handlers. This will make this ' + 'component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the ' + '`position` of this element.');
	    }

	    return _this;
	  }

	  _createClass(Draggable, [{
	    key: "componentDidMount",
	    value: function componentDidMount() {
	      // Check to see if the element passed is an instanceof SVGElement
	      if (typeof window.SVGElement !== 'undefined' && this.findDOMNode() instanceof window.SVGElement) {
	        this.setState({
	          isElementSVG: true
	        });
	      }
	    }
	  }, {
	    key: "componentWillUnmount",
	    value: function componentWillUnmount() {
	      this.setState({
	        dragging: false
	      }); // prevents invariant if unmounted while dragging
	    } // React Strict Mode compatibility: if `nodeRef` is passed, we will use it instead of trying to find
	    // the underlying DOM node ourselves. See the README for more information.

	  }, {
	    key: "findDOMNode",
	    value: function findDOMNode()
	    /*: ?HTMLElement*/
	    {
	      var _this$props$nodeRef$c, _this$props, _this$props$nodeRef;

	      return (_this$props$nodeRef$c = (_this$props = this.props) === null || _this$props === void 0 ? void 0 : (_this$props$nodeRef = _this$props.nodeRef) === null || _this$props$nodeRef === void 0 ? void 0 : _this$props$nodeRef.current) !== null && _this$props$nodeRef$c !== void 0 ? _this$props$nodeRef$c : _reactDom.default.findDOMNode(this);
	    }
	  }, {
	    key: "render",
	    value: function render()
	    /*: ReactElement<any>*/
	    {
	      var _clsx;

	      var _this$props2 = this.props;
	          _this$props2.axis;
	          _this$props2.bounds;
	          var children = _this$props2.children,
	          defaultPosition = _this$props2.defaultPosition,
	          defaultClassName = _this$props2.defaultClassName,
	          defaultClassNameDragging = _this$props2.defaultClassNameDragging,
	          defaultClassNameDragged = _this$props2.defaultClassNameDragged,
	          position = _this$props2.position,
	          positionOffset = _this$props2.positionOffset;
	          _this$props2.scale;
	          var draggableCoreProps = _objectWithoutProperties(_this$props2, _excluded);

	      var style = {};
	      var svgTransform = null; // If this is controlled, we don't want to move it - unless it's dragging.

	      var controlled = Boolean(position);
	      var draggable = !controlled || this.state.dragging;
	      var validPosition = position || defaultPosition;
	      var transformOpts = {
	        // Set left if horizontal drag is enabled
	        x: (0, _positionFns.canDragX)(this) && draggable ? this.state.x : validPosition.x,
	        // Set top if vertical drag is enabled
	        y: (0, _positionFns.canDragY)(this) && draggable ? this.state.y : validPosition.y
	      }; // If this element was SVG, we use the `transform` attribute.

	      if (this.state.isElementSVG) {
	        svgTransform = (0, _domFns.createSVGTransform)(transformOpts, positionOffset);
	      } else {
	        // Add a CSS transform to move the element around. This allows us to move the element around
	        // without worrying about whether or not it is relatively or absolutely positioned.
	        // If the item you are dragging already has a transform set, wrap it in a <span> so <Draggable>
	        // has a clean slate.
	        style = (0, _domFns.createCSSTransform)(transformOpts, positionOffset);
	      } // Mark with class while dragging


	      var className = (0, _clsx2.default)(children.props.className || '', defaultClassName, (_clsx = {}, _defineProperty(_clsx, defaultClassNameDragging, this.state.dragging), _defineProperty(_clsx, defaultClassNameDragged, this.state.dragged), _clsx)); // Reuse the child provided
	      // This makes it flexible to use whatever element is wanted (div, ul, etc)

	      return /*#__PURE__*/React.createElement(_DraggableCore.default, _extends({}, draggableCoreProps, {
	        onStart: this.onDragStart,
	        onDrag: this.onDrag,
	        onStop: this.onDragStop
	      }), /*#__PURE__*/React.cloneElement(React.Children.only(children), {
	        className: className,
	        style: _objectSpread(_objectSpread({}, children.props.style), style),
	        transform: svgTransform
	      }));
	    }
	  }], [{
	    key: "getDerivedStateFromProps",
	    value: // React 16.3+
	    // Arity (props, state)
	    function getDerivedStateFromProps(_ref, _ref2)
	    /*: ?$Shape<DraggableState>*/
	    {
	      var position = _ref.position;
	      var prevPropsPosition = _ref2.prevPropsPosition;

	      // Set x/y if a new position is provided in props that is different than the previous.
	      if (position && (!prevPropsPosition || position.x !== prevPropsPosition.x || position.y !== prevPropsPosition.y)) {
	        (0, _log.default)('Draggable: getDerivedStateFromProps %j', {
	          position: position,
	          prevPropsPosition: prevPropsPosition
	        });
	        return {
	          x: position.x,
	          y: position.y,
	          prevPropsPosition: _objectSpread({}, position)
	        };
	      }

	      return null;
	    }
	  }]);

	  return Draggable;
	}(React.Component);

	exports.default = Draggable;

	_defineProperty(Draggable, "displayName", 'Draggable');

	_defineProperty(Draggable, "propTypes", _objectSpread(_objectSpread({}, _DraggableCore.default.propTypes), {}, {
	  /**
	   * `axis` determines which axis the draggable can move.
	   *
	   *  Note that all callbacks will still return data as normal. This only
	   *  controls flushing to the DOM.
	   *
	   * 'both' allows movement horizontally and vertically.
	   * 'x' limits movement to horizontal axis.
	   * 'y' limits movement to vertical axis.
	   * 'none' limits all movement.
	   *
	   * Defaults to 'both'.
	   */
	  axis: _propTypes.default.oneOf(['both', 'x', 'y', 'none']),

	  /**
	   * `bounds` determines the range of movement available to the element.
	   * Available values are:
	   *
	   * 'parent' restricts movement within the Draggable's parent node.
	   *
	   * Alternatively, pass an object with the following properties, all of which are optional:
	   *
	   * {left: LEFT_BOUND, right: RIGHT_BOUND, bottom: BOTTOM_BOUND, top: TOP_BOUND}
	   *
	   * All values are in px.
	   *
	   * Example:
	   *
	   * ```jsx
	   *   let App = React.createClass({
	   *       render: function () {
	   *         return (
	   *            <Draggable bounds={{right: 300, bottom: 300}}>
	   *              <div>Content</div>
	   *           </Draggable>
	   *         );
	   *       }
	   *   });
	   * ```
	   */
	  bounds: _propTypes.default.oneOfType([_propTypes.default.shape({
	    left: _propTypes.default.number,
	    right: _propTypes.default.number,
	    top: _propTypes.default.number,
	    bottom: _propTypes.default.number
	  }), _propTypes.default.string, _propTypes.default.oneOf([false])]),
	  defaultClassName: _propTypes.default.string,
	  defaultClassNameDragging: _propTypes.default.string,
	  defaultClassNameDragged: _propTypes.default.string,

	  /**
	   * `defaultPosition` specifies the x and y that the dragged item should start at
	   *
	   * Example:
	   *
	   * ```jsx
	   *      let App = React.createClass({
	   *          render: function () {
	   *              return (
	   *                  <Draggable defaultPosition={{x: 25, y: 25}}>
	   *                      <div>I start with transformX: 25px and transformY: 25px;</div>
	   *                  </Draggable>
	   *              );
	   *          }
	   *      });
	   * ```
	   */
	  defaultPosition: _propTypes.default.shape({
	    x: _propTypes.default.number,
	    y: _propTypes.default.number
	  }),
	  positionOffset: _propTypes.default.shape({
	    x: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string]),
	    y: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string])
	  }),

	  /**
	   * `position`, if present, defines the current position of the element.
	   *
	   *  This is similar to how form elements in React work - if no `position` is supplied, the component
	   *  is uncontrolled.
	   *
	   * Example:
	   *
	   * ```jsx
	   *      let App = React.createClass({
	   *          render: function () {
	   *              return (
	   *                  <Draggable position={{x: 25, y: 25}}>
	   *                      <div>I start with transformX: 25px and transformY: 25px;</div>
	   *                  </Draggable>
	   *              );
	   *          }
	   *      });
	   * ```
	   */
	  position: _propTypes.default.shape({
	    x: _propTypes.default.number,
	    y: _propTypes.default.number
	  }),

	  /**
	   * These properties should be defined on the child, not here.
	   */
	  className: _shims.dontSetMe,
	  style: _shims.dontSetMe,
	  transform: _shims.dontSetMe
	}));

	_defineProperty(Draggable, "defaultProps", _objectSpread(_objectSpread({}, _DraggableCore.default.defaultProps), {}, {
	  axis: 'both',
	  bounds: false,
	  defaultClassName: 'react-draggable',
	  defaultClassNameDragging: 'react-draggable-dragging',
	  defaultClassNameDragged: 'react-draggable-dragged',
	  defaultPosition: {
	    x: 0,
	    y: 0
	  },
	  scale: 1
	})); 
} (Draggable$2));

var _require = Draggable$2,
    Draggable = _require.default,
    DraggableCore = _require.DraggableCore; // Previous versions of this lib exported <Draggable> as the root export. As to no-// them, or TypeScript, we export *both* as the root and as 'default'.
// See https://github.com/mzabriskie/react-draggable/pull/254
// and https://github.com/mzabriskie/react-draggable/issues/266


cjs.exports = Draggable;
cjs.exports.default = Draggable;
cjs.exports.DraggableCore = DraggableCore;

var cjsExports = cjs.exports;
var Draggable$1 = /*@__PURE__*/getDefaultExportFromCjs(cjsExports);

const GenericScreenPlotContainer = ({ disp, svgId }) => {
    const nodeRef = useRef(null);
    return (jsx(Draggable$1, { nodeRef: nodeRef, defaultPosition: { x: window.innerWidth / 1.5, y: -window.innerHeight / 1.5 }, children: jsx("div", { ref: nodeRef, className: "drag-box", style: { display: disp ? 'block' : 'none', boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)", overflow: "auto", maxWidth: window.innerWidth / 2, maxHeight: window.innerHeight }, children: jsx("div", { id: svgId }) }) }));
};

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

function chainPropTypes(propType1, propType2) {
  if (process.env.NODE_ENV === 'production') {
    return () => null;
  }
  return function validate(...args) {
    return propType1(...args) || propType2(...args);
  };
}

function isPlainObject(item) {
  return item !== null && typeof item === 'object' && item.constructor === Object;
}
function deepClone(source) {
  if (!isPlainObject(source)) {
    return source;
  }
  const output = {};
  Object.keys(source).forEach(key => {
    output[key] = deepClone(source[key]);
  });
  return output;
}
function deepmerge(target, source, options = {
  clone: true
}) {
  const output = options.clone ? _extends({}, target) : target;
  if (isPlainObject(target) && isPlainObject(source)) {
    Object.keys(source).forEach(key => {
      // Avoid prototype pollution
      if (key === '__proto__') {
        return;
      }
      if (isPlainObject(source[key]) && key in target && isPlainObject(target[key])) {
        // Since `output` is a clone of `target` and we have narrowed `target` in this block we can cast to the same type.
        output[key] = deepmerge(target[key], source[key], options);
      } else if (options.clone) {
        output[key] = isPlainObject(source[key]) ? deepClone(source[key]) : source[key];
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

/**
 * WARNING: Don't import this directly.
 * Use `MuiError` from `@mui/utils/macros/MuiError.macro` instead.
 * @param {number} code
 */
function formatMuiErrorMessage(code) {
  // Apply babel-plugin-transform-template-literals in loose mode
  // loose mode is safe iff we're concatenating primitives
  // see https://babeljs.io/docs/en/babel-plugin-transform-template-literals#loose
  /* eslint-disable prefer-template */
  let url = 'https://mui.com/production-error/?code=' + code;
  for (let i = 1; i < arguments.length; i += 1) {
    // rest params over-transpile for this case
    // eslint-disable-next-line prefer-rest-params
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }
  return 'Minified MUI error #' + code + '; visit ' + url + ' for the full message.';
  /* eslint-enable prefer-template */
}

var reactIs = {exports: {}};

var reactIs_production_min = {};

/**
 * @license React
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_production_min;

function requireReactIs_production_min () {
	if (hasRequiredReactIs_production_min) return reactIs_production_min;
	hasRequiredReactIs_production_min = 1;
var b=Symbol.for("react.element"),c=Symbol.for("react.portal"),d=Symbol.for("react.fragment"),e=Symbol.for("react.strict_mode"),f=Symbol.for("react.profiler"),g=Symbol.for("react.provider"),h=Symbol.for("react.context"),k=Symbol.for("react.server_context"),l=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),n=Symbol.for("react.suspense_list"),p=Symbol.for("react.memo"),q=Symbol.for("react.lazy"),t=Symbol.for("react.offscreen"),u;u=Symbol.for("react.module.reference");
	function v(a){if("object"===typeof a&&null!==a){var r=a.$$typeof;switch(r){case b:switch(a=a.type,a){case d:case f:case e:case m:case n:return a;default:switch(a=a&&a.$$typeof,a){case k:case h:case l:case q:case p:case g:return a;default:return r}}case c:return r}}}reactIs_production_min.ContextConsumer=h;reactIs_production_min.ContextProvider=g;reactIs_production_min.Element=b;reactIs_production_min.ForwardRef=l;reactIs_production_min.Fragment=d;reactIs_production_min.Lazy=q;reactIs_production_min.Memo=p;reactIs_production_min.Portal=c;reactIs_production_min.Profiler=f;reactIs_production_min.StrictMode=e;reactIs_production_min.Suspense=m;
	reactIs_production_min.SuspenseList=n;reactIs_production_min.isAsyncMode=function(){return !1};reactIs_production_min.isConcurrentMode=function(){return !1};reactIs_production_min.isContextConsumer=function(a){return v(a)===h};reactIs_production_min.isContextProvider=function(a){return v(a)===g};reactIs_production_min.isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===b};reactIs_production_min.isForwardRef=function(a){return v(a)===l};reactIs_production_min.isFragment=function(a){return v(a)===d};reactIs_production_min.isLazy=function(a){return v(a)===q};reactIs_production_min.isMemo=function(a){return v(a)===p};
	reactIs_production_min.isPortal=function(a){return v(a)===c};reactIs_production_min.isProfiler=function(a){return v(a)===f};reactIs_production_min.isStrictMode=function(a){return v(a)===e};reactIs_production_min.isSuspense=function(a){return v(a)===m};reactIs_production_min.isSuspenseList=function(a){return v(a)===n};
	reactIs_production_min.isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===d||a===f||a===e||a===m||a===n||a===t||"object"===typeof a&&null!==a&&(a.$$typeof===q||a.$$typeof===p||a.$$typeof===g||a.$$typeof===h||a.$$typeof===l||a.$$typeof===u||void 0!==a.getModuleId)?!0:!1};reactIs_production_min.typeOf=v;
	return reactIs_production_min;
}

var reactIs_development = {};

/**
 * @license React
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development;

function requireReactIs_development () {
	if (hasRequiredReactIs_development) return reactIs_development;
	hasRequiredReactIs_development = 1;

	if (process.env.NODE_ENV !== "production") {
	  (function() {

	// ATTENTION
	// When adding new symbols to this file,
	// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
	// The Symbol used to tag the ReactElement-like types.
	var REACT_ELEMENT_TYPE = Symbol.for('react.element');
	var REACT_PORTAL_TYPE = Symbol.for('react.portal');
	var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
	var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
	var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
	var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
	var REACT_CONTEXT_TYPE = Symbol.for('react.context');
	var REACT_SERVER_CONTEXT_TYPE = Symbol.for('react.server_context');
	var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
	var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
	var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
	var REACT_MEMO_TYPE = Symbol.for('react.memo');
	var REACT_LAZY_TYPE = Symbol.for('react.lazy');
	var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');

	// -----------------------------------------------------------------------------

	var enableScopeAPI = false; // Experimental Create Event Handle API.
	var enableCacheElement = false;
	var enableTransitionTracing = false; // No known bugs, but needs performance testing

	var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
	// stuff. Intended to enable React core members to more easily debug scheduling
	// issues in DEV builds.

	var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

	var REACT_MODULE_REFERENCE;

	{
	  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
	}

	function isValidElementType(type) {
	  if (typeof type === 'string' || typeof type === 'function') {
	    return true;
	  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


	  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
	    return true;
	  }

	  if (typeof type === 'object' && type !== null) {
	    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
	    // types supported by any Flight configuration anywhere since
	    // we don't know which Flight build this will end up being used
	    // with.
	    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
	      return true;
	    }
	  }

	  return false;
	}

	function typeOf(object) {
	  if (typeof object === 'object' && object !== null) {
	    var $$typeof = object.$$typeof;

	    switch ($$typeof) {
	      case REACT_ELEMENT_TYPE:
	        var type = object.type;

	        switch (type) {
	          case REACT_FRAGMENT_TYPE:
	          case REACT_PROFILER_TYPE:
	          case REACT_STRICT_MODE_TYPE:
	          case REACT_SUSPENSE_TYPE:
	          case REACT_SUSPENSE_LIST_TYPE:
	            return type;

	          default:
	            var $$typeofType = type && type.$$typeof;

	            switch ($$typeofType) {
	              case REACT_SERVER_CONTEXT_TYPE:
	              case REACT_CONTEXT_TYPE:
	              case REACT_FORWARD_REF_TYPE:
	              case REACT_LAZY_TYPE:
	              case REACT_MEMO_TYPE:
	              case REACT_PROVIDER_TYPE:
	                return $$typeofType;

	              default:
	                return $$typeof;
	            }

	        }

	      case REACT_PORTAL_TYPE:
	        return $$typeof;
	    }
	  }

	  return undefined;
	}
	var ContextConsumer = REACT_CONTEXT_TYPE;
	var ContextProvider = REACT_PROVIDER_TYPE;
	var Element = REACT_ELEMENT_TYPE;
	var ForwardRef = REACT_FORWARD_REF_TYPE;
	var Fragment = REACT_FRAGMENT_TYPE;
	var Lazy = REACT_LAZY_TYPE;
	var Memo = REACT_MEMO_TYPE;
	var Portal = REACT_PORTAL_TYPE;
	var Profiler = REACT_PROFILER_TYPE;
	var StrictMode = REACT_STRICT_MODE_TYPE;
	var Suspense = REACT_SUSPENSE_TYPE;
	var SuspenseList = REACT_SUSPENSE_LIST_TYPE;
	var hasWarnedAboutDeprecatedIsAsyncMode = false;
	var hasWarnedAboutDeprecatedIsConcurrentMode = false; // AsyncMode should be deprecated

	function isAsyncMode(object) {
	  {
	    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
	      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

	      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 18+.');
	    }
	  }

	  return false;
	}
	function isConcurrentMode(object) {
	  {
	    if (!hasWarnedAboutDeprecatedIsConcurrentMode) {
	      hasWarnedAboutDeprecatedIsConcurrentMode = true; // Using console['warn'] to evade Babel and ESLint

	      console['warn']('The ReactIs.isConcurrentMode() alias has been deprecated, ' + 'and will be removed in React 18+.');
	    }
	  }

	  return false;
	}
	function isContextConsumer(object) {
	  return typeOf(object) === REACT_CONTEXT_TYPE;
	}
	function isContextProvider(object) {
	  return typeOf(object) === REACT_PROVIDER_TYPE;
	}
	function isElement(object) {
	  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function isForwardRef(object) {
	  return typeOf(object) === REACT_FORWARD_REF_TYPE;
	}
	function isFragment(object) {
	  return typeOf(object) === REACT_FRAGMENT_TYPE;
	}
	function isLazy(object) {
	  return typeOf(object) === REACT_LAZY_TYPE;
	}
	function isMemo(object) {
	  return typeOf(object) === REACT_MEMO_TYPE;
	}
	function isPortal(object) {
	  return typeOf(object) === REACT_PORTAL_TYPE;
	}
	function isProfiler(object) {
	  return typeOf(object) === REACT_PROFILER_TYPE;
	}
	function isStrictMode(object) {
	  return typeOf(object) === REACT_STRICT_MODE_TYPE;
	}
	function isSuspense(object) {
	  return typeOf(object) === REACT_SUSPENSE_TYPE;
	}
	function isSuspenseList(object) {
	  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
	}

	reactIs_development.ContextConsumer = ContextConsumer;
	reactIs_development.ContextProvider = ContextProvider;
	reactIs_development.Element = Element;
	reactIs_development.ForwardRef = ForwardRef;
	reactIs_development.Fragment = Fragment;
	reactIs_development.Lazy = Lazy;
	reactIs_development.Memo = Memo;
	reactIs_development.Portal = Portal;
	reactIs_development.Profiler = Profiler;
	reactIs_development.StrictMode = StrictMode;
	reactIs_development.Suspense = Suspense;
	reactIs_development.SuspenseList = SuspenseList;
	reactIs_development.isAsyncMode = isAsyncMode;
	reactIs_development.isConcurrentMode = isConcurrentMode;
	reactIs_development.isContextConsumer = isContextConsumer;
	reactIs_development.isContextProvider = isContextProvider;
	reactIs_development.isElement = isElement;
	reactIs_development.isForwardRef = isForwardRef;
	reactIs_development.isFragment = isFragment;
	reactIs_development.isLazy = isLazy;
	reactIs_development.isMemo = isMemo;
	reactIs_development.isPortal = isPortal;
	reactIs_development.isProfiler = isProfiler;
	reactIs_development.isStrictMode = isStrictMode;
	reactIs_development.isSuspense = isSuspense;
	reactIs_development.isSuspenseList = isSuspenseList;
	reactIs_development.isValidElementType = isValidElementType;
	reactIs_development.typeOf = typeOf;
	  })();
	}
	return reactIs_development;
}

if (process.env.NODE_ENV === 'production') {
  reactIs.exports = requireReactIs_production_min();
} else {
  reactIs.exports = requireReactIs_development();
}

var reactIsExports = reactIs.exports;

// Simplified polyfill for IE11 support
// https://github.com/JamesMGreene/Function.name/blob/58b314d4a983110c3682f1228f845d39ccca1817/Function.name.js#L3
const fnNameMatchRegex = /^\s*function(?:\s|\s*\/\*.*\*\/\s*)+([^(\s/]*)\s*/;
function getFunctionName(fn) {
  const match = `${fn}`.match(fnNameMatchRegex);
  const name = match && match[1];
  return name || '';
}
function getFunctionComponentName(Component, fallback = '') {
  return Component.displayName || Component.name || getFunctionName(Component) || fallback;
}
function getWrappedName(outerType, innerType, wrapperName) {
  const functionName = getFunctionComponentName(innerType);
  return outerType.displayName || (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName);
}

/**
 * cherry-pick from
 * https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js
 * originally forked from recompose/getDisplayName with added IE11 support
 */
function getDisplayName(Component) {
  if (Component == null) {
    return undefined;
  }
  if (typeof Component === 'string') {
    return Component;
  }
  if (typeof Component === 'function') {
    return getFunctionComponentName(Component, 'Component');
  }

  // TypeScript can't have components as objects but they exist in the form of `memo` or `Suspense`
  if (typeof Component === 'object') {
    switch (Component.$$typeof) {
      case reactIsExports.ForwardRef:
        return getWrappedName(Component, Component.render, 'ForwardRef');
      case reactIsExports.Memo:
        return getWrappedName(Component, Component.type, 'memo');
      default:
        return undefined;
    }
  }
  return undefined;
}

// It should to be noted that this function isn't equivalent to `text-transform: capitalize`.
//
// A strict capitalization should uppercase the first letter of each word in the sentence.
// We only handle the first word.
function capitalize(string) {
  if (typeof string !== 'string') {
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: \`capitalize(string)\` expects a string argument.` : formatMuiErrorMessage(7));
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function ownerDocument(node) {
  return node && node.ownerDocument || document;
}

/**
 * TODO v5: consider making it private
 *
 * passes {value} to {ref}
 *
 * WARNING: Be sure to only call this inside a callback that is passed as a ref.
 * Otherwise, make sure to cleanup the previous {ref} if it changes. See
 * https://github.com/mui/material-ui/issues/13539
 *
 * Useful if you want to expose the ref of an inner component to the public API
 * while still using it inside the component.
 * @param ref A ref callback or ref object. If anything falsy, this is a no-op.
 */
function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

const useEnhancedEffect = typeof window !== 'undefined' ? React$1.useLayoutEffect : React$1.useEffect;
var useEnhancedEffect$1 = useEnhancedEffect;

/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
function useControlled({
  controlled,
  default: defaultProp,
  name,
  state = 'value'
}) {
  // isControlled is ignored in the hook dependency lists as it should never change.
  const {
    current: isControlled
  } = React$1.useRef(controlled !== undefined);
  const [valueState, setValue] = React$1.useState(defaultProp);
  const value = isControlled ? controlled : valueState;
  if (process.env.NODE_ENV !== 'production') {
    React$1.useEffect(() => {
      if (isControlled !== (controlled !== undefined)) {
        console.error([`MUI: A component is changing the ${isControlled ? '' : 'un'}controlled ${state} state of ${name} to be ${isControlled ? 'un' : ''}controlled.`, 'Elements should not switch from uncontrolled to controlled (or vice versa).', `Decide between using a controlled or uncontrolled ${name} ` + 'element for the lifetime of the component.', "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.", 'More info: https://fb.me/react-controlled-components'].join('\n'));
      }
    }, [state, name, controlled]);
    const {
      current: defaultValue
    } = React$1.useRef(defaultProp);
    React$1.useEffect(() => {
      if (!isControlled && defaultValue !== defaultProp) {
        console.error([`MUI: A component is changing the default ${state} state of an uncontrolled ${name} after being initialized. ` + `To suppress this warning opt to use a controlled ${name}.`].join('\n'));
      }
    }, [JSON.stringify(defaultProp)]);
  }
  const setValueIfUncontrolled = React$1.useCallback(newValue => {
    if (!isControlled) {
      setValue(newValue);
    }
  }, []);
  return [value, setValueIfUncontrolled];
}

/**
 * https://github.com/facebook/react/issues/14099#issuecomment-440013892
 */
function useEventCallback(fn) {
  const ref = React$1.useRef(fn);
  useEnhancedEffect$1(() => {
    ref.current = fn;
  });
  return React$1.useCallback((...args) =>
  // @ts-expect-error hide `this`
  // tslint:disable-next-line:ban-comma-operator
  (0, ref.current)(...args), []);
}

function useForkRef(...refs) {
  /**
   * This will create a new function if the refs passed to this hook change and are all defined.
   * This means react will call the old forkRef with `null` and the new forkRef
   * with the ref. Cleanup naturally emerges from this behavior.
   */
  return React$1.useMemo(() => {
    if (refs.every(ref => ref == null)) {
      return null;
    }
    return instance => {
      refs.forEach(ref => {
        setRef(ref, instance);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}

// based on https://github.com/WICG/focus-visible/blob/v4.1.5/src/focus-visible.js
let hadKeyboardEvent = true;
let hadFocusVisibleRecently = false;
let hadFocusVisibleRecentlyTimeout;
const inputTypesWhitelist = {
  text: true,
  search: true,
  url: true,
  tel: true,
  email: true,
  password: true,
  number: true,
  date: true,
  month: true,
  week: true,
  time: true,
  datetime: true,
  'datetime-local': true
};

/**
 * Computes whether the given element should automatically trigger the
 * `focus-visible` class being added, i.e. whether it should always match
 * `:focus-visible` when focused.
 * @param {Element} node
 * @returns {boolean}
 */
function focusTriggersKeyboardModality(node) {
  const {
    type,
    tagName
  } = node;
  if (tagName === 'INPUT' && inputTypesWhitelist[type] && !node.readOnly) {
    return true;
  }
  if (tagName === 'TEXTAREA' && !node.readOnly) {
    return true;
  }
  if (node.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Keep track of our keyboard modality state with `hadKeyboardEvent`.
 * If the most recent user interaction was via the keyboard;
 * and the key press did not include a meta, alt/option, or control key;
 * then the modality is keyboard. Otherwise, the modality is not keyboard.
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  if (event.metaKey || event.altKey || event.ctrlKey) {
    return;
  }
  hadKeyboardEvent = true;
}

/**
 * If at any point a user clicks with a pointing device, ensure that we change
 * the modality away from keyboard.
 * This avoids the situation where a user presses a key on an already focused
 * element, and then clicks on a different element, focusing it with a
 * pointing device, while we still think we're in keyboard modality.
 */
function handlePointerDown() {
  hadKeyboardEvent = false;
}
function handleVisibilityChange() {
  if (this.visibilityState === 'hidden') {
    // If the tab becomes active again, the browser will handle calling focus
    // on the element (Safari actually calls it twice).
    // If this tab change caused a blur on an element with focus-visible,
    // re-apply the class when the user switches back to the tab.
    if (hadFocusVisibleRecently) {
      hadKeyboardEvent = true;
    }
  }
}
function prepare(doc) {
  doc.addEventListener('keydown', handleKeyDown, true);
  doc.addEventListener('mousedown', handlePointerDown, true);
  doc.addEventListener('pointerdown', handlePointerDown, true);
  doc.addEventListener('touchstart', handlePointerDown, true);
  doc.addEventListener('visibilitychange', handleVisibilityChange, true);
}
function isFocusVisible(event) {
  const {
    target
  } = event;
  try {
    return target.matches(':focus-visible');
  } catch (error) {
    // Browsers not implementing :focus-visible will throw a SyntaxError.
    // We use our own heuristic for those browsers.
    // Rethrow might be better if it's not the expected error but do we really
    // want to crash if focus-visible malfunctioned?
  }

  // No need for validFocusTarget check. The user does that by attaching it to
  // focusable events only.
  return hadKeyboardEvent || focusTriggersKeyboardModality(target);
}
function useIsFocusVisible() {
  const ref = React$1.useCallback(node => {
    if (node != null) {
      prepare(node.ownerDocument);
    }
  }, []);
  const isFocusVisibleRef = React$1.useRef(false);

  /**
   * Should be called if a blur event is fired
   */
  function handleBlurVisible() {
    // checking against potential state variable does not suffice if we focus and blur synchronously.
    // React wouldn't have time to trigger a re-render so `focusVisible` would be stale.
    // Ideally we would adjust `isFocusVisible(event)` to look at `relatedTarget` for blur events.
    // This doesn't work in IE11 due to https://github.com/facebook/react/issues/3751
    // TODO: check again if React releases their internal changes to focus event handling (https://github.com/facebook/react/pull/19186).
    if (isFocusVisibleRef.current) {
      // To detect a tab/window switch, we look for a blur event followed
      // rapidly by a visibility change.
      // If we don't see a visibility change within 100ms, it's probably a
      // regular focus change.
      hadFocusVisibleRecently = true;
      window.clearTimeout(hadFocusVisibleRecentlyTimeout);
      hadFocusVisibleRecentlyTimeout = window.setTimeout(() => {
        hadFocusVisibleRecently = false;
      }, 100);
      isFocusVisibleRef.current = false;
      return true;
    }
    return false;
  }

  /**
   * Should be called if a blur event is fired
   */
  function handleFocusVisible(event) {
    if (isFocusVisible(event)) {
      isFocusVisibleRef.current = true;
      return true;
    }
    return false;
  }
  return {
    isFocusVisibleRef,
    onFocus: handleFocusVisible,
    onBlur: handleBlurVisible,
    ref
  };
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px'
};
var visuallyHidden$1 = visuallyHidden;

/**
 * Add keys, values of `defaultProps` that does not exist in `props`
 * @param {object} defaultProps
 * @param {object} props
 * @returns {object} resolved props
 */
function resolveProps(defaultProps, props) {
  const output = _extends({}, props);
  Object.keys(defaultProps).forEach(propName => {
    if (propName.toString().match(/^(components|slots)$/)) {
      output[propName] = _extends({}, defaultProps[propName], output[propName]);
    } else if (propName.toString().match(/^(componentsProps|slotProps)$/)) {
      const defaultSlotProps = defaultProps[propName] || {};
      const slotProps = props[propName];
      output[propName] = {};
      if (!slotProps || !Object.keys(slotProps)) {
        // Reduce the iteration if the slot props is empty
        output[propName] = defaultSlotProps;
      } else if (!defaultSlotProps || !Object.keys(defaultSlotProps)) {
        // Reduce the iteration if the default slot props is empty
        output[propName] = slotProps;
      } else {
        output[propName] = _extends({}, slotProps);
        Object.keys(defaultSlotProps).forEach(slotPropName => {
          output[propName][slotPropName] = resolveProps(defaultSlotProps[slotPropName], slotProps[slotPropName]);
        });
      }
    } else if (output[propName] === undefined) {
      output[propName] = defaultProps[propName];
    }
  });
  return output;
}

function composeClasses(slots, getUtilityClass, classes = undefined) {
  const output = {};
  Object.keys(slots).forEach(
  // `Objet.keys(slots)` can't be wider than `T` because we infer `T` from `slots`.
  // @ts-expect-error https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
  slot => {
    output[slot] = slots[slot].reduce((acc, key) => {
      if (key) {
        const utilityClass = getUtilityClass(key);
        if (utilityClass !== '') {
          acc.push(utilityClass);
        }
        if (classes && classes[key]) {
          acc.push(classes[key]);
        }
      }
      return acc;
    }, []).join(' ');
  });
  return output;
}

const defaultGenerator = componentName => componentName;
const createClassNameGenerator = () => {
  let generate = defaultGenerator;
  return {
    configure(generator) {
      generate = generator;
    },
    generate(componentName) {
      return generate(componentName);
    },
    reset() {
      generate = defaultGenerator;
    }
  };
};
const ClassNameGenerator = createClassNameGenerator();
var ClassNameGenerator$1 = ClassNameGenerator;

const globalStateClassesMapping = {
  active: 'active',
  checked: 'checked',
  completed: 'completed',
  disabled: 'disabled',
  readOnly: 'readOnly',
  error: 'error',
  expanded: 'expanded',
  focused: 'focused',
  focusVisible: 'focusVisible',
  required: 'required',
  selected: 'selected'
};
function generateUtilityClass(componentName, slot, globalStatePrefix = 'Mui') {
  const globalStateClass = globalStateClassesMapping[slot];
  return globalStateClass ? `${globalStatePrefix}-${globalStateClass}` : `${ClassNameGenerator$1.generate(componentName)}-${slot}`;
}

function generateUtilityClasses(componentName, slots, globalStatePrefix = 'Mui') {
  const result = {};
  slots.forEach(slot => {
    result[slot] = generateUtilityClass(componentName, slot, globalStatePrefix);
  });
  return result;
}

/**
 * Determines if a given element is a DOM element name (i.e. not a React component).
 */
function isHostComponent(element) {
  return typeof element === 'string';
}

/**
 * Type of the ownerState based on the type of an element it applies to.
 * This resolves to the provided OwnerState for React components and `undefined` for host components.
 * Falls back to `OwnerState | undefined` when the exact type can't be determined in development time.
 */

/**
 * Appends the ownerState object to the props, merging with the existing one if necessary.
 *
 * @param elementType Type of the element that owns the `existingProps`. If the element is a DOM node or undefined, `ownerState` is not applied.
 * @param otherProps Props of the element.
 * @param ownerState
 */
function appendOwnerState(elementType, otherProps, ownerState) {
  if (elementType === undefined || isHostComponent(elementType)) {
    return otherProps;
  }
  return _extends({}, otherProps, {
    ownerState: _extends({}, otherProps.ownerState, ownerState)
  });
}

function areArraysEqual(array1, array2, itemComparer = (a, b) => a === b) {
  return array1.length === array2.length && array1.every((value, index) => itemComparer(value, array2[index]));
}

/**
 * Extracts event handlers from a given object.
 * A prop is considered an event handler if it is a function and its name starts with `on`.
 *
 * @param object An object to extract event handlers from.
 * @param excludeKeys An array of keys to exclude from the returned object.
 */
function extractEventHandlers(object, excludeKeys = []) {
  if (object === undefined) {
    return {};
  }
  const result = {};
  Object.keys(object).filter(prop => prop.match(/^on[A-Z]/) && typeof object[prop] === 'function' && !excludeKeys.includes(prop)).forEach(prop => {
    result[prop] = object[prop];
  });
  return result;
}

/**
 * If `componentProps` is a function, calls it with the provided `ownerState`.
 * Otherwise, just returns `componentProps`.
 */
function resolveComponentProps(componentProps, ownerState) {
  if (typeof componentProps === 'function') {
    return componentProps(ownerState);
  }
  return componentProps;
}

/**
 * Removes event handlers from the given object.
 * A field is considered an event handler if it is a function with a name beginning with `on`.
 *
 * @param object Object to remove event handlers from.
 * @returns Object with event handlers removed.
 */
function omitEventHandlers(object) {
  if (object === undefined) {
    return {};
  }
  const result = {};
  Object.keys(object).filter(prop => !(prop.match(/^on[A-Z]/) && typeof object[prop] === 'function')).forEach(prop => {
    result[prop] = object[prop];
  });
  return result;
}

/**
 * Merges the slot component internal props (usually coming from a hook)
 * with the externally provided ones.
 *
 * The merge order is (the latter overrides the former):
 * 1. The internal props (specified as a getter function to work with get*Props hook result)
 * 2. Additional props (specified internally on a Base UI component)
 * 3. External props specified on the owner component. These should only be used on a root slot.
 * 4. External props specified in the `slotProps.*` prop.
 * 5. The `className` prop - combined from all the above.
 * @param parameters
 * @returns
 */
function mergeSlotProps(parameters) {
  const {
    getSlotProps,
    additionalProps,
    externalSlotProps,
    externalForwardedProps,
    className
  } = parameters;
  if (!getSlotProps) {
    // The simpler case - getSlotProps is not defined, so no internal event handlers are defined,
    // so we can simply merge all the props without having to worry about extracting event handlers.
    const joinedClasses = clsx(externalForwardedProps == null ? void 0 : externalForwardedProps.className, externalSlotProps == null ? void 0 : externalSlotProps.className, className, additionalProps == null ? void 0 : additionalProps.className);
    const mergedStyle = _extends({}, additionalProps == null ? void 0 : additionalProps.style, externalForwardedProps == null ? void 0 : externalForwardedProps.style, externalSlotProps == null ? void 0 : externalSlotProps.style);
    const props = _extends({}, additionalProps, externalForwardedProps, externalSlotProps);
    if (joinedClasses.length > 0) {
      props.className = joinedClasses;
    }
    if (Object.keys(mergedStyle).length > 0) {
      props.style = mergedStyle;
    }
    return {
      props,
      internalRef: undefined
    };
  }

  // In this case, getSlotProps is responsible for calling the external event handlers.
  // We don't need to include them in the merged props because of this.

  const eventHandlers = extractEventHandlers(_extends({}, externalForwardedProps, externalSlotProps));
  const componentsPropsWithoutEventHandlers = omitEventHandlers(externalSlotProps);
  const otherPropsWithoutEventHandlers = omitEventHandlers(externalForwardedProps);
  const internalSlotProps = getSlotProps(eventHandlers);

  // The order of classes is important here.
  // Emotion (that we use in libraries consuming Base UI) depends on this order
  // to properly override style. It requires the most important classes to be last
  // (see https://github.com/mui/material-ui/pull/33205) for the related discussion.
  const joinedClasses = clsx(internalSlotProps == null ? void 0 : internalSlotProps.className, additionalProps == null ? void 0 : additionalProps.className, className, externalForwardedProps == null ? void 0 : externalForwardedProps.className, externalSlotProps == null ? void 0 : externalSlotProps.className);
  const mergedStyle = _extends({}, internalSlotProps == null ? void 0 : internalSlotProps.style, additionalProps == null ? void 0 : additionalProps.style, externalForwardedProps == null ? void 0 : externalForwardedProps.style, externalSlotProps == null ? void 0 : externalSlotProps.style);
  const props = _extends({}, internalSlotProps, additionalProps, otherPropsWithoutEventHandlers, componentsPropsWithoutEventHandlers);
  if (joinedClasses.length > 0) {
    props.className = joinedClasses;
  }
  if (Object.keys(mergedStyle).length > 0) {
    props.style = mergedStyle;
  }
  return {
    props,
    internalRef: internalSlotProps.ref
  };
}

const _excluded$9 = ["elementType", "externalSlotProps", "ownerState"];
/**
 * @ignore - do not document.
 * Builds the props to be passed into the slot of an unstyled component.
 * It merges the internal props of the component with the ones supplied by the user, allowing to customize the behavior.
 * If the slot component is not a host component, it also merges in the `ownerState`.
 *
 * @param parameters.getSlotProps - A function that returns the props to be passed to the slot component.
 */
function useSlotProps(parameters) {
  var _parameters$additiona;
  const {
      elementType,
      externalSlotProps,
      ownerState
    } = parameters,
    rest = _objectWithoutPropertiesLoose(parameters, _excluded$9);
  const resolvedComponentsProps = resolveComponentProps(externalSlotProps, ownerState);
  const {
    props: mergedProps,
    internalRef
  } = mergeSlotProps(_extends({}, rest, {
    externalSlotProps: resolvedComponentsProps
  }));
  const ref = useForkRef(internalRef, resolvedComponentsProps == null ? void 0 : resolvedComponentsProps.ref, (_parameters$additiona = parameters.additionalProps) == null ? void 0 : _parameters$additiona.ref);
  const props = appendOwnerState(elementType, _extends({}, mergedProps, {
    ref
  }), ownerState);
  return props;
}

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;
function asc(a, b) {
  return a - b;
}
function clamp$1(value, min, max) {
  if (value == null) {
    return min;
  }
  return Math.min(Math.max(min, value), max);
}
function findClosest(values, currentValue) {
  var _values$reduce;
  const {
    index: closestIndex
  } = (_values$reduce = values.reduce((acc, value, index) => {
    const distance = Math.abs(currentValue - value);
    if (acc === null || distance < acc.distance || distance === acc.distance) {
      return {
        distance,
        index
      };
    }
    return acc;
  }, null)) != null ? _values$reduce : {};
  return closestIndex;
}
function trackFinger(event, touchId) {
  // The event is TouchEvent
  if (touchId.current !== undefined && event.changedTouches) {
    const touchEvent = event;
    for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
      const touch = touchEvent.changedTouches[i];
      if (touch.identifier === touchId.current) {
        return {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    }
    return false;
  }

  // The event is MouseEvent
  return {
    x: event.clientX,
    y: event.clientY
  };
}
function valueToPercent(value, min, max) {
  return (value - min) * 100 / (max - min);
}
function percentToValue(percent, min, max) {
  return (max - min) * percent + min;
}
function getDecimalPrecision(num) {
  // This handles the case when num is very small (0.00000001), js will turn this into 1e-8.
  // When num is bigger than 1 or less than -1 it won't get converted to this notation so it's fine.
  if (Math.abs(num) < 1) {
    const parts = num.toExponential().split('e-');
    const matissaDecimalPart = parts[0].split('.')[1];
    return (matissaDecimalPart ? matissaDecimalPart.length : 0) + parseInt(parts[1], 10);
  }
  const decimalPart = num.toString().split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}
function roundValueToStep(value, step, min) {
  const nearest = Math.round((value - min) / step) * step + min;
  return Number(nearest.toFixed(getDecimalPrecision(step)));
}
function setValueIndex({
  values,
  newValue,
  index
}) {
  const output = values.slice();
  output[index] = newValue;
  return output.sort(asc);
}
function focusThumb({
  sliderRef,
  activeIndex,
  setActive
}) {
  var _sliderRef$current, _doc$activeElement;
  const doc = ownerDocument(sliderRef.current);
  if (!((_sliderRef$current = sliderRef.current) != null && _sliderRef$current.contains(doc.activeElement)) || Number(doc == null ? void 0 : (_doc$activeElement = doc.activeElement) == null ? void 0 : _doc$activeElement.getAttribute('data-index')) !== activeIndex) {
    var _sliderRef$current2;
    (_sliderRef$current2 = sliderRef.current) == null ? void 0 : _sliderRef$current2.querySelector(`[type="range"][data-index="${activeIndex}"]`).focus();
  }
  if (setActive) {
    setActive(activeIndex);
  }
}
function areValuesEqual(newValue, oldValue) {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (typeof newValue === 'object' && typeof oldValue === 'object') {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}
const axisProps = {
  horizontal: {
    offset: percent => ({
      left: `${percent}%`
    }),
    leap: percent => ({
      width: `${percent}%`
    })
  },
  'horizontal-reverse': {
    offset: percent => ({
      right: `${percent}%`
    }),
    leap: percent => ({
      width: `${percent}%`
    })
  },
  vertical: {
    offset: percent => ({
      bottom: `${percent}%`
    }),
    leap: percent => ({
      height: `${percent}%`
    })
  }
};
const Identity$1 = x => x;

// TODO: remove support for Safari < 13.
// https://caniuse.com/#search=touch-action
//
// Safari, on iOS, supports touch action since v13.
// Over 80% of the iOS phones are compatible
// in August 2020.
// Utilizing the CSS.supports method to check if touch-action is supported.
// Since CSS.supports is supported on all but Edge@12 and IE and touch-action
// is supported on both Edge@12 and IE if CSS.supports is not available that means that
// touch-action will be supported
let cachedSupportsTouchActionNone;
function doesSupportTouchActionNone() {
  if (cachedSupportsTouchActionNone === undefined) {
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      cachedSupportsTouchActionNone = CSS.supports('touch-action', 'none');
    } else {
      cachedSupportsTouchActionNone = true;
    }
  }
  return cachedSupportsTouchActionNone;
}
/**
 *
 * Demos:
 *
 * - [Slider](https://mui.com/base/react-slider/#hook)
 *
 * API:
 *
 * - [useSlider API](https://mui.com/base/react-slider/hooks-api/#use-slider)
 */
function useSlider(parameters) {
  const {
    'aria-labelledby': ariaLabelledby,
    defaultValue,
    disabled = false,
    disableSwap = false,
    isRtl = false,
    marks: marksProp = false,
    max = 100,
    min = 0,
    name,
    onChange,
    onChangeCommitted,
    orientation = 'horizontal',
    rootRef: ref,
    scale = Identity$1,
    step = 1,
    tabIndex,
    value: valueProp
  } = parameters;
  const touchId = React$1.useRef();
  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React$1.useState(-1);
  const [open, setOpen] = React$1.useState(-1);
  const [dragging, setDragging] = React$1.useState(false);
  const moveCount = React$1.useRef(0);
  const [valueDerived, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue != null ? defaultValue : min,
    name: 'Slider'
  });
  const handleChange = onChange && ((event, value, thumbIndex) => {
    // Redefine target to allow name and value to be read.
    // This allows seamless integration with the most popular form libraries.
    // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
    // Clone the event to not override `target` of the original event.
    const nativeEvent = event.nativeEvent || event;
    // @ts-ignore The nativeEvent is function, not object
    const clonedEvent = new nativeEvent.constructor(nativeEvent.type, nativeEvent);
    Object.defineProperty(clonedEvent, 'target', {
      writable: true,
      value: {
        value,
        name
      }
    });
    onChange(clonedEvent, value, thumbIndex);
  });
  const range = Array.isArray(valueDerived);
  let values = range ? valueDerived.slice().sort(asc) : [valueDerived];
  values = values.map(value => clamp$1(value, min, max));
  const marks = marksProp === true && step !== null ? [...Array(Math.floor((max - min) / step) + 1)].map((_, index) => ({
    value: min + step * index
  })) : marksProp || [];
  const marksValues = marks.map(mark => mark.value);
  const {
    isFocusVisibleRef,
    onBlur: handleBlurVisible,
    onFocus: handleFocusVisible,
    ref: focusVisibleRef
  } = useIsFocusVisible();
  const [focusedThumbIndex, setFocusedThumbIndex] = React$1.useState(-1);
  const sliderRef = React$1.useRef();
  const handleFocusRef = useForkRef(focusVisibleRef, sliderRef);
  const handleRef = useForkRef(ref, handleFocusRef);
  const createHandleHiddenInputFocus = otherHandlers => event => {
    var _otherHandlers$onFocu;
    const index = Number(event.currentTarget.getAttribute('data-index'));
    handleFocusVisible(event);
    if (isFocusVisibleRef.current === true) {
      setFocusedThumbIndex(index);
    }
    setOpen(index);
    otherHandlers == null ? void 0 : (_otherHandlers$onFocu = otherHandlers.onFocus) == null ? void 0 : _otherHandlers$onFocu.call(otherHandlers, event);
  };
  const createHandleHiddenInputBlur = otherHandlers => event => {
    var _otherHandlers$onBlur;
    handleBlurVisible(event);
    if (isFocusVisibleRef.current === false) {
      setFocusedThumbIndex(-1);
    }
    setOpen(-1);
    otherHandlers == null ? void 0 : (_otherHandlers$onBlur = otherHandlers.onBlur) == null ? void 0 : _otherHandlers$onBlur.call(otherHandlers, event);
  };
  useEnhancedEffect$1(() => {
    if (disabled && sliderRef.current.contains(document.activeElement)) {
      var _document$activeEleme;
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/s/mui-pr-22247-forked-h151h?file=/src/App.js
      // @ts-ignore
      (_document$activeEleme = document.activeElement) == null ? void 0 : _document$activeEleme.blur();
    }
  }, [disabled]);
  if (disabled && active !== -1) {
    setActive(-1);
  }
  if (disabled && focusedThumbIndex !== -1) {
    setFocusedThumbIndex(-1);
  }
  const createHandleHiddenInputChange = otherHandlers => event => {
    var _otherHandlers$onChan;
    (_otherHandlers$onChan = otherHandlers.onChange) == null ? void 0 : _otherHandlers$onChan.call(otherHandlers, event);
    const index = Number(event.currentTarget.getAttribute('data-index'));
    const value = values[index];
    const marksIndex = marksValues.indexOf(value);

    // @ts-ignore
    let newValue = event.target.valueAsNumber;
    if (marks && step == null) {
      newValue = newValue < value ? marksValues[marksIndex - 1] : marksValues[marksIndex + 1];
    }
    newValue = clamp$1(newValue, min, max);
    if (marks && step == null) {
      const currentMarkIndex = marksValues.indexOf(values[index]);
      newValue = newValue < values[index] ? marksValues[currentMarkIndex - 1] : marksValues[currentMarkIndex + 1];
    }
    if (range) {
      // Bound the new value to the thumb's neighbours.
      if (disableSwap) {
        newValue = clamp$1(newValue, values[index - 1] || -Infinity, values[index + 1] || Infinity);
      }
      const previousValue = newValue;
      newValue = setValueIndex({
        values,
        newValue,
        index
      });
      let activeIndex = index;

      // Potentially swap the index if needed.
      if (!disableSwap) {
        activeIndex = newValue.indexOf(previousValue);
      }
      focusThumb({
        sliderRef,
        activeIndex
      });
    }
    setValueState(newValue);
    setFocusedThumbIndex(index);
    if (handleChange && !areValuesEqual(newValue, valueDerived)) {
      handleChange(event, newValue, index);
    }
    if (onChangeCommitted) {
      onChangeCommitted(event, newValue);
    }
  };
  const previousIndex = React$1.useRef();
  let axis = orientation;
  if (isRtl && orientation === 'horizontal') {
    axis += '-reverse';
  }
  const getFingerNewValue = ({
    finger,
    move = false
  }) => {
    const {
      current: slider
    } = sliderRef;
    const {
      width,
      height,
      bottom,
      left
    } = slider.getBoundingClientRect();
    let percent;
    if (axis.indexOf('vertical') === 0) {
      percent = (bottom - finger.y) / height;
    } else {
      percent = (finger.x - left) / width;
    }
    if (axis.indexOf('-reverse') !== -1) {
      percent = 1 - percent;
    }
    let newValue;
    newValue = percentToValue(percent, min, max);
    if (step) {
      newValue = roundValueToStep(newValue, step, min);
    } else {
      const closestIndex = findClosest(marksValues, newValue);
      newValue = marksValues[closestIndex];
    }
    newValue = clamp$1(newValue, min, max);
    let activeIndex = 0;
    if (range) {
      if (!move) {
        activeIndex = findClosest(values, newValue);
      } else {
        activeIndex = previousIndex.current;
      }

      // Bound the new value to the thumb's neighbours.
      if (disableSwap) {
        newValue = clamp$1(newValue, values[activeIndex - 1] || -Infinity, values[activeIndex + 1] || Infinity);
      }
      const previousValue = newValue;
      newValue = setValueIndex({
        values,
        newValue,
        index: activeIndex
      });

      // Potentially swap the index if needed.
      if (!(disableSwap && move)) {
        activeIndex = newValue.indexOf(previousValue);
        previousIndex.current = activeIndex;
      }
    }
    return {
      newValue,
      activeIndex
    };
  };
  const handleTouchMove = useEventCallback(nativeEvent => {
    const finger = trackFinger(nativeEvent, touchId);
    if (!finger) {
      return;
    }
    moveCount.current += 1;

    // Cancel move in case some other element consumed a mouseup event and it was not fired.
    // @ts-ignore buttons doesn't not exists on touch event
    if (nativeEvent.type === 'mousemove' && nativeEvent.buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }
    const {
      newValue,
      activeIndex
    } = getFingerNewValue({
      finger,
      move: true
    });
    focusThumb({
      sliderRef,
      activeIndex,
      setActive
    });
    setValueState(newValue);
    if (!dragging && moveCount.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
      setDragging(true);
    }
    if (handleChange && !areValuesEqual(newValue, valueDerived)) {
      handleChange(nativeEvent, newValue, activeIndex);
    }
  });
  const handleTouchEnd = useEventCallback(nativeEvent => {
    const finger = trackFinger(nativeEvent, touchId);
    setDragging(false);
    if (!finger) {
      return;
    }
    const {
      newValue
    } = getFingerNewValue({
      finger,
      move: true
    });
    setActive(-1);
    if (nativeEvent.type === 'touchend') {
      setOpen(-1);
    }
    if (onChangeCommitted) {
      onChangeCommitted(nativeEvent, newValue);
    }
    touchId.current = undefined;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  });
  const handleTouchStart = useEventCallback(nativeEvent => {
    if (disabled) {
      return;
    }
    // If touch-action: none; is not supported we need to prevent the scroll manually.
    if (!doesSupportTouchActionNone()) {
      nativeEvent.preventDefault();
    }
    const touch = nativeEvent.changedTouches[0];
    if (touch != null) {
      // A number that uniquely identifies the current finger in the touch session.
      touchId.current = touch.identifier;
    }
    const finger = trackFinger(nativeEvent, touchId);
    if (finger !== false) {
      const {
        newValue,
        activeIndex
      } = getFingerNewValue({
        finger
      });
      focusThumb({
        sliderRef,
        activeIndex,
        setActive
      });
      setValueState(newValue);
      if (handleChange && !areValuesEqual(newValue, valueDerived)) {
        handleChange(nativeEvent, newValue, activeIndex);
      }
    }
    moveCount.current = 0;
    const doc = ownerDocument(sliderRef.current);
    doc.addEventListener('touchmove', handleTouchMove);
    doc.addEventListener('touchend', handleTouchEnd);
  });
  const stopListening = React$1.useCallback(() => {
    const doc = ownerDocument(sliderRef.current);
    doc.removeEventListener('mousemove', handleTouchMove);
    doc.removeEventListener('mouseup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchEnd, handleTouchMove]);
  React$1.useEffect(() => {
    const {
      current: slider
    } = sliderRef;
    slider.addEventListener('touchstart', handleTouchStart, {
      passive: doesSupportTouchActionNone()
    });
    return () => {
      // @ts-ignore
      slider.removeEventListener('touchstart', handleTouchStart, {
        passive: doesSupportTouchActionNone()
      });
      stopListening();
    };
  }, [stopListening, handleTouchStart]);
  React$1.useEffect(() => {
    if (disabled) {
      stopListening();
    }
  }, [disabled, stopListening]);
  const createHandleMouseDown = otherHandlers => event => {
    var _otherHandlers$onMous;
    (_otherHandlers$onMous = otherHandlers.onMouseDown) == null ? void 0 : _otherHandlers$onMous.call(otherHandlers, event);
    if (disabled) {
      return;
    }
    if (event.defaultPrevented) {
      return;
    }

    // Only handle left clicks
    if (event.button !== 0) {
      return;
    }

    // Avoid text selection
    event.preventDefault();
    const finger = trackFinger(event, touchId);
    if (finger !== false) {
      const {
        newValue,
        activeIndex
      } = getFingerNewValue({
        finger
      });
      focusThumb({
        sliderRef,
        activeIndex,
        setActive
      });
      setValueState(newValue);
      if (handleChange && !areValuesEqual(newValue, valueDerived)) {
        handleChange(event, newValue, activeIndex);
      }
    }
    moveCount.current = 0;
    const doc = ownerDocument(sliderRef.current);
    doc.addEventListener('mousemove', handleTouchMove);
    doc.addEventListener('mouseup', handleTouchEnd);
  };
  const trackOffset = valueToPercent(range ? values[0] : min, min, max);
  const trackLeap = valueToPercent(values[values.length - 1], min, max) - trackOffset;
  const getRootProps = (otherHandlers = {}) => {
    const ownEventHandlers = {
      onMouseDown: createHandleMouseDown(otherHandlers || {})
    };
    const mergedEventHandlers = _extends({}, otherHandlers, ownEventHandlers);
    return _extends({
      ref: handleRef
    }, mergedEventHandlers);
  };
  const createHandleMouseOver = otherHandlers => event => {
    var _otherHandlers$onMous2;
    (_otherHandlers$onMous2 = otherHandlers.onMouseOver) == null ? void 0 : _otherHandlers$onMous2.call(otherHandlers, event);
    const index = Number(event.currentTarget.getAttribute('data-index'));
    setOpen(index);
  };
  const createHandleMouseLeave = otherHandlers => event => {
    var _otherHandlers$onMous3;
    (_otherHandlers$onMous3 = otherHandlers.onMouseLeave) == null ? void 0 : _otherHandlers$onMous3.call(otherHandlers, event);
    setOpen(-1);
  };
  const getThumbProps = (otherHandlers = {}) => {
    const ownEventHandlers = {
      onMouseOver: createHandleMouseOver(otherHandlers || {}),
      onMouseLeave: createHandleMouseLeave(otherHandlers || {})
    };
    return _extends({}, otherHandlers, ownEventHandlers);
  };
  const getHiddenInputProps = (otherHandlers = {}) => {
    var _parameters$step;
    const ownEventHandlers = {
      onChange: createHandleHiddenInputChange(otherHandlers || {}),
      onFocus: createHandleHiddenInputFocus(otherHandlers || {}),
      onBlur: createHandleHiddenInputBlur(otherHandlers || {})
    };
    const mergedEventHandlers = _extends({}, otherHandlers, ownEventHandlers);
    return _extends({
      tabIndex,
      'aria-labelledby': ariaLabelledby,
      'aria-orientation': orientation,
      'aria-valuemax': scale(max),
      'aria-valuemin': scale(min),
      name,
      type: 'range',
      min: parameters.min,
      max: parameters.max,
      step: (_parameters$step = parameters.step) != null ? _parameters$step : undefined,
      disabled
    }, mergedEventHandlers, {
      style: _extends({}, visuallyHidden$1, {
        direction: isRtl ? 'rtl' : 'ltr',
        // So that VoiceOver's focus indicator matches the thumb's dimensions
        width: '100%',
        height: '100%'
      })
    });
  };
  return {
    active,
    axis: axis,
    axisProps,
    dragging,
    focusedThumbIndex,
    getHiddenInputProps,
    getRootProps,
    getThumbProps,
    marks: marks,
    open,
    range,
    rootRef: handleRef,
    trackLeap,
    trackOffset,
    values
  };
}

function memoize$1(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

var reactPropsRegex = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|download|draggable|encType|enterKeyHint|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/; // https://esbench.com/bench/5bfee68a4cd7e6009ef61d23

var isPropValid = /* #__PURE__ */memoize$1(function (prop) {
  return reactPropsRegex.test(prop) || prop.charCodeAt(0) === 111
  /* o */
  && prop.charCodeAt(1) === 110
  /* n */
  && prop.charCodeAt(2) < 91;
}
/* Z+1 */
);

/*

Based off glamor's StyleSheet, thanks Sunil ❤️

high performance StyleSheet for css-in-js systems

- uses multiple style tags behind the scenes for millions of rules
- uses `insertRule` for appending in production for *much* faster performance

// usage

import { StyleSheet } from '@emotion/sheet'

let styleSheet = new StyleSheet({ key: '', container: document.head })

styleSheet.insert('#box { border: 1px solid red; }')
- appends a css rule into the stylesheet

styleSheet.flush()
- empties the stylesheet of all its contents

*/
// $FlowFixMe
function sheetForTag(tag) {
  if (tag.sheet) {
    // $FlowFixMe
    return tag.sheet;
  } // this weirdness brought to you by firefox

  /* istanbul ignore next */


  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      // $FlowFixMe
      return document.styleSheets[i];
    }
  }
}

function createStyleElement(options) {
  var tag = document.createElement('style');
  tag.setAttribute('data-emotion', options.key);

  if (options.nonce !== undefined) {
    tag.setAttribute('nonce', options.nonce);
  }

  tag.appendChild(document.createTextNode(''));
  tag.setAttribute('data-s', '');
  return tag;
}

var StyleSheet = /*#__PURE__*/function () {
  // Using Node instead of HTMLElement since container may be a ShadowRoot
  function StyleSheet(options) {
    var _this = this;

    this._insertTag = function (tag) {
      var before;

      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }

      _this.container.insertBefore(tag, before);

      _this.tags.push(tag);
    };

    this.isSpeedy = options.speedy === undefined ? process.env.NODE_ENV === 'production' : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }

  var _proto = StyleSheet.prototype;

  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };

  _proto.insert = function insert(rule) {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }

    var tag = this.tags[this.tags.length - 1];

    if (process.env.NODE_ENV !== 'production') {
      var isImportRule = rule.charCodeAt(0) === 64 && rule.charCodeAt(1) === 105;

      if (isImportRule && this._alreadyInsertedOrderInsensitiveRule) {
        // this would only cause problem in speedy mode
        // but we don't want enabling speedy to affect the observable behavior
        // so we report this error at all times
        console.error("You're attempting to insert the following rule:\n" + rule + '\n\n`@import` rules must be before all other types of rules in a stylesheet but other rules have already been inserted. Please ensure that `@import` rules are before all other rules.');
      }
      this._alreadyInsertedOrderInsensitiveRule = this._alreadyInsertedOrderInsensitiveRule || !isImportRule;
    }

    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);

      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production' && !/:(-moz-placeholder|-moz-focus-inner|-moz-focusring|-ms-input-placeholder|-moz-read-write|-moz-read-only|-ms-clear|-ms-expand|-ms-reveal){/.test(rule)) {
          console.error("There was a problem inserting the following rule: \"" + rule + "\"", e);
        }
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }

    this.ctr++;
  };

  _proto.flush = function flush() {
    // $FlowFixMe
    this.tags.forEach(function (tag) {
      return tag.parentNode && tag.parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;

    if (process.env.NODE_ENV !== 'production') {
      this._alreadyInsertedOrderInsensitiveRule = false;
    }
  };

  return StyleSheet;
}();

var MS = '-ms-';
var MOZ = '-moz-';
var WEBKIT = '-webkit-';

var COMMENT = 'comm';
var RULESET = 'rule';
var DECLARATION = 'decl';
var IMPORT = '@import';
var KEYFRAMES = '@keyframes';
var LAYER = '@layer';

/**
 * @param {number}
 * @return {number}
 */
var abs = Math.abs;

/**
 * @param {number}
 * @return {string}
 */
var from = String.fromCharCode;

/**
 * @param {object}
 * @return {object}
 */
var assign = Object.assign;

/**
 * @param {string} value
 * @param {number} length
 * @return {number}
 */
function hash (value, length) {
	return charat(value, 0) ^ 45 ? (((((((length << 2) ^ charat(value, 0)) << 2) ^ charat(value, 1)) << 2) ^ charat(value, 2)) << 2) ^ charat(value, 3) : 0
}

/**
 * @param {string} value
 * @return {string}
 */
function trim (value) {
	return value.trim()
}

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @return {string?}
 */
function match (value, pattern) {
	return (value = pattern.exec(value)) ? value[0] : value
}

/**
 * @param {string} value
 * @param {(string|RegExp)} pattern
 * @param {string} replacement
 * @return {string}
 */
function replace (value, pattern, replacement) {
	return value.replace(pattern, replacement)
}

/**
 * @param {string} value
 * @param {string} search
 * @return {number}
 */
function indexof (value, search) {
	return value.indexOf(search)
}

/**
 * @param {string} value
 * @param {number} index
 * @return {number}
 */
function charat (value, index) {
	return value.charCodeAt(index) | 0
}

/**
 * @param {string} value
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function substr (value, begin, end) {
	return value.slice(begin, end)
}

/**
 * @param {string} value
 * @return {number}
 */
function strlen (value) {
	return value.length
}

/**
 * @param {any[]} value
 * @return {number}
 */
function sizeof (value) {
	return value.length
}

/**
 * @param {any} value
 * @param {any[]} array
 * @return {any}
 */
function append (value, array) {
	return array.push(value), value
}

/**
 * @param {string[]} array
 * @param {function} callback
 * @return {string}
 */
function combine (array, callback) {
	return array.map(callback).join('')
}

var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = '';

/**
 * @param {string} value
 * @param {object | null} root
 * @param {object | null} parent
 * @param {string} type
 * @param {string[] | string} props
 * @param {object[] | string} children
 * @param {number} length
 */
function node (value, root, parent, type, props, children, length) {
	return {value: value, root: root, parent: parent, type: type, props: props, children: children, line: line, column: column, length: length, return: ''}
}

/**
 * @param {object} root
 * @param {object} props
 * @return {object}
 */
function copy (root, props) {
	return assign(node('', null, null, '', null, null, 0), root, {length: -root.length}, props)
}

/**
 * @return {number}
 */
function char () {
	return character
}

/**
 * @return {number}
 */
function prev () {
	character = position > 0 ? charat(characters, --position) : 0;

	if (column--, character === 10)
		column = 1, line--;

	return character
}

/**
 * @return {number}
 */
function next () {
	character = position < length ? charat(characters, position++) : 0;

	if (column++, character === 10)
		column = 1, line++;

	return character
}

/**
 * @return {number}
 */
function peek () {
	return charat(characters, position)
}

/**
 * @return {number}
 */
function caret () {
	return position
}

/**
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function slice (begin, end) {
	return substr(characters, begin, end)
}

/**
 * @param {number} type
 * @return {number}
 */
function token (type) {
	switch (type) {
		// \0 \t \n \r \s whitespace token
		case 0: case 9: case 10: case 13: case 32:
			return 5
		// ! + , / > @ ~ isolate token
		case 33: case 43: case 44: case 47: case 62: case 64: case 126:
		// ; { } breakpoint token
		case 59: case 123: case 125:
			return 4
		// : accompanied token
		case 58:
			return 3
		// " ' ( [ opening delimit token
		case 34: case 39: case 40: case 91:
			return 2
		// ) ] closing delimit token
		case 41: case 93:
			return 1
	}

	return 0
}

/**
 * @param {string} value
 * @return {any[]}
 */
function alloc (value) {
	return line = column = 1, length = strlen(characters = value), position = 0, []
}

/**
 * @param {any} value
 * @return {any}
 */
function dealloc (value) {
	return characters = '', value
}

/**
 * @param {number} type
 * @return {string}
 */
function delimit (type) {
	return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)))
}

/**
 * @param {number} type
 * @return {string}
 */
function whitespace (type) {
	while (character = peek())
		if (character < 33)
			next();
		else
			break

	return token(type) > 2 || token(character) > 3 ? '' : ' '
}

/**
 * @param {number} index
 * @param {number} count
 * @return {string}
 */
function escaping (index, count) {
	while (--count && next())
		// not 0-9 A-F a-f
		if (character < 48 || character > 102 || (character > 57 && character < 65) || (character > 70 && character < 97))
			break

	return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32))
}

/**
 * @param {number} type
 * @return {number}
 */
function delimiter (type) {
	while (next())
		switch (character) {
			// ] ) " '
			case type:
				return position
			// " '
			case 34: case 39:
				if (type !== 34 && type !== 39)
					delimiter(character);
				break
			// (
			case 40:
				if (type === 41)
					delimiter(type);
				break
			// \
			case 92:
				next();
				break
		}

	return position
}

/**
 * @param {number} type
 * @param {number} index
 * @return {number}
 */
function commenter (type, index) {
	while (next())
		// //
		if (type + character === 47 + 10)
			break
		// /*
		else if (type + character === 42 + 42 && peek() === 47)
			break

	return '/*' + slice(index, position - 1) + '*' + from(type === 47 ? type : next())
}

/**
 * @param {number} index
 * @return {string}
 */
function identifier (index) {
	while (!token(peek()))
		next();

	return slice(index, position)
}

/**
 * @param {string} value
 * @return {object[]}
 */
function compile (value) {
	return dealloc(parse('', null, null, null, [''], value = alloc(value), 0, [0], value))
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {string[]} rule
 * @param {string[]} rules
 * @param {string[]} rulesets
 * @param {number[]} pseudo
 * @param {number[]} points
 * @param {string[]} declarations
 * @return {object}
 */
function parse (value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
	var index = 0;
	var offset = 0;
	var length = pseudo;
	var atrule = 0;
	var property = 0;
	var previous = 0;
	var variable = 1;
	var scanning = 1;
	var ampersand = 1;
	var character = 0;
	var type = '';
	var props = rules;
	var children = rulesets;
	var reference = rule;
	var characters = type;

	while (scanning)
		switch (previous = character, character = next()) {
			// (
			case 40:
				if (previous != 108 && charat(characters, length - 1) == 58) {
					if (indexof(characters += replace(delimit(character), '&', '&\f'), '&\f') != -1)
						ampersand = -1;
					break
				}
			// " ' [
			case 34: case 39: case 91:
				characters += delimit(character);
				break
			// \t \n \r \s
			case 9: case 10: case 13: case 32:
				characters += whitespace(previous);
				break
			// \
			case 92:
				characters += escaping(caret() - 1, 7);
				continue
			// /
			case 47:
				switch (peek()) {
					case 42: case 47:
						append(comment(commenter(next(), caret()), root, parent), declarations);
						break
					default:
						characters += '/';
				}
				break
			// {
			case 123 * variable:
				points[index++] = strlen(characters) * ampersand;
			// } ; \0
			case 125 * variable: case 59: case 0:
				switch (character) {
					// \0 }
					case 0: case 125: scanning = 0;
					// ;
					case 59 + offset: if (ampersand == -1) characters = replace(characters, /\f/g, '');
						if (property > 0 && (strlen(characters) - length))
							append(property > 32 ? declaration(characters + ';', rule, parent, length - 1) : declaration(replace(characters, ' ', '') + ';', rule, parent, length - 2), declarations);
						break
					// @ ;
					case 59: characters += ';';
					// { rule/at-rule
					default:
						append(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length), rulesets);

						if (character === 123)
							if (offset === 0)
								parse(characters, root, reference, reference, props, rulesets, length, points, children);
							else
								switch (atrule === 99 && charat(characters, 3) === 110 ? 100 : atrule) {
									// d l m s
									case 100: case 108: case 109: case 115:
										parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length), children), rules, children, length, points, rule ? props : children);
										break
									default:
										parse(characters, reference, reference, reference, [''], children, 0, points, children);
								}
				}

				index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo;
				break
			// :
			case 58:
				length = 1 + strlen(characters), property = previous;
			default:
				if (variable < 1)
					if (character == 123)
						--variable;
					else if (character == 125 && variable++ == 0 && prev() == 125)
						continue

				switch (characters += from(character), character * variable) {
					// &
					case 38:
						ampersand = offset > 0 ? 1 : (characters += '\f', -1);
						break
					// ,
					case 44:
						points[index++] = (strlen(characters) - 1) * ampersand, ampersand = 1;
						break
					// @
					case 64:
						// -
						if (peek() === 45)
							characters += delimit(next());

						atrule = peek(), offset = length = strlen(type = characters += identifier(caret())), character++;
						break
					// -
					case 45:
						if (previous === 45 && strlen(characters) == 2)
							variable = 0;
				}
		}

	return rulesets
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} index
 * @param {number} offset
 * @param {string[]} rules
 * @param {number[]} points
 * @param {string} type
 * @param {string[]} props
 * @param {string[]} children
 * @param {number} length
 * @return {object}
 */
function ruleset (value, root, parent, index, offset, rules, points, type, props, children, length) {
	var post = offset - 1;
	var rule = offset === 0 ? rules : [''];
	var size = sizeof(rule);

	for (var i = 0, j = 0, k = 0; i < index; ++i)
		for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i])), z = value; x < size; ++x)
			if (z = trim(j > 0 ? rule[x] + ' ' + y : replace(y, /&\f/g, rule[x])))
				props[k++] = z;

	return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length)
}

/**
 * @param {number} value
 * @param {object} root
 * @param {object?} parent
 * @return {object}
 */
function comment (value, root, parent) {
	return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0)
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} length
 * @return {object}
 */
function declaration (value, root, parent, length) {
	return node(value, root, parent, DECLARATION, substr(value, 0, length), substr(value, length + 1, -1), length)
}

/**
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function serialize (children, callback) {
	var output = '';
	var length = sizeof(children);

	for (var i = 0; i < length; i++)
		output += callback(children[i], i, children, callback) || '';

	return output
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function stringify (element, index, children, callback) {
	switch (element.type) {
		case LAYER: if (element.children.length) break
		case IMPORT: case DECLARATION: return element.return = element.return || element.value
		case COMMENT: return ''
		case KEYFRAMES: return element.return = element.value + '{' + serialize(element.children, callback) + '}'
		case RULESET: element.value = element.props.join(',');
	}

	return strlen(children = serialize(element.children, callback)) ? element.return = element.value + '{' + children + '}' : ''
}

/**
 * @param {function[]} collection
 * @return {function}
 */
function middleware (collection) {
	var length = sizeof(collection);

	return function (element, index, children, callback) {
		var output = '';

		for (var i = 0; i < length; i++)
			output += collection[i](element, index, children, callback) || '';

		return output
	}
}

/**
 * @param {function} callback
 * @return {function}
 */
function rulesheet (callback) {
	return function (element) {
		if (!element.root)
			if (element = element.return)
				callback(element);
	}
}

var weakMemoize = function weakMemoize(func) {
  // $FlowFixMe flow doesn't include all non-primitive types as allowed for weakmaps
  var cache = new WeakMap();
  return function (arg) {
    if (cache.has(arg)) {
      // $FlowFixMe
      return cache.get(arg);
    }

    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};

var identifierWithPointTracking = function identifierWithPointTracking(begin, points, index) {
  var previous = 0;
  var character = 0;

  while (true) {
    previous = character;
    character = peek(); // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1;
    }

    if (token(character)) {
      break;
    }

    next();
  }

  return slice(begin, position);
};

var toRules = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1;
  var character = 44;

  do {
    switch (token(character)) {
      case 0:
        // &\f
        if (character === 38 && peek() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1;
        }

        parsed[index] += identifierWithPointTracking(position - 1, points, index);
        break;

      case 2:
        parsed[index] += delimit(character);
        break;

      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = peek() === 58 ? '&\f' : '';
          points[index] = parsed[index].length;
          break;
        }

      // fallthrough

      default:
        parsed[index] += from(character);
    }
  } while (character = next());

  return parsed;
};

var getRules = function getRules(value, points) {
  return dealloc(toRules(alloc(value), points));
}; // WeakSet would be more appropriate, but only WeakMap is supported in IE11


var fixedElements = /* #__PURE__ */new WeakMap();
var compat = function compat(element) {
  if (element.type !== 'rule' || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }

  var value = element.value,
      parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;

  while (parent.type !== 'rule') {
    parent = parent.parent;
    if (!parent) return;
  } // short-circuit for the simplest case


  if (element.props.length === 1 && value.charCodeAt(0) !== 58
  /* colon */
  && !fixedElements.get(parent)) {
    return;
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"


  if (isImplicitRule) {
    return;
  }

  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;

  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value;

    if ( // charcode for l
    value.charCodeAt(0) === 108 && // charcode for b
    value.charCodeAt(2) === 98) {
      // this ignores label
      element["return"] = '';
      element.value = '';
    }
  }
};
var ignoreFlag = 'emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason';

var isIgnoringComment = function isIgnoringComment(element) {
  return element.type === 'comm' && element.children.indexOf(ignoreFlag) > -1;
};

var createUnsafeSelectorsAlarm = function createUnsafeSelectorsAlarm(cache) {
  return function (element, index, children) {
    if (element.type !== 'rule' || cache.compat) return;
    var unsafePseudoClasses = element.value.match(/(:first|:nth|:nth-last)-child/g);

    if (unsafePseudoClasses) {
      var isNested = !!element.parent; // in nested rules comments become children of the "auto-inserted" rule and that's always the `element.parent`
      //
      // considering this input:
      // .a {
      //   .b /* comm */ {}
      //   color: hotpink;
      // }
      // we get output corresponding to this:
      // .a {
      //   & {
      //     /* comm */
      //     color: hotpink;
      //   }
      //   .b {}
      // }

      var commentContainer = isNested ? element.parent.children : // global rule at the root level
      children;

      for (var i = commentContainer.length - 1; i >= 0; i--) {
        var node = commentContainer[i];

        if (node.line < element.line) {
          break;
        } // it is quite weird but comments are *usually* put at `column: element.column - 1`
        // so we seek *from the end* for the node that is earlier than the rule's `element` and check that
        // this will also match inputs like this:
        // .a {
        //   /* comm */
        //   .b {}
        // }
        //
        // but that is fine
        //
        // it would be the easiest to change the placement of the comment to be the first child of the rule:
        // .a {
        //   .b { /* comm */ }
        // }
        // with such inputs we wouldn't have to search for the comment at all
        // TODO: consider changing this comment placement in the next major version


        if (node.column < element.column) {
          if (isIgnoringComment(node)) {
            return;
          }

          break;
        }
      }

      unsafePseudoClasses.forEach(function (unsafePseudoClass) {
        console.error("The pseudo class \"" + unsafePseudoClass + "\" is potentially unsafe when doing server-side rendering. Try changing it to \"" + unsafePseudoClass.split('-child')[0] + "-of-type\".");
      });
    }
  };
};

var isImportRule = function isImportRule(element) {
  return element.type.charCodeAt(1) === 105 && element.type.charCodeAt(0) === 64;
};

var isPrependedWithRegularRules = function isPrependedWithRegularRules(index, children) {
  for (var i = index - 1; i >= 0; i--) {
    if (!isImportRule(children[i])) {
      return true;
    }
  }

  return false;
}; // use this to remove incorrect elements from further processing
// so they don't get handed to the `sheet` (or anything else)
// as that could potentially lead to additional logs which in turn could be overhelming to the user


var nullifyElement = function nullifyElement(element) {
  element.type = '';
  element.value = '';
  element["return"] = '';
  element.children = '';
  element.props = '';
};

var incorrectImportAlarm = function incorrectImportAlarm(element, index, children) {
  if (!isImportRule(element)) {
    return;
  }

  if (element.parent) {
    console.error("`@import` rules can't be nested inside other rules. Please move it to the top level and put it before regular rules. Keep in mind that they can only be used within global styles.");
    nullifyElement(element);
  } else if (isPrependedWithRegularRules(index, children)) {
    console.error("`@import` rules can't be after other rules. Please put your `@import` rules before your other rules.");
    nullifyElement(element);
  }
};

/* eslint-disable no-fallthrough */

function prefix(value, length) {
  switch (hash(value, length)) {
    // color-adjust
    case 5103:
      return WEBKIT + 'print-' + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)

    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921: // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break

    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005: // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,

    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855: // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)

    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust

    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // flex, flex-direction

    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    // order

    case 6165:
      return WEBKIT + value + MS + 'flex-' + value + value;
    // align-items

    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + 'box-$1$2' + MS + 'flex-$1$2') + value;
    // align-self

    case 5443:
      return WEBKIT + value + MS + 'flex-item-' + replace(value, /flex-|-self/, '') + value;
    // align-content

    case 4675:
      return WEBKIT + value + MS + 'flex-line-pack' + replace(value, /align-content|flex-|-self/, '') + value;
    // flex-shrink

    case 5548:
      return WEBKIT + value + MS + replace(value, 'shrink', 'negative') + value;
    // flex-basis

    case 5292:
      return WEBKIT + value + MS + replace(value, 'basis', 'preferred-size') + value;
    // flex-grow

    case 6060:
      return WEBKIT + 'box-' + replace(value, '-grow', '') + WEBKIT + value + MS + replace(value, 'grow', 'positive') + value;
    // transition

    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, '$1' + WEBKIT + '$2') + value;
    // cursor

    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + '$1'), /(image-set)/, WEBKIT + '$1'), value, '') + value;
    // background, background-image

    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + '$1' + '$`$1');
    // justify-content

    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + 'box-pack:$3' + MS + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + WEBKIT + value + value;
    // (margin|padding)-inline-(start|end)

    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + '$1$2') + value;
    // (min|max)?(width|height|inline-size|block-size)

    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      // stretch, max-content, min-content, fill-available
      if (strlen(value) - 1 - length > 6) switch (charat(value, length + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          // -
          if (charat(value, length + 4) !== 45) break;
        // (f)ill-available, (f)it-content

        case 102:
          return replace(value, /(.+:)(.+)-([^]+)/, '$1' + WEBKIT + '$2-$3' + '$1' + MOZ + (charat(value, length + 3) == 108 ? '$3' : '$2-$3')) + value;
        // (s)tretch

        case 115:
          return ~indexof(value, 'stretch') ? prefix(replace(value, 'stretch', 'fill-available'), length) + value : value;
      }
      break;
    // position: sticky

    case 4949:
      // (s)ticky?
      if (charat(value, length + 1) !== 115) break;
    // display: (flex|inline-flex)

    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, '!important') && 10))) {
        // stic(k)y
        case 107:
          return replace(value, ':', ':' + WEBKIT) + value;
        // (inline-)?fl(e)x

        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, '$1' + WEBKIT + (charat(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + WEBKIT + '$2$3' + '$1' + MS + '$2box$3') + value;
      }

      break;
    // writing-mode

    case 5936:
      switch (charat(value, length + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb') + value;
        // vertical-r(l)

        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value;
        // horizontal(-)tb

        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'lr') + value;
      }

      return WEBKIT + value + MS + value + value;
  }

  return value;
}

var prefixer = function prefixer(element, index, children, callback) {
  if (element.length > -1) if (!element["return"]) switch (element.type) {
    case DECLARATION:
      element["return"] = prefix(element.value, element.length);
      break;

    case KEYFRAMES:
      return serialize([copy(element, {
        value: replace(element.value, '@', '@' + WEBKIT)
      })], callback);

    case RULESET:
      if (element.length) return combine(element.props, function (value) {
        switch (match(value, /(::plac\w+|:read-\w+)/)) {
          // :read-(only|write)
          case ':read-only':
          case ':read-write':
            return serialize([copy(element, {
              props: [replace(value, /:(read-\w+)/, ':' + MOZ + '$1')]
            })], callback);
          // :placeholder

          case '::placeholder':
            return serialize([copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + WEBKIT + 'input-$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + MOZ + '$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, MS + 'input-$1')]
            })], callback);
        }

        return '';
      });
  }
};

var isBrowser$4 = typeof document !== 'undefined';
var getServerStylisCache = isBrowser$4 ? undefined : weakMemoize(function () {
  return memoize$1(function () {
    var cache = {};
    return function (name) {
      return cache[name];
    };
  });
});
var defaultStylisPlugins = [prefixer];

var createCache = function createCache(options) {
  var key = options.key;

  if (process.env.NODE_ENV !== 'production' && !key) {
    throw new Error("You have to configure `key` for your cache. Please make sure it's unique (and not equal to 'css') as it's used for linking styles to your cache.\n" + "If multiple caches share the same key they might \"fight\" for each other's style elements.");
  }

  if (isBrowser$4 && key === 'css') {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])"); // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion');

      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return;
      }
      document.head.appendChild(node);
      node.setAttribute('data-s', '');
    });
  }

  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;

  if (process.env.NODE_ENV !== 'production') {
    // $FlowFixMe
    if (/[^a-z-]/.test(key)) {
      throw new Error("Emotion key must only contain lower case alphabetical characters and - but \"" + key + "\" was passed");
    }
  }

  var inserted = {};
  var container;
  var nodesToHydrate = [];

  if (isBrowser$4) {
    container = options.container || document.head;
    Array.prototype.forEach.call( // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll("style[data-emotion^=\"" + key + " \"]"), function (node) {
      var attrib = node.getAttribute("data-emotion").split(' '); // $FlowFixMe

      for (var i = 1; i < attrib.length; i++) {
        inserted[attrib[i]] = true;
      }

      nodesToHydrate.push(node);
    });
  }

  var _insert;

  var omnipresentPlugins = [compat, removeLabel];

  if (process.env.NODE_ENV !== 'production') {
    omnipresentPlugins.push(createUnsafeSelectorsAlarm({
      get compat() {
        return cache.compat;
      }

    }), incorrectImportAlarm);
  }

  if (isBrowser$4) {
    var currentSheet;
    var finalizingPlugins = [stringify, process.env.NODE_ENV !== 'production' ? function (element) {
      if (!element.root) {
        if (element["return"]) {
          currentSheet.insert(element["return"]);
        } else if (element.value && element.type !== COMMENT) {
          // insert empty rule in non-production environments
          // so @emotion/jest can grab `key` from the (JS)DOM for caches without any rules inserted yet
          currentSheet.insert(element.value + "{}");
        }
      }
    } : rulesheet(function (rule) {
      currentSheet.insert(rule);
    })];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));

    var stylis = function stylis(styles) {
      return serialize(compile(styles), serializer);
    };

    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet;

      if (process.env.NODE_ENV !== 'production' && serialized.map !== undefined) {
        currentSheet = {
          insert: function insert(rule) {
            sheet.insert(rule + serialized.map);
          }
        };
      }

      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);

      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  } else {
    var _finalizingPlugins = [stringify];

    var _serializer = middleware(omnipresentPlugins.concat(stylisPlugins, _finalizingPlugins));

    var _stylis = function _stylis(styles) {
      return serialize(compile(styles), _serializer);
    }; // $FlowFixMe


    var serverStylisCache = getServerStylisCache(stylisPlugins)(key);

    var getRules = function getRules(selector, serialized) {
      var name = serialized.name;

      if (serverStylisCache[name] === undefined) {
        serverStylisCache[name] = _stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      }

      return serverStylisCache[name];
    };

    _insert = function _insert(selector, serialized, sheet, shouldCache) {
      var name = serialized.name;
      var rules = getRules(selector, serialized);

      if (cache.compat === undefined) {
        // in regular mode, we don't set the styles on the inserted cache
        // since we don't need to and that would be wasting memory
        // we return them so that they are rendered in a style tag
        if (shouldCache) {
          cache.inserted[name] = true;
        }

        if ( // using === development instead of !== production
        // because if people do ssr in tests, the source maps showing up would be annoying
        process.env.NODE_ENV === 'development' && serialized.map !== undefined) {
          return rules + serialized.map;
        }

        return rules;
      } else {
        // in compat mode, we put the styles on the inserted cache so
        // that emotion-server can pull out the styles
        // except when we don't want to cache it which was in Global but now
        // is nowhere but we don't want to do a major right now
        // and just in case we're going to leave the case here
        // it's also not affecting client side bundle size
        // so it's really not a big deal
        if (shouldCache) {
          cache.inserted[name] = rules;
        } else {
          return rules;
        }
      }
    };
  }

  var cache = {
    key: key,
    sheet: new StyleSheet({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};

var isBrowser$3 = typeof document !== 'undefined';
function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = '';
  classNames.split(' ').forEach(function (className) {
    if (registered[className] !== undefined) {
      registeredStyles.push(registered[className] + ";");
    } else {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles(cache, serialized, isStringTag) {
  var className = cache.key + "-" + serialized.name;

  if ( // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (isStringTag === false || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  isBrowser$3 === false && cache.compat !== undefined) && cache.registered[className] === undefined) {
    cache.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;

  if (cache.inserted[serialized.name] === undefined) {
    var stylesForSSR = '';
    var current = serialized;

    do {
      var maybeStyles = cache.insert(serialized === current ? "." + className : '', current, cache.sheet, true);

      if (!isBrowser$3 && maybeStyles !== undefined) {
        stylesForSSR += maybeStyles;
      }

      current = current.next;
    } while (current !== undefined);

    if (!isBrowser$3 && stylesForSSR.length !== 0) {
      return stylesForSSR;
    }
  }
};

/* eslint-disable */
// Inspired by https://github.com/garycourt/murmurhash-js
// Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
function murmur2(str) {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.
  // const m = 0x5bd1e995;
  // const r = 24;
  // Initialize the hash
  var h = 0; // Mix 4 bytes at a time into the hash

  var k,
      i = 0,
      len = str.length;

  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
    k ^=
    /* k >>> r: */
    k >>> 24;
    h =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Handle the last few bytes of the input array


  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h =
      /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.


  h ^= h >>> 13;
  h =
  /* Math.imul(h, m): */
  (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

var ILLEGAL_ESCAPE_SEQUENCE_ERROR$1 = "You have illegal escape sequence in your template literal, most likely inside content's property value.\nBecause you write your CSS inside a JavaScript string you actually have to do double escaping, so for example \"content: '\\00d7';\" should become \"content: '\\\\00d7';\".\nYou can read more about this here:\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences";
var UNDEFINED_AS_OBJECT_KEY_ERROR = "You have passed in falsy value as style object's key (can happen when in example you pass unexported component as computed key).";
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;

var isCustomProperty = function isCustomProperty(property) {
  return property.charCodeAt(1) === 45;
};

var isProcessableValue = function isProcessableValue(value) {
  return value != null && typeof value !== 'boolean';
};

var processStyleName = /* #__PURE__ */memoize$1(function (styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, '-$&').toLowerCase();
});

var processStyleValue = function processStyleValue(key, value) {
  switch (key) {
    case 'animation':
    case 'animationName':
      {
        if (typeof value === 'string') {
          return value.replace(animationRegex, function (match, p1, p2) {
            cursor = {
              name: p1,
              styles: p2,
              next: cursor
            };
            return p1;
          });
        }
      }
  }

  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0) {
    return value + 'px';
  }

  return value;
};

if (process.env.NODE_ENV !== 'production') {
  var contentValuePattern = /(var|attr|counters?|url|element|(((repeating-)?(linear|radial))|conic)-gradient)\(|(no-)?(open|close)-quote/;
  var contentValues = ['normal', 'none', 'initial', 'inherit', 'unset'];
  var oldProcessStyleValue = processStyleValue;
  var msPattern = /^-ms-/;
  var hyphenPattern = /-(.)/g;
  var hyphenatedCache = {};

  processStyleValue = function processStyleValue(key, value) {
    if (key === 'content') {
      if (typeof value !== 'string' || contentValues.indexOf(value) === -1 && !contentValuePattern.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== '"' && value.charAt(0) !== "'")) {
        throw new Error("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"" + value + "\"'`");
      }
    }

    var processed = oldProcessStyleValue(key, value);

    if (processed !== '' && !isCustomProperty(key) && key.indexOf('-') !== -1 && hyphenatedCache[key] === undefined) {
      hyphenatedCache[key] = true;
      console.error("Using kebab-case for css properties in objects is not supported. Did you mean " + key.replace(msPattern, 'ms-').replace(hyphenPattern, function (str, _char) {
        return _char.toUpperCase();
      }) + "?");
    }

    return processed;
  };
}

var noComponentSelectorMessage = 'Component selectors can only be used in conjunction with ' + '@emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware ' + 'compiler transform.';

function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return '';
  }

  if (interpolation.__emotion_styles !== undefined) {
    if (process.env.NODE_ENV !== 'production' && interpolation.toString() === 'NO_COMPONENT_SELECTOR') {
      throw new Error(noComponentSelectorMessage);
    }

    return interpolation;
  }

  switch (typeof interpolation) {
    case 'boolean':
      {
        return '';
      }

    case 'object':
      {
        if (interpolation.anim === 1) {
          cursor = {
            name: interpolation.name,
            styles: interpolation.styles,
            next: cursor
          };
          return interpolation.name;
        }

        if (interpolation.styles !== undefined) {
          var next = interpolation.next;

          if (next !== undefined) {
            // not the most efficient thing ever but this is a pretty rare case
            // and there will be very few iterations of this generally
            while (next !== undefined) {
              cursor = {
                name: next.name,
                styles: next.styles,
                next: cursor
              };
              next = next.next;
            }
          }

          var styles = interpolation.styles + ";";

          if (process.env.NODE_ENV !== 'production' && interpolation.map !== undefined) {
            styles += interpolation.map;
          }

          return styles;
        }

        return createStringFromObject(mergedProps, registered, interpolation);
      }

    case 'function':
      {
        if (mergedProps !== undefined) {
          var previousCursor = cursor;
          var result = interpolation(mergedProps);
          cursor = previousCursor;
          return handleInterpolation(mergedProps, registered, result);
        } else if (process.env.NODE_ENV !== 'production') {
          console.error('Functions that are interpolated in css calls will be stringified.\n' + 'If you want to have a css call based on props, create a function that returns a css call like this\n' + 'let dynamicStyle = (props) => css`color: ${props.color}`\n' + 'It can be called directly with props or interpolated in a styled call like this\n' + "let SomeComponent = styled('div')`${dynamicStyle}`");
        }

        break;
      }

    case 'string':
      if (process.env.NODE_ENV !== 'production') {
        var matched = [];
        var replaced = interpolation.replace(animationRegex, function (match, p1, p2) {
          var fakeVarName = "animation" + matched.length;
          matched.push("const " + fakeVarName + " = keyframes`" + p2.replace(/^@keyframes animation-\w+/, '') + "`");
          return "${" + fakeVarName + "}";
        });

        if (matched.length) {
          console.error('`keyframes` output got interpolated into plain string, please wrap it with `css`.\n\n' + 'Instead of doing this:\n\n' + [].concat(matched, ["`" + replaced + "`"]).join('\n') + '\n\nYou should wrap it with `css` like this:\n\n' + ("css`" + replaced + "`"));
        }
      }

      break;
  } // finalize string values (regular strings and functions interpolated into css calls)


  if (registered == null) {
    return interpolation;
  }

  var cached = registered[interpolation];
  return cached !== undefined ? cached : interpolation;
}

function createStringFromObject(mergedProps, registered, obj) {
  var string = '';

  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var _key in obj) {
      var value = obj[_key];

      if (typeof value !== 'object') {
        if (registered != null && registered[value] !== undefined) {
          string += _key + "{" + registered[value] + "}";
        } else if (isProcessableValue(value)) {
          string += processStyleName(_key) + ":" + processStyleValue(_key, value) + ";";
        }
      } else {
        if (_key === 'NO_COMPONENT_SELECTOR' && process.env.NODE_ENV !== 'production') {
          throw new Error(noComponentSelectorMessage);
        }

        if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(_key) + ":" + processStyleValue(_key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);

          switch (_key) {
            case 'animation':
            case 'animationName':
              {
                string += processStyleName(_key) + ":" + interpolated + ";";
                break;
              }

            default:
              {
                if (process.env.NODE_ENV !== 'production' && _key === 'undefined') {
                  console.error(UNDEFINED_AS_OBJECT_KEY_ERROR);
                }

                string += _key + "{" + interpolated + "}";
              }
          }
        }
      }
    }
  }

  return string;
}

var labelPattern = /label:\s*([^\s;\n{]+)\s*(;|$)/g;
var sourceMapPattern;

if (process.env.NODE_ENV !== 'production') {
  sourceMapPattern = /\/\*#\ssourceMappingURL=data:application\/json;\S+\s+\*\//g;
} // this is the cursor for keyframes
// keyframes are stored on the SerializedStyles object as a linked list


var cursor;
var serializeStyles = function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }

  var stringMode = true;
  var styles = '';
  cursor = undefined;
  var strings = args[0];

  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    if (process.env.NODE_ENV !== 'production' && strings[0] === undefined) {
      console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR$1);
    }

    styles += strings[0];
  } // we start at 1 since we've already handled the first arg


  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);

    if (stringMode) {
      if (process.env.NODE_ENV !== 'production' && strings[i] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR$1);
      }

      styles += strings[i];
    }
  }

  var sourceMap;

  if (process.env.NODE_ENV !== 'production') {
    styles = styles.replace(sourceMapPattern, function (match) {
      sourceMap = match;
      return '';
    });
  } // using a global regex with .exec is stateful so lastIndex has to be reset each time


  labelPattern.lastIndex = 0;
  var identifierName = '';
  var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

  while ((match = labelPattern.exec(styles)) !== null) {
    identifierName += '-' + // $FlowFixMe we know it's not null
    match[1];
  }

  var name = murmur2(styles) + identifierName;

  if (process.env.NODE_ENV !== 'production') {
    // $FlowFixMe SerializedStyles type doesn't have toString property (and we don't want to add it)
    return {
      name: name,
      styles: styles,
      map: sourceMap,
      next: cursor,
      toString: function toString() {
        return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).";
      }
    };
  }

  return {
    name: name,
    styles: styles,
    next: cursor
  };
};

var isBrowser$2 = typeof document !== 'undefined';

var syncFallback = function syncFallback(create) {
  return create();
};

var useInsertionEffect = React$1['useInsertion' + 'Effect'] ? React$1['useInsertion' + 'Effect'] : false;
var useInsertionEffectAlwaysWithSyncFallback = !isBrowser$2 ? syncFallback : useInsertionEffect || syncFallback;

var isBrowser$1 = typeof document !== 'undefined';
var hasOwnProperty$1 = {}.hasOwnProperty;

var EmotionCacheContext = /* #__PURE__ */React$1.createContext( // we're doing this to avoid preconstruct's dead code elimination in this one case
// because this module is primarily intended for the browser and node
// but it's also required in react native and similar environments sometimes
// and we could have a special build just for that
// but this is much easier and the native packages
// might use a different theme context in the future anyway
typeof HTMLElement !== 'undefined' ? /* #__PURE__ */createCache({
  key: 'css'
}) : null);

if (process.env.NODE_ENV !== 'production') {
  EmotionCacheContext.displayName = 'EmotionCacheContext';
}

EmotionCacheContext.Provider;

var withEmotionCache = function withEmotionCache(func) {
  // $FlowFixMe
  return /*#__PURE__*/forwardRef(function (props, ref) {
    // the cache will never be null in the browser
    var cache = useContext(EmotionCacheContext);
    return func(props, cache, ref);
  });
};

if (!isBrowser$1) {
  withEmotionCache = function withEmotionCache(func) {
    return function (props) {
      var cache = useContext(EmotionCacheContext);

      if (cache === null) {
        // yes, we're potentially creating this on every render
        // it doesn't actually matter though since it's only on the server
        // so there will only every be a single render
        // that could change in the future because of suspense and etc. but for now,
        // this works and i don't want to optimise for a future thing that we aren't sure about
        cache = createCache({
          key: 'css'
        });
        return /*#__PURE__*/React$1.createElement(EmotionCacheContext.Provider, {
          value: cache
        }, func(props, cache));
      } else {
        return func(props, cache);
      }
    };
  };
}

var ThemeContext = /* #__PURE__ */React$1.createContext({});

if (process.env.NODE_ENV !== 'production') {
  ThemeContext.displayName = 'EmotionThemeContext';
}

var typePropName = '__EMOTION_TYPE_PLEASE_DO_NOT_USE__';
var labelPropName = '__EMOTION_LABEL_PLEASE_DO_NOT_USE__';

var Insertion$1 = function Insertion(_ref) {
  var cache = _ref.cache,
      serialized = _ref.serialized,
      isStringTag = _ref.isStringTag;
  registerStyles(cache, serialized, isStringTag);
  var rules = useInsertionEffectAlwaysWithSyncFallback(function () {
    return insertStyles(cache, serialized, isStringTag);
  });

  if (!isBrowser$1 && rules !== undefined) {
    var _ref2;

    var serializedNames = serialized.name;
    var next = serialized.next;

    while (next !== undefined) {
      serializedNames += ' ' + next.name;
      next = next.next;
    }

    return /*#__PURE__*/React$1.createElement("style", (_ref2 = {}, _ref2["data-emotion"] = cache.key + " " + serializedNames, _ref2.dangerouslySetInnerHTML = {
      __html: rules
    }, _ref2.nonce = cache.sheet.nonce, _ref2));
  }

  return null;
};

var Emotion = /* #__PURE__ */withEmotionCache(function (props, cache, ref) {
  var cssProp = props.css; // so that using `css` from `emotion` and passing the result to the css prop works
  // not passing the registered cache to serializeStyles because it would
  // make certain babel optimisations not possible

  if (typeof cssProp === 'string' && cache.registered[cssProp] !== undefined) {
    cssProp = cache.registered[cssProp];
  }

  var WrappedComponent = props[typePropName];
  var registeredStyles = [cssProp];
  var className = '';

  if (typeof props.className === 'string') {
    className = getRegisteredStyles(cache.registered, registeredStyles, props.className);
  } else if (props.className != null) {
    className = props.className + " ";
  }

  var serialized = serializeStyles(registeredStyles, undefined, React$1.useContext(ThemeContext));

  if (process.env.NODE_ENV !== 'production' && serialized.name.indexOf('-') === -1) {
    var labelFromStack = props[labelPropName];

    if (labelFromStack) {
      serialized = serializeStyles([serialized, 'label:' + labelFromStack + ';']);
    }
  }

  className += cache.key + "-" + serialized.name;
  var newProps = {};

  for (var key in props) {
    if (hasOwnProperty$1.call(props, key) && key !== 'css' && key !== typePropName && (process.env.NODE_ENV === 'production' || key !== labelPropName)) {
      newProps[key] = props[key];
    }
  }

  newProps.ref = ref;
  newProps.className = className;
  return /*#__PURE__*/React$1.createElement(React$1.Fragment, null, /*#__PURE__*/React$1.createElement(Insertion$1, {
    cache: cache,
    serialized: serialized,
    isStringTag: typeof WrappedComponent === 'string'
  }), /*#__PURE__*/React$1.createElement(WrappedComponent, newProps));
});

if (process.env.NODE_ENV !== 'production') {
  Emotion.displayName = 'EmotionCssPropInternal';
}

var testOmitPropsOnStringTag = isPropValid;

var testOmitPropsOnComponent = function testOmitPropsOnComponent(key) {
  return key !== 'theme';
};

var getDefaultShouldForwardProp = function getDefaultShouldForwardProp(tag) {
  return typeof tag === 'string' && // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  tag.charCodeAt(0) > 96 ? testOmitPropsOnStringTag : testOmitPropsOnComponent;
};
var composeShouldForwardProps = function composeShouldForwardProps(tag, options, isReal) {
  var shouldForwardProp;

  if (options) {
    var optionsShouldForwardProp = options.shouldForwardProp;
    shouldForwardProp = tag.__emotion_forwardProp && optionsShouldForwardProp ? function (propName) {
      return tag.__emotion_forwardProp(propName) && optionsShouldForwardProp(propName);
    } : optionsShouldForwardProp;
  }

  if (typeof shouldForwardProp !== 'function' && isReal) {
    shouldForwardProp = tag.__emotion_forwardProp;
  }

  return shouldForwardProp;
};

var ILLEGAL_ESCAPE_SEQUENCE_ERROR = "You have illegal escape sequence in your template literal, most likely inside content's property value.\nBecause you write your CSS inside a JavaScript string you actually have to do double escaping, so for example \"content: '\\00d7';\" should become \"content: '\\\\00d7';\".\nYou can read more about this here:\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences";
var isBrowser = typeof document !== 'undefined';

var Insertion = function Insertion(_ref) {
  var cache = _ref.cache,
      serialized = _ref.serialized,
      isStringTag = _ref.isStringTag;
  registerStyles(cache, serialized, isStringTag);
  var rules = useInsertionEffectAlwaysWithSyncFallback(function () {
    return insertStyles(cache, serialized, isStringTag);
  });

  if (!isBrowser && rules !== undefined) {
    var _ref2;

    var serializedNames = serialized.name;
    var next = serialized.next;

    while (next !== undefined) {
      serializedNames += ' ' + next.name;
      next = next.next;
    }

    return /*#__PURE__*/React$1.createElement("style", (_ref2 = {}, _ref2["data-emotion"] = cache.key + " " + serializedNames, _ref2.dangerouslySetInnerHTML = {
      __html: rules
    }, _ref2.nonce = cache.sheet.nonce, _ref2));
  }

  return null;
};

var createStyled$1 = function createStyled(tag, options) {
  if (process.env.NODE_ENV !== 'production') {
    if (tag === undefined) {
      throw new Error('You are trying to create a styled element with an undefined component.\nYou may have forgotten to import it.');
    }
  }

  var isReal = tag.__emotion_real === tag;
  var baseTag = isReal && tag.__emotion_base || tag;
  var identifierName;
  var targetClassName;

  if (options !== undefined) {
    identifierName = options.label;
    targetClassName = options.target;
  }

  var shouldForwardProp = composeShouldForwardProps(tag, options, isReal);
  var defaultShouldForwardProp = shouldForwardProp || getDefaultShouldForwardProp(baseTag);
  var shouldUseAs = !defaultShouldForwardProp('as');
  return function () {
    var args = arguments;
    var styles = isReal && tag.__emotion_styles !== undefined ? tag.__emotion_styles.slice(0) : [];

    if (identifierName !== undefined) {
      styles.push("label:" + identifierName + ";");
    }

    if (args[0] == null || args[0].raw === undefined) {
      styles.push.apply(styles, args);
    } else {
      if (process.env.NODE_ENV !== 'production' && args[0][0] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
      }

      styles.push(args[0][0]);
      var len = args.length;
      var i = 1;

      for (; i < len; i++) {
        if (process.env.NODE_ENV !== 'production' && args[0][i] === undefined) {
          console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
        }

        styles.push(args[i], args[0][i]);
      }
    } // $FlowFixMe: we need to cast StatelessFunctionalComponent to our PrivateStyledComponent class


    var Styled = withEmotionCache(function (props, cache, ref) {
      var FinalTag = shouldUseAs && props.as || baseTag;
      var className = '';
      var classInterpolations = [];
      var mergedProps = props;

      if (props.theme == null) {
        mergedProps = {};

        for (var key in props) {
          mergedProps[key] = props[key];
        }

        mergedProps.theme = React$1.useContext(ThemeContext);
      }

      if (typeof props.className === 'string') {
        className = getRegisteredStyles(cache.registered, classInterpolations, props.className);
      } else if (props.className != null) {
        className = props.className + " ";
      }

      var serialized = serializeStyles(styles.concat(classInterpolations), cache.registered, mergedProps);
      className += cache.key + "-" + serialized.name;

      if (targetClassName !== undefined) {
        className += " " + targetClassName;
      }

      var finalShouldForwardProp = shouldUseAs && shouldForwardProp === undefined ? getDefaultShouldForwardProp(FinalTag) : defaultShouldForwardProp;
      var newProps = {};

      for (var _key in props) {
        if (shouldUseAs && _key === 'as') continue;

        if ( // $FlowFixMe
        finalShouldForwardProp(_key)) {
          newProps[_key] = props[_key];
        }
      }

      newProps.className = className;
      newProps.ref = ref;
      return /*#__PURE__*/React$1.createElement(React$1.Fragment, null, /*#__PURE__*/React$1.createElement(Insertion, {
        cache: cache,
        serialized: serialized,
        isStringTag: typeof FinalTag === 'string'
      }), /*#__PURE__*/React$1.createElement(FinalTag, newProps));
    });
    Styled.displayName = identifierName !== undefined ? identifierName : "Styled(" + (typeof baseTag === 'string' ? baseTag : baseTag.displayName || baseTag.name || 'Component') + ")";
    Styled.defaultProps = tag.defaultProps;
    Styled.__emotion_real = Styled;
    Styled.__emotion_base = baseTag;
    Styled.__emotion_styles = styles;
    Styled.__emotion_forwardProp = shouldForwardProp;
    Object.defineProperty(Styled, 'toString', {
      value: function value() {
        if (targetClassName === undefined && process.env.NODE_ENV !== 'production') {
          return 'NO_COMPONENT_SELECTOR';
        } // $FlowFixMe: coerce undefined to string


        return "." + targetClassName;
      }
    });

    Styled.withComponent = function (nextTag, nextOptions) {
      return createStyled(nextTag, _extends({}, options, nextOptions, {
        shouldForwardProp: composeShouldForwardProps(Styled, nextOptions, true)
      })).apply(void 0, styles);
    };

    return Styled;
  };
};

var tags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr', // SVG
'circle', 'clipPath', 'defs', 'ellipse', 'foreignObject', 'g', 'image', 'line', 'linearGradient', 'mask', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text', 'tspan'];

var newStyled = createStyled$1.bind();
tags.forEach(function (tagName) {
  // $FlowFixMe: we can ignore this because its exposed type is defined by the CreateStyled type
  newStyled[tagName] = newStyled(tagName);
});

/**
 * @mui/styled-engine v5.12.3
 *
 * @license MIT
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function styled$2(tag, options) {
  const stylesFactory = newStyled(tag, options);
  if (process.env.NODE_ENV !== 'production') {
    return (...styles) => {
      const component = typeof tag === 'string' ? `"${tag}"` : 'component';
      if (styles.length === 0) {
        console.error([`MUI: Seems like you called \`styled(${component})()\` without a \`style\` argument.`, 'You must provide a `styles` argument: `styled("div")(styleYouForgotToPass)`.'].join('\n'));
      } else if (styles.some(style => style === undefined)) {
        console.error(`MUI: the styled(${component})(...args) API requires all its args to be defined.`);
      }
      return stylesFactory(...styles);
    };
  }
  return stylesFactory;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const internal_processStyles = (tag, processor) => {
  // Emotion attaches all the styles as `__emotion_styles`.
  // Ref: https://github.com/emotion-js/emotion/blob/16d971d0da229596d6bcc39d282ba9753c9ee7cf/packages/styled/src/base.js#L186
  if (Array.isArray(tag.__emotion_styles)) {
    tag.__emotion_styles = processor(tag.__emotion_styles);
  }
};

const _excluded$8 = ["values", "unit", "step"];
const sortBreakpointsValues = values => {
  const breakpointsAsArray = Object.keys(values).map(key => ({
    key,
    val: values[key]
  })) || [];
  // Sort in ascending order
  breakpointsAsArray.sort((breakpoint1, breakpoint2) => breakpoint1.val - breakpoint2.val);
  return breakpointsAsArray.reduce((acc, obj) => {
    return _extends({}, acc, {
      [obj.key]: obj.val
    });
  }, {});
};

// Keep in mind that @media is inclusive by the CSS specification.
function createBreakpoints(breakpoints) {
  const {
      // The breakpoint **start** at this value.
      // For instance with the first breakpoint xs: [xs, sm).
      values = {
        xs: 0,
        // phone
        sm: 600,
        // tablet
        md: 900,
        // small laptop
        lg: 1200,
        // desktop
        xl: 1536 // large screen
      },

      unit = 'px',
      step = 5
    } = breakpoints,
    other = _objectWithoutPropertiesLoose(breakpoints, _excluded$8);
  const sortedValues = sortBreakpointsValues(values);
  const keys = Object.keys(sortedValues);
  function up(key) {
    const value = typeof values[key] === 'number' ? values[key] : key;
    return `@media (min-width:${value}${unit})`;
  }
  function down(key) {
    const value = typeof values[key] === 'number' ? values[key] : key;
    return `@media (max-width:${value - step / 100}${unit})`;
  }
  function between(start, end) {
    const endIndex = keys.indexOf(end);
    return `@media (min-width:${typeof values[start] === 'number' ? values[start] : start}${unit}) and ` + `(max-width:${(endIndex !== -1 && typeof values[keys[endIndex]] === 'number' ? values[keys[endIndex]] : end) - step / 100}${unit})`;
  }
  function only(key) {
    if (keys.indexOf(key) + 1 < keys.length) {
      return between(key, keys[keys.indexOf(key) + 1]);
    }
    return up(key);
  }
  function not(key) {
    // handle first and last key separately, for better readability
    const keyIndex = keys.indexOf(key);
    if (keyIndex === 0) {
      return up(keys[1]);
    }
    if (keyIndex === keys.length - 1) {
      return down(keys[keyIndex]);
    }
    return between(key, keys[keys.indexOf(key) + 1]).replace('@media', '@media not all and');
  }
  return _extends({
    keys,
    values: sortedValues,
    up,
    down,
    between,
    only,
    not,
    unit
  }, other);
}

const shape = {
  borderRadius: 4
};
var shape$1 = shape;

const responsivePropType = process.env.NODE_ENV !== 'production' ? PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object, PropTypes.array]) : {};
var responsivePropType$1 = responsivePropType;

function merge(acc, item) {
  if (!item) {
    return acc;
  }
  return deepmerge(acc, item, {
    clone: false // No need to clone deep, it's way faster.
  });
}

// The breakpoint **start** at this value.
// For instance with the first breakpoint xs: [xs, sm[.
const values = {
  xs: 0,
  // phone
  sm: 600,
  // tablet
  md: 900,
  // small laptop
  lg: 1200,
  // desktop
  xl: 1536 // large screen
};

const defaultBreakpoints = {
  // Sorted ASC by size. That's important.
  // It can't be configured as it's used statically for propTypes.
  keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  up: key => `@media (min-width:${values[key]}px)`
};
function handleBreakpoints(props, propValue, styleFromPropValue) {
  const theme = props.theme || {};
  if (Array.isArray(propValue)) {
    const themeBreakpoints = theme.breakpoints || defaultBreakpoints;
    return propValue.reduce((acc, item, index) => {
      acc[themeBreakpoints.up(themeBreakpoints.keys[index])] = styleFromPropValue(propValue[index]);
      return acc;
    }, {});
  }
  if (typeof propValue === 'object') {
    const themeBreakpoints = theme.breakpoints || defaultBreakpoints;
    return Object.keys(propValue).reduce((acc, breakpoint) => {
      // key is breakpoint
      if (Object.keys(themeBreakpoints.values || values).indexOf(breakpoint) !== -1) {
        const mediaKey = themeBreakpoints.up(breakpoint);
        acc[mediaKey] = styleFromPropValue(propValue[breakpoint], breakpoint);
      } else {
        const cssKey = breakpoint;
        acc[cssKey] = propValue[cssKey];
      }
      return acc;
    }, {});
  }
  const output = styleFromPropValue(propValue);
  return output;
}
function createEmptyBreakpointObject(breakpointsInput = {}) {
  var _breakpointsInput$key;
  const breakpointsInOrder = (_breakpointsInput$key = breakpointsInput.keys) == null ? void 0 : _breakpointsInput$key.reduce((acc, key) => {
    const breakpointStyleKey = breakpointsInput.up(key);
    acc[breakpointStyleKey] = {};
    return acc;
  }, {});
  return breakpointsInOrder || {};
}
function removeUnusedBreakpoints(breakpointKeys, style) {
  return breakpointKeys.reduce((acc, key) => {
    const breakpointOutput = acc[key];
    const isBreakpointUnused = !breakpointOutput || Object.keys(breakpointOutput).length === 0;
    if (isBreakpointUnused) {
      delete acc[key];
    }
    return acc;
  }, style);
}

function getPath(obj, path, checkVars = true) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // Check if CSS variables are used
  if (obj && obj.vars && checkVars) {
    const val = `vars.${path}`.split('.').reduce((acc, item) => acc && acc[item] ? acc[item] : null, obj);
    if (val != null) {
      return val;
    }
  }
  return path.split('.').reduce((acc, item) => {
    if (acc && acc[item] != null) {
      return acc[item];
    }
    return null;
  }, obj);
}
function getStyleValue(themeMapping, transform, propValueFinal, userValue = propValueFinal) {
  let value;
  if (typeof themeMapping === 'function') {
    value = themeMapping(propValueFinal);
  } else if (Array.isArray(themeMapping)) {
    value = themeMapping[propValueFinal] || userValue;
  } else {
    value = getPath(themeMapping, propValueFinal) || userValue;
  }
  if (transform) {
    value = transform(value, userValue, themeMapping);
  }
  return value;
}
function style$1(options) {
  const {
    prop,
    cssProperty = options.prop,
    themeKey,
    transform
  } = options;

  // false positive
  // eslint-disable-next-line react/function-component-definition
  const fn = props => {
    if (props[prop] == null) {
      return null;
    }
    const propValue = props[prop];
    const theme = props.theme;
    const themeMapping = getPath(theme, themeKey) || {};
    const styleFromPropValue = propValueFinal => {
      let value = getStyleValue(themeMapping, transform, propValueFinal);
      if (propValueFinal === value && typeof propValueFinal === 'string') {
        // Haven't found value
        value = getStyleValue(themeMapping, transform, `${prop}${propValueFinal === 'default' ? '' : capitalize(propValueFinal)}`, propValueFinal);
      }
      if (cssProperty === false) {
        return value;
      }
      return {
        [cssProperty]: value
      };
    };
    return handleBreakpoints(props, propValue, styleFromPropValue);
  };
  fn.propTypes = process.env.NODE_ENV !== 'production' ? {
    [prop]: responsivePropType$1
  } : {};
  fn.filterProps = [prop];
  return fn;
}

function memoize(fn) {
  const cache = {};
  return arg => {
    if (cache[arg] === undefined) {
      cache[arg] = fn(arg);
    }
    return cache[arg];
  };
}

const properties$1 = {
  m: 'margin',
  p: 'padding'
};
const directions = {
  t: 'Top',
  r: 'Right',
  b: 'Bottom',
  l: 'Left',
  x: ['Left', 'Right'],
  y: ['Top', 'Bottom']
};
const aliases = {
  marginX: 'mx',
  marginY: 'my',
  paddingX: 'px',
  paddingY: 'py'
};

// memoize() impact:
// From 300,000 ops/sec
// To 350,000 ops/sec
const getCssProperties = memoize(prop => {
  // It's not a shorthand notation.
  if (prop.length > 2) {
    if (aliases[prop]) {
      prop = aliases[prop];
    } else {
      return [prop];
    }
  }
  const [a, b] = prop.split('');
  const property = properties$1[a];
  const direction = directions[b] || '';
  return Array.isArray(direction) ? direction.map(dir => property + dir) : [property + direction];
});
const marginKeys = ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'marginX', 'marginY', 'marginInline', 'marginInlineStart', 'marginInlineEnd', 'marginBlock', 'marginBlockStart', 'marginBlockEnd'];
const paddingKeys = ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingX', 'paddingY', 'paddingInline', 'paddingInlineStart', 'paddingInlineEnd', 'paddingBlock', 'paddingBlockStart', 'paddingBlockEnd'];
const spacingKeys = [...marginKeys, ...paddingKeys];
function createUnaryUnit(theme, themeKey, defaultValue, propName) {
  var _getPath;
  const themeSpacing = (_getPath = getPath(theme, themeKey, false)) != null ? _getPath : defaultValue;
  if (typeof themeSpacing === 'number') {
    return abs => {
      if (typeof abs === 'string') {
        return abs;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (typeof abs !== 'number') {
          console.error(`MUI: Expected ${propName} argument to be a number or a string, got ${abs}.`);
        }
      }
      return themeSpacing * abs;
    };
  }
  if (Array.isArray(themeSpacing)) {
    return abs => {
      if (typeof abs === 'string') {
        return abs;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (!Number.isInteger(abs)) {
          console.error([`MUI: The \`theme.${themeKey}\` array type cannot be combined with non integer values.` + `You should either use an integer value that can be used as index, or define the \`theme.${themeKey}\` as a number.`].join('\n'));
        } else if (abs > themeSpacing.length - 1) {
          console.error([`MUI: The value provided (${abs}) overflows.`, `The supported values are: ${JSON.stringify(themeSpacing)}.`, `${abs} > ${themeSpacing.length - 1}, you need to add the missing values.`].join('\n'));
        }
      }
      return themeSpacing[abs];
    };
  }
  if (typeof themeSpacing === 'function') {
    return themeSpacing;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error([`MUI: The \`theme.${themeKey}\` value (${themeSpacing}) is invalid.`, 'It should be a number, an array or a function.'].join('\n'));
  }
  return () => undefined;
}
function createUnarySpacing(theme) {
  return createUnaryUnit(theme, 'spacing', 8, 'spacing');
}
function getValue(transformer, propValue) {
  if (typeof propValue === 'string' || propValue == null) {
    return propValue;
  }
  const abs = Math.abs(propValue);
  const transformed = transformer(abs);
  if (propValue >= 0) {
    return transformed;
  }
  if (typeof transformed === 'number') {
    return -transformed;
  }
  return `-${transformed}`;
}
function getStyleFromPropValue(cssProperties, transformer) {
  return propValue => cssProperties.reduce((acc, cssProperty) => {
    acc[cssProperty] = getValue(transformer, propValue);
    return acc;
  }, {});
}
function resolveCssProperty(props, keys, prop, transformer) {
  // Using a hash computation over an array iteration could be faster, but with only 28 items,
  // it's doesn't worth the bundle size.
  if (keys.indexOf(prop) === -1) {
    return null;
  }
  const cssProperties = getCssProperties(prop);
  const styleFromPropValue = getStyleFromPropValue(cssProperties, transformer);
  const propValue = props[prop];
  return handleBreakpoints(props, propValue, styleFromPropValue);
}
function style(props, keys) {
  const transformer = createUnarySpacing(props.theme);
  return Object.keys(props).map(prop => resolveCssProperty(props, keys, prop, transformer)).reduce(merge, {});
}
function margin(props) {
  return style(props, marginKeys);
}
margin.propTypes = process.env.NODE_ENV !== 'production' ? marginKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};
margin.filterProps = marginKeys;
function padding(props) {
  return style(props, paddingKeys);
}
padding.propTypes = process.env.NODE_ENV !== 'production' ? paddingKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};
padding.filterProps = paddingKeys;
process.env.NODE_ENV !== 'production' ? spacingKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};

// The different signatures imply different meaning for their arguments that can't be expressed structurally.
// We express the difference with variable names.
/* tslint:disable:unified-signatures */
/* tslint:enable:unified-signatures */

function createSpacing(spacingInput = 8) {
  // Already transformed.
  if (spacingInput.mui) {
    return spacingInput;
  }

  // Material Design layouts are visually balanced. Most measurements align to an 8dp grid, which aligns both spacing and the overall layout.
  // Smaller components, such as icons, can align to a 4dp grid.
  // https://m2.material.io/design/layout/understanding-layout.html
  const transform = createUnarySpacing({
    spacing: spacingInput
  });
  const spacing = (...argsInput) => {
    if (process.env.NODE_ENV !== 'production') {
      if (!(argsInput.length <= 4)) {
        console.error(`MUI: Too many arguments provided, expected between 0 and 4, got ${argsInput.length}`);
      }
    }
    const args = argsInput.length === 0 ? [1] : argsInput;
    return args.map(argument => {
      const output = transform(argument);
      return typeof output === 'number' ? `${output}px` : output;
    }).join(' ');
  };
  spacing.mui = true;
  return spacing;
}

function compose(...styles) {
  const handlers = styles.reduce((acc, style) => {
    style.filterProps.forEach(prop => {
      acc[prop] = style;
    });
    return acc;
  }, {});

  // false positive
  // eslint-disable-next-line react/function-component-definition
  const fn = props => {
    return Object.keys(props).reduce((acc, prop) => {
      if (handlers[prop]) {
        return merge(acc, handlers[prop](props));
      }
      return acc;
    }, {});
  };
  fn.propTypes = process.env.NODE_ENV !== 'production' ? styles.reduce((acc, style) => Object.assign(acc, style.propTypes), {}) : {};
  fn.filterProps = styles.reduce((acc, style) => acc.concat(style.filterProps), []);
  return fn;
}

function borderTransform(value) {
  if (typeof value !== 'number') {
    return value;
  }
  return `${value}px solid`;
}
const border = style$1({
  prop: 'border',
  themeKey: 'borders',
  transform: borderTransform
});
const borderTop = style$1({
  prop: 'borderTop',
  themeKey: 'borders',
  transform: borderTransform
});
const borderRight = style$1({
  prop: 'borderRight',
  themeKey: 'borders',
  transform: borderTransform
});
const borderBottom = style$1({
  prop: 'borderBottom',
  themeKey: 'borders',
  transform: borderTransform
});
const borderLeft = style$1({
  prop: 'borderLeft',
  themeKey: 'borders',
  transform: borderTransform
});
const borderColor = style$1({
  prop: 'borderColor',
  themeKey: 'palette'
});
const borderTopColor = style$1({
  prop: 'borderTopColor',
  themeKey: 'palette'
});
const borderRightColor = style$1({
  prop: 'borderRightColor',
  themeKey: 'palette'
});
const borderBottomColor = style$1({
  prop: 'borderBottomColor',
  themeKey: 'palette'
});
const borderLeftColor = style$1({
  prop: 'borderLeftColor',
  themeKey: 'palette'
});

// false positive
// eslint-disable-next-line react/function-component-definition
const borderRadius = props => {
  if (props.borderRadius !== undefined && props.borderRadius !== null) {
    const transformer = createUnaryUnit(props.theme, 'shape.borderRadius', 4, 'borderRadius');
    const styleFromPropValue = propValue => ({
      borderRadius: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.borderRadius, styleFromPropValue);
  }
  return null;
};
borderRadius.propTypes = process.env.NODE_ENV !== 'production' ? {
  borderRadius: responsivePropType$1
} : {};
borderRadius.filterProps = ['borderRadius'];
compose(border, borderTop, borderRight, borderBottom, borderLeft, borderColor, borderTopColor, borderRightColor, borderBottomColor, borderLeftColor, borderRadius);

// false positive
// eslint-disable-next-line react/function-component-definition
const gap = props => {
  if (props.gap !== undefined && props.gap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'gap');
    const styleFromPropValue = propValue => ({
      gap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.gap, styleFromPropValue);
  }
  return null;
};
gap.propTypes = process.env.NODE_ENV !== 'production' ? {
  gap: responsivePropType$1
} : {};
gap.filterProps = ['gap'];

// false positive
// eslint-disable-next-line react/function-component-definition
const columnGap = props => {
  if (props.columnGap !== undefined && props.columnGap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'columnGap');
    const styleFromPropValue = propValue => ({
      columnGap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.columnGap, styleFromPropValue);
  }
  return null;
};
columnGap.propTypes = process.env.NODE_ENV !== 'production' ? {
  columnGap: responsivePropType$1
} : {};
columnGap.filterProps = ['columnGap'];

// false positive
// eslint-disable-next-line react/function-component-definition
const rowGap = props => {
  if (props.rowGap !== undefined && props.rowGap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'rowGap');
    const styleFromPropValue = propValue => ({
      rowGap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.rowGap, styleFromPropValue);
  }
  return null;
};
rowGap.propTypes = process.env.NODE_ENV !== 'production' ? {
  rowGap: responsivePropType$1
} : {};
rowGap.filterProps = ['rowGap'];
const gridColumn = style$1({
  prop: 'gridColumn'
});
const gridRow = style$1({
  prop: 'gridRow'
});
const gridAutoFlow = style$1({
  prop: 'gridAutoFlow'
});
const gridAutoColumns = style$1({
  prop: 'gridAutoColumns'
});
const gridAutoRows = style$1({
  prop: 'gridAutoRows'
});
const gridTemplateColumns = style$1({
  prop: 'gridTemplateColumns'
});
const gridTemplateRows = style$1({
  prop: 'gridTemplateRows'
});
const gridTemplateAreas = style$1({
  prop: 'gridTemplateAreas'
});
const gridArea = style$1({
  prop: 'gridArea'
});
compose(gap, columnGap, rowGap, gridColumn, gridRow, gridAutoFlow, gridAutoColumns, gridAutoRows, gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gridArea);

function paletteTransform(value, userValue) {
  if (userValue === 'grey') {
    return userValue;
  }
  return value;
}
const color = style$1({
  prop: 'color',
  themeKey: 'palette',
  transform: paletteTransform
});
const bgcolor = style$1({
  prop: 'bgcolor',
  cssProperty: 'backgroundColor',
  themeKey: 'palette',
  transform: paletteTransform
});
const backgroundColor = style$1({
  prop: 'backgroundColor',
  themeKey: 'palette',
  transform: paletteTransform
});
compose(color, bgcolor, backgroundColor);

function sizingTransform(value) {
  return value <= 1 && value !== 0 ? `${value * 100}%` : value;
}
const width = style$1({
  prop: 'width',
  transform: sizingTransform
});
const maxWidth = props => {
  if (props.maxWidth !== undefined && props.maxWidth !== null) {
    const styleFromPropValue = propValue => {
      var _props$theme, _props$theme$breakpoi, _props$theme$breakpoi2;
      const breakpoint = ((_props$theme = props.theme) == null ? void 0 : (_props$theme$breakpoi = _props$theme.breakpoints) == null ? void 0 : (_props$theme$breakpoi2 = _props$theme$breakpoi.values) == null ? void 0 : _props$theme$breakpoi2[propValue]) || values[propValue];
      return {
        maxWidth: breakpoint || sizingTransform(propValue)
      };
    };
    return handleBreakpoints(props, props.maxWidth, styleFromPropValue);
  }
  return null;
};
maxWidth.filterProps = ['maxWidth'];
const minWidth = style$1({
  prop: 'minWidth',
  transform: sizingTransform
});
const height = style$1({
  prop: 'height',
  transform: sizingTransform
});
const maxHeight = style$1({
  prop: 'maxHeight',
  transform: sizingTransform
});
const minHeight = style$1({
  prop: 'minHeight',
  transform: sizingTransform
});
style$1({
  prop: 'size',
  cssProperty: 'width',
  transform: sizingTransform
});
style$1({
  prop: 'size',
  cssProperty: 'height',
  transform: sizingTransform
});
const boxSizing = style$1({
  prop: 'boxSizing'
});
compose(width, maxWidth, minWidth, height, maxHeight, minHeight, boxSizing);

const defaultSxConfig = {
  // borders
  border: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderTop: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderRight: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderBottom: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderLeft: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderColor: {
    themeKey: 'palette'
  },
  borderTopColor: {
    themeKey: 'palette'
  },
  borderRightColor: {
    themeKey: 'palette'
  },
  borderBottomColor: {
    themeKey: 'palette'
  },
  borderLeftColor: {
    themeKey: 'palette'
  },
  borderRadius: {
    themeKey: 'shape.borderRadius',
    style: borderRadius
  },
  // palette
  color: {
    themeKey: 'palette',
    transform: paletteTransform
  },
  bgcolor: {
    themeKey: 'palette',
    cssProperty: 'backgroundColor',
    transform: paletteTransform
  },
  backgroundColor: {
    themeKey: 'palette',
    transform: paletteTransform
  },
  // spacing
  p: {
    style: padding
  },
  pt: {
    style: padding
  },
  pr: {
    style: padding
  },
  pb: {
    style: padding
  },
  pl: {
    style: padding
  },
  px: {
    style: padding
  },
  py: {
    style: padding
  },
  padding: {
    style: padding
  },
  paddingTop: {
    style: padding
  },
  paddingRight: {
    style: padding
  },
  paddingBottom: {
    style: padding
  },
  paddingLeft: {
    style: padding
  },
  paddingX: {
    style: padding
  },
  paddingY: {
    style: padding
  },
  paddingInline: {
    style: padding
  },
  paddingInlineStart: {
    style: padding
  },
  paddingInlineEnd: {
    style: padding
  },
  paddingBlock: {
    style: padding
  },
  paddingBlockStart: {
    style: padding
  },
  paddingBlockEnd: {
    style: padding
  },
  m: {
    style: margin
  },
  mt: {
    style: margin
  },
  mr: {
    style: margin
  },
  mb: {
    style: margin
  },
  ml: {
    style: margin
  },
  mx: {
    style: margin
  },
  my: {
    style: margin
  },
  margin: {
    style: margin
  },
  marginTop: {
    style: margin
  },
  marginRight: {
    style: margin
  },
  marginBottom: {
    style: margin
  },
  marginLeft: {
    style: margin
  },
  marginX: {
    style: margin
  },
  marginY: {
    style: margin
  },
  marginInline: {
    style: margin
  },
  marginInlineStart: {
    style: margin
  },
  marginInlineEnd: {
    style: margin
  },
  marginBlock: {
    style: margin
  },
  marginBlockStart: {
    style: margin
  },
  marginBlockEnd: {
    style: margin
  },
  // display
  displayPrint: {
    cssProperty: false,
    transform: value => ({
      '@media print': {
        display: value
      }
    })
  },
  display: {},
  overflow: {},
  textOverflow: {},
  visibility: {},
  whiteSpace: {},
  // flexbox
  flexBasis: {},
  flexDirection: {},
  flexWrap: {},
  justifyContent: {},
  alignItems: {},
  alignContent: {},
  order: {},
  flex: {},
  flexGrow: {},
  flexShrink: {},
  alignSelf: {},
  justifyItems: {},
  justifySelf: {},
  // grid
  gap: {
    style: gap
  },
  rowGap: {
    style: rowGap
  },
  columnGap: {
    style: columnGap
  },
  gridColumn: {},
  gridRow: {},
  gridAutoFlow: {},
  gridAutoColumns: {},
  gridAutoRows: {},
  gridTemplateColumns: {},
  gridTemplateRows: {},
  gridTemplateAreas: {},
  gridArea: {},
  // positions
  position: {},
  zIndex: {
    themeKey: 'zIndex'
  },
  top: {},
  right: {},
  bottom: {},
  left: {},
  // shadows
  boxShadow: {
    themeKey: 'shadows'
  },
  // sizing
  width: {
    transform: sizingTransform
  },
  maxWidth: {
    style: maxWidth
  },
  minWidth: {
    transform: sizingTransform
  },
  height: {
    transform: sizingTransform
  },
  maxHeight: {
    transform: sizingTransform
  },
  minHeight: {
    transform: sizingTransform
  },
  boxSizing: {},
  // typography
  fontFamily: {
    themeKey: 'typography'
  },
  fontSize: {
    themeKey: 'typography'
  },
  fontStyle: {
    themeKey: 'typography'
  },
  fontWeight: {
    themeKey: 'typography'
  },
  letterSpacing: {},
  textTransform: {},
  lineHeight: {},
  textAlign: {},
  typography: {
    cssProperty: false,
    themeKey: 'typography'
  }
};
var defaultSxConfig$1 = defaultSxConfig;

function objectsHaveSameKeys(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every(object => union.size === Object.keys(object).length);
}
function callIfFn(maybeFn, arg) {
  return typeof maybeFn === 'function' ? maybeFn(arg) : maybeFn;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function unstable_createStyleFunctionSx() {
  function getThemeValue(prop, val, theme, config) {
    const props = {
      [prop]: val,
      theme
    };
    const options = config[prop];
    if (!options) {
      return {
        [prop]: val
      };
    }
    const {
      cssProperty = prop,
      themeKey,
      transform,
      style
    } = options;
    if (val == null) {
      return null;
    }
    if (themeKey === 'typography' && val === 'inherit') {
      return {
        [prop]: val
      };
    }
    const themeMapping = getPath(theme, themeKey) || {};
    if (style) {
      return style(props);
    }
    const styleFromPropValue = propValueFinal => {
      let value = getStyleValue(themeMapping, transform, propValueFinal);
      if (propValueFinal === value && typeof propValueFinal === 'string') {
        // Haven't found value
        value = getStyleValue(themeMapping, transform, `${prop}${propValueFinal === 'default' ? '' : capitalize(propValueFinal)}`, propValueFinal);
      }
      if (cssProperty === false) {
        return value;
      }
      return {
        [cssProperty]: value
      };
    };
    return handleBreakpoints(props, val, styleFromPropValue);
  }
  function styleFunctionSx(props) {
    var _theme$unstable_sxCon;
    const {
      sx,
      theme = {}
    } = props || {};
    if (!sx) {
      return null; // Emotion & styled-components will neglect null
    }

    const config = (_theme$unstable_sxCon = theme.unstable_sxConfig) != null ? _theme$unstable_sxCon : defaultSxConfig$1;

    /*
     * Receive `sxInput` as object or callback
     * and then recursively check keys & values to create media query object styles.
     * (the result will be used in `styled`)
     */
    function traverse(sxInput) {
      let sxObject = sxInput;
      if (typeof sxInput === 'function') {
        sxObject = sxInput(theme);
      } else if (typeof sxInput !== 'object') {
        // value
        return sxInput;
      }
      if (!sxObject) {
        return null;
      }
      const emptyBreakpoints = createEmptyBreakpointObject(theme.breakpoints);
      const breakpointsKeys = Object.keys(emptyBreakpoints);
      let css = emptyBreakpoints;
      Object.keys(sxObject).forEach(styleKey => {
        const value = callIfFn(sxObject[styleKey], theme);
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            if (config[styleKey]) {
              css = merge(css, getThemeValue(styleKey, value, theme, config));
            } else {
              const breakpointsValues = handleBreakpoints({
                theme
              }, value, x => ({
                [styleKey]: x
              }));
              if (objectsHaveSameKeys(breakpointsValues, value)) {
                css[styleKey] = styleFunctionSx({
                  sx: value,
                  theme
                });
              } else {
                css = merge(css, breakpointsValues);
              }
            }
          } else {
            css = merge(css, getThemeValue(styleKey, value, theme, config));
          }
        }
      });
      return removeUnusedBreakpoints(breakpointsKeys, css);
    }
    return Array.isArray(sx) ? sx.map(traverse) : traverse(sx);
  }
  return styleFunctionSx;
}
const styleFunctionSx = unstable_createStyleFunctionSx();
styleFunctionSx.filterProps = ['sx'];
var styleFunctionSx$1 = styleFunctionSx;

const _excluded$7 = ["breakpoints", "palette", "spacing", "shape"];
function createTheme$1(options = {}, ...args) {
  const {
      breakpoints: breakpointsInput = {},
      palette: paletteInput = {},
      spacing: spacingInput,
      shape: shapeInput = {}
    } = options,
    other = _objectWithoutPropertiesLoose(options, _excluded$7);
  const breakpoints = createBreakpoints(breakpointsInput);
  const spacing = createSpacing(spacingInput);
  let muiTheme = deepmerge({
    breakpoints,
    direction: 'ltr',
    components: {},
    // Inject component definitions.
    palette: _extends({
      mode: 'light'
    }, paletteInput),
    spacing,
    shape: _extends({}, shape$1, shapeInput)
  }, other);
  muiTheme = args.reduce((acc, argument) => deepmerge(acc, argument), muiTheme);
  muiTheme.unstable_sxConfig = _extends({}, defaultSxConfig$1, other == null ? void 0 : other.unstable_sxConfig);
  muiTheme.unstable_sx = function sx(props) {
    return styleFunctionSx$1({
      sx: props,
      theme: this
    });
  };
  return muiTheme;
}

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}
function useTheme$2(defaultTheme = null) {
  const contextTheme = React$1.useContext(ThemeContext);
  return !contextTheme || isObjectEmpty(contextTheme) ? defaultTheme : contextTheme;
}

const systemDefaultTheme$1 = createTheme$1();
function useTheme$1(defaultTheme = systemDefaultTheme$1) {
  return useTheme$2(defaultTheme);
}

const _excluded$6 = ["variant"];
function isEmpty$1(string) {
  return string.length === 0;
}

/**
 * Generates string classKey based on the properties provided. It starts with the
 * variant if defined, and then it appends all other properties in alphabetical order.
 * @param {object} props - the properties for which the classKey should be created.
 */
function propsToClassKey(props) {
  const {
      variant
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$6);
  let classKey = variant || '';
  Object.keys(other).sort().forEach(key => {
    if (key === 'color') {
      classKey += isEmpty$1(classKey) ? props[key] : capitalize(props[key]);
    } else {
      classKey += `${isEmpty$1(classKey) ? key : capitalize(key)}${capitalize(props[key].toString())}`;
    }
  });
  return classKey;
}

const _excluded$5 = ["name", "slot", "skipVariantsResolver", "skipSx", "overridesResolver"];
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// https://github.com/emotion-js/emotion/blob/26ded6109fcd8ca9875cc2ce4564fee678a3f3c5/packages/styled/src/utils.js#L40
function isStringTag(tag) {
  return typeof tag === 'string' &&
  // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  tag.charCodeAt(0) > 96;
}
const getStyleOverrides = (name, theme) => {
  if (theme.components && theme.components[name] && theme.components[name].styleOverrides) {
    return theme.components[name].styleOverrides;
  }
  return null;
};
const getVariantStyles = (name, theme) => {
  let variants = [];
  if (theme && theme.components && theme.components[name] && theme.components[name].variants) {
    variants = theme.components[name].variants;
  }
  const variantsStyles = {};
  variants.forEach(definition => {
    const key = propsToClassKey(definition.props);
    variantsStyles[key] = definition.style;
  });
  return variantsStyles;
};
const variantsResolver = (props, styles, theme, name) => {
  var _theme$components, _theme$components$nam;
  const {
    ownerState = {}
  } = props;
  const variantsStyles = [];
  const themeVariants = theme == null ? void 0 : (_theme$components = theme.components) == null ? void 0 : (_theme$components$nam = _theme$components[name]) == null ? void 0 : _theme$components$nam.variants;
  if (themeVariants) {
    themeVariants.forEach(themeVariant => {
      let isMatch = true;
      Object.keys(themeVariant.props).forEach(key => {
        if (ownerState[key] !== themeVariant.props[key] && props[key] !== themeVariant.props[key]) {
          isMatch = false;
        }
      });
      if (isMatch) {
        variantsStyles.push(styles[propsToClassKey(themeVariant.props)]);
      }
    });
  }
  return variantsStyles;
};

// Update /system/styled/#api in case if this changes
function shouldForwardProp(prop) {
  return prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as';
}
const systemDefaultTheme = createTheme$1();
const lowercaseFirstLetter = string => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};
function resolveTheme({
  defaultTheme,
  theme,
  themeId
}) {
  return isEmpty(theme) ? defaultTheme : theme[themeId] || theme;
}
function createStyled(input = {}) {
  const {
    themeId,
    defaultTheme = systemDefaultTheme,
    rootShouldForwardProp = shouldForwardProp,
    slotShouldForwardProp = shouldForwardProp
  } = input;
  const systemSx = props => {
    return styleFunctionSx$1(_extends({}, props, {
      theme: resolveTheme(_extends({}, props, {
        defaultTheme,
        themeId
      }))
    }));
  };
  systemSx.__mui_systemSx = true;
  return (tag, inputOptions = {}) => {
    // Filter out the `sx` style function from the previous styled component to prevent unnecessary styles generated by the composite components.
    internal_processStyles(tag, styles => styles.filter(style => !(style != null && style.__mui_systemSx)));
    const {
        name: componentName,
        slot: componentSlot,
        skipVariantsResolver: inputSkipVariantsResolver,
        skipSx: inputSkipSx,
        overridesResolver
      } = inputOptions,
      options = _objectWithoutPropertiesLoose(inputOptions, _excluded$5);

    // if skipVariantsResolver option is defined, take the value, otherwise, true for root and false for other slots.
    const skipVariantsResolver = inputSkipVariantsResolver !== undefined ? inputSkipVariantsResolver : componentSlot && componentSlot !== 'Root' || false;
    const skipSx = inputSkipSx || false;
    let label;
    if (process.env.NODE_ENV !== 'production') {
      if (componentName) {
        label = `${componentName}-${lowercaseFirstLetter(componentSlot || 'Root')}`;
      }
    }
    let shouldForwardPropOption = shouldForwardProp;
    if (componentSlot === 'Root') {
      shouldForwardPropOption = rootShouldForwardProp;
    } else if (componentSlot) {
      // any other slot specified
      shouldForwardPropOption = slotShouldForwardProp;
    } else if (isStringTag(tag)) {
      // for string (html) tag, preserve the behavior in emotion & styled-components.
      shouldForwardPropOption = undefined;
    }
    const defaultStyledResolver = styled$2(tag, _extends({
      shouldForwardProp: shouldForwardPropOption,
      label
    }, options));
    const muiStyledResolver = (styleArg, ...expressions) => {
      const expressionsWithDefaultTheme = expressions ? expressions.map(stylesArg => {
        // On the server Emotion doesn't use React.forwardRef for creating components, so the created
        // component stays as a function. This condition makes sure that we do not interpolate functions
        // which are basically components used as a selectors.
        return typeof stylesArg === 'function' && stylesArg.__emotion_real !== stylesArg ? props => {
          return stylesArg(_extends({}, props, {
            theme: resolveTheme(_extends({}, props, {
              defaultTheme,
              themeId
            }))
          }));
        } : stylesArg;
      }) : [];
      let transformedStyleArg = styleArg;
      if (componentName && overridesResolver) {
        expressionsWithDefaultTheme.push(props => {
          const theme = resolveTheme(_extends({}, props, {
            defaultTheme,
            themeId
          }));
          const styleOverrides = getStyleOverrides(componentName, theme);
          if (styleOverrides) {
            const resolvedStyleOverrides = {};
            Object.entries(styleOverrides).forEach(([slotKey, slotStyle]) => {
              resolvedStyleOverrides[slotKey] = typeof slotStyle === 'function' ? slotStyle(_extends({}, props, {
                theme
              })) : slotStyle;
            });
            return overridesResolver(props, resolvedStyleOverrides);
          }
          return null;
        });
      }
      if (componentName && !skipVariantsResolver) {
        expressionsWithDefaultTheme.push(props => {
          const theme = resolveTheme(_extends({}, props, {
            defaultTheme,
            themeId
          }));
          return variantsResolver(props, getVariantStyles(componentName, theme), theme, componentName);
        });
      }
      if (!skipSx) {
        expressionsWithDefaultTheme.push(systemSx);
      }
      const numOfCustomFnsApplied = expressionsWithDefaultTheme.length - expressions.length;
      if (Array.isArray(styleArg) && numOfCustomFnsApplied > 0) {
        const placeholders = new Array(numOfCustomFnsApplied).fill('');
        // If the type is array, than we need to add placeholders in the template for the overrides, variants and the sx styles.
        transformedStyleArg = [...styleArg, ...placeholders];
        transformedStyleArg.raw = [...styleArg.raw, ...placeholders];
      } else if (typeof styleArg === 'function' &&
      // On the server Emotion doesn't use React.forwardRef for creating components, so the created
      // component stays as a function. This condition makes sure that we do not interpolate functions
      // which are basically components used as a selectors.
      styleArg.__emotion_real !== styleArg) {
        // If the type is function, we need to define the default theme.
        transformedStyleArg = props => styleArg(_extends({}, props, {
          theme: resolveTheme(_extends({}, props, {
            defaultTheme,
            themeId
          }))
        }));
      }
      const Component = defaultStyledResolver(transformedStyleArg, ...expressionsWithDefaultTheme);
      if (process.env.NODE_ENV !== 'production') {
        let displayName;
        if (componentName) {
          displayName = `${componentName}${componentSlot || ''}`;
        }
        if (displayName === undefined) {
          displayName = `Styled(${getDisplayName(tag)})`;
        }
        Component.displayName = displayName;
      }
      if (tag.muiName) {
        Component.muiName = tag.muiName;
      }
      return Component;
    };
    if (defaultStyledResolver.withConfig) {
      muiStyledResolver.withConfig = defaultStyledResolver.withConfig;
    }
    return muiStyledResolver;
  };
}

function getThemeProps(params) {
  const {
    theme,
    name,
    props
  } = params;
  if (!theme || !theme.components || !theme.components[name] || !theme.components[name].defaultProps) {
    return props;
  }
  return resolveProps(theme.components[name].defaultProps, props);
}

function useThemeProps$1({
  props,
  name,
  defaultTheme,
  themeId
}) {
  let theme = useTheme$1(defaultTheme);
  if (themeId) {
    theme = theme[themeId] || theme;
  }
  const mergedProps = getThemeProps({
    theme,
    name,
    props
  });
  return mergedProps;
}

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Returns a number whose value is limited to the given range.
 * @param {number} value The value to be clamped
 * @param {number} min The lower boundary of the output range
 * @param {number} max The upper boundary of the output range
 * @returns {number} A number in the range [min, max]
 */
function clamp(value, min = 0, max = 1) {
  if (process.env.NODE_ENV !== 'production') {
    if (value < min || value > max) {
      console.error(`MUI: The value provided ${value} is out of range [${min}, ${max}].`);
    }
  }
  return Math.min(Math.max(min, value), max);
}

/**
 * Converts a color from CSS hex format to CSS rgb format.
 * @param {string} color - Hex color, i.e. #nnn or #nnnnnn
 * @returns {string} A CSS rgb color string
 */
function hexToRgb(color) {
  color = color.slice(1);
  const re = new RegExp(`.{1,${color.length >= 6 ? 2 : 1}}`, 'g');
  let colors = color.match(re);
  if (colors && colors[0].length === 1) {
    colors = colors.map(n => n + n);
  }
  return colors ? `rgb${colors.length === 4 ? 'a' : ''}(${colors.map((n, index) => {
    return index < 3 ? parseInt(n, 16) : Math.round(parseInt(n, 16) / 255 * 1000) / 1000;
  }).join(', ')})` : '';
}

/**
 * Returns an object with the type and values of a color.
 *
 * Note: Does not support rgb % values.
 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @returns {object} - A MUI color object: {type: string, values: number[]}
 */
function decomposeColor(color) {
  // Idempotent
  if (color.type) {
    return color;
  }
  if (color.charAt(0) === '#') {
    return decomposeColor(hexToRgb(color));
  }
  const marker = color.indexOf('(');
  const type = color.substring(0, marker);
  if (['rgb', 'rgba', 'hsl', 'hsla', 'color'].indexOf(type) === -1) {
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: Unsupported \`${color}\` color.
The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().` : formatMuiErrorMessage(9, color));
  }
  let values = color.substring(marker + 1, color.length - 1);
  let colorSpace;
  if (type === 'color') {
    values = values.split(' ');
    colorSpace = values.shift();
    if (values.length === 4 && values[3].charAt(0) === '/') {
      values[3] = values[3].slice(1);
    }
    if (['srgb', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec-2020'].indexOf(colorSpace) === -1) {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: unsupported \`${colorSpace}\` color space.
The following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.` : formatMuiErrorMessage(10, colorSpace));
    }
  } else {
    values = values.split(',');
  }
  values = values.map(value => parseFloat(value));
  return {
    type,
    values,
    colorSpace
  };
}

/**
 * Converts a color object with type and values to a string.
 * @param {object} color - Decomposed color
 * @param {string} color.type - One of: 'rgb', 'rgba', 'hsl', 'hsla', 'color'
 * @param {array} color.values - [n,n,n] or [n,n,n,n]
 * @returns {string} A CSS color string
 */
function recomposeColor(color) {
  const {
    type,
    colorSpace
  } = color;
  let {
    values
  } = color;
  if (type.indexOf('rgb') !== -1) {
    // Only convert the first 3 values to int (i.e. not alpha)
    values = values.map((n, i) => i < 3 ? parseInt(n, 10) : n);
  } else if (type.indexOf('hsl') !== -1) {
    values[1] = `${values[1]}%`;
    values[2] = `${values[2]}%`;
  }
  if (type.indexOf('color') !== -1) {
    values = `${colorSpace} ${values.join(' ')}`;
  } else {
    values = `${values.join(', ')}`;
  }
  return `${type}(${values})`;
}

/**
 * Converts a color from hsl format to rgb format.
 * @param {string} color - HSL color values
 * @returns {string} rgb color values
 */
function hslToRgb(color) {
  color = decomposeColor(color);
  const {
    values
  } = color;
  const h = values[0];
  const s = values[1] / 100;
  const l = values[2] / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  let type = 'rgb';
  const rgb = [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  if (color.type === 'hsla') {
    type += 'a';
    rgb.push(values[3]);
  }
  return recomposeColor({
    type,
    values: rgb
  });
}
/**
 * The relative brightness of any point in a color space,
 * normalized to 0 for darkest black and 1 for lightest white.
 *
 * Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @returns {number} The relative brightness of the color in the range 0 - 1
 */
function getLuminance(color) {
  color = decomposeColor(color);
  let rgb = color.type === 'hsl' || color.type === 'hsla' ? decomposeColor(hslToRgb(color)).values : color.values;
  rgb = rgb.map(val => {
    if (color.type !== 'color') {
      val /= 255; // normalized
    }

    return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
  });

  // Truncate at 3 digits
  return Number((0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]).toFixed(3));
}

/**
 * Calculates the contrast ratio between two colors.
 *
 * Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 * @param {string} foreground - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
 * @param {string} background - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
 * @returns {number} A contrast ratio value in the range 0 - 21.
 */
function getContrastRatio(foreground, background) {
  const lumA = getLuminance(foreground);
  const lumB = getLuminance(background);
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

/**
 * Sets the absolute transparency of a color.
 * Any existing alpha values are overwritten.
 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @param {number} value - value to set the alpha channel to in the range 0 - 1
 * @returns {string} A CSS color string. Hex input values are returned as rgb
 */
function alpha(color, value) {
  color = decomposeColor(color);
  value = clamp(value);
  if (color.type === 'rgb' || color.type === 'hsl') {
    color.type += 'a';
  }
  if (color.type === 'color') {
    color.values[3] = `/${value}`;
  } else {
    color.values[3] = value;
  }
  return recomposeColor(color);
}

/**
 * Darkens a color.
 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @param {number} coefficient - multiplier in the range 0 - 1
 * @returns {string} A CSS color string. Hex input values are returned as rgb
 */
function darken(color, coefficient) {
  color = decomposeColor(color);
  coefficient = clamp(coefficient);
  if (color.type.indexOf('hsl') !== -1) {
    color.values[2] *= 1 - coefficient;
  } else if (color.type.indexOf('rgb') !== -1 || color.type.indexOf('color') !== -1) {
    for (let i = 0; i < 3; i += 1) {
      color.values[i] *= 1 - coefficient;
    }
  }
  return recomposeColor(color);
}

/**
 * Lightens a color.
 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
 * @param {number} coefficient - multiplier in the range 0 - 1
 * @returns {string} A CSS color string. Hex input values are returned as rgb
 */
function lighten(color, coefficient) {
  color = decomposeColor(color);
  coefficient = clamp(coefficient);
  if (color.type.indexOf('hsl') !== -1) {
    color.values[2] += (100 - color.values[2]) * coefficient;
  } else if (color.type.indexOf('rgb') !== -1) {
    for (let i = 0; i < 3; i += 1) {
      color.values[i] += (255 - color.values[i]) * coefficient;
    }
  } else if (color.type.indexOf('color') !== -1) {
    for (let i = 0; i < 3; i += 1) {
      color.values[i] += (1 - color.values[i]) * coefficient;
    }
  }
  return recomposeColor(color);
}

function createMixins(breakpoints, mixins) {
  return _extends({
    toolbar: {
      minHeight: 56,
      [breakpoints.up('xs')]: {
        '@media (orientation: landscape)': {
          minHeight: 48
        }
      },
      [breakpoints.up('sm')]: {
        minHeight: 64
      }
    }
  }, mixins);
}

const common = {
  black: '#000',
  white: '#fff'
};
var common$1 = common;

const grey = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  A100: '#f5f5f5',
  A200: '#eeeeee',
  A400: '#bdbdbd',
  A700: '#616161'
};
var grey$1 = grey;

const purple = {
  50: '#f3e5f5',
  100: '#e1bee7',
  200: '#ce93d8',
  300: '#ba68c8',
  400: '#ab47bc',
  500: '#9c27b0',
  600: '#8e24aa',
  700: '#7b1fa2',
  800: '#6a1b9a',
  900: '#4a148c',
  A100: '#ea80fc',
  A200: '#e040fb',
  A400: '#d500f9',
  A700: '#aa00ff'
};
var purple$1 = purple;

const red = {
  50: '#ffebee',
  100: '#ffcdd2',
  200: '#ef9a9a',
  300: '#e57373',
  400: '#ef5350',
  500: '#f44336',
  600: '#e53935',
  700: '#d32f2f',
  800: '#c62828',
  900: '#b71c1c',
  A100: '#ff8a80',
  A200: '#ff5252',
  A400: '#ff1744',
  A700: '#d50000'
};
var red$1 = red;

const orange = {
  50: '#fff3e0',
  100: '#ffe0b2',
  200: '#ffcc80',
  300: '#ffb74d',
  400: '#ffa726',
  500: '#ff9800',
  600: '#fb8c00',
  700: '#f57c00',
  800: '#ef6c00',
  900: '#e65100',
  A100: '#ffd180',
  A200: '#ffab40',
  A400: '#ff9100',
  A700: '#ff6d00'
};
var orange$1 = orange;

const blue = {
  50: '#e3f2fd',
  100: '#bbdefb',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#2196f3',
  600: '#1e88e5',
  700: '#1976d2',
  800: '#1565c0',
  900: '#0d47a1',
  A100: '#82b1ff',
  A200: '#448aff',
  A400: '#2979ff',
  A700: '#2962ff'
};
var blue$1 = blue;

const lightBlue = {
  50: '#e1f5fe',
  100: '#b3e5fc',
  200: '#81d4fa',
  300: '#4fc3f7',
  400: '#29b6f6',
  500: '#03a9f4',
  600: '#039be5',
  700: '#0288d1',
  800: '#0277bd',
  900: '#01579b',
  A100: '#80d8ff',
  A200: '#40c4ff',
  A400: '#00b0ff',
  A700: '#0091ea'
};
var lightBlue$1 = lightBlue;

const green = {
  50: '#e8f5e9',
  100: '#c8e6c9',
  200: '#a5d6a7',
  300: '#81c784',
  400: '#66bb6a',
  500: '#4caf50',
  600: '#43a047',
  700: '#388e3c',
  800: '#2e7d32',
  900: '#1b5e20',
  A100: '#b9f6ca',
  A200: '#69f0ae',
  A400: '#00e676',
  A700: '#00c853'
};
var green$1 = green;

const _excluded$4 = ["mode", "contrastThreshold", "tonalOffset"];
const light = {
  // The colors used to style the text.
  text: {
    // The most important text.
    primary: 'rgba(0, 0, 0, 0.87)',
    // Secondary text.
    secondary: 'rgba(0, 0, 0, 0.6)',
    // Disabled text have even lower visual prominence.
    disabled: 'rgba(0, 0, 0, 0.38)'
  },
  // The color used to divide different elements.
  divider: 'rgba(0, 0, 0, 0.12)',
  // The background colors used to style the surfaces.
  // Consistency between these values is important.
  background: {
    paper: common$1.white,
    default: common$1.white
  },
  // The colors used to style the action elements.
  action: {
    // The color of an active action like an icon button.
    active: 'rgba(0, 0, 0, 0.54)',
    // The color of an hovered action.
    hover: 'rgba(0, 0, 0, 0.04)',
    hoverOpacity: 0.04,
    // The color of a selected action.
    selected: 'rgba(0, 0, 0, 0.08)',
    selectedOpacity: 0.08,
    // The color of a disabled action.
    disabled: 'rgba(0, 0, 0, 0.26)',
    // The background color of a disabled action.
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(0, 0, 0, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12
  }
};
const dark = {
  text: {
    primary: common$1.white,
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
    icon: 'rgba(255, 255, 255, 0.5)'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  background: {
    paper: '#121212',
    default: '#121212'
  },
  action: {
    active: common$1.white,
    hover: 'rgba(255, 255, 255, 0.08)',
    hoverOpacity: 0.08,
    selected: 'rgba(255, 255, 255, 0.16)',
    selectedOpacity: 0.16,
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(255, 255, 255, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.24
  }
};
function addLightOrDark(intent, direction, shade, tonalOffset) {
  const tonalOffsetLight = tonalOffset.light || tonalOffset;
  const tonalOffsetDark = tonalOffset.dark || tonalOffset * 1.5;
  if (!intent[direction]) {
    if (intent.hasOwnProperty(shade)) {
      intent[direction] = intent[shade];
    } else if (direction === 'light') {
      intent.light = lighten(intent.main, tonalOffsetLight);
    } else if (direction === 'dark') {
      intent.dark = darken(intent.main, tonalOffsetDark);
    }
  }
}
function getDefaultPrimary(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: blue$1[200],
      light: blue$1[50],
      dark: blue$1[400]
    };
  }
  return {
    main: blue$1[700],
    light: blue$1[400],
    dark: blue$1[800]
  };
}
function getDefaultSecondary(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: purple$1[200],
      light: purple$1[50],
      dark: purple$1[400]
    };
  }
  return {
    main: purple$1[500],
    light: purple$1[300],
    dark: purple$1[700]
  };
}
function getDefaultError(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: red$1[500],
      light: red$1[300],
      dark: red$1[700]
    };
  }
  return {
    main: red$1[700],
    light: red$1[400],
    dark: red$1[800]
  };
}
function getDefaultInfo(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: lightBlue$1[400],
      light: lightBlue$1[300],
      dark: lightBlue$1[700]
    };
  }
  return {
    main: lightBlue$1[700],
    light: lightBlue$1[500],
    dark: lightBlue$1[900]
  };
}
function getDefaultSuccess(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: green$1[400],
      light: green$1[300],
      dark: green$1[700]
    };
  }
  return {
    main: green$1[800],
    light: green$1[500],
    dark: green$1[900]
  };
}
function getDefaultWarning(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: orange$1[400],
      light: orange$1[300],
      dark: orange$1[700]
    };
  }
  return {
    main: '#ed6c02',
    // closest to orange[800] that pass 3:1.
    light: orange$1[500],
    dark: orange$1[900]
  };
}
function createPalette(palette) {
  const {
      mode = 'light',
      contrastThreshold = 3,
      tonalOffset = 0.2
    } = palette,
    other = _objectWithoutPropertiesLoose(palette, _excluded$4);
  const primary = palette.primary || getDefaultPrimary(mode);
  const secondary = palette.secondary || getDefaultSecondary(mode);
  const error = palette.error || getDefaultError(mode);
  const info = palette.info || getDefaultInfo(mode);
  const success = palette.success || getDefaultSuccess(mode);
  const warning = palette.warning || getDefaultWarning(mode);

  // Use the same logic as
  // Bootstrap: https://github.com/twbs/bootstrap/blob/1d6e3710dd447de1a200f29e8fa521f8a0908f70/scss/_functions.scss#L59
  // and material-components-web https://github.com/material-components/material-components-web/blob/ac46b8863c4dab9fc22c4c662dc6bd1b65dd652f/packages/mdc-theme/_functions.scss#L54
  function getContrastText(background) {
    const contrastText = getContrastRatio(background, dark.text.primary) >= contrastThreshold ? dark.text.primary : light.text.primary;
    if (process.env.NODE_ENV !== 'production') {
      const contrast = getContrastRatio(background, contrastText);
      if (contrast < 3) {
        console.error([`MUI: The contrast ratio of ${contrast}:1 for ${contrastText} on ${background}`, 'falls below the WCAG recommended absolute minimum contrast ratio of 3:1.', 'https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast'].join('\n'));
      }
    }
    return contrastText;
  }
  const augmentColor = ({
    color,
    name,
    mainShade = 500,
    lightShade = 300,
    darkShade = 700
  }) => {
    color = _extends({}, color);
    if (!color.main && color[mainShade]) {
      color.main = color[mainShade];
    }
    if (!color.hasOwnProperty('main')) {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${name ? ` (${name})` : ''} provided to augmentColor(color) is invalid.
The color object needs to have a \`main\` property or a \`${mainShade}\` property.` : formatMuiErrorMessage(11, name ? ` (${name})` : '', mainShade));
    }
    if (typeof color.main !== 'string') {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${name ? ` (${name})` : ''} provided to augmentColor(color) is invalid.
\`color.main\` should be a string, but \`${JSON.stringify(color.main)}\` was provided instead.

Did you intend to use one of the following approaches?

import { green } from "@mui/material/colors";

const theme1 = createTheme({ palette: {
  primary: green,
} });

const theme2 = createTheme({ palette: {
  primary: { main: green[500] },
} });` : formatMuiErrorMessage(12, name ? ` (${name})` : '', JSON.stringify(color.main)));
    }
    addLightOrDark(color, 'light', lightShade, tonalOffset);
    addLightOrDark(color, 'dark', darkShade, tonalOffset);
    if (!color.contrastText) {
      color.contrastText = getContrastText(color.main);
    }
    return color;
  };
  const modes = {
    dark,
    light
  };
  if (process.env.NODE_ENV !== 'production') {
    if (!modes[mode]) {
      console.error(`MUI: The palette mode \`${mode}\` is not supported.`);
    }
  }
  const paletteOutput = deepmerge(_extends({
    // A collection of common colors.
    common: _extends({}, common$1),
    // prevent mutable object.
    // The palette mode, can be light or dark.
    mode,
    // The colors used to represent primary interface elements for a user.
    primary: augmentColor({
      color: primary,
      name: 'primary'
    }),
    // The colors used to represent secondary interface elements for a user.
    secondary: augmentColor({
      color: secondary,
      name: 'secondary',
      mainShade: 'A400',
      lightShade: 'A200',
      darkShade: 'A700'
    }),
    // The colors used to represent interface elements that the user should be made aware of.
    error: augmentColor({
      color: error,
      name: 'error'
    }),
    // The colors used to represent potentially dangerous actions or important messages.
    warning: augmentColor({
      color: warning,
      name: 'warning'
    }),
    // The colors used to present information to the user that is neutral and not necessarily important.
    info: augmentColor({
      color: info,
      name: 'info'
    }),
    // The colors used to indicate the successful completion of an action that user triggered.
    success: augmentColor({
      color: success,
      name: 'success'
    }),
    // The grey colors.
    grey: grey$1,
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold,
    // Takes a background color and returns the text color that maximizes the contrast.
    getContrastText,
    // Generate a rich color object.
    augmentColor,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset
  }, modes[mode]), other);
  return paletteOutput;
}

const _excluded$3 = ["fontFamily", "fontSize", "fontWeightLight", "fontWeightRegular", "fontWeightMedium", "fontWeightBold", "htmlFontSize", "allVariants", "pxToRem"];
function round(value) {
  return Math.round(value * 1e5) / 1e5;
}
const caseAllCaps = {
  textTransform: 'uppercase'
};
const defaultFontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';

/**
 * @see @link{https://m2.material.io/design/typography/the-type-system.html}
 * @see @link{https://m2.material.io/design/typography/understanding-typography.html}
 */
function createTypography(palette, typography) {
  const _ref = typeof typography === 'function' ? typography(palette) : typography,
    {
      fontFamily = defaultFontFamily,
      // The default font size of the Material Specification.
      fontSize = 14,
      // px
      fontWeightLight = 300,
      fontWeightRegular = 400,
      fontWeightMedium = 500,
      fontWeightBold = 700,
      // Tell MUI what's the font-size on the html element.
      // 16px is the default font-size used by browsers.
      htmlFontSize = 16,
      // Apply the CSS properties to all the variants.
      allVariants,
      pxToRem: pxToRem2
    } = _ref,
    other = _objectWithoutPropertiesLoose(_ref, _excluded$3);
  if (process.env.NODE_ENV !== 'production') {
    if (typeof fontSize !== 'number') {
      console.error('MUI: `fontSize` is required to be a number.');
    }
    if (typeof htmlFontSize !== 'number') {
      console.error('MUI: `htmlFontSize` is required to be a number.');
    }
  }
  const coef = fontSize / 14;
  const pxToRem = pxToRem2 || (size => `${size / htmlFontSize * coef}rem`);
  const buildVariant = (fontWeight, size, lineHeight, letterSpacing, casing) => _extends({
    fontFamily,
    fontWeight,
    fontSize: pxToRem(size),
    // Unitless following https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
    lineHeight
  }, fontFamily === defaultFontFamily ? {
    letterSpacing: `${round(letterSpacing / size)}em`
  } : {}, casing, allVariants);
  const variants = {
    h1: buildVariant(fontWeightLight, 96, 1.167, -1.5),
    h2: buildVariant(fontWeightLight, 60, 1.2, -0.5),
    h3: buildVariant(fontWeightRegular, 48, 1.167, 0),
    h4: buildVariant(fontWeightRegular, 34, 1.235, 0.25),
    h5: buildVariant(fontWeightRegular, 24, 1.334, 0),
    h6: buildVariant(fontWeightMedium, 20, 1.6, 0.15),
    subtitle1: buildVariant(fontWeightRegular, 16, 1.75, 0.15),
    subtitle2: buildVariant(fontWeightMedium, 14, 1.57, 0.1),
    body1: buildVariant(fontWeightRegular, 16, 1.5, 0.15),
    body2: buildVariant(fontWeightRegular, 14, 1.43, 0.15),
    button: buildVariant(fontWeightMedium, 14, 1.75, 0.4, caseAllCaps),
    caption: buildVariant(fontWeightRegular, 12, 1.66, 0.4),
    overline: buildVariant(fontWeightRegular, 12, 2.66, 1, caseAllCaps),
    inherit: {
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit'
    }
  };
  return deepmerge(_extends({
    htmlFontSize,
    pxToRem,
    fontFamily,
    fontSize,
    fontWeightLight,
    fontWeightRegular,
    fontWeightMedium,
    fontWeightBold
  }, variants), other, {
    clone: false // No need to clone deep
  });
}

const shadowKeyUmbraOpacity = 0.2;
const shadowKeyPenumbraOpacity = 0.14;
const shadowAmbientShadowOpacity = 0.12;
function createShadow(...px) {
  return [`${px[0]}px ${px[1]}px ${px[2]}px ${px[3]}px rgba(0,0,0,${shadowKeyUmbraOpacity})`, `${px[4]}px ${px[5]}px ${px[6]}px ${px[7]}px rgba(0,0,0,${shadowKeyPenumbraOpacity})`, `${px[8]}px ${px[9]}px ${px[10]}px ${px[11]}px rgba(0,0,0,${shadowAmbientShadowOpacity})`].join(',');
}

// Values from https://github.com/material-components/material-components-web/blob/be8747f94574669cb5e7add1a7c54fa41a89cec7/packages/mdc-elevation/_variables.scss
const shadows = ['none', createShadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), createShadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), createShadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), createShadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), createShadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), createShadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), createShadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), createShadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), createShadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), createShadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), createShadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), createShadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), createShadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), createShadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), createShadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), createShadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), createShadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), createShadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), createShadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), createShadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), createShadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), createShadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), createShadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), createShadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)];
var shadows$1 = shadows;

const _excluded$2 = ["duration", "easing", "delay"];
// Follow https://material.google.com/motion/duration-easing.html#duration-easing-natural-easing-curves
// to learn the context in which each easing should be used.
const easing = {
  // This is the most common easing curve.
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// Follow https://m2.material.io/guidelines/motion/duration-easing.html#duration-easing-common-durations
// to learn when use what timing
const duration = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195
};
function formatMs(milliseconds) {
  return `${Math.round(milliseconds)}ms`;
}
function getAutoHeightDuration(height) {
  if (!height) {
    return 0;
  }
  const constant = height / 36;

  // https://www.wolframalpha.com/input/?i=(4+%2B+15+*+(x+%2F+36+)+**+0.25+%2B+(x+%2F+36)+%2F+5)+*+10
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}
function createTransitions(inputTransitions) {
  const mergedEasing = _extends({}, easing, inputTransitions.easing);
  const mergedDuration = _extends({}, duration, inputTransitions.duration);
  const create = (props = ['all'], options = {}) => {
    const {
        duration: durationOption = mergedDuration.standard,
        easing: easingOption = mergedEasing.easeInOut,
        delay = 0
      } = options,
      other = _objectWithoutPropertiesLoose(options, _excluded$2);
    if (process.env.NODE_ENV !== 'production') {
      const isString = value => typeof value === 'string';
      // IE11 support, replace with Number.isNaN
      // eslint-disable-next-line no-restricted-globals
      const isNumber = value => !isNaN(parseFloat(value));
      if (!isString(props) && !Array.isArray(props)) {
        console.error('MUI: Argument "props" must be a string or Array.');
      }
      if (!isNumber(durationOption) && !isString(durationOption)) {
        console.error(`MUI: Argument "duration" must be a number or a string but found ${durationOption}.`);
      }
      if (!isString(easingOption)) {
        console.error('MUI: Argument "easing" must be a string.');
      }
      if (!isNumber(delay) && !isString(delay)) {
        console.error('MUI: Argument "delay" must be a number or a string.');
      }
      if (Object.keys(other).length !== 0) {
        console.error(`MUI: Unrecognized argument(s) [${Object.keys(other).join(',')}].`);
      }
    }
    return (Array.isArray(props) ? props : [props]).map(animatedProp => `${animatedProp} ${typeof durationOption === 'string' ? durationOption : formatMs(durationOption)} ${easingOption} ${typeof delay === 'string' ? delay : formatMs(delay)}`).join(',');
  };
  return _extends({
    getAutoHeightDuration,
    create
  }, inputTransitions, {
    easing: mergedEasing,
    duration: mergedDuration
  });
}

// like global values in the browser.
};


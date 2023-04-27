// layers base classes
import { Layer } from './layer';
import { LayerType, AggregationType, PredicateType, LevelType } from './constants';
import { ILayerData, ILinkDescription, IJoinedObjects, ILayerFeature } from './interfaces';

// layer types
import { LinesLayer } from './layer-lines';
import { PointsLayer } from './layer-points';
import { TrianglesLayer } from './layer-triangles';
import { BuildingsLayer } from './layer-buildings';
import { HeatmapLayer } from './layer-heatmap';

export class LayerManager {
    // Loaded layers
    protected _layers: Layer[] = [];
    protected _filterBbox: number[] = []; // minx, miny, maxx, maxy
    protected _filterKnotsUpdateCallback: any;
    protected _map: any;

    constructor(filterKnotsCallback: any | null = null, map: any) {
        this._filterKnotsUpdateCallback = filterKnotsCallback;
        this._map = map;
    }

    /**
     * Layers vector accessor
     * @returns {Layer[]} The array of layers
     */
    get layers(): Layer[] {
        return this._layers;
    }

    set filterBbox(bbox: number[]){

        this._filterKnotsUpdateCallback(bbox);

        this._filterBbox = bbox;

        for(const knot of this._map.knotManager.knots){
            knot.physicalLayer.mesh.setFiltered(bbox);
            for(const shader of knot.shaders){
                shader.setFiltered(knot.physicalLayer.mesh.filtered);
                if(shader.currentKnot != undefined){ // if layer is being rendered
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
    createLayer(layerInfo: ILayerData, centroid: number[] | Float32Array, features: ILayerFeature[]): Layer | null {
        // loaded layer
        let layer = null;
        // z order
        let zOrder = this._layers.length+1;

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
            this._layers.push(<Layer>layer);
        }

        // returns the layer
        return <Layer>layer;
    }

    getJoinedObjects(layer: Layer, linkDescription: ILinkDescription): IJoinedObjects | null{
        let targetLinkId: number = -1;
        let idCounter = 0;

        for(const joinedLayer of layer.joinedLayers){
            if(joinedLayer.abstract == linkDescription.abstract && joinedLayer.layerId == linkDescription.otherLayer && linkDescription.otherLevel == joinedLayer.otherLevel 
                && linkDescription.predicate == joinedLayer.predicate && linkDescription.thisLevel == joinedLayer.thisLevel){
                    targetLinkId = idCounter;
            }
            idCounter += 1;
        }

        if(targetLinkId == -1){
            return null;
        }
        
        for(const joinedObject of layer.joinedObjects){
            if(joinedObject.joinedLayerIndex == targetLinkId){
                return joinedObject;
            }
        }

        return null;
    }

    /**
     * Given a link scheme apply the aggregation functions described in aggregationScheme to recover abstract data
     * @param linkScheme 
     * @param aggregationScheme 
     */
    getAbstractDataFromLink(linkScheme: ILinkDescription[], aggregationScheme: AggregationType[]): number[] | null{
        
        if(linkScheme.length < 1){
            throw new Error("Can not get abstract data from link. Link scheme must have at least one element");
        }

        if(aggregationScheme.length != linkScheme.length){
            throw new Error("The aggregation scheme must have a function (or NONE) for each link in the link scheme");
        }

        let functionValues: number[] | null = null; // always in the coordinate level

        if(linkScheme[0].abstract == false){
            throw new Error("The first link in the link scheme must be between an abstract and physical layer");
        }

        for(let i = 0; i < linkScheme.length; i++){

            let left_side = this.searchByLayerId(linkScheme[i].thisLayer);

            if(left_side == null){
                throw new Error("Layer "+linkScheme[i].thisLayer+" not found while trying to get abstract data from the link");
            }

            if(linkScheme[i].abstract == true){
                let joinedObjects = this.getJoinedObjects(left_side, linkScheme[i]);

                if(joinedObjects == null){
                    throw new Error("Joined objects not found in "+linkScheme[i].thisLayer);
                }

                if(joinedObjects != null && joinedObjects.otherValues != undefined){
                    functionValues = [];

                    if(linkScheme[i].thisLevel == LevelType.COORDINATES || linkScheme[i].thisLevel == LevelType.COORDINATES3D){
                        for(const value of joinedObjects.otherValues){
                            functionValues.push(value);
                        }
                    }else if(linkScheme[i].thisLevel == LevelType.OBJECTS){ // distributing the values to the coordinates of the object

                        let coordsPerComp = left_side.mesh.getCoordsPerComp();

                        let distributedValues = [];

                        for(let j = 0; j < joinedObjects.otherValues.length; j++){

                            for(let k = 0; k < coordsPerComp[j]; k++){
                                distributedValues.push(joinedObjects.otherValues[j]);
                            }
                        }

                        functionValues = distributedValues;
                    }
                }
            }
            
            if(linkScheme[i].abstract == false){
                // inner aggregation (changing geometry levels inside the same layer)
                if(linkScheme[i].predicate == PredicateType.INNERAGG && functionValues != null && linkScheme[i].otherLevel != undefined && linkScheme[i].thisLevel != undefined){
                    functionValues = left_side.innerAggFunc(functionValues, <LevelType>linkScheme[i].otherLevel, <LevelType>linkScheme[i].thisLevel, aggregationScheme[i]);
                }else if(functionValues != null && linkScheme[i].otherLevel != undefined && linkScheme[i].thisLevel != undefined){ // sjoin with another physical layer
                    if(linkScheme[i].otherLayer == linkScheme[i].thisLayer){
                        throw new Error("Only the predicate INNERAGG can be used inside the context of the same layer");
                    }

                    let joinedObjects = this.getJoinedObjects(left_side, linkScheme[i]);

                    if(joinedObjects == null){
                        throw new Error("Joined objects not found in "+linkScheme[i].thisLayer);
                    }

                    if(joinedObjects != null && joinedObjects.otherIds != undefined && linkScheme[i].otherLayer != undefined){

                        let joinedFunctionValues = [];

                        let right_side = this.searchByLayerId(<string>linkScheme[i].otherLayer);

                        if(right_side == null){
                            throw new Error("Layer "+linkScheme[i].otherLayer+" not found while trying to get abstract data from the link");
                        }

                        for(let j = 0; j < joinedObjects.otherIds.length; j++){
                            let idList = joinedObjects.otherIds[j];

                            if(idList == null){
                                joinedFunctionValues.push([null]);
                            }else{

                                let idsFuncValues: number[] = [];

                                for(const id of idList){
                                    let functionIndex = right_side.getFunctionValueIndexOfId(id, <LevelType>linkScheme[i].otherLevel);
                                    
                                    if(functionIndex == null){
                                        throw Error("Function index not found");
                                    }

                                    idsFuncValues.push(functionValues[functionIndex]);

                                }

                                joinedFunctionValues.push(idsFuncValues);
                            }

                        }

                        let aggregatedValues = [];

                        // aggregate values
                        for(let j = 0; j < joinedFunctionValues.length; j++){
                            if(joinedFunctionValues[j][0] != null){

                                if(aggregationScheme[i] == AggregationType.MAX){
                                    aggregatedValues.push(Math.max(...<number[]>joinedFunctionValues[j]));
                                }else if(aggregationScheme[i] == AggregationType.MIN){
                                    aggregatedValues.push(Math.min(...<number[]>joinedFunctionValues[j]));
                                }else if(aggregationScheme[i] == AggregationType.AVG){
                                    let sum = (<number[]>joinedFunctionValues[j]).reduce((partialSum: number, value: number) => partialSum + value, 0);
                                    aggregatedValues.push(sum/joinedFunctionValues[j].length);
                                }else if(aggregationScheme[i] == AggregationType.SUM){
                                    aggregatedValues.push((<number[]>joinedFunctionValues[j]).reduce((partialSum: number, value: number) => partialSum + value, 0));
                                }else if(aggregationScheme[i] == AggregationType.COUNT){
                                    aggregatedValues.push((<number[]>joinedFunctionValues[j]).length);
                                }else if(aggregationScheme[i] == AggregationType.NONE){
                                    throw new Error('NONE aggregation cannot be used with when linking two physical layers');
                                }
                            }else{
                                aggregatedValues.push(0); // TODO: which value to use with null joins?
                            }
                        }

                        let distributedValues = [];

                        let groupedDistributedValues: number[][] = [];

                        if(linkScheme[i].thisLevel == LevelType.COORDINATES || linkScheme[i].thisLevel == LevelType.COORDINATES3D){
                            distributedValues = aggregatedValues;
                        }else if(linkScheme[i].thisLevel == LevelType.OBJECTS){
                            let coordsPerComp = left_side.mesh.getCoordsPerComp();

                            for(let j = 0; j < aggregatedValues.length; j++){
                                groupedDistributedValues.push([]);
                                for(let k = 0; k < coordsPerComp[j]; k++){
                                    groupedDistributedValues[groupedDistributedValues.length-1].push(aggregatedValues[j]);
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

    searchByLayerInfo(layerInfo: ILayerData): Layer | null {
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

    searchByLayerId(layerId: string): Layer | null {
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

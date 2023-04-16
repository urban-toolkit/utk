import { BuildingsLayer } from './layer-buildings';
import {cross, normalize, dot} from './utils';

const params = require('../../../pythonServerConfig.json');

export class ImpactViewManager {

    constructor() {
    }
        
    createPlane(height: number, bbox: number[]){

        let nodes = [bbox[0], bbox[3], height, bbox[0], bbox[1], height, bbox[2], bbox[1], height, bbox[2], bbox[3], height];

        let v1 = [nodes[3] - nodes[0], nodes[4] - nodes[1], nodes[5] - nodes[2]];
        let v2 = [nodes[6] - nodes[0], nodes[7] - nodes[1], nodes[8] - nodes[2]];

        let surfaceNormal = normalize(cross(v1,v2));

        return {'surfaceNormal': surfaceNormal, 'nodes': nodes}
    }

    getCoordinatesById(cellIdsByCoordinates: number[][], idsLength: number){

        let coordinatesById = new Array(idsLength);

        // builds the array of coordinates per cell id
        let coordinateIndexOffset = 0;
        for(let i = 0; i < cellIdsByCoordinates.length; i++){
            let compElement = cellIdsByCoordinates[i];
            for(let j = 0; j < compElement.length; j++){
                if(!coordinatesById[compElement[j]]){
                    coordinatesById[compElement[j]] = [];
                }
       
                coordinatesById[compElement[j]].push(coordinateIndexOffset+j);
            }
            coordinateIndexOffset += compElement.length;
        }

        return coordinatesById;
    }

    avgPoints(indicesPoints: number[], coords: number[]){
        let avgX = 0;
        let avgY = 0;
        let avgZ = 0;

        for(let i = 0; i < indicesPoints.length; i++){
            let coordinateIndex = indicesPoints[i];

            avgX += coords[coordinateIndex*3];
            avgY += coords[coordinateIndex*3+1];
            avgZ += coords[coordinateIndex*3+2];
        }

        avgX /= indicesPoints.length;
        avgY /= indicesPoints.length;
        avgZ /= indicesPoints.length;

        return [avgX, avgY, avgZ];
    }

    calculateImpactViewData(buildingsLayer: BuildingsLayer, knotId: string){

        let buildingsMesh = buildingsLayer.mesh;

        let coordinates = buildingsMesh.getCoordinatesVBO();

        let cellIdsByCoordinates = buildingsMesh.getIdsCoordinates();
        let idsLength = buildingsMesh.idsLength();
        let coordinatesById = this.getCoordinatesById(cellIdsByCoordinates, idsLength);

        let functions = buildingsMesh.getFunctionVBO(knotId)[0];

        let maxBuildingHeight = -1;

        let minLat = null;
        let minLong = null;
        let maxLat = null;
        let maxLong = null;

        for(let i = 0; i < coordinates.length/3; i++){
            if(coordinates[i*3+2] > maxBuildingHeight){
                maxBuildingHeight = coordinates[i*3+2];
            }
            
            if(minLat == null || coordinates[i*3] < minLat){
                minLat = coordinates[i*3];
            }

            if(minLong == null || coordinates[i*3+1] < minLong){
                minLong = coordinates[i*3+1];
            }

            if(maxLat == null || coordinates[i*3] > maxLat){
                maxLat = coordinates[i*3];
            }

            if(maxLong == null || coordinates[i*3+1] > maxLong){
                maxLong = coordinates[i*3+1];
            }
        }

        let planes = [];
        let positionToValueMapping: any = {};

        // creating a plane every 5 meters (starting at 5 meters)
        for(let i = 0; i < maxBuildingHeight; i += 5){
            planes.push(this.createPlane(i, [<number>minLat, <number>minLong, <number>maxLat, <number>maxLong]));
        }

        console.log("minLat", minLat);
        console.log("minLong", minLong);
        console.log("maxLat", maxLat);
        console.log("maxLong", maxLong);
        console.log("coordinates", coordinates);

        for(let i = 0; i < planes.length; i++){
            
            let nodes = planes[i]['nodes'];
            let surfaceNormal = planes[i]['surfaceNormal'];
            
            let latitude = -1; 
            let longitude = -1;
            let height = -1;
            let value = -1;

            for(const cellCoordinates of coordinatesById){

                if(cellCoordinates == undefined){
                    continue;
                }

                // for a cell to intersect a plane it needs to have at least one point in each side of the plane and be in the range of the plane
                let above = false;
                let under = false;
                // let inRange = false;
            
                for(let i = 0; i < cellCoordinates.length; i++){
                    let coordIndex = cellCoordinates[i];
    
                    let x = coordinates[coordIndex*3]; 
                    let y = coordinates[coordIndex*3+1]; 
                    let z = coordinates[coordIndex*3+2]; 
    
                    let p0p = [x - nodes[0], y - nodes[1], z - nodes[2]]; // vector from a point in the plane to the analyzed point
    
                    let dotProduct = dot(surfaceNormal, p0p);
    
                    if(dotProduct > 0){
                        above = true;
                    }else if(dotProduct < 0){
                        under = true;
                    }else{ // the point lies on the plane, no need to check other points
                        above = true;
                        under = true;
                        break;
                    }
    
                }
    
                if(above && under){
                    let centroid = this.avgPoints(cellCoordinates, coordinates);
    
                    latitude = centroid[0]+buildingsLayer.centroid[0];
                    longitude = centroid[1]+buildingsLayer.centroid[1];
                    height = nodes[2]; // surface height (projecting the centroid)
                    value = functions[cellCoordinates[0]];
                
                    if(positionToValueMapping[latitude] != undefined){
                        if(positionToValueMapping[longitude] != undefined){
                            positionToValueMapping[latitude][longitude][height] = value;
                        }else{
                            positionToValueMapping[latitude][longitude] = {};
                            positionToValueMapping[latitude][longitude][height] = value;
                        }
                    }else{
                        positionToValueMapping[latitude] = {};
                        positionToValueMapping[latitude][longitude] = {};
                        positionToValueMapping[latitude][longitude][height] = value;
                    }
                }
            }
        }

        const url = "http://"+params.paramsPythonServer.environmentIP+":"+params.paramsPythonServer.port;

        const data = {"data": positionToValueMapping}

        fetch(url+"/writeImpactViewData", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .catch(error => {
            console.error('Request to write impact view data failed: ', error);
        });

    }
}

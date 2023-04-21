import { Environment } from './environment';
import { DataLoader } from './data-loader';

import { ICameraData, ILayerFeature, ILayerData, IMapStyle, IGrammar, IJoinedJson } from './interfaces';

export abstract class DataApi {
  /**
   * Load all layers
   * @param {string} index The layers index file
   */
  static async getMapData(index: string): Promise<IGrammar> {
    const url = `${Environment.backend}/${Environment.dataFolder}/${index}`;
    console.log(url);

    const datasets = await DataLoader.getJsonData(url);
    return <IGrammar> datasets;
  }

  /**
   * Load a custom style
   * @param {string} style The style file
   */
  static async getCustomStyle(style: string): Promise<IMapStyle> {
    const url = `${Environment.backend}/${Environment.dataFolder}/${style}.json`;
    console.log(url);

    const custom = <IMapStyle> await DataLoader.getJsonData(url);
    return <IMapStyle> custom;
  }

  /**
   * Load the camera
   * @param {string} camera The camera file
   */
  static async getCameraParameters(camera: string): Promise<ICameraData> {
    const url = `${Environment.backend}/${Environment.dataFolder}/${camera}.json`;
    console.log(url);

    const params = <ICameraData> await DataLoader.getJsonData(url);
    return params;
  }

  /**
   * Gets the layer data
   * @param {string} layerId the layer data
   */
  static async getLayer(layerId: string): Promise<ILayerData> {
    const url_base = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
    const url_coordinates = `${Environment.backend}/${Environment.dataFolder}/${layerId}_coordinates.data`;
    const url_indices = `${Environment.backend}/${Environment.dataFolder}/${layerId}_indices.data`;
    const url_normals = `${Environment.backend}/${Environment.dataFolder}/${layerId}_normals.data`;
    const url_ids = `${Environment.backend}/${Environment.dataFolder}/${layerId}_ids.data`;

    console.log(url_base);

    const base_feature = <ILayerData> await DataLoader.getJsonData(url_base);

    let coordinates;
    let indices;
    let normals;
    let ids;

    if(base_feature.data != undefined){

      if(base_feature.data[0].geometry.coordinates != undefined){
        console.log(url_coordinates);
        coordinates = <Float64Array> await DataLoader.getBinaryData(url_coordinates, 'd');
      }

      if(base_feature.data[0].geometry.indices != undefined){
        console.log(url_indices);
        indices = <Uint32Array> await DataLoader.getBinaryData(url_indices, 'I');
      }

      if(base_feature.data[0].geometry.normals != undefined){
        console.log(url_normals);
        normals = <Float32Array> await DataLoader.getBinaryData(url_normals, 'f');
      }

      if(base_feature.data[0].geometry.ids != undefined){
        console.log(url_ids);
        ids = <Uint32Array> await DataLoader.getBinaryData(url_ids, 'I');
      }

      for(let i = 0; i < base_feature.data.length; i++){

        if(coordinates != undefined){
          let startAndSize = base_feature.data[i].geometry.coordinates;
          base_feature.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(indices != undefined){
          let startAndSize = <number[]>base_feature.data[i].geometry.indices;
          base_feature.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(normals != undefined){
          let startAndSize = <number[]>base_feature.data[i].geometry.normals;
          base_feature.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(ids != undefined){
          let startAndSize = <number[]>base_feature.data[i].geometry.ids;
          base_feature.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

      }
    
    }

    console.log(base_feature);

    return base_feature;
  }


  /**
   * Gets the layer data
   * @param {string} layerId the layer data
   */
  static async getLayerFeature(layerId: string): Promise<ILayerFeature[]> {
    const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
    console.log(url);

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  /**
   * Gets the layer function
   * @param {string} layerId the layer data
   */
   static async getLayerFunction(layerId: string): Promise<ILayerFeature[]> {
    // TODO
    const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
    console.log(url);

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  /**
   * Gets the layer function
   * @param {string} layerId the layer data
   */
   static async getLayerHighlight(layerId: string): Promise<ILayerFeature[]> {
    // TODO
    const url = `${Environment.backend}/${Environment.dataFolder}/${layerId}.json`;
    console.log(url);

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  static async getJoinedJson(layerId: string){
    const url = `${Environment.backend}/${Environment.dataFolder}/${layerId+"_joined"}.json`;
    console.log(url);
    
    const joinedJson = <IJoinedJson> await DataLoader.getJsonData(url);
    return joinedJson;
  }

}

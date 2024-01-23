import { Environment } from './environment';
import { DataLoader } from './data-loader';

import { ICameraData, ILayerFeature, ILayerData, IMapStyle, IGrammar, IJoinedJson } from './interfaces';

export abstract class DataApi {
  /**
   * Load all layers
   * @param {string} index The layers index file
   */
  static async getMapData(index: string): Promise<IGrammar> {
    const url = `${Environment.backend}/files/${index}`;

    const datasets = await DataLoader.getJsonData(url);
    return <IGrammar> datasets;
  }

  /**
   * Load a custom style
   * @param {string} style The style file
   */
  static async getCustomStyle(style: string): Promise<IMapStyle> {
    const url = `${Environment.backend}/files/${style}.json`;

    const custom = <IMapStyle> await DataLoader.getJsonData(url);
    return <IMapStyle> custom;
  }

  /**
   * Load the camera
   * @param {string} camera The camera file
   */
  static async getCameraParameters(camera: string): Promise<ICameraData> {
    const url = `${Environment.backend}/files/${camera}.json`;

    const params = <ICameraData> await DataLoader.getJsonData(url);
    return params;
  }

  /**
   * Gets the layer data
   * @param {string} layerId the layer data
   */
  static async getLayer(layerId: string): Promise<ILayerData> {
    const url_base = `${Environment.backend}/files/${layerId}.json`;
    const url_coordinates = `${Environment.backend}/files/${layerId}_coordinates.data`;
    const url_indices = `${Environment.backend}/files/${layerId}_indices.data`;
    const url_normals = `${Environment.backend}/files/${layerId}_normals.data`;
    const url_ids = `${Environment.backend}/files/${layerId}_ids.data`;
    const url_utk_file = `${Environment.backend}/files/${layerId}.utk`;

    // const base_feature = <ILayerData> await DataLoader.getJsonData(url_base);
    const base_features_utk = <ILayerData> await DataLoader.getUtkData(url_utk_file);

    // console.log("Base Feature = ", base_feature);
    console.log("\n\nBase feature utk = ", base_features_utk);
    console.log("utk url = ", url_utk_file);
    
    
    

    let coordinates;
    let indices;
    let normals;
    let ids;

    if(base_features_utk.data != undefined){

      if(base_features_utk.data[0].geometry.coordinates != undefined){
        console.log(url_coordinates);
        coordinates = <Float64Array> await DataLoader.getBinaryData(url_coordinates, 'd');
      }

      if(base_features_utk.data[0].geometry.indices != undefined){
        console.log(url_indices);
        indices = <Uint32Array> await DataLoader.getBinaryData(url_indices, 'I');
      }

      if(base_features_utk.data[0].geometry.normals != undefined){
        console.log(url_normals);
        normals = <Float32Array> await DataLoader.getBinaryData(url_normals, 'f');
      }

      if(base_features_utk.data[0].geometry.ids != undefined){
        console.log(url_ids);
        ids = <Uint32Array> await DataLoader.getBinaryData(url_ids, 'I');
      }

      for(let i = 0; i < base_features_utk.data.length; i++){        

        if(coordinates != undefined){
          let startAndSize = base_features_utk.data[i].geometry.coordinates;
          // console.log("coordinate(original) - > ", startAndSize, '\nThis was present in -> ', base_feature.data);
          // base_feature.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_utk.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(indices != undefined){
          let startAndSize = <number[]>base_features_utk.data[i].geometry.indices;
          // base_feature.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_utk.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(normals != undefined){
          let startAndSize = <number[]>base_features_utk.data[i].geometry.normals;
          // base_feature.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_utk.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(ids != undefined){
          let startAndSize = <number[]>base_features_utk.data[i].geometry.ids;
          // base_feature.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_utk.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

      }
    
    }

    // console.log("base features after processing = \n", base_feature);
    
    console.log("base features utk after processing = \n\n", base_features_utk);
    

    return base_features_utk;
  }


  /**
   * Gets the layer data
   * @param {string} layerId the layer data
   */
  static async getLayerFeature(layerId: string): Promise<ILayerFeature[]> {
    const url = `${Environment.backend}/files/${layerId}.json`;

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  /**
   * Gets the layer function
   * @param {string} layerId the layer data
   */
   static async getLayerFunction(layerId: string): Promise<ILayerFeature[]> {
    // TODO
    const url = `${Environment.backend}/files/${layerId}.json`;

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  /**
   * Gets the layer function
   * @param {string} layerId the layer data
   */
   static async getLayerHighlight(layerId: string): Promise<ILayerFeature[]> {
    // TODO
    const url = `${Environment.backend}/files/${layerId}.json`;

    const feature = <ILayerFeature[]> await DataLoader.getJsonData(url);
    return feature;
  }

  static async getJoinedJson(layerId: string){
    const url = `${Environment.backend}/files/${layerId+"_joined"}.json`;
    
    const joinedJson = <IJoinedJson> await DataLoader.getJsonData(url);
    return joinedJson;
  }

}

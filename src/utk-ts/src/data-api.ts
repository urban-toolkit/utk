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
    // layerId = "buildings";
    const url_unified_data = `${Environment.backend}/files/${layerId}_blob.data`;

    const base_feature = <ILayerData> await DataLoader.getJsonData(url_base);
    // const base_features_utk = <ILayerData> await DataLoader.getUtkData(url_utk_file);

    const unified_utk_response = await DataLoader.getUnifiedUtkData(url_unified_data, url_utk_file);
    let base_features_unified;
    let raw_data_map;
    
    if(unified_utk_response != undefined){
      base_features_unified = unified_utk_response[0];
      raw_data_map = unified_utk_response[1];
    }

    console.log("base_features_unified = \n", base_features_unified);
    console.log("raw data map = ", raw_data_map);
    

    const utk_text_data = await DataLoader.getTextData(url_utk_file);

    const utk_metadata = utk_text_data.split('\n');
    console.log("url text data =\n", utk_metadata);
    
    let binary_metadata_length = parseInt(utk_metadata[1].split(",")[1]);
    console.log("binary metradata length = ", typeof(binary_metadata_length), binary_metadata_length);
    
    if(base_features_unified != null && base_features_unified != undefined){
      for(let i=2; i<=(1+binary_metadata_length); i++){
        // console.log("i = ", i, " reading ", utk_metadata[i]);
        const key = utk_metadata[i].split(",")[0];
        const value = utk_metadata[i].split(",")[1];

        if(key === 'visible' || key === 'selectable' || key === 'skip'){
          base_features_unified[key] = value === 'true';
          base_features_unified[key] = value === 'true';
        } else if(key === 'renderStyle'){
          const parsedList = JSON.parse(value.replace(/'/g, '"'));
          base_features_unified[key] = parsedList;
        } else{
          base_features_unified[key] = value.trim();
        }
      }
    }

    console.log("base_features_unified = \n", base_features_unified);
    

    // console.log("Base Feature = ", base_feature);
    // console.log("\n\nBase feature utk = ", base_features_utk);
    // console.log("\n\nutk url = ", url_utk_file);
    // console.log("\n\nunified data file = ", base_features_unified_data);
    

    let coordinates;
    let indices;
    let normals;
    let ids;

    if(raw_data_map != undefined){
      if('coordinates' in raw_data_map){
        coordinates = raw_data_map['coordinates'];
      }
      if('indices' in raw_data_map){
        indices = raw_data_map['indices'];
      }
      if('normals' in raw_data_map){
        normals = raw_data_map['normals'];
      }
      if('ids' in raw_data_map){
        ids = raw_data_map['ids'];
      }
    }

    // console.log("coordinates -> ", coordinates);
    // console.log("indices -> ", indices);
    // console.log("normals -> ", normals);
    // console.log("ids -> ", ids);


    if(base_features_unified != undefined && base_features_unified.data != undefined){

    //   if(base_features_utk.data[0].geometry.coordinates != undefined){
    //     console.log(url_coordinates);
    //     coordinates = <Float64Array> await DataLoader.getBinaryData(url_coordinates, 'd');
    //   }

    //   if(base_features_utk.data[0].geometry.indices != undefined){
    //     console.log(url_indices);
    //     indices = <Uint32Array> await DataLoader.getBinaryData(url_indices, 'I');
    //   }

    //   if(base_features_utk.data[0].geometry.normals != undefined){
    //     console.log(url_normals);
    //     normals = <Float32Array> await DataLoader.getBinaryData(url_normals, 'f');
    //   }

    //   if(base_features_utk.data[0].geometry.ids != undefined){
    //     console.log(url_ids);
    //     ids = <Uint32Array> await DataLoader.getBinaryData(url_ids, 'I');
    //   }

      for(let i = 0; i < base_features_unified.data.length; i++){        

        if(coordinates != undefined){
          let startAndSize = base_features_unified.data[i].geometry.coordinates;
          // console.log("coordinate(original) - > ", startAndSize, '\nThis was present in -> ', base_feature.data);
          // base_feature.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_unified.data[i].geometry.coordinates = Array.from(coordinates.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(indices != undefined){
          let startAndSize = <number[]>base_features_unified.data[i].geometry.indices;
          // base_feature.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_unified.data[i].geometry.indices = Array.from(indices.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(normals != undefined){
          let startAndSize = <number[]>base_features_unified.data[i].geometry.normals;
          // base_feature.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_unified.data[i].geometry.normals = Array.from(normals.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

        if(ids != undefined){
          let startAndSize = <number[]>base_features_unified.data[i].geometry.ids;
          // base_feature.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
          base_features_unified.data[i].geometry.ids = Array.from(ids.slice(startAndSize[0], startAndSize[0]+startAndSize[1]));
        }

      }
    
    }

    // // console.log("base features after processing = \n", base_feature);
    
    // console.log("base features utk after processing = \n\n", base_features_utk);
    

    // return base_features_utk;

    console.log("FINAL BASE FEATURE UNIFIED \n\n\n", base_features_unified);
    

    return <ILayerData> base_features_unified;
    
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

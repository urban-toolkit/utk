import { BuildingsLayer } from './layer-buildings';
import {ShaderAbstractSurface} from './shader-abstractSurface';
import { LevelType, InteractionType, PlotArrangementType, LayerType } from './constants';
import { TrianglesLayer } from './layer-triangles';

class KeyEvents {
  // div to attach the events
  private _map: any;

  private _embedSurfaceInteraction: boolean;
  private _embedFootInteraction: boolean
  private _highlightCellInteraction: boolean;
  private _highlightBuildingInteraction: boolean;
  private _highlightTriangleObject: boolean;
  private _interactionsCallback: any;
  private _interactionsCallbackArg: any;

  setMap(map: any): void{
    this._map = map;
  
    this._embedFootInteraction = false;
    this._highlightCellInteraction = false;
    this._highlightBuildingInteraction = false;
    this._embedSurfaceInteraction = false;
    this._highlightTriangleObject = false;
  }

  bindEvents(): void {
      // sets the key listeners
      window.addEventListener('keyup', this.keyUp.bind(this), false);
  }

  /**
  * Handles key up event
  * @param {KeyboardEvent} event The fired event
  */
  async keyUp(event: KeyboardEvent){

      // plot texture based of brush
      if(event.key == "Enter" && this._highlightCellInteraction && this._embedSurfaceInteraction){

        let absSurfacesImages: HTMLImageElement[] = [];

        for (const layer of this._map.layerManager.layers) {
            if (!layer.visible) { continue; } // only interact with visible layers
            if(layer instanceof BuildingsLayer){
                await layer.applyTexSelectedCells(this._map.glContext, this._map.grammarManager, 'vega');
                for(const shader of layer.shaders){
                    if(shader instanceof ShaderAbstractSurface){
                        absSurfacesImages = shader.getAbsSurfacesImages();
                    }
                }
            }
        }
        this._map.render();

      }

      // reset textures
      if(event.key == "r"){

          for (const layer of this._map.layerManager.layers) {
              if (!layer.visible) { continue; } // only interact with visible layers
              if(layer instanceof BuildingsLayer){
                  layer.clearAbsSurface();
              }
          }

          // clean highlighted buildings

          this._map.render();
      }

      // select a building to do the footprint plot
      if(event.key == "t"){

        if(this._highlightTriangleObject){
          let layersInteracted: TrianglesLayer[] = [];

          //triangles layer interactions
          for (const layer of this._map.layerManager.layers) {
            if (!layer.visible) { continue; } // only interact with visible layers
            
            if(layer instanceof TrianglesLayer){
              let currentPoint = this._map.mouse.currentPoint;
              layersInteracted.push(layer);
              layer.highlightElement(this._map.glContext, currentPoint[0], currentPoint[1]);
            }
          }

          this._map.render();
          this._map.render();

          for(let i = 0; i < layersInteracted.length; i++){
            let objectId = layersInteracted[i].getIdLastHighlightedElement();

            this._interactionsCallback(this._interactionsCallbackArg, layersInteracted[i].id, layersInteracted[i].knotId, LevelType.OBJECTS, objectId);
          }
        }

        // buildings interactions
        if(this._embedFootInteraction){

          let layersInteractedIds = [];
          let elementsIndex = [];

          for (const layer of this._map.layerManager.layers) {
              if (!layer.visible) { continue; } // only interact with visible layers
              if(layer instanceof BuildingsLayer){
                  let currentPoint = this._map.mouse.currentPoint;
                  layersInteractedIds.push(layer.id);
                  layer.createFootprintPlot(this._map.glContext, currentPoint[0], currentPoint[1], false);
                  this._map.render();
                  let buildingId = await layer.applyFootprintPlot(this._map.glContext, this._map.grammarManager, 1, 'vega');
                  elementsIndex.push(buildingId);
              }
          }
          this._map.render();

        }else if(this._highlightBuildingInteraction){

          let interactedLayer: BuildingsLayer | null = null;

          // call functions to highlight building
          for (const layer of this._map.layerManager.layers) {
              if (!layer.visible) { continue; } // only interact with visible layers
              if(layer instanceof BuildingsLayer){
                  let currentPoint = this._map.mouse.currentPoint;
                  layer.highlightBuilding(this._map.glContext, currentPoint[0], currentPoint[1]);
                  interactedLayer = layer;
              }
          }
          // the two renderings are required
          this._map.render();
          this._map.render();

          if(interactedLayer != null){
            let buildingId = interactedLayer.getIdLastHighlightedBuilding();

            this._interactionsCallback(this._interactionsCallbackArg, interactedLayer.id, interactedLayer.knotId, LevelType.OBJECTS, buildingId);
          }

        }
      }

      if(event.key == "q"){
        this._map.layerManager.filterBbox = []; // reset filter
        this._map.updateGrammarPlotsData();
        this._map.render();
      }

      // TODO: temporary impact view calculation trigger
      if(event.key == "i"){
        for (const layer of this._map.layerManager.layers) {
          if(layer instanceof BuildingsLayer){

            let knots = layer.mesh.getAttachedKnots();

            this._map.impactViewManager.calculateImpactViewData(layer, knots[0]); // TODO: temporarily assuming that there is only one knot attached
          }
      }
      }

      // // activates bird's eye view
      // if(event.key == "b"){
      //   this._map.activateBirdsEye();
      // }

  }

  setInteractionConfigBuildings(interactions: InteractionType[], plotArrangements: PlotArrangementType[]){

    this._embedFootInteraction = false;
    this._highlightCellInteraction = false;
    this._highlightBuildingInteraction = false;
    this._embedSurfaceInteraction = false;

    if(interactions.includes(InteractionType.BRUSHING) && plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED)){
      throw Error("Brushing interaction is not compatible with FOOT_EMBEDDED arrangement type");
    }

    if(interactions.includes(InteractionType.PICKING) && plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)){
      throw Error("Picking interaction is not compatible with SUR_EMBEDDED arrangement type");
    }

    if(plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED) && plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)){
      throw Error("FOOT_EMBEDDED and SUR_EMBEDDED cannot be used for the same layer");
    }

    if(interactions.includes(InteractionType.BRUSHING) && interactions.includes(InteractionType.PICKING)){
      throw Error("BRUSHING and PICKING interactions cannot be used at the same time for the same layer");
    }

    if(interactions.includes(InteractionType.BRUSHING)){
      this._highlightCellInteraction = true;

      if(plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)){
        this._embedSurfaceInteraction = true;
      }
    }

    if(interactions.includes(InteractionType.PICKING)){
      if(plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED)){
        this._embedFootInteraction = true;
      }

      if(plotArrangements.includes(PlotArrangementType.LINKED)){
        this._highlightBuildingInteraction = true;
      }

      if(plotArrangements.length == 0){
        this._highlightBuildingInteraction = true;
      }
    }

  }

  setInteractionConfigTriangles(interactions: InteractionType[], plotArrangements: PlotArrangementType[]){

    this._highlightTriangleObject = false;

    if(interactions.includes(InteractionType.BRUSHING)){
      throw Error("Brushing interaction is not supported for the triangles layer");
    }

    if(plotArrangements.includes(PlotArrangementType.SUR_EMBEDDED)){
      throw Error("SUR_EMBEDDED arrangement type is not supported for the triangles layer");
    }

    if(plotArrangements.includes(PlotArrangementType.FOOT_EMBEDDED)){
      throw Error("FOOT_EMBEDDED arrangement type is not supported for the triangles layer");
    }

    if(interactions.includes(InteractionType.PICKING)){
      this._highlightTriangleObject = true;
    }

  }

  /**
   * Set the callback called when any interaction is made with the physical layer
   */
  setInteractionsCallback(callbackFunction: any, arg: any){
      this._interactionsCallback = callbackFunction;
      this._interactionsCallbackArg = arg;
  }
}

export var KeyEventsFactory = (function(){

  var instance: KeyEvents;

  return {
    getInstance: function(){
        if (instance == null) {
            instance = new KeyEvents();
            instance.bindEvents();
        }
        return instance;
    }
  };

})();

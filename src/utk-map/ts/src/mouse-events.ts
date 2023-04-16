// import { MapView } from './mapview';
import { LevelType, MapViewStatu, InteractionType, PlotArrangementType } from './constants';
import { BuildingsLayer } from './layer-buildings';
import { TrianglesLayer } from './layer-triangles';

class MouseEvents {
  // div to attach the events
  private _map: any;

  // mouse movement control.
  private _status: MapViewStatu;
  private _lastPoint: number[];
  private _brushing: boolean; 
  private _brushingPivot: number[];
  private _brushingFilter: boolean; 
  private _brushingFilterPivot: number[];
  private _currentPoint: number[]; // tracks the cursor current point
  private _embedFootInteraction: boolean;
  private _highlightCellInteraction: boolean;
  private _highlightBuildingInteraction: boolean;
  private _embedSurfaceInteraction: boolean;
  private _highlightTriangleObject: boolean;
  private _interactionsCallback: any;
  private _interactionsCallbackArg: any;

  get lastPoint(): number[]{
      return this._lastPoint;
  }

  get currentPoint(): number[]{
    return this._currentPoint;
  }

  setMap(map: any): void {
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
    this._embedFootInteraction = false;
    this._highlightCellInteraction = false;
    this._highlightBuildingInteraction = false;
    this._embedSurfaceInteraction = false;
    this._highlightTriangleObject = false;
  }

  /**
   * Mouse events binding function
   */
  bindEvents(): void {
    // sets the canvas listeners
    this._map.canvas.addEventListener('wheel', this.mouseWheel.bind(this), false);
    this._map.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
    this._map.canvas.addEventListener('contextmenu', this.contextMenu.bind(this), false);
    this._map.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
  }

  oneTimeBind(): void{
    // sets the document listeners
    document.addEventListener('mouseup', this.mouseUp.bind(this), false);
  }

  /**
   * Handles mouse right click event
   * @param {MouseEvent} event The fired event
   */
  contextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    return;
  }

  /**
   * Handles mouse down event
   * @param {MouseEvent} event The fired event
   */
  mouseDown(event: MouseEvent): void {
    // captures the event.
    event.preventDefault();
    event.stopPropagation();

    let interactionHappened = false;

    if(event.button == 0 || event.button == 1){ // left click
      this._lastPoint = [event.offsetX, event.offsetY];

      if (event.ctrlKey) {
        // const x = event.offsetX;
        // const y = (this._map.canvas.height - event.offsetY);
  
        // mouseX and mouseY are in CSS pixels in display space 
        const rect = this._map.canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;
  
        for (const layer of this._map.layerManager.layers) {
          if (!layer.selectable) { continue; }
          layer.clearPicking();
          interactionHappened = true;
          if(this._highlightCellInteraction){
            layer.pick(this._map.glContext, mouseX, mouseY);
          }
        }
      } else {
        this._status = MapViewStatu.DRAG;
      }      
    }else if(event.button == 2){ // right click

      if(!event.altKey){
        for (const layer of this._map.layerManager.layers) {
          if (!layer.selectable) { continue; }
          layer.clearPicking();
          this._interactionsCallback(this._interactionsCallbackArg, layer.id, null, null, true);
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
  mouseMove(event: MouseEvent): void {
    // captures the event.
    event.preventDefault();
    event.stopPropagation();

    const rect = this._map.canvas.getBoundingClientRect();
    this._currentPoint[0] = event.clientX - rect.left;
    this._currentPoint[1] = event.clientY - rect.top;

    let interactionHappened = false;

    // left click drag
    if (this._status === MapViewStatu.DRAG) {

      if(event.altKey && this._highlightCellInteraction){

        let mouseX = this._currentPoint[0];
        let mouseY = this._currentPoint[1];

        if(!this._brushing){
  
          for (const layer of this._map.layerManager.layers) {
            if (!layer.selectable) { continue; }
            layer.pick(this._map.glContext, mouseX, mouseY, mouseX, mouseY);
            interactionHappened = true;
          }

          this._brushingPivot[0] = mouseX;
          this._brushingPivot[1] = mouseY;

          this._brushing = true;
        }else{

          for (const layer of this._map.layerManager.layers) {
            if (!layer.selectable) { continue; }

            layer.pick(this._map.glContext, mouseX, mouseY, this._brushingPivot[0], this._brushingPivot[1]);
            interactionHappened = true;
          }
        }

      }else{

        if(this._brushing){
          // brush ended, need to apply it
          for (const layer of this._map.layerManager.layers) {
            if (!layer.selectable) { continue; }
            if(layer instanceof BuildingsLayer){
              layer.applyBrushing();
              interactionHappened = true;
            }
          }
          this._brushing = false;
        }

        const dx = (-event.offsetX + this._lastPoint[0]);
        const dy = event.offsetY - this._lastPoint[1];
  
        if (event.buttons === 1 && event.shiftKey) { // left button
          this._map.camera.yaw(dx / this._map.canvas.clientWidth);
          this._map.camera.pitch(dy / this._map.canvas.clientHeight);
        } else {
          this._map.camera.translate(dx / this._map.canvas.clientWidth, dy / this._map.canvas.clientHeight);
        }
  
        this._lastPoint = [event.offsetX, event.offsetY];
      }

      this._map.render();

    }else{
      if(this._brushing){
        // brush ended, need to apply it
        for (const layer of this._map.layerManager.layers) {
          if (!layer.selectable) { continue; }
          if(layer instanceof BuildingsLayer){
            layer.applyBrushing();
            interactionHappened = true
          }
        }
        this._map.render();

      }
      this._brushing = false;
    }

    // right click drag
    if(this._status === MapViewStatu.DRAG_RIGHT){
      if(event.altKey){
        let mouseX = this._currentPoint[0];
        let mouseY = this._currentPoint[1];

        if(!this._brushingFilter){
  
          for (const layer of this._map.layerManager.layers) {
            if(layer instanceof BuildingsLayer || layer instanceof TrianglesLayer){
              layer.pickFilter(this._map.glContext, mouseX, mouseY, mouseX, mouseY);
            }
          }

          this._brushingFilterPivot[0] = mouseX;
          this._brushingFilterPivot[1] = mouseY;

          this._brushingFilter = true;
        }else{

          for (const layer of this._map.layerManager.layers) {
            if(layer instanceof BuildingsLayer || layer instanceof TrianglesLayer){
              layer.pickFilter(this._map.glContext, mouseX, mouseY, this._brushingFilterPivot[0], this._brushingFilterPivot[1]);
            }
          }
        }
      }else{
        if(this._brushingFilter){
          // // brush ended, need to apply it
          // for (const layer of this._map.layerManager.layers) {
          //   if (!layer.selectable) { continue; }
          //   layer.applyBrushingFilter();
          // }

          let largerBbox: (null | number)[] = [null, null, null, null];

          for (const layer of this._map.layerManager.layers) {
            if(layer instanceof BuildingsLayer || layer instanceof TrianglesLayer){
              let bbox = layer.getSelectedFiltering();
  
              if(bbox != null){
                if(largerBbox[0] == null){
                  largerBbox[0] = bbox[0];
                }else if(bbox[0] < largerBbox[0]){
                  largerBbox[0] = bbox[0];
                }
    
                if(largerBbox[1] == null){
                  largerBbox[1] = bbox[1];
                }else if(bbox[1] < largerBbox[1]){
                  largerBbox[1] = bbox[1];
                }
  
                if(largerBbox[2] == null){
                  largerBbox[2] = bbox[2];
                }else if(bbox[2] > largerBbox[2]){
                  largerBbox[2] = bbox[2];
                }
  
                if(largerBbox[3] == null){
                  largerBbox[3] = bbox[3];
                }else if(bbox[3] > largerBbox[3]){
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

    }else{
      if(this._brushingFilter){
        // // brush ended, need to apply it
        // for (const layer of this._map.layerManager.layers) {
        //   if (!layer.selectable) { continue; }
        //   layer.applyBrushingFilter();
        // }

        let largerBbox: (null | number)[] = [null, null, null, null];

        for (const layer of this._map.layerManager.layers) {
          if(layer instanceof BuildingsLayer || layer instanceof TrianglesLayer){
            let bbox = layer.getSelectedFiltering();

            if(bbox != null){
              if(largerBbox[0] == null){
                largerBbox[0] = bbox[0];
              }else if(bbox[0] < largerBbox[0]){
                largerBbox[0] = bbox[0];
              }
  
              if(largerBbox[1] == null){
                largerBbox[1] = bbox[1];
              }else if(bbox[1] < largerBbox[1]){
                largerBbox[1] = bbox[1];
              }

              if(largerBbox[2] == null){
                largerBbox[2] = bbox[2];
              }else if(bbox[2] > largerBbox[2]){
                largerBbox[2] = bbox[2];
              }

              if(largerBbox[3] == null){
                largerBbox[3] = bbox[3];
              }else if(bbox[3] > largerBbox[3]){
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
  mouseUp(event: MouseEvent): void {
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
  async mouseWheel(event: WheelEvent){
    // captures the event.
    event.preventDefault();
    event.stopPropagation();

    let interactionHappened = false;
        
    if(event.altKey && this._embedFootInteraction){
      for (const layer of this._map.layerManager.layers) {
        if (!layer.visible) { continue; } // only interact with visible layers
        if(layer instanceof BuildingsLayer){
            let currentPoint = this._currentPoint
            layer.createFootprintPlot(this._map.glContext, currentPoint[0], currentPoint[1], true);
            this._map.render();
            // await layer.updateFootprintPlot(this._map.glContext, this._map.d3Expec, -1, event.deltaY * 0.02, 'd3');
            await layer.updateFootprintPlot(this._map.glContext, this._map.grammarManager, -1, event.deltaY * 0.02, 'vega');
            interactionHappened = true
        }
      }
      this._map.render();

    }else{
      // changes the values
      const maxAxisLength = Math.max(this._map.canvas.clientWidth, this._map.canvas.clientHeight);
      const x = event.offsetX / maxAxisLength;
      const y = (this._map.canvas.height - event.offsetY) / maxAxisLength;
  
      this._map.camera.zoom(event.deltaY * 0.01, x, y);
      this._map.render();
    }

  }

  // addded. Creating custom interaction to be called from manually
  mouseWheelCustom(offsetX: number, offsetY: number, deltaY: number): void{
    // changes the values
    const maxAxisLength = Math.max(this._map.canvas.clientWidth, this._map.canvas.clientHeight);
    const x = offsetX / maxAxisLength;
    const y = (this._map.canvas.height - offsetY) / maxAxisLength;
    this._map.camera.zoom(deltaY * 0.01, x, y);
    this._map.render();
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

export var MouseEventsFactory = (function(){

  var instance: MouseEvents;

  return {
    getInstance: function(){
        if (instance == null) {
            instance = new MouseEvents();
            instance.oneTimeBind();
            // instance.constructor = null;
        }
        return instance;
    }
  };

})();
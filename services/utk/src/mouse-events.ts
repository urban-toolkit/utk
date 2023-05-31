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

    if(event.button == 0 || event.button == 1){ // left click
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

      } else {
        this._status = MapViewStatu.DRAG;
      }      
    }else if(event.button == 2){ // right click

      // right click - altKey
      if(!event.altKey){  
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
  mouseMove(event: MouseEvent): void {
    // captures the event.
    event.preventDefault();
    event.stopPropagation();

    const rect = this._map.canvas.getBoundingClientRect();
    this._currentPoint[0] = event.clientX - rect.left;
    this._currentPoint[1] = event.clientY - rect.top;

    // left click drag
    if (this._status === MapViewStatu.DRAG) {

      if(event.altKey){

        let mouseX = this._currentPoint[0];
        let mouseY = this._currentPoint[1];

        if(!this._brushing){
  
          // left click + drag + alt - brushing
          for (const knot of this._map.knotManager.knots) { 
            knot.interact(this._map.glContext, "left+drag+alt-brushing", [mouseX, mouseY], [mouseX, mouseY]);
          }

          this._brushingPivot[0] = mouseX;
          this._brushingPivot[1] = mouseY;

          this._brushing = true;
        }else{

          // left click + drag + alt + brushing
          for (const knot of this._map.knotManager.knots) { 
            knot.interact(this._map.glContext, "left+drag+alt+brushing", [mouseX, mouseY], [this._brushingPivot[0], this._brushingPivot[1]]);
          }
        }

      }else{

        if(this._brushing){
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
        } else {
          this._map.camera.translate(dx / this._map.canvas.clientWidth, dy / this._map.canvas.clientHeight);
        }
  
        this._lastPoint = [event.offsetX, event.offsetY];
      }

      this._map.render();

    }else{
      if(this._brushing){
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
    if(this._status === MapViewStatu.DRAG_RIGHT){
      if(event.altKey){
        let mouseX = this._currentPoint[0];
        let mouseY = this._currentPoint[1];

        if(!this._brushingFilter){
  
          // right click + drag - brushingFilter
          for (const knot of this._map.knotManager.knots) { 
            knot.interact(this._map.glContext, "right+drag-brushingFilter", [mouseX, mouseY], [mouseX, mouseY]);
          }

          this._brushingFilterPivot[0] = mouseX;
          this._brushingFilterPivot[1] = mouseY;

          this._brushingFilter = true;
        }else{
          // right click + drag + brushingFilter
          for (const knot of this._map.knotManager.knots) { 
            knot.interact(this._map.glContext, "right+drag+brushingFilter", [mouseX, mouseY], [this._brushingFilterPivot[0], this._brushingFilterPivot[1]]);
          }
        }
      }else{
        if(this._brushingFilter){

          let largerBbox: (null | number)[] = [null, null, null, null];

          for (const knot of this._map.knotManager.knots) {
            if(knot.physicalLayer instanceof BuildingsLayer || knot.physicalLayer instanceof TrianglesLayer){
              let bbox = knot.physicalLayer.getSelectedFiltering(knot.shaders);
  
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

        let largerBbox: (null | number)[] = [null, null, null, null];

        for (const knot of this._map.knotManager.knots) {
          if(knot.physicalLayer instanceof BuildingsLayer || knot.physicalLayer instanceof TrianglesLayer){
            let bbox = knot.physicalLayer.getSelectedFiltering(knot.shaders);

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

    if(event.altKey){
      // wheel + alt
      for (const knot of this._map.knotManager.knots) { 
        let currentPoint = this._currentPoint;
        knot.interact(this._map.glContext, "wheel+alt", [currentPoint[0], currentPoint[1]], null, event);
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
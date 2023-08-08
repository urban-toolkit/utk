class KeyEvents {
  // div to attach the events
  private _map: any;

  setMap(map: any): void{
    this._map = map;
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
      if(event.key == "Enter"){

        for (const knot of this._map.knotManager.knots) {
          knot.interact(this._map.glContext, "enter");  
        }

        this._map.render();

      }

      // clean abstract surfaces
      if(event.key == "r"){

          for (const knot of this._map.knotManager.knots) {
            knot.interact(this._map.glContext, "r");
          }

          this._map.render();
      }

      // select a building to do the footprint plot
      if(event.key == "t"){
        for (const knot of this._map.knotManager.knots) {
          knot.interact(this._map.glContext, "t", this._map.mouse.currentPoint);
        }
      }

      if(event.key == "q"){
        this._map.layerManager.filterBbox = []; // reset filter
        this._map.updateGrammarPlotsData();
        this._map.render();
      }

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

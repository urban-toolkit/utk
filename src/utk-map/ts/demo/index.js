import { Environment, DataLoader, MapView } from "../dist/urbantkmap.js";

class App {
  constructor(div) {
    const mapDiv = document.querySelector(div);
    this._map = new MapView(mapDiv);
  }

  run(data) {
    this._map.initMapView(data);
  }
}

let app = new App('#map');

// Data fromat example
// Environment.setEnvironment({backend: 'http://127.0.0.1:5500', dataFolder:'ts/demo/data/data_format'});
// const url = `${Environment.backend}/${Environment.dataFolder}/park_slope_no_buildings.json`;

// Refs Fromat example
// Environment.setEnvironment({backend: 'http://127.0.0.1:5500', dataFolder:'ts/demo/data/refs_format'});
// const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;

Environment.setEnvironment({backend: 'http://127.0.0.1:5501', dataFolder:'ts/demo/data/refs_format'});
// Environment.setEnvironment({backend: 'http://127.0.0.1:5501', dataFolder:'ts/demo/data/refs_nikiti'});
// const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;

// Environment.setEnvironment({backend: 'http://127.0.0.1:5501', dataFolder:'ts/demo/data/paper/SRTM/100x100'});
const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;

// Environment.setEnvironment({backend: 'http://127.0.0.1:5501', dataFolder:'ts/demo/data/paper/SRTM/50x50'});
// const url = `${Environment.backend}/${Environment.dataFolder}/index.json`;

console.log(url);

DataLoader.getJsonData(url).then(data => {
  app.run(data);
});


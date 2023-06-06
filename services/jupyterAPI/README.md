## jupyterAPI

This service is responsible for provinding a python API through Jupyter notebooks where it is possible to process data to feed UTK. Processing data includes retrieving and parsing data from external sources like OSM and parsing local files like WRF, CSV and GeoJSON. jupyterAPI will output the results to a folder inside `/data`. The outputs are:  

- `*.json` for thematic data. 
- `*_joined.json` for links. 
- `.json` for physical metadata.
- `.data` for physical data.

Examples of Jupyter notebooks that consume the API can be found under `/examples`. Copy the .ipynb files to `services/jupyterAPI` to run them using this service.

### docker-compose.yml

- The service is acessible through `localhost:8888`.
- `JUPYTER_TOKEN` defines the token used to access jupyter lab.

## API Reference

```python
import utk
```

### OSM

<a href="#osm_load" name="osm_load">#</a> utk.OSM.<b>load</b>(region, layers, pbf_filepath=None) · [Source](), [Examples]()  

Loads data from OpenStreetMap (OSM). 

- *region*: defines the area of the globe to load. Can be: a bounding box, a bounding polygon or the name of a place.
    - *bounding box*: list of 4 floats \[minLat, minLong, maxLat, maxLong\]. Example: [40.699768, -74.019904, 40.71135, -74.004712] 
    - *bounding polygon*: list of float tuples representing points (lat/long). Example: \[(40.7043056, -74.0206146), (40.7526203, -74.0118456), ..., (40.7041758, -74.0204001)\]
    - *name*: string. Example: "Central Park"
- *pbf_filepath*: instead of querying the OSM API data can be loaded from a locally stored PBF. If a Protocolbuffer Binary Format (PBF) file is provided, only *bounding box* can be used for *region*.  

Returns:  
- *UrbanComponent*

### UrbanComponent

<a href="#uc_save" name="uc_save">#</a> UrbanComponent.<b>save</b>(dir=None, includeGrammar=True) · [Source](), [Examples]()  

Save layers loaded into the UrbanComponent. Each layer generates a json file that describes the structure of the layer and a set of binary files with the data itself.

- *dir*: string defining the directory where the layer should be saved.
- *includeGrammar*: boolean that indicates if the grammar template should be generated.

<a href="#uc_setWorkDir" name="uc_setWorkDir">#</a> UrbanComponent.<b>setWorkDir</b>(dir) · [Source](), [Examples]()  

Define the work directory so it does not need to be specified in every call of functions that require it.

- *dir*: string defining the work directory.

<a href="#uc_view" name="uc_view">#</a> UrbanComponent.<b>view</b>() · [Source](), [Examples]()  

Opens the application in the web browser. It assumes that the server is already running. 

### data

<a href="#data_shadow" name="data_shadow">#</a> utk.data.<b>shadow</b>(layers, time_intervals) · [Source](), [Examples]()  

Simulates shadow casting accumulated over different time intervals.

- *layers*: list of strings with the filepaths of layers' .json that should be considered in the ray tracing.

Returns:
- *ShadowAccumulator*

### ShadowAccumulator

<a href="#shadow_save" name="shadow_save">#</a> ShadowAccumulator.<b>save</b>() · [Source](), [Examples]()  

Save the result of the shadow computation in the same folders of the input layers. Generates one file per layer. 
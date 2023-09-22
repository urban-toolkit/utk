## jupyterAPI

This service is responsible for provinding a python API through Jupyter notebooks where it is possible to process data to feed UTK. Processing data includes retrieving and parsing data from external sources like OSM and parsing local files like WRF, CSV and GeoJSON. jupyterAPI will output the results to a folder inside `/data`. The outputs are:  

- `*.json` for thematic data. 
- `*_joined.json` for links. 
- `.json` for physical metadata.
- `.data` for physical data.

Examples of Jupyter notebooks that consume the API can be found under `/examples`. Copy the .ipynb files to `services/jupyterAPI` to run them using this service.

## backend

The backend service is responsible for providing interfaces to access and manipulate the data stored in `/data`.  

The service provided by this container is centered in the `server.py` that exposes a number of routes:

- `/linkLayers`: process one step of an integration_scheme in the grammar. Generates `_joined.json` files describing the links.
- `/clearLinks`: clear all links created using `/linkLayers` (TODO: to be implemented).
- `/files/<path:path>` serve any file under `/data/DATA_FOLDER`.
- `/getGrammar` get the grammar under `/data/DATA_FOLDER`. (TODO: obsolete. Replace by `/files/grammar.json`).
- `/getLayer` get a .json layer under `/data/DATA_FOLDER`. (TODO: obsolete. Replace by `files/<path:path>`).
- `solveNominatim` solve nominatim using the Nominatim module of geopy.
- `/updateGrammar` updates the grammar under `/data/DATA_FOLDER`. (TODO: create a generic `/write_file/<path:path>`).

### docker-compose.yml

- The service is acessible through `localhost:8888`.
- `JUPYTER_TOKEN` defines the token used to access jupyter lab.

## API Reference

```python
import utk
```

### Physical layers

<a href="#physical_csv" name="physical_csv">#</a> utk.<b>physical_from_csv</b>(filepath, geometry_column='geometry', crs='4326', type='TRIANGLES_3D_LAYER', renderStyle=['FLAT_COLOR'], styleKey='surface') · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_physical.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)  

Creates a physical layer from a CSV file that contains one column in the Multipolygon or Polygon WKT format.

- *filepath*: location of .csv file
- *geometry_column*: string. Name of the column in the CSV file that contains the WKT geometries.
- *crs*: string. CRS projection code used in the geometry column.
- *renderStyle*: string[]. Indicates which shaders should be included in the layer. Possible values: 'FLAT_COLOR', 'FLAT_COLOR_MAP', 'FLAT_COLOR_POINTS', 'SMOOTH_COLOR', 'SMOOTH_COLOR_MAP', 'SMOOTH_COLOR_MAP_TEX', 'PICKING', 'ABSTRACT_SURFACES', 'COLOR_POINTS'
- *styleKey*: string. Defines the color of the layer when rendered. Possible values: 'land', 'roads', 'parks', 'water', 'sky', 'building',

<a href="#physical_geojson" name="physical_csv">#</a> utk.<b>physical_from_geojson</b>(filepath, bbox = None, renderStyle=['FLAT_COLOR'], styleKey='surface') · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_physical.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)  

Creates a physical layer from a GeoJSON file.

- *filepath*: location of .geojson file.
- *bbox*: list of 4 floats \[minLat, minLong, maxLat, maxLong\]. Example: [40.699768, -74.019904, 40.71135, -74.004712] 
- *renderStyle*: string[]. Indicates which shaders should be included in the layer. Possible values: 'FLAT_COLOR', 'FLAT_COLOR_MAP', 'FLAT_COLOR_POINTS', 'SMOOTH_COLOR', 'SMOOTH_COLOR_MAP', 'SMOOTH_COLOR_MAP_TEX', 'PICKING', 'ABSTRACT_SURFACES', 'COLOR_POINTS'.
- *styleKey*: string. Defines the color of the layer when rendered. Possible values: 'land', 'roads', 'parks', 'water', 'sky', 'building'.

<a href="#physical_shapefile" name="physical_csv">#</a> utk.<b>physical_from_shapefile</b>(filepath, layerName, bpoly=None, isBbox = False, renderStyle=['FLAT_COLOR'], styleKey='surface') · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_physical.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb) 

Creates a physical layer from a ShapeFile.

- *filepath*: location of .shp file. In the same folder as the .shp file there must be a .prj and .shx files
- *layerName*: string. Name of the layer.
- *bpoly*: defines the area of the globe to load. Can be: a bounding box or a bounding polygon.
    - *bounding box*: list of 4 floats \[minLat, minLong, maxLat, maxLong\]. Example: [40.699768, -74.019904, 40.71135, -74.004712] 
    - *bounding polygon*: list of float tuples representing points (lat/long). Example: \[(40.7043056, -74.0206146), (40.7526203, -74.0118456), ..., (40.7041758, -74.0204001)\]
- *renderStyle*: string[]. Indicates which shaders should be included in the layer. Possible values: 'FLAT_COLOR', 'FLAT_COLOR_MAP', 'FLAT_COLOR_POINTS', 'SMOOTH_COLOR', 'SMOOTH_COLOR_MAP', 'SMOOTH_COLOR_MAP_TEX', 'PICKING', 'ABSTRACT_SURFACES', 'COLOR_POINTS'.
- *styleKey*: string. Defines the color of the layer when rendered. Possible values: 'land', 'roads', 'parks', 'water', 'sky', 'building'.

<a href="#physical_npy" name="physical_npy">#</a> utk.<b>physical_from_npy</b>(filepath_coordinates, layer_id, center_around=[]) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_physical.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *filepath*: location of .npy file containing the coordinates.
- *layer_id*: string. Id of the layer.
- *center_around*: list of 3 float values. Is used to center all coordinates on the .npy file.

### Thematic layers

<a href="#thematic_df" name="thematic_df">#</a> utk.<b>thematic_from_df</b>(df, output_filepath, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_thematic.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *df*: dataframe used to build the layer.
- *output_filepath*: string. File path of the file that will be generated.
- *latitude_column*: string. Name of the column in the DataFrame that contains the latitude values.
- *longitude_column*: string. Name of the column in the DataFrame that contains the longitude values.
- *coordinates_projection*: string. Current CRS projection of the DataFrame.
- *z_column*: string or None. Name of the column in the DataFrame that contains the height values. If None is provided 0 will be assigned for all coordinates.
- *value_column*: string. Name of the column in the DataFrame that contains the thematic values.

<a href="#thematic_csv" name="thematic_csv">#</a> utk.<b>thematic_from_csv</b>(filepath, layer_id, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_thematic.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *filepath*: location of .csv file
- *layer_id*: string. Id of the layer.
- *latitude_column*: string. Name of the column in the CSV that contains the latitude values.
- *longitude_column*: string. Name of the column in the CSV that contains the longitude values.
- *coordinates_projection*: string. Current CRS projection of the CSV.
- *z_column*: string or None. Name of the column in the CSV that contains the height values. If None is provided 0 will be assigned for all coordinates.
- *value_column*: string. Name of the column in the CSV that contains the thematic values.

<a href="#thematic_netcdf" name="thematic_netcdf">#</a> utk.<b>thematic_from_netcdf</b>(filepath, layer_id, value_variable, latitude_variable, longitude_variable, coordinates_projection, timestep=None, bbox=[]) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_thematic.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *filepath*: location of .nc file
- *layer_id*: string. Id of the layer.
- *value_variable*: string. Name of the variable in the NetCDF file that contains the thematic values.
- *latitude_variable*: string. Name of the variable in the NetCDF file that contains the latitude values.
- *longitude_variable*: string. Name of the variable in the NetCDF file that contains the longitude values.
- *coordinates_projection*: string. Current CRS projection of the NetCDF.
- *timestep*: integer. Specifies the timeste if the NetCDF is divided by timesteps.
- *bbox*: list of 4 floats \[minLat, minLong, maxLat, maxLong\]. Example: [40.699768, -74.019904, 40.71135, -74.004712] 

<a href="#thematic_npy" name="thematic_npy">#</a> utk.<b>thematic_from_npy</b>(filepath_coordinates, filepath_values, layer_id, center_around=[]) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/load_thematic.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *filepath_coordinates*: location of .npy file containing the coordinates. The coordinates in .npy must have shape (n,3).
- *filepath_values*: location of .npy file containing the thematic values. Values in .npy can have shape (n,3) or be flat.
- *layer_id*: string. Id of the layer.
- *center_around*: list of 3 float values. Is used to center all coordinates on the .npy file.

### Removing elements from layers

<a href="#remove_elements" name="remove_elements">#</a> utk.<b>remove_elements</b>(filepath, ids) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/utk.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)

- *filepath*: location of .json for the physical layer.
- *ids*: integer list of elements to be removed from the physical layer.

### OSM

<a href="#osm_load" name="osm_load">#</a> utk.OSM.<b>load</b>(region, layers, pbf_filepath=None) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/osm.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)  

Loads data from OpenStreetMap (OSM). 

- *region*: defines the area of the globe to load. Can be: a bounding box, a bounding polygon or the name of a place.
    - *bounding box*: list of 4 floats \[minLat, minLong, maxLat, maxLong\]. Example: [40.699768, -74.019904, 40.71135, -74.004712] 
    - *bounding polygon*: list of float tuples representing points (lat/long). Example: \[(40.7043056, -74.0206146), (40.7526203, -74.0118456), ..., (40.7041758, -74.0204001)\]
    - *name*: string. Example: "Central Park"
- *layers*: string[]. Name of layers to load. Possible values: 'buildings', 'surface', 'parks', 'water', 'roads'
- *pbf_filepath*: instead of querying the OSM API data can be loaded from a locally stored PBF. If a Protocolbuffer Binary Format (PBF) file is provided, only *bounding box* can be used for *region*.  

Returns:  
- *UrbanComponent*

### UrbanComponent

<a href="#uc_save" name="uc_save">#</a> UrbanComponent.<b>save</b>(dir=None, includeGrammar=True) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/urban_component.py), [Examples](https://github.com/urban-toolkit/utk/blob/master/src/utk/test_utk_api.ipynb)  

Save layers loaded into the UrbanComponent. Each layer generates a json file that describes the structure of the layer and a set of binary files with the data itself.

- *dir*: string defining the directory where the layer should be saved.
- *includeGrammar*: boolean that indicates if the grammar template should be generated.

<a href="#uc_view" name="uc_view">#</a> UrbanComponent.<b>view</b>() · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/urban_component.py), [Examples]()  

Opens the application in the web browser. It assumes that the server is already running. 

### data

<a href="#data_shadow" name="data_shadow">#</a> utk.data.<b>shadow</b>(layers, time_intervals) · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/shadow_accumulator.py), [Examples](hhttps://github.com/urban-toolkit/utk/blob/master/examples/downtown_manhattan/data.ipynb)  

Simulates shadow casting accumulated over different time intervals.

- *layers*: list of strings with the filepaths of .json of the layers that should be considered in the ray tracing.
- *time_intervals*: string[][]. Several time intervals can be specified. Each time interval is a list containing two string elements in the format "mm/dd/yyyy hh:mm", the first element is the start timestamp and the last the ending.

Returns:
- *ShadowAccumulator*

### ShadowAccumulator

<a href="#shadow_save" name="shadow_save">#</a> ShadowAccumulator.<b>save</b>() · [Source](https://github.com/urban-toolkit/utk/blob/master/src/utk/shadow_accumulator.py), [Examples](hhttps://github.com/urban-toolkit/utk/blob/master/examples/downtown_manhattan/data.ipynb)  

Save the result of the shadow computation in the same folders of the input layers. Generates one file per layer. 


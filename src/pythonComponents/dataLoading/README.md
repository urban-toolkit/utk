## Physical


## Thematic

More about data formats [here](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/src/pythonComponents/dataLoading/layers_format.md).

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

<a href="#uc_setWorkDir" name="uc_setWorkDir">#</a> UrbanComponent.<b>setWorkDir</b>(dir) · [Source](), [Examples]()  

<a href="#uc_view" name="uc_view">#</a> UrbanComponent.<b>view</b>(dir) · [Source](), [Examples]()  

<a href="#uc_view" name="uc_view">#</a> UrbanComponent.<b>view</b>(dir) · [Source](), [Examples]()  

*To be implemented*

### data



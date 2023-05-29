import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

def convertProjections(inProj, outProj, geometry, dim2=True):
    '''
        Convert projections from inProj to outPorj. Both values can be anything accepted by pyproj.CRS.from_user_input(), such as an authority string (eg “EPSG:4326”) or a WKT string.
        The functions converts the geometries into a geodataframe to make the conversion faster using geopandas.

        *The input follows the x,y format. For instance, if the input projection 4326 a point [longitude, latitude] is expected*

        * @param {string} inProj The current projection of the geometry
        * @param {string} outProj The desired out projection for the geometry
        * @param {bool} Indicates if the geometry is represented by 2D points or 3D points
        * @returns {List} Returns a list with all geometries transformed
    '''
    # transform the flat array into a list of Points
    grouped_geometry = []

    index = 0
    offset = 1 if dim2 else 2
    while(index < len(geometry)-offset):
        if dim2:
            grouped_geometry.append(Point(geometry[index+1], geometry[index])) # must be long/lat
        else:
            grouped_geometry.append(Point(geometry[index+1], geometry[index], geometry[index+2])) # must be long/lat

        index += 2 if dim2 else 3

    df = pd.DataFrame(grouped_geometry)

    gdf = gpd.GeoDataFrame(df, geometry=0, crs=inProj)

    gdf = gdf.to_crs(outProj)   

    translatedGeometry = []

    for elem in gdf[0]:
        translatedGeometry.append(elem.x)
        translatedGeometry.append(elem.y)
        if not dim2:
            translatedGeometry.append(elem.z)

    return translatedGeometry

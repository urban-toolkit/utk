'''
    Generate mesh json file based on shapefile
'''

import geopandas as gpd
from shapely.geometry import Point
import json
import mapbox_earcut as earcut
import numpy as np
import pandas as pd
import os

def generateLayerFromShp(filepath, bbox, layerName, styleKey):
    '''
        In the same folder as the .shp file there must be a .prj and .shx files   

        The bounding box must be in the 4326 projection

        Only works for 2D geometries

        Returns gdf in 3395
    '''

    bbox_series_4326 = gpd.GeoSeries([Point(bbox[1], bbox[0]), Point(bbox[3], bbox[2])], crs=4326)
    
    loaded_shp = gpd.read_file(filepath, bbox=bbox_series_4326)

    bbox_series_4326 = bbox_series_4326.to_crs(3395)

    loaded_shp = loaded_shp.to_crs(3395)
    loaded_shp = loaded_shp.clip([bbox_series_4326[0].x, bbox_series_4326[0].y, bbox_series_4326[1].x, bbox_series_4326[1].y])

    data = []

    for row in loaded_shp.iloc:

        geometries = []
        if row['geometry'].geom_type == 'MultiPolygon':
            geometries = list(row['geometry'])
        elif row['geometry'].geom_type == 'Polygon':
            geometries = [row['geometry']]

        coordinates = []
        indices = []
        count = 0

        for geometry in geometries:
            points = np.array(geometry.exterior.coords[0:-1]) # remove last one (repeated)
            rings = np.array([len(points)])
            ind = earcut.triangulate_float64(points, rings)
            ind = (ind+count).tolist()
            indices += ind

            points = points.flatten().tolist()

            for i in range(0, len(points), 2):
                coordinates.append(points[i])
                coordinates.append(points[i+1])
                coordinates.append(0)

            count = int(len(coordinates)/3)
        
        data.append({
            "geometry": {
                "coordinates": coordinates.copy(),
                "indices": indices.copy()
            }
        })

    outputfile = os.path.join(os.path.dirname(filepath), layerName+'.json') 

    with open(outputfile, "w", encoding="utf-8") as f:
        
        result = {
            "id": layerName,
            "type": "TRIANGLES_3D_LAYER",
            "renderStyle": ["FLAT_COLOR"],
            "styleKey": styleKey,
            "visible": True,
            "selectable": False,
            "skip": False,
            "data": data
        }

        layer_json_str = str(json.dumps(result, indent=4))
        f.write(layer_json_str)

    return loaded_shp

# def attachZip(buildings_file, zip_shape, bbox):
#     '''
#         In the same folder as the .shp file there must be a .prj and .shx files   

#         The bounding box must be in the 4326 projection
#     '''

#     # bbox_series_4326 = gpd.GeoSeries([Point(bbox[0], bbox[1]), Point(bbox[2], bbox[3])], crs=4326)
#     bbox_series_4326 = gpd.GeoSeries([Point(bbox[1], bbox[0]), Point(bbox[3], bbox[2])], crs=4326)

#     shapefile = gpd.read_file(zip_shape, bbox=bbox_series_4326)

#     bbox_series_4326 = bbox_series_4326.to_crs(3395)

#     shapefile = shapefile.to_crs(3395)
#     shapefile = shapefile.clip([bbox_series_4326[0].x, bbox_series_4326[0].y, bbox_series_4326[1].x, bbox_series_4326[1].y])
#     # shapefile.plot()

#     file = open(buildings_file, mode='r')
#     file_content = json.loads(file.read())

#     footprints_geometries = []

#     for building_data in file_content['data']:
#         groupedCoordinates = []

#         sectionFootprint = building_data['geometry']['sectionFootprint'][0]

#         for i in range(0,int(len(sectionFootprint)/2)):
            
#             groupedCoordinates.append((sectionFootprint[i*2], sectionFootprint[i*2+1]))

#         footprints_geometries.append(Polygon(groupedCoordinates))

#     footprints_gdf = gpd.GeoDataFrame({'geometry': footprints_geometries}, crs=3395)

#     # print(footprints_gdf)

#     join_left_gdf = footprints_gdf.sjoin(shapefile, how='left')

#     # remove duplicate intersection by picking the first one    
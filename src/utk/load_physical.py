'''
    Given a csv file representing with a geometry column generates a mesh with coordinates and indices. The geometry column must be in the WKT format
'''

import os
import pandas as pd
import geopandas as gpd
import numpy as np
import json
import mapbox_earcut as earcut
import struct

from shapely.geometry import Point, Polygon
from pyproj import Transformer

def mesh_from_csv(filepath, geometry_column='geometry', crs='4326'):
    
    df = pd.read_csv(filepath)

    gdf = gpd.GeoDataFrame(df, geometry = geometry_column, crs = crs)

    mesh = mesh_from_gdf(gdf, crs)

    directory = os.path.dirname(filepath)
    file_name = os.path.basename(filepath)
    # file name without extension
    file_name_wo_extension = os.path.splitext(file_name)[0]

    break_into_binary(directory, file_name_wo_extension, mesh, ["coordinates", "indices"], ["d", "I"])

def mesh_from_geojson(filepath, bbox = None):

    gdf = gpd.read_file(filepath)

    if(bbox != None):
        gdf = gdf.cx[bbox[0]:bbox[2], bbox[1]:bbox[3]]

    mesh = mesh_from_gdf(gdf)

    directory = os.path.dirname(filepath)
    file_name = os.path.basename(filepath)
    # file name without extension
    file_name_wo_extension = os.path.splitext(file_name)[0]

    break_into_binary(directory, file_name_wo_extension, mesh, ["coordinates", "indices"], ["d", "I"])

def mesh_from_gdf(gdf):

    gdf_transformed = gdf.to_crs(3395)

    mesh = []

    for geometry in gdf_transformed.geometry:

        x, y = geometry.exterior.coords.xy

        nodes = list(zip(x,y))
        rings = [len(nodes)]

        indices = earcut.triangulate_float64(nodes, rings)

        nodes = np.array(nodes)

        nodes = nodes.flatten().tolist()
        indices = indices.tolist()

        nodes_3d = []

        for i in range(int(len(nodes)/2)):
            nodes_3d.append(nodes[i*2])
            nodes_3d.append(nodes[i*2+1])
            nodes_3d.append(0)

        mesh.append({'geometry': {'coordinates': [round(item,4) for item in nodes_3d], 'indices': indices}})

    return mesh

def layer_from_mesh(filepath, type, renderStyle, styleKey):

    file_name = os.path.basename(filepath)
    # file name without extension
    file_name_wo_extension = os.path.splitext(file_name)[0]

    file = open(filepath, 'r')

    data = json.load(file)

    file.close()

    layer = {
        "id": file_name_wo_extension,
        "type": type,
        "renderStyle": renderStyle,
        "styleKey": styleKey,
        "data": data
    }

    json_object = json.dumps(layer)

    with open(filepath, "w") as outfile:
        outfile.write(json_object)

def break_into_binary(filepath, filename, data, types, dataTypes):

    for index, type in enumerate(types):

        readCoords = 0

        floatList = []

        if('data' in data):
            for i in range(len(data['data'])):
                geometry = data['data'][i]['geometry']

                newValue = [readCoords, len(geometry[type])] # where this vector starts and its size

                readCoords += len(geometry[type])

                floatList += geometry[type].copy()

                geometry[type] = newValue
        else:
            for i in range(len(data)):
                geometry = data[i]['geometry']

                newValue = [readCoords, len(geometry[type])] # where this vector starts and its size

                readCoords += len(geometry[type])

                floatList += geometry[type].copy()

                geometry[type] = newValue

        fout = open(os.path.join(filepath,filename+'_'+type+'.data'), 'wb')

        buf = struct.pack(str(len(floatList))+dataTypes[index], *floatList)

        fout.write(buf)
        fout.close()

        json_object = json.dumps(data)

        with open(os.path.join(filepath,filename+".json"), "w") as outfile:
            outfile.write(json_object)

'''
    Generate mesh json file based on shapefile
'''
def layer_from_shapefile(filepath, bpoly, layerName, styleKey, isBbox = False):
    '''
        In the same folder as the .shp file there must be a .prj and .shx files   

        The bounding box must be in the 4326 projection

        Only works for 2D geometries

        Returns gdf in 3395
    '''

    if(isBbox):
        bbox_series_4326 = gpd.GeoSeries([Point(bpoly[1], bpoly[0]), Point(bpoly[3], bpoly[2])], crs=4326)
        
        loaded_shp = gpd.read_file(filepath, bbox=bbox_series_4326)

        bbox_series_4326 = bbox_series_4326.to_crs(3395)

        loaded_shp = loaded_shp.to_crs(3395)
        loaded_shp = loaded_shp.clip([bbox_series_4326[0].x, bbox_series_4326[0].y, bbox_series_4326[1].x, bbox_series_4326[1].y])
    else:
        bpoly_series_4326 = gpd.GeoSeries([Polygon(bpoly)], crs=4326)
        bpoly_series_4326 = bpoly_series_4326.to_crs(3395)

        loaded_shp = gpd.read_file(filepath)

        loaded_shp = loaded_shp.to_crs(3395)
        loaded_shp = loaded_shp.clip(bpoly_series_4326)

    zip_code_coordinates = []

    data = []
    objectId = []
    coordinates_geometries = []
    coordinates_ids = []
    coord_id_counter = 0

    for id, row in enumerate(loaded_shp.iloc):

        objectId.append(id)

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
                coordinates_geometries.append(Point(points[i], points[i+1]))
                coordinates_ids.append(coord_id_counter)
                coord_id_counter += 1
                coordinates.append(0)

            count = int(len(coordinates)/3)
        
        zip_code_coordinates += coordinates

        data.append({
            "geometry": {
                "coordinates": [round(item,4) for item in coordinates.copy()],
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
            "data": data
        }

        types = []
        dataTypes = []

        if('coordinates' in result['data'][0]['geometry']):
            types.append("coordinates")
            dataTypes.append("d")

        if('normals' in result['data'][0]['geometry']):
            types.append("normals")
            dataTypes.append("f")

        if('indices' in result['data'][0]['geometry']):
            types.append("indices")
            dataTypes.append("I")

        if('ids' in result['data'][0]['geometry']):
            types.append("ids")
            dataTypes.append("I")

        break_into_binary(os.path.dirname(filepath), layerName, result, types, dataTypes)

        layer_json_str = str(json.dumps(result))
        f.write(layer_json_str)

    loaded_shp['id'] = objectId

    coordinates_gdf = gpd.GeoDataFrame({'geometry': coordinates_geometries, "id": coordinates_ids}, crs=3395)

    return {'objects': loaded_shp, 'coordinates': coordinates_gdf, 'coordinates3d': None}
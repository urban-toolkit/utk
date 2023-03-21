'''
    Given a csv file representing with a geometry column generates a mesh with coordinates and indices. The geometry column must be in the WKT format
'''

import pandas as pd
import geopandas as gpd
from pyproj import Transformer
import numpy as np
import os
import json
import pyproj
import mapbox_earcut as earcut
import struct

def break_into_binary(filepath, filename, data, types, dataTypes):

    for index, type in enumerate(types):

        readCoords = 0

        floatList = []

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
        "visible": True,
        "selectable": True,
        "skip": False,
        "data": data
    }

    json_object = json.dumps(layer)

    with open(filepath, "w") as outfile:
        outfile.write(json_object)
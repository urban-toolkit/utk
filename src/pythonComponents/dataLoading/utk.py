import pandas as pd
from pyproj import Transformer
import os
import numpy as np
from netCDF4 import Dataset
import json
import os
import data

from osm import *
from urbanComponent import *
from load_physical import *
from load_thematic import *
from load_utk import *

def remove_elements(filepath, ids):
    file = open(filepath, mode='r')
    file_content = json.loads(file.read())

    new_data_array = []

    for index,data in enumerate(file_content['data']):
        if(index not in ids):
            new_data_array.append(data)

    file_content['data'] = new_data_array

    with open(filepath, "w") as outfile:
        json.dump(file_content, outfile)

    file.close()

'''
    Converts a wrf file into an abstract layer
'''
def wrf_to_abstract(filepath, layer_id, value_variable, latitude_variable, longitude_variable, coordinates_projection, timestep, bbox=[]):
    
    # Open the NetCDF file
    ncfile = Dataset(filepath)

    ## Data coords
    xlong = ncfile.variables[longitude_variable][timestep]
    xlat = ncfile.variables[latitude_variable][timestep]
    ## Data var
    temp = ncfile.variables[value_variable][timestep]

    mask_values = []

    for i in range(len(xlat)):
        mask_values.append([])
        for j in range(len(xlat[i])):
            mask_values[i].append(False)

    if(len(bbox) > 0):

        longmin, longmax = bbox[1], bbox[3]
        latmin, latmax = bbox[0], bbox[2]

        ## Mask coordinates according to bounds
        latmask=np.ma.masked_where(xlat<latmin,xlat).mask+np.ma.masked_where(xlat>latmax,xlat).mask
        lonmask=np.ma.masked_where(xlong<longmin,xlong).mask+np.ma.masked_where(xlong>longmax,xlat).mask

        totmask = lonmask + latmask
        ## Apply mask to data
        temp_masked = np.ma.masked_where(totmask,temp)
        ## plot masked data

        mask_values = np.ma.getmask(temp_masked)

    coordinates = []
    values = []
    points = []

    transformer = Transformer.from_crs(coordinates_projection, 3395)

    for i, line in enumerate(mask_values):
        for j, masked in enumerate(line):
            if(not masked): # not masked

                points.append((xlat[i][j], xlong[i][j]))

                values.append(float(temp[i][j]))

    for point in transformer.itransform(points):

        coordinates.append(float(point[0]))
        coordinates.append(float(point[1]))
        coordinates.append(0)

    abstract_json = {
        "id": layer_id,
        "coordinates": coordinates,
        "values": values
    }

    json_object = json.dumps(abstract_json)

    directory = os.path.dirname(filepath)

    with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
        outfile.write(json_object)

'''
    coordinates is flattened x,y,z
    center_around is [x,y,z]
'''
def center_coordinates_around(coordinates, center_around, scale_up = 1):
    xmin = None
    xmax = None
    ymin = None
    ymax = None
    zmin = None
    zmax = None

    for i in range(int(len(coordinates)/3)):
        
        if(xmin == None or coordinates[i*3] < xmin):
            xmin = coordinates[i*3]

        if(xmax == None or coordinates[i*3] > xmax):
            xmax = coordinates[i*3]

        if(ymin == None or coordinates[i*3+1] < ymin):
            ymin = coordinates[i*3+1]

        if(ymax == None or coordinates[i*3+1] > ymax):
            ymax = coordinates[i*3+1]

        if(zmin == None or coordinates[i*3+2] < zmin):
            zmin = coordinates[i*3+2]

        if(zmax == None or coordinates[i*3+2] > zmax):
            zmax = coordinates[i*3+2]

    current_center = [(xmin+xmax)/2, (ymin+ymax)/2, (zmin+zmax)/2]

    # centering data around 0
    for i in range(int(len(coordinates)/3)):
        coordinates[i*3] -= current_center[0]
        coordinates[i*3] *= scale_up # scalling objects up
        coordinates[i*3+1] -= current_center[1]
        coordinates[i*3+1] *= scale_up # scalling objects up
        coordinates[i*3+2] -= current_center[2]
        coordinates[i*3+2] *= scale_up # scalling objects up

    # center data around new center
    for i in range(int(len(coordinates)/3)):
        coordinates[i*3] += center_around[0]
        coordinates[i*3+1] += center_around[1]
        coordinates[i*3+2] += center_around[2]
        
    return coordinates

'''
    coordinates shape: (n,3)
    values shape: (n,3)
    Considers that coordinates do not have a coordinates system but are in meters
'''
def binary_np_to_thematic(filepath_coordinates, filepath_values, layer_id, center_around=[]):

    coordinates = np.load(filepath_coordinates)
    values = np.load(filepath_values)

    coordinates = coordinates.flatten()

    if(len(center_around) > 0):
        coordinates = center_coordinates_around(coordinates, center_around)

    abstract_json = {
        "id": layer_id,
        "coordinates": coordinates.tolist(),
        "values": values.tolist()
    }

    json_object = json.dumps(abstract_json)
    
    directory = os.path.dirname(filepath_coordinates)

    with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
        outfile.write(json_object)

'''
    Considers that coordinates do not have a coordinates system but are in meters
'''
def binary_np_to_point_cloud(filepath_coordinates, layer_id, center_around=[]):
        
    coordinates = np.load(filepath_coordinates)
    coordinates = coordinates.flatten()
    
    if(len(center_around) > 0):
        coordinates = center_coordinates_around(coordinates, center_around)

    layer = {
        "id": layer_id,
        "type": "POINTS_LAYER",
        "renderStyle": ["FLAT_COLOR_POINTS"],
        "styleKey": "building",
        "data": [{'geometry': {'coordinates': [round(item,4) for item in coordinates]}}]
    }

    break_into_binary(os.path.dirname(filepath_coordinates), layer_id, layer, ["coordinates"], ["d"])

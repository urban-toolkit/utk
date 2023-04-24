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



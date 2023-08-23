from pyproj import Transformer
import pandas as pd
import os
import json
from netCDF4 import Dataset
import numpy as np
from .utils import *

'''
    Converts a dataframe into an abstract layer
'''
def thematic_from_df(df, layer_id, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
    df = df.drop_duplicates(subset=[latitude_column, longitude_column])

    latitude_list = df[latitude_column].tolist()
    longitude_list = df[longitude_column].tolist()
    
    z_list = []
    if z_column != None:
       z_list = df[z_column].toList()

    if value_column != None:
        values_list = df[value_column].tolist()
    else:
        values_list = [1] * len(latitude_list)

    transformer = Transformer.from_crs(coordinates_projection, 3395)
    points = list(zip(latitude_list, longitude_list))

    coordinates = []

    for index, point in enumerate(transformer.itransform(points)):
    
        z_value = 0

        if(len(z_list) > 0):
            z_value = z_list[index]

        coordinates.append(point[0])
        coordinates.append(point[1])
        coordinates.append(z_value)

    abstract_json = {
        "id": os.path.basename(layer_id),
        "coordinates": coordinates,
        "values": [elem for elem in values_list]
    }

    json_object = json.dumps(abstract_json)

    directory = os.path.dirname(layer_id)
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    with open(layer_id, "w") as outfile:
        outfile.write(json_object)

'''
    Converts a csv file into an abstract layer
'''
def thematic_from_csv(filepath, layer_id, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
    df = pd.read_csv(filepath)
    thematic_from_df(df, layer_id, latitude_column, longitude_column, coordinates_projection, z_column, value_column)

'''
    Converts a NetCDF (e.g. wrf data) file into an abstract layer
'''
def thematic_from_netcdf(filepath, layer_id, value_variable, latitude_variable, longitude_variable, coordinates_projection, timestep=None, bbox=[]):
    
    # Open the NetCDF file
    ncfile = Dataset(filepath)

    xlong = []
    xlat = []
    temp = []

    ## Data coords
    if(len(ncfile.variables[longitude_variable].shape) == 3 and timestep != None):
        xlong = ncfile.variables[longitude_variable][timestep]
    else:
        xlong = ncfile.variables[longitude_variable]

    if(len(ncfile.variables[latitude_variable].shape) == 3 and timestep != None):
        xlat = ncfile.variables[latitude_variable][timestep]
    else:
        xlat = ncfile.variables[latitude_variable]

    ## Data var
    if(len(ncfile.variables[value_variable].shape) == 3 and timestep != None):
        temp = ncfile.variables[value_variable][timestep]
    else:
        temp = ncfile.variables[value_variable]

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
    Thematic data from numpy array file 

    coordinates shape: (n,3)
    values shape: (n,3)
    Considers that coordinates do not have a coordinates system but are in meters
'''
def thematic_from_npy(filepath_coordinates, filepath_values, layer_id, center_around=[]):

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
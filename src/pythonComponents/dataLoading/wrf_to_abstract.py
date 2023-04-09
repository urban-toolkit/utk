'''
    Converts a wrf file into an abstract layer
'''

import numpy as np

from netCDF4 import Dataset
import matplotlib.pyplot as plt
from matplotlib.cm import get_cmap
import cartopy.crs as crs
from cartopy.feature import NaturalEarthFeature
from pyproj import Transformer
import json
import os

def wrf_to_abstract(filepath, layer_id, value_variable, latitude_variable, longitude_variable, coordinates_projection, bbox=[]):
    
    # Open the NetCDF file
    ncfile = Dataset(filepath)

    ## Data coords
    xlong = ncfile.variables[longitude_variable][0]
    xlat = ncfile.variables[latitude_variable][0]
    ## Data var
    temp = ncfile.variables[value_variable][0]

    mask_values = [False] * len(xlat)

    if(len(bbox) > 0):

        ## Data bounds
        # longmin, longmax = -87.714582,-87.524081
        # latmin, latmax = 41.775716,42.02304

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
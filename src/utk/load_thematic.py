from pyproj import Transformer
import pandas as pd
import os
import json

'''
    Converts a dataframe into an abstract layer
'''
def layer_from_dataframe(df, outputfilename, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
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
        "id": os.path.basename(outputfilename),
        "coordinates": coordinates,
        "values": [elem for elem in values_list]
    }

    json_object = json.dumps(abstract_json)

    directory = os.path.dirname(outputfilename)
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    with open(outputfilename, "w") as outfile:
        outfile.write(json_object)

'''
    Converts a csv file into an abstract layer
'''
def layer_from_csv(filepath, outputpath, latitude_column, longitude_column, coordinates_projection, z_column = None, value_column=None):
    
    df = pd.read_csv(filepath)
    layer_from_dataframe(df, outputpath, latitude_column, longitude_column, coordinates_projection, z_column, value_column)
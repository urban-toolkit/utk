from pyproj import Transformer
import pandas as pd
import os
import json

def df_to_abstract(directory, df, layer_id, value_column, latitude_column, longitude_column, coordinates_projection, z_column = None):
    
    df = df.drop_duplicates(subset=[latitude_column, longitude_column])
    
    latitude_list = df[latitude_column].tolist()
    longitude_list = df[longitude_column].tolist()
    values_list = df[value_column].tolist()

    z_list = []

    if z_column != None:
       z_list = df[z_column].toList()

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
        "id": layer_id,
        "coordinates": coordinates,
        "values": [int(elem) for elem in values_list]
    }

    json_object = json.dumps(abstract_json)

    with open(os.path.join(directory,layer_id+".json"), "w") as outfile:
        outfile.write(json_object)

'''
    Converts a csv file into an abstract layer
'''
def csv_to_abstract(filepath, layer_id, value_column, latitude_column, longitude_column, coordinates_projection, z_column = None):
    
    df = pd.read_csv(filepath)

    df_to_abstract(os.path.dirname(filepath), df, layer_id, value_column, latitude_column, longitude_column, coordinates_projection, z_column = None)
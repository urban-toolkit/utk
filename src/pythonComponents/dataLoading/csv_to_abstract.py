'''
    Converts a csv file into an abstract layer
'''

import pandas as pd
import os

def csv_to_abstract(filepath, layer_id, value_column, latitude_column, longitude_column, z_column = None):
    df = pd.read_csv(filepath)

    latitude_list = df[latitude_column].toList()
    longitude_list = df[longitude_column].toList()

    if(z_column == None):
        

    coordinates =

    abstract_json = {
        ""
    }

    print(df)


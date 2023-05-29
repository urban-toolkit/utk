import json
import os
import struct
import numpy as np

'''
    Load .utk and return a json that represents a layer
'''
def load_utk(filepath):

    file = open(filepath, mode='r')
    file_content = json.loads(file.read())

    directory = os.path.dirname(filepath)
    # file name with extension
    file_name = os.path.basename(filepath)
    # file name without extension
    file_name_wo_extension = os.path.splitext(file_name)[0]

    coordinates = []
    normals = []
    indices = []
    ids = []

    if('coordinates' in file_content['data'][0]['geometry']):
        f = open(os.path.join(directory,file_name_wo_extension+'_coordinates.data'), "rb")

        data = f.read()

        unpacked_data = struct.iter_unpack('d', data)

        for elem in unpacked_data:
            coordinates.append(elem[0])

        f.close()
    if('normals' in file_content['data'][0]['geometry']):
        f = open(os.path.join(directory,file_name_wo_extension+'_normals.data'), "rb")

        data = f.read()

        unpacked_data = struct.iter_unpack('f', data)

        for elem in unpacked_data:
            normals.append(elem[0])

        f.close()
    if('indices' in file_content['data'][0]['geometry']):
        f = open(os.path.join(directory,file_name_wo_extension+'_indices.data'), "rb")

        data = f.read()

        unpacked_data = struct.iter_unpack('I', data)

        for elem in unpacked_data:
            indices.append(elem[0])

        f.close()
    if('ids' in file_content['data'][0]['geometry']):
        f = open(os.path.join(directory,file_name_wo_extension+'_ids.data'), "rb")

        data = f.read()

        unpacked_data = struct.iter_unpack('I', data)

        for elem in unpacked_data:
            ids.append(elem[0])

        f.close()

    for i in range(len(file_content['data'])):

        if(len(coordinates) > 0):
            startAndSize = file_content['data'][i]['geometry']['coordinates']
            file_content['data'][i]['geometry']['coordinates'] = coordinates[startAndSize[0]:startAndSize[0]+startAndSize[1]]

        if(len(indices) > 0):
            startAndSize = file_content['data'][i]['geometry']['indices']
            file_content['data'][i]['geometry']['indices'] = indices[startAndSize[0]:startAndSize[0]+startAndSize[1]]

        if(len(normals) > 0):
            startAndSize = file_content['data'][i]['geometry']['normals']
            file_content['data'][i]['geometry']['normals'] = normals[startAndSize[0]:startAndSize[0]+startAndSize[1]]

        if(len(ids) > 0):
            startAndSize = file_content['data'][i]['geometry']['ids']
            file_content['data'][i]['geometry']['ids'] = ids[startAndSize[0]:startAndSize[0]+startAndSize[1]]

    file.close()

    return file_content

'''
    Get all coordinates (in a flat array) of a json layer
'''
def get_coordinates(layer_json):
    
    if(len(layer_json['data']) == 0):
        return []
    else:
        if 'coordinates' not in layer_json['data'][0]['geometry']:
            raise Exception('Layer does not have a coordinates field')

    coordinates = []

    for geometry in layer_json['data']:
        coordinates += geometry['geometry']['coordinates']

    return coordinates

'''
    Get all indices (in a flat array) of a json layer
'''
def get_indices(layer_json):
    
    if(len(layer_json['data']) == 0):
        return []
    else:
        if 'indices' not in layer_json['data'][0]['geometry']:
            raise Exception('Layer does not have a indices field')

    indices = []

    for geometry in layer_json['data']:
        indices += geometry['geometry']['indices']

    return indices

'''
    Get all normals (in a flat array) of a json layer
'''
def get_normals(layer_json):
    
    if(len(layer_json['data']) == 0):
        return []
    else:
        if 'normals' not in layer_json['data'][0]['geometry']:
            raise Exception('Layer does not have a normals field')

    normals = []

    for geometry in layer_json['data']:
        normals += geometry['geometry']['normals']

    return normals

'''
    Get all ids (in a flat array) of a json layer
'''
def get_ids(layer_json):
    
    if(len(layer_json['data']) == 0):
        return []
    else:
        if 'ids' not in layer_json['data'][0]['geometry']:
            raise Exception('Layer does not have a ids field')

    ids = []

    for geometry in layer_json['data']:
        ids += geometry['geometry']['ids']

    return ids
import json
import os
import struct

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

    # TODO: also remove data from .data files not only the indices in .json
    # coordinates = []
    # normals = []
    # indices = []
    # ids = []

    # if('coordinates' in file_content['data'][0]['geometry']):
    #     f = open(os.path.join(directory,file_name_wo_extension+'_coordinates.data'), "rb")

    #     data = f.read()

    #     unpacked_data = struct.iter_unpack('d', data)

    #     for elem in unpacked_data:
    #         coordinates.append(elem[0])

    #     f.close()
    # if('normals' in file_content['data'][0]['geometry']):
    #     f = open(os.path.join(directory,file_name_wo_extension+'_normals.data'), "rb")

    #     data = f.read()

    #     unpacked_data = struct.iter_unpack('f', data)

    #     for elem in unpacked_data:
    #         normals.append(elem[0])

    #     f.close()
    # if('indices' in file_content['data'][0]['geometry']):
    #     f = open(os.path.join(directory,file_name_wo_extension+'_indices.data'), "rb")

    #     data = f.read()

    #     unpacked_data = struct.iter_unpack('I', data)

    #     for elem in unpacked_data:
    #         indices.append(elem[0])

    #     f.close()
    # if('ids' in file_content['data'][0]['geometry']):
    #     f = open(os.path.join(directory,file_name_wo_extension+'_ids.data'), "rb")

    #     data = f.read()

    #     unpacked_data = struct.iter_unpack('I', data)

    #     for elem in unpacked_data:
    #         ids.append(elem[0])

    #     f.close()

    # for id in ids:

    #     if(len(coordinates) > 0):
    #         startAndSizeCoords = file_content['data'][id]['geometry']['coordinates']
    #         coordinates.splice(startAndSizeCoords[0], startAndSizeCoords[1])

    #     if(len(indices) > 0):
    #         startAndSizeIndices = file_content['data'][id]['geometry']['indices']
    #         indices.splice(startAndSizeIndices[0], startAndSizeIndices[1])

    #     if(len(normals) > 0):
    #         startAndSizeNormals = file_content['data'][id]['geometry']['normals']
    #         normals.splice(startAndSizeNormals[0], startAndSizeNormals[1])

    #     if(len(ids) > 0):
    #         startAndSizeIds = file_content['data'][id]['geometry']['ids']
    #         ids.splice(startAndSizeIds[0], startAndSizeIds[1])
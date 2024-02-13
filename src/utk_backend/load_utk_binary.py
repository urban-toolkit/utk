import json
import os
import struct
import numpy as np
import array


class UTK_Binary_Loader:

    '''
        Load data from .utk and *_blob.data files and return a JSON that represents a layer
    '''

    def __init__(self):
        self.byteMap= {
            'i': 4,
            'f': 4,
            'd': 8
        }

    def load_utk_binary(self, utk_path: str, blob_path: str):

        utk_file = open(utk_path, mode='r')
        utk_data = utk_file.readlines()
        file_metadata, binary_metadata, raw_metadata = self.get_metadata(utk_data)
        # print(f'file metadata -> {file_metadata}')
        # print(f'binary metadata -> {binary_metadata}')
        # print(f'raw metadata -> {raw_metadata}')

        pointers, raw_values = self.read_binary_blob_file(blob_path, binary_metadata, raw_metadata)

        original_json = self.construct_json(file_metadata, pointers)
        # print(decoded)
        temp = dict(original_json)
        parsed_json = self.parse_pointers(temp, raw_values)
        return parsed_json


    def get_metadata(self, utk_data):
        file_md = {}
        binary_md = {}
        raw_md = {}
        i = 1
        while i < len(utk_data):
            curr = utk_data[i].strip('\n').split(',')
            if curr[0] == 'file_metadata':
                i += 1
                while i < int(curr[1])+2:
                    curr_file_md = utk_data[i].strip('\n').split(',')
                    file_md[curr_file_md[0]] = curr_file_md[1]
                    i += 1
                curr = utk_data[i].strip('\n').split(',')
            if curr[0] == 'binary_metadata':
                i += 1
                ctr = int(curr[1])
                while ctr > 0:
                    curr_bin_md = utk_data[i].strip('\n').split(',')
                    binary_md[curr_bin_md[0]] = curr_bin_md[1:]
                    i += 1
                    ctr -= 1
                curr = utk_data[i].strip('\n')
            if curr == 'Raw Binary Data Sizes':
                i += 1
                while i < len(utk_data):
                    curr_raw_md = utk_data[i].strip('\n').split(',')
                    raw_md[curr_raw_md[0]] = curr_raw_md[1]
                    i += 1
        
        return file_md, binary_md, raw_md
        
    def read_binary_blob_file(self, file_path: str, binary_metadata: dict, raw_metadata: dict):
        with open(file_path, 'rb') as binary_blob_file:
            data = binary_blob_file.read()
        # print("Printting binary data:\n\n")
        # print(data)
        # return
        # Split data based on the separator
        temp = data.split(b'RAW BINARY BLOB SEPARATOR')
        sections_ptr = temp[0].split(b'<<>>')
        sections_blob = temp[1].split(b'<<>>')

        lens_ptr = [len(x) for x in sections_ptr]
        lens_blob = [len(x) for x in sections_blob]
        print(f'temp is {len(temp)} in size')
        print(f'ptr is {len(sections_ptr)} in size, lengths {lens_ptr}')
        print(f'blob is {len(sections_blob)} in size, lens {lens_blob}')
        # print(sections_ptr)
        # print(sections_blob)

        # Assuming the first section contains metadata
        # metadata = sections[0].split(b'\n')
        attribute_dict_ptr = {}
        attribute_dict_binary = {}

        for k in binary_metadata.keys():
            attribute_dict_ptr[k] = []
        # print("DATA = \n\n\n",len(sections), [len(section) for section in sections])
        # return
        # Parse metadata and binary data for each layer

        sections_ptr.pop(0)
        sections_blob.pop(0)
        
        for layerName, info in binary_metadata.items():
            layerSize = int(info[0])
            layerType = info[1].lower()
            curr_blob = sections_ptr.pop(0)
            bufferSize = len(curr_blob)//self.byteMap[layerType]
            # print(f'buffer size for {layerName}(size{layerSize}) is {bufferSize}')
            attribute_dict_ptr[layerName] = struct.unpack(f'{bufferSize}{layerType}', curr_blob)

            # print(f'Decoded {layerName}!')
        
        for layerName, layerType in raw_metadata.items():
            curr_blob = sections_blob.pop(0)
            bufferSize = len(curr_blob)//self.byteMap[layerType.lower()]
            attribute_dict_binary[layerName] = struct.unpack(f'{bufferSize}{layerType}', curr_blob)
            
            # print(f'CURR BLOB OF {layerName} is {len(curr_blob)} in length!!!!!')
            # print(f'{layerName} is {len(attribute_dict_binary[layerName])} in length')
        
        return attribute_dict_ptr, attribute_dict_binary

    def construct_json(self, file_meta: str, pointer_data: str):
        org_json = file_meta
        org_json['data'] = []

        for layerName, values in pointer_data.items():
            val_parser = 0
            if layerName in ['coordinates', 'indices', 'normals', 'ids']:
                while val_parser < len(values)-1:
                    if len(org_json['data']) < len(values)//2:
                        org_json['data'].append({'geometry': {}})
                    org_json['data'][val_parser//2]['geometry'][layerName] = values[val_parser:(val_parser+2)]
                    val_parser += 2
            else:
                utk_json_parser = 0
                k = 0

                while utk_json_parser < len(org_json['data']):
                    current_array_size = int(values[k])
                    outer_pointer = 0
                    k += 1
                    final_array = []

                    while outer_pointer < current_array_size:
                        inner_array_size = int(values[k])
                        k += 1

                        inner_array = values[k:k + inner_array_size]
                        k += inner_array_size

                        final_array.append(list(inner_array))
                        outer_pointer += 1

                    org_json['data'][utk_json_parser]['geometry'][layerName] = final_array
                    utk_json_parser += 1
        return org_json

    def parse_pointers(self, parsed_json: dict, raw_values: dict):
        
        coordinates = []
        indices = []
        normals = []
        ids = []

        if 'coordinates' in raw_values:
            coordinates = raw_values['coordinates']
        if 'indices' in raw_values:
            indices = raw_values['indices']
        if 'normals' in raw_values:
            normals = raw_values['normals']
        if 'ids' in raw_values:
            ids = raw_values['ids']

        for i in range(len(parsed_json['data'])):
            if len(coordinates) > 0:
                start, end = parsed_json['data'][i]['geometry']['coordinates']
                parsed_json['data'][i]['geometry']['coordinates'] = coordinates[start:(start+end)]
            
            if len(indices) > 0:
                start, end = parsed_json['data'][i]['geometry']['indices']
                parsed_json['data'][i]['geometry']['indices'] = indices[start:(start+end)]
            
            if len(normals) > 0:
                start, end = parsed_json['data'][i]['geometry']['normals']
                parsed_json['data'][i]['geometry']['normals'] = normals[start:(start+end)]
            
            if len(ids) > 0:
                start, end = parsed_json['data'][i]['geometry']['ids']
                parsed_json['data'][i]['geometry']['ids'] = ids[start:(start+end)]
            
        print("Done parsing raw data")

        return parsed_json
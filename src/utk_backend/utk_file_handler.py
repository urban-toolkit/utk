import struct
import pickle
import json
import os

class UTKFileHandler:
    def __init__(self):
        pass

    def create_attribute_dict(self, data: json) -> dict:
        '''
        Takes a json file and list of attributes and returns dictionary of grouped attributes in the json.
        data: json
        attributes: list [coordinates, indices, ids, normals, orientedEnvelope, sectionFootprint]
        '''

        # print("JDGBNDGJngdnD")
        # print(f'data-> {data}')
        attr_dict = {"coordinates":[], "normals":[], "indices":[], "ids":[], "orientedEnvelope":[], "sectionFootprint":[], "discardFuncInterval": [], "values": []}
        if 'data' in data.keys():
            for point in data['data']:
                for k, v in point['geometry'].items():
                    if k == "orientedEnvelope" or k == "sectionFootprint":
                        attr_dict[k].append(len(v))
                    for val in v:
                        if k == "orientedEnvelope" or k == "sectionFootprint":
                            attr_dict[k].append(len(val))
                            for val_val in val:
                                attr_dict[k].append(float(val_val))
                        else:
                            attr_dict[k].append(val)
        else:
            for k, v in data.items():
                attr_dict[k] = v
        return attr_dict
    
    def create_utk_binary(self, attribute_dict: dict, df: json, utk_filename: str, filepath: str) -> None:
        '''
        Given a json and attribute dictionary, it generates a .utk file with compressed attribute data
        attribute_dict: attribute dictionary(created from create_attribute_dict)
        df: json
        utk_filename: desired output file name
        '''

        # print(f'attr dict = {attribute_dict.keys()}')
        # print(f'df = {df.keys()}')
        _id = df['id']
        if 'type' in df.keys(): type_of_layer = df['type']
        if 'renderStyle' in df.keys(): render_style = df['renderStyle']
        if 'styleKey' in df.keys(): style_key = df['styleKey']
        if 'visible' in df.keys(): visible = df['visible']
        if 'selectable' in df.keys(): selectable = df['selectable']
        if 'skip' in df.keys(): skip = df['skip']


        coordinates = attribute_dict['coordinates']
        if len(coordinates) > 0: coordinates_type = type(coordinates[0])
        indices = attribute_dict['indices']
        if len(indices) > 0: indices_type = type(indices[0])
        normals = attribute_dict['normals']
        if len(normals) > 0: normals_type = type(normals[0])
        ids = attribute_dict['ids']
        if len(ids) > 0: ids_type = type(ids)
        discardFuncInterval = attribute_dict['discardFuncInterval']
        # if len(discardFuncInterval) > 0: discardFuncInterval_type = type(discardFuncInterval[0])
        orientedEnvelope = attribute_dict['orientedEnvelope']
        # if len(orientedEnvelope) > 0: orientedEnvelope_type = type(orientedEnvelope[0])
        sectionFootprint = attribute_dict['sectionFootprint']
        # if len(sectionFootprint) > 0: sectionFootprint_type = type(sectionFootprint[0])
        values = attribute_dict['values']
        if len(values) > 0: values_type = type(values[0])
        
        #coordinates can be pointers to binary data OR the coordinate data
        if type(coordinates[0]) == int: packed_coordinates = struct.pack(f'{len(coordinates)}i', *coordinates)
        elif type(coordinates[0]) == float: packed_coordinates = struct.pack(f'{len(coordinates)}d', *coordinates)
        type_to_size = {
            int: 'i',
            float: 'd',
            list: 'd'
        }
        # packed_coordinates = struct.pack(f'{len(coordinates)}{type_to_size[coordinates_type]}', *coordinates)
        packed_indices = struct.pack(f'{len(indices)}i', *indices)
        packed_normals = struct.pack(f'{len(normals)}i', *normals)
        packed_ids = struct.pack(f'{len(ids)}i', *ids)
        packed_discardFuncInterval = struct.pack(f'{len(discardFuncInterval)}d', *discardFuncInterval)
        packed_values = struct.pack(f'{len(values)}d', *values)


        packed_orientedEnvelope = b''
        packed_orientedEnvelope_size = 0
        for oEnvelope in orientedEnvelope:
            if type(oEnvelope) == int:
                packed_orientedEnvelope += struct.pack('d', float(oEnvelope))
                packed_orientedEnvelope_size += 1
            elif type(oEnvelope) == float:
                packed_orientedEnvelope += struct.pack('d', oEnvelope)
                packed_orientedEnvelope_size += 1
        
        packed_sectionFootprint = b''
        packed_sectionFootprint_size = 0
        flag = True
        for footprint in sectionFootprint:
            if type(footprint) == int:
                packed_sectionFootprint += struct.pack('d', float(footprint))
                packed_sectionFootprint_size += 1
            elif type(footprint) == float:
                # if flag:
                    # print(f'encoding {footprint}')
                packed_sectionFootprint += struct.pack('d', footprint)
                packed_sectionFootprint_size += 1
        
        packed_values_size = len(values)*8
        # packed_orientedEnvelope = pickle.dumps(orientedEnvelope)
        # packed_sectionFootprint = pickle.dumps(sectionFootprint)

        # calculate binary metadata size
        binary_metadata_size = 0
        for v in attribute_dict.values():
            if len(v) > 0:
                binary_metadata_size += 1
        file_metadata_size = len(df.keys())-1

        with open(os.path.join(filepath,utk_filename+'.utk'), 'w') as file:
            file.seek(0)
            file.write(f'{3 + file_metadata_size + binary_metadata_size}\n')
            file.write(f'file_metadata,{file_metadata_size}\n')
            file.write(f'id,{_id}\n')
            if 'type' in df.keys(): file.write(f'type,{type_of_layer}\n')
            if 'renderStyle' in df.keys(): file.write(f'renderStyle,{render_style}\n')
            if 'styleKey' in df.keys(): file.write(f'styleKey,{style_key}\n')
            if 'visible' in df.keys(): file.write(f'visible,{visible}\n')
            if 'selectable' in df.keys(): file.write(f'selectable,{selectable}\n')
            if 'skip' in df.keys(): file.write(f'skip,{skip}\n')

            #############################
            # SPLIT BINARY METADATA AND BINARY DATA #
            ############################


        # with open(os.path.join(filepath, utk_filename+'_binary.utk'), 'ab') as file:
            # file.write(f'pointer_size, {}')
            file.write(f'binary_metadata,{binary_metadata_size}\n')
            if len(coordinates) > 0:
                if type(coordinates[0]) == int:
                    file.write(f'coordinates,{len(packed_coordinates)//4},i\n')
                elif type(coordinates[0]) == float:
                    file.write(f'coordinates,{len(packed_coordinates)//4},d\n')
            if len(indices) > 0: file.write(f'indices,{len(packed_indices)//4},i\n')
            if len(normals) > 0: file.write(f'normals,{len(packed_normals)//4},i\n')
            if len(ids) > 0: file.write(f'ids,{len(packed_ids)//4},i\n')
            if len(discardFuncInterval) > 0: file.write(f'discardFuncInterval,{len(packed_discardFuncInterval)},d\n')
            if len(orientedEnvelope) > 0: file.write(f'orientedEnvelope,{packed_orientedEnvelope_size},d\n')
            if len(sectionFootprint) > 0: file.write(f'sectionFootprint,{packed_sectionFootprint_size},d\n')
            if len(values) > 0: file.write(f'values,{packed_values_size},d\n')
        
        # with open(os.path.join(filepath,utk_filename+'_blob.data'), 'w') as file:

        #     #pointer metadata
            



        #     if len(coordinates) > 0: file.write(packed_coordinates)
        #     if len(indices) > 0: file.write(packed_indices)
        #     if len(normals) > 0: file.write(packed_normals)
        #     if len(ids) > 0: file.write(packed_ids)
    
        # if len(orientedEnvelope) > 0 or len(sectionFootprint) > 0 or len(values) > 0 or len(discardFuncInterval) > 0:
        #     with open(os.path.join(filepath,utk_filename+'.utk'), 'a') as file:
        #         file.write("FLOAT DATA BEGINS")
        #     with open(os.path.join(filepath,utk_filename+'.utk'), 'ab') as file:
        #         if len(discardFuncInterval) > 0: file.write(packed_discardFuncInterval)
        #         if len(orientedEnvelope) > 0: file.write(packed_orientedEnvelope)
        #         if len(sectionFootprint) > 0: file.write(packed_sectionFootprint)
        #         if len(values) > 0: file.write(packed_values)

        print(f"Data has been written to file {utk_filename}\n")
        print("KSNSFNSFKLFNFS\n\n")
        
    def read_utk_binary(self, filename: str, filepath: str) -> list:
        '''
        Parses a .utk file to retrieve data
        '''
        with open(os.path.join(filepath,filename+'.utk'), 'rb') as file:
            file_size = int(file.readline().decode('utf-8').strip())

            file_metadata_size = int(file.readline().decode('utf-8').strip().split(',')[1])

            # Read metadata fields
            metadata = {}
            for _ in range(file_metadata_size):
                field_name, field_value = file.readline().decode('utf-8').strip().split(',')
                metadata[field_name] = field_value

            # Read binary metadata
            binary_metadata_size = int(file.readline().decode('utf-8').strip().split(',')[1])
            binary_metadata = {}
            for _ in range(binary_metadata_size):
                field_name, field_size, field_type = file.readline().decode('utf-8').strip().split(',')
                binary_metadata[field_name] = [int(field_size), field_type]

            data = {}
            print(binary_metadata)
            for field_name, field_info in binary_metadata.items():
                field_size, field_type = field_info
                if field_name in ['orientedEnvelope', 'sectionFootprint']:
                    data[field_name] = pickle.loads(file.read(field_size))
                elif field_name in ["discardFuncInterval", 'values']:
                    data[field_name] = struct.unpack(f'{field_size // struct.calcsize(field_type)}{field_type}', file.read(field_size))
                else:
                    data[field_name] = struct.unpack(f'{field_size // struct.calcsize(field_type)}{field_type}', file.read(field_size))

            return metadata, data


# class UTKFileHandler:
#     def __init__(self):
#         pass

#     def create_attribute_dict(self, data: json) -> dict:
#         '''
#         Takes a json file and list of attributes and returns dictionary of grouped attributes in the json.
#         data: json
#         attributes: list [coordinates, indices, ids, normals, orientedEnvelope, sectionFootprint]
#         '''

#         # print("JDGBNDGJngdnD")
#         # print(f'data-> {data}')
#         attr_dict = {"coordinates":[], "indices":[], "normals":[], "ids":[], "orientedEnvelope":[], "sectionFootprint":[], "discardFuncInterval": [], "values": []}
#         if 'data' in data.keys():
#             for point in data['data']:
#                 for k, v in point['geometry'].items():
#                     if k == "orientedEnvelope" or k == "sectionFootprint":
#                         attr_dict[k].append(len(v))
#                     for val in v:
#                         if k == "orientedEnvelope" or k == "sectionFootprint":
#                             attr_dict[k].append(len(val))
#                             for val_val in val:
#                                 attr_dict[k].append(float(val_val))
#                         else:
#                             attr_dict[k].append(val)
#         else:
#             for k, v in data.items():
#                 attr_dict[k] = v
#         return attr_dict
    
#     def create_utk_binary(self, attribute_dict: dict, df: json, utk_filename: str, filepath: str) -> None:
#         '''
#         Given a json and attribute dictionary, it generates a .utk file with compressed attribute data
#         attribute_dict: attribute dictionary(created from create_attribute_dict)
#         df: json
#         utk_filename: desired output file name
#         '''

#         # print(f'attr dict = {attribute_dict.keys()}')
#         # print(f'df = {df.keys()}')
#         _id = df['id']
#         if 'type' in df.keys(): type_of_layer = df['type']
#         if 'renderStyle' in df.keys(): render_style = df['renderStyle']
#         if 'styleKey' in df.keys(): style_key = df['styleKey']
#         if 'visible' in df.keys(): visible = df['visible']
#         if 'selectable' in df.keys(): selectable = df['selectable']
#         if 'skip' in df.keys(): skip = df['skip']


#         coordinates = attribute_dict['coordinates']
#         indices = attribute_dict['indices']
#         normals = attribute_dict['normals']
#         ids = attribute_dict['ids']
#         discardFuncInterval = attribute_dict['discardFuncInterval']
#         orientedEnvelope = attribute_dict['orientedEnvelope']
#         sectionFootprint = attribute_dict['sectionFootprint']
#         values = attribute_dict['values']
        

#         packed_coordinates = struct.pack(f'{len(coordinates)}i', *coordinates)
#         packed_indices = struct.pack(f'{len(indices)}i', *indices)
#         packed_normals = struct.pack(f'{len(normals)}i', *normals)
#         packed_ids = struct.pack(f'{len(ids)}i', *ids)
#         packed_discardFuncInterval = struct.pack(f'{len(discardFuncInterval)}d', *discardFuncInterval)
#         packed_values = struct.pack(f'{len(values)}d', *values)


#         packed_orientedEnvelope = b''
#         packed_orientedEnvelope_size = 0
#         for oEnvelope in orientedEnvelope:
#             if type(oEnvelope) == int:
#                 packed_orientedEnvelope += struct.pack('d', float(oEnvelope))
#                 packed_orientedEnvelope_size += 8
#             elif type(oEnvelope) == float:
#                 packed_orientedEnvelope += struct.pack('d', oEnvelope)
#                 packed_orientedEnvelope_size += 8
        
#         packed_sectionFootprint = b''
#         packed_sectionFootprint_size = 0
#         flag = True
#         for footprint in sectionFootprint:
#             if type(footprint) == int:
#                 packed_sectionFootprint += struct.pack('d', float(footprint))
#                 packed_sectionFootprint_size += 4
#             elif type(footprint) == float:
#                 if flag:
#                     print(f'encoding {footprint}')
#                 packed_sectionFootprint += struct.pack('d', footprint)
#                 packed_sectionFootprint_size += 8
        
#         packed_values_size = len(values)*8
#         # packed_orientedEnvelope = pickle.dumps(orientedEnvelope)
#         # packed_sectionFootprint = pickle.dumps(sectionFootprint)

#         # calculate binary metadata size
#         binary_metadata_size = 0
#         for v in attribute_dict.values():
#             if len(v) > 0:
#                 binary_metadata_size += 1
#         file_metadata_size = len(df.keys())-1

#         with open(os.path.join(filepath,utk_filename+'.utk'), 'w') as file:
#             file.write(f'{3 + file_metadata_size + binary_metadata_size}\n')
#             file.write(f'file_metadata,{file_metadata_size}\n')
#             file.write(f'id,{_id}\n')
#             if 'type' in df.keys(): file.write(f'type,{type_of_layer}\n')
#             if 'renderStyle' in df.keys(): file.write(f'renderStyle,{render_style}\n')
#             if 'styleKey' in df.keys(): file.write(f'styleKey,{style_key}\n')
#             if 'visible' in df.keys(): file.write(f'visible,{visible}\n')
#             if 'selectable' in df.keys(): file.write(f'selectable,{selectable}\n')
#             if 'skip' in df.keys(): file.write(f'skip,{skip}\n')
#             file.write(f'binary_metadata,{binary_metadata_size}\n')
#             if len(coordinates) > 0: file.write(f'coordinates,{len(packed_coordinates)}\n')
#             if len(indices) > 0: file.write(f'indices,{len(packed_indices)}\n')
#             if len(normals) > 0: file.write(f'normals,{len(packed_normals)}\n')
#             if len(ids) > 0: file.write(f'ids,{len(packed_ids)}\n')
#             if len(discardFuncInterval) > 0: file.write(f'discardFuncInterval,{len(packed_discardFuncInterval)}\n')
#             if len(orientedEnvelope) > 0: file.write(f'orientedEnvelope,{packed_orientedEnvelope_size}\n')
#             if len(sectionFootprint) > 0: file.write(f'sectionFootprint,{packed_sectionFootprint_size}\n')
#             if len(values) > 0: file.write(f'values,{len(packed_values_size)}\n')
            
#             file.write("BINARY DATA SEPARATOR")
        
#         with open(os.path.join(filepath,utk_filename+'.utk'), 'ab') as file:
#             if len(coordinates) > 0: file.write(packed_coordinates)
#             if len(indices) > 0: file.write(packed_indices)
#             if len(normals) > 0: file.write(packed_normals)
#             if len(ids) > 0: file.write(packed_ids)
#             if len(discardFuncInterval) > 0: file.write(packed_discardFuncInterval)
    
#         if len(orientedEnvelope) > 0 or len(sectionFootprint) > 0 or len(values) > 0:
#             with open(os.path.join(filepath,utk_filename+'.utk'), 'a') as file:
#                 file.write("FLOAT DATA BEGINS")
#             with open(os.path.join(filepath,utk_filename+'.utk'), 'ab') as file:
#                 if len(orientedEnvelope) > 0: file.write(packed_orientedEnvelope)
#                 if len(sectionFootprint) > 0: file.write(packed_sectionFootprint)
#                 if len(values) > 0: file.write(packed_values)

#         print(f"Data has been written to file {utk_filename}\n")
        
#     def read_utk_binary(self, filename: str, filepath: str) -> list:
#         '''
#         Parses a .utk file to retrieve data
#         '''
#         with open(os.path.join(filepath,filename+'.utk'), 'rb') as file:
#             file_size = int(file.readline().decode('utf-8').strip())

#             file_metadata_size = int(file.readline().decode('utf-8').strip().split(',')[1])

#             # Read metadata fields
#             metadata = {}
#             for _ in range(file_metadata_size):
#                 field_name, field_value = file.readline().decode('utf-8').strip().split(',')
#                 metadata[field_name] = field_value

#             # Read binary metadata
#             binary_metadata_size = int(file.readline().decode('utf-8').strip().split(',')[1])
#             binary_metadata = {}
#             for _ in range(binary_metadata_size):
#                 field_name, field_size = file.readline().decode('utf-8').strip().split(',')
#                 binary_metadata[field_name] = int(field_size)

#             data = {}
#             for field_name, field_size in binary_metadata.items():
#                 if field_name in ['orientedEnvelope', 'sectionFootprint', 'values']:
#                     data[field_name] = pickle.loads(file.read(field_size))
#                 elif field_name in ["discardFuncInterval"]:
#                     data[field_name] = struct.unpack(f'{field_size // struct.calcsize("d")}d', file.read(field_size))
#                 else:
#                     data[field_name] = struct.unpack(f'{field_size // struct.calcsize("i")}i', file.read(field_size))

#             return metadata, data
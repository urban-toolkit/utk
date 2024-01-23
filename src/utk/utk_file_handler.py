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
        attr_dict = {"coordinates":[], "indices":[], "normals":[], "ids":[], "orientedEnvelope":[], "sectionFootprint":[], "discardFuncInterval": []}
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
        type_of_layer = df['type']
        render_style = df['renderStyle']
        style_key = df['styleKey']
        if 'visible' in df.keys(): visible = df['visible']
        if 'selectable' in df.keys(): selectable = df['selectable']
        if 'skip' in df.keys(): skip = df['skip']


        coordinates = attribute_dict['coordinates']
        indices = attribute_dict['indices']
        normals = attribute_dict['normals']
        ids = attribute_dict['ids']
        discardFuncInterval = attribute_dict['discardFuncInterval']
        orientedEnvelope = attribute_dict['orientedEnvelope']
        sectionFootprint = attribute_dict['sectionFootprint']
        

        packed_coordinates = struct.pack(f'{len(coordinates)}i', *coordinates)
        packed_indices = struct.pack(f'{len(indices)}i', *indices)
        packed_normals = struct.pack(f'{len(normals)}i', *normals)
        packed_ids = struct.pack(f'{len(ids)}i', *ids)
        packed_discardFuncInterval = struct.pack(f'{len(discardFuncInterval)}d', *discardFuncInterval)


        packed_orientedEnvelope = b''
        packed_orientedEnvelope_size = 0
        for oEnvelope in orientedEnvelope:
            if type(oEnvelope) == int:
                packed_orientedEnvelope += struct.pack('d', float(oEnvelope))
                packed_orientedEnvelope_size += 8
            elif type(oEnvelope) == float:
                packed_orientedEnvelope += struct.pack('d', oEnvelope)
                packed_orientedEnvelope_size += 8
        
        packed_sectionFootprint = b''
        packed_sectionFootprint_size = 0
        flag = True
        for footprint in sectionFootprint:
            if type(footprint) == int:
                packed_sectionFootprint += struct.pack('d', float(footprint))
                packed_sectionFootprint_size += 4
            elif type(footprint) == float:
                if flag:
                    print(f'encoding {footprint}')
                packed_sectionFootprint += struct.pack('d', footprint)
                packed_sectionFootprint_size += 8
        # packed_orientedEnvelope = pickle.dumps(orientedEnvelope)
        # packed_sectionFootprint = pickle.dumps(sectionFootprint)

        # calculate binary metadata size
        binary_metadata_size = 0
        for v in attribute_dict.values():
            if len(v) > 0:
                binary_metadata_size += 1
        file_metadata_size = len(df.keys())-1

        with open(os.path.join(filepath,utk_filename+'.utk'), 'w') as file:
            file.write(f'{3 + file_metadata_size + binary_metadata_size}\n')
            file.write(f'file_metadata,{file_metadata_size}\n')
            file.write(f'id,{_id}\n')
            file.write(f'type,{type_of_layer}\n')
            file.write(f'renderStyle,{render_style}\n')
            file.write(f'styleKey,{style_key}\n')
            if 'visible' in df.keys(): file.write(f'visible,{visible}\n')
            if 'selectable' in df.keys(): file.write(f'selectable,{selectable}\n')
            if 'skip' in df.keys(): file.write(f'skip,{skip}\n')
            file.write(f'binary_metadata,{binary_metadata_size}\n')
            file.write(f'coordinates,{len(packed_coordinates)}\n')
            file.write(f'indices,{len(packed_indices)}\n')
            if len(normals) > 0: file.write(f'normals,{len(packed_normals)}\n')
            if len(ids) > 0: file.write(f'ids,{len(packed_ids)}\n')
            if len(discardFuncInterval) > 0: file.write(f'discardFuncInterval,{len(packed_discardFuncInterval)}\n')
            if len(orientedEnvelope) > 0: file.write(f'orientedEnvelope,{packed_orientedEnvelope_size}\n')
            if len(sectionFootprint) > 0: file.write(f'sectionFootprint,{packed_sectionFootprint_size}\n')
            file.write("BINARY DATA SEPARATOR")
        
        with open(os.path.join(filepath,utk_filename+'.utk'), 'ab') as file:
            file.write(packed_coordinates)
            file.write(packed_indices)
            if len(normals) > 0: file.write(packed_normals)
            if len(ids) > 0: file.write(packed_ids)
            if len(discardFuncInterval) > 0: file.write(packed_discardFuncInterval)
    
        if len(orientedEnvelope) > 0 or len(sectionFootprint) > 0:
            with open(os.path.join(filepath,utk_filename+'.utk'), 'a') as file:
                file.write("FLOAT DATA BEGINS")
            with open(os.path.join(filepath,utk_filename+'.utk'), 'ab') as file:
                if len(orientedEnvelope) > 0: file.write(packed_orientedEnvelope)
                if len(sectionFootprint) > 0: file.write(packed_sectionFootprint)

        print(f"Data has been written to file {utk_filename}\n")
        
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
                field_name, field_size = file.readline().decode('utf-8').strip().split(',')
                binary_metadata[field_name] = int(field_size)

            data = {}
            for field_name, field_size in binary_metadata.items():
                if field_name in ['orientedEnvelope', 'sectionFootprint']:
                    data[field_name] = pickle.loads(file.read(field_size))
                elif field_name in ["discardFuncInterval"]:
                    data[field_name] = struct.unpack(f'{field_size // struct.calcsize("d")}d', file.read(field_size))
                else:
                    data[field_name] = struct.unpack(f'{field_size // struct.calcsize("i")}i', file.read(field_size))

            return metadata, data
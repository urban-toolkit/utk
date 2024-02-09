import json
import geopandas as gpd
import pandas as pd
import os
import struct
import webbrowser

from shapely.geometry import Polygon, Point
from utk_backend.utk_file_handler import UTKFileHandler

class UrbanComponent:
    """
    Basic Urban Toolkit component
    """

    cid = None
    style = {}
    layers = {'json': [], 'gdf': {'objects': [], 'coordinates': [], 'coordinates3d': []}}
    joinedJson = {}
    camera = None
    bpolygon = []
    workDir = None

    def __init__(self, cid = 'map', filepath = None, layers = None, camera = None, bpolygon = None):
        if filepath != None:
            self.from_file(filepath)
        self.cid = cid
        if layers != None:
            self.layers = layers
        if camera != None:
            self.camera = camera
        if bpolygon != None:
            self.bpolygon = bpolygon

    def set_work_dir(self, dir):
        self.workDir = dir
        
    # TODO: make this function more generic regarding the section footprint
    def jsonToGdf(self, layer_json, dim, abstract=False):

        ids = []
        ids_coordinates = []
        values_coordinates = []
        counter_id_coordinates = 0

        geometries = []
        geometries_coordinates = []

        tridimensional_coordinates = []
        ids_tridimensional_coordinates = []
        counter_id_tridimensional_coordinates = 0

        dimensions = 3


        if(not abstract):
            if('sectionFootprint' in layer_json['data'][0]['geometry']): # hard coded buildings case. We want to consider the footprint for 2D joins not the whole building
                dimensions = 2 

            for id, elem in enumerate(layer_json['data']):

                groupedCoordinates = []

                polygon_coordinates = None

                if('sectionFootprint' in elem['geometry']):
                    polygon_coordinates = elem['geometry']['sectionFootprint'][0] # used for buildings
                else:
                    polygon_coordinates = elem['geometry']['coordinates']

                for i in range(0,int(len(polygon_coordinates)/dimensions)):
                    geometries_coordinates.append(Point(polygon_coordinates[i*dimensions], polygon_coordinates[i*dimensions+1]))
                    ids_coordinates.append(counter_id_coordinates)
                    counter_id_coordinates += 1
                    
                    groupedCoordinates.append((polygon_coordinates[i*dimensions], polygon_coordinates[i*dimensions+1]))

                    if(dimensions == 3 and 'sectionFootprint' not in elem['geometry']): # if it has a 3d representation and it is not a building
                        tridimensional_coordinates.append([polygon_coordinates[i*dimensions], polygon_coordinates[i*dimensions+1], polygon_coordinates[i*dimensions+2]])
                        ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)        
                        counter_id_tridimensional_coordinates += 1  

                if('sectionFootprint' in elem['geometry']): # it is a building so a 3d representation must be included (it comes from the coordinates field)
                    for i in range(0,int(len(elem['geometry']['coordinates'])/3)):
                        tridimensional_coordinates.append([elem['geometry']['coordinates'][i*3], elem['geometry']['coordinates'][i*3+1], elem['geometry']['coordinates'][i*3+2]])
                        ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)        
                        counter_id_tridimensional_coordinates += 1  

                if(len(groupedCoordinates) >= 3):
                    ids.append(id)
                    geometries.append(Polygon(groupedCoordinates))
        else:
            for i in range(0,int(len(layer_json['coordinates'])/dimensions)):
                
                values_coordinates.append(layer_json['values'][i])
                geometries_coordinates.append(Point(layer_json['coordinates'][i*dimensions], layer_json['coordinates'][i*dimensions+1]))

                if(dimensions == 3):
                    tridimensional_coordinates.append([layer_json['coordinates'][i*dimensions], layer_json['coordinates'][i*dimensions+1], layer_json['coordinates'][i*dimensions+2]])
                    ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)        
                    counter_id_tridimensional_coordinates += 1  

        gdf = gpd.GeoDataFrame({'geometry': geometries, 'id': ids}, crs=3395) if not abstract else {}

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, 'id': ids_coordinates}, crs=3395) if not abstract else gpd.GeoDataFrame({'geometry': geometries_coordinates, 'value': values_coordinates}, crs=3395)

        df_coordinates3d = None

        if(abstract):
            df_coordinates3d = pd.DataFrame({'geometry': tridimensional_coordinates, 'id': ids_tridimensional_coordinates, 'value': values_coordinates}) if len(tridimensional_coordinates) > 0 and len(ids_tridimensional_coordinates) > 0 else None
        else:
            df_coordinates3d = pd.DataFrame({'geometry': tridimensional_coordinates, 'id': ids_tridimensional_coordinates}) if len(tridimensional_coordinates) > 0 and len(ids_tridimensional_coordinates) > 0 else None

        return {'objects': gdf, 'coordinates': gdf_coordinates, 'coordinates3d': df_coordinates3d}

    def break_into_binary(self, filepath, filename, data, types, dataTypes):

        transformed_data = data


        #create binary file
        fout = open(os.path.join(filepath, filename+'_blob.data'), 'wb')
        fout.close()
        
        #write binary data in .data files
        for index, type in enumerate(types):

            readCoords = 0

            floatList = []

            for i in range(len(transformed_data['data'])):
                geometry = transformed_data['data'][i]['geometry']

                newValue = [readCoords, len(geometry[type])] # where this vector starts and its size

                readCoords += len(geometry[type])

                floatList += geometry[type].copy()

                # geometry[type] = newValue

                transformed_data['data'][i]['geometry'][type] = newValue

            fout = open(os.path.join(filepath, filename+'_blob.data'), 'ab')

            buf = struct.pack(str(len(floatList)) + dataTypes[index], *floatList)

            print(f'type of {type} is {dataTypes[index]}')
            buf_size = struct.pack(dataTypes[index], len(floatList))
            # lol2
            fout.write(f'<<>>'.encode('utf-8'))
            # fout.write(buf_size)       ---no longer needed
            fout.write(buf)
            fout.close()

            utk_out = open(os.path.join(filepath, filename+'.utk'), 'w')
            utk_out.write(f'{type},{len(floatList)}')
            utk_out.close()
            # blob_size += floatList

        json_object = json.dumps(transformed_data)


        with open(os.path.join(filepath,filename+".json"), "w") as outfile:
            outfile.write(json_object)

        # print(f'trax data -> {transformed_data}')

        with open(os.path.join(filepath,filename+".json"), "r") as readfile:
            json_data = json.load(readfile)

        utk_handler = UTKFileHandler()
        attribute_dict = utk_handler.create_attribute_dict(json_data)
        # print(f'attricute_dict -> {attribute_dict}')
        utk_handler.create_utk_binary(attribute_dict=attribute_dict, df=json_data, utk_filename=filename, filepath=filepath)

        # Read existing content of the file
        with open(os.path.join(filepath, filename+'_blob.data'), 'rb') as existing_file:
            existing_data = existing_file.read()

        utk_file = open(os.path.join(filepath, filename+'.utk'), 'a')
        utk_file.write("Raw Binary Data Sizes\n")

        with open(os.path.join(filepath, filename+'_blob.data'), 'wb') as binary_blob_file:
            # binary_blob_file.seek(0)
            counter = 0
            ptr_layer_count = 0
            total_layer_count = 0
            for layer, values in attribute_dict.items():
                layer_size = len(values)
                if layer_size > 0:
                    if layer in ['orientedEnvelope', 'sectionFootprint', 'discardFuncInterval', 'values']:
                        buf = struct.pack(str(layer_size)+'d', *values)
                        dtype = "d"
                    else:
                        buf = struct.pack(str(layer_size)+'I', *values)
                        if layer in ['indices', 'ids']:
                            layerType = 'I'
                        elif layer == 'coordinates':
                            layerType = 'd'
                        elif layer == 'normals':
                            layerType = 'f'
                        ptr_layer_count += 1
                        utk_file.write(layer + ',' + layerType + '\n')


                    # binary_blob_file.write(f'|||||{layer}'.encode('utf-8'))
                    # binary_blob_file.write(f'|||||{layer_size}'.encode('utf-8'))
                    # binary_blob_file.write(f'|||||{dtype}'.encode('utf-8'))
                    # binary_blob_file.write(f'|||||'.encode('utf-8'))
                    binary_blob_file.write(f'<<>>'.encode('utf-8'))
                    binary_blob_file.write(buf)
                    # binary_blob_file.write(f'|||||'.encode('utf-8'))

                    ##########



##############      TRY THIS OUT, label pointer data vals(coords, .....section footprint) 




                    ############
                    counter += layer_size+1
                if len(values) > 0: total_layer_count += 1
            
            binary_blob_file.write('RAW BINARY BLOB SEPARATOR'.encode('utf-8'))
            # binary_blob_file.write(f'{len(types)}'.encode('utf-8'))

            binary_blob_file.write(existing_data)
            binary_blob_file.close()

        # # Read existing content of the file
        # with open(os.path.join(filepath, filename+'_blob.data'), 'rb') as existing_file:
        #     existing_data = existing_file.read()


        # with open(os.path.join(filepath, filename+'_blob.data'), 'r+') as binary_blob_file:
        #     # binary_blob_file.seek(0)
        #     binary_blob_file.write(f'{counter},')
        #     binary_blob_file.write(f'{total_layer_count},')
        #     binary_blob_file.write(f'{ptr_layer_count}')
        #     binary_blob_file.write(f'POINTER DATA')
        #     binary_blob_file.close()
        



    def save(self, dir=None, includeGrammar=True):

        if(self.workDir == None and dir == None):
            raise Exception("Directory not specified")

        workDir = None

        if(dir != None):
            # workDir = os.path.join(os.pardir,os.pardir,os.pardir,'public/data',dir)
            workDir = dir
            if(self.workDir == None):
                self.set_work_dir(dir)
        else:
            workDir = self.workDir


        # create dir
        if(os.path.exists(self.workDir) == False):
            os.makedirs(self.workDir)

        grammar_json = {
            "components": [
                {
                    "map": {
                        "camera": self.camera,
                        "knots": [],
                        "interactions": []
                    },
                    "plots": [],
                    "knots": [],
                    "position": {
                        "width": [
                            6,
                            12
                        ],
                        "height": [
                            1,
                            4
                        ]
                    },
                    "widgets": [
                        {
                            "type": "TOGGLE_KNOT"
                        },
                        {
                            "type": "SEARCH"
                        }
                    ],
                    "position": {
                        "width": [
                            6,
                            12
                        ],
                        "height": [
                            1,
                            4
                        ]
                    }
                },
            ],
            "grid": {
                "width": 12,
                "height": 4
            },
            "grammar_position": {
                "width": [
                    1,
                    5
                ],
                "height": [
                    1,
                    4
                ]
            }
        }
        
        for layer in self.layers['json']:

            grammar_json['components'][0]['knots'].append({"id": "pure"+layer['id'], "integration_scheme": [{"out": {"name": layer['id'], "level": "OBJECTS"}}], "operation": "NONE"})
            grammar_json['components'][0]['map']['knots'].append("pure"+layer['id'])
            grammar_json['components'][0]['map']['interactions'].append("NONE")

            if('data' in layer): # if it is not an abstract layer

                types = []
                dataTypes = []

                if('coordinates' in layer['data'][0]['geometry']):
                    types.append("coordinates")
                    dataTypes.append("d")

                if('normals' in layer['data'][0]['geometry']):
                    types.append("normals")
                    dataTypes.append("f")

                if('indices' in layer['data'][0]['geometry']):
                    types.append("indices")
                    dataTypes.append("I")

                if('ids' in layer['data'][0]['geometry']):
                    types.append("ids")
                    dataTypes.append("I")

                self.break_into_binary(workDir, layer['id'], layer, types, dataTypes)

        if(includeGrammar):
            grammar_json_str = str(json.dumps(grammar_json, indent=4))
            with open(os.path.join(workDir,"grammar.json"), "w", encoding="utf-8") as f:
                f.write(grammar_json_str)

    def view(self):

        website = "http://localhost:5001/"
        # Open url in a new window of the default browser, if possible
        webbrowser.open_new(website)
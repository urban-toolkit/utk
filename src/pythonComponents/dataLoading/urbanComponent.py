import json
import asyncio
import geopandas as gpd
import pandas as pd
import numpy as np
import os
import struct

from ipykernel.comm import Comm
from shapely.geometry import Polygon, Point
from scipy.spatial import KDTree

# import urbantk.io.osm as osm

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

    def setWorkDir(self, directory):
        self.workDir = directory

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

                ids.append(id)

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

    def addLayerFromJsonFile(self, json_pathfile, gdf=None, abstract=False):
        layer_json = []
        layer_gdf = gdf

        coordinates = []
        normals = []
        indices = []
        ids = []

        with open(json_pathfile, "r", encoding="utf-8") as f:
            layer_json = json.load(f)

        if(not abstract):

            directory = os.path.dirname(json_pathfile)

            # file name with extension
            file_name = os.path.basename(json_pathfile)
            # file name without extension
            file_name_wo_extension = os.path.splitext(file_name)[0]

            if('coordinates' in layer_json['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_coordinates.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('d', data)

                for elem in unpacked_data:
                    coordinates.append(elem[0])

                f.close()
            if('normals' in layer_json['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_normals.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('f', data)

                for elem in unpacked_data:
                    normals.append(elem[0])

                f.close()
            if('indices' in layer_json['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_indices.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('I', data)

                for elem in unpacked_data:
                    indices.append(elem[0])

                f.close()
            if('ids' in layer_json['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_ids.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('I', data)

                for elem in unpacked_data:
                    ids.append(elem[0])

                f.close()

            for i in range(len(layer_json['data'])):

                if(len(coordinates) > 0):
                    startAndSize = layer_json['data'][i]['geometry']['coordinates']
                    layer_json['data'][i]['geometry']['coordinates'] = coordinates[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(indices) > 0):
                    startAndSize = layer_json['data'][i]['geometry']['indices']
                    layer_json['data'][i]['geometry']['indices'] = indices[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(normals) > 0):
                    startAndSize = layer_json['data'][i]['geometry']['normals']
                    layer_json['data'][i]['geometry']['normals'] = normals[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(ids) > 0):
                    startAndSize = layer_json['data'][i]['geometry']['ids']
                    layer_json['data'][i]['geometry']['ids'] = ids[startAndSize[0]:startAndSize[0]+startAndSize[1]]

        if(layer_gdf == None):
            layer_gdf = self.jsonToGdf(layer_json, None, abstract)

        self.layers['json'].append(layer_json)
        self.layers['gdf']['objects'].append(layer_gdf['objects'])
        self.layers['gdf']['coordinates'].append(layer_gdf['coordinates'])
        self.layers['gdf']['coordinates3d'].append(layer_gdf['coordinates3d'])

    def addLayer(self, json_data, dim=None, gdf=None, abstract=False):
        layer_gdf = gdf
        
        if(layer_gdf == None):
            if(dim != None):
                layer_gdf = self.jsonToGdf(json_data, dim, abstract)
            else:
                raise Exception("If gdf data is not provided, the coordinates dimensions must be provided so the gdf can be calculated")

        self.layers['json'].append(json_data)
        self.layers['gdf']['objects'].append(layer_gdf['objects'])
        self.layers['gdf']['coordinates'].append(layer_gdf['coordinates'])
        self.layers['gdf']['coordinates3d'].append(layer_gdf['coordinates3d'])

    def attachAbstractToPhysical(self, id_physical_layer, id_abstract_layer, left_level='coordinates3d', right_level='coordinates3d', predicate='nearest', aggregation='avg', max_distance=-1, default_value=0):
        '''
            Link one abstract layer to a physical layer considering a specific predicate: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates) 
            or direct (attach following the order)
        
            An aggregation function must be specified: avg, max, min, sum. The aggregation function will only be used when there is more than one match

            When an abstract layer is merged with a physical layer the joinedObjects are the attribute values and not ids of joined elements
        '''

        return self.attachLayers(id_physical_layer, id_abstract_layer, predicate, left_level=left_level, right_level=right_level, abstract=True, aggregation=aggregation, max_distance=max_distance, default_value=default_value)

    def attachPhysicalLayers(self, id_left_layer, id_right_layer, predicate='intersects', left_level='objects', right_level='objects', max_distance=-1, default_value=0):
        '''
            The predicates can be: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates)

            The levels can be: coordinates, coordinates3d, objects.

            The attaching include the ids of the geometries of the right layer into the left layer considering the specified predicate
        '''
        
        return self.attachLayers(id_left_layer, id_right_layer, predicate, left_level, right_level, max_distance=max_distance, default_value=default_value)

    def loadJoinedJson(self, id_layer):
        '''
            Load the json file with the joined layers

            Directory: where the json files are stored.
        '''

        if(self.workDir == None):
            raise Exception("Error loading joined json workDir not configure")

        filePath = os.path.join(self.workDir, id_layer+"_joined.json")

        fileExists = os.path.exists(filePath)

        joinedJson = {}

        if(fileExists):
            with open(filePath, "r", encoding="utf-8") as f:
                joinedJson = json.load(f)

        return joinedJson

    def existsJoin(self, thisLayer, otherLayer, predicate, thisLevel, otherLevel, abstract):
        if(self.workDir == None):
            raise Exception("Error checking existance of join workDir not configure")

        joinedJson = self.loadJoinedJson(thisLayer)

        if("joinedLayers" not in joinedJson):
            return False

        for link in joinedJson["joinedLayers"]:
            found = True

            if("predicate" not in link or link["predicate"] != predicate):
                found = False
                continue
            if("layerId" not in link or link["layerId"] != otherLayer):
                found = False
                continue
            if("thisLevel" not in link or link["thisLevel"] != thisLevel):
                found = False
                continue
            if("otherLevel" not in link or link["otherLevel"] != otherLevel):
                found = False
                continue
            if("abstract" not in link or link["abstract"] != abstract):
                found = False
                continue

            if(found):
                return True

        return False

    def attachLayers(self, id_left_layer, id_right_layer, predicate='intersects', left_level='objects', right_level='objects', abstract=False, aggregation='avg', max_distance=-1, default_value=0):
        '''
            Tridimensional indicates if the attaching should be done considering 3D geometries.
        '''

        if((left_level == 'coordinates3d' and right_level != 'coordinates3d') or (left_level != 'coordinates3d' and right_level == 'coordinates3d')):
            raise Exception("3d coordinates can only be attached to 3d coordinates")
            
        if(left_level == 'coordinates3d' and (predicate != 'nearest' and predicate != 'direct')):
            raise Exception("The predicate "+predicate+" is not supported for tridimensional geometries yet")

        if(predicate != "nearest" and max_distance != -1):
            raise Exception("The max_distance field can only be used with the nearest predicate")

        left_layer_json = {}

        left_layer_gdf = {}
        left_layer_found = False
        right_layer_gdf = {}
        right_layer_found = False

        for i in range(len(self.layers['json'])):
            if self.layers['json'][i]['id'] == id_left_layer:
                left_layer_json = self.layers['json'][i]
                left_layer_gdf = self.layers['gdf'][left_level][i]
                left_layer_found = True
            elif self.layers['json'][i]['id'] == id_right_layer:
                right_layer_gdf = self.layers['gdf'][right_level][i]
                right_layer_found = True

        if(left_layer_found == False or right_layer_found == False):
            raise Exception("Left and/or right layer(s) not found")

        if(not(isinstance(left_layer_gdf, pd.DataFrame)) or not(isinstance(right_layer_gdf, pd.DataFrame))):
            raise Exception("Left and/or right layer(s) do(es) not have a 3d representation")

        left_layer_joined_json = self.loadJoinedJson(id_left_layer)

        alreadyExistingJoinedIndex = -1

        if('joinedLayers' in left_layer_joined_json):
            for index, join in enumerate(left_layer_joined_json['joinedLayers']):
                if(join['predicate'] == predicate.upper() and join['layerId'] == id_right_layer and join['thisLevel'] == left_level.upper() and join['otherLevel'] == right_level.upper() and join['abstract'] == abstract): # if this attachment was already made
                    alreadyExistingJoinedIndex = index
                    break

        join_left_gdf = {}

        if(predicate == 'direct'):

            join_left_gdf = left_layer_gdf.copy(deep=True)

            if(abstract):
                join_left_gdf['value_right'] = np.nan
            else:
                join_left_gdf['id_right'] = np.nan

            for index in range(len(join_left_gdf.index)):
                if(abstract):
                    join_left_gdf.loc[index, 'value_right'] = right_layer_gdf.loc[index, 'value']
                else:
                    join_left_gdf.loc[index, 'id_right'] = right_layer_gdf.loc[index, 'id']
        else:
            if(left_level != 'coordinates3d'): # if it is not tridimensional geopandas can be used
                if(predicate == 'nearest'):
                    if(max_distance == -1):
                        join_left_gdf = gpd.sjoin_nearest(left_layer_gdf, right_layer_gdf, how='left')
                    else:
                        join_left_gdf = gpd.sjoin_nearest(left_layer_gdf, right_layer_gdf, how='left', max_distance=max_distance)
                elif(predicate == 'direct'):
                    join_left_gdf = left_layer_gdf.copy(deep=True)
                else:
                    join_left_gdf = left_layer_gdf.sjoin(right_layer_gdf, how='left', predicate=predicate)
            else: 

                join_left_gdf = left_layer_gdf.copy(deep=True)

                if(abstract):
                    join_left_gdf['value_right'] = np.nan
                else:
                    join_left_gdf['id_right'] = np.nan

                left_coords = np.array([list(elem) for elem in left_layer_gdf['geometry'].values])
                left_coords = np.reshape(left_coords, (-1,3))

                right_coords = np.array([list(elem) for elem in right_layer_gdf['geometry'].values])
                right_coords = np.reshape(right_coords, (-1,3))

                kdtree=KDTree(right_coords)

                if(max_distance == -1):
                    dist,points = kdtree.query(left_coords,1) # 1 best neighbor for the sample candidates
                else:
                    print("distance_upper_bound", max_distance)
                    dist,points = kdtree.query(left_coords,1,distance_upper_bound=float(max_distance)) # 1 best neighbor for the sample candidates

                for index, point in enumerate(points):
                    if(abstract):
                        if(len(right_layer_gdf.axes[0]) <= point):
                            print("points outside maxDistance")
                            join_left_gdf.loc[index, 'value_right'] = default_value
                        else:
                            join_left_gdf.loc[index, 'value_right'] = right_layer_gdf.loc[point, 'value']
                    else:
                        join_left_gdf.loc[index, 'id_right'] = right_layer_gdf.loc[point, 'id']

        if(alreadyExistingJoinedIndex == -1): # if it is a new join
            if('joinedLayers' in left_layer_joined_json):
                left_layer_joined_json['joinedLayers'].append({"predicate": predicate.upper(), "layerId": id_right_layer, "thisLevel": left_level.upper(), "otherLevel": right_level.upper(), "abstract": abstract})
            else:
                left_layer_joined_json['joinedLayers'] = [{"predicate": predicate.upper(), "layerId": id_right_layer, "thisLevel": left_level.upper(), "otherLevel": right_level.upper(), "abstract": abstract}]

        joined_objects_entry = {}

        if(alreadyExistingJoinedIndex == -1):
            alreadyExistingJoinedIndex = len(left_layer_joined_json['joinedLayers'])-1

        if(not abstract):
            joined_objects_entry = {"joinedLayerIndex": alreadyExistingJoinedIndex, "otherIds": [None]*len(left_layer_gdf.index)}
        else: # the join with abstract layers carry values, not ids
            joined_objects_entry = {"joinedLayerIndex": alreadyExistingJoinedIndex, "otherValues": [None]*len(left_layer_gdf.index)}

        replace = -1

        if('joinedObjects' not in left_layer_joined_json):
            left_layer_joined_json['joinedObjects'] = [joined_objects_entry]
        else:

            for index, joinedObject in enumerate(left_layer_joined_json['joinedObjects']):
                if(joinedObject['joinedLayerIndex'] == alreadyExistingJoinedIndex):
                    replace = index

            if(replace != -1): # if it is just an update
                left_layer_joined_json['joinedObjects'][replace] = joined_objects_entry
            else: # if it is a brand new join
                left_layer_joined_json['joinedObjects'].append(joined_objects_entry)

        if('id_left' not in join_left_gdf.columns):
            join_left_gdf = join_left_gdf.rename(columns={'id': 'id_left'})

        if('value_right' not in join_left_gdf.columns):
            join_left_gdf = join_left_gdf.rename(columns={'value': 'value_right'})

        for elem in join_left_gdf.iloc:

            if(not abstract):
                if(not pd.isna(elem['id_right'])):
                    if(left_layer_joined_json['joinedObjects'][replace]['otherIds'][int(elem['id_left'])] == None):
                        left_layer_joined_json['joinedObjects'][replace]['otherIds'][int(elem['id_left'])] = []

                    left_layer_joined_json['joinedObjects'][replace]['otherIds'][int(elem['id_left'])].append(int(elem['id_right']))
            else:
                if(not pd.isna(elem['value_right'])):
                    if(left_layer_joined_json['joinedObjects'][replace]['otherValues'][int(elem['id_left'])] == None):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][int(elem['id_left'])] = []

                    left_layer_joined_json['joinedObjects'][replace]['otherValues'][int(elem['id_left'])].append(elem['value_right'])

        if(abstract): # agregate values
            for i in range(len(left_layer_joined_json['joinedObjects'][replace]['otherValues'])):

                if(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] == None):
                    left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = [0] # TODO: let the user defined default value

                if(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] != None):
                    if(aggregation == 'discard'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = left_layer_joined_json['joinedObjects'][replace]['otherValues'][i][0]
                    elif(aggregation == 'max'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = max(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])
                    elif(aggregation == 'min'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = min(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])
                    elif(aggregation == 'sum'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = sum(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])
                    elif(aggregation == 'avg'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = sum(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])/len(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])
                    elif(aggregation == 'count'):
                        left_layer_joined_json['joinedObjects'][replace]['otherValues'][i] = len(left_layer_joined_json['joinedObjects'][replace]['otherValues'][i])

        # if(id_left_layer+"_joined" not in self.joinedJson):
        self.joinedJson[id_left_layer+"_joined"] = left_layer_joined_json

        return join_left_gdf

    def break_into_binary(self, filepath, filename, data, types, dataTypes):

        for index, type in enumerate(types):

            readCoords = 0

            floatList = []

            for i in range(len(data['data'])):
                geometry = data['data'][i]['geometry']

                newValue = [readCoords, len(geometry[type])] # where this vector starts and its size

                readCoords += len(geometry[type])

                floatList += geometry[type].copy()

                geometry[type] = newValue

            fout = open(os.path.join(filepath,filename+'_'+type+'.data'), 'wb')

            buf = struct.pack(str(len(floatList))+dataTypes[index], *floatList)

            fout.write(buf)
            fout.close()

            json_object = json.dumps(data)

            with open(os.path.join(filepath,filename+".json"), "w") as outfile:
                outfile.write(json_object)

    def to_file(self, filepath, separateFiles=False, includeGrammar=True):
        '''
            If separateFiles is true. filepath must be an existing directory.
            If running with separateFiles = True, this are the resulting files:
            grammar.json
            building -> buildings.json
            camera -> camera.json
            coastline -> coastline.json
            water -> water.json
            surface -> surface.json
            parks -> parks.json
            roads -> roads.json
            routes -> routes.json
        '''

        if(separateFiles):
            if(os.path.isdir(filepath)):
                grammar_json = {
                    "views": [
                        {
                            "map": {
                                "camera": self.camera,
                                "knots": [],
                                "interactions": []
                            },
                            "plots": [],
                            "knots": []            
                        }
                    ],
                    "arrangement": "LINKED"
                }

                for layer in self.layers['json']:

                    grammar_json['views'][0]['knots'].append({"id": "pure"+layer['id'], "linkingScheme": [{"thisLayer": layer['id']}], "aggregationScheme": ["NONE"]})
                    grammar_json['views'][0]['map']['knots'].append("pure"+layer['id'])
                    grammar_json['views'][0]['map']['interactions'].append("NONE")

                    if('data' in layer and includeGrammar): # if it is not an abstract layer

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

                        self.break_into_binary(filepath, layer['id'], layer, types, dataTypes)

                if(includeGrammar):
                    grammar_json_str = str(json.dumps(grammar_json, indent=4))
                    with open(os.path.join(filepath,"grammar.json"), "w", encoding="utf-8") as f:
                        f.write(grammar_json_str)

                for fileName in self.joinedJson:
                    with open(os.path.join(filepath,fileName+".json"), "w", encoding="utf-8") as f:
                        joined_json_str = str(json.dumps(self.joinedJson[fileName]))
                        f.write(joined_json_str)

            else:
                raise Exception("separateFiles is true but filepath does not point to an existing directory")

        else:
            raise Exception("to_file can only be used with separate files")


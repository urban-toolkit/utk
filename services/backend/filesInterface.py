import json
import geopandas as gpd
import pandas as pd
import numpy as np
import os
import struct

from scipy.spatial import KDTree

class FilesInterface:
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

    def setWorkDir(self, dir):
        self.workDir = dir

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

    def attachAbstractToPhysical(self, id_physical_layer, id_abstract_layer, left_level='coordinates3d', right_level='coordinates3d', spatial_relation='nearest', operation='avg', max_distance=-1, default_value=0):
        '''
            Link one abstract layer to a physical layer considering a specific spatial_relation: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates) 
            or direct (attach following the order)
        
            An operation function must be specified: avg, max, min, sum. The operation function will only be used when there is more than one match

            When an abstract layer is merged with a physical layer the joinedObjects are the attribute values and not ids of joined elements
        '''

        return self.attachLayers(id_physical_layer, id_abstract_layer, spatial_relation, left_level=left_level, right_level=right_level, abstract=True, operation=operation, max_distance=max_distance, default_value=default_value)

    def attachPhysicalLayers(self, id_left_layer, id_right_layer, spatial_relation='intersects', left_level='objects', right_level='objects', max_distance=-1, default_value=0):
        '''
            The spatial_relation can be: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates)

            The levels can be: coordinates, coordinates3d, objects.

            The attaching include the ids of the geometries of the right layer into the left layer considering the specified spatial_relation
        '''
        
        return self.attachLayers(id_left_layer, id_right_layer, spatial_relation, left_level, right_level, max_distance=max_distance, default_value=default_value)

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

    def existsJoin(self, out, inData, spatial_relation, outLevel, inLevel, abstract):
        if(self.workDir == None):
            raise Exception("Error checking existance of join workDir not configure")

        joinedJson = self.loadJoinedJson(out)

        if("joinedLayers" not in joinedJson):
            return False

        for link in joinedJson["joinedLayers"]:
            found = True

            if("spatial_relation" not in link or link["spatial_relation"] != spatial_relation):
                found = False
                continue
            if("layerId" not in link or link["layerId"] != inData):
                found = False
                continue
            if("outLevel" not in link or link["outLevel"] != outLevel):
                found = False
                continue
            if("inLevel" not in link or link["inLevel"] != inLevel):
                found = False
                continue
            if("abstract" not in link or link["abstract"] != abstract):
                found = False
                continue

            if(found):
                return True

        return False

    def attachLayers(self, id_left_layer, id_right_layer, spatial_relation='intersects', left_level='objects', right_level='objects', abstract=False, operation='avg', max_distance=-1, default_value=0):
        '''
            Tridimensional indicates if the attaching should be done considering 3D geometries.
        '''

        if((left_level == 'coordinates3d' and right_level != 'coordinates3d') or (left_level != 'coordinates3d' and right_level == 'coordinates3d')):
            raise Exception("3d coordinates can only be attached to 3d coordinates")
            
        if(left_level == 'coordinates3d' and (spatial_relation != 'nearest' and spatial_relation != 'direct')):
            raise Exception("The spatial_relation "+spatial_relation+" is not supported for tridimensional geometries yet")

        if(spatial_relation != "nearest" and max_distance != -1):
            raise Exception("The max_distance field can only be used with the nearest spatial_relation")

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
                if(join['spatial_relation'] == spatial_relation.upper() and join['layerId'] == id_right_layer and join['outLevel'] == left_level.upper() and join['inLevel'] == right_level.upper() and join['abstract'] == abstract): # if this attachment was already made
                    alreadyExistingJoinedIndex = index
                    break

        join_left_gdf = {}

        if(spatial_relation == 'direct'):

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
                if(spatial_relation == 'nearest'):
                    if(max_distance == -1):
                        join_left_gdf = gpd.sjoin_nearest(left_layer_gdf, right_layer_gdf, how='left')
                    else:
                        join_left_gdf = gpd.sjoin_nearest(left_layer_gdf, right_layer_gdf, how='left', max_distance=max_distance)
                elif(spatial_relation == 'direct'):
                    join_left_gdf = left_layer_gdf.copy(deep=True)
                else:
                    join_left_gdf = left_layer_gdf.sjoin(right_layer_gdf, how='left', predicate=spatial_relation)
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
                left_layer_joined_json['joinedLayers'].append({"spatial_relation": spatial_relation.upper(), "layerId": id_right_layer, "outLevel": left_level.upper(), "inLevel": right_level.upper(), "abstract": abstract})
            else:
                left_layer_joined_json['joinedLayers'] = [{"spatial_relation": spatial_relation.upper(), "layerId": id_right_layer, "outLevel": left_level.upper(), "inLevel": right_level.upper(), "abstract": abstract}]

        joined_objects_entry = {}

        if(alreadyExistingJoinedIndex == -1):
            alreadyExistingJoinedIndex = len(left_layer_joined_json['joinedLayers'])-1

        if(not abstract):
            joined_objects_entry = {"joinedLayerIndex": alreadyExistingJoinedIndex, "inIds": [None]*len(left_layer_gdf.index)}
        else: # the join with abstract layers carry values, not ids
            joined_objects_entry = {"joinedLayerIndex": alreadyExistingJoinedIndex, "inValues": [None]*len(left_layer_gdf.index)}

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
                    if(left_layer_joined_json['joinedObjects'][replace]['inIds'][int(elem['id_left'])] == None):
                        left_layer_joined_json['joinedObjects'][replace]['inIds'][int(elem['id_left'])] = []

                    left_layer_joined_json['joinedObjects'][replace]['inIds'][int(elem['id_left'])].append(int(elem['id_right']))
            else:
                if(not pd.isna(elem['value_right'])):
                    if(left_layer_joined_json['joinedObjects'][replace]['inValues'][int(elem['id_left'])] == None):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][int(elem['id_left'])] = []

                    left_layer_joined_json['joinedObjects'][replace]['inValues'][int(elem['id_left'])].append(elem['value_right'])

        if(abstract): # agregate values
            for i in range(len(left_layer_joined_json['joinedObjects'][replace]['inValues'])):

                if(left_layer_joined_json['joinedObjects'][replace]['inValues'][i] == None):
                    left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = [0] # TODO: let the user defined default value

                if(left_layer_joined_json['joinedObjects'][replace]['inValues'][i] != None):
                    if(operation == 'discard'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = left_layer_joined_json['joinedObjects'][replace]['inValues'][i][0]
                    elif(operation == 'max'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = max(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])
                    elif(operation == 'min'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = min(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])
                    elif(operation == 'sum'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = sum(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])
                    elif(operation == 'avg'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = sum(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])/len(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])
                    elif(operation == 'count'):
                        left_layer_joined_json['joinedObjects'][replace]['inValues'][i] = len(left_layer_joined_json['joinedObjects'][replace]['inValues'][i])

        # if(id_left_layer+"_joined" not in self.joinedJson):
        self.joinedJson[id_left_layer+"_joined"] = left_layer_joined_json

        return join_left_gdf

    def saveJoined(self, dir=None):

        if(dir == None):
            raise Exception("Directory not specified")

        for fileName in self.joinedJson:
            with open(os.path.join(dir,fileName+".json"), "w", encoding="utf-8") as f:
                joined_json_str = str(json.dumps(self.joinedJson[fileName]))
                f.write(joined_json_str)
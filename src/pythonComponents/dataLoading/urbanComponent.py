import os
import json
import asyncio
import geopandas as gpd
import pandas as pd
import numpy as np

from ipykernel.comm import Comm
from shapely.geometry import Polygon, Point
from scipy.spatial import KDTree

import map
# import urbantk.io.osm as osm

class UrbanComponent:
    """
    Basic Urban Toolkit component
    """

    cid = None
    style = {}
    layers = {'json': [], 'gdf': {'objects': [], 'coordinates': [], 'coordinates3d': []}}
    camera = {}
    bbox = []

    def __init__(self, cid = 'map', filepath = None, layers = None, camera = None, bbox = None):
        if filepath != None:
            self.from_file(filepath)
        self.cid = cid
        if layers != None:
            self.layers = layers
        if camera != None:
            self.camera = camera
        if bbox != None:
            self.bbox = bbox

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

        if(not abstract):
            for id, elem in enumerate(layer_json['data']):

                ids.append(id)

                groupedCoordinates = []

                polygon_coordinates = None

                if('sectionFootprint' in elem['geometry']):
                    polygon_coordinates = elem['geometry']['sectionFootprint'][0] # used for buildings
                else:
                    polygon_coordinates = elem['geometry']['coordinates']

                for i in range(0,int(len(polygon_coordinates)/dim)):
                    geometries_coordinates.append(Point(polygon_coordinates[i*dim], polygon_coordinates[i*dim+1]))
                    ids_coordinates.append(counter_id_coordinates)
                    counter_id_coordinates += 1
                    
                    groupedCoordinates.append((polygon_coordinates[i*dim], polygon_coordinates[i*dim+1]))

                    if(dim == 3 and 'sectionFootprint' not in elem['geometry']): # if it has a 3d representation and it is not a building
                        tridimensional_coordinates.append([polygon_coordinates[i*dim], polygon_coordinates[i*dim+1], polygon_coordinates[i*dim+2]])
                        ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)        
                        counter_id_tridimensional_coordinates += 1  

                if('sectionFootprint' in elem['geometry']): # it is a building so a 3d representation must be included (it comes from the coordinates field)
                    for i in range(0,int(len(elem['geometry']['coordinates'])/3)):
                        tridimensional_coordinates.append([elem['geometry']['coordinates'][i*3], elem['geometry']['coordinates'][i*3+1], elem['geometry']['coordinates'][i*3+2]])
                        ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)        
                        counter_id_tridimensional_coordinates += 1  

                geometries.append(Polygon(groupedCoordinates))
        else:
            for i in range(0,int(len(layer_json['coordinates'])/dim)):
                
                values_coordinates.append(layer_json['values'][i])
                geometries_coordinates.append(Point(layer_json['coordinates'][i*dim], layer_json['coordinates'][i*dim+1]))

                if(dim == 3):
                    tridimensional_coordinates.append([layer_json['coordinates'][i*dim], layer_json['coordinates'][i*dim+1], layer_json['coordinates'][i*dim+2]])
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

    def addLayerFromJsonFile(self, json_pathfile, dim=None, gdf=None, abstract=False):
        layer_json = []
        layer_gdf = gdf

        with open(json_pathfile, "r", encoding="utf-8") as f:
            layer_json = json.load(f)

        if(layer_gdf == None):
            if(dim != None):
                layer_gdf = self.jsonToGdf(layer_json, dim, abstract)
            else:
                raise Exception("If gdf data is not provided, the coordinates dimensions must be provided so the gdf can be calculated")

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

    def attachAbstractToPhysical(self, id_physical_layer, id_abstract_layer, level='coordinates3d', predicate='nearest', aggregation='avg'):
        '''
            Link one abstract layer to a physical layer considering a specific predicate: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates)
        
            An aggregation function must be specified: avg, max, min, sum. The aggregation function will only be used when there is more than one match

            Levels supported: coordinates, coordinates3d. They are the same for the abstract and physical layers

            When an abstract layer is merged with a physical layer the joined_objects are the attribute values and not ids of joined elements
        '''

        return self.attachLayers(id_physical_layer, id_abstract_layer, predicate, left_level=level, right_level=level, abstract=True, aggregation=aggregation)

    def attachPhysicalLayers(self, id_left_layer, id_right_layer, predicate='intersects', left_level='objects', right_level='objects'):
        '''
            The predicates can be: intersects, contains, within, touches, crosses, overlaps, nearest (geopandas predicates)

            The levels can be: coordinates, coordinates3d, objects.

            The attaching include the ids of the geometries of the right layer into the left layer considering the specified predicate
        '''
        
        return self.attachLayers(id_left_layer, id_right_layer, predicate, left_level, right_level)

    def attachLayers(self, id_left_layer, id_right_layer, predicate='intersects', left_level='objects', right_level='objects', abstract=False, aggregation='avg'):
        '''
            Tridimensional indicates if the attaching should be done considering 3D geometries.
        '''

        if((left_level == 'coordinates3d' and right_level != 'coordinates3d') or (left_level != 'coordinates3d' and right_level == 'coordinates3d')):
            raise Exception("3d coordinates can only be attached to 3d coordinates")
            
        if(left_level == 'coordinates3d' and predicate != 'nearest'):
            raise Exception("The predicate "+predicate+" is not supported for tridimensional geometries yet")

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

        if('joined_layers' in left_layer_json):
            for join in left_layer_json['joined_layers']:
                if(join['predicate'] == predicate and join['layer_id'] == id_right_layer and join['this_level'] == left_level and join['other_level'] == right_level and join['abstract'] == abstract): # if this attachment was already made
                    return

        join_left_gdf = {}

        if(left_level != 'coordinates3d'): # if it is not tridimensional geopandas can be used
            if(predicate == 'nearest'):
                join_left_gdf = gpd.sjoin_nearest(left_layer_gdf, right_layer_gdf, how='left')
            else:
                join_left_gdf = left_layer_gdf.sjoin(right_layer_gdf, how='left', predicate=predicate)
        else:
            left_coords = np.array([list(elem) for elem in left_layer_gdf['geometry'].values])
            left_coords = np.reshape(left_coords, (-1,3))

            right_coords = np.array([list(elem) for elem in left_layer_gdf['geometry'].values])
            right_coords = np.reshape(right_coords, (-1,3))

            kdtree=KDTree(left_coords)

            dist,points = kdtree.query(right_coords,1) # 1 best neighbor for the sample candidates

            join_left_gdf = left_layer_gdf.copy(deep=True)

            if(abstract):
                join_left_gdf['value_right'] = np.nan
            else:
                join_left_gdf['id_right'] = np.nan

            for index, point in enumerate(points):
                if(abstract):
                    join_left_gdf.loc[index, 'value_right'] = right_layer_gdf.loc[point, 'value']
                else:
                    join_left_gdf.loc[index, 'id_right'] = right_layer_gdf.loc[point, 'id']

        if('joined_layers' in left_layer_json):
            left_layer_json['joined_layers'].append({"predicate": predicate, "layer_id": id_right_layer, "this_level": left_level, "other_level": right_level, "abstract": abstract})
        else:
            left_layer_json['joined_layers'] = [{"predicate": predicate, "layer_id": id_right_layer, "this_level": left_level, "other_level": right_level, "abstract": abstract}]

        joined_objects_entry = {}

        if(not abstract):
            joined_objects_entry = {"joined_layer_index": len(left_layer_json['joined_layers'])-1, "other_ids": [None]*len(left_layer_gdf.index)}
        else: # the join with abstract layers carry values, not ids
            joined_objects_entry = {"joined_layer_index": len(left_layer_json['joined_layers'])-1, "other_values": [None]*len(left_layer_gdf.index)}

        if('joined_objects' not in left_layer_json):
            left_layer_json['joined_objects'] = [joined_objects_entry]
        else:
            left_layer_json['joined_objects'].append(joined_objects_entry)

        for elem in join_left_gdf.iloc:

            if(not abstract):
                if(not pd.isna(elem['id_right'])):
                    if(left_layer_json['joined_objects'][-1]['other_ids'][int(elem['id'])] == None):
                        left_layer_json['joined_objects'][-1]['other_ids'][int(elem['id'])] = []

                    left_layer_json['joined_objects'][-1]['other_ids'][int(elem['id'])].append(int(elem['id_right']))
            else:
                if(not pd.isna(elem['value_right'])):
                    if(left_layer_json['joined_objects'][-1]['other_values'][int(elem['id'])] == None):
                        left_layer_json['joined_objects'][-1]['other_values'][int(elem['id'])] = []

                    left_layer_json['joined_objects'][-1]['other_values'][int(elem['id'])].append(int(elem['value_right']))

        if(abstract): # agregate values
            for i in range(len(left_layer_json['joined_objects'][-1]['other_values'])):
                if(left_layer_json['joined_objects'][-1]['other_values'][i] != None):
                    if(len(left_layer_json['joined_objects'][-1]['other_values'][i]) == 1):
                        left_layer_json['joined_objects'][-1]['other_values'][i] = left_layer_json['joined_objects'][-1]['other_values'][i][0]
                    elif(aggregation == 'max'):
                        left_layer_json['joined_objects'][-1]['other_values'][i] = max(left_layer_json['joined_objects'][-1]['other_values'][i])
                    elif(aggregation == 'min'):
                        left_layer_json['joined_objects'][-1]['other_values'][i] = min(left_layer_json['joined_objects'][-1]['other_values'][i])
                    elif(aggregation == 'sum'):
                        left_layer_json['joined_objects'][-1]['other_values'][i] = sum(left_layer_json['joined_objects'][-1]['other_values'][i])
                    elif(aggregation == 'avg'):
                        left_layer_json['joined_objects'][-1]['other_values'][i] = sum(left_layer_json['joined_objects'][-1]['other_values'][i])/len(left_layer_json['joined_objects'][-1]['other_values'][i])

        return join_left_gdf

    def to_file(self, filepath, separateFiles=False):
        '''
            If separateFiles is true. filepath must be an existing directory.
            If running with separateFiles = True, this are the resulting files:
            index.json
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
                index_json = {'cid': self.cid, 'layers': [], 'camera': 'camera'}

                for layer in self.layers['json']:
                    index_json['layers'].append(layer['id'])

                    layer_json_str = str(json.dumps(layer, indent=4))
                    with open(os.path.join(filepath,layer['id']+'.json'), "w") as f:
                        f.write(layer_json_str)

                camera_json_str = str(json.dumps(self.camera, indent=4))
                with open(os.path.join(filepath,"camera.json"), "w", encoding="utf-8") as f:
                    f.write(camera_json_str)

                index_json_str = str(json.dumps(index_json, indent=4))
                with open(os.path.join(filepath,"index.json"), "w", encoding="utf-8") as f:
                    f.write(index_json_str)

            else:
                raise Exception("separateFiles is true but filepath does not point to an existing directory")

        else:
            if not os.path.exists(os.path.dirname(filepath)):
                os.makedirs(os.path.dirname(filepath))

            outjson = {'cid': self.cid, 'style': self.style, 'layers': self.layers['json'], 'camera': self.camera, 'bbox': self.bbox}
            outjson_str = str(json.dumps(outjson))
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(outjson_str)

    def from_file(self, filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            injson = json.load(f)
            self.cid = injson['cid']
            self.style = injson['style']
            self.layers['json'] = injson['layers']
            self.camera = injson['camera']
            self.bbox = injson['bbox']
    
    async def task(self):
        data = {}
        data['layers'] = self.layers['json']
        data['camera'] = self.camera
        data['style'] = self.style
        
        filepath = os.path.dirname(os.path.realpath(__file__))
        with open('../../../public/data/bardata.json', 'r') as f:
            barData = json.load(f)

        with open('../../../public/data/scatterdata.json', 'r') as f:
            scatterData = json.load(f)
            
        with open('../../../public/data/heatData.json', 'r') as f:
            heatData = json.load(f)
            
        visData = {'bar': barData, 'scatter':scatterData, "heat": heatData, "city" : data}
        
        comm = Comm(target_name=self.cid+'_initMapView', data={})
        comm.send(visData)
        # comm.send(data)

    def view(self, width = '100%', height = '800px'):
        asyncio.ensure_future(self.task())
        return map.get_html(self.cid, width, height)
        
        # print('here')
        # await print('here 10')
        # return '10'
        # print('here 2')
        # try:
        #     return get_html(self.cid, self.layers['json'], self.camera, self.style, width, height)
        # finally:
        #     data = {}
        #     data['layers'] = self.layers['json']
        #     data['camera'] = self.camera
        #     data['style'] = self.style
        #     comm = Comm(target_name=self.cid, data={})
        #     comm.send(data)
                

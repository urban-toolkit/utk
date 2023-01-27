import os
import json
import asyncio
import geopandas as gpd

from ipykernel.comm import Comm
from shapely.geometry import Polygon

import map
# import urbantk.io.osm as osm

class UrbanComponent:
    """
    Basic Urban Toolkit component
    """

    cid = None
    style = {}
    layers = {'json': [], 'gdf': []}
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

    def jsonToGdf(self, layer_json, dim):

        geometries = []

        for elem in layer_json['data']:
            groupedCoordinates = []

            polygon_coordinates = None

            if('sectionFootprint' in elem['geometry']):
                polygon_coordinates = elem['geometry']['sectionFootprint'][0] # specially used for buildings
            else:
                polygon_coordinates = elem['geometry']['coordinates']

            for i in range(0,int(len(polygon_coordinates)/dim)):
                    
                groupedCoordinates.append((polygon_coordinates[dim*2], polygon_coordinates[dim*2+1]))

            geometries.append(Polygon(groupedCoordinates))

        gdf = gpd.GeoDataFrame({'geometry': geometries}, crs=3395)

        return gdf

    def addLayerFromJsonFile(self, json_pathfile, dim=None, gdf=None):
        layer_json = []
        layer_gdf = gdf

        with open(json_pathfile, "r", encoding="utf-8") as f:
            layer_json = json.load(f)

        if(layer_gdf == None):
            if(dim != None):
                layer_gdf = self.jsonToGdf(layer_json, dim)
            else:
                raise Exception("If gdf data is not provided, the coordinates dimensions must be provided so the gdf can be calculated")

        self.layers['json'].append(layer_json)
        self.layers['gdf'].append(layer_gdf)

    def addLayer(self, json_data, dim=None, gdf=None):
        layer_gdf = gdf
        
        if(layer_gdf == None):
            if(dim != None):
                layer_gdf = self.jsonToGdf(json_data, dim)
            else:
                raise Exception("If gdf data is not provided, the coordinates dimensions must be provided so the gdf can be calculated")

        self.layers['json'].append(json_data)
        self.layers['gdf'].append(layer_gdf)

    def attachLayers(self, id_contain_layer, id_contained_layer):
        
        contain_layer_json = {}
        contained_layer_json = {}

        contain_layer_gdf = {}
        contained_layer_gdf = {}

        for i in range(len(self.layers['json'])):
            if self.layers['json'][i]['id'] == id_contain_layer:
                contain_layer_json = self.layers['json'][i]
                contain_layer_gdf = self.layers['gdf'][i]
            elif self.layers['json'][i]['id'] == id_contained_layer:
                contained_layer_json = self.layers['json'][i]
                contained_layer_gdf = self.layers['gdf'][i]

        join_left_gdf = contain_layer_gdf.sjoin(contained_layer_gdf, how='left')

        # join_left_gdf.to_file('join_test.json', driver="GeoJSON")

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
                

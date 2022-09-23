import os
import json
import asyncio

from ipykernel.comm import Comm

import map 

class UrbanComponent:
    """
    Basic Urban Toolkit component
    """

    cid = None
    style = {}
    layers = {}
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
        

    # def add_layers(self, layers):
    #     loaded = osm.get_osm(self.bbox, layers, False)
    #     data = {}
    #     data['data'] = loaded
    #     comm = Comm(target_name=self.cid+'_addLayers', data={})
    #     comm.send(loaded[0])

    def remove_layers(self):
        pass

    def to_file(self, filepath):
        if not os.path.exists(os.path.dirname(filepath)):
            os.makedirs(os.path.dirname(filepath))
        outjson = {'cid': self.cid, 'style': self.style, 'layers': self.layers, 'camera': self.camera, 'bbox': self.bbox}
        outjson_str = str(json.dumps(outjson))
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(outjson_str)

    def from_file(self, filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            injson = json.load(f)
            self.cid = injson['cid']
            self.style = injson['style']
            self.layers = injson['layers']
            self.camera = injson['camera']
            self.bbox = injson['bbox']
    
    async def task(self):
        data = {}
        data['layers'] = self.layers
        data['camera'] = self.camera
        data['style'] = self.style
        
        filepath = os.path.dirname(os.path.realpath(__file__))
        with open(filepath+'/data/bardata.json', 'r') as f:
            barData = json.load(f)

        with open(filepath+'/data/scatterdata.json', 'r') as f:
            scatterData = json.load(f)
            
        with open(filepath+'/data/heatData.json', 'r') as f:
            heatData = json.load(f)
            
        visData = {'bar': barData, 'scatter':scatterData, "heat": heatData, "city" : data}
        
        comm = Comm(target_name=self.cid+'_initMapView', data={})
        comm.send(visData)

    def view(self, width = '100%', height = '800px'):
        asyncio.ensure_future(self.task())
        return map.get_html(self.cid, width, height)
        
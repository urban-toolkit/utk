import overpass
import pandas as pd
import geopandas as gpd
import mapbox_earcut as earcut
import numpy as np
import utils
import errors
import re
import time
import cache
import vedo
import osmium as o
import subprocess
import pyproj
import matplotlib.pyplot as plt

from geopy.geocoders import Nominatim
from shapely.geometry import MultiPolygon, Polygon, MultiLineString, LineString, box, Point
from shapely.ops import linemerge, transform
from shapely.wkb import loads
from shapely.validation import explain_validity
from buildings import Buildings
from urbanComponent import UrbanComponent


class RelationHandler(o.SimpleHandler):
    def __init__(self, filters):
        o.SimpleHandler.__init__(self)
        self.relation_elements = {'elements':[]}
        self.relations_position = {}
        self.relation_ways_ids = [] # all ids of ways that are part of relations
        self.filters = filters

    def node(self, n):
        pass

    def way(self, w):
        pass

    def relation(self, r):

        tags = {}
        pass_filters = False
        disqualified = False

        for tag in r.tags:
            tags[tag.k] = tag.v

            if('rel' in self.filters and tag.k in self.filters['rel'] and (tag.v in self.filters['rel'][tag.k] or -1 in self.filters['rel'][tag.k])): # -1 includes all
                pass_filters = True

            if('rel' in self.filters and 'disqualifiers' in self.filters['rel'] and tag.k in self.filters['rel']['disqualifiers'] and (tag.v in self.filters['rel']['disqualifiers'][tag.k] or -1 in self.filters['rel']['disqualifiers'][tag.k])): # -1 includes all
                disqualified = True

        if(pass_filters and not disqualified):

            members = []

            for member in r.members:

                type = member.type

                if type == 'w':
                    type = 'way'

                self.relation_ways_ids.append(member.ref)

                members.append({
                    'id': member.ref,
                    'type': type,
                    'role': member.role,
                    'geometry': []
                })

            self.relation_elements['elements'].append({
                'type': 'relation',
                'id': r.id,
                'members': members,
                'bounds': None,
                'tags': tags
            })

            self.relations_position[r.id] = len(self.relation_elements['elements'])-1

    def area(self, a):
        pass

class OSMHandler(o.SimpleHandler):
    def __init__(self, filters, relation_ways_ids):
        o.SimpleHandler.__init__(self)
        self.relation_ways_ids = relation_ways_ids

        self.ways_elements = {'elements':[]}
        self.ways_elements_of_relations = {'elements':[]}
        self.areas = {}
        self.ways_position = {}
        self.filters = filters
    
    def node(self, n):
        pass

    def way(self, w):

        tags = {}
        pass_filters = False
        disqualified = False

        for tag in w.tags:
            tags[tag.k] = tag.v

            if('way' in self.filters and tag.k in self.filters['way'] and (tag.v in self.filters['way'][tag.k] or -1 in self.filters['way'][tag.k])):
                pass_filters = True

            if('way' in self.filters and 'disqualifiers' in self.filters['way'] and tag.k in self.filters['way']['disqualifiers'] and (tag.v in self.filters['way']['disqualifiers'][tag.k] or -1 in self.filters['way']['disqualifiers'][tag.k])): # -1 includes all
                disqualified = True

        if((pass_filters and not disqualified) or w.id in self.relation_ways_ids):

            nodes_ids = []
            geometry = []
            bounds = {
                'minlat': None,
                'minlon': None,
                'maxlat': None, 
                'maxlon': None
            }

            for elem in w.nodes:
                nodes_ids.append(elem.ref)

                geometry.append({
                    'lat': elem.lat,
                    'lon': elem.lon
                })

                if(bounds['minlat'] == None):
                    bounds['minlat'] = elem.lat
                elif(elem.lat < bounds['minlat']):
                        bounds['minlat'] = elem.lat

                if(bounds['minlon'] == None):
                    bounds['minlon'] = elem.lon
                elif(elem.lon < bounds['minlon']):
                        bounds['minlon'] = elem.lon

                if(bounds['maxlat'] == None):
                    bounds['maxlat'] = elem.lat
                elif(elem.lat > bounds['maxlat']):
                        bounds['maxlat'] = elem.lat

                if(bounds['maxlon'] == None):
                    bounds['maxlon'] = elem.lon
                elif(elem.lon > bounds['maxlon']):
                        bounds['maxlon'] = elem.lon

            if(w.id in self.relation_ways_ids):

                self.ways_elements_of_relations['elements'].append({
                    'type': 'way',
                    'id': w.id,
                    'bounds': bounds,
                    'nodes': nodes_ids,
                    'geometry': geometry,
                    'tags': tags
                })
            
                self.ways_position[w.id] = len(self.ways_elements_of_relations['elements'])-1
            
            else:
                self.ways_elements['elements'].append({
                    'type': 'way',
                    'id': w.id,
                    'bounds': bounds,
                    'nodes': nodes_ids,
                    'geometry': geometry,
                    'tags': tags
                })


    def relation(self, r):
        pass

    def area(self, a):
        pass

class OSM:

    def load(region, layers=['parks','water','roads','buildings'], pbf_filepath=None):
        '''
            Region can be a bounding polygon, a bounding box or an address
        '''

        if(isinstance(region, str)): # address
            return OSM.load_from_address(region, layers, pbf_filepath)
        elif(len(region) == 4 and (isinstance(region[0], float) or isinstance(region[0], int))): # bounding box
            return OSM.load_from_bbox(region, layers, pbf_filepath)
        elif(len(region[0]) == 2): # polygon
            return OSM.load_from_polygon(region, layers)
        else:
            raise Exception("Region format "+str(region)+" not supported")

    def load_from_bbox(bbox, layers=['parks','water','roads','buildings'], pbf_filepath=None):
        '''
            Load layers inside bounding box to memory storing them into the UrbanComponent

            Args:
                bbox (float[]): List containing the two extreme corners of the bounding box. [minLat, minLng, maxLat, maxLng]
                layers (string[]): Name of the layers that will be loaded. Possible values: parks, water, costline, roads, buildings. If buildings are used it must be the last layer to ensure correct rendering.
                    (default is ['parks', 'water', 'roads','buildings'])
                filepath (string): Location of the pbf file to load. This argument is optional. If provided the data will be loaded from the pbf instead of the OSM API
                    (default is None)

            Returns:
                component (UrbanComponent): Allows the manipulation of the loaded data
        
        '''
        
        cam = utils.get_camera(bbox, True)
        
        loaded = None

        if(pbf_filepath != None):

            aux = '%f,%f,%f,%f'%(bbox[1],bbox[0],bbox[3],bbox[2])

            split_file = pbf_filepath.split('/')

            output_file = ''

            for index, section in enumerate(split_file):
                if(index == len(split_file)-1):
                    output_file += 'filtered_'+section
                else:
                    output_file += section+'/'

            proc = subprocess.call(['wsl', 'osmium', 'extract', '-b', aux, '-o', output_file, '--overwrite', pbf_filepath], shell=True) # TODO: make it not depend on the OS

            loaded = OSM.get_osm(bbox, True, layers, output_file)
        else:
            loaded = OSM.get_osm(bbox, True, layers)

        component = UrbanComponent(layers = loaded, bpolygon = bbox, camera = cam)

        return component

    def load_from_polygon(bpolygon, layers=['parks','water','roads','buildings']):
        
        cam = utils.get_camera(bpolygon)

        loaded = OSM.get_osm(bpolygon, False, layers)

        component = UrbanComponent(layers = loaded, bpolygon = bpolygon, camera = cam)

        return component

    def load_from_address(address, layers=['parks','water','roads','buildings'], pbf_filepath=None):

        geolocator = Nominatim(user_agent="urbantk")

        location = geolocator.geocode(address, timeout=5).raw

        bbox = [float(x) for x in location['boundingbox']]
        bbox = [bbox[0],bbox[2],bbox[1],bbox[3]]

        if(pbf_filepath != None):
            return OSM.load_from_bbox(bbox, layers, pbf_filepath)
        else:
            return OSM.load_from_bbox(bbox, layers)

    def get_osm(bpolygon, bbox=False, layers=['parks','water','roads','buildings'], pbf_filepath=None):

        '''
            Request data to OSM API using overpass and builds meshes for each loaded data from the result

            Args:
                bpolygon (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]
                layers (string[]): Name of the layers that will be loaded. Possible values: parks, water, costline, roads, buildings. If buildings are used it must be the last layer to ensure correct rendering.
                    (default is ['parks', 'water', 'roads','buildings'])
                filepath (string): Location of the pbf file to load. This argument is optional. If provided the data will be loaded from the pbf instead of the OSM API
                    (default is None)

            Returns:
                result (list[object]): A list of python objects representing the layers in json format
        '''

        bpoly = bpolygon.copy()
        api = overpass.API()

        overpass_responses = {}

        for layer_obj in layers:

            layer = ''

            if isinstance(layer_obj, str):
                layer = layer_obj
            else:
                layer = layer_obj['name']

            if layer == 'surface':
                continue
            
            if(pbf_filepath == None):

                query = OSM.build_osm_query(bpoly, 'geom', bbox, [layer])

                response = cache._load_osm_from_cache(query)

                if not response:
                    time.sleep(1) # avoiding Overpass 429 Too Many Requests
                    response = api.get(query, build=False)
                    cache._save_osm_to_cache(query,response)

                overpass_responses[layer] = OSM.parse_osm(response)
            else:
                relation_handler = RelationHandler(OSM.get_osmium_filters(layer))

                relation_handler.apply_file(pbf_filepath, locations=True)

                relation_elements = relation_handler.relation_elements
                relations_position = relation_handler.relations_position
                relation_ways_ids = relation_handler.relation_ways_ids

                osmhandler = OSMHandler(OSM.get_osmium_filters(layer), relation_ways_ids)

                osmhandler.apply_file(pbf_filepath, locations=True)

                ways_position = osmhandler.ways_position
                ways_elements = osmhandler.ways_elements
                ways_elements_of_relations = osmhandler.ways_elements_of_relations
                areas = osmhandler.areas

                complete_relation_elements = OSM.fill_relation_geom_osmium(ways_elements_of_relations, relation_elements, ways_position, relations_position, areas)

                overpass_responses[layer] = OSM.parse_osm({'elements': ways_elements['elements'] + complete_relation_elements['elements']})

        result = []
        result_gdf_objects = []
        result_gdf_coordinates = []
        result_gdf_coordinates_3d = []
        ttype = ''
        styleKey = ''
        renderStyle = []
        selectable = ''

        for layer_obj in layers:

            layer = ''
            args = {}

            if isinstance(layer_obj, str):
                layer = layer_obj
            else:
                layer = layer_obj['name']
                args = layer_obj['args']

            if layer == 'surface':
                print("creating surface")

                nCells = -1
                sizeCells = -1

                if 'nCells' in args:
                    nCells = args['nCells']
                
                if 'sizeCells' in args:
                    sizeCells = args['sizeCells']

                layer_geometry = OSM.create_surface_mesh(bpoly, bbox, nCells, sizeCells)
                print("create_surface_mesh finished")
                geometry = layer_geometry['data']
                result_gdf_objects.append(layer_geometry['gdf']['objects'])
                result_gdf_coordinates.append(layer_geometry['gdf']['coordinates'])
                result_gdf_coordinates_3d.append(layer_geometry['gdf']['coordinates'])
                # result.append({'id': 'surface', 'type': "HEATMAP_LAYER", 'renderStyle': ['FLAT_COLOR'], 'styleKey': 'surface', 'visible': True, 'selectable': False, 'skip': False, 'data': geometry})
                ttype = 'HEATMAP_LAYER'
                styleKey = 'surface'
                renderStyle = ['FLAT_COLOR']
                selectable = False
            elif layer == 'buildings':

                sizeCells = -1

                if 'sizeCells' in args:
                    sizeCells = args['sizeCells']

                layer_geometry = OSM.osm_to_building_mesh(overpass_responses[layer], bpoly, bbox, sizeCells)
                print("osm_to_building_mesh finished")
                geometry = layer_geometry['data']
                result_gdf_objects.append(layer_geometry['gdf']['objects'])
                result_gdf_coordinates.append(layer_geometry['gdf']['coordinates'])
                result_gdf_coordinates_3d.append(layer_geometry['gdf']['coordinates3d'])
                ttype = 'BUILDINGS_LAYER'
                styleKey = 'building'
                renderStyle = ['SMOOTH_COLOR']
                selectable = True
            elif layer == 'roads':
                layer_geometry = OSM.osm_to_roads_polyline(overpass_responses[layer], bpoly, bbox)
                print("osm_to_roads_polyline finished")
                geometry = layer_geometry['data']
                result_gdf_objects.append(layer_geometry['gdf']['objects'])
                result_gdf_coordinates.append(layer_geometry['gdf']['coordinates'])
                result_gdf_coordinates_3d.append(layer_geometry['gdf']['coordinates3d'])
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = 'roads'
                renderStyle = ['FLAT_COLOR']
                selectable = False
            elif layer == 'coastline':
                layer_geometry = OSM.osm_to_coastline_mesh(overpass_responses[layer], bpoly, bbox)
                print("osm_to_coastline_mesh finished")
                geometry = layer_geometry['data']
                result_gdf_objects.append(layer_geometry['gdf']['objects'])
                result_gdf_coordinates.append(layer_geometry['gdf']['coordinates'])
                result_gdf_coordinates_3d.append(layer_geometry['gdf']['coordinates3d'])
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = 'land'
                renderStyle = ['FLAT_COLOR']
                selectable = False
            else:
                layer_geometry = OSM.osm_to_generic_mesh(overpass_responses[layer], bpoly, bbox, convert2dto3d=True)
                print("osm_to_generic_mesh finished")
                geometry = layer_geometry['data']
                result_gdf_objects.append(layer_geometry['gdf']['objects'])
                result_gdf_coordinates.append(layer_geometry['gdf']['coordinates'])
                result_gdf_coordinates_3d.append(layer_geometry['gdf']['coordinates3d'])
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = layer
                renderStyle = ['FLAT_COLOR']
                selectable = True

            result.append({'id': layer, 'type': ttype, 'renderStyle': renderStyle, 'styleKey': styleKey, 'visible': True, 'selectable': selectable, 'skip': False, 'data': geometry})
        
        return {'json': result, 'gdf': {'objects': result_gdf_objects, 'coordinates': result_gdf_coordinates, 'coordinates3d': result_gdf_coordinates_3d}}

    def osm_to_roads_polyline(osm_elements, bpoly, bbox):
        '''
            Creates the roads polyline based on the OSM elements

            Args:
                osm_elements (object): A json object describing the components of the roads layer 
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]

            Returns:
                mesh (object): A json object describing the geometry of the layer
        '''

        mesh = []
        coords = []
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            coords.append(way['geometry'])
        
        lines = MultiLineString(coords)
        inter = lines.intersection(utils.polygon_bpoly(bpoly, bbox))

        proj_4326 = pyproj.CRS('EPSG:4326')
        proj_3395 = pyproj.CRS('EPSG:3395')
        project = pyproj.Transformer.from_crs(proj_4326, proj_3395, always_xy=True).transform

        geometries = []
        geometries_coordinates = []

        ids = []
        ids_coordinates = []
        counter_id_coordinates = 0

        for id, line in enumerate(inter):

            # extruding line ============================
            x, y = line.coords.xy
            invertedLine = LineString(list(zip(y,x)))
            
            ids.append(id)

            transformed_line = transform(project, invertedLine)

            buffer_line = transformed_line.buffer(2) # in meters
            # buffer_line = transformed_line.buffer(7.5) # in meters

            geometries.append(buffer_line)

            x, y = buffer_line.exterior.coords.xy

            nodes = list(zip(x,y))
            rings = [len(nodes)]

            indices = earcut.triangulate_float64(nodes, rings)

            nodes = np.array(nodes)
            
            # empty triangulation
            if(len(indices) == 0 or (len(indices) % 3) > 0):
                raise errors.InvalidPolygon('Invalid triangulation')

            nodes = nodes.flatten().tolist()
            indices = indices.tolist()

            for i in range(int(len(nodes)/2)):
                geometries_coordinates.append(Point(nodes[i*2], nodes[i*2+1]))
                ids_coordinates.append(counter_id_coordinates)
                counter_id_coordinates += 1

            nodes = utils.from2dTo3d(nodes)

            mesh.append({'type': 'type', 'geometry': {'coordinates': [round(item,4) for item in nodes], 'indices': indices}})

        gdf = gpd.GeoDataFrame({'geometry': geometries, 'id': ids}, crs=3395)

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, 'id': ids_coordinates}, crs=3395)

        return {'data': mesh, 'gdf': {'objects': gdf, 'coordinates': gdf_coordinates, 'coordinates3d': None}}

    def osm_to_coastline_mesh(osm_elements, bpoly, using_bbox):

        '''
            Creates the coastline mesh based on the OSM elements

            Args:
                osm_elements (object): A json object describing the components of the coastline layer 
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]

            Returns:
                mesh (object): A json object describing the geometry of the layer
        '''

        bbox = []

        if(using_bbox):
            bbox = bpoly
        else:
            bbox = utils.polygon_bpoly(bpoly).bounds

        # to shapely
        lines = []
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            linestring = LineString(way['geometry'])
            lines.append(linestring)
        multiline = MultiLineString(lines)

        merged_lines = linemerge(multiline)

        sides = { \
            'left': LineString([(bbox[0],bbox[1]),(bbox[2],bbox[1])]), \
            'right': LineString([(bbox[0],bbox[3]),(bbox[2],bbox[3])]), \
            'top': LineString([(bbox[2],bbox[1]),(bbox[2],bbox[3])]),\
            'bottom': LineString([(bbox[0],bbox[1]),(bbox[0],bbox[3])]) \
        }

        def test_side(line):
            for side in sides:
                if line.intersects(sides[side]):
                    return (side,list(line.intersection(sides[side]).coords)[0])


        # look for exits and enters into bounding box
        enters_byside = {'left': [], 'right': [], 'top': [], 'bottom': []}
        exits_byside = {'left': [], 'right': [], 'top': [], 'bottom': []}
        enters_byline = {}
        exits_byline = {}
        lines = []
        innerlines = []

        if merged_lines.geom_type == 'LineString':
            merged_lines = [merged_lines]

        for line in merged_lines:
            way = {'geometry': list(line.coords), 'bbox': line.bounds}
            # ignore holes for now
            if way['geometry'][0] == way['geometry'][-1]: # if the way is closed
                innerlines.append(way['geometry'])
            elif utils.intersect_bbox(bbox,way['bbox']) or utils.intersect_bbox(way['bbox'],bbox):
                curline = []
                enter_side = -1
                exit_side = -1
                for i in range(1,len(way['geometry'])):
                    p0 = way['geometry'][i-1]
                    p1 = way['geometry'][i]
                    p0_inside = utils.point_within_bbox(p0,bbox)
                    p1_inside = utils.point_within_bbox(p1,bbox)
                    # entering
                    if not p0_inside and p1_inside:
                        # print('entering',line.bounds)
                        intersection = test_side(LineString([p0,p1]))
                        enter_side = intersection[0]
                        curline.append(intersection[1])
                        curline.append(p1)
                    # exiting
                    elif p0_inside and not p1_inside:
                        # print('exiting',line.bounds)
                        intersection = test_side(LineString([p0,p1]))
                        exit_side = intersection[0]
                        curline.append(intersection[1])

                        # found complete line, add to lines
                        lines.append(curline)
                        enters_byside[enter_side].append((curline[0],len(lines)-1))
                        enters_byline[len(lines)-1] = (curline[0],enter_side)
                        exits_byside[exit_side].append((curline[-1],len(lines)-1))
                        exits_byline[len(lines)-1] = (curline[-1],exit_side)
                        curline = []
                    # inside bbox
                    elif p0_inside and p1_inside:
                        curline.append(p0)
        
        # sort enter and exits from left to right, bottom to top q
        enters_byside['left'].sort(key = lambda x: x[1])
        exits_byside['left'].sort(key = lambda x: x[1])
        enters_byside['right'].sort(reverse=True,key = lambda x: x[1])
        exits_byside['right'].sort(reverse=True,key = lambda x: x[1])
        enters_byside['top'].sort(key = lambda x: x[0])
        exits_byside['top'].sort(key = lambda x: x[0])
        enters_byside['bottom'].sort(reverse=True,key = lambda x: x[0])
        exits_byside['bottom'].sort(reverse=True,key = lambda x: x[0])

        def next_enter(side,exit_coord):
            next_enter = -1
            for i in range(0,len(enters_byside[side])):
                coord = enters_byside[side][i][0]
                if side =='left' and coord[0] > exit_coord[0]:
                    next_enter = enters_byside[side][i][1]
                    break
                elif side == 'top' and coord[1] > exit_coord[1]:
                    next_enter = enters_byside[side][i][1]
                    break
                elif side == 'right' and coord[0] < exit_coord[0]:
                    next_enter = enters_byside[side][i][1]
                    break
                elif side == 'bottom' and coord[1] < exit_coord[1]:
                    next_enter = enters_byside[side][i][1]
                    break
            return next_enter

        def next_corner(side):
            if side == 'left':
                return (bbox[2],bbox[1])
            elif side == 'right':
                return (bbox[0],bbox[3])
            elif side == 'top':
                return (bbox[2],bbox[3])
            elif side == 'bottom':
                return (bbox[0],bbox[1])

        def next_side(side):
            if side == 'left':
                return 'top'
            elif side == 'right':
                return 'bottom'
            elif side == 'top':
                return 'right'
            elif side == 'bottom':
                return 'left'

        def next_line(curlineid,firstlineid,line):
            enter_side = enters_byline[curlineid][1]
            enter_coord = enters_byline[curlineid][0]
            exit_side = exits_byline[curlineid][1]
            exit_coord = exits_byline[curlineid][0]

            if len(line) > 0 and curlineid == firstlineid:
                return
            
            line.extend(lines[curlineid])
            # get next closest enter to the right of exit, else get corner
            if len(enters_byside[exit_side]) > 0:
                nextt = next_enter(exit_side,exit_coord)
                if(nextt != -1): # if there is a next line
                    next_line(nextt,firstlineid,line)
            else:
                nextcoord = next_corner(exit_side)
                nextside = next_side(exit_side)
                nextt = next_enter(nextside,nextcoord)
                if(nextt != -1): # if there is a next line
                    line.append(nextcoord) # dont know if this is on the right place
                    next_line(nextt,firstlineid,line)

        # stitch
        polygons = []
        for lineid in enters_byline:
            line = []
            next_line(lineid,lineid,line)
            polygons.append({'outer': line, 'inner': innerlines, 'type': 'type'})
            break

        proj_4326 = pyproj.CRS('EPSG:4326')
        proj_3395 = pyproj.CRS('EPSG:3395')
        project = pyproj.Transformer.from_crs(proj_4326, proj_3395, always_xy=True).transform

        geometries = []
        geometries_coordinates = []

        ids = []
        ids_coordinates = []
        counter_id_coordinates = 0

        # triangulate
        mesh = []
        for id, poly in enumerate(polygons):

            ids.append(id)

            nodes = []
            rings = []

            # outer
            nodes = poly['outer']
            rings.append(len(nodes))

            inner_lng_lat = []

            # inner
            for inner in poly['inner']:
                inner_lng_lat.append([(elem[1], elem[0]) for elem in inner])
                nodes.extend(inner)
                rings.append(len(nodes))
            
            outer_lng_lat = [(elem[1], elem[0]) for elem in poly['outer']]

            geometries.append(transform(project,Polygon(outer_lng_lat, inner_lng_lat)))

            nodes = np.array(nodes)

            indices = earcut.triangulate_float64(nodes, rings)
            indices = np.flip(indices, axis=0)

            # empty triangulation
            if(len(indices) == 0 or (len(indices) % 3) > 0):
                raise errors.InvalidPolygon('Invalid triangulation')

            # bad triangulation
            nodes = nodes.flatten().tolist()
            indices = indices.tolist()
            dev = utils.deviation(nodes, rings, 2, indices)
            # if(abs(dev) > 0.001): # TODO: prevent bad triangulation of complex meshes
            #     raise errors.InvalidPolygon('Invalid deviation (%f)'%dev)

            nodes = utils.convertProjections("4326", "3395", nodes)
            
            for i in range(int(len(nodes)/2)):
                geometries_coordinates.append(Point(nodes[i*2], nodes[i*2+1]))
                ids_coordinates.append(counter_id_coordinates)
                counter_id_coordinates += 1

            nodes = utils.from2dTo3d(nodes)

            mesh.append({'type': poly['type'], 'geometry': {'coordinates': [round(item,4) for item in nodes], 'indices': indices}})

        gdf = gpd.GeoDataFrame({'geometry': geometries, 'id': ids}, crs=3395)

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, 'id': ids_coordinates}, crs=3395)

        return {'data': mesh, 'gdf': {'objects': gdf, 'coordinates': gdf_coordinates, 'coordinates3d': None}}

    def osm_to_building_mesh(osm_elements, bpoly, bbox = False, sizeCells = -1):
        '''
            Creates the building mesh based on the OSM elements

            Args:
                osm_elements (object): A json object describing the components of the layer 
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]

            Returns:
                mesh (object): A json object describing the geometry of the layer
        '''

        # start = time.time()

        ways = []
        # handle multiways first
        for mid in osm_elements['multiways']:
            multiways = osm_elements['multiways'][mid]
            # https://wiki.openstreetmap.org/wiki/Relation:multipolygon
            for way in multiways:
                outernodes = []
                prevnodes = []
                inserted = False
                for outer in way['outer']:
                    curnodes = outer['geometry']
                    if curnodes[0][0]==curnodes[-1][0] and curnodes[0][1]==curnodes[-1][1]: # closed
                        ways.append({'inner': [], 'outer': curnodes, 'type': 'type'})
                        inserted = True
                    else:
                        if (len(prevnodes) == 0) or (prevnodes[-1][0]==curnodes[0][0] and prevnodes[-1][1]==curnodes[0][1]):
                            outernodes.extend(curnodes)
                        else:
                            outernodes.extend(curnodes[::-1])
                        prevnodes = curnodes
                # print(outernodes)
                if inserted == False:
                    ways.append({'inner': [], 'outer': outernodes, 'tags': way['tags'], 'type': 'type'})
                
                innernodes = []
                prevnodes = []
                inserted = False
                lastouter = len(ways)-1
                for inner in way['inner']:
                    curnodes = inner['geometry']
                    if curnodes[0][0]==curnodes[-1][0] and curnodes[0][1]==curnodes[-1][1]: # closed
                        ways[lastouter]['inner'].append(curnodes)
                        inserted = True
                    else:
                        if (len(prevnodes) == 0) or (prevnodes[-1][0]==curnodes[0][0] and prevnodes[-1][1]==curnodes[0][1]):
                            innernodes.append(curnodes)
                        else:
                            innernodes.extend(curnodes[::-1])
                        prevnodes = curnodes
                if inserted == False:
                    ways[lastouter]['inner'] = innernodes

        print("multi ways processed (osm_to_building_mesh)")

        # end = time.time()
        # print("handling multiways: "+str(end - start))

        # start = time.time()

        # single ways
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            nodes = way['geometry']
            ways.append({'outer': nodes, 'inner': [], 'tags': way['tags'],'type': 'type'})

        print("single ways processed (osm_to_building_mesh)")

        # end = time.time()
        # print("handling singleways: "+str(end - start))

        # start = time.time()

        # to shapely
        polygons = []
        for way in ways:
            if len(way['outer']) > 2:
                poly = Polygon(way['outer'],way['inner'])
                poly = poly.buffer(0)
            else:
                print('small poly')
                continue
            if not poly.is_valid:
                print(explain_validity(poly))
                print('poly not valid')
                return
            if poly.overlaps(utils.polygon_bpoly(bpoly, bbox)):
                continue
            if poly.geom_type == 'Polygon':
                exterior = list(poly.exterior.coords)
                interiors = []
                for interior in poly.interiors:
                    interiors.append(list(interior.coords))
                polygons.append({'geom': [exterior, interiors], 'tags': way['tags']})
            elif poly.geom_type == 'MultiPolygon':
                for p in poly:
                    exterior = list(p.exterior.coords)
                    interiors = []
                    for interior in p.interiors:
                        interiors.append(list(interior.coords))
                    polygons.append({'geom': [exterior, interiors], 'tags': way['tags']})

        print("to shapely processed (osm_to_building_mesh)")

        # end = time.time()
        # print("to shapely: "+str(end - start))

        # https://wiki.openstreetmap.org/wiki/Simple_3D_buildings#Other_roof_tags
        def _feet_to_meters(s):
            # r = re.compile('^(?!$|.*\'[^\x22]+$)(?:([0-9]+)\')?(?:([0-9]+)\x22?)?$')
            r = re.compile("([0-9]*\.?[0-9]+)'([0-9]*\.?[0-9]+)?\"?") # Modified
            m = r.findall(s)[0]
            if len(m[0]) > 0 and len(m[1]) > 0:
                m = float(m[0]) + float(m[1]) / 12.0
            elif len(m[0]) > 0:
                m = float(m[0])
            return m * 0.3048
        LEVEL_HEIGHT = 3.4
        def _get_height(tags):
            if 'height' in tags:
                # already accounts for roof
                if '\'' in tags['height'] or '\"' in tags['height']:
                    return _feet_to_meters(tags['height'])
                r = re.compile(r"[-+]?\d*\.\d+|\d+")
                return float(r.findall(tags['height'])[0])
            if 'levels' in tags or 'building:levels' in tags:
                roof_height = 0
                if 'roof_height' in tags:
                    if '\'' in tags['roof_height'] or '\"' in tags['roof_height']:
                        roof_height = _feet_to_meters(tags['roof_height'])
                    else:
                        r = re.compile(r"[-+]?\d*\.\d+|\d+")
                        roof_height = float(r.findall(tags['roof_height'])[0])

                level_tag = ''

                # does not account for roof height
                if 'levels' in tags:
                    level_tag = 'levels'
                elif 'building:levels' in tags:
                    level_tag = 'building:levels'

                height = 0

                try:
                    height = float(tags[level_tag]) * LEVEL_HEIGHT
                except:
                    pass

                if 'roof_levels' in tags and roof_height == 0:
                    height += float(tags['roof_levels']) * LEVEL_HEIGHT
                return height
            return 7.0 # Modified

        def _get_min_height(tags):
            # Modified
            min_height = 0
            if 'min_height' in tags:
                # already accounts for roof
                if '\'' in tags['min_height'] or '\"' in tags['min_height']:
                    return _feet_to_meters(tags['min_height'])
                r = re.compile(r"[-+]?\d*\.\d+|\d+")
                min_height = float(r.findall(tags['min_height'])[0])
            if 'min_level' in tags:
                height = float(tags['min_level']) * LEVEL_HEIGHT
                min_height = height
            return max(0.0, min_height)

        # flip x and y coordinates
        def _invert(elem):
            return [(coord[1], coord[0]) for coord in elem]

        tags = []
        geometry = []
        min_heights = []
        heights = []
        building_id = []

        # start = time.time()

        for index_polygon, building_info in enumerate(polygons):

            tags.append(building_info['tags'])
            min_heights.append(_get_min_height(building_info['tags']))
            heights.append(_get_height(building_info['tags']))

            shapely_polygons = [Polygon(_invert(elem)) for elem in building_info['geom']]
            geometry.append(MultiPolygon(shapely_polygons))

            building_id.append(index_polygon)

        # end = time.time()
        # print("building Polygon and MultiPolygon: "+str(end - start))

        geometry = gpd.GeoSeries(geometry, crs='epsg:4326')
        heights = pd.Series(heights, dtype='float')
        min_heights = pd.Series(min_heights, dtype='float')
        tags = pd.Series(tags)
        building_id = pd.Series(building_id, dtype='UInt64')

        gdf = gpd.GeoDataFrame({
            'building_id': building_id,
            'geometry': geometry,
            'min_height': min_heights,
            'height': heights,
            'tags': tags
        }, index=geometry.index)

        # drop bad values
        gdf = gdf[~gdf['height'].isnull()]
        gdf = gdf[gdf['min_height'] >= 0]
        gdf = gdf[gdf['height'] > 0]

        # new index
        gdf = gdf.set_index('building_id', drop=False)
        gdf = gdf.sort_index()

        # start = time.time()

        print("merging overlapping buildings (osm_to_building_mesh)")

        gdf_merged_buildings = Buildings.merge_overlapping_buildings(gdf)

        print("overlapping buildings merged (osm_to_building_mesh)")

        # end = time.time()
        # print("merge_overlapping_buildings: "+str(end - start))

        # start = time.time()

        print("generating building layers (osm_to_building_mesh)")

        layer_dataframes = Buildings.generate_building_layer(gdf_merged_buildings, sizeCells) #gdf, size

        print("building layers generated (osm_to_building_mesh)")

        # end = time.time()
        # print("generate_building_layer: "+str(end - start))

        df_mesh = layer_dataframes['df']

        # start = time.time()

        json_mesh = Buildings.df_to_json(df_mesh) # prepares the layer   

        # end = time.time()
        # print("df_to_json: "+str(end - start))

        return {"data": json_mesh['data'], "gdf": {'objects': layer_dataframes['gdf']['objects'], 'coordinates': layer_dataframes['gdf']['coordinates'], "coordinates3d": layer_dataframes['gdf']['coordinates3d']}}

    def osm_to_generic_mesh(osm_elements, bpoly, bbox, convert2dto3d=False):
        '''
            Used to load all generic layers that do not have specific functions to handle

            Args:
                osm_elements (object): A json object describing the components of layer 
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]
                convert2dto3d (boolean): Indicates if the layer should be converted to 3D by adding z=0
                    (default is False)

            Returns:
                mesh (object): A json object describing the geometry of the layer
        '''

        ways = []
        # handle multiways first
        for mid in osm_elements['multiways']:

            multiways = osm_elements['multiways'][mid]

            # https://wiki.openstreetmap.org/wiki/Relation:multipolygon
            for way in multiways:
                outernodes = []
                prevnodes = []
                inserted = False
                for outer in way['outer']:
                    curnodes = outer['geometry']
                    if curnodes[0][0]==curnodes[-1][0] and curnodes[0][1]==curnodes[-1][1]: # closed
                        ways.append({'inner': [], 'outer': curnodes, 'type': 'type'})
                        inserted = True
                    else:
                        if (len(prevnodes) == 0) or (prevnodes[-1][0]==curnodes[0][0] and prevnodes[-1][1]==curnodes[0][1]):
                            outernodes.extend(curnodes)
                        else:
                            outernodes.extend(curnodes[::-1])
                        prevnodes = curnodes

                if inserted == False:
                    ways.append({'inner': [], 'outer': outernodes, 'type': 'type'})
                
                innernodes = []
                prevnodes = []
                inserted = False
                lastouter = len(ways)-1
                for inner in way['inner']:
                    curnodes = inner['geometry']
                    if curnodes[0][0]==curnodes[-1][0] and curnodes[0][1]==curnodes[-1][1]: # closed
                        ways[lastouter]['inner'].append(curnodes)
                        inserted = True
                    else:
                        if (len(prevnodes) == 0) or (prevnodes[-1][0]==curnodes[0][0] and prevnodes[-1][1]==curnodes[0][1]):
                            innernodes.append(curnodes)
                        else:
                            innernodes.extend(curnodes[::-1])
                        prevnodes = curnodes
                if inserted == False:
                    ways[lastouter]['inner'] = innernodes

        # single ways
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            nodes = way['geometry']
            ways.append({'outer': nodes, 'inner': [], 'type': 'type'})

        # to shapely
        polygons = []
        for way in ways:
            if len(way['outer']) > 2:
                poly = Polygon(way['outer'],way['inner'])
                poly = poly.buffer(0)
            else:
                print('small poly')
                continue
            if not poly.is_valid:
                print(explain_validity(poly))
                print('poly not valid')
                return

            poly = poly.intersection(utils.polygon_bpoly(bpoly, bbox))
            if poly.geom_type == 'Polygon':
                exterior = list(poly.exterior.coords)
                interiors = []
                for interior in poly.interiors:
                    interiors.append(list(interior.coords))
                if(len(exterior) > 0 or len(interiors) > 0):
                    polygons.append([exterior, interiors])
            elif poly.geom_type == 'MultiPolygon':
                for p in poly:
                    exterior = list(p.exterior.coords)
                    interiors = []
                    for interior in p.interiors:
                        interiors.append(list(interior.coords))
                    if(len(exterior) > 0 or len(interiors) > 0):
                        polygons.append([exterior, interiors])

        proj_4326 = pyproj.CRS('EPSG:4326')
        proj_3395 = pyproj.CRS('EPSG:3395')
        project = pyproj.Transformer.from_crs(proj_4326, proj_3395, always_xy=True).transform

        geometries = []
        geometries_coordinates = []

        ids = []
        ids_coordinates = []
        counter_id_coordinates = 0

        # triangulate
        mesh = []
        for id, poly in enumerate(polygons):

            ids.append(id)

            nodes = []
            rings = []

            # outer
            nodes = poly[0]
            rings.append(len(nodes))

            inner_lng_lat = []

            # inner
            for inner in poly[1]:
                inner_lng_lat.append([(elem[1], elem[0]) for elem in inner])
                nodes.extend(inner)
                rings.append(len(nodes))
            
            outer_lng_lat = [(elem[1], elem[0]) for elem in poly[0]]

            geometries.append(transform(project,Polygon(outer_lng_lat, inner_lng_lat)))

            nodes = np.array(nodes)

            indices = earcut.triangulate_float64(nodes, rings)

            indices = np.flip(indices, axis=0)

            # empty triangulation
            if(len(indices) == 0 or (len(indices) % 3) > 0):
                raise errors.InvalidPolygon('Invalid triangulation')

            # bad triangulation
            nodes = nodes.flatten().tolist()
            indices = indices.tolist()
            dev = utils.deviation(nodes, rings, 2, indices)
            if(abs(dev) > 0.001):
                raise errors.InvalidPolygon('Invalid deviation (%f)'%dev)
            
            nodes = utils.convertProjections("4326", "3395", nodes)

            for i in range(int(len(nodes)/2)):
                geometries_coordinates.append(Point(nodes[i*2], nodes[i*2+1]))
                ids_coordinates.append(counter_id_coordinates)
                counter_id_coordinates += 1

            if convert2dto3d:
                nodes = utils.from2dTo3d(nodes)

            mesh.append({'type': 'type', 'geometry': {'coordinates': [round(item,4) for item in nodes], 'indices': indices}})
        
        gdf = gpd.GeoDataFrame({'geometry': geometries, 'id': ids}, crs=3395)

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, 'id': ids_coordinates}, crs=3395)

        return {'data': mesh, 'gdf': {'objects': gdf, 'coordinates': gdf_coordinates, 'coordinates3d': None}}

    def parse_osm(osm_json):
        '''
            Parses the OSM data into ways and multiways

            Args:
                osm_json (object): OSM data recovered from the API

            Returns:
                parsed_data (object): Object containing ways and multiways
        '''

        ways = {}
        multiways = {}

        for el in osm_json['elements']:
            if el['type']=='way':
                bbox = [el['bounds']['minlat'],el['bounds']['minlon'],el['bounds']['maxlat'],el['bounds']['maxlon']]
                geom = [(x['lat'],x['lon']) for x in el['geometry'] if x != None]
                ways[el['id']] = {'geometry': geom, 'bbox': bbox, 'tags': el['tags']}
            elif el['type']=='relation':
                multiways[el['id']] = []
                for ell in el['members']:
                    if ell['type']=='way':
                        role = ell['role']
                        if role == 'outer':
                            last = len(multiways[el['id']])-1
                            if last == -1:
                                multiways[el['id']].append({'outer': [], 'inner': []})
                            bbox = [el['bounds']['minlat'],el['bounds']['minlon'],el['bounds']['maxlat'],el['bounds']['maxlon']]
                            geom = [(x['lat'],x['lon']) for x in ell['geometry'] if x != None]
                            multiways[el['id']][last]['outer'].append({'geometry': geom, 'bbox': bbox, 'tags': el['tags']})
                        elif role == 'inner':
                            last = len(multiways[el['id']])-1
                            if last == -1:
                                multiways[el['id']].append({'outer': [], 'inner': []})
                            bbox = [el['bounds']['minlat'],el['bounds']['minlon'],el['bounds']['maxlat'],el['bounds']['maxlon']]
                            geom = [(x['lat'],x['lon']) for x in ell['geometry'] if x != None]
                            multiways[el['id']][last]['inner'].append({'geometry': geom, 'bbox': bbox, 'tags': el['tags']})
    
        return {'ways': ways, 'multiways': multiways}

    def format_osmium(ways_elements, areas):
        ways = {}
        multiways = {}

        for el in ways_elements['elements']:
            if el['type']=='way':
                bbox = [el['bounds']['minlat'],el['bounds']['minlon'],el['bounds']['maxlat'],el['bounds']['maxlon']]
                geom = [(x['lat'],x['lon']) for x in el['geometry'] if x != None]
                ways[el['id']] = {'geometry': geom, 'bbox': bbox, 'tags': el['tags']}

        for area_id in areas:

            multiways[area_id] = [{
                'outer': areas[area_id]['outer'],
                'inner': areas[area_id]['inner']
            }]

        return {'ways': ways, 'multiways': multiways}
        
    def build_osm_query(coordinates, output_type, bbox=False, layers=['parks', 'water', 'roads','building']):
        '''
            Create an OSM query from layer types

            Args:
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]
                output_type (string): Type of output (i.e. geom)
                layers (string[]): List of strings containing the names of the layers that will be included in the OSM query. Possible values: ('coastline', 'parks', 'water', 'roads','building')
                    (default is ['parks', 'water', 'roads','building'])

            Returns:
                query (string): A string representing the OSM query

        '''

        # test_bbox = [40.7065227, -73.9957237, 40.6981960, -74.0112591, 40.7004079, -74.0234041, 40.7110434, -74.0229750, 40.7229778, -74.0183830, 40.7251455, -74.0139055, 40.7065125, -73.9955807]
        # test_bbox = [40.6979579, -74.0146923, 40.7047885, -74.0242195, 40.7178622, -74.0213013, 40.7406970, -74.0177536, 
        #              40.7582171, -74.0124464, 40.7797333, -73.9968252, 40.8037116, -73.9801311, 40.8264477, -73.9618492, 
        #              40.8544337, -73.9488029, 40.8692525, -73.9410782, 40.8791798, -73.9281607, 40.8780249, -73.9232719,
        #              40.8761352, -73.9201283, 40.8747078, -73.9149141, 40.8729788, -73.9099646, 40.8673246, -73.9106727,
        #              40.8627411, -73.9148355, 40.8584904, -73.9190197, 40.8535037, -73.9229608, 40.8492956, -73.9259648,
        #              40.8410680, -73.9312148, 40.8336130, -73.9343619, 40.8267696, -73.9338899, 40.8145508, -73.9331245,
        #              40.8089873, -73.9335251, 40.8032547, -73.9291906, 40.7998264, -73.9279675, 40.7948624, -73.9286399,
        #              40.7887648, -73.9353490, 40.7811608, -73.9405417, 40.7767898, -73.9412713, 40.7703865, -73.9454985,
        #              40.7630899, -73.9517713, 40.7566336, -73.9579082, 40.7433268, -73.9699817, 40.7328711, -73.9716983,
        #              40.7211009, -73.9701891, 40.7088030, -73.9768267, 40.7061541, -73.9964533, 40.7011167, -74.0048647,
        #              40.6980209, -74.0144205
        #             ]

        if(bbox):
            bpoly = ','.join(format(coord,".8f") for coord in coordinates)
        else:
            bpoly = ' '.join(format(coord,".8f") for coord in coordinates)
        query = '[out:json];('
        for layer in layers:
            filters = OSM.get_overpass_filters(layer)
            for ffilter in filters['way']:
                if(bbox):
                    query += 'way%s(%s);'%(ffilter,bpoly)
                else:
                    query += 'way%s(poly:"%s");'%(ffilter,bpoly)
            for ffilter in filters['rel']:
                if(bbox):
                    query += 'rel%s(%s);'%(ffilter,bpoly)
                else:
                    query += 'rel%s(poly:"%s");'%(ffilter,bpoly)
            for ffilter in filters['node']:
                if(bbox):
                    query += 'node%s(%s);'%(ffilter,bpoly)
                else:
                    query += 'node%s(poly:"%s");'%(ffilter,bpoly)


        query += ');out %s;'%output_type

        return query

    def get_overpass_filters(layer_type):

        '''
            Create an osm filter based on urban-toolkit layer types (building, road, coastline, water, parks)

            Args:
                layer_type (string): Name of the layer to generate filters for. Possible values: 'building', 'road', 'coastline', 'water', 'parks'

            Returns:
                result (object): An object containing all the filters for way, rel
        '''

        filters = {}
        filters['way'] = []
        filters['node'] = []
        filters['rel'] = []

        if layer_type == 'water':
            natural_types = ['water', 'wetland', 'bay', 'strait', 'spring']
            water_types = ['pond', 'reservoir', 'lagoon', 'stream_pool', 'lake', 'pool', 'canal', 'river']
            
            filters['way'].extend(['["natural"="%s"]'%t for t in natural_types])
            filters['rel'].extend(['["natural"="%s"]'%t for t in natural_types])
            filters['way'].extend(['["water"="%s"]'%t for t in water_types])
            filters['rel'].extend(['["water"="%s"]'%t for t in water_types])

        if layer_type == 'parks':
            natural_types = ['wood', 'grass']
            land_use_types = ['wood', 'grass', 'forest', 'orchad', 'village_green', 'vineyard', 'cemetery', 'meadow', 'village_green']
            leisure_types = ['dog_park', 'park', 'playground', 'recreation_ground']

            filters['way'].extend(['["natural"="%s"]'%t for t in natural_types])
            filters['rel'].extend(['["natural"="%s"]'%t for t in natural_types])
            filters['way'].extend(['["landuse"="%s"]'%t for t in land_use_types])
            filters['rel'].extend(['["landuse"="%s"]'%t for t in land_use_types])
            filters['way'].extend(['["leisure"="%s"]'%t for t in leisure_types])
            filters['rel'].extend(['["leisure"="%s"]'%t for t in leisure_types])

        if layer_type == 'roads':
            filters['way'].extend(['["highway"]["area"!~"yes"]["highway"!~"cycleway|footway|proposed|construction|abandoned|platform|raceway"]'])
            # filters['way'].extend(['"area"!~"yes"'])
            # filters['way'].extend(['"highway"!~"proposed|construction|abandoned|platform|raceway)"'])
            # filters['rel'].extend(['"highway"="%s"'%t for t in highway_types])

        if layer_type == 'coastline':
            filters['way'].extend(['["natural"="coastline"]'])

        if layer_type == 'buildings':
            filters['way'].extend(['["building"]'])
            filters['way'].extend(['["building:part"]'])
            filters['way'].extend(['["type"="building"]'])

            # filters['way'].extend(['["building:levels"]'])
            # filters['way'].extend(['["building:min_level"]'])
            # filters['way'].extend(['["building:height"]'])
            # filters['way'].extend(['["roof:levels"]'])
            # filters['way'].extend(['["roof:height"]'])
            # filters['way'].extend(['["roof:shape"]'])
            # filters['rel'].extend(['["building"]'])
            # filters['rel'].extend(['["building:levels"]'])
            # filters['rel'].extend(['["building:min_level"]'])
            # filters['rel'].extend(['["building:height"]'])
            # filters['rel'].extend(['["roof:levels"]'])
            # filters['rel'].extend(['["roof:height"]'])
            # filters['rel'].extend(['["roof:shape"]'])

        return filters

    def get_osmium_filters(layer_type):
        
        '''
            Create OSM filters for osmium based on urban-toolkit layer types (building, road, coastline, water, parks)

            Args:
                layer_type (string): Name of the layer to generate filters for. Possible values: 'building', 'road', 'coastline', 'water', 'parks'

            Returns:
                result (object): An object containing all the filters for way, rel
        '''

        filters = {}
        filters['way'] = {'disqualifiers': {}}
        filters['rel'] = {'disqualifiers': {}}

        if layer_type == 'water':
            natural_types = ['water', 'wetland', 'bay', 'strait', 'spring']
            water_types = ['pond', 'reservoir', 'lagoon', 'stream_pool', 'lake', 'pool', 'canal', 'river']

            filters['way']['natural'] = natural_types
            filters['rel']['natural'] = natural_types

            filters['way']['water'] = water_types
            filters['rel']['water'] = water_types

        if layer_type == 'parks':
            natural_types = ['wood', 'grass']
            land_use_types = ['wood', 'grass', 'forest', 'orchad', 'village_green', 'vineyard', 'cemetery', 'meadow', 'village_green']
            leisure_types = ['dog_park', 'park', 'playground', 'recreation_ground']

            filters['way']['natural'] = natural_types
            filters['rel']['natural'] = natural_types

            filters['way']['landuse'] = land_use_types
            filters['rel']['landuse'] = land_use_types

            filters['way']['leisure'] = leisure_types
            filters['rel']['leisure'] = leisure_types

        if layer_type == 'roads':

            filters['way']['highway'] = [-1] # including all highways

            filters['way']['disqualifiers']['area'] = ['yes']
            filters['way']['disqualifiers']['highway'] = ['cycleway', 'footway', 'proposed', 'construction', 'abandoned', 'platform', 'raceway'] # excluding certain types of highway

        if layer_type == 'coastline':
            filters['way']['natural'] = ['coastline']

        if layer_type == 'buildings':
            filters['way']['building'] = [-1]
            filters['way']['building:part'] = [-1]
            filters['way']['type'] = ['building']

        return filters

    def fill_relation_geom_osmium(ways_elements, relation_elements, ways_position, relations_position, areas):

        def update_bounds(way_bounds, bounds):

            if(bounds['minlat'] == None):
                bounds['minlat'] = way_bounds['minlat']
            elif(way_bounds['minlat'] < bounds['minlat']):
                    bounds['minlat'] = way_bounds['minlat']

            if(bounds['minlon'] == None):
                bounds['minlon'] = way_bounds['minlon']
            elif(way_bounds['minlon'] < bounds['minlon']):
                    bounds['minlon'] = way_bounds['minlon']

            if(bounds['maxlat'] == None):
                bounds['maxlat'] = way_bounds['maxlat']
            elif(way_bounds['maxlat'] > bounds['maxlat']):
                    bounds['maxlat'] = way_bounds['maxlat']

            if(bounds['maxlon'] == None):
                bounds['maxlon'] = way_bounds['maxlon']
            elif(way_bounds['maxlon'] > bounds['maxlon']):
                    bounds['maxlon'] = way_bounds['maxlon']
            
            return bounds

        relations = {'elements': []}

        for relation_id in relations_position:
            relation = relation_elements['elements'][relations_position[relation_id]]

            bounds = {
                'minlat': None,
                'minlon': None,
                'maxlat': None, 
                'maxlon': None
            }

            filtered_members = [] # only keeping the members that were included in the bbox

            for member in relation['members']:

                if(member['type'] == 'way' and member['id'] in ways_position): # TODO: verify why some ways that compose certain relations do not appear in the ways array
                # if(member['type'] == 'way' and relation['id'] in areas):
                    way = ways_elements['elements'][ways_position[member['id']]]

                    update_bounds(way['bounds'], bounds)

                    member['geometry'] = way['geometry'].copy()

                if(len(member['geometry']) > 0):
                    filtered_members.append(member)

            relation['members'] = filtered_members
            relation['bounds'] = bounds

            relations['elements'].append(relation)

        return relations


    def discretize_surface_mesh(coords, size=-1):
        poly = Polygon(coords[:,:2])

        # coordinates, indices, ids, _, _, _, _ = Buildings.get_roof(poly, None, 0, size)
        coordinates, indices, ids, _ = Buildings.get_roof(poly, None, 0, size)

        vmesh = vedo.Mesh([coordinates, indices])
        normals = vmesh.normals(cells=False)

        return coordinates, indices, ids, normals

    def create_surface_mesh(bpoly, bbox, nCells = -1, sizeCells = -1):
        '''
            Creates the surface mesh that covers the bounding box

            Args:
                bpoly (float[]): coordinates of bounding polygon
                bbox: if bpoly follows the format [minLat, minLng, maxLat, maxLng]
                sizeCells (number): if sizeCells is not specified and bbox is not a square the size of the cells will be defined according to the biggest side
                nCells (number): infered from sizeCells if not specified
            Returns:
                mesh (object): A json object describing the geometry of the layer
        '''
        
        if(nCells != -1 and sizeCells != -1):
            raise Exception("It is only possible to specify nCells or sizeCells not both")

        if(bbox):
            nodes = [bpoly[0],bpoly[1], bpoly[2],bpoly[1], bpoly[2],bpoly[3], bpoly[0],bpoly[3]]
        else:
            # TODO: crop the bbox according to the polygon
            boundaries = utils.polygon_bpoly(bpoly, bbox).bounds
            nodes = [boundaries[0],boundaries[1], boundaries[2],boundaries[1], boundaries[2],boundaries[3], boundaries[0],boundaries[3]]

        nodes = utils.convertProjections("4326", "3395", nodes)

        gdf = gpd.GeoDataFrame({'geometry': [Polygon([(nodes[0], nodes[1]), (nodes[2], nodes[3]), (nodes[4], nodes[5]), (nodes[6], nodes[7])])], "id": [0]}, crs=3395)

        nodes = utils.from2dTo3d(nodes)

        indices = [0, 3, 2, 2, 1, 0]

        geometry = [{'type': 'surface', 'geometry': {'coordinates': nodes, 'indices': indices}}]

        flat_coordinates = geometry[0]['geometry']['coordinates']
        grouped_coordinates = np.reshape(np.array(flat_coordinates), (int(len(flat_coordinates)/3), -1))

        finalSize = sizeCells

        if(finalSize == -1):
            if(nCells == -1):
                # default are cells of size 5 meters
                finalSize = 5
            else:
                finalSize = max(abs(bbox[2] - bbox[0])/nCells, abs(bbox[3] - bbox[1])/nCells)

        coordinates, indices, ids, normals = OSM.discretize_surface_mesh(grouped_coordinates, finalSize)

        geometries_coordinates = []
        ids_coordinates = []

        flat_discretized_coords = [float(elem) for sublist in coordinates for elem in sublist]
        flat_discretized_indices = [int(elem) for sublist in indices for elem in sublist]
        flat_discretized_normals = [float(elem) for sublist in normals for elem in sublist]

        for i in range(int(len(flat_discretized_coords)/3)):
            geometries_coordinates.append(Point(float(flat_discretized_coords[i*3]), float(flat_discretized_coords[i*3+1])))
            ids_coordinates.append(i)

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, "id": ids_coordinates}, crs=3395)

        # mesh = [{
        #     'geometry': {
        #         'coordinates': [float(elem) for sublist in coordinates for elem in sublist],
        #         'indices': [int(elem) for sublist in indices for elem in sublist],
        #         'ids': [int(elem) for elem in ids],
        #         'normals': [float(elem) for sublist in normals for elem in sublist],
        #         "discardFuncInterval": [0, 0.01]
        #     }
        # }]

        # Temp code to create one object per cell
        # ===========================================================================================

        mesh = []
        maxId = max(ids)

        for i in range(maxId+1):
            mesh.append({
                'geometry': {
                    'coordinates': [],
                    'indices': [],
                    'ids': [],
                    'normals': [],
                    'discardFuncInterval': [0, 0.01]
                }
            })            

        coordinates_index_translation = {}

        # each position of ids indicates the cell to which this triangle belong
        for id_index, id_content in enumerate(ids):

            # adding the coordinates of this triangle
            if indices[id_index][0] not in mesh[id_content]['geometry']['indices']:

                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][0]][0]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][0]][1]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][0]][2]))

                if indices[id_index][0] not in coordinates_index_translation:
                    coordinates_index_translation[indices[id_index][0]] = len(mesh[id_content]['geometry']['coordinates'])/3 - 1

            if indices[id_index][1] not in mesh[id_content]['geometry']['indices']:

                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][1]][0]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][1]][1]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][1]][2]))

                if indices[id_index][1] not in coordinates_index_translation:
                    coordinates_index_translation[indices[id_index][1]] = len(mesh[id_content]['geometry']['coordinates'])/3 - 1

            if indices[id_index][2] not in mesh[id_content]['geometry']['indices']:

                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][2]][0]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][2]][1]))
                mesh[id_content]['geometry']['coordinates'].append(float(coordinates[indices[id_index][2]][2]))

                if indices[id_index][2] not in coordinates_index_translation:
                    coordinates_index_translation[indices[id_index][2]] = len(mesh[id_content]['geometry']['coordinates'])/3 - 1

            # adding the triangle
            mesh[id_content]['geometry']['indices'].append(int(indices[id_index][0]))
            mesh[id_content]['geometry']['indices'].append(int(indices[id_index][1]))
            mesh[id_content]['geometry']['indices'].append(int(indices[id_index][2]))

            #adding the normals of the coordinates
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][0]][0]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][0]][1]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][0]][2]))

            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][1]][0]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][1]][1]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][1]][2]))

            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][2]][0]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][2]][1]))
            mesh[id_content]['geometry']['normals'].append(float(normals[indices[id_index][2]][2]))

            # adding the id of the triangle
            mesh[id_content]['geometry']['ids'].append(int(ids[id_index]))

        for element in mesh:

            element['geometry']['indices'] = [int(coordinates_index_translation[value]) for value in element['geometry']['indices']]

            # minIndex = min(element['geometry']['indices'])
            # element['geometry']['indices'] = [value - minIndex for value in element['geometry']['indices']]

            minIds = min(element['geometry']['ids'])
            element['geometry']['ids'] = [value - minIds for value in element['geometry']['ids']]

        # ===========================================================================================


        return {'data': mesh, 'gdf': {'objects': gdf, 'coordinates': gdf_coordinates, 'coordinates3d': None}}

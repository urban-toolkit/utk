from lib2to3.pytree import convert
from operator import truediv
import pandas as pd
import geopandas as gpd
import numpy as np
import osmium
import re
import warnings
import time
import math
import mapbox_earcut as earcut

import matplotlib.pyplot as plt

from tqdm.notebook import trange, tqdm

import vedo

from shapely import affinity
from shapely.ops import split, snap, unary_union, polygonize, linemerge, transform, triangulate
from shapely.geometry import MultiPolygon, Polygon, MultiLineString, LineString, Point, MultiPoint, box, polygon
from pyproj import Transformer, Proj, transform
import json

# from urbantk
import utils
import overpass
import cache
import errors
import urbanComponent
from shapely.validation import explain_validity

class OSM:
    
    def create_dataframe(osmfilepath, boundingbox = None):
        h = OSM.RelationHandler()
        h.apply_file(osmfilepath, locations=True)
        area_to_bid = h.get_area_to_bid()
        relation_to_bid = h.get_relation_to_bid()
        
        h = OSM.AreaHandler(area_to_bid, relation_to_bid)
        h.apply_file(osmfilepath, locations=True)
        
        gdf = h.get_gdf() 
        
        if boundingbox != None:
            gdf = gdf.cx[boundingbox[1]:boundingbox[3], boundingbox[0]:boundingbox[2]]
        
        return gdf
    
    def merge_buildings(gdf):
#         gdf = gdf.to_crs('epsg:3395')   
        
#         # merge buildings that overlap
#         unique_buildings = gdf.index.unique()
#         for i in trange(len(unique_buildings)):
#             building_id = unique_buildings[i]
#             building = gdf.loc[[building_id]]
#             contained = gpd.sjoin(gdf, building, predicate='contains')
#             iid = contained.iloc[0]['building_id_left']
#             gdf.loc[contained.index, 'building_id'] = iid
#         gdf = gdf.set_index('building_id', drop=False)
#         gdf = gdf.sort_index()
        
#         gdf = gdf.to_crs('epsg:4326')
        
#         return gdf

        gdf = gdf.to_crs('epsg:3395')   

        # merge buildings that overlap
        unique_buildings = gdf.index.unique()
        for i in trange(len(unique_buildings)):
            building_id = unique_buildings[i]
            buildings = gdf[gdf['building_id']==building_id]
            if(len(buildings) > 0):
                contained = gdf.sindex.query(buildings.geometry.unary_union, predicate='intersects')
    #         for index, row in gdf.iterrows():
    #             contained = gdf.sindex.query(row.geometry, predicate='intersects')
                iid = gdf.iloc[contained]['building_id'].values[0]
                gdf.iloc[contained, gdf.columns.get_loc('building_id')] = iid
        gdf = gdf.set_index('building_id', drop=False)
        gdf = gdf.sort_index()

        gdf = gdf.to_crs('epsg:4326')
        return gdf

    # from urbantk
    def parse_osm(osm_json):
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

    # from urbantk
    def _get_osm_filter(layer_type):
        """
        Create an osm filter based on urban-toolkit layer types (building, road, coastline, water, parks)

        :param layer_type: 'building', 'road', 'coastline', 'water', 'parks'
        :type layer_type: string
        :return: osm filters
        :rtype: list
        """

        filters = {}
        filters['way'] = []
        filters['node'] = []
        filters['rel'] = []

        if layer_type == 'water':
            natural_types = ['water', 'wetland']
            water_types = ['pond', 'reservoir', 'lagoon', 'stream_pool', 'lake', 'pool', 'canal', 'river']
            # natural_types = ['water']
            
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

    #from urbantk
    def build_osm_query(bouding_box, output_type, layers=['building','roads','coastline','water','parks']):
        """
        Create an osm query from layer types

        :param bounding_box: bounding box coordinates
        :type layer_type: list
        :param layers: layer types, defaults to ['building','roads','coastline', 'water', 'parks']
        :type layer_type: list, optional
        :return: osm query
        :rtype: string
        """

        bbox = ','.join(format(coord,".8f") for coord in bouding_box)
        query = '[out:json];('
        for layer in layers:
            filters = OSM._get_osm_filter(layer)
            for ffilter in filters['way']:
                query += 'way%s(%s);'%(ffilter,bbox)
            for ffilter in filters['rel']:
                query += 'rel%s(%s);'%(ffilter,bbox)
            for ffilter in filters['node']:
                query += 'node%s(%s);'%(ffilter,bbox)

        query += ');out %s;'%output_type

        return query

    # from urbantk
    def create_roads_polyline(osm_elements, bbox):

        mesh = []
        coords = []
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            coords.append(way['geometry'])
        lines = MultiLineString(coords)
        inter = lines.intersection(box(bbox[0],bbox[1],bbox[2],bbox[3]))

        for line in inter:
            coords = line.coords
            coords_duplicated = []
            for i in range(1, len(coords)):
                p0 = coords[i-1]
                p1 = coords[i]
                coords_duplicated.append(p0[0])
                coords_duplicated.append(p0[1])
                coords_duplicated.append(p1[0])
                coords_duplicated.append(p1[1])

            types = ['primary']

            coords_duplicated = utils.convertProjections("4326", "3395", coords_duplicated)

            coords_duplicated = utils.from2dTo3d(coords_duplicated)

            mesh.append({'type': 'roads', 'geometry': {'coordinates': coords_duplicated, 'types': types}})

        return mesh

    # from urbantk
    def create_coastline_mesh(osm_elements, bbox):
        ways = []

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

        # p = gpd.GeoSeries(LineString(polygons[0]['outer']))
        # ax = p.plot()

        # for elem in polygons[0]['inner']:
        #     p = gpd.GeoSeries(LineString(elem))
        #     p.plot(ax=ax)

        # plt.show()

        # triangulate
        mesh = []
        for poly in polygons:
            nodes = []
            rings = []

            # outer
            nodes = poly['outer']
            rings.append(len(nodes))

            # inner
            # for inner in poly['inner']:
            #     nodes.extend(inner)
            #     rings.append(len(nodes))
            
            nodes = np.array(nodes)

            cc_nodes = np.flip(nodes, axis=0) # inverting nodes to produce counter-clock wise indices

            # indices = earcut.triangulate_float64(nodes, rings)
            indices = earcut.triangulate_float64(cc_nodes, rings)

            # indices = np.reshape(indices, (-1, 3))

            # vmesh = vedo.Mesh([nodes, indices])

            # vplt = vedo.Plotter()
            # vplt += vmesh.clone()
            # vplt.show(viewup='z', zoom=1.3)


            # empty triangulation
            if(len(indices) == 0 or (len(indices) % 3) > 0):
                raise errors.InvalidPolygon('Invalid triangulation')

            # bad triangulation
            nodes = nodes.flatten().tolist()
            indices = indices.tolist()
            dev = utils.deviation(nodes, rings, 2, indices)
            # print(dev)
            # if(abs(dev) > 0.001):
            #     raise errors.InvalidPolygon('Invalid deviation (%f)'%dev)

            nodes = utils.convertProjections("4326", "3395", nodes)
            nodes = utils.from2dTo3d(nodes)

            mesh.append({'type': poly['type'], 'geometry': {'coordinates': nodes, 'indices': indices}})

        return mesh

    # from urbantk
    def create_mesh_other_layers(osm_elements, bbox, convert2dto3d=False):
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
                # for coord in way['outer']:
                    # print('%f,%f'%(coord[0],coord[1]))
                print('poly not valid')
                return
            # print(bbox)
            poly = poly.intersection(box(bbox[0],bbox[1],bbox[2],bbox[3]))
            # print(poly)
            if poly.geom_type == 'Polygon':
                exterior = list(poly.exterior.coords)
                interiors = []
                for interior in poly.interiors:
                    interiors.append(list(interior.coords))
                polygons.append([exterior, interiors])
            elif poly.geom_type == 'MultiPolygon':
                for p in poly:
                    exterior = list(p.exterior.coords)
                    interiors = []
                    for interior in p.interiors:
                        interiors.append(list(interior.coords))
                    polygons.append([exterior, interiors])


        # triangulate
        mesh = []
        for poly in polygons:
            nodes = []
            rings = []

            # outer
            nodes = poly[0]
            rings.append(len(nodes))

            # inner
            for inner in poly[1]:
                nodes.extend(inner)
                rings.append(len(nodes))
                
            nodes = np.array(nodes)

            cc_nodes = np.flip(nodes, axis=0) # inverting nodes to produce counter-clock wise indices

            indices = earcut.triangulate_float64(cc_nodes, rings)

            # empty triangulation
            if(len(indices) == 0 or (len(indices) % 3) > 0):
                raise errors.InvalidPolygon('Invalid triangulation')

            # bad triangulation
            cc_nodes = cc_nodes.flatten().tolist()
            indices = indices.tolist()
            dev = utils.deviation(cc_nodes, rings, 2, indices)
            # print(dev)
            if(abs(dev) > 0.001):
                raise errors.InvalidPolygon('Invalid deviation (%f)'%dev)
            
            nodes = nodes.flatten().tolist()

            nodes = utils.convertProjections("4326", "3395", nodes)

            if convert2dto3d:
                nodes = utils.from2dTo3d(nodes)

            # indices = [elem-1 for elem in indices] # making indices start with 0 not 1

            mesh.append({'type': 'type', 'geometry': {'coordinates': nodes, 'indices': indices}})
            # print(indices)
        
        return mesh

    # from urbantk
    def _create_surface_mesh(bbox):

        nodes = [bbox[0],bbox[1], bbox[2],bbox[1], bbox[2],bbox[3], bbox[0],bbox[3]]

        nodes = utils.convertProjections("4326", "3395", nodes)

        nodes = utils.from2dTo3d(nodes)

        indices = [0, 3, 2, 2, 1, 0]

        return [{'type': 'surface', 'geometry': {'coordinates': nodes, 'indices': indices}}]

    # from urbantk
    def _create_building_mesh(osm_elements, bbox):

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

        # single ways
        for wid in osm_elements['ways']:
            way = osm_elements['ways'][wid]
            nodes = way['geometry']
            ways.append({'outer': nodes, 'inner': [], 'tags': way['tags'],'type': 'type'})

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
                # for coord in way['outer']:
                    # print('%f,%f'%(coord[0],coord[1]))
                print('poly not valid')
                return
            if poly.overlaps(box(bbox[0],bbox[1],bbox[2],bbox[3])):
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
            if 'levels' in tags:
                roof_height = 0
                if 'roof_height' in tags:
                    if '\'' in tags['roof_height'] or '\"' in tags['roof_height']:
                        roof_height = _feet_to_meters(tags['roof_height'])
                    else:
                        r = re.compile(r"[-+]?\d*\.\d+|\d+")
                        roof_height = float(r.findall(tags['roof_height'])[0])

                # does not account for roof height
                height = float(tags['levels']) * LEVEL_HEIGHT
                if 'roof_levels' in tags and roof_height == 0:
                    height += float(tags['roof_levels']) * LEVEL_HEIGHT
                return height
            return None # Modified

        def _get_min_height(tags):
            # if 'min_height' in tags:
            #     return float(tags['min_height'])
            # if 'min_level' in tags:
            #     return float(tags['min_level']) * LEVEL_HEIGHT
            # return 0.0
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
        for index_polygon, building_info in enumerate(polygons):

            tags.append(building_info['tags'])
            min_heights.append(_get_min_height(building_info['tags']))
            heights.append(_get_height(building_info['tags']))

            shapely_polygons = [Polygon(_invert(elem)) for elem in building_info['geom']]
            geometry.append(MultiPolygon(shapely_polygons))

            building_id.append(index_polygon)

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

        df_merged_buildings = OSM.merge_buildings(gdf)

        df_mesh = Mesh.create_mesh(df_merged_buildings, 5) #gdf, size

        # # generate buildings
        # mesh = []
        # for poly in polygons:
        #     min_height = _get_min_height(poly['tags'])
        #     height = _get_height(poly['tags'])

        #     # roof
        #     coordinates, indices = _get_roof('flat', height, poly['geom'])

        #     # wall
        #     nodes = poly['geom'][0] # exterior
        #     for i in range(0,len(nodes)-1):
        #         n0 = nodes[i]
        #         n1 = nodes[i+1]

        #         v0 = [n0[0],n0[1],min_height]
        #         v1 = [n1[0],n1[1],min_height]
        #         v2 = [n0[0],n0[1],height]
        #         v3 = [n1[0],n1[1],height]

        #         i0 = len(coordinates)/3
        #         coordinates.extend(v0)
        #         coordinates.extend(v1)
        #         coordinates.extend(v2)
        #         coordinates.extend(v3)

        #         # t0
        #         indices.append(i0)
        #         indices.append(i0+1)
        #         indices.append(i0+2)

        #         # t1
        #         indices.append(i0+1)
        #         indices.append(i0+3)
        #         indices.append(i0+2)

        #     # merge 
        #     mesh.append({'type': 'type', 'geometry': {'coordinates': coordinates, 'indices': indices}})
        
        # return mesh
        return df_mesh


    # from urbantk
    def get_osm(bounding_box, layers=['buildings','roads','coastline', 'water', 'parks'], load_surface = True):
        """
        Download osm data given a bouding box and layer types

        :param bbox: bouding box coordinates
        :type bouding_box: list
        :param layers: layer types, defaults to ['buildings','roads','coastline', 'water', 'parks']
        :type layers: list, optional
        :return: osm json result
        :rtype: string
        """
        bbox = bounding_box.copy()
        api = overpass.API()

        # get bounding box from all layers
        # llayers = layers.copy()
        # query = build_osm_query(bbox, 'bb', llayers)
        # response = cache._load_osm_from_cache(query)
        # if not response:
            # response = api.get(query, build=False)
            # cache._save_osm_to_cache(query,response)
        # for el in response['elements']:
            # if 'bounds' in el:
                # bbox = utils.extend_bbox(bbox,[el['bounds']['minlat'],el['bounds']['minlon']])
                # bbox = utils.extend_bbox(bbox,[el['bounds']['maxlat'],el['bounds']['maxlon']])
        # query for geom with new bbox
        overpass_responses = {}
        for layer in layers:
            if layer == 'surface':
                continue
            query = OSM.build_osm_query(bbox, 'geom', [layer])
            response = cache._load_osm_from_cache(query)
            if not response:
                response = api.get(query, build=False)
                cache._save_osm_to_cache(query,response)
            overpass_responses[layer] = OSM.parse_osm(response)

        result = []
        ttype = ''
        styleKey = ''
        for layer in layers:
            if layer == 'surface':
                continue
            if layer == 'buildings':
                df = OSM._create_building_mesh(overpass_responses[layer], bbox)
                json_mesh = Mesh.gdf_to_json(df) # prepares the layer   
                result.append(json_mesh)
                continue
            if layer == 'roads':
                geometry = OSM.create_roads_polyline(overpass_responses[layer], bbox)
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = 'roads'
            elif layer == 'coastline':
                geometry = OSM.create_coastline_mesh(overpass_responses[layer], bbox)
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = 'land'
            else:
                geometry = OSM.create_mesh_other_layers(overpass_responses[layer], bbox, convert2dto3d=True)
                ttype = 'TRIANGLES_3D_LAYER'
                styleKey = layer
            result.append({'id': layer, 'type': ttype, 'renderStyle': ['SMOOTH_COLOR'], 'styleKey': styleKey, 'visible': True, 'selectable': True, 'skip': False, 'data': geometry})
        
        if load_surface:
            geometry = OSM._create_surface_mesh(bbox)
            flat_coordinates = geometry[0]['geometry']['coordinates']
            grouped_coordinates = np.reshape(np.array(flat_coordinates), (int(len(flat_coordinates)/3), -1))

            coordinates, indices, ids, normals = Mesh.discretize_surface_mesh(grouped_coordinates, 5)

            data_array = [{
                'geometry': {
                    'coordinates': [float(elem) for sublist in coordinates for elem in sublist],
                    'indices': [int(elem) for sublist in indices for elem in sublist],
                    'ids': [int(elem) for elem in ids],
                    'normals': [float(elem) for sublist in normals for elem in sublist]
                }
            }]

            result.insert(0,{'id': 'surface', 'type': "TRIANGLES_3D_LAYER", 'renderStyle': ['SMOOTH_COLOR'], 'styleKey': 'surface', 'visible': True, 'selectable': False, 'skip': False, 'data': data_array})

        return result

    # from urbantk
    # Load all layers into urban component (allways loads surface layer)
    def load_from_bbox(bbox, layers=['building','roads','coastline', 'water', 'parks']):
        
        cam = utils.get_camera(bbox)
        loaded = OSM.get_osm(bbox, layers)
        component = urbanComponent.UrbanComponent(layers = loaded, bbox = bbox, camera = cam)

        return component
    
    class RelationHandler(osmium.SimpleHandler):
        def __init__(self):
            osmium.SimpleHandler.__init__(self)
            self.count_bid = 0
            self.area_to_bid = {}
            self.relation_to_bid = {}

        def get_area_to_bid(self):
            return self.area_to_bid

        def get_relation_to_bid(self):
            return self.relation_to_bid

        def relation(self, r):
            tags = dict(r.tags)

            # Qualifiers
            if not ('building' in tags or 'building:part' in tags or tags.get('type') == 'building'):
                return
            # Disqualifiers
            if (tags.get('location') == 'underground' or 'bridge' in tags):
                return

            if r.id not in self.relation_to_bid:
                self.relation_to_bid[r.id] = self.count_bid
                self.count_bid +=1

            for member in r.members:
                if member.ref not in self.area_to_bid:
                    self.area_to_bid[member.ref] = self.relation_to_bid[r.id]

    class AreaHandler(osmium.SimpleHandler):
        def __init__(self, area_to_bid, relation_to_bid):
            osmium.SimpleHandler.__init__(self)
            self.id = []
            self.orig_id = []
            self.building_id = []
            self.tag = []
            self.geometry = []
            self.height = []
            self.min_height = []
            self.wkbfab = osmium.geom.WKBFactory()

            self.area_to_bid = area_to_bid
            self.relation_to_bid = relation_to_bid
    #         self.max_bid = max(self.area_to_bid, key=self.area_to_bid.get)
    #         self.max_bid = max(self.max_bid,max(self.relation_to_bid, key=self.relation_to_bid.get))
            self.max_bid = max(self.area_to_bid.values())
            self.max_bid = max(self.max_bid,max(self.relation_to_bid.values()))

            self.LEVEL_HEIGHT = 3.4

        # https://wiki.openstreetmap.org/wiki/Simple_3D_buildings#Other_roof_tags
        def feet_to_meters(self, s):
            r = re.compile("([0-9]*\.?[0-9]+)'([0-9]*\.?[0-9]+)?\"?")
            m = r.findall(s)[0]
            if len(m[0]) > 0 and len(m[1]) > 0:
                m = float(m[0]) + float(m[1]) / 12.0
            elif len(m[0]) > 0:
                m = float(m[0])
            return m * 0.3048

        def get_height(self, tags):
            if 'height' in tags:
                # already accounts for roof
                if '\'' in tags['height'] or '\"' in tags['height']:
                    return self.feet_to_meters(tags['height'])
                r = re.compile(r"[-+]?\d*\.\d+|\d+")
                return float(r.findall(tags['height'])[0])
            if 'levels' in tags:
                roof_height = 0
                if 'roof_height' in tags:
                    if '\'' in tags['roof_height'] or '\"' in tags['roof_height']:
                        roof_height = self.feet_to_meters(tags['roof_height'])
                    else:
                        r = re.compile(r"[-+]?\d*\.\d+|\d+")
                        roof_height = float(r.findall(tags['roof_height'])[0])

                # does not account for roof height
                height = float(tags['levels']) * self.LEVEL_HEIGHT
                if 'roof_levels' in tags and roof_height == 0:
                    height += float(tags['roof_levels']) * self.LEVEL_HEIGHT
                return height
            return None

        def get_min_height(self, tags):
            min_height = 0
            if 'min_height' in tags:
                # already accounts for roof
                if '\'' in tags['min_height'] or '\"' in tags['min_height']:
                    return self._feet_to_meters(tags['min_height'])
                r = re.compile(r"[-+]?\d*\.\d+|\d+")
                min_height = float(r.findall(tags['min_height'])[0])
            if 'min_level' in tags:
                height = float(tags['min_level']) * self.LEVEL_HEIGHT
                min_height = height
            return max(0.0, min_height)

        def get_gdf(self):
            geometry = gpd.GeoSeries.from_wkb(self.geometry, crs='epsg:4326')
            height = pd.Series(self.height, dtype='float')
            min_height = pd.Series(self.min_height, dtype='float')
            tag = pd.Series(self.tag)
            iid = pd.Series(self.id, dtype='UInt64')
            orig_id = pd.Series(self.orig_id, dtype='UInt64')
            building_id = pd.Series(self.building_id, dtype='UInt64')

            gdf = gpd.GeoDataFrame({
                'id': iid,
                'orig_id': orig_id,
                'building_id': building_id,
                'geometry': geometry,
                'min_height': min_height,
                'height': height,
                'tags': tag
            }, index=geometry.index)

            # drop bad values
            gdf = gdf[~gdf['height'].isnull()]
            gdf = gdf[gdf['min_height'] >= 0]
            gdf = gdf[gdf['height'] > 0]

            # new index
            gdf = gdf.set_index('building_id', drop=False)
            gdf = gdf.sort_index()

#             # set new building ids
#             bid = -1
#             cbid = -1
#             bids = []
#             for index, row in gdf.iterrows():
#                 if index != cbid:
#                     cbid = index
#                     bid +=1
#                 bids.append(bid)

#             gdf['building_id'] = bids
#             gdf = gdf.set_index('building_id', drop=False)
#             gdf = gdf.sort_index()

            return gdf

        def area(self, a):
            tags = dict(a.tags)
            iid = int(a.id)
            orig_id = int(a.orig_id())

            # Qualifiers
            if not ('building' in tags or 'building:part' in tags or tags.get('type') == 'building'):
                return
            # Disqualifiers
            if (tags.get('location') == 'underground' or 'bridge' in tags):
                return

            if orig_id in self.area_to_bid:
                building_id = self.area_to_bid[orig_id]
            elif orig_id in self.relation_to_bid:
                building_id = self.relation_to_bid[orig_id]
            else:
                building_id = self.max_bid
                self.max_bid+=1

            try:
                poly = self.wkbfab.create_multipolygon(a)
                height = self.get_height(tags)
                min_height = self.get_min_height(tags)

                self.geometry.append(poly)
                self.height.append(height)
                self.min_height.append(min_height)
                self.tag.append(tags)
                self.id.append(iid)
                self.orig_id.append(orig_id)
                self.building_id.append(building_id)

            except Exception as e:
                print(e)
                print(a)

class Mesh:
                
    def split_poly(poly, size):
        merged_segments = []
        points = []

        boundaries = list(poly)
        epsilon = 1e-8
        for poly in boundaries:
            lines = poly.exterior
            length = lines.length
            size = min(size, length)
            num_cells = ((length - length%size)/size) # equal sized cells
            size = length / num_cells
            distances = np.arange(0, length, size)

            interpolated_points = list(MultiPoint([lines.interpolate(distance) for distance in distances]))
            points = list(MultiPoint(lines.coords))

            joined_points = []

            for j in range(0, len(points)-1):
                segment = LineString([points[j], points[j+1]])
                joined_points.append(points[j])

                aux = []
                for k in range(0, len(interpolated_points)):
                    pt = interpolated_points[k]
                    if pt.distance(points[j]) > epsilon and pt.distance(points[j+1]) and pt.buffer(epsilon).intersects(segment):
                        joined_points.append(pt)
                    else:
                        aux.append(pt)
                interpolated_points = aux 

            joined_points.append(points[-1])

            cur_length = 0
            segments = []
            cur_multiline = []
            for j in range(0, len(joined_points)-1):
                segment = LineString([joined_points[j], joined_points[j+1]])

                cur_multiline.append(segment)
                cur_length += segment.length
    #             print(segment.length)

                if (cur_length >= size-1e-5):
                    cur_length = 0
                    cur_pt = joined_points[j]
                    segments.append(cur_multiline)
                    cur_multiline = []

    #             if (cur_length < DISTANCE_DELTA-1e-5) and (j == len(joined_points)-2):
    #                 segments[-1].append(segment)


            for j in range(0,len(segments)):
                seg = linemerge(MultiLineString(segments[j]))
                merged_segments.append(seg)

            points = joined_points

        return merged_segments #, list(MultiPoint([lines.interpolate(distance) for distance in distances]))


    def discretize_surface_mesh(coords, size=-1):
        poly = Polygon(coords[:,:2])

        coordinates, indices, ids, _, _ = Mesh.get_roof(poly, None, 0, size)

        vmesh = vedo.Mesh([coordinates, indices])
        normals = vmesh.normals(cells=False)

        return coordinates, indices, ids, normals


    def extrude(segments, min_height, height, size):

        def computeAngle(vec1, vec2):
            unit_vector_1 = vec1 / np.linalg.norm(vec1)
            unit_vector_2 = vec2 / np.linalg.norm(vec2)
            dot_product = np.dot(unit_vector_1, unit_vector_2)
            angle = np.arccos(round(dot_product, 4)) * 180.0 / math.pi #degrees)

            return angle

        length = height-min_height
        
        if size == -1:
            size = length
        
        size = min(size, length)
        num_cells = ((length - length%size)/size) # equal sized cells

        size = length/num_cells
        distances = np.arange(0, length, size)
#         print(min_height, height, distances)

        coordinates = []
        indices = []
        ids = []
        colors = []
        corner = [] # one value for each coordinate
        footPrintPoints = [] # stores all footprint points that form the segments
        cornersIndex = [] # stores the index of the corners in the polygon. Two indices define a facade.
        uvPerPoint = [] # stores the uv value for each point in the segments 
        cid = -1

        for index, seg in enumerate(segments):
            
            points = list(zip(*seg.coords.xy))

            footPrintPoints += points

            for i in range(0, len(points)-1):

                p0 = points[i]
                p1 = points[i+1]

                p1IsCorner = False

                # there are at least three points in the segment
                if(len(points) >= i+3):
                    p2 = points[i+2]

                    vec1 = [p0[0] - p1[0], p0[1] - p1[1]]
                    vec2 = [p2[0] - p1[0], p2[1] - p1[1]]

                    angleVec = computeAngle(vec1, vec2)

                    if(180 - angleVec >= 20): # a 20 degrees difference is considered a corner
                        p1IsCorner = True

                else:
                    nextSegmentPoints = []

                    if(index <= len(segments)-2): # if it is not the last segment
                        nextSegmentPoints = list(zip(*segments[index+1].coords.xy))
                    else: # if it is the last segment the first segment is used (circular)
                        nextSegmentPoints = list(zip(*segments[0].coords.xy))

                    p2 = nextSegmentPoints[1]

                    vec1 = [p0[0] - p1[0], p0[1] - p1[1]]
                    vec2 = [p2[0] - p1[0], p2[1] - p1[1]]

                    angleVec = computeAngle(vec1, vec2)
                    
                    if(180 - angleVec >= 20): # a 20 degrees difference is considered a corner
                        p1IsCorner = True
                
                if(p1IsCorner):
                    cornersIndex.append(index+i+1)

        def getUV(anchor1, anchor2, p):
            if(p[0] == anchor2[0] and p[1] == anchor2[1]):
                return 1
            elif(p[0] == anchor1[0] and p[1] == anchor1[1]):
                return 0
            elif(anchor1[0] == anchor2[0] and anchor1[1] == anchor2[1]):
                return 1

            distanceAnchor1 = math.sqrt(math.pow(p[0] - anchor1[0], 2) + math.pow(p[1] - anchor1[1], 2))
            dTotal = math.sqrt(math.pow(anchor2[0] - anchor1[0], 2) + math.pow(anchor2[1] - anchor1[1], 2))

            return distanceAnchor1/dTotal

        lastCorner = 0
        for index, point in enumerate(footPrintPoints):
            if(index in cornersIndex):
                lastCorner = index

            nextCorner = len(cornersIndex)-1

            for i in range(index, len(footPrintPoints)): # look for the next corner
                if(i in cornersIndex):
                    nextCorner = i
                    break

            uv = getUV(footPrintPoints[lastCorner], footPrintPoints[nextCorner], point)

            uvPerPoint.append(uv)

        for index, seg in enumerate(segments):
            
            points = list(zip(*seg.coords.xy))

            for distance in distances:
                if distance + min_height >= height:
                    continue
                color = np.random.rand(3,)
                cid+=1
                for i in range(0, len(points)-1):

                    p0 = points[i]
                    p1 = points[i+1]

                    v0 = [p0[0],p0[1],distance+min_height]
                    v1 = [p1[0],p1[1],distance+min_height]
                    v2 = [p0[0],p0[1],distance+min_height+size]
                    v3 = [p1[0],p1[1],distance+min_height+size]

                    i0 = int(len(coordinates)/3)
                    coordinates.extend(v0)
                    coordinates.extend(v1)
                    coordinates.extend(v2)
                    coordinates.extend(v3)

                    corner.append(uvPerPoint[index+i])
                    corner.append(uvPerPoint[index+i+1])
                    corner.append(uvPerPoint[index+i])
                    corner.append(uvPerPoint[index+i+1])

                    # t0
                    indices.append(i0)
                    indices.append(i0+1)
                    indices.append(i0+2)

                    # t1
                    indices.append(i0+1)
                    indices.append(i0+3)
                    indices.append(i0+2)
                    
                    # color and ids per face
                    colors.append(color)
                    colors.append(color)
                    ids.append(cid)
                    ids.append(cid)

        coordinates = np.array(coordinates).reshape(-1, 3)
        indices = np.array(indices).reshape(-1, 3)
        colors = np.array(colors).reshape(-1, 3)
        ids = np.array(ids)
        corner = np.array(corner)
        return coordinates, indices, ids, colors, corner


    def azimuth(mrr):

        def _azimuth(point1, point2):
            """azimuth between 2 points (interval 0 - 180)"""
            angle = np.arctan2(point2[0] - point1[0], point2[1] - point1[1])
            return np.degrees(angle) if angle > 0 else np.degrees(angle) + 180

        def _dist(a, b):
            """distance between points"""
            return math.hypot(b[0] - a[0], b[1] - a[1])

        """azimuth of minimum_rotated_rectangle"""
    #     bbox = list(mrr.exterior.coords)
        bbox = list(mrr.coords)
        axis1 = _dist(bbox[0], bbox[3])
        axis2 = _dist(bbox[0], bbox[1])

        if axis1 <= axis2:
            az = _azimuth(bbox[0], bbox[1])
        else:
            az = _azimuth(bbox[0], bbox[3])

        return az

    def get_roof(bottom_poly, top_poly, height, size):
    #     gdf_poly = gpd.GeoDataFrame(geometry=[poly])
        if top_poly != None:
            polys = bottom_poly.difference(top_poly)
        else:
            polys = bottom_poly
            
        if polys.geom_type == 'Polygon':
            polys = MultiPolygon([polys])

        coordinates = []
        indices = []
        ids = []
        colors = []
        corners = []

        cid = -1
        count = 0
        for poly in polys:        
            mrr = poly.minimum_rotated_rectangle
            rot = Mesh.azimuth(mrr.exterior)
            poly = affinity.rotate(poly, rot, (0,0))

            line = LineString(poly.exterior.coords)
            gdf_line = gpd.GeoDataFrame(geometry=[line])

            xmin, ymin, xmax, ymax = gdf_line.total_bounds
            
            if size == -1:
                cells = [box(xmin, ymin, xmax, ymax)]
            else:
                cell_width = cell_height = size
                cells = []
                for x0 in np.arange(xmin, xmax+cell_width, cell_width):
                    for y0 in np.arange(ymin, ymax+cell_height, cell_height):
                        x1 = x0-cell_width
                        y1 = y0+cell_height
                        new_cell = box(x0, y0, x1, y1)
                        cells.append(new_cell)

            intersection = gpd.overlay(gpd.GeoDataFrame({'geometry': gpd.GeoSeries(poly)}), gpd.GeoDataFrame({'geometry': gpd.GeoSeries(cells)}),how='intersection',keep_geom_type=True)
            cells = intersection.rotate(-rot, origin=(0,0)).values

            # plt.plot(*seg.coords.xy)
            
            for cell in cells:
                ccell = []
                if cell.geom_type == 'MultiPolygon':
                    ccell = list(cell)
                elif cell.geom_type == 'Polygon':
                    ccell = [cell]

                for c in ccell:
                    points = np.array(c.exterior.coords[0:-1]) # remove last one (repeated)
                    rings = np.array([len(points)])
                    ind = earcut.triangulate_float64(points, rings)
                    # print(points)
                    # print(ind)
                    ind = (ind+count).tolist()
                    indices += ind

                    color = np.random.rand(3,)
                    points = points.flatten().tolist()
                    cid+=1
                    for i in range(0, len(points), 2):
                        coordinates.append(points[i])
                        coordinates.append(points[i+1])
                        coordinates.append(height)

                        if(points[i] == xmin or points[i] == xmax or points[i+1] == ymin or points[i+1] == ymax): # testing if they are on the borders of the roof
                            corners.append(1)
                        else:
                            corners.append(0)
                        
                    count = int(len(coordinates)/3)
                    
                    colors = colors + [color] * int(len(ind)/3)
                    ids = ids + [cid] * int(len(ind)/3)


        coordinates = np.array(coordinates).reshape(-1, 3)
        indices = np.array(indices).reshape(-1, 3)
        colors = np.array(colors).reshape(-1, 3)
        ids = np.array(ids)
        corners = np.array(corners)

        return coordinates, indices, ids, colors, corners

    def merge_building_mesh(building):
        
        building = building.to_crs('epsg:3395')
        min_heights = building.min_height.values
        heights = building.height.values
        all_heights = np.concatenate((min_heights, heights))
        all_heights = np.unique(all_heights)
        all_heights = np.sort(all_heights)

        merged_geometry = []
        merged_height = []
        merged_min_height = []
        for i in range(0, len(all_heights)-1):
            min_height = all_heights[i]
            height = all_heights[i+1]
            bbl = building[(building['min_height'] <= all_heights[i]) & (building['height'] > all_heights[i])]

            if len(bbl) == 0:
                continue

            merged_geom = bbl.unary_union
            if merged_geom.type == 'Polygon':
                merged_geom = MultiPolygon([merged_geom])

            oriented_geom = []
            for geom in merged_geom:
                oriented_geom.append(polygon.orient(geom, 1)) # counter-clockwise
            oriented_geom = MultiPolygon(oriented_geom)

            merged_geometry.append(oriented_geom)
            merged_min_height.append(min_height)
            merged_height.append(height)

        d = {'min_height': merged_min_height, 'height': merged_height, 'geometry': merged_geometry}
        merged_building = gpd.GeoDataFrame(d, crs='epsg:3395')
        merged_building['building_id'] = building.iloc[0]['building_id']

        return merged_building

    def get_building_mesh(building, size = -1):
        merged_building = Mesh.merge_building_mesh(building)

        boundaries = list(merged_building.geometry)

        coords = np.empty((0,3))
        indices = np.empty((0,3))
        ids = np.empty((0))
        colors = np.empty((0,3))
        corners = np.empty((0))

        orientedEnvelope = []
        sectionFootprint = []
        sectionHeight = []
        sectionMinHeight = []

        for i in range(0, len(boundaries)):
            geom = boundaries[i].geoms
            height = merged_building.iloc[i].height
            min_height = merged_building.iloc[i].min_height

            sectionHeight.append(height)
            sectionMinHeight.append(min_height)

            orientedEnvelope.append([])
            sectionFootprint.append([])

            for index, coordinate in enumerate(geom[0].minimum_rotated_rectangle.exterior.coords): # TODO: check if only one geometry is stored in geom
                if(index != (len(geom[0].minimum_rotated_rectangle.exterior.coords) - 1)):
                    orientedEnvelope[len(orientedEnvelope)-1] += list(coordinate)

            for coordinate in geom[0].exterior.coords:
                sectionFootprint[len(sectionFootprint)-1] += list(coordinate)

            # roof
            bottom_poly = boundaries[i]
            if i + 1 < len(boundaries):
                top_poly = boundaries[i+1]
            else:
                top_poly = None
            coordinates_roof, indices_roof, ids_roof, colors_roof, corners_roof = Mesh.get_roof(bottom_poly, top_poly, height, size)
            coordinates_roof = coordinates_roof.reshape(-1, 3)
            indices_roof = indices_roof.reshape(-1, 3)
            indices_roof = indices_roof + coords.shape[0]
            ids_roof = ids_roof + ids.shape[0]

            # walls
            segments = Mesh.split_poly(geom, size)
            coordinates_walls, indices_walls, ids_walls, colors_walls, corners_walls = Mesh.extrude(segments, min_height, height, size)
            indices_walls = indices_walls + coordinates_roof.shape[0] + coords.shape[0]
            ids_walls = ids_walls + ids_roof.shape[0] + ids.shape[0]
            # indices_walls = indices_walls + coords.shape[0]
            # ids_walls = ids_walls + ids.shape[0]

            coordinates_walls = coordinates_walls.reshape(-1, 3)
            indices_walls = indices_walls.reshape(-1, 3)

            coords = np.concatenate((coords, coordinates_roof, coordinates_walls))
            indices = np.concatenate((indices, indices_roof, indices_walls))
            ids = np.concatenate((ids, ids_roof, ids_walls))
            colors = np.concatenate((colors, colors_roof, colors_walls))
            corners = np.concatenate((corners, corners_roof, corners_walls))
            # coords = np.concatenate((coords, coordinates_roof))
            # indices = np.concatenate((indices, indices_roof))
            # ids = np.concatenate((ids, ids_roof))
            # colors = np.concatenate((colors, colors_roof))

        coords = coords.reshape(-1, 3)
        indices = indices.reshape(-1, 3)

        return coords, indices, ids, colors, sectionHeight, sectionMinHeight, orientedEnvelope, sectionFootprint, corners
    
    # create_mesh for buildings
    def create_mesh(gdf, size):
        
        gdf = gdf.to_crs('epsg:3395')   
        
        building_ids = []
        coordinates = []
        indices = []
        ids = []
        colors = []
        heights = []
        minHeights = []
        envelopes = []
        footprints = []
        allCorners = []
        unique_buildings = gdf.index.unique()
        for i in trange(len(unique_buildings)):
            building_id = unique_buildings[i]
            building = gdf.loc[[building_id]]
            coord, ind, iids, cols, sectionHeight, sectionMinHeight, orientedEnvelope, sectionFootprint, corners = Mesh.get_building_mesh(building, size)
            building_ids.append(building_id)
            coordinates.append(coord)
            indices.append(ind)
            ids.append(iids)
            colors.append(cols)
            heights.append(sectionHeight)
            minHeights.append(sectionMinHeight)
            envelopes.append(orientedEnvelope)
            footprints.append(sectionFootprint)
            allCorners.append(corners)

        df = pd.DataFrame({
            'building_id': pd.Series(building_ids),
            'coordinates': pd.Series(coordinates),
            'indices': pd.Series(indices),
            'ids': pd.Series(ids),
            'colors': pd.Series(colors),
            'heights': pd.Series(heights),
            'minHeights': pd.Series(minHeights),
            'orientedEnvelope': pd.Series(envelopes),
            'sectionFootprint': pd.Series(footprints),
            'corners': pd.Series(allCorners)
        })

        df = df.set_index('building_id', drop=False)
        df = df.sort_index()

        # df['coordinates'] = df['coordinates'].apply(lambda elem: MultiPoint(elem))

        # # Creating temporary gdf to use to_crs function and get coordinates in lat/lng
        # temp_gdf = gpd.GeoDataFrame(df, geometry='coordinates')
        # temp_gdf = temp_gdf.set_crs('epsg:3395')
        # temp_gdf = temp_gdf.to_crs('epsg:4326')

        # # Converting back to a Dataframe
        # df = pd.DataFrame(temp_gdf)
        
        # # Converting MultiPoint object back to plain array
        # df['coordinates'] = df['coordinates'].apply(lambda elem: [[p.y, p.x, p.z] for p in elem])

        return df

    
    def get_coordinates(gdf, compute_normals=False):
        coordinates = gdf['coordinates'].values
        indices = gdf['indices'].values
        ids = gdf['ids'].values
        colors = gdf['colors'].values
        
        coords_all = np.empty((0,3))
        indices_all = np.empty((0,3))
        colors_all = np.empty((0,3))
        ids_all = np.empty((0))
        
        for i in range(0, len(coordinates)):
            indices_all = np.concatenate((indices_all, np.array(indices[i])+coords_all.shape[0]))
            coords_all = np.concatenate((coords_all, coordinates[i]))
            colors_all = np.concatenate((colors_all, colors[i]))
            ids_all = np.concatenate((ids_all, ids[i]))
            
        if compute_normals:
            vmesh = vedo.Mesh([coords_all, indices_all])
            normals_all = vmesh.normals(cells=False)
            return coords_all, indices_all, ids_all, colors_all, normals_all
        
        return coords_all, indices_all, ids_all, colors_all
    
    # this JSON (represented as a python dict) follows the urbantk-map layer format specification
    def gdf_to_json(gdf, layer_id = "buildings", layer_type = 'BUILDINGS_LAYER', renderStyle = ["SMOOTH_COLOR"], styleKey = "building", visible = True, selectable = False, skip = False):

        json_new = {}

        # config parameters
        json_new["id"] = layer_id
        json_new["type"] = layer_type
        json_new["renderStyle"] = renderStyle
        json_new["styleKey"] = styleKey
        json_new["visible"] = visible
        json_new["selectable"] = selectable
        json_new["skip"] = skip

        json_new["data"] = []

        for index in range(0, len(gdf)):

            flattened_coordinates = []
            flattened_indices = []
            flattened_normals = []

            coords_all, indices_all, ids_all, _, normals = Mesh.get_coordinates(gdf.iloc[[index]], compute_normals=True) # Calculating normals

            flattened_coordinates += [item for sublist in coords_all for item in sublist]
            flattened_indices += [int(item) for sublist in indices_all for item in sublist]
            flattened_normals += [float(item) for sublist in normals for item in sublist]

            json_new["data"].append({
                "geometry": {
                    "coordinates": flattened_coordinates,
                    "indices": flattened_indices,
                    "normals": flattened_normals,
                    "ids": [int(elem) for elem in ids_all],
                    "heights": gdf.iloc[[index]]["heights"].tolist()[0],
                    "minHeights": gdf.iloc[[index]]["minHeights"].tolist()[0],
                    "orientedEnvelope": gdf.iloc[[index]]["orientedEnvelope"].tolist()[0],
                    "sectionFootprint": gdf.iloc[[index]]["sectionFootprint"].tolist()[0],
                    "corners": gdf.iloc[[index]]["corners"].tolist()[0].tolist()
                }
            })

        return json_new

    def view(gdf):

        coords_all, indices_all, ids_all, colors_all = Mesh.get_coordinates(gdf)
        vertices = coords_all - np.mean(coords_all, axis=0)
        vmesh = vedo.Mesh([vertices, indices_all])
        vmesh.cellIndividualColors(colors_all*255)
        vmesh.backFaceCulling(True)
        vmesh.lineWidth(1.5)
        
        plt = vedo.Plotter()
#         radius = vmesh.diagonalSize()/5
#         plt.addAmbientOcclusion(radius)
        plt += vmesh.clone()
        return plt.show(viewup='z', zoom=1.3)
    

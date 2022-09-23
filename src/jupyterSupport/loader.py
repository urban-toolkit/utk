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

from tqdm.notebook import trange, tqdm

import vedo

from shapely import affinity
from shapely.ops import split, snap, unary_union, polygonize, linemerge
from shapely.geometry import MultiPolygon, Polygon, MultiLineString, LineString, Point, MultiPoint, box, polygon
from pyproj import Transformer

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

    def extrude(segments, min_height, height, size):

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
        cid = -1
        for seg in segments:
            for distance in distances:
                if distance + min_height >= height:
                    continue
                points = list(zip(*seg.coords.xy))
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
        return coordinates, indices, ids, colors


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
                        
                    count = int(len(coordinates)/3)
                    
                    colors = colors + [color] * int(len(ind)/3)
                    ids = ids + [cid] * int(len(ind)/3)


        coordinates = np.array(coordinates).reshape(-1, 3)
        indices = np.array(indices).reshape(-1, 3)
        colors = np.array(colors).reshape(-1, 3)
        ids = np.array(ids)

        return coordinates, indices, ids, colors

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

        for i in range(0, len(boundaries)):
            geom = boundaries[i].geoms
            height = merged_building.iloc[i].height
            min_height = merged_building.iloc[i].min_height

            # roof
            bottom_poly = boundaries[i]
            if i + 1 < len(boundaries):
                top_poly = boundaries[i+1]
            else:
                top_poly = None
            coordinates_roof, indices_roof, ids_roof, colors_roof = Mesh.get_roof(bottom_poly, top_poly, height, size)
            coordinates_roof = coordinates_roof.reshape(-1, 3)
            indices_roof = indices_roof.reshape(-1, 3)
            indices_roof = indices_roof + coords.shape[0]
            ids_roof = ids_roof + ids.shape[0]

            # walls
            segments = Mesh.split_poly(geom, size)
            coordinates_walls, indices_walls, ids_walls, colors_walls = Mesh.extrude(segments, min_height, height, size)
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
            # coords = np.concatenate((coords, coordinates_roof))
            # indices = np.concatenate((indices, indices_roof))
            # ids = np.concatenate((ids, ids_roof))
            # colors = np.concatenate((colors, colors_roof))

        coords = coords.reshape(-1, 3)
        indices = indices.reshape(-1, 3)

        return coords, indices, ids, colors
    
    def create_mesh(gdf, size):
        
        gdf = gdf.to_crs('epsg:3395')   
        
        building_ids = []
        coordinates = []
        indices = []
        ids = []
        colors = []
        unique_buildings = gdf.index.unique()
        for i in trange(len(unique_buildings)):
            building_id = unique_buildings[i]
            building = gdf.loc[[building_id]]
            coord, ind, iids, cols = Mesh.get_building_mesh(building, size)
            building_ids.append(building_id)
            coordinates.append(coord)
            indices.append(ind)
            ids.append(iids)
            colors.append(cols)

        
        df = pd.DataFrame({
            'building_id': pd.Series(building_ids),
            'coordinates': pd.Series(coordinates),
            'indices': pd.Series(indices),
            'ids': pd.Series(ids),
            'colors': pd.Series(colors)
        })

        df = df.set_index('building_id', drop=False)
        df = df.sort_index()
        
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
    
    # this JSON follows the urbantk-map layer format specification
    def gdf_to_json(gdf, layer_id = "buildings-layer", layer_type = 'BUILDINGS_LAYER', renderStyle = ["SMOOTH_COLOR"], styleKey = "building", visible = True, selectable = False, skip = False):
        gdf_raw_json = pd.DataFrame.to_json(gdf)

        # config parameters
        gdf_raw_json.id = layer_id
        gdf_raw_json.type = layer_type
        gdf_raw_json.renderStyle = renderStyle
        gdf_raw_json.styleKey = styleKey
        gdf_raw_json.visible = visible
        gdf_raw_json.selectable = selectable
        gdf_raw_json.skip = skip

        # data
        gdf_raw_json.data = [{}]


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
        
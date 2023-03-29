import pandas as pd
import geopandas as gpd
import numpy as np
import math
import mapbox_earcut as earcut
import vedo
import time
import os
import matplotlib.pyplot as plt 

from tqdm.notebook import trange
from shapely import affinity
from shapely.ops import linemerge
from shapely.geometry import MultiPolygon, MultiLineString, LineString, Point, MultiPoint, box, polygon, Polygon, LinearRing

class Buildings:
                
    def split_poly(poly, size):

        merged_segments = []
        points = []

        boundaries = list(poly)

        # isCorner = [] # stores which joined_points are corners (list of bool)
        # corners = []

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
                # corners.append(points[j])

                aux = []
                for k in range(0, len(interpolated_points)):
                    pt = interpolated_points[k]
                    if pt.distance(points[j]) > epsilon and pt.distance(points[j+1]) and pt.buffer(epsilon).intersects(segment):
                        joined_points.append(pt)
                    else:
                        aux.append(pt)
                interpolated_points = aux 

            joined_points.append(points[-1])
            # corners.append(points[-1])

            cur_length = 0
            segments = []
            cur_multiline = []
            for j in range(0, len(joined_points)-1):
                segment = LineString([joined_points[j], joined_points[j+1]])

                cur_multiline.append(segment)
                cur_length += segment.length

                if (cur_length >= size-1e-5):
                    cur_length = 0
                    cur_pt = joined_points[j]
                    segments.append(cur_multiline)
                    cur_multiline = []

    #             if (cur_length < DISTANCE_DELTA-1e-5) and (j == len(joined_points)-2):
    #                 segments[-1].append(segment)

            # for j in range(0,len(segments)):
            #     seg = linemerge(MultiLineString(segments[j]))
            #     for coordObj in list(MultiPoint(seg.coords)): # TODO: maybe we can have performance issues in this nested loop
            #         corner = False
            #         for elem in corners:
            #             if(coordObj.equals(elem)):
            #                 corner = True
            #                 break
            #         if corner:
            #             # if(len(isCorner) >= 2):
            #             #     # isCorner[len(isCorner)-2] = False
            #             #     if isCorner[len(isCorner)-2]: # You can not have two trues in a row
            #             #         isCorner.append(False)
            #             #     else:
            #             #         isCorner.append(True)
            #             isCorner.append(True)
            #         else:
            #             isCorner.append(False)

            #     merged_segments.append(seg)

            for j in range(0,len(segments)):
                seg = linemerge(MultiLineString(segments[j]))
                merged_segments.append(seg)

            points = joined_points

        # return merged_segments, isCorner #, list(MultiPoint([lines.interpolate(distance) for distance in distances]))
        return merged_segments #, list(MultiPoint([lines.interpolate(distance) for distance in distances]))
    

    # def extrude(segments, min_height, height, size, isCorner):
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
        # corner = [] # one value for each coordinate
        # width = []
        # heights = [] # one value for each coordinate
        footPrintPoints = [] # stores all footprint points that form the segments
        groupedFootPrintPoints = [] # stores all footprint points grouped by segment
        # duplicatedIsCorner = []
        # cornersIndex = [] # stores the index of the corners in the polygon. Two indices define a facade.
        cid = -1

        for index, seg in enumerate(segments):
            
            points = list(zip(*seg.coords.xy))

            footPrintPoints += points

            groupedFootPrintPoints.append(points)

        # # duplicates all corners (if they are not already duplicated)
        # duplicatedPoints = []
        # readSegPoints = 0
        # for segPoints in groupedFootPrintPoints:
        #     duplicatedPoints.append([])
        #     for index, point in enumerate(segPoints):
        #         duplicatedPoints[len(duplicatedPoints)-1].append(point)
        #         duplicatedIsCorner.append(isCorner[readSegPoints+index])
        #         if isCorner[readSegPoints+index]:
        #             if(index != 0 and index != len(segPoints)-1): # if point is in the beggining or end of the segment it is already duplicated
        #                 duplicatedPoints[len(duplicatedPoints)-1].append(point) # TODO maybe copy the point array
        #                 duplicatedIsCorner.append(isCorner[readSegPoints+index])

        #     readSegPoints += len(segPoints)

        # flatDuplicatedPoints = [item for sublist in duplicatedPoints for item in sublist]

        # uvPerPoint = np.empty(len(flatDuplicatedPoints)) # stores the uv value for each point in the segments 
        # wallsWidth = np.empty(len(flatDuplicatedPoints)) # stores the width of all walls determined by two corners

        # def calcDistance(listPoints, point1, point2):
        #     if(point1 == point2):
        #         return 0
            
        #     accDistance = 0
            
        #     if(point1 < point2):
        #         for i in range(point1, point2):
        #             accDistance += math.sqrt(math.pow(listPoints[i+1][0] - listPoints[i][0], 2) + math.pow(listPoints[i+1][1] - listPoints[i][1], 2))
        #     else:
        #         # calculate distance of all points after point1
        #         for i in range(point1, len(listPoints)-1):
        #             accDistance += math.sqrt(math.pow(listPoints[i+1][0] - listPoints[i][0], 2) + math.pow(listPoints[i+1][1] - listPoints[i][1], 2))

        #         # calculate distance of all points before point2
        #         for i in range(0, point2):
        #             accDistance += math.sqrt(math.pow(listPoints[i+1][0] - listPoints[i][0], 2) + math.pow(listPoints[i+1][1] - listPoints[i][1], 2))

        #     return accDistance

        # def getUV(listPoints, anchor1, p):

        #     distanceAnchor1 = calcDistance(listPoints, anchor1, p)
            
        #     return distanceAnchor1

        # cornersPairs = [] # store tuples containing pairs of corners that define a wall
        # cornerIndex = 0
        # firstCorner = -1
        # for index, value in enumerate(duplicatedIsCorner): # len(duplicatedIsCorner) == len(flatDuplicatedPoints)
        #     if value:
        #         if (not duplicatedIsCorner[0]) and cornerIndex == 0: # if the first is not a coordinate skip the first corner for now
        #             firstCorner = index
        #             continue
        #         if cornerIndex%2 == 0:
        #             cornersPairs.append([]) # creates another tuple
        #             cornersPairs[len(cornersPairs)-1].append(index) # the first position is the corner that will receive 0
        #         else:
        #             cornersPairs[len(cornersPairs)-1].append(index) # the second position is the corner that will receive 1
        #         cornerIndex += 1

        # if not duplicatedIsCorner[0]: # if the first point is not a coordinate an extra pair connecting the ending with the beggining needs to be added
        #     cornersPairs[len(cornersPairs)-1].append(firstCorner)

        # maxDistance = -1
        # for pair in cornersPairs:
        #     calcDist = calcDistance(flatDuplicatedPoints, pair[0], pair[1])
        #     if(calcDist > maxDistance):
        #         maxDistance = calcDist

        # for pair in cornersPairs:
        #     for indexPoint in range(pair[0], pair[1]+1):
        #         wallWidth = calcDistance(flatDuplicatedPoints, pair[0], pair[1])
        #         wallsWidth[indexPoint] = wallWidth

        # # for each pair of corners calculates uv for all points between the corners
        # for pair in cornersPairs:
        #     if(pair[1] > pair[0]): # it is a pair in the middle of the sequence
        #         for indexPoint in range(pair[0]+1, pair[1]):
        #             uv = getUV(flatDuplicatedPoints, pair[0], indexPoint)
        #             uvPerPoint[indexPoint] = uv
        #     elif (pair[1] < pair[0]): # it is a pair in the end of the sequence
        #         # calculate uv for every point greater than the last corner
        #         for indexPoint in range(pair[0]+1, len(flatDuplicatedPoints)):
        #             uv = getUV(flatDuplicatedPoints, pair[0], indexPoint)
        #             uvPerPoint[indexPoint] = uv

        #         # calculate uv for every point smaller than the first corner
        #         for indexPoint in range(0, pair[1]):
        #             uv = getUV(flatDuplicatedPoints, pair[0], indexPoint)
        #             uvPerPoint[indexPoint] = uv

        #     uvPerPoint[pair[0]] = 0
        #     uvPerPoint[pair[1]] = calcDistance(flatDuplicatedPoints, pair[0], pair[1])

        alreadySeen = 0
        # for index, seg in enumerate(duplicatedPoints):
        for seg in segments:
            # points = seg
            for distance in distances:
                if distance + min_height >= height:
                    continue
                points = list(zip(*seg.coords.xy))
                color = np.random.rand(3,)
                cid+=1
                for i in range(0, len(points)-1):

                    p0 = points[i]
                    p1 = points[i+1]

                    if Point(p0).equals(Point(p1)): # it is one of the points previously duplicated
                        continue

                    v0 = [p0[0],p0[1],distance+min_height]
                    v1 = [p1[0],p1[1],distance+min_height]
                    v2 = [p0[0],p0[1],distance+min_height+size]
                    v3 = [p1[0],p1[1],distance+min_height+size]

                    i0 = int(len(coordinates)/3)
                    coordinates.extend(v0)
                    coordinates.extend(v1)
                    coordinates.extend(v2)
                    coordinates.extend(v3)

                    # corner.append([uvPerPoint[alreadySeen+i], v0[2]-min_height])
                    # corner.append([uvPerPoint[alreadySeen+i+1], v1[2]-min_height])
                    # corner.append([uvPerPoint[alreadySeen+i], v2[2]-min_height])
                    # corner.append([uvPerPoint[alreadySeen+i+1], v3[2]-min_height])

                    # corner.append(uvPerPoint[alreadySeen+i])
                    # corner.append(uvPerPoint[alreadySeen+i+1])
                    # corner.append(uvPerPoint[alreadySeen+i])
                    # corner.append(uvPerPoint[alreadySeen+i+1])

                    # width.append(wallsWidth[alreadySeen+i])
                    # width.append(wallsWidth[alreadySeen+i+1])
                    # width.append(wallsWidth[alreadySeen+i])
                    # width.append(wallsWidth[alreadySeen+i+1])

                    # heights.append(length)
                    # heights.append(length)
                    # heights.append(length)
                    # heights.append(length)

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
            
            alreadySeen += len(points)

        coordinates = np.array(coordinates).reshape(-1, 3)
        indices = np.array(indices).reshape(-1, 3)
        colors = np.array(colors).reshape(-1, 3)
        ids = np.array(ids)
        # corner = np.array(corner)
        # width = np.array(width)
        # heights = np.array(heights)

        # return coordinates, indices, ids, colors, corner, width, heights
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
        # uv = []
        # roofWidth = []
        # roofHeights = []

        cid = -1
        count = 0
        # for poly in polys:   
        for i in trange(len(polys)):   

            poly = polys[i]

            mrr = poly.minimum_rotated_rectangle
            
            rot = Buildings.azimuth(mrr.exterior)
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

            print("before overlay")

            intersection = gpd.overlay(gpd.GeoDataFrame({'geometry': gpd.GeoSeries(poly)}), gpd.GeoDataFrame({'geometry': gpd.GeoSeries(cells)}),how='intersection',keep_geom_type=True)

            print("after overlay")

            # # collecting width data while the plane is aligned with x and y
            # for elem in intersection.values:
            #     cell = elem[0]
            #     ccell = []
            #     if cell.geom_type == 'MultiPolygon':
            #         ccell = list(cell)
            #     elif cell.geom_type == 'Polygon':
            #         ccell = [cell]

            #     for c in ccell:
            #         points = np.array(c.exterior.coords[0:-1]) # remove last one (repeated)
            #         points = points.flatten().tolist()

            #         for i in range(0, len(points), 2):
            #             uv.append(points[i+1]-xmin) # append the distance between the i point and xmin
            #             roofWidth.append(0.5) # appned the width of the roof at that point

            cells = intersection.rotate(-rot, origin=(0,0)).values

            # for cell in cells:
            for j in trange(len(cells)):

                cell = cells[j]

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

                        # uv.append(-1.0)
                        # roofWidth.append(-1.0)
                        # roofHeights.append(-1.0)

                    count = int(len(coordinates)/3)
                    
                    colors = colors + [color] * int(len(ind)/3)
                    ids = ids + [cid] * int(len(ind)/3)


        # end = time.time()
        # print("total:"+str(end - start))

        coordinates = np.array(coordinates).reshape(-1, 3)
        indices = np.array(indices).reshape(-1, 3)
        colors = np.array(colors).reshape(-1, 3)
        ids = np.array(ids)
        # uv = np.array(uv).reshape(-1, 2)
        # uv = np.array(uv)
        # roofWidth = np.array(roofWidth)
        # roofHeights = np.array(roofHeights)

        # return coordinates, indices, ids, colors, uv, roofWidth, roofHeights
        return coordinates, indices, ids, colors

    def merge_building_blocks(building):
        '''
            Groups the blocks that compose one building in the OSM elements
        '''

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

    def create_building_mesh(building, size = -1):

        merged_building = Buildings.merge_building_blocks(building)

        boundaries = list(merged_building.geometry)

        coords = np.empty((0,3))
        indices = np.empty((0,3))
        ids = np.empty((0))
        colors = np.empty((0,3))
        # uv = np.empty((0))
        # width = np.empty((0))
        # heights = np.empty((0))
        # pointsPerSection = []

        orientedEnvelope = []
        sectionFootprint = []
        # sectionHeight = []
        # sectionMinHeight = []

        for i in range(0, len(boundaries)):

            geom = boundaries[i].geoms
            height = merged_building.iloc[i].height
            min_height = merged_building.iloc[i].min_height

            # sectionHeight.append(height)
            # sectionMinHeight.append(min_height)

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

            # coordinates_roof, indices_roof, ids_roof, colors_roof, uv_roof, roof_width, roof_heights = Buildings.get_roof(bottom_poly, top_poly, height, size)
            coordinates_roof, indices_roof, ids_roof, colors_roof = Buildings.get_roof(bottom_poly, top_poly, height, size)
            coordinates_roof = coordinates_roof.reshape(-1, 3)

            indices_roof = indices_roof.reshape(-1, 3)
            indices_roof = indices_roof + coords.shape[0]
            ids_roof = ids_roof + ids.shape[0]
            
            # walls
            # segments, isCorner = Buildings.split_poly(geom, size)
            segments = Buildings.split_poly(geom, size)

            # coordinates_walls, indices_walls, ids_walls, colors_walls, uv_walls, walls_width, walls_heights = Buildings.extrude(segments, min_height, height, size, isCorner)
            coordinates_walls, indices_walls, ids_walls, colors_walls = Buildings.extrude(segments, min_height, height, size)
            
            indices_walls = indices_walls + coordinates_roof.shape[0] + coords.shape[0]
            ids_walls = ids_walls + ids_roof.shape[0] + ids.shape[0]

            coordinates_walls = coordinates_walls.reshape(-1, 3)
            indices_walls = indices_walls.reshape(-1, 3)

            coords = np.concatenate((coords, coordinates_roof, coordinates_walls))
            indices = np.concatenate((indices, indices_roof, indices_walls))
            ids = np.concatenate((ids, ids_roof, ids_walls))
            colors = np.concatenate((colors, colors_roof, colors_walls))

            # uv = np.concatenate((uv, uv_roof, uv_walls))

            # width = np.concatenate((width, roof_width, walls_width))

            # heights = np.concatenate((heights, roof_heights, walls_heights))

            # pointsPerSection.append(len(coordinates_roof)+len(coordinates_walls))


        coords = coords.reshape(-1, 3)
        indices = indices.reshape(-1, 3)

        # pointsPerSection = np.array(pointsPerSection)

        # return coords, indices, ids, colors, sectionHeight, sectionMinHeight, orientedEnvelope, sectionFootprint, uv, width, heights, pointsPerSection
        return coords, indices, ids, colors, orientedEnvelope, sectionFootprint

    def generate_building_layer(gdf, size):
        
        gdf = gdf.to_crs('epsg:3395')   

        building_ids = []
        coordinates = []
        indices = []
        ids = []
        colors = []
        # heights = []
        # minHeights = []
        envelopes = []
        footprints = []
        # allCorners = []
        # allWidth = []
        # surfaceHeights = []
        # pointsPerSection = []
        unique_buildings = gdf.index.unique()

        for i in trange(len(unique_buildings)):
            building_id = unique_buildings[i]
            building = gdf.loc[[building_id]]
            # coord, ind, iids, cols, sectionHeight, sectionMinHeight, orientedEnvelope, sectionFootprint, corners, width, surfaceHeight, pointsSection = Buildings.create_building_mesh(building, size)
            coord, ind, iids, cols, orientedEnvelope, sectionFootprint = Buildings.create_building_mesh(building, size)
            building_ids.append(building_id)
            coordinates.append(coord)
            indices.append(ind)
            ids.append(iids)
            colors.append(cols)
            # heights.append(sectionHeight)
            # minHeights.append(sectionMinHeight)
            envelopes.append(orientedEnvelope)
            footprints.append(sectionFootprint)
            # allCorners.append(corners)
            # allWidth.append(width)
            # surfaceHeights.append(surfaceHeight)
            # pointsPerSection.append(pointsSection)

        # df = pd.DataFrame({
        #     'building_id': pd.Series(building_ids),
        #     'coordinates': pd.Series(coordinates),
        #     'indices': pd.Series(indices),
        #     'ids': pd.Series(ids),
        #     'colors': pd.Series(colors),
        #     'heights': pd.Series(heights),
        #     'minHeights': pd.Series(minHeights),
        #     'orientedEnvelope': pd.Series(envelopes),
        #     'sectionFootprint': pd.Series(footprints),
        #     'uv': pd.Series(allCorners),
        #     'width': pd.Series(allWidth),
        #     'surfaceHeight': pd.Series(surfaceHeights),
        #     'pointsPerSection': pd.Series(pointsPerSection)
        # })

        df = pd.DataFrame({
            'building_id': pd.Series(building_ids),
            'coordinates': pd.Series(coordinates),
            'indices': pd.Series(indices),
            'ids': pd.Series(ids),
            'colors': pd.Series(colors),
            'orientedEnvelope': pd.Series(envelopes),
            'sectionFootprint': pd.Series(footprints),
        })

        tridimensional_coordinates = []
        ids_tridimensional_coordinates = []
        counter_id_tridimensional_coordinates = 0

        for sublist in coordinates:
            for elem in sublist:
                tridimensional_coordinates.append(elem)
                ids_tridimensional_coordinates.append(counter_id_tridimensional_coordinates)
                counter_id_tridimensional_coordinates += 1

        geometries = []
        ids = [] 
        geometries_coordinates = []
        ids_coordinates = []
        counter_id_coordinates = 0

        for id, elem in enumerate(footprints):

            ids.append(id)

            polygon_coordinates = elem[0]
            groupedCoordinates = []

            for i in range(0,int(len(polygon_coordinates)/2)):
                groupedCoordinates.append((polygon_coordinates[i*2], polygon_coordinates[i*2+1]))
                geometries_coordinates.append(Point(polygon_coordinates[i*2], polygon_coordinates[i*2+1]))
                ids_coordinates.append(counter_id_coordinates)
                counter_id_coordinates += 1

            geometries.append(Polygon(groupedCoordinates))

        gdf = gpd.GeoDataFrame({'geometry': geometries, 'id': ids}, crs=3395)

        gdf_coordinates = gpd.GeoDataFrame({'geometry': geometries_coordinates, 'id': ids_coordinates}, crs=3395)
        df_3d_coordinates = pd.DataFrame({'geometry': tridimensional_coordinates, 'id': ids_tridimensional_coordinates})

        df = df.set_index('building_id', drop=False)
        df = df.sort_index()

        return {"df": df, "gdf": {"objects": gdf, "coordinates": gdf_coordinates, "coordinates3d": df_3d_coordinates}}

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
    
    def df_to_json(df, layer_id = "buildings", layer_type = 'BUILDINGS_LAYER', renderStyle = ["SMOOTH_COLOR"], styleKey = "building", visible = True, selectable = True, skip = False):

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

        for index in range(0, len(df)):

            flattened_coordinates = []
            flattened_indices = []
            flattened_normals = []

            coords_all, indices_all, ids_all, _, normals = Buildings.get_coordinates(df.iloc[[index]], compute_normals=True) # Calculating normals

            flattened_coordinates += [round(item,4) for sublist in coords_all for item in sublist]
            flattened_indices += [int(item) for sublist in indices_all for item in sublist]
            flattened_normals += [round(float(item),4) for sublist in normals for item in sublist]

            # json_new["data"].append({
            #     "geometry": {
            #         "coordinates": flattened_coordinates,
            #         "indices": flattened_indices,
            #         "normals": flattened_normals,
            #         "ids": [int(elem) for elem in ids_all],
            #         "heights": [round(item,6) for item in df.iloc[[index]]["heights"].tolist()[0]],
            #         "minHeights": [round(item,6) for item in df.iloc[[index]]["minHeights"].tolist()[0]],
            #         "orientedEnvelope": [[round(elem,6) for elem in item] for item in df.iloc[[index]]["orientedEnvelope"].tolist()[0]],
            #         "sectionFootprint": [[round(elem,6) for elem in item] for item in df.iloc[[index]]["sectionFootprint"].tolist()[0]],
            #         "uv": [round(item, 6) for item in df.iloc[[index]]["uv"].tolist()[0].tolist()],
            #         "width": [round(item,6) for item in df.iloc[[index]]["width"].tolist()[0].tolist()],
            #         "pointsPerSection": df.iloc[[index]]["pointsPerSection"].tolist()[0].tolist()
            #     }
            # })

            json_new["data"].append({
                "geometry": {
                    "coordinates": flattened_coordinates,
                    "indices": flattened_indices,
                    "normals": flattened_normals,
                    "ids": [int(elem) for elem in ids_all],
                    "orientedEnvelope": [[round(elem,4) for elem in item] for item in df.iloc[[index]]["orientedEnvelope"].tolist()[0]],
                    "sectionFootprint": [[round(elem,4) for elem in item] for item in df.iloc[[index]]["sectionFootprint"].tolist()[0]]
                }
            })

        return json_new

    def merge_overlapping_buildings(gdf):
        '''
            Groups the buildings that overlap

            Args:
                gdf (GeoDataFrame): A GeoDataFrame with the atributes 'building_id', 'geometry', 'min_height', 'height', 'tags' describing each block that composes one building

            Returns:
                result (GeoDataFrame): A GeoDataFrame with the same atributes but with the overlaping buildings merged
        '''

        gdf = gdf.to_crs('epsg:3395')   

        # merge buildings that overlap
        unique_buildings = gdf.index.unique()
        for i in trange(len(unique_buildings)):
            building_id = unique_buildings[i]
            buildings = gdf[gdf['building_id']==building_id]
            if(len(buildings) > 0):
                contained = gdf.sindex.query(buildings.geometry.unary_union, predicate='intersects')
                iid = gdf.iloc[contained]['building_id'].values[0]
                gdf.iloc[contained, gdf.columns.get_loc('building_id')] = iid
        gdf = gdf.set_index('building_id', drop=False)
        gdf = gdf.sort_index()

        gdf = gdf.to_crs('epsg:4326')
        return gdf
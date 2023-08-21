import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon, box

from . import lineclipping

def convert_projections(inProj, outProj, geometry, dim2=True):
    '''
        Convert projections from inProj to outPorj. Both values can be anything accepted by pyproj.CRS.from_user_input(), such as an authority string (eg “EPSG:4326”) or a WKT string.
        The functions converts the geometries into a geodataframe to make the conversion faster using geopandas.

        *The input follows the x,y format. For instance, if the input projection 4326 a point [longitude, latitude] is expected*

        * @param {string} inProj The current projection of the geometry
        * @param {string} outProj The desired out projection for the geometry
        * @param {bool} Indicates if the geometry is represented by 2D points or 3D points
        * @returns {List} Returns a list with all geometries transformed
    '''
    # transform the flat array into a list of Points
    grouped_geometry = []

    index = 0
    offset = 1 if dim2 else 2
    while(index < len(geometry)-offset):
        if dim2:
            grouped_geometry.append(Point(geometry[index+1], geometry[index])) # must be long/lat
        else:
            grouped_geometry.append(Point(geometry[index+1], geometry[index], geometry[index+2])) # must be long/lat

        index += 2 if dim2 else 3

    df = pd.DataFrame(grouped_geometry)

    gdf = gpd.GeoDataFrame(df, geometry=0, crs=inProj)

    gdf = gdf.to_crs(outProj)   

    translatedGeometry = []

    for elem in gdf[0]:
        translatedGeometry.append(elem.x)
        translatedGeometry.append(elem.y)
        if not dim2:
            translatedGeometry.append(elem.z)

    return translatedGeometry

def get_camera(coordinates, bbox=False):

    center = [(0,0)]

    if(bbox):
        center = [(coordinates[0]+coordinates[2])/2.0,(coordinates[1]+coordinates[3])/2.0]
    else:
        polygon = polygon_bpoly(coordinates, bbox)
        center = list(polygon.centroid.coords[0])

    center = convert_projections("4326", "3395", center)
    center.append(1) # zoom level

    return {
        'position': center, 
        'direction': {
            'right': [0,0,3000],
            'lookAt': [0,0,0],
            'up': [0,1,0]
        }
    }

def intersect_bbox(bb1, bb2):
    if point_within_bbox([bb1[0],bb1[1]],bb2) or point_within_bbox([bb1[2],bb1[3]],bb2)\
        or point_within_bbox([bb1[0],bb1[3]],bb2) or point_within_bbox([bb1[2],bb1[1]],bb2):
        return True
    return False

def point_within_bbox(point, bb):
    if point[0] > bb[0] and point[0] < bb[2] and point[1] > bb[1] and point[1] < bb[3]:
        return True
    return False

def intersect_line_bbox(p0, p1, bb):
    result = lineclipping.cohensutherland(bb[1],bb[2],bb[3],bb[0],p0[1],p0[0],p1[1],p1[0])
    return result


def extend_bbox(bounding_box,latlng):
    bbox = bounding_box.copy()
    bbox[0]=min(bbox[0]+90.0,latlng[0]+90.0)-90.0
    bbox[1]=min(bbox[1]+180.0,latlng[1]+180.0)-180.0
    bbox[2]=max(bbox[2]+90.0,latlng[0]+90.0)-90.0
    bbox[3]=max(bbox[3]+180.0,latlng[1]+180.0)-180.0
    return bbox

# triangulation deviation
# code from: https://github.com/joshuaskelly/earcut-python
# Copyright (c) 2016, Mapbox
# ISC License
def signedArea(data, start, end, dim):
    sum = 0
    j = end - dim

    for i in range(start, end, dim):
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1])
        j = i

    return sum
    
def deviation(data, holeIndices, dim, triangles):
    _len = len(holeIndices)
    hasHoles = holeIndices and len(holeIndices)
    outerLen = holeIndices[0] * dim if hasHoles else len(data)

    polygonArea = abs(signedArea(data, 0, outerLen, dim))

    if hasHoles:
        for i in range(_len):
            start = holeIndices[i] * dim
            end = holeIndices[i + 1] * dim if i < _len - 1 else len(data)
            polygonArea -= abs(signedArea(data, start, end, dim))

    trianglesArea = 0

    for i in range(0, len(triangles), 3):
        a = triangles[i] * dim
        b = triangles[i + 1] * dim
        c = triangles[i + 2] * dim
        trianglesArea += abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]))

    if polygonArea == 0 and trianglesArea == 0:
        return 0

    return abs((trianglesArea - polygonArea) / polygonArea)

def from_2d_to_3d(nodes, z_offset=0):
    '''
        Inserts a z position (z_offset can be applied)
    '''
    new_3d_node = []

    index = 0
    while(index < len(nodes)-1):
        new_3d_node.append(nodes[index])
        new_3d_node.append(nodes[index+1])
        new_3d_node.append(0 + z_offset)
        index += 2

    return new_3d_node

def polygon_bpoly(coordinates, bbox = False):

    if(not bbox):
        groupped_coords = []

        for i in range(int(len(coordinates)/2)):
            groupped_coords.append((coordinates[i*2], coordinates[i*2+1]))

        groupped_coords.append((coordinates[-2], coordinates[-1])) # close the polygon

        return Polygon(groupped_coords)
    else:
        return box(coordinates[0], coordinates[1], coordinates[2], coordinates[3])

'''
    coordinates is flattened x,y,z
    center_around is [x,y,z]
'''
def center_coordinates_around(coordinates, center_around, scale_up = 1):
    xmin = None
    xmax = None
    ymin = None
    ymax = None
    zmin = None
    zmax = None

    for i in range(int(len(coordinates)/3)):
        
        if(xmin == None or coordinates[i*3] < xmin):
            xmin = coordinates[i*3]

        if(xmax == None or coordinates[i*3] > xmax):
            xmax = coordinates[i*3]

        if(ymin == None or coordinates[i*3+1] < ymin):
            ymin = coordinates[i*3+1]

        if(ymax == None or coordinates[i*3+1] > ymax):
            ymax = coordinates[i*3+1]

        if(zmin == None or coordinates[i*3+2] < zmin):
            zmin = coordinates[i*3+2]

        if(zmax == None or coordinates[i*3+2] > zmax):
            zmax = coordinates[i*3+2]

    current_center = [(xmin+xmax)/2, (ymin+ymax)/2, (zmin+zmax)/2]

    # centering data around 0
    for i in range(int(len(coordinates)/3)):
        coordinates[i*3] -= current_center[0]
        coordinates[i*3] *= scale_up # scalling objects up
        coordinates[i*3+1] -= current_center[1]
        coordinates[i*3+1] *= scale_up # scalling objects up
        coordinates[i*3+2] -= current_center[2]
        coordinates[i*3+2] *= scale_up # scalling objects up

    # center data around new center
    for i in range(int(len(coordinates)/3)):
        coordinates[i*3] += center_around[0]
        coordinates[i*3+1] += center_around[1]
        coordinates[i*3+2] += center_around[2]
        
    return coordinates

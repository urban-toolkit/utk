import math
import pyproj
import numpy as np

import urbantk.io.lineclipping as lineclipping

def get_camera(bbox):
    center = [(bbox[0]+bbox[2])/2.0,(bbox[1]+bbox[3])/2.0]
    return {'coordinates': [center], 'zoom': -4}

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
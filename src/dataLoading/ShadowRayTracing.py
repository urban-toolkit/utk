from loader import *
import pysolar
import threading
import pytz

import timezonefinder
import math
import vedo
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from plotoptix import NpOptiX, utils
from plotoptix.materials import m_flat
from plotoptix.geometry import PinnedBuffer

from datetime import datetime
from datetime import timedelta
from datetime import tzinfo

import matplotlib.pyplot as plt

from pyproj import Proj, transform

import json

def _create_surface_mesh(bbox):
    inProj = Proj(init='epsg:4326')
    outProj = Proj(init='epsg:3395')

    x1,y1 = transform(inProj, outProj, bbox[1], bbox[0])
    x2,y2 = transform(inProj, outProj, bbox[3], bbox[2])

    coords = [[x1, y1, -0.5], [x2, y1, -0.5], [x2, y2, -0.5], [x1, y2, -0.5]]
    indices = [[0, 1, 3], [3, 1, 2]]
    ids = [0, 0]

    vmesh = vedo.Mesh([coords, indices])
    normals = vmesh.normals(cells=False)
    return np.array(coords), np.array(indices), np.array(ids), np.array(normals)

df_mesh = pd.read_pickle('buildings.pkl.zip')

coords, indices, ids, colors, normals = Mesh.get_coordinates(df_mesh.iloc[[49, 50, 51]], True)
# coords, indices, ids, colors, normals = Mesh.get_coordinates(df_mesh, True)


int_indices = [[int(sublist[0]), int(sublist[1]), int(sublist[2])] for sublist in indices]

coords_size = len(coords)

# coords_surf, indices_surf, ids_surf, normals_surf = _create_surface_mesh([40.7046516807, -74.0187925361, 40.7068584878, -74.0163535136]) # Creating surface mesh using portion of Manhattan
coords_surf, indices_surf, ids_surf, normals_surf = _create_surface_mesh([40.7045486585, -74.0194255355, 40.7079347546, -74.0160209177]) # Creating surface mesh using portion of Manhattan
# coords_surf, indices_surf, ids_surf, normals_surf = _create_surface_mesh([40.699768, -74.019904, 40.71135, -74.004712]) # Creating surface mesh using portion of Manhattan

ids_per_buildings = []
for row in df_mesh.iloc[[49, 50, 51]]['ids'].values:
# for row in df_mesh['ids'].values:
    ids_per_buildings.append(len(row))
ids_per_buildings.append(len(ids_surf)) # adding floor info
ids_per_buildings = np.array(ids_per_buildings)

# Concatenating the surface
coords = np.concatenate((coords, coords_surf), axis=0)
int_indices = np.concatenate((int_indices, indices_surf+coords_size), axis=0)
ids = np.concatenate((ids, ids_surf), axis=0)
normals = np.concatenate((normals, normals_surf), axis=0)

coords = coords - np.mean(coords, axis=0)

def computeVector(alt, azm):
    alt = math.pi*alt/180.0
    azm = math.pi/2.0-math.pi*azm/180.0

    x = math.cos(alt)*math.cos(azm)
    y = math.cos(alt)*math.sin(azm)
    z = math.sin(alt)

    nrm = math.sqrt(x*x+y*y+z*z)
#     nrm = nrm if nrm>sys.float_info.epsilon else 1

    return [x/nrm,y/nrm,z/nrm]

def computeAngle(vec1, vec2):
    unit_vector_1 = vec1 / np.linalg.norm(vec1)
    unit_vector_2 = vec2 / np.linalg.norm(vec2)
    dot_product = np.dot(unit_vector_1, unit_vector_2)
    angle = np.arccos(dot_product) * 180.0 / math.pi #degrees
    return angle

# computer all directions of sun every nskip between start and end
def compute_directions(start, end, lat, lng, nskip=1):

    tf = timezonefinder.TimezoneFinder()
    tz = tf.timezone_at(lng=lng, lat=lat)
    tz = pytz.timezone(tz)
    start = tz.localize(start)
    end = tz.localize(end)

    directions = []

    curr = start
    until = end
    delta=timedelta(minutes=nskip)
    directions = []
    while curr < until:
        curr += delta
        alt = pysolar.solar.get_altitude(lat, lng, curr) # angle between the sun and a plane tangent to the earth at lat/lng
        azm = (pysolar.solar.get_azimuth(lat, lng, curr))
        ddir = computeVector(alt, azm)
        directions.append(ddir)
    return directions

class params:
    done = threading.Event()
    k = 0

def done(rt: NpOptiX) -> None:
    params.k += 1
    params.done.set()

# computes the shadow accumulation 
def compute(directions, coords, indices, normals):
    width = coords.shape[0] # camera plane width (?)
    height = 1 # camera plane height (?)

    accumulation = np.full((width, 1), 0)
    # rt = NpOptiX(on_rt_accum_done=done, width=width, height=height)
    rt = NpOptiX(width=width, height=height)
    rt.set_mesh('buildings', pos=coords, faces=indices, normals=normals)#, c=colors)
    rt.set_float("scene_epsilon", 0.01) # set shader variable with a given name
    rt.set_param(min_accumulation_step=1, max_accumulation_frames=1) # set raytracer parameter(s)
    rt.start()
        
    for direction in directions:

        with PinnedBuffer(rt.geometry_data['buildings'], 'Positions') as P: # allow changes in the data points stored internally in the raytracer
            n = len(P)
            eye = np.zeros((n,4), dtype=np.float32)
            eye[:,:3] = P.reshape(n,3)
            eye[:,:3] = eye[:,:3] + 1e-1 * normals # manually shifting eye points for rdir not collide with itself
            rt.set_texture_1d('eye', eye, refresh=True)

        with PinnedBuffer(rt.geometry_data['buildings'], 'Vectors') as N: 
            n = len(normals)

            rdir = []
            for i in range(0, n):
                normal = normals[i]
                ang = computeAngle(normal, direction)
                if ang > 90.0:
                    # rdir.append([normal[0]*-1,normal[1]*-1,normal[2]*-1,-1]) # pointing the ray inwards to be sure to create shadow
                    rdir.append([0,0,0,0])
                else:
                    rdir.append([direction[0],direction[1],direction[2],-1])
            rdir = np.array(rdir, dtype=np.float32)
            rt.set_texture_1d('dir', rdir)
        rt.setup_camera('cam2', cam_type='CustomProjXYZtoDir', textures=['eye', 'dir']) # two 4D textures are defined ([height, width, 4]). 'eye' is composed of origin points ([x, y, z, 0]). 'dir' is composed of ray directions and maximum ranges ([cosx, cosy, cosz, r]).
        
        # if params.done.wait(10): #why 10?
        #     print("frame 1 done")
        # else:
        #     print("timeout")
        # params.done.clear()
        rt.set_launch_finished_cb(done)
        params.done.wait() # wait for the ray tracer to finish

        # for elem in rt._hit_pos[0]:
        #     print(elem)

        fid = rt._geo_id[:,:,1].reshape(rt._height, rt._width)

        dist = rt._hit_pos[:,:,3].reshape(rt._height, rt._width) # _hit_pos shape: (height, width, 4). This 4 refers to [X, Y, Z, D], where XYZ is the hit 3D position and D is the hit distance to the camera plane. We are only interested in the D.
        dist = dist[0]

        dist[dist < 0xFFFFFFFF] = 1
        dist[dist > 0xFFFFFFFF] = 0

        accumulation[:,0] = accumulation[:,0]+dist
    
    rt.close()

    return accumulation, rt._hit_pos, rdir

def per_face_avg(accumulation, indices, ids, ids_per_buildings):
    #make the ids global
    global_ids = []

    current_building = 0
    read_ids = 0
    offset = 0
    for i in range(0,len(ids)):
        if read_ids == ids_per_buildings[current_building]:
            read_ids = 0
            current_building += 1
            offset = len(global_ids)
        global_ids.append(ids[i]+offset)
        read_ids += 1

    avg_accumulation_triangle = np.zeros(len(indices))
    avg_accumulation_cell = np.zeros(len(global_ids))

    # calculate acc by triangle
    for i in range(0,len(indices)):
        value = 0
        for vid in indices[i]:
            value += accumulation[int(vid)]
        avg_accumulation_triangle[i] = value

    # calculate acc by cell based on the triangles that compose it
    count_acc_cell = np.zeros(len(global_ids))
    for i in range(0, len(indices)):
        cell = int(global_ids[i])       
        avg_accumulation_cell[cell] += avg_accumulation_triangle[i]
        count_acc_cell[cell] += 1

    # distribute the average of the cell to the triangles that compose it
    for i in range(0, len(indices)):
        cell = int(global_ids[i])       
        avg_accumulation_triangle[i] = avg_accumulation_cell[cell]/count_acc_cell[cell]

    return np.array(avg_accumulation_triangle)

def accumulate(start, end, lat, lng, coords, indices, normals, nskip=1):
    # directions = compute_directions(start, end, lat, lng, nskip)
    directions = [[0,1,0]]
    # print(directions)
    accumulation, hit_pos, rdir = compute(directions, coords, indices, normals)
    return accumulation, directions, hit_pos, rdir

name = 'spring'
s_date = datetime.strptime("03/20/2015 10:00", "%m/%d/%Y %H:%M")
e_date = datetime.strptime("03/20/2015 10:01", "%m/%d/%Y %H:%M")

accum, directions, hit_pos, rdir = accumulate(s_date, e_date, 0, 0, coords, int_indices, normals, 15)
avg_accumulation = per_face_avg(accum, int_indices, ids, ids_per_buildings) # coords, indices, ids, colors, normals

hit_pos = hit_pos[0]
rdir = rdir[:,:3]

not_in_inf = []

for elem in hit_pos:
    if(elem[3] == 1): 
        not_in_inf.append(elem[:3])

if(max(avg_accumulation) != 0):
    ccolors = 255*plt.cm.YlOrRd((avg_accumulation/max(avg_accumulation)))
else:
    ccolors = 255*plt.cm.YlOrRd(avg_accumulation)

# To visualize the results with vedo
# vmesh = vedo.Mesh([coords, int_indices])

# pts_hit_pos = vedo.Points(not_in_inf, c=(0, 128, 255))
# arrows_normals = vedo.Arrows(coords, (4*normals+coords), thickness=2, c="green")
# arrows_rdir = vedo.Arrows(coords + 1e-1 * normals, (rdir+(coords + 1e-1 * normals)), thickness=2, c="yellow")

# vmesh.cellIndividualColors(ccolors)
# vmesh.lineWidth(1.5)

# vplt = vedo.Plotter()
# vplt += vmesh.clone()
# # vplt += pts_hit_pos.clone()
# # vplt += arrows_normals.clone()
# vplt += arrows_rdir.clone()
# vplt.show(viewup='z', zoom=1.3)


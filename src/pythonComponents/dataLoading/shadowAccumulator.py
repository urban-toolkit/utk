import pysolar
import threading
import pytz
import struct

import timezonefinder
import math
import vedo
import numpy as np
from plotoptix import NpOptiX
from plotoptix.geometry import PinnedBuffer

from datetime import datetime
from datetime import timedelta

import json
import os

class ShadowAccumulator:
    '''
        Calculate shadow accumulation considering meshes stored in json files.
    '''

    filespaths = []
    # start = None
    # end = None
    intervals = [] # list of lists containing different time intervals
    season = ''

    flat_coords = []
    coords = np.array([])
    indices = np.array([])
    ids = np.array([])
    normals = np.array([])
    ids_per_structure = [] # the ids are local per structure. They have to be globalized later
    coords_per_file = [] # stores the number of coordinates per file to write the shadow data back to the correct files
    coords_before_transformation = []
    per_face_avg_accum = []

    # def __init__(self, filespaths, start, end, season):
    def __init__(self, filespaths, intervals, season):

        '''
            All meshes must be 3D

            * @param {List[string]} filespaths All the layers containing meshes that have to be considered in the shadow calculation
            * @param {string} start Timestamp of the beginning of the accumulation. Format: "%m/%d/%Y %H:%M". Example: "03/20/2015 10:00"
            * @param {string} end Timestamp of the end of the accumulation. Format: "%m/%d/%Y %H:%M". Example: "03/20/2015 11:01"
            * @param {string} season The name of the season. Can be: 'spring', 'summer', 'atumn' and 'winter'
        '''


        for interval in intervals:
            start = datetime.strptime(interval[0], "%m/%d/%Y %H:%M")
            end = datetime.strptime(interval[1], "%m/%d/%Y %H:%M")

            self.intervals.append([start, end])

        self.filespaths = filespaths
        # self.start = datetime.strptime(start, "%m/%d/%Y %H:%M")
        # self.end = datetime.strptime(end, "%m/%d/%Y %H:%M")
        self.season = season

    def computeVector(self, alt, azm):
        alt = math.pi*alt/180.0
        azm = math.pi/2.0-math.pi*azm/180.0

        x = math.cos(alt)*math.cos(azm)
        y = math.cos(alt)*math.sin(azm)
        z = math.sin(alt)

        nrm = math.sqrt(x*x+y*y+z*z)
    #     nrm = nrm if nrm>sys.float_info.epsilon else 1

        return [x/nrm,y/nrm,z/nrm]

    def computeAngle(self, vec1, vec2):
        # temporary fix for [0,0,0] normals TODO
        if vec1[0] == 0 and vec1[1] == 0 and vec1[2] == 0:
            vec1 = np.array([0.0,0.0,1.0])

        unit_vector_1 = vec1 / np.linalg.norm(vec1)
        unit_vector_2 = vec2 / np.linalg.norm(vec2)
        dot_product = np.dot(unit_vector_1, unit_vector_2)
        angle = np.arccos(dot_product) * 180.0 / math.pi #degrees)

        return angle

    # computer all directions of sun every nskip between start and end
    def compute_directions(self, start, end, lat, lng, nskip=1):

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
            ddir = self.computeVector(alt, azm)
            directions.append(ddir)
        return directions

    class params:
        done = threading.Event()
        k = 0

    # computes the shadow accumulation 
    def compute(self, directions, coords, indices, normals):
        def done(rt: NpOptiX) -> None:
            self.params.k += 1
            self.params.done.set()

        camera_plane_dim = math.ceil(math.sqrt(coords.shape[0]))
        width = camera_plane_dim # camera plane width
        height = camera_plane_dim # camera plane height

        accumulation = np.full((coords.shape[0], 1), 0) 
            
        rt = NpOptiX(width=width, height=height)
        rt.set_mesh('buildings', pos=coords, faces=indices, normals=normals)#, c=colors)
        rt.set_float("scene_epsilon", 0.01) # set shader variable with a given name
        rt.set_param(min_accumulation_step=1, max_accumulation_frames=1) # set raytracer parameter(s)
        rt.set_accum_done_cb(done)
        rt.start()

        for direction in directions:
            
            with PinnedBuffer(rt.geometry_data['buildings'], 'Positions') as P:
                n = math.ceil(math.sqrt(len(P)))
                eye = np.zeros((n,n,4), dtype=np.float32) 

                eyeRow = -1
                for index, elem in enumerate(P):
                    if(index%n == 0):
                        eyeRow += 1
                    eye[eyeRow,index%n,:3] = elem + 1e-1 * normals[index]
    
                rt.set_texture_2d('eye', eye, refresh=True)

            with PinnedBuffer(rt.geometry_data['buildings'], 'Vectors') as N: 
                n = len(normals)

                rdir_temp = []
                for i in range(0, n):
                    normal = normals[i]
                    ang = self.computeAngle(normal, direction)
                    if ang > 90.0:
                        rdir_temp.append([0,0,0,0])
                    else:
                        rdir_temp.append([direction[0],direction[1],direction[2],-1])
                rdir_temp = np.array(rdir_temp, dtype=np.float32)

                n = math.ceil(math.sqrt(len(rdir_temp)))
                rdir = np.zeros((n,n,4), dtype=np.float32) 

                rdirRow = -1
                for index, elem in enumerate(rdir_temp):
                    if(index%n == 0):
                        rdirRow += 1
                    rdir[rdirRow,index%n, :] = elem


                rt.set_texture_2d('dir', rdir, refresh=True)

            self.params.done.clear() # resetting the thread flag       
            rt.setup_camera('cam2', cam_type='CustomProjXYZtoDir', textures=['eye', 'dir'], make_current=True) # two 4D textures are defined ([height, width, 4]). 'eye' is composed of origin points ([x, y, z, 0]). 'dir' is composed of ray directions and maximum ranges ([cosx, cosy, cosz, r]).

            self.params.done.wait() # wait for the ray tracer to finish
            
            dist = rt._hit_pos[:,:,3].reshape(rt._height, rt._width) # _hit_pos shape: (height, width, 4). This 4 refers to [X, Y, Z, D], where XYZ is the hit 3D position and D is the hit distance to the camera plane. We are only interested in the D.
            dist = [item for sublist in dist for item in sublist] # flattening distance 
            dist = dist[:coords.shape[0]] # dropping extra points in the end of the matrix 
            dist = np.array(dist) 

            dist[dist < 0xFFFFFFFF] = 1
            dist[dist > 0xFFFFFFFF] = 0

            accumulation[:,0] = accumulation[:,0]+dist

        # rt.close()

        return accumulation

    def per_face_avg(self, accumulation, indices, ids, ids_per_buildings):

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

    def accumulate(self, start, end, lat, lng, coords, indices, normals, nskip=1):
        directions = self.compute_directions(start, end, lat, lng, nskip)

        accumulation = self.compute(directions, coords, indices, normals)
        return accumulation

    def per_coordinates_avg(self, avg_accumulation_triangle, coords, indices):
        '''
            Distributes triangle avg to the coordinates that composes the triangle. The coordinates need to be duplicated, meaning that there are unique indices. 
        '''

        avg_accumulation_per_coordinates = np.zeros(len(coords), dtype=np.float32) 

        for index, elem in enumerate(avg_accumulation_triangle):
            avg_accumulation_per_coordinates[indices[index][0]] = elem
            avg_accumulation_per_coordinates[indices[index][1]] = elem
            avg_accumulation_per_coordinates[indices[index][2]] = elem

        return np.array(avg_accumulation_per_coordinates)

    def writeShadowData(self, accumulation, function_index):
        '''
            Writes the shadow data back to the mesh files passed to the constructor

            * @param {List[float]} accumulation Shadow data accumulated per coordinates
        '''

        # function values are the normalized accumulation values ([0,1]) that are used by the shader of urbantk-map to color the cells
        if(max(accumulation) != 0):
            function_values = accumulation/max(accumulation)
        else:
            function_values = accumulation

        function_values = function_values.tolist()

        flat_coords = self.flat_coords.copy()

        # decoupled abstract layer
        # shadow_layer = {'id': "shadow"+str(function_index), 'coordinates': [round(item,4) for item in self.flat_coords], 'values': [round(item,4) for item in function_values]}

        # directory = os.path.dirname(self.filespaths[0])

        # with open(os.path.join(directory, "shadow"+str(function_index)+".json"), "w") as outfile:
        #     json.dump(shadow_layer, outfile)

        for index, geometries_count in enumerate(self.coords_per_file):
            
            fileName = os.path.splitext(os.path.basename(self.filespaths[index]))[0]

            directory = os.path.dirname(self.filespaths[index])

            function_values_this_file = []
            flat_coords_this_file = []

            for geometry_count in geometries_count:

                function_values_this_file += function_values[:geometry_count]

                flat_coords_this_file += flat_coords[:geometry_count*3]

                flat_coords = flat_coords[geometry_count*3:] # remove the values that belong to the current mesh
                function_values = function_values[geometry_count:] # remove the values that belong to the current mesh

            shadow_layer = {'id': "shadow"+str(function_index)+'_'+fileName, 'coordinates': [round(item,4) for item in flat_coords_this_file], 'values': [round(item,4) for item in function_values_this_file]}

            with open(os.path.join(directory, "shadow"+str(function_index)+'_'+fileName+".json"), "w") as outfile:
                json.dump(shadow_layer, outfile)



        # coupled abstract layer
        # for index, geometries_count in enumerate(self.coords_per_file):
            
        #     mesh_file = open(self.filespaths[index],mode='r')

        #     mesh_json = json.loads(mesh_file.read())

        #     mesh_file.close()

        #     for index_geometry, geometry_count in enumerate(geometries_count):

        #         # mesh_json["data"][index_geometry]["geometry"]["function"+str(functionIndex)] = function_values[:geometry_count] 
        #         if not "function" in mesh_json["data"][index_geometry]["geometry"]:
        #             mesh_json["data"][index_geometry]["geometry"]["function"] = []
                
        #         mesh_json["data"][index_geometry]["geometry"]["function"].append(function_values[:geometry_count])

        #         function_values = function_values[geometry_count:] # remove the values that belong to the current mesh

        #     with open(self.filespaths[index], "w") as outfile:
        #         json.dump(mesh_json, outfile, indent=4)

    def accumulate_shadow(self):
        '''
            Accumulate shadow over a period of time considering the parameters defined in the constructor
        '''

        self.loadFiles()

        self.flat_coords = [float(elem) for sublist in self.coords_before_transformation for elem in sublist]

        for index, interval in enumerate(self.intervals):
            accum = self.accumulate(interval[0], interval[1], 0, 0, self.coords, self.indices, self.normals, 15)

            self.per_face_avg_accum = self.per_face_avg(accum, self.indices, self.ids, self.ids_per_structure) # accumulation per triangle
            avg_accumulation_per_coordinates = self.per_coordinates_avg(self.per_face_avg_accum, self.coords, self.indices) # accumulation per vertice

            max = -1
            min = -1

            for elem in accum:

                if max == -1:
                    max = elem[0]

                if min == -1:
                    min = elem[0]

                if elem[0] > max:
                    max = elem[0]

                if elem[0] < min:
                    min = elem[0]
 
            # self.writeShadowData(avg_accumulation_per_coordinates, index)
            self.writeShadowData([(elem[0] - min) / (max - min) for elem in accum], index)

    def loadFiles(self):

        for filepath in self.filespaths:

            file = open(filepath, mode='r')
            file_content = json.loads(file.read())

            directory = os.path.dirname(filepath)
            # file name with extension
            file_name = os.path.basename(filepath)
            # file name without extension
            file_name_wo_extension = os.path.splitext(file_name)[0]

            coordinates = []
            normals = []
            indices = []
            ids = []

            if('coordinates' in file_content['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_coordinates.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('d', data)

                for elem in unpacked_data:
                    coordinates.append(elem[0])

                f.close()
            if('normals' in file_content['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_normals.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('f', data)

                for elem in unpacked_data:
                    normals.append(elem[0])

                f.close()
            if('indices' in file_content['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_indices.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('I', data)

                for elem in unpacked_data:
                    indices.append(elem[0])

                f.close()
            if('ids' in file_content['data'][0]['geometry']):
                f = open(os.path.join(directory,file_name_wo_extension+'_ids.data'), "rb")

                data = f.read()

                unpacked_data = struct.iter_unpack('I', data)

                for elem in unpacked_data:
                    ids.append(elem[0])

                f.close()

            for i in range(len(file_content['data'])):

                if(len(coordinates) > 0):
                    startAndSize = file_content['data'][i]['geometry']['coordinates']
                    file_content['data'][i]['geometry']['coordinates'] = coordinates[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(indices) > 0):
                    startAndSize = file_content['data'][i]['geometry']['indices']
                    file_content['data'][i]['geometry']['indices'] = indices[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(normals) > 0):
                    startAndSize = file_content['data'][i]['geometry']['normals']
                    file_content['data'][i]['geometry']['normals'] = normals[startAndSize[0]:startAndSize[0]+startAndSize[1]]

                if(len(ids) > 0):
                    startAndSize = file_content['data'][i]['geometry']['ids']
                    file_content['data'][i]['geometry']['ids'] = ids[startAndSize[0]:startAndSize[0]+startAndSize[1]]

            file_coords = []
            file_indices = []
            file_ids = []
            file_normals = []

            self.coords_per_file.append([])

            for element in file_content['data']:
                file_indices += [int(item)+int(len(file_coords)/3)+self.coords.shape[0] for item in element['geometry']['indices']] # concat in the end of the list # considers always a 3d mesh
                file_coords += element['geometry']['coordinates'] # concat in the end of the list
                file_ids += element['geometry']['ids'] # concat in the end of the list
                file_normals += element['geometry']['normals'] # concat in the end of the list

                self.ids_per_structure.append(len(element['geometry']['ids']))

                self.coords_per_file[-1].append(int(len(element['geometry']['coordinates'])/3)) # considers always a 3d mesh

            file_coords = np.reshape(np.array(file_coords), (int(len(file_coords)/3), -1)) # considers always a 3d mesh
            file_indices = np.reshape(np.array(file_indices), (int(len(file_indices)/3), -1)) # considers always a 3d mesh
            file_ids = np.array(file_ids)
            file_normals = np.reshape(np.array(file_normals), (int(len(file_normals)/3), -1)) # considers always a 3d mesh

            if len(self.coords) == 0:
                self.coords = np.copy(file_coords)
            else:
                self.coords = np.concatenate((self.coords, file_coords), axis=0)

            if len(self.indices) == 0:
                self.indices = np.copy(file_indices)
            else:
                self.indices = np.concatenate((self.indices, file_indices), axis=0)

            if len(self.ids) == 0:
                self.ids = np.copy(file_ids)
            else:
                self.ids = np.concatenate((self.ids, file_ids), axis=0)

            if len(self.normals) == 0:
                self.normals = np.copy(file_normals)
            else:
                self.normals = np.concatenate((self.normals, file_normals), axis=0)

            file.close()

        self.ids_per_structure = np.array(self.ids_per_structure)

        self.coords_before_transformation = np.copy(self.coords)

        self.coords = self.coords - np.mean(self.coords, axis=0)

    def view(self):
        # if(max(self.per_face_avg_accum) != 0):
        #     ccolors = 255*plt.cm.YlOrRd((self.per_face_avg_accum/max(self.per_face_avg_accum)))
        # else:
        #     ccolors = 255*plt.cm.YlOrRd(self.per_face_avg_accum)

        vmesh = vedo.Mesh([self.coords, self.indices])

        # pts_hit_pos = vedo.Points(not_in_inf, c=(0, 128, 255))
        # arrows_normals = vedo.Arrows(self.coords, (4*self.normals+self.coords), thickness=2, c="green")

        # arrows_rdir = vedo.Arrows(eye + 1e-1 * normals, (rdir+(eye + 1e-1 * normals)), thickness=2, c="blue")

        # vmesh.cellIndividualColors(ccolors)
        vmesh.lineWidth(1.5)

        vplt = vedo.Plotter()
        vplt += vmesh.clone()
        # vplt += pts_hit_pos.clone()
        # vplt += arrows_normals.clone()
        # vplt += arrows_rdir.clone()
        vplt.show(viewup='z', zoom=1.3)
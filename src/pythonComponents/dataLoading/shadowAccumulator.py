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
from plotoptix.enums import RtResult

from datetime import datetime
from datetime import timedelta
from datetime import tzinfo

import matplotlib.pyplot as plt

from pyproj import Proj, transform

from shapely.geometry import Polygon

import json

class ShadowAccumulator:
    '''
        Calculate shadow accumulation considering meshes stored in json files.
    '''

    filespaths = []
    start = None
    end = None

    coords = np.array([])
    indices = np.array([])
    ids = np.array([])
    normals = np.array([])
    ids_per_structure = [] # the ids are local per structure. They have to globalized latter
    coords_before_transformation = []

    def __init__(self, filespaths, start, end):
        '''
            All meshes must be 3D

            * @param {List[string]} filespaths All the layers containing meshes that have to be considered in the shadow calculation
            * @param {string} start Timestamp of the beginning of the accumulation. Format: "%m/%d/%Y %H:%M". Example: "03/20/2015 10:00"
            * @param {string} end Timestamp of the end of the accumulation. Format: "%m/%d/%Y %H:%M". Example: "03/20/2015 11:01"
        '''
        self.filespaths = filespaths
        self.start = start
        self.end = end

    def accumulate_shadow(self):

        self.loadFiles()

    def loadFiles(self):

        files_contents = []

        for filepath in self.filespaths:

            file = open(filepath, mode='r')
            file_content = json.loads(file.read())
            files_contents.append(file_content)

            file_coords = []
            file_indices = []
            file_ids = []
            file_normals = []

            for element in file_content['data']:
                file_coords += element['geometry']['coordinates'] # concat in the end of the list
                file_indices += [item+self.coords.shape[0] for item in element['geometry']['indices']] # concat in the end of the list
                file_ids += element['geometry']['ids'] # concat in the end of the list
                file_normals += element['geometry']['normals'] # concat in the end of the list

                self.ids_per_structure.append(len(element['geometry']['ids']))

            file_coords = np.reshape(np.array(file_coords), (int(len(file_coords)/3), -1))
            file_indices = np.reshape(np.array(file_indices), (int(len(file_indices)/3), -1))
            file_ids = np.array(file_ids)
            file_normals = np.reshape(np.array(file_normals), (int(len(file_normals)/3), -1))

            if len(self.coords) == 0:
                self.coords = np.copy(file_coords)
            else:
                print(self.coords.shape)
                print(self.coords)
                print(file_coords.shape)
                print(file_coords)
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



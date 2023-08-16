# from shadowAccumulator import *
from .load_utk import *
from .utils import *
from .shadow_accumulator import *
from .load_physical import *
from .load_thematic import *

# exposes simulations like .shadow
# loads any kind of data the type is determined by the extension
def shadow(filespaths, intervals):

    coordinates = []

    for filepath in filespaths:
        layer_json = load_utk(filepath)
        coordinates += get_coordinates(layer_json)

    latitudes = []
    longitudes = []

    for i in range(int(len(coordinates)/3)):
        
        latitudes.append(coordinates[i*3])
        longitudes.append(coordinates[i*3+1])

    centroid = convert_projections('3395', '4326', [(min(longitudes) + max(longitudes))/2, (min(latitudes) + max(latitudes))/2])

    shadowAccumulator = ShadowAccumulator(centroid[1], centroid[0], filespaths, intervals)
    shadowAccumulator.accumulate_shadow()

    return shadowAccumulator
import os
import json

'''
    Duplicates the surface layer to make the shadow values be rendered on top of the other layers and the rest of the surface be rendered beneath the other layers
    dir The directory where the layers are stored
    interval0 Range of functions that should be discarded for surface0
    interval1 Range of functions that should be discarded for surface1
    offset how much surface1 must be shifted upwards to rendered on top of the other layers
'''
def postProcessSurface(dir, interval0, interval1, offset):

    if(os.path.isdir(dir)):

        surface0 = open(os.path.join(dir,'surface.json'), mode='r')
        
        surface_content = json.loads(surface0.read())

        for element in surface_content['data']:
            element['geometry']['discardFuncInterval'] = interval0
            for index in range(0,int(len(element['geometry']['coordinates'])/3)):
                element['geometry']['coordinates'][index*3+2] += -1

        with open(os.path.join(dir,'surface.json'), 'w') as f:
            json.dump(surface_content, f, indent=4)

        for element in surface_content['data']:
            element['geometry']['discardFuncInterval'] = interval1
            for index in range(0,int(len(element['geometry']['coordinates'])/3)):
                element['geometry']['coordinates'][index*3+2] += offset

        with open(os.path.join(dir,'surface1.json'), 'w') as f:
            json.dump(surface_content, f, indent=4)

        surface0.close()

        os.rename(os.path.join(dir,'surface.json'), os.path.join(dir,'surface0.json'))

        indexFile = open(os.path.join(dir,'index.json'), mode='r')
        index_content = json.loads(indexFile.read())
        index_content["layers"].remove("surface")
        index_content["layers"].append("surface0")
        index_content["layers"].append("surface1")

        indexFile.close()

        with open(os.path.join(dir,'index.json'), 'w') as f:
            json.dump(index_content, f, indent=4)

    else:
        raise Exception("First argument must be a directory where the layers are stored")
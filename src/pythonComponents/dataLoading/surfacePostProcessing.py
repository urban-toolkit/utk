import os
import json

'''
    Duplicates the surface layer to make the shadow values be rendered on top of the other layers and the rest of the surface be rendered beneath the other layers
    dir The directory where the layers are stored
    interval0 Range of functions that should be discarded for surface0
    interval1 Range of functions that should be discarded for surface1
'''
def postProcessSurface(dir, interval0, interval1):

    if(os.path.isdir(dir)):

        surface0 = open(os.path.join(dir,'surface.json'), mode='r')
        
        surface_content = json.loads(surface0.read())

        surface_content["renderStyle"] = ["SMOOTH_COLOR_MAP"]

        for element in surface_content['data']:
            element['geometry']['discardFuncInterval'] = interval0
            # for index in range(0,int(len(element['geometry']['coordinates'])/3)):
            #     element['geometry']['coordinates'][index*3+2] += -1

        with open(os.path.join(dir,'surface.json'), 'w') as f:
            json.dump(surface_content, f, indent=4)

        for element in surface_content['data']:
            element['geometry']['discardFuncInterval'] = interval1
            element['geometry']['varyOpByFunc'] = 1

            # for index in range(0,int(len(element['geometry']['coordinates'])/3)):
            #     element['geometry']['coordinates'][index*3+2] += offset

        with open(os.path.join(dir,'surface1.json'), 'w') as f:
            json.dump(surface_content, f, indent=4)

        surface0.close()

        os.rename(os.path.join(dir,'surface.json'), os.path.join(dir,'surface0.json'))

        indexFile = open(os.path.join(dir,'index.json'), mode='r')
        index_content = json.loads(indexFile.read())
        index_content["layers"].remove("surface")

        aux_layers = ["surface0"]

        surface1_added = False

        for index, layer in enumerate(index_content["layers"]):
            aux_layers.append(layer)

            if(index < len(index_content["layers"])-1 and not surface1_added):
                if(index_content["layers"][index+1] == "buildings"):
                    aux_layers.append("surface1")
                    surface1_added = True

        if not surface1_added:
            aux_layers.append("surface1")

        index_content["layers"] = aux_layers

        indexFile.close()

        with open(os.path.join(dir,'index.json'), 'w') as f:
            json.dump(index_content, f, indent=4)

    else:
        raise Exception("First argument must be a directory where the layers are stored")
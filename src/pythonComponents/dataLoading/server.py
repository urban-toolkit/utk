import os
from flask import Flask, request, send_from_directory, abort
import json
from osm import *
from urbanComponent import *
import pandas as pd

app = Flask(__name__)
workDir = None

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

@app.route('/linkLayers', methods=['GET'])
def serve_linkLayers():

    if("otherLayer" not in request.args or "predicate" not in request.args or "thisLayer" not in request.args or "thisLevel" not in request.args or "otherLevel" not in request.args or "abstract" not in request.args):
        abort(400, "Missing one or more parameters of: otherLayer, predicate, thisLayer, thisLevel, otherLevel, abstract")

    predicate = request.args.get('predicate')
    thisLayer = request.args.get('thisLayer')
    otherLayer = request.args.get('otherLayer')
    thisLevel = request.args.get('thisLevel')
    otherLevel = request.args.get('otherLevel')
    abstract = request.args.get('abstract')

    if(abstract == "true"):
        abstract = True
    else:
        abstract = False

    aggregation = 'avg'

    if("aggregation" in request.args):
        aggregation = request.args.get('aggregation')

    uc = UrbanComponent()

    uc.setWorkDir(workDir)

    if(uc.existsJoin(thisLayer, otherLayer, predicate.upper(), thisLevel.upper(), otherLevel.upper(), abstract)):
        return ''

    uc.addLayerFromJsonFile(os.path.join(workDir, thisLayer+".json"))
    uc.addLayerFromJsonFile(os.path.join(workDir, otherLayer+".json"), abstract=abstract)

    if(abstract):
        if(thisLevel != otherLevel):
            abort(400, "For abstract join the levels of both layers should be the same")
        uc.attachAbstractToPhysical(thisLayer, otherLayer, thisLevel, predicate, aggregation)
    else:
        uc.attachPhysicalLayers(thisLayer, otherLayer, predicate, thisLevel, otherLevel)

    uc.to_file(workDir, True)

    return ''

@app.route('/clearLinks', methods=['GET'])
def serve_clearLinks():

    if("layer" not in request.args):
        print("cleaning joined layers of all layers")
    else:
        print("clearning joined layers of "+request.args.get("layer"))
    
    return ''

@app.route('/getGrammar', methods=['GET'])
def serve_getGrammar():

    grammar = {}

    with open(os.path.join(workDir,"grammar.json"), "r", encoding="utf-8") as f:
        grammar = json.load(f)

    return json.dumps(grammar, indent=4)

# @app.route('/addRenderStyles', methods=['GET'])
# def serve_addRenderStyles():

#     if("layer" not in request.args or "renderStyles" not in request.args):
#         abort(400, "Missing one or more parameters of: layer, renderStyles")
    
#     layer = request.args.get('layer')
#     renderStyles = request.args.get('renderStyles')
#     renderStyles = [elem.upper() for elem in renderStyles.split(',')]

#     replace = False

#     if("replace" in request.args and request.args.get('replace') == 'true'):
#         replace = True

#     layerJson = {}

#     with open(os.path.join(workDir, layer+".json"), "r", encoding="utf-8") as f:
#         layerJson = json.load(f)

#     if("renderStyle" not in layerJson):
#         abort(400, "There is no renderStyle field in the json")

#     if(replace):
#         layerJson['renderStyle'] = renderStyles
#     else:
#         layerJson['renderStyle'] = layerJson['renderStyle']+renderStyles

#     with open(os.path.join(workDir, layer+".json"), "w", encoding="utf-8") as f:
#         f.write(json.dumps(layerJson, indent=4))

#     return ''

@app.route('/addRenderStyles', methods=['GET'])
def serve_addRenderStyles():

    grammar = {}

    with open(os.path.join(workDir,"grammar.json"), "r", encoding="utf-8") as f:
        grammar = json.load(f)

    layersInfo = {}

    for knot in grammar["views"][0]["knots"]:
        if('knotOp' not in knot or knot['knotOp'] != True):
            
            for index, link in enumerate(knot['linkingScheme']):

                layer = link['thisLayer']
                buildings = False
                triangles = False
                interactions = False
                embeddedPlots = False
                abstract = 'otherLayer' in link
                data = {}

                if(layer not in layersInfo):
                    with open(os.path.join(workDir,layer+".json"), "r", encoding="utf-8") as f:
                        data = json.load(f)
                else:
                    data = layersInfo[layer]['data']

                if(data["type"] == "TRIANGLES_3D_LAYER" or data["type"] == "TRIANGLES_3D_LAYER"):
                    triangles = True

                if(data["type"] == "BUILDINGS_LAYER"):
                    buildings = True

                for i in range(len(grammar["views"][0]['map']["knots"])):
                    if(grammar["views"][0]['map']["knots"][i] == knot["id"] and grammar["views"][0]["map"]["interactions"][i] != "NONE"):
                        if(index == len(knot['linkingScheme'])-1): # only the layers that will be rendered can be interacted with
                            interactions = True
                        break

                for i in range(len(grammar["views"][0]["plots"])):
                    if(knot["id"] in grammar["views"][0]["plots"][i]["knots"] and grammar["views"][0]["plots"][i]["arrangement"] == "SUR_EMBEDDED" or grammar["views"][0]["plots"][i]["arrangement"] == "FOOT_EMBEDDED"):
                        embeddedPlots = True
                        break

                if(layer not in layersInfo):
                    layersInfo[layer] = {
                        "layer": layer,
                        "triangles": triangles,
                        "buildings": buildings,
                        "interactions": interactions,
                        "embeddedPlots": embeddedPlots,
                        "abstract": abstract,
                        "data": data
                    }
                else:
                    layersInfo[layer]['triangles'] =  layersInfo[layer]['triangles'] or triangles
                    layersInfo[layer]['buildings'] =  layersInfo[layer]['buildings'] or buildings
                    layersInfo[layer]['interactions'] =  layersInfo[layer]['interactions'] or interactions
                    layersInfo[layer]['embeddedPlots'] =  layersInfo[layer]['embeddedPlots'] or embeddedPlots
                    layersInfo[layer]['abstract'] =  layersInfo[layer]['abstract'] or abstract

    for layer in layersInfo:
        renderStyles = []

        # coloring shader
        if(not layersInfo[layer]['abstract']):
            renderStyles.append("SMOOTH_COLOR")
        elif(not layersInfo[layer]['buildings']):
            renderStyles.append("SMOOTH_COLOR_MAP")
        else:
            renderStyles.append("SMOOTH_COLOR_MAP_TEX")

        if(layersInfo[layer]['interactions']):
            renderStyles.append("PICKING")

        if(layersInfo[layer]['buildings'] and layersInfo[layer]['embeddedPlots']):
            renderStyles.append("ABSTRACT_SURFACES")

        layersInfo[layer]['data']['renderStyle'] = renderStyles

        print(layer, renderStyles)

        with open(os.path.join(workDir,layer+".json"), "w", encoding="utf-8") as f:
            f.write(json.dumps(layersInfo[layer]['data'], indent=4))

    return ''


@app.route('/updateGrammar', methods=['POST'])
def serve_updateGrammar():

    grammar = request.json['grammar']
    
    with open(os.path.join(workDir,"grammar.json"), "w", encoding="utf-8") as f:
        f.write(grammar)

    return ''

if __name__ == '__main__':

    params = {}

    with open('src/pythonServerConfig.json', "r", encoding="utf-8") as f:
        params = json.load(f)
        params = params["paramsPythonServer"]

    workDir = params["environmentDataFolder"]

    
    app.run(debug=True, host=params["environmentIP"], port=params["port"])

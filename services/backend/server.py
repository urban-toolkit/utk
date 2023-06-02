import os
from flask import Flask, request, send_from_directory, abort, jsonify
import json
from filesInterface import *
from geopy.geocoders import Nominatim
import utils

app = Flask(__name__)
geolocator = Nominatim(user_agent="urbantk")
workDir = './data/'

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

@app.route('/linkLayers', methods=['GET'])
def serve_linkLayers():

    if("in" not in request.args or "spatial_relation" not in request.args or "out" not in request.args or "outLevel" not in request.args or "inLevel" not in request.args or "abstract" not in request.args):
        abort(400, "Missing one or more parameters of: in, spatial_relation, out, outLevel, inLevel, abstract")

    spatial_relation = request.args.get('spatial_relation')
    out = request.args.get('out')
    inData = request.args.get('in')
    outLevel = request.args.get('outLevel')
    inLevel = request.args.get('inLevel')
    abstract = request.args.get('abstract')

    if(abstract == "true"):
        abstract = True
    else:
        abstract = False

    operation = 'avg'

    if("operation" in request.args):
        operation = request.args.get('operation')

    maxDistance = None

    if("maxDistance" in request.args):
        maxDistance = float(request.args.get('maxDistance'))

    if(maxDistance != None and spatial_relation.upper() != 'NEAREST'):
        abort(400, "Max distance can only be used with the NEAREST spatial_relation")

    defaultValue = 0

    if("defaultValue" in request.args):
        defaultValue = float(request.args.get('defaultValue'))

    fi = FilesInterface()

    fi.setWorkDir(workDir)

    if(fi.existsJoin(out, inData, spatial_relation.upper(), outLevel.upper(), inLevel.upper(), abstract)):
        return ''

    fi.addLayerFromJsonFile(os.path.join(workDir, out+".json"))
    fi.addLayerFromJsonFile(os.path.join(workDir, inData+".json"), abstract=abstract)

    if(abstract):
        if(maxDistance != None):
            fi.attachAbstractToPhysical(out, inData, outLevel, inLevel, spatial_relation, operation, maxDistance, default_value=defaultValue)
        else:
            fi.attachAbstractToPhysical(out, inData, outLevel, inLevel, spatial_relation, operation, default_value=defaultValue)
    else:
        if(maxDistance != None):
            fi.attachPhysicalLayers(out, inData, spatial_relation, outLevel, inLevel, maxDistance, default_value=defaultValue)
        else:
            fi.attachPhysicalLayers(out, inData, spatial_relation, outLevel, inLevel, default_value=defaultValue)

    fi.saveJoined(workDir)

    return ''

@app.route('/clearLinks', methods=['GET'])
def serve_clearLinks():

    if("layer" not in request.args):
        print("cleaning joined layers of all layers")
    else:
        print("clearning joined layers of "+request.args.get("layer"))
    
    return ''

@app.route('/files/<path:path>')
def serve_files(path):
    return send_from_directory(workDir, path)

@app.route('/getGrammar', methods=['GET'])
def serve_getGrammar():

    grammar = {}

    with open(os.path.join(workDir,"grammar.json"), "r", encoding="utf-8") as f:
        grammar = json.load(f)

    return json.dumps(grammar, indent=4)

@app.route('/getLayer', methods=['GET'])
def serve_getLayer():

    if("layer" not in request.args):
        abort(400, "Missing one or more parameters of: layer")

    layer = request.args.get('layer')

    layer_json = {}

    with open(os.path.join(workDir,layer+".json"), "r", encoding="utf-8") as f:
        layer_json = json.load(f)

    return json.dumps(layer_json, indent=4)

@app.route('/solveNominatim', methods=['GET'])
def serve_solveNominatim():

    if("text" not in request.args):
        abort(400, "Missing one or more parameters of: text")

    text = request.args.get('text')

    location = geolocator.geocode(text, timeout=5)

    convertedProj = utils.convertProjections("4326", "3395", [location.latitude, location.longitude])

    return json.dumps({
        'position': convertedProj+[3], 
        'direction': {
            'right': [0,0,3000],
            'lookAt': [0,0,0],
            'up': [0,1,0]
        }
    })

@app.route('/addRenderStyles', methods=['GET'])
def serve_addRenderStyles():

    grammar = {}

    with open(os.path.join(workDir,"grammar.json"), "r", encoding="utf-8") as f:
        grammar = json.load(f)

    layersInfo = {}

    for knot in grammar["components"][0]["knots"]:
        if('knotOp' not in knot or knot['knotOp'] != True):
            
            for index, link in enumerate(knot['integration_scheme']):

                layer = link['out']
                buildings = False
                triangles = False
                interactions = False
                embeddedPlots = False
                abstract = 'in' in link
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

                for i in range(len(grammar["components"][0]['map']["knots"])):
                    if(grammar["components"][0]['map']["knots"][i] == knot["id"] and grammar["components"][0]["map"]["interactions"][i] != "NONE"):
                        if(index == len(knot['integration_scheme'])-1): # only the layers that will be rendered can be interacted with
                            interactions = True
                        break

                for i in range(len(grammar["components"][0]["plots"])):
                    if(knot["id"] in grammar["components"][0]["plots"][i]["knots"] and grammar["components"][0]["plots"][i]["arrangement"] == "SUR_EMBEDDED" or grammar["components"][0]["plots"][i]["arrangement"] == "FOOT_EMBEDDED"):
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

        with open(os.path.join(workDir,layer+".json"), "w", encoding="utf-8") as f:
            f.write(json.dumps(layersInfo[layer]['data']))

    return ''

@app.route('/writeImpactViewData', methods=['POST'])
def writeImpactViewData():
    
    impactData = request.json['data']

    with open(os.path.join(workDir,"impactView.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(impactData))

    return ''


@app.route('/updateGrammar', methods=['POST'])
def serve_updateGrammar():

    grammar = request.json['grammar']
    
    with open(os.path.join(workDir,"grammar.json"), "w", encoding="utf-8") as f:
        f.write(grammar)

    return ''

if __name__ == '__main__':

    # params = {}

    # with open('src/utk-map/ts/pythonServerConfig.json', "r", encoding="utf-8") as f:
    #     params = json.load(f)
    #     params = params["paramsPythonServer"]

    # workDir = params["environmentDataFolder"]

    workDir = os.path.join(workDir,os.environ.get('DATA_FOLDER'))

    # app.run(debug=True, host=params["environmentIP"], port=params["port"])

    app.run(debug=True, host='0.0.0.0')


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
            raise Exception("For abstract join the levels of both layers should be the same")
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

import os
from flask import Flask, request, send_from_directory, abort
import json

# app = Flask(__name__, static_folder=os.path.abspath('./vis/dist/shadow-maps/'))
app = Flask(__name__)
workDir = None
# @app.route('/', methods=['GET'])
# def index():
#     return serve_static('index.html')

# @app.route('/<path:filename>', methods=['GET'])
# def serve_static(filename):
#     # return send_from_directory(safe_join(app.root_path,'vis/dist/shadow-maps/'), filename)
#     return send_from_directory(os.path.join(app.root_path, 'vis/dist/shadow-maps/'), filename)

@app.route('/linkLayers', methods=['GET'])
def serve_linkLayers():

    if("predicate" not in request.args or "layerId" not in request.args or "thisLevel" not in request.args or "otherLevel" not in request.args or "abstract" not in request.args):
        abort(400, "Missing one or more parameters of: predicate, layerId, thisLevel, otherLevel, abstract")

    predicate = request.args.get('predicate')
    layerId = request.args.get('layerId')
    thisLevel = request.args.get('thisLevel')
    otherLevel = request.args.get('otherLevel')
    abstract = request.args.get('abstract')

    print("predicate "+predicate)
    print("layerId "+layerId)
    print("thisLevel "+thisLevel)
    print("otherLevel "+otherLevel)
    print("abstract "+abstract)
    
    return ''

@app.route('/clearLinks', methods=['GET'])
def serve_clearLinks():

    print(workDir)

    if("layer" not in request.args):
        print("cleaning joined layers of all layers")
    else:
        print("clearning joined layers of "+request.args.get("layer"))
    
    return ''

if __name__ == '__main__':

    params = {}

    with open('../../params.json', "r", encoding="utf-8") as f:
        params = json.load(f)
        params = params["paramsPythonServer"]

    workDir = params["environmentDataFolder"]

    app.run(debug=True, host=params["environmentIP"], port=params["port"])

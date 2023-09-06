import warnings
warnings.simplefilter("ignore", UserWarning)

import os
import sys
import time
import argparse
import json
import psutil
import threading
import requests, zipfile, io
from flask import Flask, request, send_from_directory, abort, jsonify
from geopy.geocoders import Nominatim
from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler

from utk.utils import *
from utk.files_interface import *

app = Flask(__name__)
geolocator = Nominatim(user_agent="urbantk")
workdir = './data/'
grammarpath = './data/grammar.json'
bundlepath = './utk-app/'
tspath = './utk-ts/'
frontpath = './utk-frontend/'
address = 'localhost'
port = 5001

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

@app.route('/')
def root():
    return send_from_directory(bundlepath, 'index.html')

@app.route('/<path:name>')
def serve_bundle(name):

    # Replace with correct 
    if name == 'main.js':
        with open(os.path.join(bundlepath,name), "r", encoding="utf-8") as f:
            print('%s:%d'%(address,port))
            text = f.read()
            replaced = text.replace('localhost:5001','%s:%d'%(address,port))
            response = app.response_class(
                response=replaced,
                status=200,
                mimetype='text/javascript'
            )
            return response

    return send_from_directory(bundlepath, name)

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

    fi.setWorkDir(workdir)

    if(fi.existsJoin(out, inData, spatial_relation.upper(), outLevel.upper(), inLevel.upper(), abstract)):
        return ''

    fi.addLayerFromJsonFile(os.path.join(workdir, out+".json"))
    fi.addLayerFromJsonFile(os.path.join(workdir, inData+".json"), abstract=abstract)

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

    fi.saveJoined(workdir)

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
    return send_from_directory(workdir, path)

@app.route('/getGrammar', methods=['GET'])
def serve_getGrammar():
    grammar = {}
    with open(grammarpath, "r", encoding="utf-8") as f:
        grammar = json.load(f)

    response = app.response_class(
        response=json.dumps(grammar),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/getLayer', methods=['GET'])
def serve_getLayer():

    if("layer" not in request.args):
        abort(400, "Missing one or more parameters of: layer")

    layer = request.args.get('layer')

    layer_json = {}

    with open(os.path.join(workdir,layer+".json"), "r", encoding="utf-8") as f:
        layer_json = json.load(f)

    return json.dumps(layer_json, indent=4)

@app.route('/solveNominatim', methods=['GET'])
def serve_solveNominatim():

    if("text" not in request.args):
        abort(400, "Missing one or more parameters of: text")

    text = request.args.get('text')

    location = geolocator.geocode(text, timeout=5)

    convertedProj = utk.utils.convert_projections("4326", "3395", [location.latitude, location.longitude])

    return json.dumps({
        'position': convertedProj+[3], 
        'direction': {
            'right': [0,0,3000],
            'lookAt': [0,0,0],
            'up': [0,1,0]
        }
    })

# @app.route('/addRenderStyles', methods=['GET'])
# def serve_addRenderStyles():

#     grammar = {}

#     with open(os.path.join(workDir,"grammar.json"), "r", encoding="utf-8") as f:
#         grammar = json.load(f)

#     layersInfo = {}

#     for knot in grammar["components"][0]["knots"]:
#         if('knotOp' not in knot or knot['knotOp'] != True):
            
#             for index, link in enumerate(knot['integration_scheme']):

#                 layer = link['out']
#                 buildings = False
#                 triangles = False
#                 interactions = False
#                 embeddedPlots = False
#                 abstract = 'in' in link
#                 data = {}

#                 if(layer not in layersInfo):
#                     with open(os.path.join(workDir,layer+".json"), "r", encoding="utf-8") as f:
#                         data = json.load(f)
#                 else:
#                     data = layersInfo[layer]['data']

#                 if(data["type"] == "TRIANGLES_3D_LAYER" or data["type"] == "TRIANGLES_3D_LAYER"):
#                     triangles = True

#                 if(data["type"] == "BUILDINGS_LAYER"):
#                     buildings = True

#                 for i in range(len(grammar["components"][0]['map']["knots"])):
#                     if(grammar["components"][0]['map']["knots"][i] == knot["id"] and grammar["components"][0]["map"]["interactions"][i] != "NONE"):
#                         if(index == len(knot['integration_scheme'])-1): # only the layers that will be rendered can be interacted with
#                             interactions = True
#                         break

#                 for i in range(len(grammar["components"][0]["plots"])):
#                     if(knot["id"] in grammar["components"][0]["plots"][i]["knots"] and grammar["components"][0]["plots"][i]["arrangement"] == "SUR_EMBEDDED" or grammar["components"][0]["plots"][i]["arrangement"] == "FOOT_EMBEDDED"):
#                         embeddedPlots = True
#                         break

#                 if(layer not in layersInfo):
#                     layersInfo[layer] = {
#                         "layer": layer,
#                         "triangles": triangles,
#                         "buildings": buildings,
#                         "interactions": interactions,
#                         "embeddedPlots": embeddedPlots,
#                         "abstract": abstract,
#                         "data": data
#                     }
#                 else:
#                     layersInfo[layer]['triangles'] =  layersInfo[layer]['triangles'] or triangles
#                     layersInfo[layer]['buildings'] =  layersInfo[layer]['buildings'] or buildings
#                     layersInfo[layer]['interactions'] =  layersInfo[layer]['interactions'] or interactions
#                     layersInfo[layer]['embeddedPlots'] =  layersInfo[layer]['embeddedPlots'] or embeddedPlots
#                     layersInfo[layer]['abstract'] =  layersInfo[layer]['abstract'] or abstract

#     for layer in layersInfo:
#         renderStyles = []

#         # coloring shader
#         if(not layersInfo[layer]['abstract']):
#             renderStyles.append("SMOOTH_COLOR")
#         elif(not layersInfo[layer]['buildings']):
#             renderStyles.append("SMOOTH_COLOR_MAP")
#         else:
#             renderStyles.append("SMOOTH_COLOR_MAP_TEX")

#         if(layersInfo[layer]['interactions']):
#             renderStyles.append("PICKING")

#         if(layersInfo[layer]['buildings'] and layersInfo[layer]['embeddedPlots']):
#             renderStyles.append("ABSTRACT_SURFACES")

#         layersInfo[layer]['data']['renderStyle'] = renderStyles

#         with open(os.path.join(workDir,layer+".json"), "w", encoding="utf-8") as f:
#             f.write(json.dumps(layersInfo[layer]['data']))

#     return ''

@app.route('/writeImpactViewData', methods=['POST'])
def writeImpactViewData():
    
    impactData = request.json['data']

    with open(os.path.join(workDir,"impactView.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(impactData))

    return ''


@app.route('/updateGrammar', methods=['POST'])
def serve_updateGrammar():

    grammar = request.json['grammar']
    
    with open(grammarpath, "w", encoding="utf-8") as f:
        f.write(grammar)

    return ''

def list_used_ports():
    print("Ports used by utk:")
    for p in psutil.process_iter():
        try:
            if 'python' in p.cmdline()[0]:
                if os.path.basename(__file__) in p.cmdline()[1] or 'utk' in p.cmdline()[1]:
                    connections = p.connections()
                    for c in connections:
                        print(c.laddr.port)
        except:
            pass

def stop_used_ports():
    print("Stopping utk:")
    for p in psutil.process_iter():
        try:
            if 'python' in p.cmdline()[0]:
                if os.path.basename(__file__) in p.cmdline()[1] or 'utk' in p.cmdline()[1]:
                    if 'example' in p.cmdline()[2] or 'start' in p.cmdline()[2]:
                        p.kill()
        except:
            pass

def download_example():
    r = requests.get('https://github.com/urban-toolkit/urbantk/raw/master/examples/simple_example.zip')
    z = zipfile.ZipFile(io.BytesIO(r.content))
    z.extractall('.')

def main():
    global workdir
    global bundlepath
    global grammarpath
    global tspath
    global frontpath
    global address
    global port

    parser = argparse.ArgumentParser(description='Urban Toolkit')
    parser.add_argument('mode', nargs=1, choices=['start', 'list', 'stop', 'example'], help='Start, list or stop utk servers, or start server with a simple example.')
    parser.add_argument('-d', '--data', nargs='?', type=str, required=False, default=None, help='Path to data folder.')
    parser.add_argument('-b', '--bundle', nargs='?', type=str, required=False, help='Path to app bundle (defaults to installed utk bundle).')
    parser.add_argument('-g', '--grammar', nargs='?', type=str, required=False, default=None, help='Path to grammar JSON file, if different from [DATA]/grammar.json (default: [DATA]/grammar.json).')
    parser.add_argument('-a', '--address', nargs='?', type=str, required=False, default='localhost', help='Server address (default: %(default)s).')
    parser.add_argument('-p', '--port', nargs=1, type=int, required=False, default='5001', help='Server port (default: %(default)s).')
    parser.add_argument('-w', '--watch', action='store_true', help='Watch folders, and re-build if there are changes.')


    args = parser.parse_args()

    workdir = args.data
    bundlepath = args.bundle
    grammarpath = args.grammar
    address = args.address
    port = args.port
    mode = args.mode[0]

    if mode == 'stop':
        stop_used_ports()
    elif mode == 'list':
        list_used_ports()
    else:
        if mode == 'example':
            download_example()
            workdir = './simple_example/'
            mode = 'start'

        if workdir == None:
            print("Error: --data not specified.")
            exit(1)

        if grammarpath == None:
            grammarpath = os.path.join(workdir,"grammar.json")

        # check if grammar exists
        if os.path.isfile(grammarpath) is False:
            print("Error: %s does not exist, check arguments."%grammarpath)
            exit(1)

        # check if bundle exist
        if bundlepath is None:
            bundlepath = os.path.join(os.path.dirname(__file__), frontpath+'/build/utk-app')
        if os.path.exists(bundlepath) is False:
            print("Error: %s does not exist, check bundle path."%bundlepath)
            exit(1)

        # absolute paths
        workdir = os.path.abspath(workdir)
        bundlepath = os.path.abspath(bundlepath)
        grammarpath = os.path.abspath(grammarpath)
        tspath = os.path.abspath(tspath)
        frontpath = os.path.abspath(frontpath)

        if args.watch:
            # utk-ts observer
            ts_observer = Observer()
            def run_ts():
                class Event(LoggingEventHandler):
                    def dispatch(self, event):
                        os.system('cd %s && npm run build'%(tspath))
                        os.system('cd %s && npm run build'%(frontpath))
                        print("Build done!")
                event_handler = Event()
                ts_observer.schedule(event_handler, tspath+'/src/', recursive=True)
                ts_observer.start()
            ts_thread = threading.Thread(target=run_ts)
            ts_thread.start()

            # utk-frontend observer
            frontend_observer = Observer()
            def run_frontend():
                class Event(LoggingEventHandler):
                    def dispatch(self, event):
                        os.system('cd %s && npm run build'%(frontpath))
                        print("Build done!")
                event_handler = Event()
                frontend_observer.schedule(event_handler, frontpath+'/src/', recursive=True)
                frontend_observer.start()
            frontend_thread = threading.Thread(target=run_frontend)
            frontend_thread.start()

        app.run(host=address, port=port)

if __name__ == '__main__':
    main()

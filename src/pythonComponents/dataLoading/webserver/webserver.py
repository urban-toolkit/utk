from flask import Flask, render_template, redirect
import json
import os

app = Flask(__name__)

workDir = '../../../../public/data/manhattan_wo_cells/' 

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/vis2')
def vis1():
	vis1_json = {}
	with open(os.path.join(workDir,'avg_shadow_figure.json'), 'r') as file:
		vis1_json = json.load(file)

	with open(os.path.join(workDir, 'grammar.json'), 'w') as file:
		file.write(json.dumps(vis1_json))

	return redirect("http://utk.evl.uic.edu:3000")

@app.route('/vis1')
def vis2():
	vis2_json = {}
	with open(os.path.join(workDir, 'footprint_figure.json'), 'r') as file:
		vis2_json = json.load(file)
	
	with open(os.path.join(workDir, 'grammar.json'), 'w') as file:
		file.write(json.dumps(vis2_json))

	return redirect("http://utk.evl.uic.edu:3000")

@app.route('/vis3')
def vis3():
	vis3_json = {}
	with open(os.path.join(workDir, 'milan.json'), 'r') as file:
		vis3_json = json.load(file)

	with open(os.path.join(workDir, 'grammar.json'), 'w') as file:
		file.write(json.dumps(vis3_json))

	return redirect("http://utk.evl.uic.edu:3000")

@app.route('/climate')
def climate():
	return "Climate testing"

if __name__ == '__main__':
	app.run(debug=True, host="utk.evl.uic.edu", port='80')

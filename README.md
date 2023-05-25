# The Urban Toolkit (UTK)

While cities around the world are looking for smart ways to channel new advances in data collection, management, and
analysis to address their day-to-day problems, the complex nature of urban issues and the overwhelming amount of available structured
and unstructured data have posed significant challenges in translating these efforts into actionable insights. In our paper **The Urban Toolkit: A Grammar-based Framework for
Urban Visual Analytics**, we present the Urban Toolkit, a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind. In order to facilitate the integration and
visualization of different urban data, we also propose the concept of knots to merge thematic and physical urban layers. This repository presents the source
code of the framework as well as documentation containing a gallery of examples, an in-depth description of the grammar and the steps needed to run the code.

## Getting started

### System Requirements

- Browser: Google Chrome (other browsers were not extensively tested yet, it might not behave as expected)
- OS: Windows (other OS were not extensively tested yet, it might not behave as expected)
- For ray tracing computation (optional): check PlotOptix requeriments [here](https://plotoptix.rnd.team/)
- To load data from PBF files:
    - Windows with wsl activated is necessary
    - In the wsl cmd run `apt get install osmium-tool`

### Installation

1. Clone the repository

- `git clone https://github.com/urban-toolkit/utk.git`
- `cd utk`

2. Setup virtual environment

While dependencies can be installed without using a virtual environment, we recommend you to do so. Specifically, the Anaconda package manager will be used.  

- If you do not have Anaconda installed you can follow the instructions [here](https://www.anaconda.com/) (the Anaconda version used in this tutorial is '22.9.0').
- After installing it, open the Anaconda prompt and run:
    - `conda create -n utkenv python=3.10.6 -c conda-forge --file requirements_conda.txt`
    - `conda activate utkenv` (utkenv needs to be activated to run UTK)
    - `pip install -r requirements_pip.txt`

3. Backend setup 

- `cd src/utk-map/ts`
- `npm install`
- `npm run build`

4. Frontend setup

- `cd ../../../` (go back to the root folder)
- `npm install`
- to see web version `npm run start:web`

5. Run

- `npm run start:web` (after a couple of seconds the browser will open)

### Data loading

All data loaded into the system must be under `public/data/`

To choose which folder to load one has to modify:  
- The field environmentDataFolder in `src/utk-map/ts/pythonServerConfig.js` following the format: `public/data/*folder_name*`.  
- The field environmentDataFolder in `src/params.js` following the format: `data/*folder_name*`.

All layers (physical and thematic) are defined using .json files but following different [formats](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/src/pythonComponents/dataLoading/layers_format.md).

<ins>[UTK API (python)](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/src/pythonComponents/dataLoading/README.md)</ins>

The `src/pythonComponents/dataLoading/UTK_API.ipynb` presents several data loading examples using different types of data. In the end all data will be loaded to a folder under `public/data/`.

### Example gallery

Each example can be download and executed out of the shelf, but jupyter notebooks and the grammar specifications are also provided if one wants to build it from "scratch".

<ins>Loading downtown Manhattan</ins>

**Description**: loading water, parks, street network and buildings for downtown Manhattan. Also raytracing is used for shadow simulation.

**Data**: [download](https://drive.google.com/drive/folders/13PlCVp_k464Xygp4kGsp_ZactGP91KJH?usp=share_link) or [jupyter notebook](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/downtown_manhattan/data.ipynb)

**Grammar**: [specification](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/downtown_manhattan/grammar.json)

*To visualize the shadow data it is necessary to change the renderStyle of buildings.json to \['SMOOTH_COLOR_MAP_TEX'\] and renderStyle of surface.json to \['SMOOTH_COLOR_MAP'\]* (TODO: choose shader automatically)

<p align="center">
    <img src="./images/example_downtown_manhattan.png"  width="500">
</p>

<ins>What if analysis downtown Chicago</ins>

**Description**" loading water, parks, street network and buildings for downtown Chicago. Also raytracing is used for shadow simulation and for building a what if scenario considering the removal of two buildings.

**Data** [download](https://drive.google.com/drive/folders/1E8ItW4VO_SParQwc-AJuIQ2Y3-ffdqV_?usp=share_link) or [jupyter notebook](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/data.ipynb)

**Grammar**: [specification](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/grammar.json)

*To visualize the shadow data it is necessary to change the renderStyle of buildings.json and buildings_m.json to \['SMOOTH_COLOR_MAP_TEX'\] and renderStyle of surface.json to \['SMOOTH_COLOR_MAP'\]* (TODO: choose shader automatically)

<p align="center">
    <img src="./images/example_whatif_downtown_chicago.png"  width="500">
</p>

<ins>WRF Temperature per building</ins>



### Configuration

UTK will load data files stored under utk/public/data.  

To choose the loaded datafolder one has to modify /src/params.js (environmentDataFolder) and utk/src/pythonServerConfig.json (environmentDataFolder)

### Deploy (Linux server)

Open ports: 80, 3000 and 3002  

Edit /src/param.js (environmentIP) and /src/utk-map/ts/pythonServerConfig.json (environmentIP)

Run (on the project root):

- python src/pythonComponents/dataLoading/webserver/webserver.py (Python server that handles switching examples)
- python src/pythonComponents/dataLoading/server.py (Python server that handles data files)
- npm run deploy:web

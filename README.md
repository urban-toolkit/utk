# The Urban Toolkit (UTK)

While cities around the world are looking for smart ways to channel new advances in data collection, management, and
analysis to address their day-to-day problems, the complex nature of urban issues and the overwhelming amount of available structured
and unstructured data have posed significant challenges in translating these efforts into actionable insights. In our paper **The Urban Toolkit: A Grammar-based Framework for
Urban Visual Analytics**, we present the Urban Toolkit, a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind. In order to facilitate the integration and
visualization of different urban data, we also propose the concept of knots to merge thematic and physical urban layers. This repository presents the source
code of the framework as well as documentation containing a gallery of examples, an in-depth description of the grammar and the steps needed to run the code.

# Getting Started with this project

1. Clone the repository, initialize submodule and pull submodule

`git clone --recurse-submodule https://github.com/urban-toolkit/urbantk-react-ts.git`
 
2. Virtual environment  

Tested Python version '3.10.6'. Tested OS: Windows. pip version: '22.2.2'. Anaconda version: 22.9.0

- The easiest way to install all dependencies is by using an [anaconda](https://www.anaconda.com/) virtual environment
- After installing anaconda run:
- `conda create -n urbantk -c conda-forge --file conda-package-list.txt`
- `conda activate urbantk`
- go to urbantk-react-ts
- run `pip install -r requirements_pip.txt` (python scripts requirements)
- To load data from pbf it is necessary to be in a windows environment and activate wsl. In the wsl cmd run `apt get install osmium-tool`

3. Backend configuration 

   - go to urbantk-react-ts/src/urbantk-map/
   - git checkout main
   - git pull origin main
   - cd ts
   - run `npm install`
   - run `npm run build`

4. Frontend configuration
   - go back to urbantk-react-ts folder
   - run `npm install --force`
   - to see web version `npm run start:web`
   - to see the VR version `npm run start:vr`
   - to see the CAVE2 version `npm run start:cave`

5. Cuda Installation (for shadow ray tracing)

   - a CUDA-enabled GPU with compute capability 5.0 (Maxwell) to latest (Ampere);
       - NVIDIA driver >= r515;
   - Python 3 64-bit
   - Windows:
       - Framework .NET >= 4.8 (present in all modern Windows)
   - Linux:
       - Mono Common Language Runtime >= 6.6
       - pythonnet
       - FFmpeg >= 4.1

- https://developer.nvidia.com/cuda-downloads


### Configuration

All important configuration parameters are situated in src/params.js or src/pythonServerConfig.json.  

### Available start options

- "start:web": Starts the web version
- "build:web": Builds the bundle for web version (broken)
- "start:vr": Starts the VR version
- "build:vr": Builds the bundle for the VR version (broken)
- "start:cave": Starts the CAVE2 version
- "start:cave:local": Starts the CAVE2 version locally (for testing purposes) (not implemented)
- "build": Build web version and bundle (broken)
- "build:bundle": Build webpack bundle
- "test": Run tests (not implemented)

### About the data

The data used in the stages is served through the public folder.  

If one wants to change which data is being loaded the paramsMapView.environmentDataFolder has to be changed inside src/params.js 

Obs: Currently it is only possible to load public/data/example_mesh_nyc, because it is the only example that uses the projection 3395 instead of lat/lng.
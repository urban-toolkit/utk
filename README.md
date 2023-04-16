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

### Example gallery

### Configuration

UTK will load data files stored under utk/public/data.  

To choose the loaded datafolder one has to modify utk/src/params.js (environmentDataFolder) and utk/src/pythonServerConfig.json (environmentDataFolder)
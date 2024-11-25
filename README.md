[![PyPI](https://img.shields.io/pypi/v/utk)](https://pypi.org/project/utk/) [![Slack](https://img.shields.io/badge/slack-4A154B)](https://join.slack.com/t/urbantk/shared_invite/zt-22g7ui2s4-MNKvQ2iL7wc3SmpKnPiL0A)

![UTK logo](https://github.com/urban-toolkit/utk/blob/master/images/logo.jpg?raw=true)

# The Urban Toolkit (UTK)

The Urban Toolkit is a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind.

For a quick getting starter document and tutorials, visit: [urbantk.org](http://urbantk.org)

UTK was first presented in the [paper](https://ieeexplore.ieee.org/document/10290965):  
**The Urban Toolkit: A Grammar-based Framework for Urban Visual Analytics**  
Gustavo Moreira, Maryam Hosseini, Md Nafiul Alam Nipu, Marcos Lage, Nivan Ferreira, Fabio Miranda  
IEEE Transactions on Visualization and Computer Graphics, 2024

```
@ARTICLE{utk_2024,
  author={Moreira, Gustavo and Hosseini, Maryam and Alam Nipu, Md Nafiul and Lage, Marcos and Ferreira, Nivan and Miranda, Fabio},
  journal={IEEE Transactions on Visualization and Computer Graphics}, 
  title={{The Urban Toolkit}: A Grammar-Based Framework for Urban Visual Analytics}, 
  year={2024},
  volume={30},
  number={1},
  pages={1402-1412},
  doi={10.1109/TVCG.2023.3326598}
}
```

---

![UTK cases](https://github.com/urban-toolkit/utk/blob/master/images/image-1.png?raw=true)

## Table of contents
1. [Features](#features)
2. [Setting up to run utk locally](#setting-up-to-run-utk-locally)
   - [Using built In Python command](#using-built-in-python-command)
   - [Using `conda` environment manager](#using-conda-environment-manager)
3. [Tutorials](#tutorials)
4. [Development](#development)
   1. [Slack channel](#slack-channel)
5. [Other resources](#other-resources)
6. [Team](#team)

## Features
- Easy integration of physical and thematic layers.
- Rapid iteration over the visualization design space.
- Data transformation to support visualization tasks.
- Support for 2D and 3D maps.
- Support for juxtaposed and embedded plots.
- Integration with OpenStreetMap.

UTK has been tested on Linux (Ubuntu 23.04), Windows 10 & 11, and MacOS 13.


## Setting up to run utk locally

To run UTK locally, you must configure a Python environment on your machine. Without this step, you will not be able to launch the UTK server and the editor itself. Configuring python environment can be done using Conda environment manager or Built-In `venv` command. Here we will go over these two methods for setting up UTK.

<details>
  <summary><b>Using built In Python command</b></summary>
  
  ## Using built In Python command
  ### **Install Python**
  First you need to ensure correct Python version is installed. Currently supported python versions are 3.9. 3.10, 3.11. If you don't have python installed follow instructions on [Download Python | Python.org](https://www.python.org/downloads/) and install python version 3.10 on your machine. You can check if python is installed by running the following commands 
  ```SHELL
  python3 --version
  ```
  ### **Create a Virtual Environment** 
  Next step is to set up a new virtual environment for UTK to run in. We will use `venv` command for that. `venv` as well as `pip` comes packaged with all Python versions after 3.0, so there is no need to install them. 
  - Choose the location where you will work with UTK: 
  	- Mac/Linux: `/Users/*username*/Desktop/Repos/UTK_ENV`
  	- Windows: `C:\Users\YourUsername\Desktop\UTK_ENV`
  - Run the following commands to create a virtual environment named `UTK_ENV`
  Mac/Linux:
  ```SHELL
  python3 -m venv /Users/*username*/Desktop/UTK_ENV
  
  ```
  Windows:
  ```SHELL
  python3 -m venv C:\Users\YourUsername\Desktop\UTK_ENV
  
  ```
  ### **Activate the Virtual Environment**
  After the environment is set up activate the environment using the following command:
  Mac/Linux:
  ```SHELL
  source /Users/*username*/Desktop/UTK_ENV/bin/activate
  ```
  Windows:
  ```SHELL
  cd C:\Users\YourUsername\Desktop\UTK_ENV
  C:\Users\YourUsername\Desktop\UTK_ENV\Scripts\activate
  ```
  ### **Install Required Packages**
  Once you are in the newly created environment, you need to install `utk` package as well as python kernel and jupyterLab. We can do that by running the following commands:
  ```SHELL
  pip3 install utk
  pip3 install jupyterlab
  pip install ipykernel
  python -m ipykernel install --user --name=UTK_ENV
  ```
  ### **Verify Installation**
   Type the following code into the jupyter notebook and run it. If the code runs successfully, that means the setup is complete and you are ready to use utk.
  ```SHELL
  utk example
  ```
  Go to your browser and type the following to acces the utk server. If successful you will see a view of manhattan with an editor in front of you.
  ```
  http://localhost:5001
  ```
</details>

<details>
  <summary><b>Using `conda` environment manager</b></summary>
  
  ## Using `conda` environment manager

### **Install Conda**
First make sure conda is installed by installing it from the official website: [Download Anaconda Distribution | Anaconda](https://www.anaconda.com/download)
### **Create and activate a Conda Environment**
After having conda installed we can create a new environment to work in by running the following command:
```SHELL
conda create -n UTK_CONDA python=3.10
conda activate UTK_CONDA
```
### **Install Required Packages**
Once you are in the newly created environment, you need to install `utk` package as well as python kernel and jupyterLab. We can do that by running the following commands:
```SHELL
pip3 install utk
pip3 install jupyterlab
pip install ipykernel
python -m ipykernel install --user --name=UTK_CONDA
```
### **Verify Installation**
Type the following code into the jupyter notebook and run it. If the code runs successfully, that means the setup is complete and you are ready to use utk.
```SHELL
utk example
```
Go to your browser and type the following to acces the utk server. If successful you will see a view of manhattan with an editor in front of you.
```
http://localhost:5001
```
</details>

## `utk` Command 
The ``utk`` command takes the following arguments:
```
usage: utk [-h] [-d [DATA]] [-b [BUNDLE]] [-g [GRAMMAR]] [-a [ADDRESS]]
           [-p PORT]
           {start,list,stop,example}

The Urban Toolkit

positional arguments:
  {start,list,stop,example}
                        Start, list or stop utk servers, or start server with
                        a simple example.

optional arguments:
  -h, --help            show this help message and exit
  -d [DATA], --data [DATA]
                        Path to data folder.
  -b [BUNDLE], --bundle [BUNDLE]
                        Path to app bundle (defaults to installed utk bundle).
  -g [GRAMMAR], --grammar [GRAMMAR]
                        Path to grammar JSON file, if different from
                        [DATA]/grammar.json (default: [DATA]/grammar.json).
  -a [ADDRESS], --address [ADDRESS]
                        Server address (default: localhost).
  -p PORT, --port PORT  Server port (default: 5001).
  -w, --watch           Watch folders, and re-build if there are changes.
```

Even though we offer support for a variety of arguments, most users will simply need to run the following to use data stored in a folder called ``./data/``:
## Loading custom data
<details>
    <summary><b>Loading your own data</b></summary>
  
### Loading your own data
If there is a specific map section that you need to work with you can use the following steps:
1. Launch jupyterLab with:
```SHELL
jupyter-lab
```
 You will be prompted to select Python kernel. Select the kernel we created in previous tutorial.


2. Download the data from OSM into the specified folder.
```Python
uc = utk.OSM.load('Manhattan, NY', layers=['surface', 'parks', 'water', 'roads'])
uc.save('./manhattan')
```

This download will get all the data that you need to run utk. Folder with data should contain grammar.json, which is the file which will contain your visualisation 

3. In the terminal launch utk server
```SHELL
utk start --data ./*downloaded_data*
```

4. Go to your browser and type. I successful you will see a view of manhattan with an editor in front of you.
```
http://localhost:5001
```
</details>


<details>
    <summary><b>Using pre-downloaded data</b></summary>
  
  ## Using pre-downloaded data
Some of our tutorials will provide a download link with a data file. In this case all you need to do is go to the folder in which the downloaded folder is located and do the following steps(Assuming you are in the correct environment):
1. In the terminal launch utk server
```SHELL
utk start --data ./*downloaded_data*
```

2. Go to your browser and type. I successful you will see a view of manhattan with an editor in front of you.
```
http://localhost:5001
```
</details>

After starting UTK's server and opening ``localhost:5001`` on a browser, you will see UTK's main interface, composed of a grammar editor (left) and map viewer (right). Adding new elements to the grammar specification on the right (e.g., new plots, new data) will automatically update the map viewer:

![UTK example](https://github.com/urban-toolkit/utk/blob/master/images/example.gif?raw=true)

### Simulations 

Currently supported simulations: 
- Shadow casting. To run this simulation, your system will need to support Plotoptix (see [here](https://plotoptix.rnd.team/)). To use the other functionalities from UTK, your system doesn't need to support Plotoptix. 

## Tutorials

![UTK tutorials](https://github.com/urban-toolkit/utk/blob/master/images/tutorials.png?raw=true)

Step-by-step tutorials are available on our [website](http://urbantk.org/home-tutorials). These tutorials highlight how UTK can be used to create sophisticated urban visualizations.

A detailed description of UTK's grammar can be found [here](https://github.com/urban-toolkit/utk/blob/master/grammar.md).

## Development

If you would like to modify UTK's core code, you won't be able to use the ``utk`` command (since it points to the utk pip installation). Alternatively, you will have to:
1. Clone the repository with ``git clone git@github.com:urban-toolkit/utk.git``.
1. Install Node.js, either using [conda](https://anaconda.org/conda-forge/nodejs), [package managers](https://nodejs.org/en/download/package-manager), or [pre-built installers](https://nodejs.org/en/download).
2. Build the utk-ts bundle. Inside ``src/utk-ts``, you should run the following in the terminal: ``npm install && npm run build``. After that, a bundle will be created.
3. Build the utk-frontend bundle. Inside ``src/utk-frontend``, you should run the following in the terminal: ``npm install && npm run build:web``. After that, another bundle will be created.
4. Run the UTK server. Inside the ``src``, run the following in the terminal: ``python utk_server.py start --bundle utk-frontend/build/utk-app/``, and with the other appropriate arguments (e.g., ``--data`` with the path to your data folder).

To automatically build the bundles (steps 2 and 3) when you make changes to the source code, you can run ``utk_server.py`` with the ``--watch`` argument.

### Slack channel

For question, including development ones, join [UTK's Slack](https://join.slack.com/t/urbantk/shared_invite/zt-22g7ui2s4-MNKvQ2iL7wc3SmpKnPiL0A). Feel free to post questions on the ``#installation``, ``#quick-start``, and``#development`` channels.

## Other resources
- [Quick start](http://urbantk.org/get-started/)
- [Tutorials](http://urbantk.org/home-tutorials/)
- [Python API](https://github.com/urban-toolkit/utk/blob/master/API.md)
- [Grammar](https://github.com/urban-toolkit/utk/blob/master/grammar.md)

## Team
- Gustavo Moreira (UIC)
- [Maryam Hosseini](https://www.maryamhosseini.me/) (MIT)
- Md Nafiul Alam Nipu (UIC)
- [Marcos Lage](http://www.ic.uff.br/~mlage/) (UFF)
- [Nivan Ferreira](https://www.cin.ufpe.br/~nivan/) (UFPE)
- [Fabio Miranda](https://fmiranda.me) (UIC)



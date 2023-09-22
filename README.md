[![PyPI](https://img.shields.io/pypi/v/utk)](https://pypi.org/project/utk/) [![Slack](https://img.shields.io/badge/slack-4A154B)](https://join.slack.com/t/urbantk/shared_invite/zt-22g7ui2s4-MNKvQ2iL7wc3SmpKnPiL0A)

![UTK logo](https://github.com/urban-toolkit/utk/blob/master/images/logo.jpg?raw=true)

# The Urban Toolkit (UTK)

The Urban Toolkit is a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind.

For a quick getting starter document and tutorials, visit: [urbantk.org](http://urbantk.org)

UTK was first presented in the [paper](https://arxiv.org/abs/2308.07769):  
**The Urban Toolkit: A Grammar-based Framework for Urban Visual Analytics**  
Gustavo Moreira, Maryam Hosseini, Md Nafiul Alam Nipu, Marcos Lage, Nivan Ferreira, Fabio Miranda  
IEEE Transactions on Visualization and Computer Graphics (Accepted, to appear)

---

![UTK cases](https://github.com/urban-toolkit/utk/blob/master/images/image-1.png?raw=true)

## Table of contents
1. [Features](#features)
2. [Installation and quick start](#installation-and-quick-start)
    1. [UTK backend](#utk-backend)
    2. [UTK frontend](#utk-frontend)
3. [Tutorials](#tutorials)
4. [Development](#development)
    1. [Slack channel](#slack-channel)
6. [Other resources](#other-resources)
7. [Team](#team)

## Features
- Easy integration of physical and thematic layers.
- Rapid iteration over the visualization design space.
- Data transformation to support visualization tasks.
- Support for 2D and 3D maps.
- Support for juxtaposed and embedded plots.
- Integration with OpenStreetMap.

UTK has been tested on Linux (Ubuntu 23.04), Windows 10 & 11, and MacOS 13.


## Installation and quick start

UTK leverages several spatial packages, such as Geopandas, OSMnx, Osmium, Shapely. To facilite the installation of UTK, we have made it available through pip, only requiring the following commands in a terminal / command prompt:

```console
pip install utk
```

UTK requires Python 3.9 or a newer version. If you are having problems installing UTK in Mac OSX because of Osmium, make sure you have CMake installed as well (e.g., through [conda](https://anaconda.org/anaconda/cmake) or [Homebrew](https://formulae.brew.sh/formula/cmake)).

A detailed description of UTK's capabilities can be found in our [paper](https://arxiv.org/abs/2308.07769), but generally speaking UTK is divided into two components: a backend component, accessible through UTK's Python library, and a frontend component, accessible through a web interface.

### UTK backend

UTK's backend is available through our Python library. For example, using a Jupyter Notebook, it can be imported with:

```python
import utk
```

To download data for Manhattan, NY, you only need to then:
```
uc = utk.OSM.load('Manhattan, NY', layers=['surface', 'parks', 'water', 'roads'])
uc.save('./manhattan')
```

This will create a new folder (``manhattan``) with the downloaded and parsed OSM data. On top of that, UTK also offers functionalities to load data from shapefiles (``utk.physical_from_shapefile``), csv files (``utk.thematic_from_csv``), dataframes (``utk.thematic_from_df``), and also accumulate sunlight access values (``utk.data.shadow``). A detailed description of UTK's Python API can be found [here](https://github.com/urban-toolkit/utk/blob/master/API.md).


### UTK frontend

UTK's frontend is available through the ``utk`` command. After the pip installation is complete, you can check a toy example with the following commands:

```console
utk example
```

UTK's toy example will then be accessible through ``localhost:5001``. After accessing it using a browser, you should see a grammar-defined visualization showing sunlight access per building:

![UTK example](https://github.com/urban-toolkit/utk/blob/master/images/example_full.png?raw=true)


Beyong the simple example, you can also use the ``utk`` command to start and stop UTK's server:

```console
utk start
utk stop
```

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

```console
utk start --data ./data
```

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



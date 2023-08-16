![PyPI](https://img.shields.io/pypi/v/utk)

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

## Features
- Easy integration of physical and thematic layers.
- Rapid iteration over the visualization design space.
- Data transformation to support visualization tasks.
- Support for 2D and 3D maps.
- Support for juxtaposed and embedded plots.
- Integration with OpenStreetMap.

## Installation & quick start

UTK leverages several spatial packages, such as Geopandas, OSMnx, Shapely. To facilite the installation of UTK, we have made it available through pip, only requiring the following commands in a terminal / command prompt:

```console
pip install utk
```

UTK will then be available through the ``utk`` command. After the installation is complete, you can check a toy example with the following command:

```console
utk example
```

UTK will then be accessible through ``localhost:5001``. Starting and stopping UTK's server can be done using the following command:

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
```

After starting UTK's server and opening ``localhost:5001`` on a browser, you will see UTK's main interface, composed of a grammar editor (left) and map viewer (right). Adding new elements to the grammar specification on the right (e.g., new plots, new data) will automatically update the map viewer:

![UTK example](https://github.com/urban-toolkit/utk/blob/master/images/example.gif?raw=true)


## Tutorials

![UTK tutorials](https://github.com/urban-toolkit/utk/blob/master/images/tutorials.png?raw=true)

Step-by-step tutorials are available on our [website](http://urbantk.org/home-tutorials). These tutorials highlight how UTK can be used to create sophisticated urban visualizations.

A detailed description of UTK's grammar can be found [here](https://github.com/urban-toolkit/utk/blob/master/grammar.md). A detailed description of UTK's Python API is coming soon.

## Team
- Gustavo Moreira (UIC)
- [Maryam Hosseini](https://www.maryamhosseini.me/) (MIT)
- Md Nafiul Alam Nipu (UIC)
- [Marcos Lage](http://www.ic.uff.br/~mlage/) (UFF)
- [Nivan Ferreira](https://www.cin.ufpe.br/~nivan/) (UFPE)
- [Fabio Miranda](https://fmiranda.me) (UIC)



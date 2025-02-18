# The Urban Toolkit (UTK) [![PyPI](https://img.shields.io/pypi/v/utk)](https://pypi.org/project/utk/) [![Discord](https://img.shields.io/badge/Discord-738ADB)](https://discord.gg/vjpSMSJR8r)

<div align="center">
  <img src="logo-utk-wide.png?raw=true" alt="UTK Logo" height="150"/></br>
  [<a href="https://arxiv.org/abs/2308.07769">Paper</a>] | [<a href="https://urbantk.org/utk">Website</a>]
</div>

## Overview

The Urban Toolkit is a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind.

**The Urban Toolkit: A Grammar-based Framework for Urban Visual Analytics**  
*Gustavo Moreira, Maryam Hosseini, Md Nafiul Alam Nipu, Marcos Lage, Nivan Ferreira, Fabio Miranda  *
IEEE Transactions on Visualization and Computer Graphics (Volume: 30, Issue: 1, January 2024)   
Paper: [[DOI](https://ieeexplore.ieee.org/document/10290965)], [[Arxiv](https://arxiv.org/abs/2308.07769)]

<div align="center">
  <img src="example.gif?raw=true" />
</div>

<div align="center">
  <img src="image-1.png?raw=true" />
</div>


This project is part of the [Urban Toolkit ecosystem](https://urbantk.org), which includes [Curio](https://github.com/urban-toolkit/curio/) and [UTK](https://github.com/urban-toolkit/utk). Curio is a framework for collaborative urban visual analytics that uses a dataflow model with multiple abstraction levels to facilitate collaboration across the design and implementation of visual analytics components. UTK is a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations through a new high-level grammar specifically built with common urban use cases in mind. 

## Key features
- Easy integration of physical and thematic layers.
- Rapid iteration over the visualization design space.
- Data transformation to support visualization tasks.
- Support for 2D and 3D maps.
- Support for juxtaposed and embedded plots.
- Integration with OpenStreetMap.

## Installation

UTK leverages several spatial packages, such as Geopandas, OSMnx, Osmium, Shapely. To facilite the installation of UTK, we have made it available through pip, only requiring the following commands in a terminal / command prompt:

```console
pip install utk
```

UTK requires Python 3.9, 3.10, or 3.11 (there is an [issue](https://stackoverflow.com/questions/77364550/attributeerror-module-pkgutil-has-no-attribute-impimporter-did-you-mean) with 3.12 that is on our TODO list to solve). If you are having problems installing UTK in Mac OSX because of Osmium, make sure you have CMake installed as well (e.g., through [conda](https://anaconda.org/anaconda/cmake) or [Homebrew](https://formulae.brew.sh/formula/cmake)).


UTK has been tested on Linux (Ubuntu 23.04), Windows 10 & 11, and MacOS 13.

## Usage and contributions
For detailed instructions on how to use the project, please see the [usage](docs/USAGE.md) document. A set of examples can be found [here](docs/). If you'd like to contribute, see the [contributions](docs/CONTRIBUTIONS.md) document for guidelines. For questions, join [UTK's Discord](https://discord.gg/vjpSMSJR8r) server.


## Team
- Gustavo Moreira (UIC)
- [Maryam Hosseini](https://www.maryamhosseini.me/) (UC Berkeley)
- Md Nafiul Alam Nipu (UIC)
- [Marcos Lage](http://www.ic.uff.br/~mlage/) (UFF)
- [Nivan Ferreira](https://www.cin.ufpe.br/~nivan/) (UFPE)
- [Fabio Miranda](https://fmiranda.me) (UIC)


## Citation
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

## License
UTK is MIT Licensed. Free for both commercial and research use.

## Acknowledgements
Curio and the Urban Toolkit have been supported by the National Science Foundation (NSF) (Awards [#2320261](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2320261), [#2330565](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2330565), and [#2411223](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2411223)), Discovery Partners Institute (DPI), and IDOT.

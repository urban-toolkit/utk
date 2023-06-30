# The Urban Toolkit (UTK)

While cities around the world are looking for smart ways to channel new advances in data collection, management, and
analysis to address their day-to-day problems, the complex nature of urban issues and the overwhelming amount of available structured
and unstructured data have posed significant challenges in translating these efforts into actionable insights. In our paper **The Urban Toolkit: A Grammar-based Framework for
Urban Visual Analytics**, we present the Urban Toolkit, a flexible and extensible visualization framework that enables the easy authoring of web-based visualizations
through a new high-level grammar specifically built with common urban use cases in mind. In order to facilitate the integration and
visualization of different urban data, we also propose the concept of knots to merge thematic and physical urban layers. This repository presents the source
code of the framework as well as documentation containing a gallery of examples, an in-depth description of the grammar and the steps needed to run the code.

For a quick getting starter document and tutorials, visit: [urbantk.org](http://urbantk.org)

---

## System Requirements

- docker and docker-compose ([installation guide](https://www.docker.com/get-started/))

## Running

- `docker-compose up` (at the root of the project)

## Architecture

UTK follows a microsservice architecture where each functionality is offered by one container. Please refer to the README.md of each service for more details:

- [backend](https://github.com/urban-toolkit/urbantk/blob/master/services/backend/README.md)
- [frontend](https://github.com/urban-toolkit/urbantk/blob/master/services/frontend/README.md)
- [jupyterAPI](https://github.com/urban-toolkit/urbantk/blob/master/services/jupyterAPI/README.md)
- [utk](https://github.com/urban-toolkit/urbantk/blob/master/services/utk/README.md)
- [prodWebServer](https://github.com/urban-toolkit/urbantk/blob/master/services/prodWebServer/README.md)

## Configuration

All data loaded into the system must be under `data/` (at the root of the project).  

You can modify the `DATA_FOLDER` environment variable on `docker-compose.yml` to change the loaded folder.  

## Grammar

For more details on the grammar refer to [grammar.md](https://github.com/urban-toolkit/urbantk/blob/master/grammar.md).

---

## Example Gallery

Each example can be downloaded and executed off the shelf, but jupyter notebooks and the grammar specifications are also provided if one wants to build them from "scratch".

The jupyter notebooks must be placed inside `jupyterAPI`. Please refer to [jupyterAPI](https://github.com/urban-toolkit/urbantk/blob/master/services/jupyterAPI/README.md) for more details.

### (1) Loading downtown Manhattan

**Description**: loading water, parks, street network and buildings for downtown Manhattan. Also raytracing is used for shadow simulation.

**Data**: [download](https://drive.google.com/drive/folders/13PlCVp_k464Xygp4kGsp_ZactGP91KJH?usp=share_link) or [jupyter notebook](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/downtown_manhattan/data.ipynb)

**Grammar**: [specification](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/downtown_manhattan/grammar.json)

*To visualize the shadow data it is necessary to change the renderStyle of buildings.json to ```SMOOTH_COLOR_MAP_TEX``` and renderStyle of surface.json to ```SMOOTH_COLOR_MAP```*

<p align="center">
    <img src="./images/example_downtown_manhattan.png"  width="500">
</p>

### (2) What if analysis downtown Chicago

**Description**" loading water, parks, street network, and buildings for downtown Chicago. Also, raytracing is used for shadow simulation and for building a what-if scenario considering the removal of two buildings.

**Data** [download](https://drive.google.com/drive/folders/1E8ItW4VO_SParQwc-AJuIQ2Y3-ffdqV_?usp=share_link) or [jupyter notebook](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/data.ipynb)

**Grammar**: [specification](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/grammar.json)

*To visualize the shadow data it is necessary to change the renderStyle of buildings.json and buildings_m.json to ```SMOOTH_COLOR_MAP_TEX``` and renderStyle of surface.json to ```SMOOTH_COLOR_MAP```*

<p align="center">
    <img src="./images/example_whatif_downtown_chicago.png"  width="500">
</p>

### (3) WRF Temperature per building

### (4) Multiple datasets in downtown NYC

**Description**" loading water, parks, street network, and buildings for downtown Chicago. Also, raytracing is used for shadow simulation and for building a what-if scenario considering the removal of two buildings.

**Data** [download](https://drive.google.com/drive/folders/179RYmhPGNvd_kiLLg6AWIM-5wVciyLGr?usp=sharing) or [jupyter notebook](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/data.ipynb)

**Grammar**: [specification](https://github.com/urban-toolkit/urbantk-react-ts/tree/master/examples/whatif_downtown_chicago/grammar.json)

*To visualize the shadow data it is necessary to change the renderStyle of buildings.json and buildings_m.json to ```SMOOTH_COLOR_MAP_TEX``` and renderStyle of surface.json to ```SMOOTH_COLOR_MAP```*

<!-- <p align="center">
    <img src="./images/example_whatif_downtown_chicago.png"  width="500">
</p> -->

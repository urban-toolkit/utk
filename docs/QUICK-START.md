# Quick start

Before you begin, please read out [usage guide](USAGE.md).

## UTK architecture overview

UTK is composed of a frontend and a backend. The frontend is responsible for interpreting the grammar specified by the user and the backend will process and serve the necessary files.

Additionally, UTK's backend includes a Python-based UTK API that facilitates data download and transformation before serving it to the frontend.

## Map interactions

- **left click + drag** to move the camera
- **mouse wheel** to zoom in and zoom out
- **shift + left-click** to rotate the camera
- **t** to select a building/embed plots
- **alt + mouse wheel** to change the height of an embedded plot
- **r** to reset embedded plots
- **shift + left-click + drag** to brush on the surface of buildings
- **enter** to apply brush 
- **right-click** to reset brushing and selections

## Tutorial

To exemplify how the frontend and backend can work together to build a visual analytics system from scratch, this example will cover how to load water, parks, and building layers from Downtown Manhattan from OpenStreetMap (OSM). The data is loaded using the UTK API and rendered using the frontend.

### Step 0: Setup
Create a folder `data/my_first_vis` at the root of the project. Start UTK using `utk start`.

### Step 1: Downloading layers from OSM

We will use the UTK API to download the layers from OSM. First, create a Jupyter notebook and import UTK:

``python
import utk
``

Download the required layers from Downtown Manhattan, and save them as an UTK-ready file:

```python
uc = utk.OSM.load([40.699768, -74.019904, 40.71135, -74.004712], layers=['water', 'surface', 'parks', 'roads', 'buildings'])
uc.save('./data/my_first_vis', includeGrammar=False)
```

In the previous code, the first line uses the OSM submodule of the API to load all the layers that we want. We are specifying the spatial location of the data through a bounding box (`[minLat, minLong, maxLat, maxLong]`). In this case, the bounding box encompasses Downtown Manhattan.

The second line indicates that we want to save the data in the folder that we created previously. We set the `includeGrammar` to false, which means that the grammar file will not be automatically generated. This flag was deactivated so that we can build the specification from scratch.

### Step 2: Simulating shadows

Through the API, it is also possible to run shadow simulations based on the building meshes we downloaded previously:

```python
shadow = utk.data.shadow([
      './data/my_first_vis/buildings.json', 
      './data/my_first_vis/surface.json'
    ], 
    [["12/26/2015 10:00", "12/26/2015 11:01"]]
    )
shadow.save()
```

By using the shadow module, we are accumulating shadows cast between 10 AM and 11:01 AM of 12/26/2015, considering the buildings and surface meshes. The surface mesh is a rectangle bounded by the limits we established previously and it is used to ensure that the ground will also be considered as a colliding object during ray tracing.

The results are saved in two files inside `./data/my_first_vis/`:

- `shadow0_buildings.json` which is a thematic layer with shadows for the coordinates of the buildings. The '0' indicates the timestamp number (we used one).
- `shadow0_surface.json` which is analogous to the previous file but in relation to the surface.

To facilitate the incorporation of shadow (since a compatible GPU is not available in all computers) you can download the shadow simulation data for this specific region of NYC [here](https://drive.google.com/file/d/1aPHGfXX24ehOLLQ81iecPjCQTjh1bR4F/view?usp=sharing).


### Step 3: Frontend setup

Now that we have the data files, we can start using the frontend to render the data. But before we can do that, we have to create a `grammar.json` file inside `data/my_first_vis`, since that was not created in Step 1.

To start the UTK server, on the command line, type `utk start`. The frontend is available at `localhost:5001`. When opening `localhost:5001` for the first time, you will see a webpage where with the grammar editor on the left side describing the basic structures such as a map component, grid configuration, grammar component, and toggle knots component. On the right side is the interpreted result of the specification.
- Map component: defines position and direction of the camera, how to integrate and render data ("knots"), interactions, plots, and the position of the map on the screen of the application (according to a grid).
- Grid configuration: defines how the screen will be divided. "width" for the number of columns; "height" for the number of rows.
- Grammar component: defines the position of the grammar editor.
- Toggle knots component: defines a widget that supports the toggle of knots.


For the initial setup, we are going to include the following code inside `grammar.json`:

<details>
<summary>UTK specification (click to expand)</summary>

```json
{
  "components": [
    {
      "map": {
        "camera": {
          "position": [
            -8239611,
            4941390.5,
            2.100369140625
          ],
          "direction": {
            "right": [
              553.601318359375,
              -2370.810546875,
              2100.369140625
            ],
            "lookAt": [
              563.9249267578125,
              -1633.5897216796875,
              1424.7962646484375
            ],
            "up": [
              0.009459096007049084,
              0.6755067110061646,
              0.7372931241989136
            ]
          }
        },
        "knots": [],
        "interactions": []
      },
      "plots": [],
      "knots": [],
      "widgets": [
        {
          "type": "TOGGLE_KNOT"
        }
      ],
      "position": {
        "width": [
          6,
          12
        ],
        "height": [
          1,
          4
        ]
      }
    }
  ],
  "arrangement": "LINKED",
  "grid": {
    "width": 12,
    "height": 4
  },
  "grammar_position": {
    "width": [
      1,
      5
    ],
    "height": [
      1,
      4
    ]
  }
}
```
</details>

You should see the following:

![UTK example](images/quick-1.png?raw=true)

## Step 4: Adding a water layer

To start rendering our scene we are going to add the water layer we loaded in Step 1. The water layer, as well as all other layers, were previously generated using the the UTK API. In order to load them we have to add:
1. A knot that contains a pure physical layer (no thematic data). It specifies that we want to output the water layer at the object level (we want the shapes not coordinates).
2. A reference to that knot on the map component.
3. The type of interaction we want to support with the knot (none in this case).

Throughout this example, we will illustrate various specifications using JSON files. These files define the visualization and interface components. To keep things simple, each step will highlight only the necessary changes from the previous step, omitting unchanged parts ("..."). Once you've modified the specification, press Apply Grammar to apply the updates.

Next, we present the specification with the water layer:


<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [
+            "purewater"
          ],
          "interactions": [
+           "NONE"
          ]
      },
      "plots": [],
      "knots": [
+       {
+        "id": "purewater",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "water",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       }
      ],
      "widgets": [...],
      "position": {...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...},
  "grammar_position": {...}
}
```
</details>

You should see the following:

![UTK example](images/quick-2.png?raw=true)

### Step 5: Adding other layers

Since this is a simple example where all the layers only have physical data and not thematic data, we will simply follow the steps outlined in Step 4:

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [
            ...
+           "pureparks",
+           "pureroads",
+           "buildings"
          ],
          "interactions": [
            ...
+           "NONE",
+           "NONE",
+           "NONE"
          ]
      },
      "plots": [],
      "knots": [
        ...
+       {
+         "id": "pureparks",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "parks",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       },
+       {
+         "id": "pureroads",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "roads",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       },
+       {
+         "id": "buildings",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "buildings",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       }
      ],
      "widgets": [...]
      "position": {...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...},
  "grammar_position": {...}
}
```
</details>

You should see the following:

![UTK example](images/quick-3.png?raw=true)

### Step 6

In the previous steps, we added pure *knots* that did not have any thematic data. Now, we are going to add the results of the shadow simulation on the surface of buildings. That requires some small changes to the knot definition:
1. A new input layer for the thematic data.
2. A `spatial_relation` to define the spatial join that will link physical and thematic layers.
3. An `operation` to indicate how to aggregate the result of the spatial join (none, because we have a 1:1 relation).
4. An abstract flag to indicate that thematic data is being joined with the physical.
5. The geometry level of both layers is now "coordinates". Since we want to have a heatmap over the surface of buildings, we need a different scalar value for each coordinate of the buildings.

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [
            ...
          ],
          "interactions": [
            ...
          ]
      },
      "plots": [],
      "knots": [
        ...
        {
          "id": "buildings",
          "integration_scheme": [
            {
+             "spatial_relation": "NEAREST",
              "out": {
                "name": "buildings",
+               "level": "COORDINATES3D"
              },
+             "in": {
+               "name": "shadow",
+               "level": "COORDINATES3D"
+             },
+             "operation": "NONE",
+             "abstract": true
            }
          ]
        }
      ],
      "widgets": [...]
      "position": {...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...},
  "grammar_position": {...}
}
```

</details>

You should see the following:

![UTK example](images/quick-4.png?raw=true)

### Final specification

<details>
<summary>UTK specification (click to expand)</summary>

```json
{
  "components": [
    {
      "map": {
        "camera": {
          "position": [
            -8239611,
            4941390.5,
            2.100369140625
          ],
          "direction": {
            "right": [
              553.601318359375,
              -2370.810546875,
              2100.369140625
            ],
            "lookAt": [
              563.9249267578125,
              -1633.5897216796875,
              1424.7962646484375
            ],
            "up": [
              0.009459096007049084,
              0.6755067110061646,
              0.7372931241989136
            ]
          }
        },
        "knots": [
          "purewater",
          "pureparks",
          "pureroads",
          "buildings"
        ],
        "interactions": [
          "NONE",
          "NONE",
          "NONE",
          "NONE"
        ]
      },
      "plots": [],
      "knots": [
        {
          "id": "purewater",
          "integration_scheme": [
            {
              "out": {
                "name": "water",
                "level": "OBJECTS"
              }
            }
          ]
        },
        {
          "id": "pureparks",
          "integration_scheme": [
            {
              "out": {
                "name": "parks",
                "level": "OBJECTS"
              }
            }
          ]
        },
        {
          "id": "pureroads",
          "integration_scheme": [
            {
              "out": {
                "name": "roads",
                "level": "OBJECTS"
              }
            }
          ]
        },
        {
          "id": "buildings",
          "integration_scheme": [
            {
              "spatial_relation": "NEAREST",
              "out": {
                "name": "buildings",
                "level": "COORDINATES3D"
              },
              "in": {
                "name": "shadow",
                "level": "COORDINATES3D"
              },
              "operation": "NONE",
              "abstract": true
            }
          ]
        }
      ],
      "widgets": [],
      "position": {
        "width": [
          6,
          12
        ],
        "height": [
          1,
          4
        ]
      }
    }
  ],
  "arrangement": "LINKED",
  "grid": {
    "width": 12,
    "height": 4
  },
  "grammar_position": {
    "width": [
      1,
      5
    ],
    "height": [
      1,
      4
    ]
  }
}
```

In a few steps, we went from zero to having a customized visual analytics interface to visualize data downloaded from OSM. Check [here](README.md) for more examples.

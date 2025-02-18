# Example: What-if scenarios

This example walks you through the process of defining a what-if scenario in downtown Chicago. You will use shadow simulation data from two different scenarios to analyze the impact a few buildings can have on Millennium Park.

Before you begin, please familiarize yourself with UTK's main concepts and functionalities by reading our [usage guide](../USAGE.md).

The data for this tutorial can be found [here](https://drive.google.com/drive/folders/13W7VY2xLGw6Su4W0t6ZuE9d7HuQl4xZ0?usp=sharing).

## Step 1: Adding a water layer

Throughout this example, we will illustrate various specifications using JSON files. These files define the visualization and interface components. To keep things simple, each step will highlight only the necessary changes from the previous step, omitting unchanged parts ("..."). Once you've modified the specification, press Apply Grammar to apply the updates.

To start rendering our scene, we are going to add a basic water layer containing the ocean. The water layer, as well as all other layers, were previously generated using the the UTK API (see [here](../USAGE.md) for details). The water layer can be specified in the JSON specification as follows:

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [
+           "purewater"
          ],
          "interactions": [
+           "NONE"
          ]
      },
      "plots": [],
      "knots": [
+       {
+         "id": "purewater",
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
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```

</details>

You should see the following:

![UTK example](../images/what-if-1.png?raw=true)



## Step 2: Adding other background layers (parks and roads)

As in Step 1, we will define and render pure "knots" for parks and roads. The process follows the same steps.

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
+           "pureroads"
          ],
          "interactions": [
            ...
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
+       }
      ],
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```
</details>


You should see the following:

![UTK example](../images/what-if-2.png?raw=true)

## Step 3: Adding buildings and surfaces

Adding a 3D layer for buildings follows the same straightforward process as adding water, parks, and roads. The data for this step was sourced from OpenStreetMap (OSM) and processed using the UTK API.

In this example, to compare the shadow impact of specific buildings, we will load two datasets: "buildings" and "buildings_m", where "buildings_m" excludes the structures we want to analyze.

In addition to rendering the buildings, we will also generate two heatmap surfaces (without thematic data for now) to display the shadow simulation results for both scenarios.

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
+           "surface",
+           "surface_m",
+           "buildings",
+           "buildings_m"
          ],
          "interactions": [
            ...
+           "NONE",
+           "NONE",
+           "BRUSHING",
+           "BRUSHING"
          ]
      },
      "plots": [],
      "knots": [
        ...
        {
+         "id": "surface",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "surface",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       },
+       {
+         "id": "surface_m",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "surface",
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
+       },
+       {
+         "id": "buildings_m",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "buildings_m",
+               "level": "OBJECTS"
+             }
+           }
+         ]
+       }
      ],
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```

</details>


You should see the following:

![UTK example](../images/what-if-3.png?raw=true)

## Step 4: Adding shadow data on the buildings and surfaces

In all previous steps, we added pure "knots" without thematic data. In this example, we will incorporate the results of two shadow simulation runs conducted on 12/26/2015, accumulating data between 15:00 and 17:01, overlaying the results onto the buildings and surface. See the [quick start](../QUICK-START.md) for an overview of how the data was generated. One simulation considered all buildings, while the other excluded a few to assess their impact on shadows.

To achieve this, we need to make the following modifications to our previous knot definitions:

- New input layers to include the thematic data.
- A spatial_relation definition to establish a spatial join between physical and thematic layers.
- An operation definition specifying how to aggregate the results of the spatial join (in this case, none, as we have a 1:1 relationship).
- An abstract flag to indicate that thematic data is being joined with physical layers.
- Geometry level set to "coordinates" for all layers. Since we aim to generate heatmaps on both the buildings and the surface, each coordinate of the meshes must be assigned a distinct scalar value.



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
          "id": "surface",
          "integration_scheme": [
            {
+             "spatial_relation": "NEAREST",
              "out": {
                "name": "surface",
+               "level": "COORDINATES3D"
              },
+             "in": {
+               "name": "shadow_surface",
+               "level": "COORDINATES3D"
+             },
+             "operation": "NONE",
+             "abstract": true
            }
          ]
        },
        {
          "id": "surface_m",
          "integration_scheme": [
            {
+             "spatial_relation": "NEAREST",
              "out": {
                "name": "surface_m",
+               "level": "COORDINATES3D"
              },
+             "in": {
+               "name": "shadow_surface_m",
+               "level": "COORDINATES3D"
+             },
+             "operation": "NONE",
+             "abstract": true
            }
          ]
        },
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
        },
        {
          "id": "buildings_m",
          "integration_scheme": [
            {
+             "spatial_relation": "NEAREST",
              "out": {
                "name": "buildings_m",
+               "level": "COORDINATES3D"
              },
+             "in": {
+               "name": "shadow_m",
+               "level": "COORDINATES3D"
+             },
+             "operation": "NONE",
+             "abstract": true
            }
          ]
        }
      ],
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```

</details>

You should see the following:

![UTK example](../images/what-if-4.png?raw=true)

## Step 5: Operating with knots

UTk enables defining operations between knots, allowing us to highlight differences between the two shadow simulation scenarios loaded in Step 3. These operations are defined by a third knot, which stores the result of the computation. To implement this, several modifications to the code are required:

- Knots storing operation results must include two special fields:
  - knotOp – Indicates that a knot operation is being performed.
  - op – Specifies the arithmetic operation applied to the knots.
  - Note: In this case, both in and out refer to knots rather than layers.
- Adding a colorMap field to apply a d3 blue color scale, enhancing visibility of differences.
- Removing references to the original buildings and surface knots from the map, as they are now being rendered through the knot operation results.
- Updating the output layer of the buildings knot to "buildings_m" instead of "buildings". This change ensures that the operated knots maintain the same number of elements, which is necessary for the operation to be valid.

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
+           "whatIfSurface",
+           "whatIfBuildings"
-           "surface",
-           "surface_m",
-           "buildings",
-           "buildings_m"
          ],
          "interactions": [
            ...
-           "NONE",
-           "NONE"
          ]
      },
      "plots": [],
      "knots": [
        ...
        {
          "id": "buildings",
          "integration_scheme": [
            {
              "spatial_relation": "NEAREST",
              "out": {
+               "name": "buildings_m",
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
        },
+       {
+         "id": "whatIfSurface",
+         "knotOp": true,
+         "colorMap": "interpolateBlues",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "surface_m",
+               "level": "COORDINATES3D"
+             },
+             "in": {
+               "name": "surface",
+               "level": "COORDINATES3D"
+             },
+             "op": "surface - surface_m",
+             "operation": "NONE"
+           }
+         ]
+       },
+       {
+         "id": "whatIfBuildings",
+         "knotOp": true,
+         "colorMap": "interpolateBlues",
+         "integration_scheme": [
+           {
+             "out": {
+               "name": "buildings_m",
+               "level": "COORDINATES3D"
+             },
+             "in": {
+               "name": "buildings",
+               "level": "COORDINATES3D"
+             },
+             "op": "buildings - buildings_m",
+             "operation": "NONE"
+           }
+         ]
+       }
      ],
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```

</details>

You should see the following:

![UTK example](../images/what-if-5.png?raw=true)

## Step 6: Adding embedded distribution plot

To enhance the analytical capabilities of our system, UTk supports the use of customized Vega-Lite plots. To facilitate comparison between the two shadow scenarios, we will create a distribution plot embedded on the surface of buildings. While we are using standard Vega-Lite, UTk allows us to reference knots within the specification using specific keywords.

Each plot consists of four key components:
- Plot: The Vega specification.
- Knots: The IDs of the knots used in the plot.
- Arrangement: Defines the plot’s placement. In this case, we set it to "SUR_EMBEDDED" rather than "FOOT_EMBEDDED" or "LINKED", ensuring the plots appear on the building surface.
- Interaction: Defines user interactions.

To access knot data within the Vega specification, the format "knotId_keyword" is used, where the keyword can be:
- "abstract" – Represents thematic data.
- "index" – Refers to an element's index within the knot.
- "highlight" – A boolean indicating whether an element is highlighted.

In Step 3, we configured the "buildings" and "buildings_m" knots to support "BRUSHING" interaction. This allows users to select an area for embedding the visualization using:
- "Alt + Left-click + Drag" to choose a region.
- "Enter" to confirm the selection, setting the "buildings_highlight" variable to true for the selected points.
- "Right-click" to deselect a section.
- "R" to remove all embedded plots.

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
      "plots": [
+       {
+         "plot": {
+           "title": {
+             "text": "Distribution of shadows over facade",
+             "fontSize": 18
+           },
+           "hconcat": [
+             {
+               "mark": "bar",
+               "encoding": {
+                 "x": {
+                   "bin": {"extent": [0,1]},
+                   "field": "buildings_abstract",
+                   "axis": {
+                     "title": "Shadow distribution (before)",
+                     "titleFontSize": 16,
+                     "labelFontSize": 16
+                   }
+                 },
+                 "y": {
+                   "aggregate": "count",
+                   "axis": {
+                     "title": "No. data points",
+                     "titleFontSize": 16,
+                     "labelFontSize": 16
+                 }
+               }
+             }
+           },
+           {
+             "mark": "bar",
+             "encoding": {
+               "x": {
+                 "bin": {"extent": [0,1]},
+                 "field": "buildings_m_abstract",
+                 "axis": {
+                   "title": "Shadow distribution (after)",
+                   "titleFontSize": 16,
+                   "labelFontSize": 16
+                 }
+               },
+               "y": {
+                 "aggregate": "count",
+                 "axis": {
+                   "title": "No. data points",
+                   "titleFontSize": 16,
+                   "labelFontSize": 16
+                 }
+               }
+             }
+           }
+         ]
+       },
+         "knots": [
+           "buildings",
+           "buildings_m"
+         ],
+         "arrangement": "SUR_EMBEDDED"
+       }
      ],
      "knots": [
        ...
      ],
      "position": {...}
    },
    {
      "type": "GRAMMAR",
      "position": {...}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{...}
    }
  ],
  "arrangement": "LINKED",
  "grid": {...}
}
```

</details>

You should see the following:

![UTK example](../images/what-if-6.png?raw=true)

## Fina specification

<details>
<summary>UTK specification (click to expand)</summary>

</details>
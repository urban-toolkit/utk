# Example: Exploring multiple datasets

This example illustrates how UTK can be used to aggregate and visualize multiple datasets considering the ZIP code boundaries of Manhattan (NYC).

Before you begin, please familiarize yourself with UTK's main concepts and functionalities by reading our [usage guide](../USAGE.md).

The data for this tutorial can be found [here](https://drive.google.com/drive/folders/179RYmhPGNvd_kiLLg6AWIM-5wVciyLGr?usp=sharing).

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
+         "knots": ["purewater"],
+         "interactions": ["NONE"]
      },
      "plots": [],
      "knots": [
+       {
+         "id": "pureWater",
+         "integration_scheme": [{"out": {"name": "water", "level": "OBJECTS"}}]
+       },
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

![UTK example](../images/data-1.png?raw=true)

## Step 2: Adding a park layer

Just as we did in Step 1, we are going to define and render parks as well:

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
+         "knots": [... "pureparks"],
+         "interactions": [... "NONE"]
      },
      "plots": [],
      "knots": [
        ...
+       {
+         "id": "pureParks",
+         "integration_scheme": [{"out": {"name": "parks", "level": "OBJECTS"}}]
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

![UTK example](../images/data-2.png?raw=true)

## Step 3: Aggregating noise complaints by ZIP code

For our first thematic data layer, we will load the NYC311 noise complaints dataset. Each data point represents a noise complaint, geolocated by latitude and longitude. Given the presence of a physical layer that defines zip code boundaries, we can establish a knot that aggregates complaints by zip code and colors them based on data point concentration. To achieve this, the following modifications are required:

1. A knot defining a `spatial_relation` of type "CONTAINS", ensuring that noise complaint data points (at the "COORDINATES" level) are grouped by zip code boundaries (at the "OBJECTS" level).
2. An operation specifying how to aggregate the data points within each zip code (in this case, by counting them).
3. An abstract flag to indicate that this operation pertains to a thematic layer.
4. A "PICKING" interaction for the knot displayed on the map, which will be utilized in subsequent steps.

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [... "noiseToZip"],
          "interactions": [... "PICKING"]
      },
      "plots": [],
      "knots": [
        ...
+       {
+         "id": "noiseToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "noise", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
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

![UTK example](../images/data-3.png?raw=true)

## Step 4:

We will repeat the process from Step 3 to load additional datasets, including taxi activity, crime incidents, restaurants, subways, schools, sky exposure, and park distribution, aggregating them by ZIP code. The process remains largely the same, with one key difference: these knots will not be rendered on the map. Since the map can display only one color scale at a time, we chose to visualize the noise data in the previous step. As a result, no visual changes will appear on the map in this step. Instead, the additional datasets will be used to populate a 2D plot.

<details>
<summary>UTK specification (click to expand)</summary>

```diff
{
  "components": [
    {
      "map": {
        "camera": {...},
          "knots": [...],
          "interactions": [...]
      },
      "plots": [],
      "knots": [
        ...
+       {
+         "id": "taxiPickupToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "taxi_pickup", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "crimeToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "crime", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "restaurantsToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "restaurants", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "subwayToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "subway", "level": "COORDINATES"},
+             "out": {"name": "zip","level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "schoolToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "school","level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "skyToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "sky", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "AVG",
+             "abstract": true
+           }
+         ]
+       },
+       {
+         "id": "parksToZip",
+         "integration_scheme": [
+           {
+             "spatial_relation": "CONTAINS",
+             "in": {"name": "parks_abstract", "level": "COORDINATES"},
+             "out": {"name": "zip", "level": "OBJECTS"},
+             "operation": "COUNT",
+             "abstract": true
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
</details>
```

You should see the following:

![UTK example](../images/data-4.png?raw=true)

## Step 5:

UTk enables the creation of 2D plots using Vega-Lite, allowing them to be sourced from defined knots. Since we have multiple knots representing different dimensions aggregated by ZIP code, we will generate a parallel coordinates chart. This process follows standard Vega specifications, with the added capability of referencing knots directly using keywords within the specification.

Each plot consists of four key components:

- Plot: The Vega-Lite specification.
- Knots: The IDs of the knots used in the plot.
- Arrangement: Defines the plot’s placement. In our case, we set it to "LINKED" instead of "EMBEDDED", ensuring the plots appear on the screen.
- Interaction: Specifies user interactions. Here, we use "HOVER" to enable hover-based interactions.

To access knot data within the Vega specification, the format "knotId_keyword" is used. The available keywords are:

- "abstract" – Represents thematic data.
- "index" – Refers to the index of an element within the knot.
- "highlight" – A boolean indicating whether an element is highlighted.

In Step 3, we configured the ZIP + noise layer with a "PICKING" interaction, allowing users to highlight ZIP codes by pressing "t" while hovering over a specific ZIP code. This action sets "noiseToZip_highlight" to true for the corresponding object in the Vega specification. The interaction also works in reverse: since the parallel coordinates chart has a "HOVER" interaction, hovering over a ZIP code in the chart will highlight it accordingly.

```diff
<details>
<summary>UTK specification (click to expand)</summary>
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
+        {
+          "plot": {
+            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
+            "width": 600,
+            "height": 300,
+            "title": {
+              "text": "Datasets aggregated by zip code",
+              "fontSize": 18
+            },
+            "transform": [
+              {"window": [{"op": "count", "as": "index"}]},
+              {"fold": ["taxiPickupToZip_abstract", "noiseToZip_abstract", "crimeToZip_abstract", +"restaurantsToZip_abstract", "subwayToZip_abstract", "schoolToZip_abstract", +"skyToZip_abstract", "parksToZip_abstract"]},
+              {"joinaggregate": [{"op": "min", "field": "value", "as": "min"}, {"op": "max", "field": +"value", "as": "max"}], "groupby": ["key"]},
+              {"calculate": "(datum.value - datum.min) / (datum.max-datum.min)", "as": "norm_val"},
+              {"calculate": "(datum.min + datum.max) / 2", "as": "mid"},
+              {"calculate": "datum.key === 'taxiPickupToZip_abstract' ? 'Taxi' : datum.key === +'noiseToZip_abstract' ? 'Noise' : datum.key === 'crimeToZip_abstract' ? 'Crime' : datum.+key === 'restaurantsToZip_abstract' ? 'Food' : datum.key === 'subwayToZip_abstract' ? +'Subway' : datum.key === 'schoolToZip_abstract' ? 'School' : datum.key === +'skyToZip_abstract' ? 'Sky' : datum.key === 'parksToZip_abstract' ? 'Parks' : 'others'", +"as": "key"}
+            ],
+            "layer": [{"mark": {"type": "rule", "color": "#ccc"}, "encoding": {"detail": {"aggregate": +"count"}, "x": {"field": "key"}}}, {
+              "mark": "line",
+              "encoding": {
+                "detail": {"type": "nominal", "field": "index"},
+                "opacity": {"value": 0.8},
+                "x": {"type": "nominal", "field": "key"},
+                "y": {"type": "quantitative", "field": "norm_val", "axis": null},
+                "stroke": {"condition": [{"test": "datum['taxiPickupToZip_highlight'] == true", "value": +"#4a97ed"}], "value": "grey"}
+              }
+            }, {
+              "encoding": {"x": {"type": "nominal", "field": "key"}, "y": {"value": 0}},
+              "layer": [{
+                "mark": {"type": "text", "style": "label"},
+                "encoding": {"text": {"aggregate": "max", "field": "max"}}
+              }, {
+                "mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}
+              }]
+            }, {
+              "encoding": {
+                "x": {"type": "nominal", "field": "key"},
+                "y": {"value": 150}
+              },
+              "layer": [{
+                "mark": {"type": "text", "style": "label"},
+                "encoding": {"text": {"aggregate": "min", "field": "mid"}}
+              }, {"mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}}]
+            }, {
+              "encoding": {"x": {"type": "nominal", "field": "key"}, "y": {"value": 300}},
+              "layer": [{
+                "mark": {"type": "text", "style": "label"},
+                "encoding": {"text": {"aggregate": "min", "field": "min"}}
+              }, {"mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}}]
+            }],
+            "config": {
+              "axisX": {"domain": false, "labelAngle": 0, "tickColor": "#ccc", "title": null, +"labelFontSize": 16},
+              "view": {"stroke": null},
+              "style": {"label": {"baseline": "middle", "align": "right", "dx": -5}, "tick": {"orient": +"horizontal"}}
+            }
+          },
+          "knots": ["taxiPickupToZip", "noiseToZip", "crimeToZip", "restaurantsToZip", "subwayToZip", +"schoolToZip", "skyToZip", "parksToZip"],
+          "arrangement": "LINKED",
+          "interaction": "HOVER"
+        }
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

Finally, you should see the following:

![UTK example](../images/data-5.png?raw=true)

## Final specification

<details>
<summary>UTK specification (click to expand)</summary>

```json
{
  "components": [
    {
      "map": {
        "camera": {
          "position": [-8239611, 4941390.5, 2.019619873046875],
          "direction": {
            "right": [442.88140869140625, -1476.4549560546875, 2019.619873046875],
            "lookAt": [460.66815185546875, -850.698974609375, 1239.803955078125],
            "up": [0.022156884893774986, 0.77950119972229, 0.6260088086128235]
          }
        },
        "knots": ["pureWater", "pureParks", "noiseToZip"],
        "interactions": ["NONE", "NONE", "PICKING"]
      },
      "plots": [
        {
          "plot": {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": 600,
            "height": 300,
            "title": {
              "text": "Datasets aggregated by zip code",
              "fontSize": 18
            },
            "transform": [
              {"window": [{"op": "count", "as": "index"}]},
              {"fold": ["taxiPickupToZip_abstract", "noiseToZip_abstract", "crimeToZip_abstract", "restaurantsToZip_abstract", "subwayToZip_abstract", "schoolToZip_abstract", "skyToZip_abstract", "parksToZip_abstract"]},
              {"joinaggregate": [{"op": "min", "field": "value", "as": "min"}, {"op": "max", "field": "value", "as": "max"}], "groupby": ["key"]},
              {"calculate": "(datum.value - datum.min) / (datum.max-datum.min)", "as": "norm_val"},
              {"calculate": "(datum.min + datum.max) / 2", "as": "mid"},
              {"calculate": "datum.key === 'taxiPickupToZip_abstract' ? 'Taxi' : datum.key === 'noiseToZip_abstract' ? 'Noise' : datum.key === 'crimeToZip_abstract' ? 'Crime' : datum.key === 'restaurantsToZip_abstract' ? 'Food' : datum.key === 'subwayToZip_abstract' ? 'Subway' : datum.key === 'schoolToZip_abstract' ? 'School' : datum.key === 'skyToZip_abstract' ? 'Sky' : datum.key === 'parksToZip_abstract' ? 'Parks' : 'others'", "as": "key"}
            ],
            "layer": [{"mark": {"type": "rule", "color": "#ccc"}, "encoding": {"detail": {"aggregate": "count"}, "x": {"field": "key"}}}, {
              "mark": "line",
              "encoding": {
                "detail": {"type": "nominal", "field": "index"},
                "opacity": {"value": 0.8},
                "x": {"type": "nominal", "field": "key"},
                "y": {"type": "quantitative", "field": "norm_val", "axis": null},
                "stroke": {"condition": [{"test": "datum['taxiPickupToZip_highlight'] == true", "value": "#4a97ed"}], "value": "grey"}
              }
            }, {
              "encoding": {"x": {"type": "nominal", "field": "key"}, "y": {"value": 0}},
              "layer": [{
                "mark": {"type": "text", "style": "label"},
                "encoding": {"text": {"aggregate": "max", "field": "max"}}
              }, {
                "mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}
              }]
            }, {
              "encoding": {
                "x": {"type": "nominal", "field": "key"},
                "y": {"value": 150}
              },
              "layer": [{
                "mark": {"type": "text", "style": "label"},
                "encoding": {"text": {"aggregate": "min", "field": "mid"}}
              }, {"mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}}]
            }, {
              "encoding": {"x": {"type": "nominal", "field": "key"}, "y": {"value": 300}},
              "layer": [{
                "mark": {"type": "text", "style": "label"},
                "encoding": {"text": {"aggregate": "min", "field": "min"}}
              }, {"mark": {"type": "tick", "style": "tick", "size": 8, "color": "#ccc"}}]
            }],
            "config": {
              "axisX": {"domain": false, "labelAngle": 0, "tickColor": "#ccc", "title": null, "labelFontSize": 16},
              "view": {"stroke": null},
              "style": {"label": {"baseline": "middle", "align": "right", "dx": -5}, "tick": {"orient": "horizontal"}}
            }
          },
          "knots": ["taxiPickupToZip", "noiseToZip", "crimeToZip", "restaurantsToZip", "subwayToZip", "schoolToZip", "skyToZip", "parksToZip"],
          "arrangement": "LINKED",
          "interaction": "HOVER"
        }
      ],
      "knots": [
        {
          "id": "pureWater",
          "integration_scheme": [{"out": {"name": "water", "level": "OBJECTS"}}]
        },
        {
          "id": "pureParks",
          "integration_scheme": [{"out": {"name": "parks", "level": "OBJECTS"}}]
        },
        {
          "id": "noiseToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "noise", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "taxiPickupToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "taxi_pickup", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "crimeToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "crime", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "restaurantsToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "restaurants", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "subwayToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "subway", "level": "COORDINATES"},
              "out": {"name": "zip","level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "schoolToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "school","level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        },
        {
          "id": "skyToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "sky", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "AVG",
              "abstract": true
            }
          ]
        },
        {
          "id": "parksToZip",
          "integration_scheme": [
            {
              "spatial_relation": "CONTAINS",
              "in": {"name": "parks_abstract", "level": "COORDINATES"},
              "out": {"name": "zip", "level": "OBJECTS"},
              "operation": "COUNT",
              "abstract": true
            }
          ]
        }
      ],
      "position": {"width": [6,12], "height": [1,5]}
    },
    {
      "type": "GRAMMAR",
      "position": {"width": [1,5], "height": [3,5]}
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position": {"width": [1,5], "height": [1,2]}
    }
  ],
  "arrangement": "LINKED",
  "grid": {"width": 12, "height": 5}
}
```
</details>


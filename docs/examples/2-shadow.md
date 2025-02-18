# Example: Shadows in Downtown Manhattan

This example visualizes shadow data on a highly dense region of New York City. We also define an embedded plot to help us get a quick overview of the data.

Before you begin, please familiarize yourself with UTK's main concepts and functionalities by reading our [usage guide](../USAGE.md).

This example follows our [quick start](../QUICK-START.md), with Steps 1-6 remaining largely unchanged.

## Step 7: Adding an embedded radial plot

To enhance the analytical capabilities of our system, UTk supports the use of customized Vega-Lite plots. To address occlusion issues and reduce navigation complexity, we will incorporate an embedded radial plot into the system. This approach follows standard Vega-Lite specifications, with the added ability to reference knots using keywords within the specification.

Each plot consists of four key components:
- Plot: The Vega specification.
- Knots: The IDs of the knots used in the plot.
- Arrangement: Determines where the plot is positioned. In this case, we set it to "FOOT_EMBEDDED" rather than "SUR_EMBEDDED" or "LINKED", ensuring that the plots align with the building footprints.
Interaction: Defines user interactions.

To access knot data within the Vega-Lite specification, the format "knotId_keyword" is used. The available keywords include:

- "abstract" – Represents thematic data.
- "index" – Refers to an element's index within the knot.
- "highlight" – A boolean indicating whether an element is highlighted.

To enable users to select buildings for embedding visualizations, we need to modify the interactions to include "PICKING". This will allow users to press "t" while hovering over a specific building, setting "buildings_highlight" to true in the Vega-Lite specification.

Additionally, users can adjust the plot's height using the "Alt + Mouse Wheel" combination.


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
+           "buildings"
          ],
          "interactions": [
            ...
+           "PICKING"
          ]
      },
      "plots": [
+       {
+         "plot": {
+           "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
+           "background": "rgb(0,255,0)",
+           "mark": {
+             "type": "arc",
+             "stroke": "black",
+             "strokeWidth": 5
+           },
+           "encoding": {
+               "theta": {
+               "field": "bin",
+               "type": "nominal",
+               "legend": null
+             },
+             "color": {
+               "field": "buildings_abstract",
+               "type": "quantitative",
+               "aggregate": "mean",
+               "legend": null,
+               "scale": {
+                 "scheme": [
+                   "white",
+                   "white",
+                   "blue"
+                 ]
+               }
+             }
+           }
+         },
+         "knots": [
+           "buildings"
+         ],
+         "arrangement": "FOOT_EMBEDDED",
+         "args": {
+           "bins": 32
+         }
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

You should see the following:

![UTK example](../images/shadow-1.png?raw=true)

<details>

## Final specification

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
          "pureroads",
          "buildings"
        ],
        "interactions": [
          "NONE",
          "NONE",
          "PICKING"
        ]
      },
      "plots": [
        {
          "plot": {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "background": "rgb(0,255,0)",
            "mark": {
              "type": "arc",
              "stroke": "black",
              "strokeWidth": 5
            },
            "encoding": {
                "theta": {
                "field": "bin",
                "type": "nominal",
                "legend": null
              },
              "color": {
                "field": "buildings_abstract",
                "type": "quantitative",
                "aggregate": "mean",
                "legend": null,
                "scale": {
                  "scheme": [
                    "white",
                    "white",
                    "blue"
                  ]
                }
              }
            }
          },
          "knots": [
            "buildings"
          ],
          "arrangement": "FOOT_EMBEDDED",
          "args": {
            "bins": 32
          }
        }
      ],
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
      "position": {
        "width": [
          6,
          12
        ],
        "height": [
          1,
          5
        ]
      }
    },
    {
      "type": "GRAMMAR",
      "position": {
        "width": [
          1,
          5
        ],
        "height": [
          3,
          4
        ]
      }
    },
    {
      "type": "TOGGLE_KNOT",
      "map_id": 0,
      "position":{
        "width": [
          1,
          5
        ],
        "height": [
          1,
          2
        ]
      }
    }
  ],
  "arrangement": "LINKED",
  "grid": {
    "width": 12,
    "height": 4
  }
}
```

</details>


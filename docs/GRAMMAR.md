# UTK grammar

## Table of contents
- [Overview](#overview)
- [Grid](#grid)
  - [Grammar editor](#grammar-editor)
- [Components](#components)
  - [Map](#map)
  - [Knots](#knots)
    - [Integration scheme](#integration-scheme)
    - [Layers](#layers)
    - [Map configuration](#map-configuration)
    - [Operations between knots](#operations-between-knots)
  - [Plots](#plots)
  - [Widgets](#widgets)
  - [Other resources](#other-resources)
    - [Groupping knots](#groupping-knots)
    - [Multiple resolutions](#multiple-resolutions)
    


## Overview

The Urban Toolkit (UTk) is built around a grammar designed for urban visual analytics, providing a flexible and reproducible approach. This document outlines each functionality supported by the grammar.

The grammar is defined through a JSON file with two fundamental fields:
- `grid`: Specifies how the dashboard layout is structured to position components.
- `components`: Defines the elements composing the dashboard.

## Grid

`grid := (width, height)`  

The grid system defines how the screen is divided to position components.

```js
grid:{
    width: 12,
    height: 4
}
```

In this example, the screen is divided into 12 horizontal sections and 4 vertical sections.

### Grammar editor

Using the grid system, we can specify where the grammar editor will be rendered.

```js
grammar_position:{
    width: [1,5],
    height: [1,4]
}
```

Here, the editor occupies columns 1 through 5 and row 4.

## Components

There are two types of components: map and widgets. 

### Map

`map_view := (map, plots+, knot+, widget+, position)`  

A map component consists of four key elements:
- `map`: Contains basic map configurations.
- `plots`: Defines Vega-Lite visualizations.
- `knots`: Specifies how data is loaded and linked.
- `widgets`: Defines sidebar elements for user interaction.

The position of the map is specified in the `position` field. In the example below, the map occupies columns 6–12 horizontally and rows 1–4 vertically.

```js
{
    map: {...},
    plots: [...],
    knots: [...],
    widgets: [...],
    position: {
        width: [6, 12],
        height: [1, 4]
    }
}
```

### Knots

`knot := (id, group?, knotOp?, colorMap?, integration_scheme+)`

All data in the grammar follows the knot format, defining how data is linked and ensuring uniformity.

Knots are specified within the knots field inside the map component. Each knot includes:
- `id`: A unique identifier referenced throughout the grammar.
- `integration_scheme`: A pipeline that links thematic data to a physical layer. I.e., `integration_scheme` specifies a pipeline that starts with thematic data and ends with a physical layer.

```js
{
    id: "knot1",
    integration_scheme: [...]
}
```

#### Integration scheme

`integration_scheme := (spatial_relation?, out, in?, operation, abstract?, op?, maxDistance?, defaultValue?)`  

`spatial_relation := INTERSECTS | CONTAINS | WITHIN | TOUCHES | CROSSES | OVERLAPS | NEAREST | DIRECT`  

`operation := (aggregation | *Custom function*)`  

`aggregation := MAX | MIN | AVG | SUM | COUNT | NONE | DISCARD`  

The integration scheme describes how data is linked to form a knot. It consists of a series of steps (or links) that must begin with a thematic layer and end in a physical layer, except for pure knots.

Each step in the scheme is composed of `spatial_relation`, `in`, `out`, `operation`, `abstract`:

1. First step
    - Thematic layer (`in`) is fed into the pipeline.
    - `spatial_relation` links it to a physical layer (`out`) via a spatial join.
    - Since multiple data points may map to the same physical element, `operation` defines how data is aggregated.
    - If `in` contains a thematic layer, it must be marked as `abstract: true`.
2. Subsequent steps:
    - The `out` of the previous step must match the `in` of the next step.
    - Both `in` and `out` must be physical layers, but the join attribute is always thematic data.
    - Even though `in` and `out` are physical layers, the attribute of every join is the thematic data. The position of the data is determined by the physical layers.
    - These steps effectively shape the thematic data, with the final `out` representing the final shape.
3. A pure knot has no thematic data and consists of a single step that only includes an `out` field.

Example of an integration schema:

```js
    {
        id: "shadowBuildingsAvgSouth",
        integration_scheme: [
            {
                spatial_relation: "NEAREST",
                in: {
                    name: "shadow",
                    level: "COORDINATES3D"
                },
                out: {
                    name: "buildings",
                    level: "COORDINATES3D"
                },
                operation: "NONE",
                abstract: true
            },
            {
                spatial_relation: "INNERAGG",
                in: {
                    name: "buildings",
                    level: "COORDINATES3D"
                },
                out: {
                    name: "buildings",
                    level: "OBJECTS"
                },
                operation: "AVG",
                abstract: false
            }
        ]
    }
```

#### Layers

`layer := (name, level)`

`level := (COORDINATES | COORDINATES3D | OBJECTS)`

Layers define how data is loaded into the grammar. They are used as inputs (`in`) and outputs (`out`) in knots.

Defining a layer is the first step to load data inside the grammar. Layers are used to feed the knots (`in` and `out`). A layer is composed by a `name` and a `level`:

- `name`: Points to the name of the `.json` that defines the layer.
- `level`: Indicates the geometry level to use when applying a spatial join the involves the layer. For physical layers, geometry levels can be `COORDINATES`, `COORDINATES3D` or `OBJECTS` and for thematic layers `COORDINATES` and `COORDINATES3D`. The coordinates levels will consider the individual points of a physical layer and the objects level the whole shape.  



```js
{
    name: "layer1",
    level: "COORDINATES"
}
```

#### Map configuration

`map := (camera, knots, interactions)`

`camera := (position, direction)`

`direction := (right, lookAt, up)`

`interactions := (BRUSHING, PICKING, NONE)`

To configure the map component, three key elements must be defined:
- `camera`: composed of `position` (origin of the camera), `right`, `lookAt` and `up` that define the camera `direction`.  
- `knots`: References the ids of knots defined earlier. 
- `interactions`: For each knot, an `interactions` should be defined added. Specifies user interactions with the map. Supported types include:
  - `BRUSHING`: Enables selection by brushing over elements.
  - `PICKING`: Allows selecting elements by clicking.
  - `NONE`: No interactions.

Example:

```js
    map: {
        camera: {
            position: [
                -8239611,
                4941390.5,
                0.49792965698242186
            ],
            direction: {
                right: [
                    946.6354370117188,
                    -423.0624084472656,
                    497.9296569824219
                ],
                lookAt: [
                    962.3882446289062,
                    351.6265563964844,
                    -134.21630859375
                ],
                up: [
                    0.012851359322667122,
                    0.6320154070854187,
                    0.7748492360115051
                ]
            }
        },
        knots: [
            "pureparks",
            "purewater",
            "pureroads",
            "shadowToBuildings"
        ],
        interactions: [
            "NONE",
            "NONE",
            "NONE",
            "NONE"
        ]
    }
```


#### Operations between knots

Operations can be performed between knots by setting the `knotOp` field to true. In this case:
- The name fields in in and out will reference knot IDs instead of layers.
- An `op` field must be specified to define the arithmetic operation applied between the knots.
- Within each link of the `integration_scheme`, the `op` field can:
  - Reference the ID of another knot in the link.
  - Use the keyword `prevResult` to retrieve the result of the previous operation in the sequence.

Example:

```js
    {
        id: "shadowToSurface",
        integration_scheme: [
            {
                spatial_relation: "NEAREST",
                out: {
                    name: "surface",
                    level: "COORDINATES3D"
                },
                in: {
                    name: "shadow0_surface",
                    level: "COORDINATES3D"
                },
                abstract: true,
                operation: "NONE"
            }
        ]
    },
    {
        id: "shadowToSurfaceM",
        integration_scheme: [
            {
                spatial_relation: "NEAREST",
                out: {
                    name: "surface",
                    level: "COORDINATES3D"
                },
                in: {
                    name: "shadow0_surface_m",
                    level: "COORDINATES3D"
                },
                abstract: true,
                operation: "NONE"
            }
        ]
    },
    {
        id: "whatIfSurface",
        knotOp: true,
        colorMap: "interpolateBlues",
        integration_scheme: [
            {
                out: {
                    name: "shadowToSurfaceM",
                    level: "COORDINATES3D"
                },
                in: {
                    name: "shadowToSurface",
                    level: "COORDINATES3D"
                },
                op: "shadowToSurface - shadowToSurfaceM",
                operation: "NONE"
            }
        ]
    },
```

### Plots (map)
<!--- Plots will probably be detached from the map -->

`plots := (name?, plot, knot+, arrangement, interaction?, args?)`

`args := (bins?)`

`arrangement := (INTERSECTS | CONTAINS | WITHIN | TOUCHES | CROSSES | OVERLAPS | NEAREST | DIRECT | INNERAGG)`

`interaction := (CLICK | HOVER | BRUSH)`

Plots are specified using Vega-Lite, a grammar-based visualization toolkit. The data for these plots is sourced from the knots defined in the grammar.

The `plot` field contains the Vega-Lite specification, with the key difference that users should not specify a data field. Instead, they should reference knot information using the following keywords:

- `_abstract`: Represents the thematic data of the knot.
- `_index`: Refers to the index of a data element within the knot.
- `highlight`: A boolean indicating whether the element has been interacted with.

The `knots` field should contain a list of knots ids that feed the plot.  

The `arrangement` defines how the plot should be displayed. Possible values are:
- `FOOT_EMBEDDED`: The plot is embedded inside a building, following its footprint. Should be used with the `PICKING` interaction on the map.
- `SUR_EMBEDDED`: The plot is embedded on the surface of the building.
- `LINKED`: The plot appears on the screen surface rather than on a physical element.

`args` contains additional parameters used for specific plot types. Currently, binning is supported only for `FOOT_EMBEDDED` plots via the bins argument.

Example:

```js
plots: [
    {
        plot: {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            mark: "arc",
            background: "white",
            encoding: {
                theta: {
                    field: "bin",
                    type: "nominal",
                    legend: null
                },
                color: {
                    field: "shadowToBuildings_abstract",
                    type: "quantitative",
                    aggregate: "mean",
                    legend: null,
                    scale: {
                        scheme: "reds"
                    }
                }
            }
        },
        knots: [
            "shadowToBuildings"
        ],
        arrangement: "FOOT_EMBEDDED",
        args: {
            bins: 32
        }
    }
]
```

### Widgets

`widget := (type, args?)`  

`args := (categories+)`

`categories := (category_name, elements+)`  

`elements := (string | categories)`

Widgets provide additional functionalities linked to the map, enhancing data manipulation, navigation, and exploration. The `type` can be:
- `TOGGLE_KNOT`: Enables toggling layers and animating them.
- `SEARCH`: Provides a search bar for navigating the map.

The `categories` field applies only to the `TOGGLE_KNOT` widget, allowing the definition of a hierarchical structure for organizing layers.

Example:

```js
    {
        map: {...},
        plots: [...],
        knots: [...],
        widgets: [
            {
                type: "TOGGLE_KNOT",
                args: {
                    categories: [
                        {
                            category_name: "cat1",
                            elements: [
                                "element1",
                                {
                                    category_name: "cat1.1",
                                    elements: [
                                        "element2",
                                        "element3"
                                    ]
                                }
                            ]
                        }
                    ]
                }
            },
            {
                type: "SEARCH"
            }
        ],
        position: {
            width: [
                6,
                12
            ],
            height: [
                1,
                4
            ]
        }
    }
```

### Other resources

#### Groupping knots

`group := (group_name, position)`

Knots can be grouped by assigning a group name and specifying their position within the group. This grouping is primarily intended for data with different timesteps.

When grouped knots are used with the `TOGGLE_KNOTS` widget, an animation bar becomes available, allowing users to seamlessly switch between frames.

Example:

```js
knots: [
    {
        id: "wrfToSurface_d02_2016-07-01_t0",
        group: {
            group_name: "wrf",
            position: 0 
        },
        integration_scheme: [
            {
                spatial_relation: "NEAREST",
                out: {
                    name: "surface_wrf_d02_2016-07-01_t0",
                    level: "COORDINATES"
                },
                in: {
                    name: "wrf_d02_2016-07-01_t0",
                    level: "COORDINATES"
                },
                operation: "NONE",
                abstract: true
            }
        ]
    },
    {
        id: "wrfToSurface_d02_2016-07-01_t1",
        group: {
            group_name: "wrf",
            position: 0 
        },
        integration_scheme: [
            {
                spatial_relation: "NEAREST",
                out: {
                    name: "surface_wrf_d02_2016-07-01_t1",
                    level: "COORDINATES"
                },
                in: {
                    name: "wrf_d02_2016-07-01_t1",
                    level: "COORDINATES"
                },
                operation: "NONE",
                abstract: true
            }
        ]
    }
]
```

#### Multiple resolutions

`knotVisibility := (knot, test)`

A zoom level can be defined to control a knot's visibility, enabling smooth transitions between resolutions. This is managed through the `knotVisibility` field within the map component.

Each entry specifies a knot and a visibility condition, determining when the knot should be displayed based on the zoom level.

Example:

```js
map: {
    camera: {...},
    knots: [
        "knot1",
        "knot2"
    ],
    interactions: [...],
    knotVisibility: [
        {
            knot: "knot1",
            test: "zoom <= 500"
        },
        {
            knot: "knot2",  
            test: "zoom > 500"
        }
    ]
}
```

Variables available in the `test` field:
- `zoom`: Stores the current zoom level of the visualization
- `timeElapsed`: Stores the time, in milliseconds, elapsed since the last time the grammar was validated

The `timeElapsed` variable can be used to compose animations:

```js
knots: [
    {
        condition: [
            {test: "(timeElapsed/1000)%5 <= 1", value: "frame1"},
            {test: "(timeElapsed/1000)%5 <= 2", value: "frame2"},
            {test: "(timeElapsed/1000)%5 <= 3", value: "frame3"},
            {test: "(timeElapsed/1000)%5 <= 4", value: "frame4"},
            {test: "(timeElapsed/1000)%5 <= 5", value: "frame5"}
            {value: "defaultFrame"}
        ]
    }, 
    "buildings"
]

map: [
    camera: {...},
    knots: [
        "frame1",
        "frame2",
        "frame3",
        "frame4",
        "frame5"
    ],
    interactions: [...],
    knotVisibility: [
        {
            knot: "frame1",
            test: "(timeElapsed/1000)%5 <= 1"
        },
        {
            knot: "frame2",  
            test: "(timeElapsed/1000)%5 > 1 && (timeElapsed/1000)%5 <= 2"
        },
        {
            knot: "frame3",  
            test: "(timeElapsed/1000)%5 > 2 && (timeElapsed/1000)%5 <= 3"
        },
        {
            knot: "frame4",  
            test: "(timeElapsed/1000)%5 > 3 && (timeElapsed/1000)%5 <= 4"
        },
        {
            knot: "frame5",  
            test: "(timeElapsed/1000)%5 > 4 && (timeElapsed/1000)%5 <= 5"
        }
    ]
]
```
The example above is an animation that loops through all frames every 5 seconds.


<!--- Not sure if it is worth to support it.

### Condition block (not supported yet)

The user can define a condition block inside almost any field in the grammar specification. The interpreter will replace the block with the end-result of the conditionals.

Example:  

```js
knots: [
    {
        condition: [
            {test: "zoom < 5.0", value: "wrfToSurface_d03_2016-07-01_t0"},
            {value: "wrfToSurface_d02_2016-07-01_t0"}
        ]
    }, 
    "buildings"
]
```

Variables available in the *test* field:
- *zoom*: stores the current zoom level of the visualization
- *timeElapsed*: stores the time, in milliseconds, elapsed since the last time the grammar was validated

The *timeElapsed* variable can be used to compose animations:
```js
knots: [
    {
        condition: [
            {test: "(timeElapsed/1000)%5 <= 1", value: "frame1"},
            {test: "(timeElapsed/1000)%5 <= 2", value: "frame2"},
            {test: "(timeElapsed/1000)%5 <= 3", value: "frame3"},
            {test: "(timeElapsed/1000)%5 <= 4", value: "frame4"},
            {test: "(timeElapsed/1000)%5 <= 5", value: "frame5"}
            {value: "defaultFrame"}
        ]
    }, 
    "buildings"
]
```
The example above is an animation that loop through all frames every 5 seconds.  

PS: This is a more generic and powerful approach to the knots visibility feature.  
-->

<!---

### Categorizing knots

The notion of categories is related to the idea of how knots (or groups of knots) can be labelled in a hierarchical manner. For instance, a knot with income data can be categorized as "Socio-demographics". In reality, the semantics is completely defined by the user. Moreover, categories can be nested.

```js
{
    type: "TOGGLE_KNOT",
    title: "WRF and Demographic data",
    subtitle: "Income and temperature in multiscale",
    map_id: 0,
    categories: [
        {
            category_name: "Socio-demographic",
            elements: [
                {
                    category_name: "Economic",
                    elements: [
                        "income"
                    ]
                },
                "population"
            ]
        },
        {
            category_name: "map",
            elements: [
                "park",
                "water",
                "roads"
            ]
        }
    ],
    position:{
        width: [1,3],
        height: [1,1]
    }
}
```

The result of the categories defined above is:  
- Socio-demographic (category)
    - Economic (category)
        - income (knot)
    - population (knot)
- map (category)
    - park (knot)
    - water (knot)
    - roads (knot)

-->

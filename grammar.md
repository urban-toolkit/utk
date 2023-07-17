# grammar

The Urban Toolkit is built around the idea of a grammar for urban visual analytics. The grammar allows for a flexible and reproducible approach. This document presents the description of each functionality supported by the grammar.   

The grammar is defined through a `.json` file that has two fundamental fields `components` and `grid`. The `components` define the elements that will compose the dashboard. The `grid` defines how the dashboard will be divided so the `components` can be positioned.

### Grid System

`grid := (width, height)`  

The grid system specify how the screen should be divided so the `components` can be positioned. 

```js
grid:{
    width: 12,
    height: 4
}
```

In this example the screen is divided in 12 sections horizontally and 4 sections vertically.

### Grammar editor

By using the grid system it is possible to define where the grammar editor will be rendered.

```js
grammar_position:{
    width: [1,5],
    height: [1,4]
}
```

In the previous example the editor is occupying columns 1 through 5 and line 4.

### Components

There are two types of components: map and widgets. 

### Map

`map_view := (map, plots+, knot+, widget+, position)`  

The map components needs four basic elements `map`, `plots`, `knots` and `widgets`. The `map` contains basic configurations of the map itself, the `plots` contains Vega-Lite specifications of the plots to be used, `knots` defines how data will be loaded and linked and `widgets` define what widgets will appear as a side bar inside the map. A more detailed description of each of the fields can be found in the following sections.  

The map is positioned following what is specified in the `position` field. In the example below, the map will occupy columns 6 to 12 horizontally and rows 1 to 4 vertically.

```js
{
    map: {...},
    plots: [...],
    knots: [...],
    widgets: [...],
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

### Knots (Map)

`knot := (id, group?, knotOp?, colorMap?, integration_scheme+)`

All data inside the grammar is in the knots format. It defines how the data will be linked and creates a uniform format for the data.  

Knots must be defined in the `knots` field inside the map component. Each knot is composed of `id` and `integration_scheme` fields. The `id` field identifies the the knot and is used throughout the grammar to reference it. On the other hand, the `integration_scheme` specifies a pipeline of links that starts with thematic data and ends in a physical layer. More information about `integration_scheme` can be found in the following sections.  

```js
{
    id: "knot1",
    integration_scheme: [...]
}
```

### Integration Scheme

`integration_scheme := (spatial_relation?, out, in?, operation, abstract?, op?, maxDistance?, defaultValue?)`  

`spatial_relation := INTERSECTS | CONTAINS | WITHIN | TOUCHES | CROSSES | OVERLAPS | NEAREST | DIRECT`  

`operation := (aggregation | *Custom function*)`  

`aggregation := MAX | MIN | AVG | SUM | COUNT | NONE | DISCARD`  

Integration scheme is a pipeline that describes how data is linked to form a knot. It is formed by a series of steps (or links) that must start with a thematic layer and end in a physical layer. The only exception to this rules are the pure knots.   

Each step in the scheme is composed by `spatial_relation`, `in`, `out`, `operation`, `abstract`.   

- First step  

A thematic layer is fed into the pipeline (`in`) and by using `spatial_relation` that data is attached to a physical layer (`out`) through a spatial join. Since more than one data point can be attached to the same physical element `operation` specifies the aggregation. If `in` contains a thematic layer that should be indicated (`abstract`).  

- Next steps  
 
The `out` of the previous step has to be equal to the `in` of the current one and both need to be physical layers. A `spatial_relation` indicates how data should be joined and `operation` how it should aggregated. However, it is important to notice that even though `in` and `out` are physical layers, the attribute of every join is the thematic data, but the position of the data is determined by the physical layers. It is possible to understand each link as shaping the thematic data and the last `out` is the final shape.  

- Pure knot  

A knot that does not have thematic data is called a pure knot. All pure knots have only one link (or step) that only has an `out` field.   

Details about `in` and `out` will be defined in the following sections.  

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

### Layers

`layer := (name, level)`

`level := (COORDINATES | COORDINATES3D | OBJECTS)`

Defining a layer is the first step to load data inside the grammar. Layers are used to feed the knots (`in` and `out`). A layer is composed by a `name` and a `level`.   

The level indicates the geometry level to use when applying a spatial join the involves the layer. For physical layers geometry levels can be `COORDINATES`, `COORDINATES3D` or `OBJECTS` and for thematic layers `COORDINATES` and `COORDINATES3D`. The coordinates levels will consider the individual points of a physical layer and the objects level the whole shape.  

The `name` points to the name of the `.json` that defines the layer.

```js
{
    name: "layer1",
    level: "COORDINATES"
}
```

### Map configuration

`map := (camera, knots, interactions)`

`camera := (position, direction)`

`direction := (right, lookAt, up)`

`interactions := (BRUSHING, PICKING, NONE)`

In order to configure the map component it is necessary to define `camera`, `knots` and `interactions`.  

The `camera` is composed by `position` (origin of the camera), `right`, `lookAt` and `up` that define the camera `direction`.  

The `knots` reference the ids of knots earlier defined and for each knot an `interactions` is added.

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

### Plots (Map)
<!--- Plots will probably be detached from the map -->

`plots := (name?, plot, knot+, arrangement, interaction?, args?)`

`args := (bins?)`

`arrangement := (INTERSECTS | CONTAINS | WITHIN | TOUCHES | CROSSES | OVERLAPS | NEAREST | DIRECT | INNERAGG)`

`interaction := (CLICK | HOVER | BRUSH)`

Plots are specified through the usage of another grammar-based visualization tool called Vega-Lite. To the vega-lite specification is injected the data defined through the knots.   

The `plot` field contains the vega-lite specification, with the only difference being that the user should not specify a `data` field and should make reference to knot information by using the keywords `_abstract`, `_index` and `_highlight` after the id of the knot. `_abstract` is a reference to the thematic data of the knot, `_index` is a reference to the index of the data element and `_highlight` is a boolean that indicates if the element was interacted with.    

The `knots` field should contain a list of knots ids that feed the plot.  

The `arrangement` defines how the plot should be displayed. Possible values are:
- `FOOT_EMBEDDED`: the plot is embedded inside building following the footprint. Should be used together with the `PICKING` interaction on the map.  
- `SUR_EMBEDDED`: the plot is embedded on the surface of the building.  
- `LINKED`: the plot appears on the surface of the screen.  

The `args` are special arguments used with some types of plots. Currently only binning is supported for `FOOT_EMBEDDED` arrangement through the `bins` argument.  

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

Widgets are extra funcionalities that are linked to the map to facilitate data manipulation, map navigation and data exploration.   

The `type` can be:
- `TOGGLE_KNOT`: widget to toggle layers and animate them.
- `SEARCH`: search bar to navigate map.

`categories` can only be used with `TOGGLE_KNOT` and allows the specification of a hierarchy between layers.

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

### Groupping knots

`group := (group_name, position)`

Knots can be grouped by assigning a group name and a position of the knot inside the group. This type of grouping is intended to be used for data with different timesteps.  

When grouped knots are used together with the `TOGGLE_KNOTS` widget a animation bar can be used to switch between frames.  

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

### Multiple resolutions

`knotVisibility := (knot, test)`

It is possible to define a zoom level where a knot should be visible, which makes it possible to transition between resolutions. That is done through the `knotVisibility` field inside the map component. A `knot` can be specified and a test to determine if the knot is visible. 

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
The example above is an animation that loop through all frames every 5 seconds.

### Operations between knots

It is possible to do operations between knots. To do so the `knotOp` field in the knot must be true. In that case `name` in `in` and `out` will not point to layers but to the id of other knots. In addition, a `op` field must be specified where an arithmetic operation is defined. In each link of the `integration_scheme` it is possible to use `op` to make a reference to the id of the knots of that link or use the keyword `prevResult` to get the result of `op` of the previous link.  

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

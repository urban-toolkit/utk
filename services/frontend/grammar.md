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

### Knot visibility

```js
map: [
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

### Knot

`knot := (knot_name, (integration_scheme)+)`

```js
{
    id: "knot1", // knot_name
    integration_scheme: [...]
}
```

### Integration Scheme

`integration_scheme := (spatial_relation?, (layer_in | knot_in), (layer_out | knot_out), operation?)`  

`spatial_relation := INTERSECTS | CONTAINS | WITHIN | TOUCHES | CROSSES | OVERLAPS | NEAREST | DIRECT`  

The spatial relation is always applied as a left join where out = left and in = right.  

`operation := (aggregation | *Custom function*)`  

`aggregation := MAX | MIN | AVG | SUM | COUNT | NONE | DISCARD`  

```js
{
    spatial_relation: "INTERSECTS",
    out: "layer1",
    in: "knot2",
    operation: "AVG",
    abstract: true // TODO: get rid of this. If the layer is thematic or not should be encoded in the data itself
}
```

### Layer

`level := OBJECTS | COORDINATES`

```js
{
    name: "layer1",
    level: "COORDINATES"
}
```

### Knot filtering


### Grid System

UTK is divided in components and each component can be positioned in the screen using a grid system. The user can define the dimensions of the grid and how the components will ocupy this grid:

```js
{
    components: [
        {
            map: {...},
            plots: [...],
            knots: [...],
            position: {
                width: [6,13],
                height: [1,1]
            }
        },
        {
            type: "GRAMMAR",
            position: {
                width: [
                    1,
                    5
                ],
                height: [
                    1,
                    4
                ]
            }
        }
    ],
    arrangement: "LINKED",
    grid:{
        width: 13,
        height: 1
    }
}
```

In this example there are two components: a map and a grammar editor. The grid is divided in 13 sections horizontally and 1 section vertically. The map component, for example, occupies sections 6 to 13 horizontally and 1 section vertically. 

### Widgets

`widget := (type,map_id?,title?,subtitle?,position)`  

### Toggle Knots Widget

### Groupping knots

Knots can be groupped by assigning a group name and a position of the knot inside the group. This type of grouping is inteded to be used for data with different timesteps for instance.

```js
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
}
```

### Categorizing knots

The notion of categories is related to the idea of how knots (or groups of knots) can be labelled in a hierarchical manner. For instance, a knot with income data can be categorized as "Socio-demographics". In reality the semantics is completly defined by the user. Moreover, categories can be nested.

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
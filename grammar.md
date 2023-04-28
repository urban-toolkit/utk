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
    abstract: true // get rid of this. If the layer is thematic or not should be encoded in the data itself
}
```

### Layer

```js
{
    name: "layer1",
    level: "coordinates"
}
```

### Knot filtering


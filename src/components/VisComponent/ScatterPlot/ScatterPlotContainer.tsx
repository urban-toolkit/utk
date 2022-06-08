import { extent } from "d3";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";
import { AxisBottom } from "../CommonComponents/AxisBottom";
import { AxisLeft } from "../CommonComponents/AxisLeft";
import '../Dragbox.css'
import { Scatter } from "./Scatter";

type ScatterPlotProps = {
    disp: boolean,
    data: any,
    width: number,
    height: number,
    margin: {top: number, bottom: number, left: number, right: number},
    scaleOffset: number,
    yScaleOffset: number,
    xAxisLabelOffset: number,
    yAxisLabelOffset: number
}

const attributes = [
    { value: "sepal_length", label:"Sepal Length"}, 
    { value: "sepal_width", label:"Sepal Width"}, 
    { value: "petal_length", label:"Petal Length"}, 
    { value: "petal_width", label:"Petal Width"}, 
    { value: "species", label:"Species"}
];

// axis label
const getLbael = (value: any) => {
    for(let i = 0; i < attributes.length; i ++){
      if (attributes[i].value === value){
        return attributes[i].label
      }
    }
  }



// radius of the circles
const radius = 5

export const ScatterPlotContainer = ({
    disp,
    data,
    width,
    height,
    margin,
    scaleOffset,
    yScaleOffset,
    xAxisLabelOffset,
    yAxisLabelOffset
}: ScatterPlotProps
) =>{
    const nodeRef = useRef(null)
    // console.log(data)

    // initial x attribute
    const initialxAttribute = 'petal_length'
    // useState to store and change x attribute
    const [xAttribute, setxAttribute] = useState(initialxAttribute)
    // x-value function
    const xValue = (d: any) => d[xAttribute];
    // x-axislabel
    const xAxisLabel = getLbael(xAttribute)

    // initial y attribute label
    const initialyAttribute = 'sepal_width'
    // useState to store and change y attribute
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    // y-value function
    const yValue = (d: any) => d[yAttribute];
    // y axis label
    const yAxisLabel = getLbael(yAttribute)

    // if we dont get the data return loading
    if(!data){
        return <pre>Loading ...</pre>
    }

    // else we will compute all this
    // inner height and width
    const innerHeight = height - margin.top - margin.bottom
    const innerWidth = width - margin.left - margin.right


    // x scale
    const xScale = scaleLinear()
                //   .domain(extent(data, xValue))
                .domain(extent(data, xValue) as any)
                  .range([0, innerWidth])
                  .nice()

    //  x tick values
    const xTicks = xScale.ticks();

    // y scale
    const yScale = scaleLinear()
                  .domain(extent(data, yValue) as any)
                  .range([0, innerHeight])

    // y tick values
    const yTicks = yScale.ticks()

    // values to be used for color
    const colorValue = (d: { species: any; }) => d.species;
    // color scale
    const colorScale = scaleOrdinal()
                      .domain(data.map(colorValue))
                      .range(["#E6842A", "#137B80", "#8E6C8A"])

    console.log(colorScale.domain())
    
    return(
        <Draggable 
            nodeRef={nodeRef}
        >
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                {/* the dropdown component */}
                <AttributeDropdown
                    attributes={attributes}
                    xAttribute ={xAttribute}
                    setxAttribute ={setxAttribute}
                    yAttribute ={yAttribute}
                    setyAttribute ={setyAttribute}
                />
                <div>
                    {/* this div is holding the bar chart */}
                    <svg width={width} height={height}>
                        {/* translate so that we do not cut any portion*/}
                        <g transform={`translate(${margin.left}, ${margin.top})`}>
                            {/* bottom axis */}
                            <AxisBottom 
                                xScale={xScale}
                                yScale={yScale}
                                scaleOffset={scaleOffset}
                                innerHeight={innerHeight}
                                innerWidth={innerWidth}
                                xAxisLabel={xAxisLabel}
                                xAxisLabelOffset={xAxisLabelOffset}
                                ticks={xTicks}
                            />

                            {/* left axis */}
                            <AxisLeft 
                                xScale={xScale}
                                yScale={yScale}
                                scaleOffset={scaleOffset}
                                yScaleOffset={yScaleOffset}
                                yAxisLabelOffset={yAxisLabelOffset}
                                innerHeight={innerHeight}
                                yAxisLabel={yAxisLabel}
                                ticks={yTicks}
                            />

                            {/* scatter plot i.e. circles */}
                            <Scatter 
                                data={data}
                                xScale={xScale}
                                yScale={yScale}
                                xValue={xValue}
                                yValue={yValue}
                                radius={radius}
                                colorScale={colorScale}
                                colorValue={colorValue}
                            />
                        </g>
                    </svg>

                </div>
            </div>
      </Draggable>
    )
}
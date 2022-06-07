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
    data:any
}

const attributes = [
    { value: "sepal_length", label:"Sepal Length"}, 
    { value: "sepal_width", label:"Sepal Width"}, 
    { value: "petal_length", label:"Petal Length"}, 
    { value: "petal_width", label:"Petal Width"}, 
    { value: "species", label:"Species"}
];

const getLbael = (value: any) => {
    for(let i = 0; i < attributes.length; i ++){
      if (attributes[i].value === value){
        return attributes[i].label
      }
    }
  }

 // width and height of the whole SVG
 const width = window.innerWidth / 3;
 const height = window.innerHeight / 3;

// defining margin of the SVG
const margin = {top:20, right:40, bottom: 50, left:80} 

// scale offsets for nice placement
const scaleOffset = 5
const yScaleOffset = 22

// label offsets to place the labels correctly 
const xAxisLabelOffset = 40
const yAxisLabelOffset = 40

const radius = 5

export const ScatterPlotContainer = ({
    disp,
    data
}: ScatterPlotProps
) =>{
    const nodeRef = useRef(null)
    // console.log(data)

    const initialxAttribute = 'petal_length'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)
    const xValue = (d: any) => d[xAttribute];
    const xAxisLabel = getLbael(xAttribute)

    const initialyAttribute = 'sepal_width'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    const yValue = (d: any) => d[yAttribute];
    const yAxisLabel = getLbael(yAttribute)

    if(!data){
        return <pre>Loading ...</pre>
    }

    const innerHeight = height - margin.top - margin.bottom
    const innerWidth = width - margin.left - margin.right


    const xScale = scaleLinear()
                //   .domain(extent(data, xValue))
                .domain(extent(data, xValue) as any)
                  .range([0, innerWidth])
                  .nice()

    const xTicks = xScale.ticks();

    const yScale = scaleLinear()
                  .domain(extent(data, yValue) as any)
                  .range([0, innerHeight])

    const yTicks = yScale.ticks()

    const colorValue = (d: { species: any; }) => d.species;
    const colorScale = scaleOrdinal()
                      .domain(data.map(colorValue))
                      .range(["#E6842A", "#137B80", "#8E6C8A"])

    // console.log(xScale(0.1), yScale(0.2))
    
    return(
        <Draggable 
            nodeRef={nodeRef}
        >
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                <AttributeDropdown
                    attributes={attributes}
                    xAttribute ={xAttribute}
                    setxAttribute ={setxAttribute}
                    yAttribute ={yAttribute}
                    setyAttribute ={setyAttribute}
                />
                <div>
                    <svg width={width} height={height}>
                        <g transform={`translate(${margin.left}, ${margin.top})`}>
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
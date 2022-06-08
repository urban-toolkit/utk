import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";
import '../Dragbox.css'
import { extent, scaleBand, scaleLinear } from 'd3';
import { AxisLeft } from "../CommonComponents/AxisLeft";
import { AxisBottom } from "../CommonComponents/AxisBottom";
import { HeatMap } from "./HeatMap";

type HeatMapProps = {
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
    {value: "HMa", label: "HMA"},
    {value: "HMb", label: "HMB"},
    {value: "HMc", label: "HMC"},
    {value: "HMd", label: "HMD"},
]

export const HeatMapContainer = ({
    disp,
    data,
    width,
    height,
    margin,
    scaleOffset,
    yScaleOffset,
    xAxisLabelOffset,
    yAxisLabelOffset
}: HeatMapProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)

    const initialxAttribute = 'HMA'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'HMD'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)

    // if we dont get the data return loading
    if(!data){
        return <pre>Loading ...</pre>
    }

    // labels for the axes
    const labels = Object.keys(data[0])

    // inner height and width of the SVG - the main view port
    const innerHeight = height - margin.top - margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    // scaleBand for x and y scales 
    const xValue = (d: {group: any}) => d.group;
    const xScale = scaleBand()
        .domain(data.map(xValue))
        .range([0, innerWidth])
        .padding(0.01);

    const xTicks = xScale.domain();

    // console.log(xScale.domain())
    const yValue = (d: {variable: any}) => d.variable;
    const yScale = scaleBand()
        .domain(data.map(yValue))
        .range([innerHeight, 0])
        .padding(0.01);

    const yTicks = yScale.domain();

    // values to be used for color
    const colorValue = (d: { value: any; }) => d.value;
    // color scale
    const colorScale = scaleLinear<string>()
        .domain(extent(data, colorValue) as any)
        .range(["#efedf5","#756bb1"])


    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                <AttributeDropdown
                    attributes={attributes}
                    xAttribute ={xAttribute}
                    setxAttribute ={setxAttribute}
                    yAttribute ={yAttribute}
                    setyAttribute ={setyAttribute}
                />
                {/* this div is holding the bar chart */}
                <div>
                    {/* the svg */}
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
                                xAxisLabel={labels[0]}
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
                                yAxisLabel={labels[1]}
                                ticks={yTicks}
                            />

                            {/* heatmap */}
                            <HeatMap 
                                data={data}
                                xScale={xScale}
                                yScale = {yScale}
                                xValue={xValue}
                                yValue={yValue}
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
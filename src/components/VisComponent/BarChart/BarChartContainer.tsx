import { max, scaleBand, scaleLinear, scaleOrdinal } from "d3";
import { useRef, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// importing dropdown
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";
import { AxisBottom } from "../CommonComponents/AxisBottom";

import '../Dragbox.css'

// declaring the types of the props
type BarChartProps = {
    disp: boolean
}

// creating attributes for the dropdown - move to the app.js later if needed
const attributes = [
    {value: 'a', label: "A"},
    {value: 'b', label: "B"},
    {value: 'c', label: "C"},
    {value: 'd', label: "D"},
]

const data = [
    {country: 'Russia', value: 6148},
    {country: 'Germany', value: 1653},
    {country: 'France', value: 2162},
    {country: 'China', value: 1131},
    {country: 'Spain', value: 814},
    {country: 'Netherlands', value: 1167},
    {country: 'Italy', value: 660},
    {country: 'Israel', value: 1263},
]

const margin = {top:20, right:30, bottom: 50, left:50} 
const scaleOffset = 10
const labels = Object.keys(data[0])
const xAxisLabelOffset = 40
const xAxisClass = 'bar'

export const BarChartContainer = ({
    disp
}: BarChartProps
) =>{
    const nodeRef = useRef(null)

    const width = window.innerWidth / 3;
    const height = window.innerHeight / 3;

    const innerHeight = height - margin.top - margin.bottom
    const innerWidth = width - margin.left - margin.right

    const xScale = scaleBand()
        .range([0, innerWidth])
        .domain(data.map((d)=> {return d.country}))
        .padding(0.5)

    const ticks = xScale.domain();

    const yValue = (d: { value: any; }) => d.value;

    const yScale = scaleLinear()
        .range([innerHeight, 0])
        .domain([0, max(data, yValue)])

    const initialxAttribute = 'A'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'D'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    
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

                <div>
                    <svg width={width} height={height}>
                        <g transform={`translate(${margin.left}, ${margin.top})`}>
                            <AxisBottom 
                                xScale={xScale}
                                yScale={yScale}
                                scaleOffset={scaleOffset}
                                innerHeight={innerHeight}
                                innerWidth={innerWidth}
                                xAxisLabel={labels[0]}
                                xAxisLabelOffset={xAxisLabelOffset}
                                ticks={ticks}
                                axisClass={xAxisClass}
                            />
                        </g>
                    </svg>
                </div>
            </div>
            
        </Draggable>
    )
}
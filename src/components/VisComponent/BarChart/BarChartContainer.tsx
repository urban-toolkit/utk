import { max, scaleBand, scaleLinear, scaleOrdinal } from "d3";
import { useRef, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// importing dropdown
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";
// import bottom and left axis components
import { AxisBottom } from "../CommonComponents/AxisBottom";
import { AxisLeft } from "../CommonComponents/AxisLeft";

// drag box css
import '../Dragbox.css'
// import the bar component to draw bars
import { Bar } from "./Bar";

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

// fake data for bar chart
const data = [
    {country: 'Russia', value: 6148},
    {country: 'Germany', value: 1653},
    {country: 'France', value: 2162},
    {country: 'China', value: 1131},
    {country: 'Spain', value: 814},
    {country: 'Netherlands', value: 1167},
    {country: 'Italy', value: 660},
    {country: 'Israel', value: 1263},
];

 // width and height of the whole SVG
 const width = window.innerWidth / 3;
 const height = window.innerHeight / 3;

// defining margin of the SVG
const margin = {top:20, right:40, bottom: 50, left:80} 

// scale offsets for nice placement
const scaleOffset = 5
const yScaleOffset = 22

// labels for the axes
const labels = Object.keys(data[0])

// label offsets to place the labels correctly 
const xAxisLabelOffset = 40
const yAxisLabelOffset = 40


export const BarChartContainer = ({
    disp
}: BarChartProps
) =>{
    const nodeRef = useRef(null)

    // inner height and width of the SVG - the main view port
    const innerHeight = height - margin.top - margin.bottom
    const innerWidth = width - margin.left - margin.right

    // a function to let the component know what is xValue
    //  in this way we can have different xValues 
    // and we do not need to update the component
    const xValue = (d: { country: any; }) => d.country

    // scaleband is used for bar chart - xScale
    const xScale = scaleBand()
        .range([0, innerWidth])
        .domain(data.map(xValue))
        .padding(0.5)

    // the ticks for the axis 
    // for scaleband the ticks are the domains
    const xTicks = xScale.domain();

    //  the y-value same as the x-value
    // we define this way to make our component reusable for any type of data
    const yValue = (d: { value: any; }) => d.value;

    // scale linear for y scale
    const yScale = scaleLinear()
        .range([innerHeight, 0])
        .domain([0, max(data, yValue)])

    // console.log(yScale.ticks())
    // ticks for the y axis
    const yTicks = yScale.ticks();

    // dropdown - will be updated later
    const initialxAttribute = 'A'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'D'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                {/* the dropdown component */}
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

                            {/* bar chart */}
                            <Bar 
                                data={data}
                                xScale={xScale}
                                yScale={yScale}
                                xValue={xValue}
                                yValue={yValue}
                                innerHeight={innerHeight}
                            />
                        </g>
                    </svg>
                </div>
            </div>
            
        </Draggable>
    )
}
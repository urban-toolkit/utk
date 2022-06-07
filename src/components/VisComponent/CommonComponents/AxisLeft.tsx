import React from "react";

type LeftProps = {
    xScale : any,
    yScale : any,
    scaleOffset : number,
    yScaleOffset : number,
    innerHeight : number,
    yAxisLabel : any,
    yAxisLabelOffset : number,
    ticks: any []
}

export const AxisLeft = ({
    xScale,
    yScale,
    scaleOffset,
    yScaleOffset,
    yAxisLabelOffset,
    innerHeight,
    yAxisLabel,
    ticks
}: LeftProps) => {
    const [xStart, ] = xScale.range();
    const [yStart, yEnd] = yScale.range();

    return(
        <>
            <>
                <line className={'axisLine'} x1={xStart} x2={xStart} y1={yEnd} y2={yStart} /> 
                <g className="ticks">
                    {ticks.map((t, i) => {
                        const y = yScale(t);
                        return (
                        <React.Fragment key={i}>
                            <line x1={xStart} x2={xStart - scaleOffset} y1={y} y2={y}/>
                            <text
                            x={xStart - yScaleOffset}
                            y={y + scaleOffset}
                            >
                            {t}
                            </text>
                        </React.Fragment>
                        );
                    })}
                </g>
            </>
            
            <text
                className='axis-label'       
                textAnchor='middle'
                transform={`translate(${-yAxisLabelOffset}, ${innerHeight / 2} )rotate(-90)`}
            >{yAxisLabel}</text>
        </>

    )
}
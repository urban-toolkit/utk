import React from 'react'
type BottomProps = {
    xScale : any,
    yScale : any,
    scaleOffset : number,
    innerHeight : number,
    innerWidth : number,
    xAxisLabel : any,
    xAxisLabelOffset : number,
    ticks: any []
}
export const AxisBottom = ({
    xScale,
    yScale,
    scaleOffset,
    innerHeight,
    innerWidth,
    xAxisLabel,
    xAxisLabelOffset,
    ticks
}: BottomProps) => {
    // console.log(yScale.ticks())
    const [xStart, xEnd] = xScale.range();
    const [yStart, yEnd] = yScale.range();    

    return(
        <>
            <g transform={`translate(0, ${yStart})`}>
                <line className='axisLine' x1={xStart} x2={xEnd} y1={yEnd} y2={yEnd} />
                <g className="ticks">
                    {ticks.map((t: any, i: any) => {
                        // console.log(t,i)
                        const x = xScale(t);
                        return (
                        <React.Fragment key={i}>
                            <line x1={x} x2={x} y1={yEnd} y2={yEnd + scaleOffset}/>
                            <text
                                x={x}
                                y={yEnd + scaleOffset * 4}
                            >
                            {t}
                            </text>
                        </React.Fragment>
                        );
                    })}
                </g>
            </g>
            <text
                className='textlabel'
                x={innerWidth / 2}
                y={innerHeight + xAxisLabelOffset}
                textAnchor='middle'
            >{xAxisLabel}</text>
        </>
    )
}
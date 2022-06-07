type ScatterProps ={
    data: any,
    xScale: any, 
    yScale: any, 
    xValue: any, 
    yValue: any, 
    radius: number, 
    colorScale: any,
    colorValue: any

}

export const Scatter = ({
    data, 
    xScale, 
    yScale, 
    xValue, 
    yValue,  
    radius, 
    colorScale,
    colorValue}: ScatterProps) => data.map((d: any, i:any) => 
    <circle 
        key={i}
        cx={xScale(xValue(d))}
        cy={yScale(yValue(d))}
        fill={colorScale(colorValue(d))}
        r={radius}
    >
        <title>{xValue(d)}</title>
    </circle>
  );
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

/**
 * Scatter component creates the Scatter plot which are nothing but some circles
 * @param data - the data object - format as arrays of objects
 * @param xScale - the x-Scale
 * @param yScale - the y-scale
 * @param xValue - the value of X 
 * @param yValue - the value of Y 
 * xValue and yValue functions lets the component know 
 * which object to get a x and y value
 * @param radius - radius of the circles
 * @param colorScale - color scale to color the circles
 * @param colorValue - the value of Color
 * @returns Circles i.e. scatter plot
 */

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
type HeatProps ={
    data: any,
    xScale: any, 
    yScale: any, 
    xValue: any, 
    yValue: any, 
    colorScale: any,
    colorValue: any

}

/**
 *heatmap component creates the heat map plot which are nothing but some rectangles
 * @param data - the data object - format as arrays of objects
 * @param xScale - the x-Scale
 * @param yScale - the y-scale
 * @param xValue - the value of X 
 * @param yValue - the value of Y 
 * xValue and yValue functions lets the component know 
 * which object to get a x and y value
 * @param colorScale - color scale to color the rectangles
 * @param colorValue - the value of Color
 * @returns rectangles
 */
export const HeatMap = ({
    data, 
    xScale, 
    yScale, 
    xValue, 
    yValue, 
    colorScale,
    colorValue}: HeatProps) => data.map((d: any, i:any) => 
    <rect 
        key={i}
        x={xScale(xValue(d))}
        y={yScale(yValue(d))}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={colorScale(colorValue(d))}
    >
        <title>{(colorValue(d))}</title>
    </rect>
  );
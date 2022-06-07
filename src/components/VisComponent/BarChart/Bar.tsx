type BarProps ={
    data: any,
    xScale: any,
    yScale: any,
    xValue: any,
    yValue: any,
    innerHeight: number
}
/**
 * Bar component creates the bars which are nothing but some rectangles
 * @param data - the data object - format as arrays of objects
 * @param xScale - the x-Scale
 * @param yScale - the y-scale
 * @param xValue - the value of X 
 * @param yValue - the value of Y 
 * xValue and yValue functions lets the component know 
 * which object to get a x and y value
 * @param innerHeight - the inner height of the SVG
 * @returns Rectangles 
 */
export const Bar = ({
    data, 
    xScale, 
    yScale, 
    xValue, 
    yValue, 
    innerHeight}: BarProps) => data.map((d: any) => 
    <rect 
        className='mark'
        key={xValue(d)}
        x={xScale(xValue(d)) - 12}
        y={yScale(yValue(d))}
        width={xScale.bandwidth()}
        height={innerHeight - yScale(yValue(d))}
    >
        <title>{(yValue(d))}</title>
    </rect>
  );
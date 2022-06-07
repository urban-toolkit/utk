type BarProps ={
    data: any,
    xScale: any,
    yScale: any,
    xValue: any,
    yValue: any,
    innerHeight: number
}
export const Bar = ({data, xScale, yScale, xValue, yValue, innerHeight}: BarProps) => data.map((d: any) => 
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
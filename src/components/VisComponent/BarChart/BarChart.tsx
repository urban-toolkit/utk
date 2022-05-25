import { ScaleLinear } from "d3";
import { useRef } from "react";
import Draggable from "react-draggable";
import '../Dragbox.css'

// decalring the types of the props
type BarChartProps = {
    disp: boolean,
    scale: ScaleLinear<number, number>
}

export const BarChart = ({
    disp,
    scale
}: BarChartProps
) =>{
    const nodeRef = useRef(null)
    // console.log(scale.range)

    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <div>
                <h3>Bar Chart</h3>
                Choose X: 
                <select name="bar" id="barX">
                    <option value="city">a</option>
                    <option value="b">b</option>
                </select>

                Choose Y: 
                <select name="bar" id="barX">
                    <option value="city">a</option>
                    <option value="b">b</option>
                </select> 
                <button style={{marginLeft:'2%'}}>Load Vis</button>
            </div>
            </div>
        </Draggable>
    )
}
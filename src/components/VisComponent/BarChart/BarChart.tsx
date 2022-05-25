import { useRef } from "react";
import Draggable from "react-draggable";
import '../Dragbox.css'

type BarChartProps = {
    disp: boolean
}

export const BarChart = ({
    disp
}: BarChartProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <div>Bar Chart</div>
            </div>
      </Draggable>
    )
}
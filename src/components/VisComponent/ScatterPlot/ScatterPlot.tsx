import { useRef } from "react";
import Draggable from "react-draggable";
import '../Dragbox.css'

type ScatterPlotProps = {
    disp: boolean
}

export const ScatterPlot = ({
    disp
}: ScatterPlotProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)
    return(
        <Draggable 
            nodeRef={nodeRef}
        >
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <div>Scatter Plot</div>
            </div>
      </Draggable>
    )
}
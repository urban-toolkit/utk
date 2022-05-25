import { useRef } from "react";
import Draggable from "react-draggable";
import '../Dragbox.css'

type HeatMapProps = {
    disp: boolean
}

export const HeatMap = ({
    disp
}: HeatMapProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <div>Heat Map</div>
            </div>
      </Draggable>
    )
}
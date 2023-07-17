import { useRef } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// drag box css
import './Dragbox.css'
// import the bar component to draw bars

// declaring the types of the props
type GenericScreenPlotProps = {
    id: any,
    disp: boolean,
    x: number,
    y: number,
    svgId: string
}

export const GenericScreenPlotContainer = ({
    id,
    disp,
    x,
    y,
    svgId
}: GenericScreenPlotProps
) =>{
    const nodeRef = useRef(null)
    
    return(
        <Draggable nodeRef={nodeRef} key={id} defaultPosition={{x: x, y: -y}}>
            <div ref={nodeRef} className="drag-box" style={{display: disp ? 'block' : 'none', boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)", overflow: "auto", maxWidth: window.innerWidth/2, maxHeight: window.innerHeight}}>
                <div id={svgId}>
                </div>
            </div>
        </Draggable>
    )
}
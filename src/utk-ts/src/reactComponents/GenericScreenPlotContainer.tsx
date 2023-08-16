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
            <div ref={nodeRef} className="drag-box" style={{display: disp ? 'block' : 'none', backgroundColor: "white", borderRadius: "8px", padding: "10px", border: "1px solid #dadce0", boxShadow: "0 2px 8px 0 rgba(99,99,99,.2)", overflow: "auto", maxWidth: window.innerWidth/2, maxHeight: window.innerHeight}}>
                <div id={svgId}>
                </div>
            </div>
        </Draggable>
    )
}
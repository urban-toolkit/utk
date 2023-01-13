import { useRef } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// drag box css
import '../Dragbox.css'
// import the bar component to draw bars

// declaring the types of the props
type GenericScreenPlotProps = {
    disp: boolean,
    width: number,
    height: number,
    svgId: string
}

export const GenericScreenPlotContainer = ({
    disp,
    width,
    height,
    svgId
}: GenericScreenPlotProps
) =>{
    const nodeRef = useRef(null)
    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                {/* this div is holding the generic chart */}
                <div>
                    {/* the svg */}
                    <svg width={width} height={height} id={svgId}>
                    </svg>
                </div>
            </div>
            
        </Draggable>
    )
}
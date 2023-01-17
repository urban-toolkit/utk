import { useRef } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

import { Row, Col, Button, Collapse, Form } from "react-bootstrap";

// drag box css
import '../VisComponent/Dragbox.css'
// import the bar component to draw bars

// declaring the types of the props
type PlotCollectionProps = {
    disp: boolean,
    togglePlotSpec: React.Dispatch<React.SetStateAction<any>>,
    collection: {id: number, content: string}[]
}

export const PlotCollectionContainer = ({
    disp,
    togglePlotSpec,
    collection
}: PlotCollectionProps
) =>{
    const nodeRef = useRef(null)
    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                <div>
                    <h3>Plot collection</h3>
                    {
                        collection.map((item) => (
                            <p key={"plotCollection"+item.id}>{item.content}</p>
                        ))
                    }
                    <Button id="newPlotSpec" variant="outline-secondary" onClick={togglePlotSpec}>
                            New Plot Specification
                    </Button>  
                </div>
            </div>
            
        </Draggable>
    )
}
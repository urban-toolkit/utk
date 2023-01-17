import { useRef, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

import { Row, Col, Button, Collapse, Form } from "react-bootstrap";

// drag box css
import '../VisComponent/Dragbox.css'
// import the bar component to draw bars

// declaring the types of the props
type PlotSpecificationProps = {
    disp: boolean,
}

export const PlotSpecificationContainer = ({
    disp,
}: PlotSpecificationProps
) =>{
    const nodeRef = useRef(null);
    const [currentSpecText, setCurrentSpecText] = useState("");

    const applySpec = (event: any) => {
        console.log(currentSpecText);
    }

    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
                <div>
                    <h3>Plot specification</h3>
                    <textarea onChange={(event) => setCurrentSpecText(event.target.value)} />
                    <Button id="applySpec" variant="outline-secondary" onClick={applySpec}>
                        Apply Spec
                    </Button>    
                </div>
            </div>
        </Draggable>
    )
}
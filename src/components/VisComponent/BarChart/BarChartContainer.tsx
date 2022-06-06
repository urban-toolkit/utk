import { useRef, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// importing dropdown
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";

import '../Dragbox.css'

// declaring the types of the props
type BarChartProps = {
    disp: boolean
}

// creating attributes for the dropdown - move to the app.js later if needed
const attributes = [
    {value: 'a', label: "A"},
    {value: 'b', label: "B"},
    {value: 'c', label: "C"},
    {value: 'd', label: "D"},
]

export const BarChartContainer = ({
    disp
}: BarChartProps
) =>{
    const nodeRef = useRef(null)

    const initialxAttribute = 'A'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'D'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <AttributeDropdown
                attributes={attributes}
                xAttribute ={xAttribute}
                setxAttribute ={setxAttribute}
                yAttribute ={yAttribute}
                setyAttribute ={setyAttribute}
            />
            </div>
        </Draggable>
    )
}
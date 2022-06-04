import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { AttributeDropdown } from "../CommonContainer/AttributeDropdown";
import '../Dragbox.css'

type ScatterPlotProps = {
    disp: boolean
}

const attributes = [
    {value: "SCa", label: "SCA"},
    {value: "SCb", label: "SCB"},
    {value: "SCc", label: "SCC"},
    {value: "SCd", label: "SCD"},
]

export const ScatterPlotContainer = ({
    disp
}: ScatterPlotProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)

    const initialxAttribute = 'SCA'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'SCD'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    
    return(
        <Draggable 
            nodeRef={nodeRef}
        >
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
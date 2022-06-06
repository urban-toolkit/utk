import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { AttributeDropdown } from "../CommonComponents/AttributeDropdown";
import '../Dragbox.css'

type HeatMapProps = {
    disp: boolean
}

const attributes = [
    {value: "HMa", label: "HMA"},
    {value: "HMb", label: "HMB"},
    {value: "HMc", label: "HMC"},
    {value: "HMd", label: "HMD"},
]

export const HeatMapContainer = ({
    disp
}: HeatMapProps
) =>{
    const nodeRef = useRef(null)
    // console.log(disp)


    const initialxAttribute = 'HMA'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)

    const initialyAttribute = 'HMD'
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
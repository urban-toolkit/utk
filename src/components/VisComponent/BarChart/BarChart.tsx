import { useRef, useState } from "react";
// importing draggable to drag the div around the screen
import Draggable from "react-draggable";

// importing dropdown
import ReactDropdown from "react-dropdown";
import '../../ReactDropdown.css'

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

// getting the labels of the attributes
// const getLbael = (value: string) => {
//     for(let i = 0; i < attributes.length; i ++){
//       if (attributes[i].value === value){
//         return attributes[i].label
//       }
//     }
//   }


export const BarChart = ({
    disp
}: BarChartProps
) =>{
    const nodeRef = useRef(null)

    const initialxAttribute = 'A'
    const [xAttribute, setxAttribute] = useState(initialxAttribute)
    // const xValue = d => d[xAttribute];
    // const xAxisLabel = getLbael(xAttribute)

    const initialyAttribute = 'D'
    const [yAttribute, setyAttribute] = useState(initialyAttribute)
    // const yValue = d => d[yAttribute];
    // const yAxisLabel = getLbael(yAttribute)
    
    return(
        <Draggable nodeRef={nodeRef}>
            <div ref={nodeRef} className="drag-box" style={{display: disp? 'block' : 'none'}}>
            <div className='menu-container'>
                <span className='dropdown-label'>X</span>
                <ReactDropdown
                    options={attributes}
                    value={xAttribute}
                    onChange={({value}) => setxAttribute(value)}
                />

                <span className='dropdown-label'>Y</span>
                <ReactDropdown
                    options={attributes}
                    value={yAttribute}
                    onChange={({value}) => setyAttribute(value)}
                />
            </div> 
            </div>
        </Draggable>
    )
}
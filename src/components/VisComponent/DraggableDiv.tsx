import Draggable from "react-draggable";

export const DraggableDiv = () =>{
    return(
        <Draggable    
            bounds = {"parent"}        
        >
            <div style={{border: "2px solid red", padding: "1rem", height: "10%"}}>I can now be moved around!</div>
        </Draggable>
    )
}
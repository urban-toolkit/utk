import { useState } from "react";

// declaring the types of the props
type GrammarPanelProps = {
    textSpec: string
}

export const GrammarPanelContainer = ({
    textSpec
}: GrammarPanelProps
) =>{

    return(
        <div>
            <div>
                <h3>Grammar</h3>
                <textarea style={{width: "350px", height: "250px"}}  />
            </div>
        </div>
    )
}
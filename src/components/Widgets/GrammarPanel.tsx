import { useState } from "react";

import * as d3 from "d3";

// declaring the types of the props
type GrammarPanelProps = {
    textSpec: string,
    applyGrammar: any
}

export const GrammarPanelContainer = ({
    textSpec,
    applyGrammar
}: GrammarPanelProps
) =>{

    return(
        <div>
            <div>
                <h3>Grammar</h3>
                <textarea id="grammarTextArea" style={{width: "280px", height: "350px"}} defaultValue={textSpec} />
                <button type="button" onClick={() => applyGrammar(d3.select("#grammarTextArea").attr("defaultValue"))}>Apply</button>
            </div>
        </div>
    )
}
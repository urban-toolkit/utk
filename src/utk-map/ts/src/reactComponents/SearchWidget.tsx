
import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

type SearchWidgetProps = {
    inputId: string
    obj: any // map 
    viewId: string
}

export const SearchWidget = ({obj, inputId, viewId}:SearchWidgetProps) =>{

    return(
      <React.Fragment>
        <div className="d-flex flex-column align-items-center justify-content-center">
            <input type="text" className={inputId} name="searchBar" placeholder='Search place'></input>
        </div>
      </React.Fragment>
    )
}





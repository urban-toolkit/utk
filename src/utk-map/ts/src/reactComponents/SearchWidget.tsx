
import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

type SearchWidgetProps = {
  obj: any // map 
  inputId: string
  viewId: string
  title: string | undefined
  subtitle: string | undefined
}

export const SearchWidget = ({obj, inputId, viewId, title, subtitle}:SearchWidgetProps) =>{

    return(
      <React.Fragment>
        {title != undefined ? <p>{title}</p> : <></>}
        {subtitle != undefined ? <p>{subtitle}</p> : <></>}
        <input type="text" className={inputId} name="searchBar" placeholder='Search place'></input>
      </React.Fragment>
    )
}





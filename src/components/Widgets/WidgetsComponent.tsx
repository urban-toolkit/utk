// bootstrap components
import { Col } from "react-bootstrap";
//css file
import "./WidgetsComponent.css";
// data and vis widgets components
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";
import { GrammarPanelContainer } from "./GrammarPanel";


// value types that are being passed in the function parameter
type widgetProps = {
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}},
    inputId: string,
    setCamera: any,
    addNewMessage: any,
    applyGrammarButtonId: string,
    linkMapAndGrammarId: string
}
/**
 * @function WidgetsComponent - widgets container
 * handles Vis widgets and Data widgets
 * 
 * Vis Widgets parameters
 * @param genericScreenPlotToggle
 *   react set state True | False
 *  Handles whether to view the corresponding components or not 
 *  
 * Data Widgets parameters - mapview
 * @param onCityRefChange handles the data load
 * @returns 
 */
export const WidgetsComponent = ({
    camera,
    inputId,
    setCamera,
    addNewMessage,
    applyGrammarButtonId,
    linkMapAndGrammarId
}: widgetProps) => {

    return(
        <Col md={5} style={{padding: "0"}}>
            {/* visualization widget */}
            {/* <VisWidget 
                genericScreenPlotToggle = {genericScreenPlotToggle}
                addGenericPlot = {addGenericPlot}
                removeGenericPlot = {removeGenericPlot}
                togglePlotCollection = {togglePlotCollection}
                listPlots = {listPlots}
                modifyLabelPlot = {modifyLabelPlot}
                modifyEditingState = {modifyEditingState}
            /> */}
            <GrammarPanelContainer 
                camera = {camera}
                inputId = {inputId}
                setCamera = {setCamera}
                addNewMessage = {addNewMessage}
                applyGrammarButtonId = {applyGrammarButtonId}
                linkMapAndGrammarId = {linkMapAndGrammarId}
            />
            {/* data widget */}
            {/* <DataWidget 
                onCityRefChange = {onCityRefChange}
            />      */}

        </Col>
    )

};


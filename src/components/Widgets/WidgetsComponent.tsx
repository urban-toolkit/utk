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
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    addGenericPlot: any,
    removeGenericPlot: React.Dispatch<React.SetStateAction<any>>,
    togglePlotCollection: React.Dispatch<React.SetStateAction<any>>,
    modifyLabelPlot: any,
    modifyEditingState: React.Dispatch<React.SetStateAction<any>>,
    listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[],
    onCityRefChange: React.ChangeEventHandler,
    grammar: string
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
    genericScreenPlotToggle,
    addGenericPlot,
    removeGenericPlot,
    togglePlotCollection,
    modifyLabelPlot,
    modifyEditingState,
    listPlots,
    onCityRefChange,
    grammar

}: widgetProps) => {

    return(
        <Col md={2}>
            {/* visualization widget */}
            <VisWidget 
                genericScreenPlotToggle = {genericScreenPlotToggle}
                addGenericPlot = {addGenericPlot}
                removeGenericPlot = {removeGenericPlot}
                togglePlotCollection = {togglePlotCollection}
                listPlots = {listPlots}
                modifyLabelPlot = {modifyLabelPlot}
                modifyEditingState = {modifyEditingState}
            />
            <GrammarPanelContainer 
                textSpec = {grammar}
            />
            {/* data widget */}
            {/* <DataWidget 
                onCityRefChange = {onCityRefChange}
            />      */}

        </Col>
    )

};


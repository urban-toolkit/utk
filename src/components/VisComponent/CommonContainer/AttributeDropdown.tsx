import ReactDropdown from "react-dropdown";
import './ReactDropdown.css'
import '../Dragbox.css'

type DropdownProps = {
    attributes: any [],
    xAttribute : any,
    setxAttribute: React.Dispatch<React.SetStateAction<any>>,
    yAttribute: any,
    setyAttribute: React.Dispatch<React.SetStateAction<any>>
};

export const AttributeDropdown = ({
    attributes,
    xAttribute,
    setxAttribute,
    yAttribute,
    setyAttribute
}: DropdownProps) =>{
    return(
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
    )

}
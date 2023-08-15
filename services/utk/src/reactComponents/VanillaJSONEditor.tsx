import JSONEditor from "jsoneditor";
import { useEffect, useRef } from "react";

export default function SvelteJSONEditor(props: any) {
  const refContainer = useRef(null);
  const refEditor = useRef(null);

  useEffect(() => {

    const container = document.getElementById("jsoneditor-div");
    const options = {}
    const editor = new JSONEditor(container as HTMLElement, options)

    // set json
    const initialJson = {
      "Array": [1, 2, 3],
      "Boolean": true,
      "Null": null,
      "Number": 123,
      "Object": {"a": "b", "c": "d"},
      "String": "Hello World"
    }

    editor.set(initialJson)

    // // @ts-ignore
    // refEditor.current = new JSONEditor({
    //   // @ts-ignore
    //   target: refContainer.current,
    //   props: {}
    // });

    // return () => {
    //   // destroy editor
    //   if (refEditor.current) {
    //     // @ts-ignore
    //     refEditor.current.destroy();
    //     refEditor.current = null;
    //   }
    // };
  }, []);

  // // update props
  // useEffect(() => {
  //   if (refEditor.current) {
  //     // @ts-ignore
  //     refEditor.current.updateProps(props);
  //   }
  // }, [props]);

  // return <div className="vanilla-jsoneditor-react" ref={refContainer}></div>;
  return <div id="jsoneditor-div" ref={refContainer}></div>;
}

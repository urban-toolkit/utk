import JSONEditor from "jsoneditor";
import '../../node_modules/jsoneditor/dist/jsoneditor.min.css';
import { useEffect, useRef } from "react";

// declaring the types of the props
type GrammarEditorProps = {
  content: any,
  readOnly: boolean,
  onChange: any,
  mode: string,
  identation: number
}

export default function GrammarEditor({
    content,
    readOnly,
    onChange,
    mode,
    identation
  }: GrammarEditorProps) {
  const refContainer = useRef(null);
  const refEditor = useRef(null);

  useEffect(() => {
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

    console.log("content", content);

    // create the editor
    const container = document.getElementById("div-jsoneditor")
    const options = {}
    refEditor.current = new JSONEditor(container as HTMLElement, options)

    // set json
    const initialJson = {
        "Array": [1, 2, 3],
        "Boolean": true,
        "Null": null,
        "Number": 123,
        "Object": {"a": "b", "c": "d"},
        "String": "Hello World"
    }
    refEditor.current.set(content)

  }, []);

  useEffect(() => {
    if (refEditor.current) {
      // @ts-ignore
      refEditor.current.set(content);
    }
  }, [content]);

  // // update props
  // useEffect(() => {
  //   if (refEditor.current) {
  //     // @ts-ignore
  //     refEditor.current.updateProps(props);
  //   }
  // }, [props]);

  return <div id="div-jsoneditor"></div>;
}

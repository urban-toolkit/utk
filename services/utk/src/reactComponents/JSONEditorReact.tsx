import JSONEditor, { JSONEditorMode } from "jsoneditor";
import '../../node_modules/jsoneditor/dist/jsoneditor.min.css';
import { Component, useEffect, useRef } from "react";

// // declaring the types of the props
// type GrammarEditorProps = {
//   content: any,
//   readOnly: boolean,
//   onChange: any,
//   mode: string,
//   identation: number
// }

// declaring the types of the props
type GrammarEditorProps = {
  content: any,
  schema: any,
  schemaRefs: any,
  mode: JSONEditorMode,
  modes: string[],
  onChangeText: any,
  onModeChange: any,
  allowSchemaSuggestions: boolean,
  identation: number
}

export default function GrammarEditor({
    content,
    schema,
    schemaRefs,
    mode,
    modes,
    onChangeText,
    onModeChange,
    allowSchemaSuggestions,
    identation
  }: GrammarEditorProps) {
  // const refContainer = useRef<string | null>(null);
  const refEditor = useRef<JSONEditor | null>(null);

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

    // create the editor
    const container = document.getElementById("div-jsoneditor");

    const options = {
      schema: schema,
      schemaRefs: schemaRefs,
      mode: mode,
      identation: identation,
      modes: modes as JSONEditorMode[],
      onModeChange: onModeChange,
      allowSchemaSuggestions: allowSchemaSuggestions,
      onChangeText: onChangeText
    }

    refEditor.current = new JSONEditor(container as HTMLElement, options);

    if('json' in content){
      refEditor.current.set(content.json);
    }

    if('text' in content){
      refEditor.current.setText(content.text);
    }

  }, []);

  useEffect(() => {
    if (refEditor.current) {
      if('json' in content){
        refEditor.current.update(content.json);
      }

      if('text' in content){
        refEditor.current.updateText(content.text);
      }
    }
  }, [content]);

  useEffect(() => {
    if (refEditor.current) {
      refEditor.current.setMode(mode);
    }
  }, [mode]);

//   componentWillUnmount () {
//     if (this.jsoneditor) {
//       this.jsoneditor.destroy();
//     }
//   }

  return <div id="div-jsoneditor" style={{height: "100%"}}></div>;
}

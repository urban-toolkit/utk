import { JSONEditor } from "vanilla-jsoneditor";
import { useEffect, useRef } from "react";

export default function SvelteJSONEditor(props: any) {
  const refContainer = useRef(null);
  const refEditor = useRef(null);

  useEffect(() => {
    // @ts-ignore
    refEditor.current = new JSONEditor({
      // @ts-ignore
      target: refContainer.current,
      props: {}
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        // @ts-ignore
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      // @ts-ignore
      refEditor.current.updateProps(props);
    }
  }, [props]);

  return <div className="vanilla-jsoneditor-react" ref={refContainer}></div>;
}

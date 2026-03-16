import {
    Extension
} from "@tiptap/react";

export const FontSize = Extension.create({
    name: 'fontSize',

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: any) => element.style.fontSize || null,
                        renderHTML: (attributes: any) => {
                            if ( !attributes.fontSize ) { return {} }

                            return { style: `font-size: ${attributes.fontSize}` }
                        }
                    }
                }
            }
        ]
    }
});
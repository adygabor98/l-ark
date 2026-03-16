import Bold from '@tiptap/extension-bold'

export const CustomBold = Bold.extend({
    renderHTML({ HTMLAttributes }) {
        return [ 'span', { ...HTMLAttributes, style: 'font-family: Lato-Bold;' }, 0 ]
    }
});
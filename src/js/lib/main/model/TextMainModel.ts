import MainModel from './MainModel';
import { clone } from '../../../utils';


class TextModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            "fontSize",
            "letterSpacing",
            "lineHeight",
            "paragraphIndent",
            "paragraphSpacing",
        ]);
    }
    
    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            "fontSize": this.handleFontSize,
            "letterSpacing": this.handleLetterSpacing,
            "lineHeight": this.handleLineHeight,
            "paragraphIndent": this.handleParagraphIndent,
            "paragraphSpacing": this.handleParagraphSpacing,
        });
    }

    handleFontSize (node, viewData) {
        node.fontSize = this.setProp(node, viewData, 'fontSize');
    }

    handleLetterSpacing (node, viewData) {
        const nodeLetterSpacing = clone(node.letterSpacing);

        if (nodeLetterSpacing.unit === 'PERCENT') {
            nodeLetterSpacing.unit = 'PIXELS';
            nodeLetterSpacing.value = Math.round(node.fontSize * (nodeLetterSpacing.value / 100));
        }

        nodeLetterSpacing.value = this.setProp(nodeLetterSpacing, viewData, 'letterSpacing', 'value');
        node.letterSpacing = nodeLetterSpacing;
    }
    
    handleLineHeight (node, viewData) {
        const nodeLineHeight = clone(node.lineHeight);
    
        if (nodeLineHeight.unit === 'AUTO') {
            const n = 5,
                  r = 2;
      
            nodeLineHeight.unit = 'PIXELS';
            nodeLineHeight.value = Math.round(node.fontSize * (r ** (1 / n)));

        } else if (nodeLineHeight.unit === 'PERCENT') {

            nodeLineHeight.unit = 'PIXELS';
            nodeLineHeight.value = Math.round(node.fontSize * (nodeLineHeight.value / 100));
        }

        nodeLineHeight.value = this.setProp(nodeLineHeight, viewData, 'lineHeight', 'value');
        node.lineHeight = nodeLineHeight;
    }

    handleParagraphIndent (node, viewData) {
        node.paragraphIndent = this.setProp(node, viewData, 'paragraphIndent');
    }

    handleParagraphSpacing (node, viewData) {
        node.paragraphSpacing = this.setProp(node, viewData, 'paragraphSpacing');
    }
}

export default TextModel;
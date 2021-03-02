import UIView, { IPosition } from './UIView';
import icons from '../../html/icons';

class TextView extends UIView {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        super(viewModel, rootElement);
    }

    positionCreateFuncs = [
        this.createDefaultPositions,
    ]

    positionParseFuncs = [
        this.parseDefaultPositionInputs,
    ]

    insertText (fragment: DocumentFragment): void {
        const keys = ['fontSize', 'letterSpacing', 'lineHeight', 'paragraphIndent', 'paragraphSpacing'];
        const values = this.viewModel.getProps(keys);
        const ranges = this.viewModel.getRanges(keys);

        const html = document.createElement('div');
        html.setAttribute('class', 'text props');

        html.innerHTML = `<div class="props__head props__container">
                            <h2 class="font__head--sub">Text</h2>
                            <button class="btn btn-hide btn-hide--active">
                                <svg class="icon colour__font-primary" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0039 6.004L5.6499 6.358L6.0039 6.711L6.3579 6.358L6.0039 6.004ZM10.6499 0.650002L5.6499 5.65L6.3579 6.358L11.3579 1.358L10.6499 0.650002ZM6.3579 5.65L1.3579 0.650002L0.649902 1.358L5.6499 6.358L6.3579 5.65Z" fill="black"/>
                                </svg>
                            </button>
                        </div>
                        <div class="props__container props__col--2 props__row">
                            ${keys.reduce((prev, key, ind) => prev + this.createSingleInput(key, values[ind], ranges[ind], icons[key]), '')}
                        </div>`;

        fragment.appendChild(html);

    }

    // Re-building buildView because TextNode has its own section
    buildView () {
        // Need to add and remove event listeners everytime I call buildView 
        if (this.htmlFragment) {
            this.rootElement.appendChild(this.htmlFragment.cloneNode(true));
            this.updatePropsWithStateInDom();
            return;
        }

        const fragment = document.createDocumentFragment();
    
        // Get's the position funcs from the sub-class
        this.insertPositions(this.positionCreateFuncs, fragment);

        this.insertText(fragment);

        // Fills, Effects and Strokes
        this.insertSections(fragment);

        this.htmlFragment = fragment;
        this.rootElement.appendChild(fragment.cloneNode(true));
    }

    getTextInputs (obj: Object): void {
        const parent = document.querySelector('.text');
        const [...inputs] = parent.querySelectorAll('.input__action');

        const keys = ['fontSize', 'letterSpacing', 'lineHeight', 'paragraphIndent', 'paragraphSpacing'];
        
        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
    }

    getInputData () {
        const obj = {};
        this.getPositionInputs(obj); 
        this.getTextInputs(obj);
        this.getFillInputs(obj);
        this.getStrokeInputs(obj);
        this.getEffectInputs(obj);

        return obj;
    }
}

export default TextView;
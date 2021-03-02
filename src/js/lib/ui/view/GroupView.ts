import UIView, { IPosition } from './UIView';

class GroupView extends UIView {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        super(viewModel, rootElement);
    }

    activeColours = [];

    // On view creation, these get called
    positionCreateFuncs = [
        this.createDefaultPositions,
    ]

    // When the apply btn is clicked, these get called
    positionParseFuncs = [
        this.parseDefaultPositionInputs,
    ]

    // // Since the group can show some of it's childrens properties and not others
    // generatePositionFuncs () {

    // }

    insertSelectionColours (fragment: DocumentFragment): void {
        const selection = this.viewModel.getProp('selectionColours');
        if (!selection) return;
        const ranges = this.viewModel.getRange('fills');

        // If there's no fills to be had, then don't create the section
        if (selection.length === 0) return;

        const html = document.createElement('div');
        html.setAttribute('class', 'selection-colours props');
        
        html.innerHTML = `<div class="props__head props__container">
                            <h2 class="font__head--sub">Selection colors</h2>
                            <button class="btn btn-hide btn-hide--active">
                                <svg class="icon colour__font-primary" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0039 6.004L5.6499 6.358L6.0039 6.711L6.3579 6.358L6.0039 6.004ZM10.6499 0.650002L5.6499 5.65L6.3579 6.358L11.3579 1.358L10.6499 0.650002ZM6.3579 5.65L1.3579 0.650002L0.649902 1.358L5.6499 6.358L6.3579 5.65Z" fill="black"/>
                                </svg>
                            </button>
                        </div>
                        ${
                            selection.reduce((prev, fill) => {
                                if (fill?.type) {
                                    this.activeColours.push(fill);

                                    if (fill.type === 'IMAGE') return prev + this.createImageInput(fill);

                                    return prev + this.createGradientInput(fill, ranges);
                                }


                                let activeColourIndex = -1;

                                if (fill.refs) {
                                    const ref = fill.refs.find(ref => this.activeColours.includes(ref));
                                    activeColourIndex = this.activeColours.findIndex(clr => Object.is(ref, clr));
                                } 

                                if (activeColourIndex !== -1) {
                                    return prev + `<div class="fills__item selection__dummy" data-ind="${activeColourIndex}"></div>`;
                                } else {
                                    this.activeColours.push(fill);

                                    // The 'a' get's added in MainController.ts
                                    const {r, g, b, a} = fill;

                                    return prev + this.createColourInput([r,g,b,a], ranges, [r, g, b]);
                                }
                            }, '')
                        }`;

        fragment.appendChild(html);
    }

    // Re-creating buildView since a GroupNode won't use fills, strokes etc until I start to retrieve it's children's properties
    // Height, width and the other default positions still work though
    buildView () {
        // Need to add and remove event listeners everytime I call buildView 
        if (this.htmlFragment) {
            this.rootElement.appendChild(this.htmlFragment.cloneNode(true));
            this.updatePropsWithStateInDom();
            return;
        }

        const fragment = document.createDocumentFragment();
    
        this.insertPositions(this.positionCreateFuncs, fragment);

        this.insertSections(fragment);

        this.viewModel.setSelectionColourRefs();
        this.insertSelectionColours(fragment);

        this.htmlFragment = fragment;
        this.rootElement.appendChild(fragment.cloneNode(true));
    }

    parseSelectionInputs (node) {
        const [...inputs] = node.querySelectorAll('.input__action');

        const obj = {}
        const keys = ['r', 'g', 'b', 'a']

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);

        return obj;
    }

    mapSelectionInputs (items): Array<any> {
        const parent = document.querySelector('.selection-colours');
        const activeItems = parent.querySelectorAll('.fills__item:not(.selection__dummy)');
        
        return items.map(item => {
            if (item['classList'].contains('fills__image')) {
                return this.parseImageFillInputs(item);
            }

            if (item['classList'].contains('fills__gradient')) {
                const [...gradientItems] = item.getElementsByClassName('fills__input--small');

                return this.mapFillInputs(gradientItems); // It'll only go down one level, since gradients can't have gradients for stops
            }

            if (item['classList'].contains('selection__dummy')) {
                const activeColourIndex = +item.dataset.ind;
                const activeColourItem = activeItems[activeColourIndex]; 
                                
                // If the dummy colour is the same as one of the first colour instances, and the first instance has a prop obj.
                // Then share that obj between each instance
                return this.parseSelectionInputs(activeColourItem);                
            }

            return this.parseSelectionInputs(item);
        });
    }

    getSelectionColoursInput (obj): void {
        const parent = document.querySelector('.selection-colours');

        // If there's no fills
        if (!parent) return;

        let [...items] = parent.querySelectorAll('.fills__item');
        
        items = this.mapSelectionInputs(items);

        if (!this.viewModel.isJustEmptyObjectsAndArrays(items)) 
            obj['selectionColours'] = items;
    }

    getInputData () {
        const obj = {};
        this.getPositionInputs(obj); 
        this.getFillInputs(obj);
        this.getStrokeInputs(obj);
        this.getEffectInputs(obj);
        this.getSelectionColoursInput(obj);

        return obj;
    }
}

export default GroupView;
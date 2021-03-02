import { rgbArrayToHex, toPascalCaseText } from '../../../utils';
import icons from '../../html/icons';

export interface IPosition {
    positionCreateFuncs: Array<Function>,
    positionParseFuncs: Array<Function>,
}

class UIView {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        this._id = this.viewModel.generateIdentifier();
    }

    private _id: string;
    get id () { return this._id; }

    private _htmlFragment: DocumentFragment;
    set htmlFragment (val) { this._htmlFragment = val; }
    get htmlFragment () { return this._htmlFragment; }

    // Need to either get rid of IDs or add extra info in there since they can repeat
    createSingleInput (key: string, value: any, range: Object, svg: string = ''): string {
        const html = `<div class="input input--single">
                        <label for="${key + '_' + this.id}" class="input__label">
                            <div class="input__wrapper input__wrapper--dark">
                                ${svg}
                                <div class="input__wrapper--item">
                                    <input type="text" class="input__action font__para colour__font-primary" id="${key + '_' + this.id}" value="${value}" data-name="${key}" data-max="${range['max']}" data-min="${range['min']}">
                                </div>
                            </div>
                        </label>
                    </div>`;

        return html;
    }

    createMultipleInput (keys: Array<string>, values: Array<any>, ranges: Array<Object>, svg: string = '', fullWidth: boolean = true): string {
        const html = `<div class="input ${fullWidth ? 'input--multiple' : ''}">
                        <div class="input__wrapper input__wrapper--dark">
                            ${svg ? svg : ''}
                            ${keys.reduce((prev, key, ind) => {
                                    return prev + `<div class="input__wrapper--item">
                                        <input type="text" class="input__action font__para colour__font-primary" id="${key + '_' + this.id}" value="${values[ind]}" data-max="${ranges[ind]['max']}" data-min="${ranges[ind]['min']}">
                                    </div>`;
                                }, '')
                            }
                        </div>
                    </div>`;

        return html;
    }

    createColourInput (values: Array<any>, ranges: Array<Object>, rgbArray: Array<number>, small: boolean = false): string {
        const colourId = this.viewModel.generateIdentifier();
        const keys = ['r', 'g', 'b', 'a'].reduce((prev, key) => {
            prev.push(`${key}_${colourId}_${this.id}`);
            return prev;
        }, []);

        const html = `<div ${!small ? 'class="props__container fills__item props__col--1"' : ''}>
                        <div class="input ${small ? 'input--small' : ''} input--multiple">
                            <div class="input__wrapper input__wrapper--dark ${small ? 'fills__input--small' : ''}">
                                <div class="input__wrapper--icon">
                                    <div class="fills__colour${small ? '--small' : ''}" style="background-color: ${rgbArrayToHex(rgbArray)};">&nbsp;</div>
                                </div>
                                ${values.reduce((prev, value, ind) => {
                                        return prev + `<div class="input__wrapper--item">
                                            <input type="text" class="input__action font__para colour__font-primary fills__value" id="${keys[ind]}" value="${value}" data-max="${ranges[ind]['max']}" data-min="${ranges[ind]['min']}">
                                        </div>`;
                                    }, '')
                                }
                            </div>
                        </div>
                    </div>`;

        return html;
    }

    createGradientInput (fill: Object, ranges: Array<Object>): string {
        const gradientName = fill['type'].split(/_(.*)/i)[1];
        const html = `<div class="props__container fills__item fills__gradient props__container--sub">
                        <div class="props__head">
                            <h2 class="font__head--sub">${gradientName.charAt(0) + gradientName.slice(1).toLowerCase()}</h2>
                        </div>

                        ${fill['gradientStops'].reduce((prev, stop) => {
                            const {r,g,b,a} = stop.color;
                            return prev + this.createColourInput([r,g,b,a], ranges, [r,g,b], true);
                        }, '')}
                    </div>`;

        return html;
    }

    createImageInput (fill: Object): string {
        const [opacityRange, filterRange] = this.viewModel.getRanges(['opacity', 'imageFilter']);
        const filters = fill['filters'];

        const keys = ['contrast', 'exposure', 'highlights', 'saturation', 'shadows', 'temperature', 'tint'];

        const html = `<div class="props__container fills__item fills__image props__container--sub">
                        <div class="props__head">
                            <h2 class="font__head--sub">Image</h2>
                        </div>

                        <div class="props__col--2 props__row">
                            ${keys.reduce((prev, key) => prev + this.createSingleInput(key, filters[key], filterRange, icons[`${key}Filter`]), '')}
                            ${this.createSingleInput('opacity', fill['opacity'], opacityRange, icons['opacity'])}
                        </div>
                    </div>`;

        return html;
    }

    createEffectInput (effect, ranges): string {
        const {r, g, b, a} = effect['color'];
        const colourRanges = this.viewModel.getRange('fills');

        const {offset: { x, y }, radius} = effect;

        const effectId = this.viewModel.generateIdentifier();

        const html = `<div class="props__container effects__item effects__multi props__container--sub">
                            <div class="props__head">
                            <h2 class="font__head--sub">${toPascalCaseText(effect.type)}</h2>
                        </div>

                        ${this.createColourInput([r,g,b,a], colourRanges, [r,g,b], true)}

                        <div class="props__col--3 effects__shadow--labels">
                            <label class="font__tag" for="${`blur-${effectId}_${this.id}`}">Blur</label>
                            <label class="font__tag" for="${`x-${effectId}_${this.id}`}">X</label>
                            <label class="font__tag" for="${`y-${effectId}_${this.id}`}">Y</label>
                        </div>

                        <div class="props__col--1">
                            ${this.createMultipleInput([`blur_${effectId}`, `x_${effectId}`, `y_${effectId}`], [radius, x, y], [ranges.radius, ranges.offset.x, ranges.offset.y])}
                        </div>
                    </div>`;

        return html;
    }

    createDefaultPositions () {
        const keys = ['x', 'y', 'width', 'height', 'rotation'];
        const values = this.viewModel.getProps(keys);
        const ranges = this.viewModel.getRanges(keys);

        return `${keys.reduce((prev, key, ind) => prev + this.createSingleInput(key, values[ind], ranges[ind], icons[key]), '')}`;
    }

    insertPositions (propFunctions: Array<Function>, fragment: DocumentFragment): void {
        const html = document.createElement('div');
        html.setAttribute('class', 'position props');

        html.innerHTML = `<div class="props__container props__col--2 props__row">
                            ${propFunctions.reduce((prev,func) => prev + func.call(this), '')}
                        </div>`;

        fragment.appendChild(html);
    }

    insertFills (fragment: DocumentFragment): void {
        const fills = this.viewModel.getProp('fills');

        if (!fills) return;

        const ranges = this.viewModel.getRange('fills');

        // If there's no fills to be had, then don't create the section
        if (fills.length === 0) return;

        const html = document.createElement('div');
        html.setAttribute('class', 'fills props');

        html.innerHTML = `<div class="props__head props__container">
                            <h2 class="font__head--sub">Fills</h2>
                            <button class="btn btn-hide btn-hide--active">
                                <svg class="icon colour__font-primary" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0039 6.004L5.6499 6.358L6.0039 6.711L6.3579 6.358L6.0039 6.004ZM10.6499 0.650002L5.6499 5.65L6.3579 6.358L11.3579 1.358L10.6499 0.650002ZM6.3579 5.65L1.3579 0.650002L0.649902 1.358L5.6499 6.358L6.3579 5.65Z" fill="black"/>
                                </svg>
                            </button>
                        </div>
                        ${fills.reduce((prev, fill) => {
                            if (fill.type === 'SOLID') {
                                const {r, g, b} = fill.color;
                                const a = fill.opacity;

                                return prev + this.createColourInput([r,g,b,a], ranges, [r,g,b]);
                            } else if (fill.type === 'IMAGE') {
                                return prev + this.createImageInput(fill);
                            } else {
                                return prev + this.createGradientInput(fill, ranges);
                            }
                        }, '')}`;

        fragment.appendChild(html);
    }

    insertStrokes (fragment: DocumentFragment): void {
        const strokeFills = this.viewModel.getProp('strokes'); // Same structure as fills

        if (!strokeFills) return;

        const colourRanges = this.viewModel.getRange('fills');

        // If there's no strokes to be had, then don't create the section
        if (strokeFills.length === 0) return;

        const strokeWeight = this.viewModel.getProp('strokeWeight');
        const weightRange = this.viewModel.getRange('strokeWeight');

        const [ dashLength = 0, dashGap = 0 ] = this.viewModel.getProp('dashPattern');
        const dashRanges = this.viewModel.getRange('dashPattern');

        const html = document.createElement('div');
        html.setAttribute('class', 'strokes props');

        html.innerHTML = `<div class="props__head props__container">
                            <h2 class="font__head--sub">Strokes</h2>
                            <button class="btn btn-hide btn-hide--active">
                                <svg class="icon colour__font-primary" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0039 6.004L5.6499 6.358L6.0039 6.711L6.3579 6.358L6.0039 6.004ZM10.6499 0.650002L5.6499 5.65L6.3579 6.358L11.3579 1.358L10.6499 0.650002ZM6.3579 5.65L1.3579 0.650002L0.649902 1.358L5.6499 6.358L6.3579 5.65Z" fill="black"/>
                                </svg>
                            </button>
                        </div>
                        
                        ${strokeFills.reduce((prev, fill) => {
                            if (fill.type === 'SOLID') {
                                const {r, g, b} = fill.color;
                                const a = fill.opacity;

                                return prev + this.createColourInput([r,g,b,a], colourRanges, [r,g,b]);
                            } else if (fill.type === 'IMAGE') {
                                return prev + this.createImageInput(fill);
                            } else {
                                return prev + this.createGradientInput(fill, colourRanges);
                            }
                        }, '')}
                        
                        <div class="props__container props__col--2 props--align">
                            ${this.createSingleInput('strokeWeight', strokeWeight, weightRange, icons['strokeWeight'])}
                            ${this.createMultipleInput(['dashLength', 'dashGap'], [dashLength, dashGap], dashRanges, icons['dashPattern'], false)}
                        </div>`;

        fragment.appendChild(html);
    }

    insertEffects (fragment: DocumentFragment): void {
        const effects = this.viewModel.getProp('effects');

        if (!effects) return;

        const ranges = this.viewModel.getRange('effects');

        // If there's no effects to be had, then don't create the section
        if (effects.length === 0) return;

        const html = document.createElement('div');
        html.setAttribute('class', 'effects props');

        html.innerHTML = `<div class="props__head props__container">
                            <h2 class="font__head--sub">Effects</h2>
                            <button class="btn btn-hide btn-hide--active">
                                <svg class="icon colour__font-primary" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.0039 6.004L5.6499 6.358L6.0039 6.711L6.3579 6.358L6.0039 6.004ZM10.6499 0.650002L5.6499 5.65L6.3579 6.358L11.3579 1.358L10.6499 0.650002ZM6.3579 5.65L1.3579 0.650002L0.649902 1.358L5.6499 6.358L6.3579 5.65Z" fill="black"/>
                                </svg>
                            </button>
                        </div>

                        ${effects.reduce((prev, effect) =>  {
                            if (['DROP_SHADOW', 'INNER_SHADOW'].includes(effect.type)) {
                                return prev + this.createEffectInput(effect, ranges);
                            } else {
                                const effectId = this.viewModel.generateIdentifier();
                                return prev + `<div class="props__container effects__item effects__single props__container--sub">
                                                <div class="props__head">
                                                    <h2 class="font__head--sub">${toPascalCaseText(effect.type)}</h2>
                                                </div>
                                                <div class="props__col--1 effects__shadow--labels">
                                                    <label class="font__tag" for="blur_${effectId}_${this.id}">Blur</label>
                                                </div>
                                                <div class="props__col--1 effects__full-input">
                                                    ${this.createSingleInput(`blur_${effectId}`, effect.radius, ranges.radius)}
                                                </div>
                                            </div>`;
                            }
                        }, '')}`;    
    
        fragment.appendChild(html);
    }

    insertSections (fragment: DocumentFragment): void {
        this.insertFills(fragment);
        this.insertStrokes(fragment);
        this.insertEffects(fragment);
    }

    getPositionInputs (obj: Object): void {
        const parent = document.querySelector('.position');
        const [...inputs] = parent.querySelectorAll('.input__action');

        // The funcs remove the values they use, using .splice
        this.positionParseFuncs.forEach(func => {
            func.call(this, inputs, obj);
        });
    }

    parseDefaultPositionInputs (inputs: Array<Node>, obj: Object): void {
        const keys = ['x', 'y', 'width', 'height', 'rotation'];
        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 5);
    }

    parseFillInputs (node) {
        const [...inputs] = node.querySelectorAll('.input__action');

        const obj = {}
        const keys = ['r', 'g', 'b', 'a']

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);

        return obj;
    }

    parseImageFillInputs (node) {
        const [...inputs] = node.querySelectorAll('.input__action');

        const obj = {}
        const keys = ['contrast', 'exposure', 'highlights', 'saturation', 'shadows', 'temperature', 'tint', 'opacity'];

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);

        return obj;
    }

    mapFillInputs (items) {
        return items.map(node => {
            if (node['classList'].contains('fills__image')) {
                return this.parseImageFillInputs(node);
            }

            if (node['classList'].contains('fills__gradient')) {
                const [...gradientItems] = node.getElementsByClassName('fills__input--small');

                return this.mapFillInputs(gradientItems); // It'll only go down one level, since gradients can't have gradients for stops
            }

            return this.parseFillInputs(node);
        });
    }

    getFillInputs (obj: Object): void {
        const parent = document.querySelector('.fills');

        // If there's no fills
        if (!parent) return;

        let [...items] = parent.querySelectorAll('.fills__item');
        
        items = this.mapFillInputs(items);

        if (!this.viewModel.isJustEmptyObjectsAndArrays(items)) obj['fills'] = items;
    }

    getStrokeInputs (obj: Object): void {
        const parent = document.querySelector('.strokes');

        // If there's no strokes
        if (!parent) return;

        let [...items] = parent.querySelectorAll('.fills__item');
        
        const strokes = this.mapFillInputs(items)
        
        if (!this.viewModel.isJustEmptyObjectsAndArrays(strokes)) 
            obj['strokes'] = strokes;
        
        const strokeWeight = document.getElementById(`strokeWeight_${this.id}`)['value'];
        const dashLength = document.getElementById(`dashLength_${this.id}`)['value'];
        const dashGap = document.getElementById(`dashGap_${this.id}`)['value'];
        
        const vm = this.viewModel;

        if (vm.isOperationInString(dashLength) || vm.isOperationInString(dashGap))
            obj['dashPattern'] = [vm.viewState[`dashLength_${this.id}`] || {}, vm.viewState[`dashGap_${this.id}`] || {}];

        if (vm.isOperationInString(strokeWeight)) obj['strokeWeight'] = vm.viewState[`strokeWeight_${this.id}`];
    }

    mapEffectInputs (items) {
        return items.map(node => {
            if (node['classList'].contains('effects__multi')) {
                const obj = {};
                const [...effectFill] = node.getElementsByClassName('fills__input--small');

                // There's only one colour for each effect, so will need to get the first item
                const effectFills = this.mapFillInputs(effectFill);

                if (!this.viewModel.isJustEmptyObjectsAndArrays(effectFills)) 
                    obj['color'] = effectFills[0];
                
                const parent = node.querySelector('.props__col--1');
                const [blur, x, y] = parent.querySelectorAll('.input__action');
                
                if (this.viewModel.isOperationInString(x['value'])) {
                    if (!obj['offset']) obj['offset'] = {};

                    obj['offset']['x'] = this.viewModel.viewState[x['id']];
                }
                
                if (this.viewModel.isOperationInString(y['value'])) {
                    if (!obj['offset']) obj['offset'] = {};

                    obj['offset']['y'] = this.viewModel.viewState[y['id']];
                }

                if (this.viewModel.isOperationInString(blur['value'])) obj['radius'] = this.viewModel.viewState[blur['id']];

                return obj;
            }

            const obj = {}
            const blur = node.querySelector('.input__action');

            if (this.viewModel.isOperationInString(blur['value'])) obj['radius'] = this.viewModel.viewState[blur['id']];
            return obj;
        });
    }

    getEffectInputs (obj: Object): void {
        const parent = document.querySelector('.effects');

        // If there's no effects
        if (!parent) return;

        let [...items] = parent.querySelectorAll('.effects__item');

        const effects = this.mapEffectInputs(items);

        if (!this.viewModel.isJustEmptyObjectsAndArrays(effects)) 
            obj['effects'] = effects;
    }

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

        // Fills, Effects and Strokes
        this.insertSections(fragment);

        this.htmlFragment = fragment;
        this.rootElement.appendChild(fragment.cloneNode(true));
    }

    getInputData () {
        const obj = {};
        this.getPositionInputs(obj); 
        this.getFillInputs(obj);
        this.getStrokeInputs(obj);
        this.getEffectInputs(obj);

        return obj;
    }

    // Function for when a document fragment exists and build view is called. 
    // It goes over all of the keys in viewState and adds the values to the inputs with the same id/key
    updatePropsWithStateInDom () {
        const ids = Object.keys(this.viewModel.viewState);

        ids.forEach(id => {
            const value = this.viewModel.viewState[id]['value'];

            const input: HTMLInputElement = <HTMLInputElement> document.getElementById(id);
            input.value = value;
        });
    }

    // Meant to be overloaded, I guess it's bad practice to rely on subclass props?
    // Doing this so that I don't have to re-build buildView and getInputProps in each sub-class
    positionParseFuncs: Array<Function>;
    positionCreateFuncs: Array<Function>;
}

export default UIView;
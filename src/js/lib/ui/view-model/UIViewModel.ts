import { rgbArrayToHex, roundToTwoPlaces, removeSymbols, capPercent, multiplyRgbArrToString } from '../../../utils';

class UIViewModel {
    constructor (
        readonly model
    ) {

    }

    private _viewState = {};
    get viewState () { return this._viewState; }

    setViewState (id, {value, breakpoint, max, min}) {
        /*
            blur-ad73fee: {
                value: '100 + 5'
                breakpoint: 'HOLD'
                max: '200'
                min: '0'
            }
        */

        // If the string is empty, then delete the prop from state
        if (!this.isOperationInString(value)) {
            delete this.viewState[id];
        }

        // If the value is not empty and there's a function to be had then assign the obj to viewState
        if (value && this.isOperationInString(value)) {
            Object.assign(this._viewState, { [id]: {
                value,
                breakpoint,
                max: +max,
                min: +min
            }});
        }
    }

    propFormatFuncs = {
        'rotation': this.formatRotation, 
        'fills': this.formatFills,
        'strokes': this.formatStrokes,
        'effects': this.formatEffects,
        'innerRadius': this.formatInnerRadius,
        'arcData': this.formatArcData,
        'letterSpacing': this.formatLetterSpacing,
        'lineHeight': this.formatLineHeight,
        'selectionColours': this.formatSelectionColours,
    }

    // Builds a hex string from random numbers between 0-255 to be used as an id for the view
    generateIdentifier () {
        const id = Array.from({length: 5}, x => Math.floor(Math.random() * 255).toString(16)).join(''); // 'b7d28c8a', '7f7b1e2d2f'
        
        if (id.length < 6) return this.generateIdentifier();
        if (document.querySelector(`[data-${id}]`)) return this.generateIdentifier // The off-chance there's a duplicate id for a different view

        return id;
    }

    isOperationInString (value: string): boolean {
        const symbols = ['+', '*', '^', '/'];

        // '+5', '*5' instead of '140 + 5', since '+5' is still a number when I do +val
        if (symbols.includes(value.trimLeft()[0])) return true;

        const val = removeSymbols(value);

        return isNaN(+val);
    }

    // Does a deep search through objects and arrays and if there's no viewState prop to be had in any of them, 
    // then return true, saying that the entire obj is unnecessary
    isJustEmptyObjectsAndArrays (objOrArr: Object | Array<any>) {
        // There shouldn't be stray values, like numbers or strings. Only in viewState props which are objects
        let isEmpty = true;

        const mapArr = (arr) => {
            arr.map(item => typeof item === 'object' && item !== null ? mapObj(item) : mapArr(item));
        }

        const mapObj = (obj) => {
            // 'breakpoint' seems the least likely to clash with any prototype value
            if ('breakpoint' in obj) return isEmpty = false;

            Object.keys(obj).map(key => {
                if (Array.isArray(obj[key])) return mapArr(obj[key]);
                if (typeof obj[key] === 'object' && obj[key] !== null) return mapObj(obj[key]);
            });
        }

        if (Array.isArray(objOrArr)) {
            mapArr(objOrArr);
        } else {
            mapObj(objOrArr);
        }

        return isEmpty;
    }

    filterNonFunctionInputs (keys: Array<string>, inputs: Array<Node>, obj: Object): void {
        
        keys.forEach((key, ind) => {
            const val = inputs[ind]['value'];
            if (this.isOperationInString(val)) {
                obj[key] = this.viewState[inputs[ind]['id']];
            }
        });
    }

    // Searches the selectionColours array for duplicate colours, and adds them as references to one another
    setSelectionColourRefs () {
        const colourArr = this.model.props.selectionColours;

        colourArr.forEach(clr => {
            // If there's already a refs object, then we've already done this colour through a previous colour
            if (clr.refs) return;

            // Gradients
            if (clr?.type) return;

            // Not the best, but there could be accuracy issues
            const clrString = multiplyRgbArrToString([clr.r, clr.g, clr.b]);

            colourArr.forEach(clrTwo => {
                const clrTwoString = multiplyRgbArrToString([
                    clrTwo.r,
                    clrTwo.g,
                    clrTwo.b,
                ]);

                if (clrString === clrTwoString) {
                    if (Object.is(clr, clrTwo)) return;

                    // Gradients
                    if (clr?.type) return;

                    if (!clr?.refs) clr['refs'] = [clr];

                    clr.refs.push(clrTwo);
                    clrTwo['refs'] = clr.refs;
                }
            });
        });
    }

    formatRotation (rotation: number): string { 
        return roundToTwoPlaces(rotation) + '°'; 
    }

    formatFills (fills: Array<Object>) {
        fills.forEach(fill => {
            if (fill['type'] === 'IMAGE') return this.formatImageFill(fill);
            if (fill['type'] !== 'SOLID') return this.formatGradient(fill);

            const {r, g, b} = fill['color'];
            fill['color'] = {
                r: Math.round(r * 255), 
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            }

            fill['opacity'] = roundToTwoPlaces(fill['opacity'] * 100) + '%';
        });
        
        return fills;
    }

    // I want to reuse this for effects
    formatGradientStop (stop: Object) {
        const {r, g, b, a} = stop['color'];
        stop['color'] = {
            r: Math.round(r * 255), 
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: roundToTwoPlaces(a * 100) + '%',
        }
    }

    formatGradient (gradient: Object) {         
        gradient['gradientStops'].forEach(stop => {
            this.formatGradientStop(stop);
        });

        return gradient;
    }

    formatImageFill (image: Object) {
        Object.keys(image['filters']).forEach(key => {
            image['filters'][key] = roundToTwoPlaces(image['filters'][key] * 100) + '%';
        });

        image['opacity'] = roundToTwoPlaces(image['opacity'] * 100) + '%';

        return image;
    }

    formatStrokes (strokes: Array<Object>) {
        return this.formatFills(strokes);
    }

    formatEffects (effects: Array<Object>) {
        effects.forEach(effect => {
            if (['LAYER_BLUR', 'BACKGROUND_BLUR'].includes(effect['type']))
                return;

            
            // Colour has the same structure as a gradient stop
            return this.formatGradientStop(effect);
        });

        return effects;
    }

    // When I need to start doing a bit more with specific shapes then create child classes, and move the format funcs below into them

    // arcData is an Object, but I don't want to make an interface for it
    formatArcData (arcData: any) {
        let { startingAngle, endingAngle, innerRadius } = arcData;

        let ranges = this.getRange('endingAngle');
        endingAngle = capPercent(roundToTwoPlaces(((endingAngle - startingAngle) / (2 * Math.PI)) * 100), ranges['max'], ranges['min']) + '%';
        
        startingAngle = roundToTwoPlaces(startingAngle * (180 / Math.PI)) + '°';
        
        ranges = this.getRange('innerRadius');
        innerRadius = capPercent(roundToTwoPlaces(innerRadius * 100), ranges['max'], ranges['min']) + '%';

        return { startingAngle, endingAngle, innerRadius };
    }

    formatInnerRadius (innerRadius: number): string { return roundToTwoPlaces(innerRadius * 100) + '%'; }

    // AUTO I think it uses the classic type scale, fontSize * (2 ** (1 / 5))
    // PERCENT is just the % of fontSize
    // PIXELS is pixels
    // Need to load fonts in main

    formatLetterSpacing (letterSpacing) {
        const { unit, value } = letterSpacing;

        if (unit === 'PERCENT') {
            const fontSize = this.model.props.fontSize;
            return Math.round(fontSize * (value / 100));
        }

        // Pixels
        return value;
    }

    formatLineHeight (lineHeight) {
        // Only lineHeight can have 'Auto'
        const { unit, value } = lineHeight;
        const fontSize = this.model.props.fontSize;

        if (unit === 'AUTO') {
            const n = 5,
                  r = 2;
            
            return Math.round(fontSize * (r ** (1 / n)));
        }

        if (unit === 'PERCENT')
            return Math.round(fontSize * (value / 100));

        // Pixels
        return value;
    }

    formatSelectionColours (colours) {
        colours.forEach(clr => {

            if (clr.type) {
                if (clr.type === 'IMAGE') return this.formatImageFill(clr);

                return this.formatGradient(clr);
            }

            const {r, g, b, a} = clr;
            
            Object.assign(clr, {
                r: Math.floor(r * 255),
                g: Math.floor(g * 255),
                b: Math.floor(b * 255),
                a: roundToTwoPlaces(a * 100) + '%',
            });
        });

        return colours;
    }

    getProp (key: string): any { 
        const prop = this.model.props?.[key];

        // If the props doesn't exist
        if (prop === undefined || prop === null) return false;

        if (key in this.propFormatFuncs) {
            const func = this.propFormatFuncs[key].bind(this);
            return func(prop);
        }
        
        return typeof prop === 'number' ? roundToTwoPlaces(prop) : prop;
    }

    getProps (keys: Array<string>): Array<any> { return keys.map(key => this.getProp(key)); }

    getRange (key: string): Object { return this.model.propRanges[key]; }

    getRanges (keys: Array<string>): Array<Object> { return keys.map(key => this.getRange(key)); } 
}

export default UIViewModel;
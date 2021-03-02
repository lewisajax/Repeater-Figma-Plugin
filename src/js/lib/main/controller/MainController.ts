import RectangleModel from '../model/RectangleMainModel'; 
import EllipseModel from '../model/EllipseMainModel'; 
import PolygonModel from '../model/PolygonMainModel'; 
import StarModel from '../model/StarMainModel'; 
import GroupModel from '../model/GroupMainModel'; 
import TextModel from '../model/TextMainModel'; 
import MainModel from '../model/MainModel'; 

import {clone} from '../../../utils';
import UIModel from '../../ui/model/UIModel';

class MainController {
    constructor (
        readonly selected,
        readonly main
    ) {
        this.initNodeModels();
        this.initUiViews();
    }

    private _models;
    get models () { return this._models; }

    // This will end up being a 2d array containing required model functions
    propMethods = [];

    nodeModels = {
        "RECTANGLE": RectangleModel,
        "ELLIPSE": EllipseModel,
        "POLYGON": PolygonModel,
        "STAR": StarModel,
        "GROUP": GroupModel,
        "FRAME": GroupModel,
        "TEXT": TextModel,
    }

    /**
     * @returns {string[]} Returns an array of node types to be used in creating the models for each node
     */
    getNodeTypes (): Array<string> {
        return this.selected.map(node => node.type);
    }
    
    /*
        [] Does a depth-first-search through the node and it's children
         [] Where figma.findAll returns every node that matches a criteria, this will just return the fills and strokes
        [] It adds every fill and stroke it finds to a single array, essentially flattening the whole node tree
    */

   /**
    * @param {Object} node - Any node with a children property. 
    * @param {Object} obj - The object from setEachModelsProps, to be used to assign model.props
    * @description Goes through each node and their children, pushing every fill and stroke it finds to an array
    */
   setSelectionColours (node, obj) {
        // Might want to abstract away this stuff into it's own controller or something along them lines
        // For groups, iframes etc. Any node with a children property
        const arr = [];

        this.mapChildNodes(node, arr); // Uses the reference for arr
        // this.findAndSetColourRefs(arr); // Also uses the reference

        obj['selectionColours'] = arr;
    }
    
    /**
     * @param {Object} node - A child node, if it has it's own children property, then it will go through them nodes as well
     * @param {Object[]} arr - An arr to hold every fill and stroke
     * @description Depth-First-Search through each node and it's childNodes, adding any fills or strokes it finds along the way
     */
    mapChildNodes (node, arr) {
        node.children.forEach(childNode => {
            // Strokes have the same structure as fills
            ['fills', 'strokes'].forEach(key => {
                if (!childNode[key]) return;

                if (childNode[key].length > 0) {
                    const nodeFills = clone(childNode[key]);
                    const flatFills = this.mapNodeFills(nodeFills);
    
                    arr.push(...flatFills);
                }
            });

            // child selection colours go after the parent colours
            if (childNode.children) this.mapChildNodes(childNode, arr);
        });
    }

    /**
     * @param {Object[]} fills - A fill or stroke object of any type
     * @description Combines the opacity property with the color object, any fill that's not of type solid will be returned as is
     * @returns {Object[]} Returns the modified solid color object from each fill, returns other fill types as is
     */
    mapNodeFills (fills) {
        return fills.map(fill => {
            if (fill.type !== 'SOLID') return fill;

            return { a: fill.opacity, ...fill.color};
        });
    }

    /**
     * @description Takes the keys from the model and copies the node's props to model.props
     */
    setEachModelsProps (): void {
        this.selected.forEach((node, ind) => {
            const obj = {}
            const model = this._models[ind];
            
            model.nodeKeys.forEach(key => { 
                // if (node[key] === figma.mixed) throw new Error("Mixed value, can't do nothing with it");
                if (node[key] === figma.mixed) return obj[key] = 'DISABLED';

                obj[key] = clone(node[key]);
            });
            
            // If there's multiple values being used in certain values, then it results in figma.mixed
            if (model.disabled) obj['type'] = 'CUSTOM';

            // Groups, Iframes etc
            if (node.children) {
                this.setSelectionColours(node, obj);
            }

            Object.assign(model.props, obj);

            return;
        });
    }

    /**
     * @description Maps through the models and gets each model's props
     * @returns {Object[]} The props object from each model into a single array
     */
    getEachModelsProps (): Array<Object> {
        return this._models.map(model => model.props)
    }

    /**
     * @param {Object} fontName - An object that contains the font family, and weight
     * @description Figma requires each font that is used, to be loaded before hand
     */
    async loadTextFonts (fontName: Object) {
        await figma.loadFontAsync(<FontName> fontName);
    }

    /**
     * @description Goes through figma's selected array and adds it's model type into this._models. When it has every model it then starts assigning all the necessary props into model.props
     */
    initNodeModels (): void {
        const nodeTypes: Array<string> = this.getNodeTypes();

        this._models = nodeTypes.map((type, ind) => {

            // Since the other props in TEXT rely on fontSize, there's no point making the text section
            if (type === 'TEXT') {
                if (this.selected[ind]['fontSize'] === figma.mixed) {
                    const Model = new MainModel();
    
                    // setEachModelProps will use this
                    Model['disabled'] = true; 
    
                    return Model;
                }

                const fontName = this.selected[ind]['fontName'];

                // I'm not sure if I'll deal with multiple fonts and sizes
                if (fontName === figma.mixed) throw new Error("Multiple fonts in text node");

                this.loadTextFonts(fontName);
            }

            // If the node type is not supported, then create a generic one, that just has height, width, x, y and rotation
            if (!this.nodeModels[type]) 
                return new MainModel();

            const Model = this.nodeModels[type];

            return new Model();
        });

        this.setEachModelsProps();
    }

    /**
     * @description Get's the necessary props from each model and then sends a message to the ui, instructing it to start creating the views
     */
    initUiViews (): void {
        const nodes = this.getEachModelsProps();

        this.main.figma.ui.postMessage({ 
            method: "initviews",
            nodes
        })
    }

    /**
     * @param {Object[]} viewData - An array of ui view objects
     * @description Maps through the viewData array, and uses the top level object keys of each viewObj, to retrieve it's respective model's methods
     */
    setPropMethods (viewData: Array<Object>): void {
        this.propMethods = viewData.map((view, viewInd) => Object.keys(view).map((key, ind) => {
            return this.models[viewInd]['nodeMethods'][key].bind(this.models[viewInd]); // returns a function to handle the prop
        }));
    }

    /**
     * @param {string} val - An input string
     * @param {string[]} symbols - An array of basic math operators, excluding the substraction symbol
     * @description Replaces the first number it finds, with an 'x'; if there's not already an 'x' in the string
     * @returns {string[]} A split string, with or without an 'x'
     */
    setXInFunc (val: string, symbols: Array<string>): Array<string> {
        // https://regex101.com/r/A2dAJk/2 shows how it collects stuff
        const splitVal = val.match(/(?!\s)(([+\-*^\/\x\X()])|(\-*?\d*\.?\d*)*)/gm);
        const clonedSplit = [...splitVal];

        // If the user has added x to their function then it'll use that as the number instead of trying to assign one in here
        if (splitVal.includes('x')) return splitVal;

        if (splitVal[0] === '-' && !Number.isNaN(Number(splitVal[1]))) {
            clonedSplit.splice(0, 2, 'x');
            return clonedSplit;
        }

        const firstVal =  splitVal.findIndex((e, i) => {            
            if (!Number.isNaN(Number(e))) { 
                clonedSplit.splice(i, 1, 'x'); return e; 
            } else if (symbols.includes(e)) { 
                clonedSplit.splice(i, 0, 'x'); return e; 
            }
        });

        return firstVal !== -1 ? clonedSplit : splitVal;
    }

    /**
     * @param {string} value - The input value from a ui view 
     * @description Filters through the input val, only keeping what it needs
     * @returns {Function} A new Function() with the filtered input string 
     */
    parseFunction (value: string): Function {
        const symbols = [['(', ')'],['+', '^', '*', '/']];

        // Tries to set the first number as an x if nothing comes before it. 
        // If it can't then it returns the original value split into an array
        const valArr: Array<string> = this.setXInFunc(value, symbols[1]);

        // Even if the x was set in setXInFunc, we still go through each array item in case there's other values to figure out?
        const funcString = valArr.reduce((prev: string, curr: string) => {
            // Any unnecessary values get turned into "" during the regex match and thrown out here
            if (curr === '') return prev;

            if (!Number.isNaN(Number(curr)) && !symbols[1].includes(curr)) curr = (parseFloat(curr)).toFixed(2);

            // If the current character is in the symbols[1] (operators) array and the previous character is not an:
            //      ending parentheses, 
            //      a number 
            //      or an x, 
            // add an x variable in-between the prev and curr. (+5) => (x+5)
            if (symbols[1].includes(curr) && symbols[0][1] !== prev.charAt(prev.length - 1) && Number.isNaN(Number(prev.charAt(prev.length - 1))) && prev.charAt(prev.length - 1) !== 'x') { 
                if (curr === '^') { return `${prev} x **`}

                return `${prev} x ${curr}`;
            }

            // Exponentation
            if (curr === '^') return `${prev} **`;

            return `${prev} ${curr}`;
        }, '');
            
        return new Function('x', 'return ' + funcString);
    }

    /**
     * @param {string} breakpoint - 'reverse', 'loop' or 'hold'
     * @param {number} viewInd - The view objects index, since this.models and the viewData obj have the same order then we'll use the view index to get it's model
     * @description Returns the breakpoint method from MainModel
     * @returns A breakpoint method from a main Model
     */
    getBreakpointFunc (breakpoint: string, viewInd: number) {
        // All models will have the same breakpoints, but doing it this way in-case I want to add other breakpoints to specific nodes
        return this.models[viewInd].breakpointMethods[breakpoint];
    }

    /**
     * @param {Object} viewObj - A prop obj
     * @description Tests if 'breakpoint', 'max' and 'min' are valid
     * @returns {boolean} True if the props inside the object are valid
     */
    isValidViewProp (viewObj) {
        // Don't want to be throwing errors in here, this is just temporary
        if(!['loop', 'reverse', 'hold'].includes(viewObj.breakpoint)) throw new Error("Not a valid breakpoint string");
        if (isNaN(+viewObj.max)) throw new Error("max is not a number or number constant");
        if (isNaN(+viewObj.min)) throw new Error("min is not a number or number constant");

        return true;
    }

    /**
     * @param {Object[]} viewData - An array of view data objects that contains the prop inputs
     * @description Goes through each view object in the viewData array, looking for any obj that has a 'breakpoint' key. If it finds one, then it will assign the breakpoint function and a parsed value function 
     */
    setViewPropFunctions (viewData: Array<Object>): void {
        // Repeating from UIViewModel 'isJustEmptyObjectsAndArrays'

        const mapArr = (arr, viewInd) => {
            arr.map(item => typeof item === 'object' && item !== null ? mapObj(item, viewInd) : mapArr(item, viewInd));
        }

        const mapObj = (obj, viewInd) => {
            // Breakpoint seems the least likely to clash with prototype
            if ('breakpoint' in obj) {
                if (!this.isValidViewProp(obj)) {
                    // If one of the values in the obj is not valid, then throw away the entire obj and carry on
                    // Will need to send a notification to the user saying that it didn't work
                    obj = {};
                    return;
                }

                const func = this.parseFunction(obj.value);
                obj['func'] = func;
                obj['breakpointFunc'] = this.getBreakpointFunc(obj.breakpoint, viewInd);
                return;
            };

            Object.keys(obj).map(key => {
                if (Array.isArray(obj[key])) return mapArr(obj[key], viewInd);
                if (typeof obj[key] === 'object' && obj[key] !== null) return mapObj(obj[key], viewInd);
            });
        }

        viewData.forEach((data, viewInd) => mapObj(data, viewInd));
    }

    /**
     * @param {Object[]} viewData - An array of view data objects that contains the prop inputs
     * @param {number} additions - Number of times to create each node
     */
    applyNodes (viewData: Array<Object>, additions: number) {
        
        // Changes the selection to all of the created objects once the plugin is finished
        const newSelection = [];
        let currentNodes = [...this.selected];
        for (let i = 0; i < additions; i++) {
            viewData.forEach((data, ind) => {
                const node = currentNodes[ind].clone();
                currentNodes[ind] = node;

                this.propMethods[ind].forEach(method => {
                    method(node, data);
                });

                newSelection.push(node);
            });
        }

        this.main.figma.currentPage.selection = newSelection;
    }
}

export default MainController;
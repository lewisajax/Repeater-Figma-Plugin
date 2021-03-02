import { clone } from '../../../utils';

class MainModel {
    constructor () {

    }

    props: Object = {};

    nodeKeys = [
        'x',
        'y',
        'rotation',
        'width',
        'height',
        'constrainProportions',
        'fills',
        'effects',
        'strokes',
        'strokeWeight',
        'strokeMiterLimit',
        'dashPattern',
        'name',
        'type',
    ]

    // Quite a verbose way of doing things and I'm sure I'll be repeating myself a lot,
    // but it's gonna give me better control of the node props, since things like arcData.endingAngle rely on startingAngle and I think innerRadius etc
    nodeMethods = {
        'fills': this.handleFills,
        'effects': this.handleEffects,
        'strokes': this.handleStrokes,
        'height': this.handleHeight,
        'width': this.handleWidth,
        'x': this.handleX,
        'y': this.handleY,
        'rotation': this.handleRotation,
        'strokeWeight': this.handleStrokeWeight,
        'dashPattern': this.handleDashPattern,
    }

    // X and Y can both go from -Infinity to Infinity (the number does seem to stop at some point, but it's a pretty high number)
    // And breakpoints don't work when dealing with negative numbers
    breakpointMethods = {
        // MAX = 100, MIN = 0,

        /**
         * @param overrall - If the prop e.g. 'rotation' has already been set in previous iterations, then overall would be the contiguous number before applying breakpoints
         * @param max - Max that was set in the UI view
         * @param min - Min from UI View
         * @description Loop resets from opposite ends of the spectrum (98 + 4 = (MIN + (102 - MAX)) = 2)
         */
        loop (overrall, max, min) {
            if (max === Infinity && overrall > min) return overrall;
            if (min === -Infinity && overrall < max) return overrall;

            let diff = 0,
                mx = max,
                mn = min;

            if (min < 0) {
                diff = Math.round(0 - mn);
                mn += diff;
                mx += diff;
            }

            let val = (overrall + diff) % mx;

            val -= diff;
            
            if (overrall < min) {

                if (Math.floor((Math.abs(overrall) + diff) / mx) % 2 === 0) {
                    // Going up add, down sub
                    return val < min ? max + val : val > max ? min + val : val;
                } else {
                    // Going down add, up sub
                    return val < min ? max + (val + max) : val > max ? min + val : val;
                }
            } else {
                
                if (Math.floor((overrall + diff) / mx) % 2 === 0) {
                    // Going up add, down sub
                    return val < min ? min : val > max ? max : val;
                } else {
                    // Going down add, up sub
                    return val < min ? min : val > max ? max : val;
                }
            }
        },

        /**
         * @param overrall - If the prop e.g. 'rotation' has already been set in previous iterations, then overall would be the contiguous number before applying breakpoints
         * @param max - Max that was set in the UI view
         * @param min - Min from UI View
         * @description Reverse bounces between max and min (98 + 4 = MAX - (102 - MAX) = 98)
         */
        reverse (overrall, max, min) {
            // Still need to reverse if one side is infinite but the other is not
            if (max === Infinity && overrall > min) return overrall;
            if (min === -Infinity && overrall < max) return overrall;

            // https://codegolf.stackexchange.com/q/132651 https://stackoverflow.com/a/22367889

            let diff, 
                mx = max, 
                mn = min;
            
            // Take min up to 0, if it's a negative number and add the difference between 0 and min, to max
            if (min < 0) {
                diff = 0 - min;
                mn = min + diff; // To get it to 0
                mx = max + diff;
            }

            diff = mn - mx;

            let val = overrall < 0 ? overrall + diff : Math.abs(overrall + diff);
            val = val % diff; 


            if (overrall < min) {
                if ((Math.floor(overrall / diff) % 2 === 0)) {
                    val = min - val;           
                    
                    if (min < 0) val = min + val;
                        
                    return val <= min ? min : val >= max ? max : val;
                } else {
                    if (overrall < min) val = Math.abs(val);
            
                    if (min < 0 && (-val) < min) {
                        val = (val % max) + min; 
                    } else if (min >= 0) {
                        val = mx - val;
                    }
                    
                    return val <= min ? max : val >= max ? min : val;
                }
            } else {
                if ((Math.floor(Math.abs(overrall) / Math.abs(diff)) % 2 === 0)) {
                    // Going up add, down sub
                    if (max <= 0) val = -val;        
                        
                    return val <= min ? max : val >= max ? min : val;
                } else {
                    // Going down add, up sub
            
                    if (min < 0) {
                        val = -val;
                    } else {
                        val = max - val;
                    }

                    return val <= min ? min : val >= max ? max : val;
                }
            }
        },
        
        /**
         * @param overrall - If the prop e.g. 'rotation' has already been set in previous iterations, then overall would be the contiguous number before applying breakpoints
         * @param max - Max that was set in the UI view
         * @param min - Min from UI View
         * @description Hold clamps the value between max and min and then stays at one of them constraints for the remainder of the operation (96 + 8 = MAX, 4 - 8 = MIN)
         */
        hold (overrall, max, min) { 
            return overrall > max ? max : overrall < min ? min : overrall; 
        }
    }

    /**
     * @param nodeObj - Any object in/including the node obj
     * @param viewObj - An object that tries to mirror the position of the nodeObj, but in the view object
     * @param key - Property key
     * @param nodeKey - In some cases the viewObj is not mirrored with the nodeObj, so use this to access a property in the nodeObj, and key for the viewObj
     * @description Modifies the prop value, assigns it to the overrall prop in viewObj, then returns the updated value 
     */
    setProp (nodeObj, viewObj, key, nodeKey: string | undefined = undefined) {
        // nodeKey is for if the prop in viewObj has a different key from the same prop in nodeObj
        nodeKey = nodeKey ?? key;

        let val;
        const { max, min, func, breakpointFunc } = viewObj[key];

        val = viewObj[key]?.overrall ?? nodeObj[nodeKey];
        val = func(val);

        viewObj[key].overrall = val;
        val = breakpointFunc(viewObj[key].overrall, max, min);

        return val;
    }

    /**
     * @param nodeObj - Any object in/including the node obj
     * @param viewObj - An object that tries to mirror the position of the nodeObj, but in the view object
     * @param multiplier - Used to multiply the value in the first instance to get the overrall value. Then it's used to divide the return value
     * @param key - Property key
     * @param nodeKey - In some cases the viewObj is not mirrored with the nodeObj, so use this to access a property in the nodeObj, and key for the viewObj
     * @description Same as setProp but divides the return value
     */
    setPropMultiply (nodeObj, viewObj, multiplier, key, nodeKey: string | undefined = undefined) {
        // nodeKey is for if the prop in viewObj has a different key from the same prop in nodeObj
        nodeKey = nodeKey ?? key;

        let val;
        const { max, min, func, breakpointFunc } = viewObj[key];

        val = viewObj[key]?.overrall ?? nodeObj[nodeKey] * multiplier;
        val = func(val);

        viewObj[key].overrall = val;
        val = breakpointFunc(viewObj[key].overrall, max, min);

        return val / multiplier;
    }

    /**
     * @param nodeObj - Any object in/including the node obj
     * @param viewObj - An object that tries to mirror the position of the nodeObj, but in the view object
     * @param key - Property key
     * @param nodeKey - In some cases the viewObj is not mirrored with the nodeObj, so use this to access a property in the nodeObj, and key for the viewObj
     * @description Breakpoints don't work in some cases, so I use this temporarily to not use the breakpoint func
     */
    setPropWithNoBreakpoints (nodeObj, viewObj, key, nodeKey: string | undefined = undefined) {
        // nodeKey is for if the prop in viewObj has a different key from the same prop in nodeObj
        nodeKey = nodeKey ?? key;

        let val;
        const { func } = viewObj[key];

        val = viewObj[key]?.overrall ?? nodeObj[nodeKey];
        val = func(val);

        viewObj[key].overrall = val;

        return val;
    }

    /**
     * @param nodeObj - Any object in/including the node obj
     * @param viewObj - An object that tries to mirror the position of the nodeObj, but in the view object
     * @param key - Property key
     * @param nodeKey - In some cases the viewObj is not mirrored with the nodeObj, so use this to access a property in the nodeObj, and key for the viewObj
     * @description Returns the modified prop value, but it doesn't set the prop's overrall value.
     */
    getPreProps (nodeObj, viewObj, key, nodeKey: string | undefined = undefined) {
        // nodeKey is for if the prop in viewObj has a different key from the same prop in nodeObj
        nodeKey = nodeKey ?? key;

        let val;
        const { func } = viewObj[key];

        val = viewObj[key]?.overrall ?? nodeObj[nodeKey];
        val = func(val);

        return val;        
    }

    setSolidFill (nodeFill, viewFill) {
        Object.keys(viewFill).map(key => {
            // Since opacity isn't in the colour object, it's its own property for SOLIDs
            if (key === 'a') {
                nodeFill.opacity = this.setPropMultiply(nodeFill, viewFill, 100, 'a', 'opacity');;
                return;
            }

            nodeFill.color[key] = this.setPropMultiply(nodeFill.color, viewFill, 255, key);
        });
    }

    setGradientStop (nodeStop, viewStop) {
        Object.keys(viewStop).map(key => {
            const multiplier = key === 'a' ? 100 : 255;
    
            nodeStop[key] = this.setPropMultiply(nodeStop, viewStop, multiplier, key);
        });
    }

    setGradientFills (nodeFill, viewFill) {
        nodeFill.gradientStops.forEach((stop, ind) => {
            const viewStop = viewFill[ind];
            this.setGradientStop(stop.color, viewStop);
        });
    }

    setImageFill (nodeFill, viewFill) {
        Object.keys(viewFill).forEach(key => {
            if (key === 'opacity') {
                nodeFill.opacity = this.setPropMultiply(nodeFill, viewFill, 100, 'opacity');
                return;
            }

            nodeFill.filters[key] = this.setPropMultiply(nodeFill.filters, viewFill, 100, key);
        });
    }

    /**
     * @param node
     * @param viewData 
     * @description If any value in fills has a function, then it will go through the entire fills array to update the value
     */
    handleFills (node, viewData) {
        const nodeFills = clone(node.fills); // Need to clone top level props since can't assign their children directly
        const viewFills = viewData.fills; // I will be adding the overrall prop value into the object, so I can do the breakpoints
                
        nodeFills.forEach((fill, ind) => {
            if (fill.type === 'IMAGE') return this.setImageFill(fill, viewFills[ind]);
            if (fill.type !== 'SOLID') return this.setGradientFills(fill, viewFills[ind]);

            this.setSolidFill(fill, viewFills[ind]);
        });

        node.fills = nodeFills;
    }

    setInnerOrDropEffect (nodeEffect, viewEffect) {
        Object.keys(viewEffect).map(key => {
            if (key === 'color') return this.setGradientStop(nodeEffect.color, viewEffect.color);

            // X and Y in effect
            if (key === 'offset') {
                return Object.keys(viewEffect.offset).map(offKey => {       
                    nodeEffect.offset[offKey] = this.setProp(nodeEffect.offset, viewEffect.offset, offKey);     
                })
            }
    
            nodeEffect[key] = this.setProp(nodeEffect, viewEffect, key);
        });
    }

    // There's only one prop that needs handling, the blur/radius
    setLayerOrBackEffect (nodeEffect, viewEffect) {
        if (Object.keys(viewEffect).length === 0) return;

        nodeEffect.radius = this.setProp(nodeEffect, viewEffect, 'radius');
    }

    handleEffects (node, viewData) {
        const nodeEffects = clone(node.effects);
        const viewEffects = viewData.effects;

        nodeEffects.forEach((effect, ind) => {
            if (['DROP_SHADOW', 'INNER_SHADOW'].includes(effect.type)) {
                this.setInnerOrDropEffect(effect, viewEffects[ind]);
            } else {
                this.setLayerOrBackEffect(effect, viewEffects[ind]);
            }
        });

        node.effects = nodeEffects;
    }

    handleStrokes (node, viewData) {
        const nodeStrokes = clone(node.strokes);
        const viewStrokes = viewData.strokes;

        // Strokes have the same structure as fills
        nodeStrokes.forEach((stroke, ind) => {
            if (stroke.type === 'IMAGE') return this.setImageFill(stroke, viewStrokes[ind]);
            if (stroke.type !== 'SOLID') return this.setGradientFills(stroke, viewStrokes[ind]);

            this.setSolidFill(stroke, viewStrokes[ind]);
        });

        node.strokes = nodeStrokes;
    }

    // Reverse doesn't seem to work for height or width
    handleHeight (node, viewData) {
        const val = this.setProp(node, viewData, 'height');
        node.resize(node.width, val);
    }
    
    handleWidth (node, viewData) {
        const val = this.setProp(node, viewData, 'width');
        node.resize(val, node.height);
    }

    handleX (node, viewData) {
        node.x = this.setPropWithNoBreakpoints(node, viewData, 'x'); 
    }
    
    handleY (node, viewData) {
        node.y = this.setPropWithNoBreakpoints(node, viewData, 'y'); 
    }

    handleStrokeWeight (node, viewData) {
        node.strokeWeight = this.setProp(node, viewData, 'strokeWeight');
    }
    
    handleDashPattern (node, viewData) {
        const nodeDashes = clone(node.dashPattern);
        const viewDashes = viewData.dashPattern;

        // dashPattern is an array [dashLength, dashGap]
        viewDashes.forEach((dash, ind) => {
            if ('breakpoint' in dash) {
                let val;
                const { max, min, func, breakpointFunc } = dash;

                val = dash?.overrall ?? nodeDashes[ind];
                val = func(val);

                dash.overrall = val;
                val = breakpointFunc(dash.overrall, max, min);

                nodeDashes[ind] = val;
            }
        });

        node.dashPattern = nodeDashes;
    }

    handleRotation (node, viewData) {   
        // Get's the rotation with the func opertion added on to it. We won't assign to the rotation prop directly, we'll use the relativeTransform instead     
        let rotation = this.setProp(node, viewData, 'rotation');

        let [x, y] = [node.x, node.y];
        
        // To radians
        rotation *= (Math.PI / 180);
        
        // To be added to x and y, to get the center
        const [cx, cy] = [node.width / 2, node.height / 2];
        
        // If the object is already rotated, then get the topLeft coords by rotating it back to 0
        let topLeftCoords = node.rotation === 0 ? { x, y } : {
            x: x - (cx - cx * Math.cos(node.rotation * (Math.PI / 180)) - cy * Math.sin(node.rotation * (Math.PI / 180))),
            y: y - (cy + cx * Math.sin(node.rotation * (Math.PI / 180)) - cy * Math.cos(node.rotation * (Math.PI / 180)))
        }    
        
        // This will use topLeftCoords on the first instance, and then use the same coords for every other addition
        // TODO - There's no point creating topLeftCoords each time
        let originalCoords = viewData.rotation?.originalCoords ?? topLeftCoords;
        
        viewData.rotation.originalCoords = originalCoords

        // TODO - It's still not working correctly, there's big jumps and little jumps
        // if x or y have a function then they will be called before rotation 
        // we'll need to get the new x or y and set originalCoords to use them
        if (viewData.x !== undefined || viewData.y !== undefined) {
            const [newX, newY] = [node.x, node.y];

            viewData.rotation.originalCoords = {
                x: newX - (cx - cx * Math.cos(node.rotation * (Math.PI / 180)) - cy * Math.sin(node.rotation * (Math.PI / 180))),
                y: newY - (cy + cx * Math.sin(node.rotation * (Math.PI / 180)) - cy * Math.cos(node.rotation * (Math.PI / 180)))
            }

            originalCoords = viewData.rotation.originalCoords;
        }
        
        const rotateTransform = [
            [Math.cos(rotation), -Math.sin(rotation), originalCoords.x + (cx - cx * Math.cos(rotation) + cy * Math.sin(rotation))],
            [Math.sin(rotation), Math.cos(rotation), originalCoords.y + (cy - cx * Math.sin(rotation) - cy * Math.cos(rotation))]
        ]
        
        node.relativeTransform = rotateTransform;
        
        // https://stackoverflow.com/a/8536553
        // [ cos(a), -sin(a), x - x * cos(a) + y * sin(a) ]
        // [ sin(a), cos(a), y - x * sin(a) - y * cos(a) ]
              
        // https://stackoverflow.com/a/17411276
        // [ cos(a), -sin(a), (cos(a) * (x - cx)) + (sin(a) * (y - cy)) + cx ]
        // [ sin(a), cos(a), (cos(a) * (y - cy)) - (sin(a) * (x - cx)) + cy ]
    }
}

export default MainModel;
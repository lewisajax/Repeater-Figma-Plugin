class UIModel {
    constructor (
        readonly props: Object = {}
    ) {

    }

    propRanges = {
        'x': { max: Infinity, min: -Infinity },
        'y': { max: Infinity, min: -Infinity },
        'width': { max: Infinity, min: 0.1 },
        'height': { max: Infinity, min: 0.1 },
        'rotation': { max: 180, min: -180 },

        'cornerRadius': { max: 100, min: 0 },
        'bottomLeftRadius': { max: 100, min: 0 },
        'bottomRightRadius': { max: 100, min: 0 },
        'topRightRadius': { max: 100, min: 0 },
        'topLeftRadius': { max: 100, min: 0 },

        'dashPattern': [
            { max: 100, min: 0},
            { max: 100, min: 0 },
        ],

        'strokeMiterLimit': { max: 10, min: 0 },
        'strokeWeight': { max: 50, min: 0 },

        'fills': [
            { max: 255, min: 0},
            { max: 255, min: 0},
            { max: 255, min: 0},
            { max: 100, min: 0}, // opacity
        ],

        'effects': {
            'offset': {
                'x': { max: 100, min: 0},
                'y': { max: 100, min: 0},
            },
            'radius': { max: 100, min: 0 },
            'spread': { max: 100, min: 0 },
        },

        'startingAngle': { max: 360, min: 0 },
        'endingAngle': { max: 100, min: -100 },
        'innerRadius': { max: 100, min: 0 },

        'polygonPointCount': {max: 14, min: 3},
        'starPointCount': {max: 14, min: 3},

        'fontSize': { max: Infinity, min: 1 },
        'letterSpacing': { max: Infinity, min: -Infinity },
        'lineHeight': { max: Infinity, min: 0 },
        'paragraphSpacing': { max: Infinity, min: 0 },
        'paragraphIndent': { max: Infinity, min: 0 },

        'opacity': { max: 100, min: 0 },
        'imageFilter': { max: 100, min: -100 },
    }
}

export default UIModel;
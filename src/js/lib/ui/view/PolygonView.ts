import UIView, { IPosition } from './UIView';
import icons from '../../html/icons';

class PolygonView extends UIView {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        super(viewModel, rootElement);
    }

    positionCreateFuncs = [
        this.createDefaultPositions,
        this.createCornerRadiusInput,
        this.createPointCountInput,
    ]

    positionParseFuncs = [
        this.parseDefaultPositionInputs,
        this.parseCornerRadius,
        this.parsePointCount,
    ]

    createCornerRadiusInput () {
        const key = 'cornerRadius';

        return this.createSingleInput(
            key,
            this.viewModel.getProp(key),
            this.viewModel.getRange(key),
            icons[key]
        );
    }

    createPointCountInput () {
        const key = 'polygonPointCount';

        return this.createSingleInput(
            key,
            this.viewModel.getProp('pointCount'),
            this.viewModel.getRange(key),
            icons[key]
        );
    }

    parseCornerRadius (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'cornerRadius', 
        ];

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 1);
    }

    parsePointCount (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'pointCount',
        ]

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 1);
    }
}

export default PolygonView;
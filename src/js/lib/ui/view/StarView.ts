import UIView, { IPosition } from './UIView';
import icons from '../../html/icons';

class StarView extends UIView {
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
        this.createInnerRadiusInput,
    ]

    positionParseFuncs = [
        this.parseDefaultPositionInputs,
        this.parseCornerRadius,
        this.parsePointCount,
        this.parseInnerRadius,
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
        const key = 'starPointCount';

        return this.createSingleInput(
            key,
            this.viewModel.getProp('pointCount'),
            this.viewModel.getRange(key),
            icons[key]
        );
    }

    createInnerRadiusInput () {
        const key = 'innerRadius';

        return this.createSingleInput(
            key,
            this.viewModel.getProp(key),
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
    
    parseInnerRadius (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'innerRadius',
        ]

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 1);
    }
}

export default StarView;
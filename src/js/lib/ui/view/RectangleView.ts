import UIView, { IPosition } from './UIView';
import icons from '../../html/icons';

class RectangleView extends UIView implements IPosition {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        super(viewModel, rootElement);
    }

    // On view creation, these get called
    positionCreateFuncs = [
        this.createDefaultPositions,
        this.createCornerRadiusInput,
        this.createExpandedCornerRadius,
    ]

    // When the apply btn is clicked, these get called
    positionParseFuncs = [
        this.parseDefaultPositionInputs,
        this.parseCornerRadius,
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

    createExpandedCornerRadius () {
        const keys = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];

        return this.createMultipleInput(
            keys,
            this.viewModel.getProps(keys),
            this.viewModel.getRanges(keys),
            icons['cornerRadius']
        );
    }

    parseCornerRadius (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'cornerRadius', 
            'topLeftRadius', 
            'topRightRadius', 
            'bottomRightRadius', 
            'bottomLeftRadius'
        ];

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 5);
    }
}

export default RectangleView;
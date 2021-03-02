import UIView, { IPosition } from './UIView';
import { roundToTwoPlaces } from '../../../utils';
import icons from '../../html/icons';

class EllipseView extends UIView {
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
        this.createArcDataInput,
    ]

    // When the apply btn is clicked, these get called
    positionParseFuncs = [
        this.parseDefaultPositionInputs,
        this.parseCornerRadius,
        this.parseArcData,
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

    createArcDataInput () {
        const keys = [
            'startingAngle',
            'endingAngle',
            'innerRadius'
        ];

        const { startingAngle, endingAngle, innerRadius } = this.viewModel.getProp('arcData');

        return this.createMultipleInput(
            keys,
            [startingAngle, endingAngle, innerRadius],
            this.viewModel.getRanges(keys),
            icons.arcData
        )
    }

    parseCornerRadius (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'cornerRadius', 
        ];

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 1);
    }

    // Even though arcData is a single object I'll be splitting their values since they take it bit more work than just using the custom function on the prop  and returning it
    parseArcData (inputs: Array<Node>, obj: Object): void {
        const keys = [
            'startingAngle',
            'endingAngle',
            'innerRadius',
        ]

        this.viewModel.filterNonFunctionInputs(keys, inputs, obj);
        inputs.splice(0, 3);
    }
}

export default EllipseView;
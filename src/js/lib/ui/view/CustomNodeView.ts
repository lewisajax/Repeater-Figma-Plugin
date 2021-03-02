import UIView, { IPosition } from './UIView';

// For node types that I haven't though of, it could cause an error
class CustomNodeView extends UIView {
    constructor (
        readonly viewModel,
        readonly rootElement
    ) {
        super(viewModel, rootElement);
    }

    // On view creation, these get called
    positionCreateFuncs = [
        this.createDefaultPositions,
    ]

    // When the apply btn is clicked, these get called
    positionParseFuncs = [
        this.parseDefaultPositionInputs,
    ]
}

export default CustomNodeView;
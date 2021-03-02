import MainModel from './MainModel';
import { clone } from '../../../utils';

class EllipseModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            'cornerRadius',
            'arcData',
        ]);
    }

    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            'cornerRadius': this.handleCornerRadius,
            'startingAngle': this.handleStartingAngle,
            'endingAngle': this.handleEndingAngle,
            'innerRadius': this.handleInnerRadius,
        });
    }

    handleCornerRadius (node, viewData) {
        node.cornerRadius = this.setProp(node, viewData, 'cornerRadius');
    }

    /**
     * @param node 
     * @param viewData 
     * @description EndingAngle changes if StartingAngle changes, so we need to set EndingAngle back to the value it was before
     */
    handleStartingAngle (node, viewData) {
        // Might need to do endingAngle func if it has one?
        
        const nodeArcData = clone(node.arcData);
        const { startingAngle, endingAngle } = nodeArcData;
        let val;
        
        const { max, min, func, breakpointFunc } = viewData.startingAngle;
        
        val = viewData.startingAngle?.overrall ?? startingAngle * (180 / Math.PI);
        val = func(val);
        
        viewData.startingAngle.overrall = val;
        val = breakpointFunc(viewData.startingAngle.overrall, max, min);

        let startAngle = (nodeArcData.startingAngle * (180 / Math.PI));
        let endAngle = (endingAngle * (180 / Math.PI));

        // const sweepAngle = Math.atan2(startAngle, endAngle);
        // const sweepAngle = Math.atan2(startAngle, endAngle) * (180 / Math.PI);

        startAngle = startingAngle - ((val / 180) * Math.PI);

        nodeArcData.startingAngle = (val / 180) * Math.PI;
        
        endAngle = ((nodeArcData.endingAngle - (nodeArcData.startingAngle + startAngle)) / (2 * Math.PI)) * 100;
        endAngle = (endAngle / 100) * (2 * Math.PI) + nodeArcData.startingAngle;

        nodeArcData.endingAngle = endAngle;

        node.arcData = nodeArcData;
    }

    /**
     * @param node 
     * @param viewData 
     * @description EndingAngle needs the StartingAngle to get the current and new value
     */
    handleEndingAngle (node, viewData) {
        const nodeArcData = clone(node.arcData);
        const { startingAngle, endingAngle } = nodeArcData;
        let val;

        const { max, min, func, breakpointFunc } = viewData.endingAngle;

        val = viewData.endingAngle?.overrall ?? ((endingAngle - startingAngle) / (2 * Math.PI)) * 100
        val = func(val);

        viewData.endingAngle.overrall = val;
        val = breakpointFunc(viewData.endingAngle.overrall, max, min);

        nodeArcData.endingAngle = (val / 100) * (2 * Math.PI) + startingAngle;

        node.arcData = nodeArcData;
    }

    /**
     * @param {Object} node 
     * @param {Object} viewData
     * @description Sets the arcData Inner Radius 
     */
    handleInnerRadius (node, viewData) {
        const nodeArcData = clone(node.arcData);
        nodeArcData.innerRadius = this.setPropMultiply(nodeArcData, viewData, 100, 'innerRadius');

        node.arcData = nodeArcData;
    }
}

export default EllipseModel;
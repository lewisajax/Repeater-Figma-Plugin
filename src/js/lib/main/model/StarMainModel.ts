import MainModel from './MainModel';

class StarModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            'cornerRadius',
            'innerRadius',
            'pointCount',
        ]);
    }

    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            'cornerRadius': this.handleCornerRadius,
            'pointCount': this.handlePointCount,
            'innerRadius': this.handleInnerRadius,
        });
    }

    handleCornerRadius (node, viewData) {
        node.cornerRadius = this.setProp(node, viewData, 'cornerRadius');
    }

    handlePointCount (node, viewData) {
        node.pointCount = this.setProp(node, viewData, 'pointCount');
    }
    
    handleInnerRadius (node, viewData) {
        node.innerRadius = this.setPropMultiply(node, viewData, 100, 'innerRadius');
    }

}

export default StarModel;
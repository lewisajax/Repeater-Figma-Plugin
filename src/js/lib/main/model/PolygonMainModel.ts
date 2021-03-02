import MainModel from './MainModel';

class PolygonModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            'cornerRadius',
            'pointCount',
        ]);
    }

    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            'cornerRadius': this.handleCornerRadius,
            'pointCount': this.handlePointCount,
        });
    }

    handleCornerRadius (node, viewData) {
        node.cornerRadius = this.setProp(node, viewData, 'cornerRadius');
    }
    
    handlePointCount (node, viewData) {
        node.pointCount = this.setProp(node, viewData, 'pointCount');
    }

}

export default PolygonModel;
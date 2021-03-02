import MainModel from './MainModel';

class RectangleModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            'cornerRadius',
            'bottomLeftRadius',
            'bottomRightRadius',
            'topLeftRadius',
            'topRightRadius',
        ]);
    }

    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            'cornerRadius': this.handleCornerRadius,
            'bottomLeftRadius': this.handleBottomLeftCornerRadius,
            'bottomRightRadius': this.handleBottomRightCornerRadius,
            'topLeftRadius': this.handleTopLeftCornerRadius,
            'topRightRadius': this.handleTopRightCornerRadius,
        });
    }

    handleCornerRadius (node, viewData) {
        node.cornerRadius = this.setProp(node, viewData, 'cornerRadius');
    }
    
    // The expanded radius options are all separate props in node, and I can't do an Object.keys etc since I'll be re-doing them if 2 or more have functions in them
    handleBottomLeftCornerRadius (node, viewData) {
        node.bottomLeftRadius = this.setProp(node, viewData, 'bottomLeftRadius');        
    }
    
    handleBottomRightCornerRadius (node, viewData) {
        node.bottomRightRadius = this.setProp(node, viewData, 'bottomRightRadius');        
    }
    
    handleTopRightCornerRadius (node, viewData) {
        node.topRightRadius = this.setProp(node, viewData, 'topRightRadius');        
    }
    
    handleTopLeftCornerRadius (node, viewData) {
        node.topLeftRadius = this.setProp(node, viewData, 'topLeftRadius');        
    }
}

export default RectangleModel;
import MainModel from './MainModel';
import {clone} from '../../../utils';

class GroupModel extends MainModel {
    constructor () {
        super();

        this.insertNodeKeys();
        this.insertNodeMethods();
    }

    insertNodeKeys () {
        this.nodeKeys = this.nodeKeys.concat([
            'selectionColours',
        ]);
    }

    insertNodeMethods () {
        Object.assign(this.nodeMethods, {
            'selectionColours': this.handleSelectionColours,
        });
    }

    selectionStructure;

    setSelectionStructure (nodes, viewData) {
        const [...viewDataCC] = viewData.selectionColours; // I'll be deleting from the viewDataCC obj

        this.selectionStructure = nodes.map(node => {
            const obj = {};

            ['fills', 'strokes'].forEach(key => {
                if (!node[key]) return;

                const fills = this.mapSelectionFills(node[key], viewDataCC);

                if (fills.length < 1) return;

                return obj[key] = fills;
            });

            return obj;
        });
    }

    mapSelectionFills (fills, viewData) {
        if (fills.length < 1) return [];

        return fills.map(fill => {
            const viewObj = viewData[0];
            viewData.splice(0, 1);

            return viewObj;
        });
    }

    handleSelectionColours (node, viewData) {
        const nodesWithColour = node.findAll(n => n);

        if (!this.selectionStructure) this.setSelectionStructure(nodesWithColour, viewData);

        nodesWithColour.forEach((nd, ind) => {
            ['fills', 'strokes'].forEach(key => {
                if (!nd[key]) return;
                
                if (key === 'fills') {
                    return this.handleFills(nd, this.selectionStructure[ind]);
                }
                
                if (key === 'strokes') {
                    return this.handleStrokes(nd, this.selectionStructure[ind]);
                }

            })
        })
    }
}

export default GroupModel;
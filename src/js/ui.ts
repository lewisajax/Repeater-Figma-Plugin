import '../sass/main.scss';

import UIViewModel from './lib/ui/view-model/UIViewModel';
import UIModel from './lib/ui/model/UIModel';

import RectangleView from './lib/ui/view/RectangleView';
import EllipseView from './lib/ui/view/EllipseView';
import PolygonView from './lib/ui/view/PolygonView';
import StarView from './lib/ui/view/StarView';
import GroupView from './lib/ui/view/GroupView';
import TextView from './lib/ui/view/TextView';
import CustomNodeView from './lib/ui/view/CustomNodeView';

interface IDefaultElement extends Object {
  applyBtn: HTMLButtonElement,
  additionsInput: HTMLInputElement,
  overlayWrapper: HTMLDivElement,
  overlayMessage: HTMLParagraphElement,
  viewWrapper: HTMLDivElement,
  containerWrapper: HTMLDivElement,
  nodeSelect: HTMLSelectElement,
  breakpointWrapper: HTMLDivElement,
  breakpointName: HTMLHeadingElement,
  breakpointInput: HTMLInputElement,
  breakpointHold: HTMLInputElement,
  breakpointLoop: HTMLInputElement,
  breakpointReverse: HTMLInputElement,
  breakpointMax: HTMLInputElement,
  breakpointMin: HTMLInputElement
} 

class FigmaPluginUI {
  constructor () {
    this.initListeners();
  }

  private _activeView;
  get activeView () { return this._activeView; }

  private _views;
  get views () { return this._views; }

  nodeViews = {
    "RECTANGLE": RectangleView,
    "STAR": StarView,
    "POLYGON": PolygonView,
    "ELLIPSE": EllipseView,
    "GROUP": GroupView,
    "FRAME": GroupView,
    "TEXT": TextView
  }

  // These elements will not change, each view will be put inside the viewWrapper
  defaultHtmlElements: IDefaultElement = {
    applyBtn: <HTMLButtonElement> document.getElementById("applyBtn"),
    additionsInput: <HTMLInputElement> document.getElementById("additionsInput"),
    overlayWrapper: <HTMLDivElement> document.getElementById("overlayWrapper"),
    overlayMessage: <HTMLParagraphElement> document.getElementById('overlayMessage'),
    viewWrapper: <HTMLDivElement> document.getElementById("viewWrapper"),
    containerWrapper: <HTMLDivElement> document.getElementById("containerWrapper"),
    nodeSelect: <HTMLSelectElement> document.getElementById("nodeSelect"),
    breakpointWrapper: <HTMLDivElement> document.getElementById('breakpointWrapper'),
    breakpointName: <HTMLHeadingElement> document.getElementById('breakpointName'),
    breakpointInput: <HTMLInputElement> document.getElementById('breakpointInput'),
    breakpointHold: <HTMLInputElement> document.getElementById('breakpointHold'),
    breakpointLoop: <HTMLInputElement> document.getElementById('breakpointLoop'),
    breakpointReverse: <HTMLInputElement> document.getElementById('breakpointReverse'),
    breakpointMax: <HTMLInputElement> document.getElementById('breakpointMax'),
    breakpointMin: <HTMLInputElement> document.getElementById('breakpointMin'),
  }

  // Messages from main or main controller
  messageActions: Object = {
    "initviews": this.handleInitViews,
    "deletehtml": this.handleDeleteViewHtml,
    "selectnode": this.handleSelectNode,
  }

  // Figma/Iframe listeners
  initListeners (): void {
    onmessage = ({ data: { pluginMessage } }) => {
      const messageHandler = this.messageActions[pluginMessage.method].bind(this);
      messageHandler(pluginMessage);
    }
  }

  // This is repeating
  getNodeTypes (nodes): Array<string> {
    return nodes.map(node => node.type);
  }

  // Get the identifier and the name from each view and put it in nodeSelect
  insertViewSelectOptions () {
    const fragment = document.createDocumentFragment();

    this._views.forEach(view => {
      const id = view.id;
      const name = view.viewModel.getProp('name');

      const el = document.createElement('option');
      el.setAttribute('value', name.toLowerCase()); // Numbers at the start of a name might be a problem?
      el.dataset.id = id;
      el.textContent = name;

      fragment.appendChild(el);
    });

    // Inserts all of the options into the select
    const select = this.defaultHtmlElements['nodeSelect'];

    // Gets rid of the previous options, if there are any. This is for selectionChange
    while (select.firstChild) {
      select.removeChild(select.lastChild);
    }

    select.appendChild(fragment);
  }

  // Sends the input data to viewState
  setBreakpointsToState = () => {
    const de = this.defaultHtmlElements;
    const breakpoint = [de.breakpointHold, de.breakpointLoop, de.breakpointReverse].find(breakpoint => {
      if (breakpoint.checked) return breakpoint;
    });

    const obj = {
      value: de.breakpointInput.value,
      breakpoint: breakpoint.value,
      max: de.breakpointMax.value,
      min: de.breakpointMin.value,
    }

    this.activeView.viewModel.setViewState(de.breakpointName.textContent, obj);
  }

  // Keeps both input values up to date with one another using onchange listeners
  syncInputValues (source: HTMLInputElement, destination: HTMLInputElement) {
    source.setAttribute('oninput', `${destination.id}.value = ${source.id}.value`);

    source.onchange = this.setBreakpointsToState;
  }

  // Removes the oninput attribute from the prop input
  // The breakpoint's oninput is changed when a new prop input is selected, so only need to remove the previous prop input's oninput
  // TODO - Call this when selecting a new prop input
  deSyncInputValues (source: HTMLInputElement) {
    source.removeAttribute('oninput');
  } 

  // Adds the default values to the breakpoints block
  resetBreakpoints () {
    const de = this.defaultHtmlElements;
    de.breakpointName.innerText = 'Breakpoints';
    de.breakpointLoop.checked = true;
    de.breakpointInput.value = '0';
    de.breakpointMax.value = '0';
    de.breakpointMin.value = '0';
  }

  // Uses the data attributes on the target input and sets the breakpoint values to these attributes
  bindPropInputToBreakpoints (target: HTMLInputElement) {
    // If the element has already got a state property, then use that instead of using the values on the dom element
    const { name, value, max, min, breakpoint = false } = (() => {
      if (this.activeView.viewModel.viewState[target.id]) {
        return { name: target.id, ...this.activeView.viewModel.viewState[target.id]};
      } else {
        return { 
          name: target.id, 
          value: target.value, 
          max: target.dataset.max, 
          min: target.dataset.min 
        };
      }
    })();

    const de = this.defaultHtmlElements;
    de.breakpointName.innerText = name;
    de.breakpointInput.value = value;
    de.breakpointMax.value = max;
    de.breakpointMax.dataset.max = max;
    de.breakpointMin.value = min; 
    de.breakpointMin.dataset.min = min; 

    const bps = { 'LOOP': de.breakpointLoop, 'HOLD': de.breakpointHold, 'REVERSE': de.breakpointReverse }
    if (breakpoint) bps[breakpoint.toUpperCase()].checked = true;

    this.syncInputValues(target, de.breakpointInput);
    this.syncInputValues(de.breakpointInput, target);
  }

  // For removing oninput on the prop dom input
  prevTarget: EventTarget;

  // Bad naming, this listens for clicks on input elements
  handleViewState = ({ target }: { target: EventTarget }) => {
    if (target?.['id'] in this.defaultHtmlElements) {
      return;
    };

    // If it's an input inside the viewWrapper container then connect it with the breakpoint inputs
    if (target instanceof HTMLInputElement) {
      this.prevTarget = target;
      this.resetBreakpoints();
      this.bindPropInputToBreakpoints(target);
      return;
    }

    // Removes the oninput on the previous target
    if (this.defaultHtmlElements.viewWrapper.contains(<Node> target)) {
      this.deSyncInputValues(<HTMLInputElement> target);
    }
  }

  // DOM Event Listeners
  addEventListeners () {
    document.addEventListener('focusin', this.handleViewState);

    document.addEventListener('click', this.handleViewState);

    this.defaultHtmlElements.breakpointWrapper.onchange = this.setBreakpointsToState;
  }

  // Can't have the views be an object with the view Id as the key, since I need to preserve order for when I start applying the nodes
  // When looking for a view using the viewId, I'll simply need to loop through them until I find it set it as the activeView
  handleInitViews ({ nodes }): void {
    // Will need to delete views if selectionchange is fired
    const container = this.defaultHtmlElements.containerWrapper;
    const overlay = this.defaultHtmlElements.overlayWrapper;

    container.style.visibility = 'visible';
    overlay.style.visibility = 'hidden';

    this.resetBreakpoints();

    this._views = nodes.map(node => {
      const Model = new UIModel(node);
      const ViewModel = new UIViewModel(Model);
      
      // If the node type is not supported, then create a generic one, that just has height, width, x, y and rotation
      // If it doesn't work then it'll cause an error that I'll need to try and catch somewhere
      if (!this.nodeViews[node.type]) 
        return new CustomNodeView(ViewModel, this.defaultHtmlElements['viewWrapper'])

      const View = this.nodeViews[node.type];
      return new View(ViewModel, this.defaultHtmlElements['viewWrapper']);
    });
    
    // Fills the drop down with the views
    this.insertViewSelectOptions();
    
    this._activeView = this._views[0];
    this.activeView.buildView();

    this.addEventListeners();

    this.defaultHtmlElements.applyBtn.addEventListener('click', () => {
      this.postApplyNodes();
    });

    this.defaultHtmlElements.nodeSelect.addEventListener('change', (e) => {
      const viewId = e.target['options'][e.target['selectedIndex']].dataset.id;

      // Might want to add an overlay
      this.changeView(viewId);
    });
  }

  // First gets all the input values from each view, then ships it off to main.ts
  postApplyNodes (): void { 
      const viewData =  this._views.map(view => {
        /*
          [1] Deletes everything in the view
          [2] Builds the view (or re-builds for the active view)
          [3] Goes through all the inputs to create a figma node-like structure and uses viewState to insert used props 
            [3.1] Returns an array of used props or an empty array
          [4] Rinse & Repeat
        */

        this.handleDeleteViewHtml();

        // If the view has not been built yet, then there's no point building it now, since there's no inputs to get
        if (!view.htmlFragment) return {};

        view.buildView();
        return view.getInputData();
      });

      const additions = +this.defaultHtmlElements.additionsInput.value;
      
      this.handleApplyingNodesMessage();

      parent.postMessage({ pluginMessage: { type: 'applynodes', data: viewData, additions }}, '*');
  }

  // Goes through the views array comparing the viewIds, it then sets the one it finds as the activeView
  setActiveView (viewId) {
    const selectedView = this._views.find(view => view.id === viewId && view);

    this._activeView = selectedView;
  }

  // First deletes anything in the viewWrapper, then build the new active view
  changeView (viewId) {
    this.setActiveView(viewId);
    this.handleDeleteViewHtml();

    this.activeView.buildView();
  }

  // Deletes everything inside #viewWrapper
  handleDeleteViewHtml (): void { 
    const wrapper = this.defaultHtmlElements.viewWrapper;
    while (wrapper.firstChild) {
      wrapper.removeChild(wrapper.lastChild);
    }
  }

  // When there's no node(s) selected, then show a overlay screen 
  handleSelectNode (): void { 
    const container = this.defaultHtmlElements.containerWrapper;
    const overlay = this.defaultHtmlElements.overlayWrapper;
    const message = this.defaultHtmlElements.overlayMessage;

    message.innerText = "Please select an object on the viewport";

    overlay.style.visibility = 'visible';
    container.style.visibility = 'hidden';
  }

  handleApplyingNodesMessage (): void {
    const container = this.defaultHtmlElements.containerWrapper;
    const overlay = this.defaultHtmlElements.overlayWrapper;
    const message = this.defaultHtmlElements.overlayMessage;

    message.innerText = "Applying the nodes";

    overlay.style.visibility = 'visible';
    container.style.visibility = 'hidden';

  }
}

const UI = new FigmaPluginUI();
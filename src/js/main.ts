import MainController from './lib/main/controller/MainController';

/*
  I tried to conform to mainly these 2 patterns but went off the rails a little bit 
  There's a lot of conflicting info on how to implement these in JS when I was going through blog posts etc.
  So I just went with what seemed the most suitable 

  [] MVC - main.ts
   [] Model - Business Logic
    [] No reference to anything but can send notifications to all subscribers
   [] View - Think of ui.ts as the view I guess
    [] Has a reference to Controller and can subscribe for notification to the model
   [] Controller - Formatting and routing data between view and model, no real logic but there can be some
    [] Has references to Model and View

  [] MVVM - ui.ts
   [] Model - Data store, no logic
    [] Hasn't got a reference to anything in this plugin, but would otherwise be a sub-for-notification sort of thing
   [] View-Model - All the business logic and formatting etc
    [] Has a reference to Model
   [] View - Everything to do with building the UI, I sort of did data-binding by dynamically adding oninput/onchange etc
    [] Has a reference to View-Model and can also subscribe to model but can't directly talk to the model.
*/

class FigmaPluginMain {
  UI_WIDTH: number = 300;
  UI_HEIGHT: number = 500;
  DIALOG_WIDTH: number = 220; // TODO: Dialog box for when there's a large selection of nodes of additions
  DIALOG_HEIGHT: number = 280;
  WARN_NUM_OF_SELECTED = 5; // TODO: If # of selected are over this value, warn the user. 

  constructor (
    readonly figma: PluginAPI,
    readonly html: string
  ) {
    this.initUI();
    this.initListeners();
    this.initController();
  }

  // There will only be one controller for main
  private _controller;
  get controller () { return this._controller; }

  // Messages from the UI
  messageActions: Object = {
    "applynodes": this.handleApplyNodes
  }

  // Creates the ui frame but not the content, that will be handled when 'initviews' message is sent from the MainController
  initUI (): void {
    this.figma.showUI(this.html);
    this.figma.ui.resize(this.UI_WIDTH, this.UI_HEIGHT);
  }

  // Figma/Iframe listeners
  initListeners (): void {
    this.figma.on("selectionchange", this.handleSelectionChange.bind(this)),

    // All of the message handlers are in the object messageActions
    this.figma.ui.onmessage = message => {
      const messageHandler = this.messageActions[message.type].bind(this);
      messageHandler(message);
    }
  }

  /**
   * @description Creates one instance of MainController, if I end up abstracting away the main controllers, then they will be handled in here
   */
  initController () {
    const selected = this.figma.currentPage.selection;

    // Background notification, can be scrapped if necessary
    this.notifySelectionAmount(selected.length);

    // If there's no nodes in the selection, then display a message in ui saying to select something
    if (selected.length < 1) {
      this.figma.ui.postMessage({ 
        method: "selectnode",
      });

      return; // Controller will be created when 'selectionchange' event is fired, if it doesn't get created here
    }
    
    this._controller = new MainController(selected, this);
  }

  /**
   * @param {number} selectionLength - The length of figma's selected array 
   * @description Displays a notificaton saying how many nodes have been selected
   */
  notifySelectionAmount (selectionLength): void {
    const message = `${selectionLength} ${selectionLength !== 1 ? "nodes have" : "node has"} been selected.`;

    figma.notify(message);
  }

  /**
   * @param {boolean} deleteHtml - Should the ui views be deleted first?
   * @description If a new node is selected on the viewport then we'll need re-create the controller and also delete every view on the UI side
   */
  handleSelectionChange (deleteHtml: boolean = true): void { 
    if (deleteHtml) {
      this.figma.ui.postMessage({ 
        method: "deletehtml",
      });
    }

    // Re-create the controller, which in turn re-creates the ui views and the models
    this.initController();
  }

  /**
   * @param {number} additions - The number of times to repeat a node
   * @param {Object[]} data - An array of view objects
   * @description This will hand off most of the work to the controller. When it's finished it will close the plugin
   */
  handleApplyNodes ({additions, data}): void { 

    // Creates the func from the input value, and also adds the breakpoint func from MainModel; into a prop in the data obj
    this.controller.setViewPropFunctions(data);

    // Goes through each viewData and adds the methods from a main Model, by using their prop keys
    this.controller.setPropMethods(data);

    // Starts creating and modifying the nodes, and also sets the selection to the newly created nodes once it's finished
    this.controller.applyNodes(data, additions);

    figma.closePlugin();
  }
}

const Main = new FigmaPluginMain(figma, __html__);
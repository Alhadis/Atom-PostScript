"use strict";

const {CompositeDisposable} = require("atom");
const PostScriptPreviewView = require("./views/postscript-preview-view.js");

module.exports = {
	disposables: null,
	
	activate(){
		if(this.disposables instanceof CompositeDisposable)
			this.disposables.dispose();
		this.disposables = new CompositeDisposable(
			atom.commands.add("body", {"postscript:toggle-preview": this.toggle.bind(this)}),
			atom.workspace.addOpener(PostScriptPreviewView.opener)
		);
	},
	
	deactivate(){
		if(this.disposables){
			this.disposables.dispose();
			this.disposables = null;
		}
	},
	
	createPreviewView: PostScriptPreviewView.createView,
	toggle:            PostScriptPreviewView.toggle,
};

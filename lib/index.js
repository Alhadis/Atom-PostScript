"use strict";

const {exec, which} = require("alhadis.utils");
const {CompositeDisposable} = require("atom");
const PostScriptPreviewView = require("./views/postscript-preview-view.js");


module.exports = {
	disposables: null,
	gsPath: "",
	
	activate(){
		if(this.disposables instanceof CompositeDisposable)
			this.disposables.dispose();
		this.disposables = new CompositeDisposable(
			atom.commands.add("body", {"postscript-preview:toggle": this.toggle.bind(this)}),
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
	
	async toggle(event){
		if(!(this.gsPath = this.gsPath || await which("gs"))){
			atom.notifications.addError("Could not find `gs` executable", {
				description: "Is GhostScript installed and added to your $PATH?",
				dismissable: true,
			});
			return;
		}
		
		return PostScriptPreviewView.toggle(event);
	},
};

"use strict";

const PortalView = require("./portal-view.js");
const {addTo, New, exec, rgba} = require("alhadis.utils");


module.exports =
class PostScriptPreviewView extends PortalView {
	
	
	constructor(state = {}){
		super(state);
		this.image = addTo(this.element)(New("img", {
			src: "data:image/png;base64," + btoa(rgba(0, 0, 0, 0)),
		}))[1];
	}
	
	
	get imageData(){
		return atob(this.image.src.replace(/^data:image\/png;base64,/i, ""));
	}
	set imageData(to){
		this.image.src = "data:image/png;base64," + btoa(to);
	}
	
	
	async render(){
		const {gsPath} = require("../");
		const args     = "-q -r300 -dTextAlphaBits=4 -sDEVICE=png16m -dNOPROMPT -dNOPAUSE -sstdout=%stderr -sOutputFile=-".split(" ");
		const result   = await exec(gsPath, args, await this.getSource(), {encoding: ["utf8", "binary", "utf8"]});
		if(result.code){
			const message = `GhostScript previewer exited with error code ${result.code}`;
			throw new Object.assign(Error(message), result);
		}
		this.imageData = result.stdout;
	}
	
	
	static get slug(){
		return "postscript-preview";
	}
	
	static get protocolName(){
		return "postscript-preview";
	}
	
	static get shouldOpenSplitPane(){
		return atom.config.get("postscript-preview.openInSplitPane");
	}
	
	static get iconName(){
		return "ghostscript";
	}
}

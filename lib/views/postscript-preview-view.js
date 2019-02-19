"use strict";

const locateGhostScript        = require("../exec-path.js");
const PortalView               = require("./portal-view.js");
const {addTo, New, exec, rgba} = require("alhadis.utils");
const {writeFileSync}          = require("fs");
const {join}                   = require("path");


module.exports =
class PostScriptPreviewView extends PortalView {
	
	constructor(state = {}){
		super(state);
		const src = "data:image/png;base64," + btoa(rgba(0, 0, 0, 0));
		this.image = addTo(this.element)(New("img", {src}))[1];
	}
	
	
	get imageData(){
		return atob(this.image.src.replace(/^data:image\/png;base64,/i, ""));
	}
	set imageData(to){
		this.image.src = "data:image/png;base64," + btoa(to);
	}
	
	
	registerCommands(){
		return atom.commands.add(this.element, {
			
		});
	}
	
	
	async render(){
		const gsPath = await locateGhostScript();
		if(!gsPath) return;
		const bits = atom.config.get("postscript-preview.alphaBits");
		const args = [
			"-dTextAlphaBits="     + bits,
			"-dGraphicsAlphaBits=" + bits,
			"-r" + atom.config.get("postscript-preview.resolution"),
			..."-q -sDEVICE=pngalpha -dNOPROMPT -dNOPAUSE -sstdout=%stderr -sOutputFile=-".split(" "),
		];
		const result = await exec(gsPath, args, await this.getSource(), {encoding: ["utf8", "binary", "utf8"]});
		if(result.code){
			const message = `GhostScript previewer exited with error code ${result.code}`;
			throw new Object.assign(Error(message), result);
		}
		this.imageData = result.stdout;
	}
	
	
	getSaveDialogOptions(){
		let path, projectPath;
		if(path = this.getPath())
			path = path.replace(/\.e?ps$/i, "") + ".png";
		else{
			path = "untitled.png";
			if(projectPath = atom.project.getPaths()[0])
				projectPath = join(projectPath, path);
		}
		return {defaultPath: path};
	}
	
	
	saveAs(filePath){
		if(this.loading){
			atom.notifications.addWarning("Please wait until preview has finished loading before saving");
			return;
		}
		fs.writeFileSync(filePath, this.imageData, {encoding: "binary"});
		const note = atom.notifications.addSuccess("Saved to `" + filePath + "`", {dismissable: true});
		setTimeout(() => note.dismiss(), 2000);
	}
	
	
	static get iconName()     { return "ghostscript"; }
	static get slug()         { return "postscript-preview"; }
	static get protocolName() { return "postscript-preview"; }
	static get shouldSplit()  { return atom.config.get("postscript-preview.openInSplitPane"); }
}

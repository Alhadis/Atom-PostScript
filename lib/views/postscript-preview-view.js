"use strict";

const locateGhostScript        = require("../exec-path.js");
const AtomLiveView             = require("atom-live-view");
const PanAndZoom               = require("pan-and-zoom");
const {addTo, New, exec, rgba} = require("../utils.js");
const {writeFileSync}          = require("fs");
const {join}                   = require("path");


module.exports =
class PostScriptPreviewView extends AtomLiveView {
	
	constructor(state = {}){
		super(state);
		
		// Setup magnification handlers
		this.zoomLayer = this.element.appendChild(New("div", {className: "zoom-layer"}));
		const computedStyle = window.getComputedStyle(this.zoomLayer);
		this.zoomLayer.addEventListener("transitionend", event => {
			if("transform" === event.propertyName){
				this.element.classList.remove("zooming");
				this.render();
			}
		});
		this.panAndZoom = new PanAndZoom({
			updateZoom: () => {
				this.zoomLayer.style.transform = this.panAndZoom;
				parseFloat(computedStyle.transitionDuration)
					? this.element.classList.add("zooming")
					: this.render();
			},
		});
		if(1 !== state.zoom && state.zoom > 0)
			this.panAndZoom.zoom = +state.zoom;
		
		// Register commands
		this.disposables.add("commands", atom.commands.add(this.element, {
			"postscript:zoom-in":  () => this.panAndZoom.zoom += 0.25,
			"postscript:zoom-out": () => this.panAndZoom.zoom -= 0.25,
		}));
		
		// Setup image that displays the rendered output
		const src = "data:image/png;base64," + btoa(rgba(0, 0, 0, 0));
		this.image = addTo(this.zoomLayer)(New("img", {src}))[1];
		this.observeConfig("postscript.alphaBits", "postscript.resolution");
	}
	
	
	get imageData(){
		return atob(this.image.src.replace(/^data:image\/png;base64,/i, ""));
	}
	set imageData(to){
		this.image.src = "data:image/png;base64," + btoa(to);
	}
	
	
	serialize(){
		return super.serialize({zoom: this.panAndZoom.zoom});
	}
	
	
	async render(){
		const gsPath = await locateGhostScript();
		if(!gsPath) return;
		const bits = atom.config.get("postscript.alphaBits");
		const args = [
			"-dTextAlphaBits="     + bits,
			"-dGraphicsAlphaBits=" + bits,
			"-r" + atom.config.get("postscript.resolution"),
			..."-q -sDEVICE=pngalpha -dNOPROMPT -dNOPAUSE -sstdout=%stderr -sOutputFile=-".split(" "),
		];
		const {performance}  = require("perf_hooks");
		const started        = performance.now();
		const result         = await exec(gsPath, args, await this.getSource(), {encoding: ["utf8", "binary", "utf8"]});
		this.lastRenderSpeed = performance.now() - started;
		
		if(result.code){
			const message = `GhostScript previewer exited with error code ${result.code}`;
			console.error(result);
			throw Object.assign(new Error(message), result);
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
	static get shouldSplit()  { return atom.config.get("postscript.openInSplitPane"); }
}

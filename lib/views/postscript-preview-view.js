"use strict";

const PortalView = require("./portal-view.js");
const {exec} = require("../utils.js");


module.exports =
class PostScriptPreviewView extends PortalView {
	
	
	async render(){
		const {gsPath} = require("../");
		const args     = "-q -r300 -dTextAlphaBits=4 -sDEVICE=png16m -dNOPROMPT -dNOPAUSE -sstdout=%stderr -sOutputFile=-".split(" ");
		const result   = await exec(gsPath, args, await this.getSource(), {encoding: ["utf8", "binary", "utf8"]});
		if(result.code){
			const message = `GhostScript previewer exited with error code ${result.code}`;
			throw new Object.assign(Error(message), result);
		}
		console.log(result);
	}
	
	
	getProtocolName(){
		return "ghostscript";
	}
	
	
	getIconName(){
		return "ghostscript";
	}
}

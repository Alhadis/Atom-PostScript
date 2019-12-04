"use strict";

const {which} = require("./utils.js");
let gsPath = null;

module.exports = async () => {
	if(null !== gsPath) return gsPath;

	// Make sure $PATH is accessible before attempting to search
	if(!atom.shellEnvironmentLoaded)
		await new Promise(resolve => {
			const disposable = atom.whenShellEnvironmentLoaded(() => {
				disposable.dispose();
				resolve();
			});
		});
	
	// Show an error to the user if GhostScript isn't found, but only once
	if(!(gsPath = await which("gs")))
		atom.notifications.addError("Could not find `gs` executable", {
			description: "Is GhostScript installed and added to your $PATH?",
			dismissable: true,
		});
	
	return gsPath;
};

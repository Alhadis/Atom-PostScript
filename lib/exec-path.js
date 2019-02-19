"use strict";

const {which} = require("alhadis.utils");
let gsPath = null;

module.exports = async () => {
	if(null !== gsPath) return gsPath;
	
	// Show an error to the user if GhostScript isn't found, but only once
	if(!(gsPath = await which("gs")))
		atom.notifications.addError("Could not find `gs` executable", {
			description: "Is GhostScript installed and added to your $PATH?",
			dismissable: true,
		});
	
	return gsPath;
};

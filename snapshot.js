/**
 * @fileoverview Code to reproduce screenshot of workspace.
 */
"use strict";

require("electron").remote.getCurrentWebContents().printToPDF({
	landscape: true,
	printBackground: true,
}, (error, data) => {
	if(error) throw error;
	let path = atom.applicationDelegate.showSaveDialog();
	if(!path) return;
	path = path.replace(/(?:\.pdf)?$/i, ".pdf");
	require("fs").writeFileSync(path, data, {encoding: "binary"});
});

/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

// Declared outside the closure to give it global scope
const program = {};

// Anonymous closure to sandbox module code
(function(globalNamespace) {
	
	"use strict";
	
	// This module is used for two things
	// One is to construct the global namespace that the whole applet will be wrapped in (program)
	// and the other is to provide a flexible utility to dynamically load external resources
	
	// Private Logic
	
	// Holds requests to receive resources
	const requests = {
		
		scripts: { requests: [], called: false, finished() { for (let i = 0; i < this.requests.length; ++i) if (!this.requests[i].hasFinished) return false; return true; } }, // Script Tags
		images:  { requests: [], called: false, finished() { for (let i = 0; i < this.requests.length; ++i) if (!this.requests[i].hasFinished) return false; return true; } }, // Image Tags
		text: 	 { requests: [], called: false, finished() { for (let i = 0; i < this.requests.length; ++i) if (!this.requests[i].hasFinished) return false; return true; } }, // Plain Text via XMLHttpRequest
		
		// Build script request
		importScript(url) {
			let script = document.createElement("script");
			document.getElementsByTagName("body")[0].appendChild(script);
			script.hasFinished = false;
			script.url = url;
			script.type = "application/javascript";
			script.async = false;
			script.defer = true;
			script.owner = this.scripts;
			script.contentHandler = importedContent.handleScriptContent;
			script.onload =  importedContent.import_onload;
			script.onerror = importedContent.import_onerror;
			
			this.scripts.requests.push(script);
		},
		
		// Build image request
		importImage(key,url) {
			let img = new Image();
			img.hasFinished = false;
			img.key = key;
			img.url = url;
			img.owner = this.images;
			img.contentHandler = importedContent.handleImageContent;
			img.onload  = importedContent.import_onload;
			img.onerror = importedContent.import_onerror;
			
			this.images.requests.push(img);
		},
		
		// Build text request
		importText(key,url) {
			let req = new XMLHttpRequest();
			req.hasFinished = false;
			req.key = key;
			req.open("GET",url,true);
			req.overrideMimeType("text/plain");
			req.owner = this.text;
			req.contentHandler = importedContent.handleTextContent;
			req.onload  = importedContent.import_onload;
			req.onerror = importedContent.import_onerror;
			
			this.text.requests.push(req);
		},
		
		// Send all requests
		sendBatch() {
			for (let i = 0; i < requests.scripts.requests.length; ++i)
				requests.scripts.requests[i].src = requests.scripts.requests[i].url;
			
			for (let i = 0; i < requests.images.requests.length; ++i)
				requests.images.requests[i].src = requests.images.requests[i].url;
			
			for (let i = 0; i < requests.text.requests.length; ++i)
				requests.text.requests[i].send();
			
			// run final event if no content is to be loaded
			if (requests.scripts.finished() &&
				requests.images.finished()  &&
				requests.text.finished())
				publicInterface.onload();
		}
	};
	
	// Holds loaded content
	// (Scripts don't need to be "stored", they are automatically executed)
	const importedContent = {
		images: [],
		text: [],
		
		handleScriptContent() { },
		handleImageContent() { importedContent.images[this.key] = this; },
		handleTextContent()  { importedContent.text[this.key] = this.responseText; },
		
		// Generic callback given to all requests
		import_onload() {
			this.hasFinished = true;
			
			// Handle imported content
			this.contentHandler();
			
			// Test to see if all other requests of the same type have finished
			for (let i = 0; i < this.owner.length; ++i)
				if (!this.owner[i].hasFinished)
					return;
			
			importedContent.callbackCheck();
		},
		
		// Generic error handler given to all requests
		import_onerror() {
			this.hasFinished = true;
			
			console.warn("Error: resource " + this.key + " Could Not Be Retreived.");
			
			// Test to see if all other requests of the same type have finished
			for (let i = 0; i < this.owner.length; ++i)
				if (!this.owner[i].hasFinished)
					return;
				
			importedContent.callbackCheck();
		},
		
		// Check to see if everything is finished and fire the corrosponding events
		callbackCheck() {
			if (!requests.scripts.called && requests.scripts.finished()) { requests.scripts.called = true; publicInterface.onscriptload(); }
			if (!requests.images.called  &&  requests.images.finished()) { requests.images.called = true; publicInterface.onimageload(); }
			if (!requests.text.called    &&    requests.text.finished()) { requests.text.called = true; publicInterface.ontextload(); }
			
			if (requests.scripts.called && requests.images.called && requests.text.called) publicInterface.onload();
		}
	};
	
	const printNotice = (notice) => {
		console.log("%c %c %c %c " + notice + " %c %c %c ","background-color: #CCCCCC;","background-color: #AAAAAA;","background-color: #777777;","background-color: #444444; color: white;","background-color: #777777;","background-color: #AAAAAA;","background-color: #CCCCCC;");
	}
	
	// Send the batch when the page is done loading
	(window.addEventListener) ?
		window.addEventListener("load",requests.sendBatch):
		window.attachEvent("onload",requests.sendBatch);
	
	// Public Interface
	const publicInterface = {};
	
	publicInterface.SCRIPT = 0;
	publicInterface.IMAGE  = 1;
	publicInterface.TEXT   = 2;
	
	publicInterface.import = (type,key,url) => {
		switch(type) {
			case publicInterface.SCRIPT: requests.importScript(key); break;
			case publicInterface.IMAGE:  requests.importImage(key,url);  break;
			case publicInterface.TEXT:   requests.importText(key,url);   break;
		}
	}
	
	// Retreive loaded content
	publicInterface.getImage = (key) => importedContent.images[key];
	publicInterface.getText  = (key) => importedContent.text[key];
	
	// Public event handlers (overwrite to use)
	publicInterface.onscriptload = () => undefined;
	publicInterface.onimageload  = () => undefined;
	publicInterface.ontextload   = () => undefined;
	publicInterface.onload		 = () => undefined;
	
	publicInterface.printNotice = (notice) => printNotice(notice);
	
	globalNamespace.resource = publicInterface;
	
	printNotice("Resource.js © Casey Smalley 2017");
	
}(program));
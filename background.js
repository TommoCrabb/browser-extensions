console.log("So far, so good!");
/*
import { test } from "./modules.js";
console.log(`${test} was successfully imported.`);
//importModules();

function importModules(){
    import("./modules.js").then(celebrate)
}

function celebrate(arg){
    console.log("Hooray! The following was successfully imported:");
    console.log(arg);
}
*/

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received!");
    chrome.tabs.insertCSS({
        file: "keyboard-mode.css"
    });
    chrome.tabs.executeScript({
        file: "keyboard-mode.js"
    });
});
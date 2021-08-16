console.log("keyboard-mode activated");

// This only works with Firefox versions >= 89 
function importModules(){
    var mods = chrome.runtime.getURL("modules.js");
    import(mods).then(celebrate).catch((e) => console.log("Oh no! Import failed!"));
}

function celebrate(arg){
    console.log("Hooray! The following was successfully imported:");
    console.log(arg);
}

class linkTag {
    constructor(args){
        this.dom = document.createElement("div");
        this.dom.className = "linkTag";
        if (args.id) {
            this.dom.innerText = args.id;
            this.dom.setAttribute("data-linkTagId", args.id);
        }
        if (args.target) {
            //console.log("id:", args.id, "=", args.target);
            this.dom.targetLink = args.target;
        }
        if (args.box) {
            //this.parent = args.parent;
            this.dom.targetBox = args.box;
            this.dom.style.top = this.dom.targetBox.top + "px";
            this.dom.style.left = this.dom.targetBox.left + "px";
            document.body.appendChild(this.dom);
            this.dom.addEventListener("mouseenter", this.mouseEnter)
            this.dom.addEventListener("mouseleave", this.mouseLeave)
            //console.log("done");
        }
    }
    mouseEnter(){
        //this.parentElement.classList.add("highlightedLink");
        this.outline = document.createElement("div");
        document.body.appendChild(this.outline);
        this.outline.className = "taggedLinkOutline";
        //let box = this.parentElement.getBoundingClientRect();
        ["top","left","height","width"].forEach((v,i,a) => this.outline.style[v] = this.targetBox[v] + "px");
        //this.outline.style.position = "fixed";
    }
    mouseLeave(){
        //this.parentElement.classList.remove("highlightedLink");
        this.outline.remove();
    }
}

function* idMaker(){
    var index = 1;
    while (true) yield index++;
}

function tagLinks(){
    // Remove old tags
    let tags = document.getElementsByClassName("linkTag");
    for (let tag of tags) tag.remove();
    for (let link of document.links) link.classList.remove("taggedLink");
    // Make new tags
    const getId = idMaker();
    for (let link of document.links){
        let r = link.getClientRects()[0];
        if (
            !r || r.width == 0 || r.height == 0 || r.bottom < 0 || r.right < 0 || 
            r.top > window.innerHeight || r.left > window.innerWidth
        ) continue
        let s = window.getComputedStyle(link);
        if (s.display == "none" || s.visibility == "hidden") continue
        
        let tag = new linkTag({
            target: link,
            box: r,
            id: getId.next().value
        });
    }
}


tagLinks();
importModules();

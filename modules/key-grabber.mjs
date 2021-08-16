// @ts-check

/**
 * ISSUES: 
 *      - The key-press data is parsed for every map in the stack. Move operation from key-mapper to key-grabler(?)
 * TODO:
 *      - [ ] Make [info.map] a map that can hold arbitrary key/value pairs.
 *      - [ ] Make shortcut the only key in [info.map] that can't be set manually.
 *      - [ ] Allow mappings to be added and removed.
 *      - [ ] Make maps stackable
 *   
 * DESCRIPTION:
 * 
 * This module exports a single class - keyMapper. 
 * 
 * The purpose of keyMapper is to provide a generic tool for intercepting keyboard input and 
 * using it to fire external functions.
 * Internally, keyMapper uses two maps: 
 *      keys => ["shortcut", <function>]
 *      info => [<function>, [map]]
 * Using the second map is optional. It saves a short description of the function, which can be used 
 * to generate documentation, help screens, interactive re-mapping tools, etc.
 */

/**
 * @progress 100%
 * The key-grabler maintains an array of key-maps (the stack) and listens for key-down events.
 * Events are passed to the "match()" function of each map in the stack (stepping through in reverse order),
 * until either a map returns "false", or the end of the stack (index[0]) is reached.
 * 
 * By default, key-grabler should be attached to the global window as "window.$keyGrabler".
 * This allows extensions to share grablers and stops grablers from proliferating. 
 * Having more than one grabler per tab is not recommended.
 */
class keyGrabler {
    #shiftable = "Enter Space Tab Backspace Escape ArrowUp ArrowDown ArrowLeft ArrowRight".split(/\s+/);
    #status = "unborn"; // One of: [unborn|awake|asleep|dead]
    #stack = [];
    
    constructor() {
        this.grable = this.grable.bind(this);
        window.addEventListener("keydown", this.grable);
        this.#status = "awake";
    }

    grable(event) {
        if (this.#status != "awake") return;
        event.$key = this.#formatKeyInput(event);
        this.#stack.reduceRight(this.#grable_cb, event);
    }
    #grable_cb(event, map) { // Callback function for the main loop in the grable method.
        if (event === false) return false;
        else if (map.match.call(map, event) === false) return false;
        else if (map.match.call(map, event) === true) return event;
        else return event; // Change this to false to change default behaviour.
    }
    add(map) {
        this.remove(map);
        this.#stack.push(map);
    }
    remove(map) {
        this.#stack.reduceRight(this.#remove_cb, map);
    }
    #remove_cb(arg, val, idx, lst) { // Callback function for the main loop in the remove method.
        if (arg === val) lst.splice(idx, 1);
        else return arg;
    }
    sleep() { 
        this.#status = "asleep"; 
    }
    wake() { 
        this.#status = "awake"; 
    }
    get status() { 
        return this.#status; 
    }
    kill() {
        window.removeEventListener("keydown", this.grable);
        this.#status = "dead";
    }
    /**
     * Takes the object generated from a keydown event and spits out a string in "map-key" format.
     * This can then be used to search for a match with eg: "this.keys.get(VALUE)".
     * NOTE: This is for parsing keyboard input, not for setting up mappings.
     * @param {Object} e A "keydown" keyboard event.
     * @returns {String} A keycode in the format "space a c s".
     */
     #formatKeyInput(e){
        let x = e.key.toLowerCase();
        if (e.altKey == true) x = x + " a";
        if (e.ctrlKey == true) x = x + " c";
        if (e.shiftKey == true && e.code in this.#shiftable) x = x + " s";
        return x;
    }

}

/**
 * @progress 30%
 */
class keyMapper {
   
    #shortcuts = new Map();
    #functions = new Map();
    #defaultShortcuts;
    #defaultFunctions;
    #opts = {
        grabler: null, // If non-null, will default to window.$keyGrabler.
        skip: false, // Used to enable or disable the key-map without completely removing it from grabler.
        this: null, // If non-null, will be used when calling functions that don't have a "$.this" property.
        bindings: null, // The default set of key-bindings.
        preventDefaultOnHit: true, // If key-code is matched, prevent default action.
        preventDefaultOnMiss: true, // If key-code is NOT matched, prevent default action.
        grablerPassthroughOnHit: false, // Allow grabbler to pass input down the stack when key-code is matched.
        grablerPassthroughOnMiss: false, // Allow grabbler to pass input down the stack when key-code is NOT matched.
    }

    constructor(args){

        // Options
        for (let x in args){
            if (x in this.#opts) this.#opts[x] = args[x];
        }

        // Grabler
        if (!this.#opts.grabler) { // What about dead or sleeping grablers?
            if (!window["$keyGrabler"]) window["$keyGrabler"] = new keyGrabler();
            this.#opts.grabler = window["$keyGrabler"];
        }

        // Bindings
        if (this.#opts.bindings){
            this.multibind(this.#opts.bindings);
            this.#defaultFunctions = new Map(this.#functions);
            this.#defaultShortcuts = new Map(this.#shortcuts);
        }
    }

    restoreDefaults(){
        if (this.#defaultFunctions instanceof Map) {
            this.#functions = new Map(this.#defaultFunctions);
            this.#shortcuts = new Map(this.#defaultShortcuts);
        }
    }
    skip(){
        this.#opts.skip = true;
    }
    unskip(){
        this.#opts.skip = false;
    }
    engrable(){
        this.#opts.grabler.add.call(this.#opts.grabler, this);
    }
    degrable(){
        this.#opts.grabler.remove.call(this.#opts.grabler, this);
    }

    /**
     * Takes the object generated from a keydown event, passes it through parseKeyInput(), and then matches 
     * the resulting string against the keys in [keys]. If a match is found, the appropriate function is executed.
     * Bubbling may be prevented, depending on the values of [opts.blockHit] & [opts.blockMiss].
     * @param {object} e The object generated from a "keydown" event.
     */
    match(e){
        if (this.#opts.skip === true) return true; // Skip if skip option set to true.
        if (!this.#shortcuts.has(e.$key)){ // If key-code NOT in key-map ...
            if (this.#opts.preventDefaultOnMiss === true) e.preventDefault();
            return this.#opts.grablerPassthroughOnMiss;
        } else { // if key-code IS in key-map ...
            if (this.#opts.preventDefaultOnHit === true) e.preventDefault();
            let f = this.#shortcuts.get(e.$key); // Assign the function to variable "f".
            if (f?.$?.this) f.call(f.$.this); // Get "this" from info attached to function.
            else if (this.#opts.this) f.call(this.#opts.this); // Get "this" from options.
            else f(); // Default "this". For methods bound during class construction.
            return this.#opts.grablerPassthroughOnHit;
        }
    }

    bind(func, key, info){
        if (!this.#functions.has(func)) this.#functions.set(func, new Set());
        if (key){
            this.#functions.get(func).add(key);
            this.#shortcuts.set(key, func);
        }
        if (info) func.$ = info;
    }
    unbind(key){
        let f = this.#shortcuts.get(key);
        this.#shortcuts.delete(key);
        this.#functions.get(f).delete(key);
    }
    multibind(arg){
        if (Array.isArray(arg)) this.bindFromArray(arg); // More flexible, but longer syntax.
        else if (arg instanceof Map) this.bindFromMap(arg); // Wipes out and replaces all bindings.
        else if (arg instanceof Object) this.bindFromObject(arg); // Shorter syntax, but less flexible.
        else console.log("ERROR: Failed to parse binding data.");
    }
    bindFromMap(arg){
        this.#functions = arg;
        this.#shortcuts = new Map();
        for (let [fun, set] of this.#functions.entries()){
            for (let str of set) this.#shortcuts.set(str, fun);
        }
    }
    bindFromArray(arg){
        for (let a of arg){
            if (a[2]) a[0].$ = a[2]; // Attach metadata to funcion
            if (Array.isArray(a[1])){
                for (let k of a[1]) this.bind(a[0], k) // For multiple key-bindings
            } else {
                this.bind(a[0], a[1]) // For a single key-binding
            }
        }
    }
    bindFromObject(arg){
        for (let x in arg) this.bind(arg[x], x);
    }
        
}

class test {
    constructor(id){
        this.id = id;
        this.keymap = new keyMapper({
            this: this,
            bindings: [
                [this.forward, "f c", {Description: "Move the cursor forward by one character."}],
                [this.backward, ["b c", "h"], {Description: "Move the cursor backward by one character."}],
                [this.forward, "l"],
            ],
        });
        this.keymap.engrable();
    }
    forward(){
        console.log("forward", this);
    }
    backward(){
        console.log("backward", this);
    }
}

var x = new test(15);
console.log("Ready");
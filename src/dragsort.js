;(function(root, factory){
    var define = define || {};
    if( typeof define === 'function' && define.amd )
        define([], factory);
    else if( typeof exports === 'object' && typeof module === 'object' )
        module.exports = factory();
    else if(typeof exports === 'object')
        exports["DragSort"] = factory()
    else
        root.DragSort = factory()
}(this, function(){
    var _id = 0,
        _current = {}, // currently-dragged element
        _instances = {}

    https://stackoverflow.com/a/14570614/104380
    var observeDOM = (function(){
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        return function( obj, callback ){
            if( !obj || obj.nodeType !== 1 ) return; // validation

            if( MutationObserver ){
                // define a new observer
                var obs = new MutationObserver(function(mutations, observer){
                    callback(mutations)
                })

                obs.observe(obj, {childList:true, subtree:false})
            }

            else if( window.addEventListener )
                obj.addEventListener('DOMNodeInserted', callback, false)
        }
    })()

    function DragSort(elm, settings) {
        if (!elm) return this;

        settings = settings || {}
        this.parentElm = elm;
        this.uid = settings.uid;

        this.settings = {
            selector: '*',
            callbacks: {}
        }

        Object.assign(this.settings, settings)

        this.setup()
        observeDOM(this.parentElm, this.setup.bind(this))
        this.bindEvents()
    }

    DragSort.prototype = {
        namespace: 'dragsort',

        setup() {
            // remove non-element nodes
            [...this.parentElm.childNodes].forEach(elm => {
                if (elm.nodeType != 1)
                    return elm.parentNode.removeChild(elm)
                // set the "draggable" property on what's left
                // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable

                if( elm.matches(this.settings.selector) )
                    elm.draggable = true
            })

            this.gap = this.getItemsGap(this.parentElm.firstElementChild)
        },

        throttle(cb, limit) {
            var wait = false;
            var that = this;
            return function (args) {
                if (!wait) {
                    cb.call(that, args);
                    wait = true;
                    setTimeout(() => wait = false, limit)
                }
            }
        },

        getDraggableElm(elm) {
            if( !elm.closest ) return null

            var draggableElm = elm.closest('[draggable="true"]')
            // only allow dragging/dropping inside the same parent element
            return (this.uid == _current.uid) ? draggableElm : null
        },

        dragstart(e, elm) {
            _current = this

            var draggableElm = this.getDraggableElm(elm),
                clientRect;

            if (!draggableElm) {
                _current = {}
                return
            }

            this.source = this.getInitialState()
            this.target = this.getInitialState()

            clientRect = draggableElm.getBoundingClientRect() // more accurate than offsetWidth/offsetHeight (not rounded)

            this.source.elm = draggableElm
            this.source.idx = this.getNodeIndex(draggableElm)
            this.source.size.width = clientRect.width
            this.source.size.height = clientRect.height

            // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
            e.dataTransfer.effectAllowed = 'move'

            // https://stackoverflow.com/q/19639969/104380
            setTimeout(this.afterDragStart.bind(this))
        },

        afterDragStart() {
            var prop = this.settings.mode == 'vertical' ? 'height' : 'width'

            this.parentElm.classList.add(`${this.namespace}--dragStart`)

            // hiding the source element with transition, the initial "width" is set to occupy the same space
            this.source.elm.style[prop] = this.source.size[prop] + 'px'

            this.source.elm.classList.add(`${this.namespace}--dragElem`)
        },

        dragover(e) {
            e.preventDefault()
            e.stopPropagation()

            var elm = e.target;

            elm = this.getDraggableElm(elm)

            if (!elm || !this.target) return;

            var prevTarget = {
                elm: this.target.elm,
                hoverDirection: this.target.hoverDirection
            }

            e.dataTransfer.dropEffect = "move";

            this.target.hoverDirection = this.getTargetDirection(e);
            // Continue only if there was a reason for a change
            if (prevTarget.elm != elm || prevTarget.hoverDirection != this.target.hoverDirection)
                this.directionAwareDragEnter(e, elm);
        },

        dragenter(e, elm) {
            elm = this.getDraggableElm(elm);

            if (!elm || !this.target) return;

            if (!this.isValidElm(elm) || this.source.elm == elm || !this.source.elm)
                return;

            this.target.bounding = elm.getBoundingClientRect();
        },

        // only gets called once the mouse direction is knowsn (entering from left/right)
        directionAwareDragEnter(e, elm) {
            e.preventDefault();
            e.stopPropagation();

            var idxDelta;

            e.dataTransfer.dropEffect = 'none';

            if (!this.isValidElm(elm) || this.source.elm == elm || !this.source.elm)
                return;

            e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
            this.cleanupLastTarget();
            this.target.elm = elm;
            this.target.idx = this.getNodeIndex(elm);
            elm.classList.add('over');

            // if target is same as the source, un-hide the source
            idxDelta = Math.abs(this.target.idx - this.source.idx);

            this.source.elm.classList.toggle(`${this.namespace}--hide`, idxDelta > 0);

            //   if( this.isTargetLastChild() && this.target.hoverDirection )
            //       return;

            if (this.settings.mode == 'vertical')
                this.target.elm.style[this.target.hoverDirection ? 'marginBottom' : 'marginTop'] = this.source.size.height + this.gap + 'px';
            else
                this.target.elm.style[this.target.hoverDirection ? 'marginRight' : 'marginLeft'] = this.source.size.width + this.gap + 'px';
        },

        dragend(e) {
            clearTimeout(this.dragoverTimeout);
            this.dragoverTimeout = null;
            this.parentElm.classList.remove(`${this.namespace}--dragStart`);

            if (!this.isValidElm(this.target.elm)) {
                return this.cleanup();
            }

            var insertBeforeElm = this.target.hoverDirection ? this.target.elm.nextElementSibling : this.target.elm;


            if (this.source.elm != this.target.elm && this.target.elm) {
                this.target.elm.classList.add(`${this.namespace}--noAnim`)
                this.cleanup();
                this.parentElm.insertBefore(this.source.elm, insertBeforeElm);
            }

            this.source.elm && this.source.elm.classList.remove(`${this.namespace}--dragElem`, `${this.namespace}--hide`)
            this.settings.callbacks.dragEnd(this.source.elm)

            return this
        },

        /////////////////////////////

        isTargetLastChild() {
            return this.parentElm.lastElementChild == this.target.elm;
        },

        getTargetDirection(e) {
            if (!this.target.bounding) return;
            return this.settings.mode == 'vertical' ?
                e.pageY > (this.target.bounding.top + this.target.bounding.height / 2) ? 1 : 0 :
                e.pageX > (this.target.bounding.left + this.target.bounding.width / 2) ? 1 : 0
        },

        getNodeIndex(node) {
            var index = 0;
            while ((node = node.previousSibling))
                if (node.nodeType != 3 || !/^\s*$/.test(node.data))
                    index++;
            return index;
        },

        isValidElm(elm) {
            return elm && elm.nodeType && elm.parentNode == this.parentElm;
        },

        cleanup() {
            _current = {};

            [...this.parentElm.children].forEach(elm => {
                elm.removeAttribute('style')
                setTimeout(() => {
                    elm.classList.remove(`${this.namespace}--over`, `${this.namespace}--noAnim`, `${this.namespace}--dragElem`)
                }, 50)
            })

            return;
        },

        cleanupLastTarget() {
            if (this.target.elm) {
                this.target.elm.classList.remove(`${this.namespace}--hide`, `${this.namespace}--over`)
                this.target.elm.removeAttribute('style');
            }
        },

        getInitialState() {
            return {
                elm: null,
                size: {}
            }
        },

        getItemsGap(elm) {
            var styles = getComputedStyle(elm);
            return this.settings.mode == 'vertical' ?
                parseInt(styles.marginTop) + parseInt(styles.marginBottom) :
                parseInt(styles.marginLeft) + parseInt(styles.marginRight)
        },

        bindEvents(unbind) {
            this.listeners = this.listeners || {
                dragstart: e => this.dragstart(e, e.target),
                dragenter: e => this.dragenter(e, e.target),
                dragend  : e => this.dragend(e, e.target),
                dragover : this.throttle(this.dragover, 350),
            }

            for (var method in this.listeners)
                this.parentElm[unbind ? "removeEventListener" : "addEventListener"](method, this.listeners[method])
        },

        destroy() {
            this.cleanup()
            this.bindEvents(true)
            delete _instances[this.uid]
        }
    }

    /////////////////////////////////////
    // Factory
    return function (elm, settings) {
        // if this "elm" has already been initialized with DragSort, return last DragSort instance and do not create a new one
        _instances[++_id] = elm["DragSort"]
            ? _instances[elm["DragSort"]]
            : new DragSort(elm, {...settings, uid: _id})

        elm["DragSort"] = _id
        return _instances[_id]
    }
}));
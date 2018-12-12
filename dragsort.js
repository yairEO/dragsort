function DragSort(parentElm) {
    if (!parentElm) return this;

    this.parentElm = parentElm;
    this.setup();

    this.settings = {
        gap: this.getItemsGap(parentElm.firstElementChild)
    }

    this.bindEvents();
}

DragSort.prototype = {
    namespace: 'dragsort',
    setup() {
        // enables each list item to be draggable
        [...this.parentElm.childNodes].forEach(elm => {
            if (elm.nodeType != 1)
                return elm.parentNode.removeChild(elm);
            elm.draggable = true;
        })
    },

    getDraggableElm(elm) {
        return elm.closest('[draggable]');
    },

    afterDragStart() {
        this.parentElm.classList.add(`${this.namespace}--dragStart`);

        // for hiding the source element with transition, the initial "width" style must be set
        this.source.elm.style.width = this.source.elm.clientWidth + 'px';

        this.source.elm.classList.add(`${this.namespace}--dragElem`);
    },

    dragstart(e, elm) {
        var draggableElm = this.getDraggableElm(elm);
        if (!draggableElm) return;

        this.source = this.getInitialState();
        this.target = this.getInitialState();


        this.source.elm = draggableElm;
        this.source.idx = this.getNodeIndex(draggableElm);
        this.source.size.width = draggableElm.offsetWidth //elm.getBoundingClientRect();

        e.dataTransfer.effectAllowed = 'move';

        // https://stackoverflow.com/q/19639969/104380
        setTimeout(this.afterDragStart.bind(this));
    },

    dragover(e, elm) {
        e.preventDefault();
        e.stopPropagation();

        elm = this.getDraggableElm(elm);

        var prevTarget = {
            elm: this.target.elm,
            hoverDirection: this.target.hoverDirection
        };

        // throttle
        if (!this.dragoverTimeout)
            this.dragoverTimeout = setTimeout(() => {
                this.target.hoverDirection = this.getTargetDirection(e);
                // Continue only if there was a reason for a change
                if (prevTarget.elm != elm || prevTarget.hoverDirection != this.target.hoverDirection)
                    this.directionAwareDragEnter(e, elm);

                this.dragoverTimeout = null;
            }, 100)
    },

    dragenter(e, elm) {
        var draggableElm = this.getDraggableElm(elm);

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

        if (this.isTargetLastChild() && this.target.hoverDirection)
            return;

        this.target.elm.style[this.target.hoverDirection ? 'marginRight' : 'marginLeft'] = this.source.size.width + this.settings.gap + 'px';
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

        return false;
    },

    /////////////////////////////

    isTargetLastChild() {
        return this.parentElm.lastElementChild == this.target.elm;
    },

    getTargetDirection(e) {
        if (!this.target.bounding) return;
        return e.pageX > (this.target.bounding.left + this.target.bounding.width / 2) ? 1 : 0;
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
        return parseInt(styles.marginLeft) + parseInt(styles.marginRight);
    },

    bindEvents() {
        var names = ['dragstart', 'dragover', 'dragenter', 'dragend'];

        names.forEach(name =>
            this.parentElm.addEventListener(name, e => this[name](e, e.target))
        )
    }
}
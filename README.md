<a align="center" title="See live demo" href="https://codepen.io/vsync/pen/3f6b998fa1bb1b7c7f74ec89152f39f9/?editors=0100">

![drag-sort demo](https://raw.githubusercontent.com/yairEO/dragsort/master/demo.gif)

</a>

<p align="center">
  <a href='https://www.npmjs.com/package/@yaireo/dragsort'>
      <img src="https://img.shields.io/npm/v/@yaireo/dragsort.svg" />
  </a>
  <a href='https://simple.wikipedia.org/wiki/MIT_License'>
      <img src="https://img.shields.io/badge/license-MIT-lightgrey" />
  </a>
  <img src="https://img.shields.io/bundlephobia/minzip/@yaireo/dragsort" />
  <img src="https://img.shields.io/npm/dw/@yaireo/dragsort" />
</p>

<h1 align="center"><a href="https://codepen.io/vsync/pen/3f6b998fa1bb1b7c7f74ec89152f39f9/?editors=0100">DragSort</a> <br><small>lightweight HTML5 drag-&-drop sorting</small></h1>


## Installation
```sh
npm i @yaireo/dragsort --save
```

## Pre-setup suggestions:

* Set `box-sizing: border-box` on the list or its children is a good idea
* Use the provided stylesheet in this package - `dist/dragsort.css`

## Usage

#### HTML
```html
<ul class="list">
    <li>drag & drop</li>
    <li>items</li>
    <li>easily</li>
    <li>with this</li>
    <li>super lightweight script</li>
</ul>
```

#### javascript
```js
import DragSort from '@yaireo/dragsort'
import '@yaireo/dragsort/dist/dragsort.css'

const listElm = document.querySelector('.list')
const dragSort = new DragSort(listElm)
```

> Note - useful *class* names are set on elements being dragged.

## Settings

Name                    | Type        | Default                                    | Info
----------------------- | ----------- | ------------------------------------------ | --------------------
selector                | `String`    | all child nodes of first parameter         | which elements should be draggable
mode                    | `String`    |                                            | Use `"vertical"` for vertical-lists re-ordering
callbacks.dragStart     | `Function`  |                                            | callback function when dragging started. Arguments are `(element, event)`
callbacks.dragEnd       | `Function`  |                                            | callback function when dragging finished. Arguments are `(element, event)`
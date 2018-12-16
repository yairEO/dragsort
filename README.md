[dragSort](https://codepen.io/vsync/pen/3f6b998fa1bb1b7c7f74ec89152f39f9/?editors=0100) - Animated drag sorting for horizontal list items
========


<a align="center" href="https://codepen.io/vsync/pen/3f6b998fa1bb1b7c7f74ec89152f39f9/?editors=0100">
    
![Watch the video](https://raw.githubusercontent.com/yairEO/dragsort/master/demo.gif)

</a>





## Installation

    npm i @yaireo/dragsort --save

    // usage:
    import DragSort from '@yaireo/dragsort'

    var dragsort = new DragSort(...)

## Usage

### HTML

    <ul class="list">
        <li>A</li>
        <li>BBBBB</li>
        <li>CCCCCCCCC</li>
        <li>DDDD DDDDDDDD</li>
        <li>EE</li>
    </ul>

### javascript

    var listElm = document.querySelector('.list'),
        dragSort = new DragSort(listElm);

## Pre-setup suggestions:

* Set `box-sizing: border-box` on your list's children is a good idea
* Should include the `dragsort.css` file (from this repository)

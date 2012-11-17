/* 
    Document   : main
    Created on : 15/11/2012, 7:46:46 AM
    Author     : Alan Dennis Eaton <alan.dennis.eaton@gmail.com>
    Description:
        Purpose of the script follows.
*/

'use strict';

//-----------------------------------------------------------------
btk.define({
    name: 'main@proofassistant',
    load: true,
    libs: {
        base: 'base@common',
        logic: 'logic@proofassistant'
    },
    css: [
        'main@proofassistant'
    ],
    when: [
        'state::document.loaded'
    ],
    init: function(libs, exports) {

        //---------------------------------------------------------
    }   // end init
}); // end define

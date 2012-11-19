/* 
    Document   : widgets
    Created on : 19/11/2012, 2:53:34 AM
    Author     : Alan Dennis Eaton <alan.dennis.eaton@gmail.com>
    Description:
        Purpose of the script follows.
*/

'use strict';

//-----------------------------------------------------------------
// widgets to manage display and coordination
//-----------------------------------------------------------------
btk.define({
    name: 'widgets@proofassistant',
    load: true,
    libs: {
        de : 'element@wtk',
        term: 'terminal@wtk',
        menu: 'menu@wtk'
    },
    css : [
        'base@wtk',
        'box@wtk',
        'scroll-plain@wtk',
        'widgets@proofassistant'
    ],
    init: function(libs, exports) {
        
        var page = btk.global.page;
        
        var de = libs.de;
        var Terminal = libs.term;
        
        var inherits = btk.inherits;
        
        page.widgets = de.widgets;


        //---------------------------------------------------------
        function WPView(proof, controller) {
    		WPView.SUPERCLASS.call(this, 'div');
            
            proof.widgets = {};
            proof.widgets.view = this;
            
            proof.onAnnotation = function(pelement) {
                controller.onAnnotation(pelement);
            };
            
            proof.onAppend = function(pelement) {
                controller.onAppend(pelement);
            };
            
            proof.onClose = function(proof) {
                controller.onClose(proof);
            };
            
            this
                .klass('wpview')
                .klass('box')
                .klass('vertical')
                .child(de('wpframe', proof, controller))
                .child(de('wpconsole', proof, controller))
                ;
        }
        inherits(WPView, de.dElement);
        
        de.widgets.wpview = WPView;
        
        
        //---------------------------------------------------------
        function WPConsole(proof, controller) {
    		WPConsole.SUPERCLASS.call(this, 'div');
            
            proof.widgets.console = this;
            
            function onSubmit(value) {
                controller.onSubmit(value);
            }
					
            var terminal = new Terminal({
                'prompt': proof.indexString(),
                'submit': onSubmit,
                'theme' : 'grey'
            });
			controller.setTerminal(terminal);
            
            this
                .klass('wpconsole')
                .child(terminal)
                ;
        }
        inherits(WPConsole, de.dElement);
        
        de.widgets.wpconsole = WPConsole;
        
        
        //---------------------------------------------------------
        function WPFrame(proof, controller) {
    		WPFrame.SUPERCLASS.call(this, 'div');
            
            proof.widgets = proof.widgets || {};
            proof.widgets.frame = this;
            
            this
                .klass('wpframe')
                .klass('flex')
                .klass('box')
                .klass('vertical')
                .child(de('wphead', proof, controller))
                .child(de('wpbody', proof, controller))
                ;
        }
        inherits(WPFrame, de.dElement);
        
        de.widgets.wpframe = WPFrame;
        
        
        //---------------------------------------------------------
        function WPHead(proof, controller) {
    		WPHead.SUPERCLASS.call(this, 'div');
            
            proof.widgets.head = this;
            
            var mode = '';
            var head = proof.name || 'ROOT';
            
            if (proof.getRoot) {
                mode = 'from';
                head = proof.getRoot();
            }
            
            if (proof.getTarget) {
                mode = 'show';
                head = proof.getTarget();
            }
            
            this
                .klass('wphead')
                .klass('wplstatement')
                .klass('box')
                .klass('vertical')
                .child(mode + ' ' + head.toString())
                //.child(de('wplannotation',proof))
                .on('click', function() {
                    controller.onSelect(proof);
                })
                ;
            
            if (!proof.getParent()) {
                this.klass('top');
            }
            else if (!proof.isClosed()) {
                this.klass('open');
            }
        }
        inherits(WPHead, de.dElement);
        
        de.widgets.wphead = WPHead;
        

        //---------------------------------------------------------
        function WPBody(proof, controller) {
    		WPBody.SUPERCLASS.call(this, 'div');
            
            proof.widgets.body = this;
            
            this
                .klass('wpbody')
                .klass('flex')
                .klass('box')
                .klass('vertical')
                ;
                
            var ss = proof.statements;
            var l = ss.length;
            
            for(var i=0; i<l; i++) {
                this.child(de('wpline',ss[i], controller));
            }
        }
        inherits(WPBody, de.dElement);
        
        de.widgets.wpbody = WPBody;
        

        //---------------------------------------------------------
        function WPLine(pelement, controller) {
    		WPLine.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wpline')
                .klass('box')
                .klass('horizontal')
                .child(de('wplindex',pelement))
                .start('div')
                    .klass('wplgap')
                .end()
                ;
                
            if (pelement.isProof()) {
                this.child(de('wpframe',pelement, controller));
            }
            else {
                this.child(de('wplstatement', pelement));
            }
        }
        inherits(WPLine, de.dElement);
        
        de.widgets.wpline = WPLine;
        

        //---------------------------------------------------------
        function WPLIndex(pelement) {
    		WPLIndex.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wplindex')
                .child(pelement.getIndex().toString())
                ;
        }
        inherits(WPLIndex, de.dElement);
        
        de.widgets.wplindex = WPLIndex;
        
        
        //---------------------------------------------------------
        function WPLStatement(pelement) {
    		WPLStatement.SUPERCLASS.call(this, 'div');
            
            pelement.widgets = {
                'statement': this
            }
            
            this
                .klass('wplstatement')
                .klass('box')
                .klass('vertical')
                .klass('flex')
                .child(pelement.toString())
                ;
                
                if (pelement.getAnnotation()) {
                    pelement.widgets.annotation = de('wplannotation',pelement);
                    this.child(pelement.widgets.annotation);
                }
        }
        inherits(WPLStatement, de.dElement);
        
        de.widgets.wplstatement = WPLStatement;
        
        
        //---------------------------------------------------------
        function WPLAnnotation(pelement) {
    		WPLAnnotation.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wplannotation')
                .child(pelement.getAnnotation().toString())
                ;
        }
        inherits(WPLAnnotation, de.dElement);
        
        de.widgets.wplannotation = WPLAnnotation;
        
        
        //---------------------------------------------------------
	
    }   //end init
}); // end define

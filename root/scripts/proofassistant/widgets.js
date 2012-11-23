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
                .klass('flex')
                .klass('box')
                .klass('vertical')
                .child(de('wptop', proof, controller))
                .child(de('wpconsole', proof, controller))
                ;
        }
        inherits(WPView, de.dElement);
        
        de.widgets.wpview = WPView;
        
        
        //---------------------------------------------------------
        function WPTop(proof, controller) {
    		WPTop.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wptop')
                .klass('flex')
                .klass('box')
                .klass('viewframe')
                .start('div')
                    .klass('viewport')
                    .klass('scroll-plain')
                    .child(de('wpframe', proof, controller))
                .end()
                ;
        }
        inherits(WPTop, de.dElement);
        
        de.widgets.wptop = WPTop;
        
        
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
                .klass('box')
                .child(terminal)
                ;
        }
        inherits(WPConsole, de.dElement);
        
        de.widgets.wpconsole = WPConsole;
        
        
        //---------------------------------------------------------
        function WPFrame(proof, controller) {
    		WPFrame.SUPERCLASS.call(this, 'div');
            
            proof.widgets = proof.widgets || {};
            proof.widgets.root = this;
            
            this
                .klass('wpframe')
                .klass('flex')
                .klass('box')
                .klass('vertical')
                .klass('stretch')
                .child(de('wphead', proof, controller))
                .child(de('wpbody', proof, controller))
                ;
            
            proof.listen({
                'close': function(value) {
                    if (value.sender.id == proof.id) {
                        if (this.view) {
                            this.view.classList.remove('selected');
                        }
                    }
                }
            }, this)
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
            
            proof.listen({
                'close': function(value) {
                    if (value.sender.id == proof.id) {
                        delete this._klasses['open'];
                        if (this.view) {
                            this.view.classList.remove('open');
                        }
                    }
                }
            }, this)
        }
        inherits(WPHead, de.dElement);
        
        de.widgets.wphead = WPHead;
        

        //---------------------------------------------------------
        function WPBody(proof, controller) {
    		WPBody.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wpbody')
                .klass('box')
                .klass('vertical')
                .klass('stretch')
                ;
                
            var ss = proof.lines;
            var l = ss.length;
            
            for(var i=0; i<l; i++) {
                this.child(de('wpline',ss[i], controller));
            }
            
            proof.listen({
                'append': function(value) {
                    if (value.sender.id == proof.id) {
                        var wpline = de('wpline',value.data, controller);
                        this.child(wpline);
                        if (this.view) {
                            this.view.appendChild(wpline.create())
                        }
                    }
                }
            }, this);
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
                
            if (pelement.isBlock()) {
                this.child(de('wpframe',pelement,controller));
            }
            else {
                this.child(de('wplstatement',pelement,controller));
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
        function WPLStatement(pelement, controller) {
    		WPLStatement.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wplstatement')
                .klass('flex')
                .klass('box')
                .klass('vertical')
                .on('click', function() {
                    pelement.notify('statement.selection.request');
                    //controller.onSelect(pelement);
                })
                ;
                
            this.pelement = pelement;

            this.addProposition();
            
            this.addAnnotation();
            
            pelement.listen({
                'annotate': function(value) {
                    if (value.sender.id == this.pelement.id) {
                        this.removeAnnotation();
                        this.addAnnotation();
                    }
                }
            }, this);
        }
        inherits(WPLStatement, de.dElement);
        
        de.widgets.wplstatement = WPLStatement;
        
        
        (function(p){
        
            p.addProposition = function() {
                var pel = this.pelement;
                
                var wprop = de('wplproposition', pel);
                
                if (this.view) {
                    this.view.appendChild(wprop.create());
                }
                    
                this.setElement('prop', wprop);
            };
            
            p.addAnnotation = function() {
                var pel = this.pelement;
                
                if (pel.getAnnotation()) {
                    var wanno = de('wplannotation',pel);
                    
                    if (this.view) {
                        this.view.appendChild(wanno.create());
                    }
                    
                    this.setElement('anno', wanno);
                }
            };
            
            p.removeAnnotation = function() {
                var wanno = this.getElement('anno');
                
                if (wanno) {
                    if (this.view && wanno.view) {
                        this.view.removeChild(wanno.view);
                    }
                    this.removeElement('anno');
                }
            };
            
            p.create = function() {
                if (this.view) {
                    return this.view;
                }
                
                WPLStatement.SUPER.create.call(this);
                
                var wprop = this.getElement('prop');
                if (wprop) {
                    this.view.appendChild(wprop.create());
                }
                
                var wanno = this.getElement('anno');
                if(wanno) {
                    this.view.appendChild(wanno.create());
                }
                
                return this.view;
            };
            
        	p.toNode = p.create;
            
        })(WPLStatement.prototype);
        
        
        //---------------------------------------------------------
        // TODO
        // format the proposition nicely
        function WPLProposition(pelement) {
    		WPLProposition.SUPERCLASS.call(this, 'div');
            console.log('WPLProposition');
            
            this
                .klass('wplproposition')
                .klass('box')
                .child(pelement.toString())
                ;
        }
        inherits(WPLProposition, de.dElement);
        
        de.widgets.wplproposition = WPLProposition;
        
        
        //---------------------------------------------------------
        function WPLAnnotation(pelement) {
    		WPLAnnotation.SUPERCLASS.call(this, 'div');
            
            this
                .klass('wplannotation')
                .klass('box')
                .child(pelement.getAnnotation().toString())
                ;
        }
        inherits(WPLAnnotation, de.dElement);
        
        de.widgets.wplannotation = WPLAnnotation;
        
        
        //---------------------------------------------------------
	
    }   //end init
}); // end define

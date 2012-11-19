/* 
    Document   : test
    Created on : 18/11/2012, 10:58:43 PM
    Author     : Alan Dennis Eaton <alan.dennis.eaton@gmail.com>
    Description:
        A simple interface for testing
*/

'use strict';

//-----------------------------------------------------------------
btk.define({
    name: 'test@proofassistant',
    load: true,
    libs: {
        logic: 'logic@proofassistant',
        de: 'element@wtk',
        widgets: 'widgets@proofassistant'
    },
    init: function(libs, exports) {

        //---------------------------------------------------------
        var page = btk.global.page;
        
        var l = libs.logic;
        var w = libs.widgets;
        
        var de = libs.de;
            
        var isString = btk.isString;
        var ifString = btk.ifString;


        //---------------------------------------------------------
        function prop(p) {
            var P = l.prop.cache[p];
            if (!P) {
                P = new l.ConstantProposition(p);
                l.prop.cache[p] = P;
            }
            return P;
        }
        l.prop = prop;
        l.prop.cache = {};
        
        function wrap(p) {
            if (p instanceof l.Proposition) {
                return p;
            }
            
            if (isString(p)) {
                return l.prop(p);
            }
            
            return l.error;
        }
        l.wrap = wrap;
        
        function imp(p,q) {
            return new l.Conditional(wrap(p),wrap(q));
        }
        l.imp = imp;
        
        function not(p) {
            return imp(p,l.error);
        }
        l.not = not;
        
        function and(p,q) {
            return new l.Conjunction(wrap(p),wrap(q));
        }
        l.and = and;
        
        function or(p,q) {
            return new l.Disjunction(wrap(p),wrap(q));
        }
        l.or = or;
        
        function iff(p,q) {
            return new and(imp(p,q),imp(q,p));
        }
        l.iff = iff;
        
        
        //---------------------------------------------------------
        function Controller(proof) {
            this.name = proof.name || '';
            this.top = proof;
            this.current = this.top;
            
            proof.onAppend = this.onAppend.bind(this);
        }
        
        (function(p){
            
        })(Controller.prototype);
        
        
        (function (p) {
            
            p.klass = 'Controller';

            p.up = function() {
                this.current = this.current.getParent() || this.current;
                this.current.log();
            };
            
            p.home = function() {
                this.current = this.top;
                this.current.log();
            };
            

            p.select = function(args) {
                var pp = this.top.line(args);
                if (pp && pp.isProof()) {
                    this.onSelect(pp);
                }
                else {
                    this.error([
                        'not a goalproof or subproof: ',
                        '(', args, ')'
                        ].join(''));
                }
                
                return pp;
            };
            
            p.comment = function(text) {
                try {
                    this.current.comment(text);
                } catch (e) {
                    this.error(e.toString());
                }
            };
            
            p.assume = function(P) {
                this.current.assume(P);
            };
            
            p.from = function(P) {
                this.current.from(P);
            };
            
            p.show = function(P) {
                this.current.show(P);
            };


            p.intro = function(X,Y) {
                this.current.intro(X,Y);
            };
            
            p.introLeft = function(X,Y) {
                this.current.introLeft(X,Y);
            };
            
            p.introRight = function(X,Y) {
                this.current.introRight(X,Y);
            };
            
            p.elim = function(X,Y) {
                this.current.elim(X,Y);
            };
            
            p.elimLeft = function(X,Y) {
                this.current.elimLeft(X,Y);
            };
            
            p.elimRight = function(X,Y) {
                this.current.elimRight(X,Y);
            };


            p.close = function() {
                this.current.close();
            };


            p.list = function() {
                this.current.list();
            };
            
            
            p.tasks = function() {
                for(var t in this.current.tasks) {
                    this.current.tasks[t].log();
                }
            };

            //interface for view
            
            p.log = function(msg) {
                if (this.terminal) {
                    this.terminal.log(msg);
                }
            };
            
            p.info = function(msg) {
                if (this.terminal) {
                    this.terminal.info(msg);
                }
            };
            
            p.error = function(msg) {
                if (this.terminal) {
                    this.terminal.error(msg);
                }
            };
            
            p.setTerminal = function(terminal) {
                this.terminal = terminal;
            };
            
            p.setPrompt = function(prompt) {
                if (this.terminal) {
                    this.terminal.commandLine.setPrompt(prompt);
                }
            };
            
            
            // WFFs in prefix form
            // operator case is irrelevant
            //
            function parseWFF(ww) {
                var ops = {
                    'not': function (ww) {
                        return l.not(parseWFF(ww));
                    },
                    'imp': function (ww) {
                        return l.imp(parseWFF(ww), parseWFF(ww));
                    },
                    'iff': function (ww) {
                        return l.iff(parseWFF(ww), parseWFF(ww));
                    },
                    'and': function (ww) {
                        return l.and(parseWFF(ww), parseWFF(ww));
                    },
                    'or': function (ww) {
                        return l.or(parseWFF(ww), parseWFF(ww));
                    }
                };
                
                var token = ww.shift();
                var op = ops[token];
                var P;
                
                if (op) {
                    P = op(ww);
                }
                else {
                    P = l.prop(token);
                }
                
                return P;
            }
            
            function parseWFFs(ww) {
                var output = [];
                
                var P = parseWFF(ww);
                while (P) {
                    output.push(P);
                    P = parseWFF(ww);
                }
                
                return output;
            }
            
            var commands = {
                'select': function(self,w0,ww) {
                    self.select(ww);
                },
                
                'from': function(self,w0,ww) {
                    self.from(parseWFF(ww));
                },
                'show': function(self,w0,ww) {
                    self.show(parseWFF(ww));
                },
                
                'intro': function(self,w0,ww) {
                    self.intro(parseWFF(ww),parseWFF(ww));
                },
                'introLeft': function(self,w0,ww) {
                    self.introLeft(parseWFF(ww),parseWFF(ww));
                },
                'introRight': function(self,w0,ww) {
                    self.introRight(parseWFF(ww),parseWFF(ww));
                },
                
                'elim': function(self,w0,ww) {
                    self.elim(parseWFF(ww),parseWFF(ww));
                },
                'elimLeft': function(self,w0,ww) {
                    self.elimLeft(parseWFF(ww),parseWFF(ww));
                },
                'elimRight': function(self,w0,ww) {
                    self.elimRight(parseWFF(ww),parseWFF(ww));
                },
                
                'comment': function(self,w0,ww) {
                    self.comment(ww.join(' '));
                },
                
                'wff': function(self,w0,ww) {
                    var wff = parseWFF(ww);
                    self.info(wff.toString());
                },
                'wffs': function(self,w0,ww) {
                    var wffs = parseWFFs(ww);
                    for (var i=0,l=wffs.length; i<l; i++) {
                        self.info(wffs[i].toString());
                    }
                },
                
                'error': function(self,w0,ww) {
                    ww.unshift(w0);
                    self.error([
                        'error: unrecognised command: ',
                        ww.join(' ')
                    ].join(''));
                }
            };
            
            p.processCommand = function(value) {
                this.info('processing command: ' + value);
                
                var words = value.split(' ');
                var word0 = words.shift();
                var command = commands[word0] || commands['error'];
                
                try {
                    command(this,word0,words);
                }
                catch(e) {
                        this.error(e.toString());
                }
            };
            
            p.onSubmit = function(value) {
                this.log(this.terminal.commandLine.createEcho());
                this.processCommand(value);
            };
            
            p.offSelect = function() {
                var proof = this.current;
                
                
                var widgets = proof.widgets;
                if (widgets) {
                    var wframe = widgets.frame;
                    wframe.view.classList.remove('selected');
                }
            };
            
            p.onSelect = function(proof) {
                // assumes the parameter IS a proof
                if (proof.isClosed()) {
                    return;
                }
                
                if (proof == this.current) {
                    return;
                }
                
                this.offSelect();
                
                this.current = proof;
                this.log(proof.textHead());
                this.setPrompt(proof.indexString());
                
                var widgets = proof.widgets;
                if (widgets) {
                    var wframe = widgets.frame;
                    wframe.view.classList.add('selected');
                }
            };
            
            p.onAppend = function(pelement) {
                this.info('appended: ' + pelement.indexString());
                var parent = pelement.getParent();
                var widgets = parent.widgets;
                
                if (widgets) {
                    var wbody = widgets.body;
                    wbody.view.appendChild(de('wpline',pelement,this).create());
                }
            };
            
            p.onAnnotation = function(pelement) {
                this.info('annotated: ' + pelement.indexString());
                var widgets = pelement.widgets;
            
                if (widgets) {
                    var wstat = widgets.statement;
                    if (wstat) {
                        var wanno = widgets.annotation;
                        if (wanno) {
                            wstat.view.removeChild(wanno.view);
                        }
                        wanno = de('wplannotation',pelement)
                        wstat.view.appendChild(wanno.create());
                        widgets.annotation = wanno;
                    }
                }
            };
            
            p.onClose = function(proof) {
                this.info('closed: ' + proof.indexString());
                var widgets = proof.widgets;
                
                if (widgets) {
                    var whead = widgets.head;
                    whead.view.classList.remove('open');
                    
                    var wframe = widgets.frame;
                    wframe.view.classList.remove('selected');
                }
                
                var p = proof;
                while (p && p.isClosed()) {
                    p = p.getParent();
                }
                
                p = p || proof.getTop();
                this.onSelect(p);
            };
            
        })(Controller.prototype);
        
        
        //---------------------------------------------------------
        l.p = (function(){
            
            var proofs = {};
            var controller;
            
            var p = function() {
                var args = [].slice.call(arguments,0);
                
                return controller.select(args);
            };

            p.open = function(pname) {
                pname = ifString(pname,'default');
                
                var pc = proofs[pname];
                
                if (!pc) {
                    var pp = new l.Proof();
                    pp.name = pname;
                    pc = new Controller(pp);
                }
                
                proofs[pname] = pc;
                controller = pc;
            };
            
            p.open('default');
            
            p.listProofs = function() {
                for (var name in proofs) {
                    console.info(name);
                }
            };
            
            p.controller = function() {
                return controller;
            };
            
            return p;

        })();


        btk.global.p = l.p;


        //---------------------------------------------------------
        l.t = {};
        
        btk.global.l = l;
        btk.global.t = l.t;

        t.P = prop('p');
        t.Q = prop('q');
        t.R = prop('r');
        
        t.PandQ = and('p', 'q');
        t.PorQ = or('p', 'q');
        t.PtoQ = imp('p', 'q');
        
        p.open('p1');
        p.controller().show(imp(and('p','q'),'p'));
        p(0);
        p.controller().intro();
        
        document.body.appendChild(de('wpview', p(), p.controller()).create())
        
        p.open('p2');
        p.controller().show(imp(imp(or('p','q'),'r'),imp(and('p','q'),'r')));
        p(0);
        p.controller().intro();
        p(0,0,0);
        p.controller().intro();
        
        document.body.appendChild(de('wpview', p(), p.controller()).create())
        
        
        //---------------------------------------------------------
    }   // end init
}); // end define

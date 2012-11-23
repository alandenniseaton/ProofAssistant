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
                P = new l.ConstantStatement(p);
                l.prop.cache[p] = P;
            }
            return P;
        }
        l.prop = prop;
        l.prop.cache = {};
        
        function wrap(p) {
            if (p instanceof l.Statement) {
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
            
            proof.listen({
                'close': function(value) {
                    this.onClose(value.sender);
                },
                'append': function(value) {
                    //do nothing
                },
                'annotate': function(value) {
                    //do nothing
                },
                'default': function(value, message) {
                    this.info([
                        'default handler: ',
                        'type(', message.type, '), ',
                        'parent',(value.parent).indexString(),', ',
                        'sender',(value.sender).indexString(),''
                    ].join(''));
                }
            }, this);
        }
        
        (function (p) {
            
            p.klass = 'Controller';

            p.up = function() {
                var pp = this.current.getParent() || this.current;
                if (pp) {
                    this.onSelect(pp);
                }
                
                return this.current;
            };
            
            p.home = function() {
                this.onSelect(this.top);
                
                return this.current;
            };

            p.select = function(args) {
                if (this.current.isBlock()) {
                    this.onSelect(this.current.selectLine(args));
                }
                else {
                    this.error('select: ' + this.current.indexString() + ' is not a block');
                }
                
                return this.current;
            };
            
            
            p.comment = function(text) {
                if (this.current.isBlock()) {
                    this.current.comment(text);
                }
                else {
                    this.error('comment: ' + this.current.indexString() + ' is not a block');
                }
            };
            
            p.assume = function(P) {
                if (this.current.isBlock()) {
                    this.current.assume(P);
                }
                else {
                    this.error('assume: ' + this.current.indexString() + ' is not a block');
                }
            };
            
            p.from = function(P) {
                if (this.current.isBlock()) {
                    this.current.from(P);
                }
                else {
                    this.error('from: ' + this.current.indexString() + ' is not a block');
                }
            };
            
            p.show = function(P) {
                if (this.current.isBlock()) {
                    this.current.show(P);
                }
                else {
                    this.error('show: ' + this.current.indexString() + ' is not a block');
                }
            };


            p.intro = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.intro(X,Y);
                }
                else {
                    this.current.intro(this.current.getParent(),X,Y);
                }
            };
            
            p.introLeft = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.introLeft(X,Y);
                }
                else {
                    this.current.introLeft(this.current.getParent(),X,Y);
                }
            };
            
            p.introRight = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.introRight(X,Y);
                }
                else {
                    this.current.introRight(this.current.getParent(),X,Y);
                }
            };
            
            p.elim = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.elim(X,Y);
                }
                else {
                    this.current.elim(this.current.getParent(),X,Y);
                }
            };
            
            p.elimLeft = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.elimLeft(X,Y);
                }
                else {
                    this.current.elimLeft(this.current.getParent(),X,Y);
                }
            };
            
            p.elimRight = function(X,Y) {
                if (this.current.isBlock()) {
                    this.current.elimRight(X,Y);
                }
                else {
                    this.current.elimRight(this.current.getParent(),X,Y);
                }
            };


            p.close = function() {
                if (this.current.isBlock()) {
                    this.current.close();
                }
                else {
                    this.error('close: ' + this.current.indexString() + ' is not a block');
                }
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
                else {
                    throw new Error(msg);
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
                        var P = parseWFF(ww);
                        return P? l.not(P): null;
                    },
                    'imp': function (ww) {
                        var P = parseWFF(ww);
                        var Q = parseWFF(ww);
                        return (P && Q)? l.imp(P, Q): null;
                    },
                    'iff': function (ww) {
                        var P = parseWFF(ww);
                        var Q = parseWFF(ww);
                        return (P && Q)? l.iff(P, Q): null;
                    },
                    'and': function (ww) {
                        var P = parseWFF(ww);
                        var Q = parseWFF(ww);
                        return (P && Q)? l.and(P, Q): null;
                    },
                    'or': function (ww) {
                        var P = parseWFF(ww);
                        var Q = parseWFF(ww);
                        return (P && Q)? l.or(P, Q): null;
                    }
                };
                
                var token = ww.shift();
                var op = ops[token];
                var P;
                
                if (op) {
                    P = op(ww);
                }
                else if (token && token.length > 0) {
                    P = l.prop(token);
                }
                else {
                    P = null;
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
                
                'up': function(self,w0,ww) {
                    self.up();
                },
                
                'home': function(self,w0,ww) {
                    self.home();
                },
                
                
                'assume': function(self,w0,ww) {
                    self.assume(parseWFF(ww));
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
                
                'close': function(self,w0,ww) {
                    self.close();
                },
                
                
                'wff': function(self,w0,ww) {
                    var wff = parseWFF(ww) || '<<null>>';
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
                
                var words = value.trim().split(' ');
                var word0 = words.shift();
                var command = commands[word0] || commands['error'];
                
                try {
                    command(this,word0,words);
                }
                catch(e) {
                        this.error(e.toString());
                        throw e;
                }
            };
            
            p.onSubmit = function(value) {
                this.log(this.terminal.commandLine.createEcho());
                this.processCommand(value);
            };
            
            p.offSelect = function() {
                var pelement = this.current;
                
                
                var widgets = pelement.widgets;
                if (widgets) {
                    var wroot = widgets.root;
                    wroot.view.classList.remove('selected');
                }
            };
            
            p.onSelectBlock = function(block) {
                if (block.isClosed()) {
                    return;
                }
                
                if (block == this.current) {
                    return;
                }
                
                this.offSelect();
                
                this.current = block;
                this.log(block.textHead());
                this.setPrompt(block.indexString());
                
                var widgets = block.widgets;
                if (widgets) {
                    var wroot = widgets.root;
                    wroot.view.classList.add('selected');
                }
            };
            
            p.onSelectStatement = function(statement) {
                if (statement.getParent().isClosed()) {
                    return;
                }
                
                if (statement == this.current) {
                    return;
                }
                
                this.offSelect();
                
                this.current = statement;
                this.log(statement.toText());
                this.setPrompt(statement.indexString());
                
                var widgets = statement.widgets;
                if (widgets) {
                    var wroot = widgets.root;
                    wroot.view.classList.add('selected');
                }
            };
            
            p.onSelect = function(pelement) {
                if (pelement.isBlock()) {
                    this.onSelectBlock(pelement);
                }
                else if (pelement.isStatement()) {
                    this.onSelectStatement(pelement);
                }
                else {
                    this.message('onSelect: unrecognised element: ' + pelement.klass);
                }
            };
            
            p.onClose = function(proof) {
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
                
                controller.home();
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
            
            p.doit = function(command) {
                p.controller().processCommand(command);
            }
            
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
        
        p.open('p0');
        document.body.appendChild(de('wpview', p(), p.controller()).create())
        
        p.open('p1');
        p.controller().show(imp(and('p','q'),'p'));
        p(0);
        p.controller().intro();
        
        document.body.appendChild(de('wpview', p(), p.controller()).create())
        
        /*
        p.open('p2');
        p.doit('show imp imp or p q r imp and p q r');
        p(0);
        p.doit('intro');
        p(0,0,0);
        p.doit('intro');
        */
        //document.body.appendChild(de('wpview', p(), p.controller()).create())
        
        p.open('p0');
        
        
        //---------------------------------------------------------
    }   // end init
}); // end define

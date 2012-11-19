/* 
    Document   : logic
    Created on : 17/11/2012, 1:44:53 AM
    Author     : Alan Dennis Eaton <alan.dennis.eaton@gmail.com>
    Description:
        Purpose of the script follows.
*/

'use strict';

//-----------------------------------------------------------------
btk.define({
    name: 'logic@proofassistant',
    libs: {
        de: 'element@wtk'
    },
    init: function(libs, exports) {
        
        //---------------------------------------------------------
        var page = btk.global.page;
        
        
        var isString = btk.isString;
        var isNumber = btk.isNumber;
        var isArray = btk.isArray;
        
        var ifNumber = btk.ifNumber;
        var ifString = btk.ifString;
        var ifArray = btk.ifArray;
        
        var inherits = btk.inherits;
        
        
        var de = libs.de;
        
        
        var l = exports;
        page.logic = l;
        
        
        //---------------------------------------------------------
        function info(msg) {
            console.info(msg);
        }
        
        function log(text) {
            var l = text.length;
            var line;
                    
            for (var i=0; i<l; i++) {
                line = text[i];
                        
                if (isArray(line)) {
                    log(line);
                }
                else {
                    info(line);
                }
            }
        }
        
        
        //---------------------------------------------------------
        function ProofError(element, method, msg) {
            var text = [
                element.klass,
                element.indexString(),
                '.',
                method,
                ': ',
                msg
            ];
            
            this.message = text.join('');
        }
        inherits(ProofError, Error);
        l.ProofError = ProofError;
        
        
        //---------------------------------------------------------
        function Annotation(sources,text) {
            this.sources = ifArray(sources, [sources]);
            this.text = ifString(text,'');
        }
        inherits(Annotation, Object);
        l.Annotation = Annotation;


        (function(p){
            p.klass = 'Annotation';
            
            function stringifySources(ss) {
                var si = [];
                
                for (var i=0,l=ss.length; i<l; i++) {
                    si.push(ss[i].indexString());
                }
                si = si.join(', ');
                
                return si;
            }
            
            p.toString = function() {
                var s = ['#'];
                
                if (this.text) {
                    s.push(this.text);
                }
                
                if (this.sources.length > 0) {
                    s.push(stringifySources(this.sources));
                }
                
                return s.join(' ');
            };
            
            p.toText = p.toString;
            
            p.toHTML = function() {
                var html = de('div')
                    .klass('annotation')
                    .child(this.toString())
                    ;
                
                return html;
            };
            
        })(Annotation.prototype);
        
        
        //---------------------------------------------------------
        var peSequence = new btk.Sequence(0);
        
        function ProofElement() {
            this.id = peSequence.next();
        }
        inherits(ProofElement, Object);
        l.ProofElement = ProofElement;
        
        (function(p){
            p.klass = 'ProofElement';
            
            p.error = function(method, msg) {
                return new ProofError(this, method, msg);
            };
            
            p.isProposition = function() {
                return false;
            };
            
            p.isProof = function() {
                return false;
            };
            
            
            p.getParent = function() {
                return this.parent;
            };
            
            p.setParent = function(parent) {
                this.parent = parent;
                if (parent) {
                    this.setTop(parent.getTop());
                }
                else {
                    this.setTop(this);
                }
            };
            
            p.getTop = function() {
                return this.top || this;
            };
            
            p.setTop = function(top) {
                this.top = top;
            };
            
            p.getIndex = function() {
                return this.index;
            };
 
            p.getFullIndex = function() {
                var p = this.getParent();
                var i = p? p.getFullIndex(): [];
                
                if (this.isIndexed()) {
                    i.push(this.getIndex());
                }
                
                return i;
            };
            
            p.setIndex = function(i) {
                this.index = i;
            };
            
            p.isIndexed = function() {
                return isNumber(this.getIndex());
            };

            p.indexString = function() {
                return '(' + this.getFullIndex().join('.') + ')';
            };
            
            p.indexPadding = function() {
                var pad = new Array(this.indexString().length + 1);
                
                return pad.join(' ');
            };
            
            p.level = function() {
                return this.getFullIndex().length;
            }
            
            
            p.getAnnotation = function() {
                return this.annotation || '';
            };
            
            p.setAnnotation = function(annotation) {
                this.annotation = annotation;
            };
            
            p.removeAnnotation = function() {
                this.setAnnotation(null);
            };
            
            p.annotate = function(indicies,text) {
                this.setAnnotation(new Annotation(indicies,text));
                this.log();
                
                this.getTop().onAnnotation(this);
            };
            
            
            p.copy = function() {
                return this;
            };
            
            
            p.is = function(other) {
                if (other.id == this.id) {
                    return true;
                }
                
                return false;
            };
            
            p.isnt = function(other) {
                return !this.is(other);
            };
            
            
            p.toText = function() {
                var text = [];
                
                var line = [
                    this.indexString(),
                    this.toString()
                ].join(' ');
                
                text.push(line);
                
                var anno = this.getAnnotation();
                if (anno) {
                    var note = [
                        this.indexPadding(),
                        anno.toString()
                    ].join(' ');
                    
                    text.push(note);
                }
                
                return text;
            };
            
            p.toHTML = function() {
                return this.list();
            };
            
            p.list = function() {
                var text = this.toText();
                
                log(text);
            };
            
            p.log = p.list;
            
        })(ProofElement.prototype);
        
        
        //---------------------------------------------------------
        function Comment(text) {
            Comment.SUPERCLASS.call(this);
            
            this.text = ifArray(text, [text]);
        }
        inherits(Comment, ProofElement);
        l.Comment = Comment;


        (function(p){
            p.klass = 'Comment';
            
            p.toString = function() {
                var input = this.text;
                var output = [];
                
                for (var i=0, l=input.length; i<l; i++) {
                    output.push('# ' + input[i]);
                }
                
                return output.join('\n');
            };
            
            p.toText = function() {
                var index = this.indexString();
                var input = this.text;
                var length = input.length;
                var output = [];
                
                for(var i=0; i<length; i++) {
                    output.push(index + ' # ' + input[i]);
                }
                
                return output;
            };
            
        })(Comment.prototype);
        
        
        //---------------------------------------------------------
        function Proof() {
            Proof.SUPERCLASS.call(this);
            
            this.statements = [];
            this.tasks = {};
            this.closed = false;
            
            this.onAppend = btk.nothing;
            this.onAnnotation = btk.nothing;
            this.onClose = btk.nothing;
        }
        inherits(Proof, ProofElement);
        l.Proof = Proof;
        
        (function(p){
            
            p.klass = 'Proof';
            
            p.isProof = function() {
                return true;
            };

            p.isClosed = function() {
                return this.closed;
            }
            
            p.getCurrent = function() {
                var i = this.statements.length - 1;
                
                if (i < 0) {
                    throw this.error('getCurrent: empty proof');
                }
                
                return this.statements[i];
            };
            
            p.addTask = function(proof) {
                this.tasks[proof.id] = proof;
            };
            
            p.removeTask = function(proof) {
                delete this.tasks[proof.id];
            };
            
            
            p.append = function(P) {
                var Q = (P.isProposition() && P.isIndexed())? P.copy(): P;
                var i = this.statements.push(Q);
                
                Q.setIndex(i-1);
                Q.setParent(this);
                
                this.getTop().onAppend(Q);
                
                return Q;
            };
            
            p.comment = function(text) {
                var c = new Comment(text);
                this.append(c);
                
                return c;
            };
            
            p.assume = function(P) {
                var Q = this.append(P);
                Q.annotate([],'Assumption');
                
                return Q;
            };
            
            p.find = function(P,i) {
                var s = this.statements;
                
                i = ifNumber(i, s.length-1);
                while (i >= 0) {
                    if (s[i].is(P)) {
                        return s[i];
                    }
                    i--;
                }
                
                if (this.parent) {
                    return this.parent.find(P, this.getIndex());
                }
                
                return null;
            };
            
            p.show = function(P) {
                var Q = this.find(P);
                var R;
                
                if (Q) {
                    if (Q.level() <= this.level()) {
                        R = this.append(P);
                        R.annotate([Q],'import');
                    }
                    else {
                        R = Q;
                    }
                }
                else {
                    var goalproof = new GoalProof(P);
                    
                    this.append(goalproof);
                    goalproof.annotate([],'OPEN');

                    R = this.append(goalproof.getTarget());
                    R.annotate([goalproof],'to show');
                    
                    this.addTask(goalproof);
                }
                
                return R;
            };
            
            p.from = function(P) {
                var subproof = new Subproof(P);
                
                this.append(subproof);
                subproof.annotate([],'OPEN');
                
                return subproof;
            };
            


            p.intro = function(X,Y) {
                var P = this.getCurrent();
                
                return P.intro(this,X,Y);
            };

            p.introLeft = function(X,Y) {
                var P = this.getCurrent();
                
                return P.introLeft(this,X,Y);
            };
            
            p.introRight = function(X,Y) {
                var P = this.getCurrent();
                
                return P.introRight(this,X,Y);
            };
            

            p.elim = function(X,Y) {
                var P = this.getCurrent();
                
                return P.elim(this,X,Y);
            }
            
            p.elimLeft = function(X,Y) {
                var P = this.getCurrent();
                
                return P.elimLeft(this,X,Y);
            };
            
            p.elimRight = function(X,Y) {
                var P = this.getCurrent();
                
                return P.elimRight(this,X,Y);
            };
            
            
            p.line = function(i) {
                var ii;
                
                if (isNumber(i)) {
                    ii = [i];
                }
                else if (isString(i)) {
                    ii = i.split('.');
                }
                else {
                    ii = ifArray(i,[0]);
                }
                
                var l = ii.length;
                var j = 0;
                var k;
                var p = this;
                while (j < l && p && p.statements) {
                    k = ii[j];
                    if (k < p.statements.length) {
                        p = p.statements[k];
                    }
                    else {
                        p = null;
                    }
                    
                    j++;
                }
                
                return p;
            };
            
            
            p.textHead = function() {
                return [];
            };
            
            p.bodyToText = function() {
                var body = [];
                var s = this.statements;
                var l = s.length;
                
                for (var i=0; i<l; i++) {
                    body.push(s[i].toText());
                }
                
                return body;
            }

            p.toText = function() {
                var text = [
                    this.textHead(),
                    this.bodyToText()
                ];
                
                return text;
            };
            
            p.log = function() {
                log(this.textHead());
            };
            
            p.toString = function() {
                var text = this.toText();
                
                return text.join('\n');
            };
            
        })(Proof.prototype);
        
        
        //---------------------------------------------------------
        function Subproof(root) {
            Subproof.SUPERCLASS.call(this);
            
            var P = root.isIndexed()? root.copy(): root;
            this.setRoot(P);
        }
        inherits(Subproof, Proof);
        l.Subproof = Subproof;
        
        (function(p) {
            
            p.klass = 'Subproof';
            
            p.getRoot = function() {
                return this.root;
            };
            
            p.setRoot = function(root) {
                if (this.root) {
                    throw this.error('setRoot','already set');
                }
                
                this.root = root;
                root.setParent(this);
            };
            
            p.getCurrent = function() {
                var i = this.statements.length - 1;
                
                if (i < 0) {
                    return this.getRoot();
                }
                else {
                    return this.statements[i];
                }
            };
            
            p.superAppend = Subproof.SUPER.append;
            
            p.append = function(P) {
                if (this.isClosed()) {
                    throw this.error('append','already closed');
                }
                
                return this.superAppend(P);
            };
            
            p.assume = function() {
                throw this.error('assume','not a top level proof');
            };
            
            p.superFind = Subproof.SUPER.find;
            
            p.find = function(P,i) {
                var root = this.getRoot();
                
                if (root.is(P)) {
                    return root;
                }
                
                return this.superFind(P,i);
            };
            
            p.close = function() {
                if (this.isClosed()) {
                    throw this.error('close','already closed');
                }
                
                var parent = this.getParent();
                var current = this.getCurrent();
                var intro = new Conditional(this.getRoot(), current);
                var s = parent.statements[this.getIndex()+1];
                
                if (!s || !intro.is(s)) {
                    var i = parent.append(intro);
                    i.annotate([this,current],'Conditional introduction');
                }
                
                this.closed = true;
                parent.removeTask(this);
                
                this.removeAnnotation();
                
                return parent;
            };
            
            p.textHead = function() {
                var head = [
                    this.indexString(),
                    'from',
                    this.getRoot().toString(),
                ].join(' ');
                
                var text = [head];
                
                var anno = this.getAnnotation();
                if (anno) {
                    var note = [
                        this.indexPadding(),
                        anno.toString()
                    ].join(' ');
                    
                    text.push(note);
                }
                
                return text;
            };
            
        })(Subproof.prototype);


        //---------------------------------------------------------
        function GoalProof(target) {
            GoalProof.SUPERCLASS.call(this);
            
            var P = target.isIndexed()? target.copy(): target;
            this.setTarget(target);
        }
        inherits(GoalProof, Proof);
        l.GoalProof = GoalProof;
        
        (function(p) {
            
            p.klass = 'GoalProof';
            
            p.getTarget = function() {
                return this.target;
            };
            
            p.setTarget = function(target) {
                if (this.target) {
                    throw this.error('setTarget','already set');
                }
                
                this.target = target;
                target.setParent(this);
            };
            
            p.getCurrent = function() {
                var i = this.statements.length - 1;
                
                if (i < 0) {
                    return this.getTarget();
                }
                else {
                    return this.statements[i];
                }
            };
            
            p.assume = function() {
                throw this.error('assume','not a top level proof');
            };
            
            p.superAppend = GoalProof.SUPER.append;
            
            p.append = function(P) {
                if (this.isClosed()) {
                    throw this.error('append','already closed');
                }
                
                var Q = this.superAppend.call(this,P);
                
                if (Q.is(this.getTarget())) {
                    this.close();
                }
                
                return Q;
            };

            // We don't want to find targets since they may
            // not have been shown yet.
            // Use the inherited method.
            // 
            // p.find = function(P,i) {}
            
            p.close = function() {
                if (this.isClosed()) {
                    throw this.error('append','already closed');
                }
                
                var parent = this.getParent();
                var target = this.getTarget();
                var current = this.getCurrent();
                if (current.id != target.id && current.is(target)) {
                    // the target is already in the parent context
                    // so do not need to add it
                    this.closed = true;
                    parent.removeTask(this);

                    this.removeAnnotation();

                    target.annotate([this],'shown');
                    
                    this.getTop().onClose(this);
                    
                    return parent;
                }
                else {
                    throw this.error('close','target has not been shown');
                }
                
                return this;
            };
            
            p.textHead = function() {
                var head = [
                    this.indexString(),
                    'show',
                    this.getTarget().toString(),
                ].join(' ');
                
                var text = [head];
                
                var anno = this.getAnnotation();
                if (anno) {
                    var note = [
                        this.indexPadding(),
                        anno.toString()
                    ].join(' ');
                    
                    text.push(note);
                }
                
                return text;
            };
            
        })(GoalProof.prototype);


        //---------------------------------------------------------
        function Term(){}
        inherits(Term, Object);
        l.Term = Term;
        
        
        //---------------------------------------------------------
        function Proposition() {
            Proposition.SUPERCLASS.call(this);
        }
        inherits(Proposition, ProofElement);
        l.Proposition = Proposition;

        (function(p) {
            p.klass = 'Proposition';
            
            p.isProposition = function() {
                return true;
            };
            
        })(Proposition.prototype);
        
        
        //---------------------------------------------------------
        function ConstantProposition(name) {
            ConstantProposition.SUPERCLASS.call(this);
            this.name = name;
        }
        inherits(ConstantProposition, Proposition);
        l.ConstantProposition = ConstantProposition;

        (function(p) {
            p.klass = 'ConstantProposition';
            
            p.copy = function() {
                return new ConstantProposition(this.name);
            };
            
            
            // intro and elim do not make sense for constant propositions
            
            p.intro = function(proof) {
                throw this.error('intro','illegal');
            }
            p.intro.params = 0;
            p.intro.left = p.intro;
            p.intro.right = p.intro;
            
            
            p.elim = function(proof) {
                throw this.error('elim','illegal');
            };
            p.elim.params = 0;
            p.elim.left = p.elim;
            p.elim.right = p.elim;
            
            
            p.is = function(other) {
                if (other.klass != this.klass) {
                    return false;
                }
                
                if (other.name != this.name) {
                    return false;
                }
                
                return true;
            };
            
            p.toString = function() {
                return this.name;
            };
            
        })(ConstantProposition.prototype);
        
        l.error = new ConstantProposition('error');
        l.ok = new ConstantProposition('ok');
        
        
        //---------------------------------------------------------
        function BinaryOperation(P,Q) {
            BinaryOperation.SUPERCLASS.call(this);
            
            this.left = P;
            this.right = Q;
        }
        inherits(BinaryOperation, Proposition);
        
        (function(p){

            p.klass = 'BinaryOperation';

            p.op = {
                'text': '??',
                'html': '??'
            };
            
            p.is = function(other) {
                if (other.klass != this.klass) {
                    return false;
                }
                
                if (other.left.is(this.left) && other.right.is(this.right)) {
                    return true;
                }
                
                return false;
            };

            p.toString = function() {
                var s = [
                    '(',
                    this.left.toString(),
                    this.op.text,
                    this.right.toString(),
                    ')'
                ].join('');
                
                return s;
            };
            
        })(BinaryOperation.prototype);
        
        
         //---------------------------------------------------------
        function Conditional(P,Q){
            Conditional.SUPERCLASS.call(this, P, Q);
        }
        inherits(Conditional, BinaryOperation);
        l.Conditional = Conditional;
        
        (function(p){
            p.klass = 'Conditional';
            
            p.copy = function() {
                return new Conditional(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '->',
                'html': '->'
            };
            
            // there is only one of each for Conditionals
            // so left and right will be the same
            
            p.intro = function(proof) {
                var subproof = proof.from(this.left);
                
                subproof.show(this.right);
                subproof.close();
                
                return proof.getCurrent();
            };
            p.intro.params = 0;
            p.introLeft = p.intro;
            p.introRight = p.intro;
            

            p.elim = function(proof) {
                var i = proof.show(this.left);
                var j = proof.append(this.right);
                
                j.annotate([i,this],'Conditional elimination');
                
                return j;
            };
            p.elim.params = 0;
            p.elimLeft = p.elim;
            p.elimRight = p.elim;
                
        })(l.Conditional.prototype);
        
        
       //---------------------------------------------------------
        function Conjunction(P,Q) {
            Conjunction.SUPERCLASS.call(this, P, Q);
        }
        inherits(Conjunction, BinaryOperation);
        l.Conjunction = Conjunction;
        
        (function(p){
            p.klass = 'Conjunction';
            
            p.copy = function() {
                return new l.Conjunction(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '&',
                'html': '&'
            };
            
            
            // only one intro tactic
            
            p.intro = function(proof) {
                var i = proof.show(this.left);
                var j = proof.show(this.right);
                
                var k = proof.append(this);
                k.annotate([i,j],'Conjunction introduction');
                
                return i;
            };
            p.intro.params = 0;
            p.introLeft = p.intro;
            p.introRight = p.intro.left;
            
            
            p.elimLeft = function(proof) {
                var i = proof.append(this.left);
                i.annotate([this],'left projection');
                
                return i;
            };
            p.elimLeft.params = 0;
                
            p.elimRight = function(proof) {
                var i = proof.append(this.right);
                i.annotate([this],'right projection');
                
                return i;
            };
            p.elimRight.params = 0;
            
            p.elim = p.elimLeft;
                
        })(l.Conjunction.prototype);
        
        
        //---------------------------------------------------------
        function Disjunction(P,Q) {
            Disjunction.SUPERCLASS.call(this, P, Q);
        }
        inherits(Disjunction, BinaryOperation);
        l.Disjunction = Disjunction;
        
        (function(p){
            p.klass = 'Disjunction';
            
            p.copy = function() {
                return new l.Disjunction(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '|',
                'html': '|'
            };
            
            
            p.introLeft = function(proof) {
                var i = proof.show(this.left);
                
                var j = proof.append(this);
                j.annotate([i],'left injection');
                
                return j;
            };
            p.introLeft.params = 0;
            
            p.introRight = function(proof) {
                var i = proof.show(this.right);
                
                var j = proof.append(this);
                j.annotate([i],'right injection');
                
                return j;
            };
            p.introRight.params = 0;
                
            p.intro = p.introLeft;
            
            // only one of these
            
            p.elim = function(proof,X) {
                if (!X) {
                    throw this.error('elim: missing parameter');
                }
                var i = proof.show(new Conditional(this.left,X));
                var j = proof.show(new Conditional(this.right,X));
                
                var k = proof.append(X);
                k.annotate([this,i,j],'Disjunction elimination');
                
                return k;
            };
            p.elim.params = 1;
            p.elimLeft = p.elim;
            p.elimRight = p.elim;
            
        })(l.Disjunction.prototype);
        
        
        //---------------------------------------------------------

    }   // end init
}); // end define

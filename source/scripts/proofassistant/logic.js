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
        var page = btk.global.page || {};
        btk.global.page = page;
        
        var inherits = btk.inherits;
        
        var de = libs.de;
        
        var l = exports;
        page.logic = l;
        
        //---------------------------------------------------------
        function ProofError(msg) {
            this.message = msg;
        }
        inherits(ProofError, Error);
        l.ProofError = ProofError;
        
        
        //---------------------------------------------------------
        function Annotation(sources, aklass, text) {
            this.sources = btk.ifArray(sources, [sources]);
            this.aklass = btk.ifString(aklass,'');
            this.text = btk.ifString(text,'');
        }
        inherits(Annotation, Object);
        l.Annotation = Annotation;


        (function(p){
            p.klass = 'Annotation';
            
            function stringifySources(ii) {
                var si = [];
                
                var l = ii.length;
                for (var i=0; i<l; i++) {
                    si.push(ii[i].getFullIndex().join('.'));
                }
                si = si.join(',');
                
                return si + ':';
            }
            
            p.toString = function() {
                var s = [];
                
                if (this.sources.length > 0) {
                    s.push(stringifySources(this.sources));
                }
                if (this.aklass) {
                    s.push(this.aklass);
                }
                if (this.text) {
                    s.push(this.text);
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
            this.index = -1;
        }
        inherits(ProofElement, Object);
        l.ProofElement = ProofElement;
        
        (function(p){
            p.klass = 'ProofElement';
            
            p.getParent = function() {
                return this.parent;
            };
            
            p.setParent = function(parent) {
                this.parent = parent;
            };
            
            p.getIndex = function() {
                return this.index;
            };
 
            p.getFullIndex = function() {
                var p = this.getParent();
                var i = p?p.getFullIndex():[];
                
                var j = this.index;
                if (j >= 0) {
                    i.push(j);
                }
                
                return i;
            };
            
            p.setIndex = function(i) {
                this.index = i;
            };
            
            p.getAnnotation = function() {
                return this.annotation || '';
            };
            
            p.setAnnotation = function(annotation) {
                this.annotation = annotation;
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
                return this.toString();
            };
            
            p.toHTML = function() {
                return this.toString();
            };
            
        })(ProofElement.prototype);
        
        
        //---------------------------------------------------------
        function Comment(text) {
            Comment.SUPERCLASS.call(this);
            this.text = btk.ifArray(text, [text]);
        }
        inherits(Comment, ProofElement);
        l.Comment = Comment;


        (function(p){
            p.klass = 'Comment';
            
            p.toString = function() {
                return this.text.join('\n');
            };
            
            p.toText = function() {
                return this.text;
            };
            
        })(Comment.prototype);
        
        
        //---------------------------------------------------------
        function Proof() {
            Proof.SUPERCLASS.call(this);
            
            this.statements = [];
            this.tasks = {};
            this.closed = false;
        }
        inherits(Proof, ProofElement);
        l.Proof = Proof;
        
        (function(p){
            
            p.klass = 'Proof';
            
            p.getCurrent = function() {
                var i = this.statements.length - 1;
                
                if (i < 0) {
                    return this.getTarget() || this.getRoot();
                }
                else {
                    return this.statements[i];
                }
            };
            
            p.addTask = function(proof) {
                this.tasks[proof.id] = proof;
            };
            
            p.removeTask = function(proof) {
                delete this.tasks[proof.id];
            };
            
            
            p.append = function(P) {
                var i = this.statements.push(P);
                
                P.setIndex(i-1);
                P.setParent(this);
                
                return P;
            };
            
            p.annotate = function(indicies, klass, text) {
                var P = this.getCurrent();
                if (P) {
                    P.setAnnotation(new l.Annotation(indicies, klass, text));
                }
            };
            
            p.comment = function(text) {
                var c = new l.Comment(text);
                this.append(c);
                return c;
            };
            
            
            p.find = function(P) {
                if (P.getIndex() >= 0) {
                    return P;
                }
                
                var s = this.statements;
                var l = s.length;
                
                var i = l-1;
                while (i >= 0) {
                    if (s[i].is(P)) {
                        return s[i];
                    }
                    i--;
                }
                
                if (this.root) {
                    if (this.root.is(P)) {
                        return this.root;
                    }
                }
                
                // only finding proven propositions
                // so don't check targets
                
                if (this.parent) {
                    return this.parent.find(P);
                }
                
                return null;
            };
            
            p.show = function(P) {
                var Q = this.find(P);
                if (!Q) {
                    var goalproof = new l.GoalProof(P);
                    
                    this.append(goalproof);

                    Q = this.append(P.copy());
                    this.annotate([goalproof],goalproof.klass,'export');
                    
                    this.addTask(goalproof);
                }
                
                return Q;
            };
            
            p.from = function(P) {
                var subproof = new Subproof(P);
                
                return this.append(subproof);
            };
            


            p.introLeft = function(X) {
                var P = this.getCurrent();
                if (!P) {
                    return null;
                }
                
                var intro = P.tactic.intro.left;
                
                var Q = intro.call(P,this,X);
                
                return Q;
            };
            
            p.introRight = function(X) {
                var P = this.getCurrent();
                if (!P) {
                    return null;
                }
                
                var intro = P.tactic.intro.right;
                
                var Q = intro.call(P,this,X);
                
                return Q;
            };
            
            p.intro = function(X) {
                return this.introLeft(X);
            };


            p.elimLeft = function(X) {
                var P = this.getCurrent();
                if (!P) {
                    return null;
                }
                
                var elim = P.tactic.elim.left;
                
                var Q = elim.call(P,this,X);
                
                return Q;
            };
            
            p.elimRight = function(X) {
                var P = this.getCurrent();
                if (!P) {
                    return null;
                }
                
                var elim = P.tactic.elim.right;
                
                var Q = elim.call(P,this,X);
                
                return Q;
            };
            
            p.elim = function(X) {
                return this.elimLeft(X);
            }
            
            
            p.line = function(i) {
                if (btk.isString(i)) {
                    i = i.split('.');
                }
                
                i = btk.ifArray(i,[0]);
                
                var p = this;
                var j = 0;
                var k;
                while (j < i.length && p && p.statements) {
                    k = i[j];
                    if (k < p.statements.length) {
                        p = p.statements[i[j]];
                    }
                    else {
                        p = null;
                    }
                    
                    j++;
                }
                
                return p;
            };
            
            
            p.bodyToText = function() {
                var body = [];
                
                var s = this.statements;
                var l = s.length;
                for (var i=0; i < l; i++) {
                    var annotation = s[i].getAnnotation();
                    if (annotation) {
                        annotation = ' # ' + annotation.toString();
                    }
                    body.push([
                        '(', s[i].getFullIndex().join('.'), ') ',
                        s[i].toString(),
                        annotation
                    ].join(''));
                }
                
                return body;
            }
            
            p.toText = p.bodyToText;
            
            p.list = function() {
                function output(lines) {
                    var l = lines.length;
                    for (var i=0; i<l; i++) {
                        if (btk.isString(lines[i])) {
                            console.info(lines[i]);
                        }
                        else {
                            output(lines[i]);
                        }
                    }
                }
                
                var text = this.toText();
                
                output(text);
            };
            
            p.toString = function() {
                var text = this.toText();
                
                return text.join('\n');
            };
            
        })(Proof.prototype);
        
        
        //---------------------------------------------------------
        function Subproof(root) {
            Subproof.SUPERCLASS.call(this);
            
            this.setRoot(root);
        }
        inherits(Subproof, Proof);
        l.Subproof = Subproof;
        
        (function(p) {
            
            p.klass = 'Subproof';
            
            p.getRoot = function() {
                return this.root;
            };
            
            p.setRoot = function(root) {
                this.root = root;
                root.setParent(this);
            };
            
            p.close = function() {
                var parent = this.getParent();
                
                if (this.closed) {
                    console.log('Subproof.close: already closed');
                    return parent;
                }
                
                var current = this.getCurrent();
                var intro = new l.Conditional(this.getRoot(), current);
                var i = this.getIndex();
                if (!intro.is(parent.statements[i+1])) {
                    parent.append(intro);
                    parent.annotate([this,current],intro.klass,'introduction');
                }
                this.closed = true;
                parent.removeTask(this);

                return parent;
                
            };
            
            p.toText = function() {
                var body = this.bodyToText();
                
                var text = [
                    'from ' + this.getRoot().toString(),
                    body
                ];
                
                return text;
            };
            
        })(Subproof.prototype);


        //---------------------------------------------------------
        function GoalProof(target) {
            GoalProof.SUPERCLASS.call(this);
            
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
                this.target = target;
                target.setParent(this);
            };
            
            p.append = function(P) {
                var Q = GoalProof.SUPER.append.call(this,P);
                
                if (P.is(this.getTarget())) {
                    this.close();
                }
                
                return Q;
            };
            
            p.close = function() {
                var parent = this.getParent();
                
                if (this.closed) {
                    console.log('GoalProof.close: already closed');
                    return parent;
                }
                
                var target = this.getTarget();
                var current = this.getCurrent();
                if (current.id != target.id && current.is(target)) {
                    // the target is already in the parent context
                    // so do not need to add it
                    this.closed = true;
                    parent.removeTask(this);

                    return parent;
                }
                else {
                    throw new ProofError('GoalProof.close: target has not been shown');
                }
                
                return this;
            };
            
            p.toText = function() {
                var body = this.bodyToText();
                
                var text = [
                    'show ' + this.getTarget().toString(),
                    body
                ];
                
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
            
            // intro and elim do not make sense for constant propositions
            
            p.copy = function() {
                return new l.ConstantProposition(this.name);
            };
            
            
            p.tactic = {
                'intro': {},
                'elim': {}
            };
            
            p.tactic.intro.left = function(proof) {
                throw new ProofError('ConstantProposition.intro: illegal');
            }
            p.tactic.intro.left.params = 0;
            p.tactic.intro.right = p.tactic.intro.left;
            
            
            p.tactic.elim.left = function(proof) {
                throw new ProofError('ConstantProposition.elim: illegal');
            };
            p.tactic.elim.left.params = 0;
            p.tactic.elim.right = p.tactic.elim.left;
            
            
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
                
                if (other.left.isnt(this.left)) {
                    return false;
                }
                
                if (other.right.isnt(this.right)) {
                    return false;
                }
                
                return true;
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
                return new l.Conditional(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '->',
                'html': '->'
            };
            
            // there is only one of each for Conditionals
            // so left and right will be the same
            
            p.tactic = {
                'intro': {},
                'elim': {}
            };
            
            
            p.tactic.intro.left = function(proof) {
                var subproof = proof.from(this.left);
                subproof.show(this.right);
                
                var j = subproof.close();
                
                return j;
            };
            p.tactic.intro.left.params = 0;
            p.tactic.intro.right = p.tactic.intro.left;
            
            
            p.tactic.elim.left = function(proof) {
                var i = proof.show(this.left);
                
                var j = proof.append(this.right);
                proof.annotate([i,this],this.klass,'elimination');
                
                return j;
            };
            p.tactic.elim.left.params = 0;
            p.tactic.elim.right = p.tactic.elim.left;
                
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
            
            
            p.tactic = {
                'intro': {},
                'elim': {}
            };
            
            
            // only one intro tactic
            p.tactic.intro.left = function(proof) {
                var i = proof.show(this.left.copy());
                var j = proof.show(this.right.copy());
                
                var k = proof.append(this.copy());
                proof.annotate([i,j],k.klass,'introduction');
                
                return i;
            };
            p.tactic.intro.left.params = 0;
            p.tactic.intro.right = p.tactic.intro.left;
            
            
            p.tactic.elim.left = function(proof) {
                var i = proof.append(this.left.copy());
                proof.annotate([this],'left projection');
                
                return i;
            };
            p.tactic.elim.left.params = 0;
                
            p.tactic.elim.right = function(proof) {
                var i = proof.append(this.right.copy());
                proof.annotate([this],'right projection');
                
                return i;
            };
            p.tactic.elim.right.params = 0;
                
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
            
            p.tactic = {
                'intro': {},
                'elim': {}
            };
            
            
            p.tactic.intro.left = function(proof) {
                var i = proof.show(this.left.copy());
                
                var j = proof.append(this.copy());
                proof.annotate([i],'left injection');
                
                return j;
            };
            p.tactic.intro.left.params = 0;
            
            p.tactic.intro.right = function(proof) {
                var i = proof.show(this.right.copy());
                
                var j = proof.append(this.copy());
                proof.annotate([i],'right injection');
                
                return j;
            };
            p.tactic.intro.right.params = 0;
                
            // only one of these
            p.tactic.elim.left = function(proof,X) {
                if (!X) {
                    throw new ProofError(this.klass + '.elim: missing parameter');
                }
                var i = proof.show(new l.Conditional(this.left,X));
                var j = proof.show(new l.Conditional(this.right,X));
                
                var k = proof.append(X.copy());
                proof.annotate([this,i,j],this.klass,'elimination');
                
                return k;
            };
            p.tactic.elim.left.params = 1;
            p.tactic.elim.right = p.tactic.elim.left;
            
        })(l.Disjunction.prototype);
        
        
        //---------------------------------------------------------
        l.prop = function(p) {
            var P = l.prop.cache[p];
            if (!P) {
                P = new l.ConstantProposition(p);
                l.prop.cache[p] = P;
            }
            return P;
        };
        l.prop.cache = {};
        
        l.wrap = function(p) {
            if (p instanceof l.Proposition) {
                return p;
            }
            
            if (btk.isString(p)) {
                return l.prop(p);
            }
            
            return l.error;
        };
        
        l.not = function(p) {
            return new l.Conditional(l.wrap(p),l.error);
        };
        
        l.imp = function(p,q) {
            return new l.Conditional(l.wrap(p),l.wrap(q));
        };
        
        l.and = function(p,q) {
            return new l.Conjunction(l.wrap(p),l.wrap(q));
        };
        
        l.or = function(p,q) {
            return new l.Disjunction(l.wrap(p),l.wrap(q));
        };
        
        l.iff = function(p,q) {
            return new l.and(l.imp(p,q),l.imp(q,p));
        };
        
        
        //---------------------------------------------------------
        l.t = {};
        
        l.t.P = l.prop('P');
        l.t.Q = l.prop('Q');
        l.t.R = l.prop('R');
        
        l.t.PandQ = l.and('P', 'Q');
        l.t.PorQ = l.or('P', 'Q');
        l.t.PtoQ = l.imp('P', 'Q');
        
        l.t.pp = new l.Proof();
        
        btk.global.l = l;
        btk.global.t = l.t;
        
        btk.global.pp = t.pp;
        btk.global.p = t.PtoQ;
        
        pp.append(t.P);
        pp.annotate([],'Assumption');
        pp.append(t.PtoQ);
        pp.annotate([],'Assumption');
        pp.elim();
        
        l.t.pq = new l.Proof();
        btk.global.pq = l.t.pq;
        pq.append(l.imp(l.or('P','Q'),'R'));
        pq.annotate([],'Assumption');
        pq.show(l.imp(l.and('P','Q'),'R'));


        //---------------------------------------------------------

    }   // end init
}); // end define

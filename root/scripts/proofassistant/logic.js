/* 
    Document   : logic
    Created on : 17/11/2012, 1:44:53 AM
    Author     : Alan Dennis Eaton <alan.dennis.eaton@gmail.com>
    Description:
        Classes characterising proofs and their elements
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
        
        var Publisher = btk.Publisher;
        var Client = Publisher.Client;
        var Message = Publisher.Message;
        
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
            this.name = 'ProofError';
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
        var eSequence = new btk.Sequence(0);
        
        function Element() {
            this.id = eSequence.next();
        }
        inherits(Element, Object);
        l.Element = Element;
        
        (function(p){
            p.klass = 'Element';
            
            p.error = function(method, msg) {
                return new ProofError(this, method, msg);
            };
            
            p.isStatement = function() {
                return false;
            };
            
            p.isBlock = function() {
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
            
            p.getLevel = function() {
                return this.getFullIndex().length;
            }
            
            
            p.notify = function(type, data) {
                this.getTop().sendNotification(type, this, data);
            };
            
            // handlers is an object of type:handler entries
            // returns a subscription
            p.listen = function(handlers, context) {
                return this.getTop().listen(handlers, context);
            };
            
            
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
                
                this.notify('annotate');
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
            
            p.list = function() {
                var text = this.toText();
                
                log(text);
            };
            
            p.log = p.list;
            
        })(Element.prototype);
        
        
        //---------------------------------------------------------
        function Comment(text) {
            Comment.SUPERCLASS.call(this);
            
            this.text = ifArray(text, [text]);
        }
        inherits(Comment, Element);
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
        function Block() {
            Block.SUPERCLASS.call(this);
            
            this.lines = [];
            this.tasks = {};
            this.taskCount = 0;
            this.closed = false;
        }
        inherits(Block, Element);
        l.Block = Block;
        
        (function(p){
            
            p.klass = 'Block';
            
            p.isBlock = function() {
                return true;
            };

            p.isClosed = function() {
                return this.closed;
            }
            
            p.getCurrent = function() {
                var i = this.lines.length - 1;
                
                if (i < 0) {
                    throw this.error('getCurrent: empty Block');
                }
                
                return this.lines[i];
            };
            
            p.addTask = function(Block) {
                this.tasks[Block.id] = Block;
                this.taskCount++;
            };
            
            p.removeTask = function(Block) {
                delete this.tasks[Block.id];
                this.taskCount--;
            };
            
            p.close = function() {
                if (this.isClosed()) {
                    throw this.error('close', 'already closed');
                }
                
                if (this.taskCount !== 0) {
                    throw this.error('close', 'pending tasks');
                }
                
                this.closed = true;
                
                this.annotate([],'CLOSED');
                
                this.notify('close');


                var parent = this.getParent();
                
                if (parent) {
                    parent.removeTask(this);
                }

                return parent;
            };
            
            
            p.append = function(P) {
                var Q = (P.isStatement() && P.isIndexed())? P.copy(): P;
                var i = this.lines.push(Q);
                
                Q.setIndex(i-1);
                Q.setParent(this);
                
                this.notify('append',Q);
                
                return Q;
            };
            
            p.comment = function(text) {
                var C = new Comment(text);
                this.append(C);
                
                return C;
            };
            
            p.find = function(P,i) {
                var s = this.lines;
                
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
                    if (Q.getLevel() <= this.getLevel()) {
                        R = this.append(P);
                        R.annotate([Q],'import');
                    }
                    else {
                        R = Q;
                    }
                }
                else {
                    var goalBlock = new GoalBlock(P);
                    
                    this.append(goalBlock);
                    goalBlock.annotate([],'OPEN');

                    R = this.append(goalBlock.getTarget());
                    R.annotate([goalBlock],'to show');
                    
                    this.addTask(goalBlock);
                }
                
                return R;
            };
            
            p.from = function(P) {
                var fromblock = new FromBlock(P);
                
                this.append(fromblock);
                fromblock.annotate([],'OPEN');
                
                this.addTask(fromblock);
                
                return fromblock;
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
            
            
            p.selectLine = function(i) {
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
                while (j < l && p && p.lines) {
                    k = ii[j];
                    if (k < p.lines.length) {
                        p = p.lines[k];
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
                var s = this.lines;
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
            
        })(Block.prototype);
        
        
        //---------------------------------------------------------
        function TopBlock() {
            TopBlock.SUPERCLASS.call(this);
            
            this.publisher = new Publisher();
        }
        inherits(TopBlock, Block);
        l.TopBlock = TopBlock;
        
        (function(p){
            
            p.klass = 'TopBlock';

            p.sendNotification = function(type, sender, data) {
                var mdata = {
                    'top': this,
                    'parent': sender.getParent() || sender,
                    'sender': sender,
                    'data': data
                };
                var message = new Message(type, mdata, false, false);
                
                this.publisher.transmit(message);
            };
            
            // handlers is an object of type:handler entries
            // returns a subscription
            p.listen = function(handlers, context) {
                var client = new Client(handlers, context);
                
                return this.publisher.subscribe(client);
            };
            
        })(TopBlock.prototype);
        
        
        //---------------------------------------------------------
        function Proof() {
            Proof.SUPERCLASS.call(this);
        }
        inherits(Proof, TopBlock);
        l.Proof = Proof;
        
        (function(p) {
            
            p.klass = 'Proof';
            
            p.assume = function(P) {
                var Q = this.append(P);
                Q.annotate([],'Assumption');
                
                return Q;
            };
            
        })(Proof.prototype);
        
        
        //---------------------------------------------------------
        function SubBlock() {
            SubBlock.SUPERCLASS.call(this);
        }
        inherits(SubBlock, Block);
        l.SubBlock = SubBlock;
        
        (function(p){
            
            p.klass = 'SubBlock';
            
        })(SubBlock.prototype);
        
        
        //---------------------------------------------------------
        function FromBlock(root) {
            FromBlock.SUPERCLASS.call(this);

            this.setRoot(root);
            
            this.exported = false;
        }
        inherits(FromBlock, SubBlock);
        l.FromBlock = FromBlock;
        
        (function(p) {
            
            p.klass = 'FromBlock';
            
            p.getRoot = function() {
                return this.root;
            };
            
            p.setRoot = function(root) {
                if (this.root) {
                    throw this.error('setRoot','already set');
                }
                
                this.root = root.isIndexed()? root.copy(): root;
            };
            
            p.superSetParent = FromBlock.SUPER.setParent;
            
            p.setParent = function(parent) {
                this.superSetParent(parent);
                this.getRoot().setParent(this.getParent());
            }
            
            p.superSetIndex = FromBlock.SUPER.setIndex;
            
            p.setIndex = function(i) {
                this.superSetIndex(i);
                this.getRoot().setIndex(this.getIndex());
            };
            
            p.getCurrent = function() {
                var i = this.lines.length - 1;
                
                if (i < 0) {
                    return this.getRoot();
                }
                else {
                    return this.lines[i];
                }
            };
            
            p.superAppend = FromBlock.SUPER.append;
            
            p.append = function(P) {
                if (this.isClosed()) {
                    throw this.error('append','already closed');
                }
                
                return this.superAppend(P);
            };
            
            p.superFind = FromBlock.SUPER.find;
            
            p.find = function(P,i) {
                var root = this.getRoot();
                
                if (root.is(P)) {
                    return root;
                }
                
                return this.superFind(P,i);
            };
            
            // wanted to use 'export'
            // not allowed to
            p.output = function() {
                var O = this.getCurrent();
                
                var parent = this.getParent();
                var P = new Conditional(this.getRoot(), O);
                var Q = parent.find(P);
                
                this.exported = true;
                
                if (!Q) {
                    Q = parent.append(P);
                    Q.annotate([this],'Conditional introduction');
                }
                else {
                    throw this.error('export', 'already asserted: ' + P.toString());
                }
                
                return Q;
            };

            p.superClose = FromBlock.SUPER.close;
            
            p.close = function() {
                var parent = this.superClose();
                
                if (!this.exported) {
                    this.output();
                }
                
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
            
        })(FromBlock.prototype);


        //---------------------------------------------------------
        function GoalBlock(target) {
            GoalBlock.SUPERCLASS.call(this);
            
            this.setTarget(target);
            
            this.shown = false;
        }
        inherits(GoalBlock, SubBlock);
        l.GoalBlock = GoalBlock;
        
        (function(p) {
            
            p.klass = 'GoalBlock';
            
            p.getTarget = function() {
                return this.target;
            };
            
            p.setTarget = function(target) {
                if (this.target) {
                    throw this.error('setTarget','already set');
                }
                
                var P = target.isIndexed()? target.copy(): target;
                this.target = P;
                P.setParent(this);
            };
            
            p.getCurrent = function() {
                var i = this.lines.length - 1;
                
                if (i < 0) {
                    return this.getTarget();
                }
                else {
                    return this.lines[i];
                }
            };
            
            p.superAppend = GoalBlock.SUPER.append;
            
            p.append = function(P) {
                if (this.isClosed()) {
                    throw this.error('append','already closed');
                }
                
                var Q = this.superAppend(P);
                
                if (Q.is(this.getTarget())) {
                    this.shown = true;
                    if (this.taskCount === 0) {
                        this.close();
                    }
                }
                
                return Q;
            };

            // We don't want to find targets since they may
            // not have been shown yet.
            // Use the inherited method.
            // 
            // p.find = function(P,i) {}
            
            p.superClose = GoalBlock.SUPER.close;
            
            p.close = function() {
                if (!this.shown) {
                    throw this.error('close','target has not been shown');
                }
                
                var parent = this.superClose();

                // the target should already be in the parent context
                // so do not need to add it

                var target = this.getTarget();
                target.annotate([this],'shown');

                return parent;
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
            
        })(GoalBlock.prototype);


        //---------------------------------------------------------
        function Term(){}
        inherits(Term, Object);
        l.Term = Term;
        
        
        //---------------------------------------------------------
        function Statement() {
            Statement.SUPERCLASS.call(this);
        }
        inherits(Statement, Element);
        l.Statement = Statement;

        (function(p) {
            p.klass = 'Statement';
            
            p.isStatement = function() {
                return true;
            };
            
        })(Statement.prototype);
        
        
        //---------------------------------------------------------
        function ConstantStatement(name) {
            ConstantStatement.SUPERCLASS.call(this);
            this.name = name;
        }
        inherits(ConstantStatement, Statement);
        l.ConstantStatement = ConstantStatement;

        (function(p) {
            p.klass = 'ConstantStatement';
            
            p.copy = function() {
                return new ConstantStatement(this.name);
            };
            
            
            // intro and elim do not make sense for constant Statements
            
            p.intro = function(block) {
                throw this.error('intro','illegal');
            }
            p.intro.params = 0;
            p.intro.left = p.intro;
            p.intro.right = p.intro;
            
            
            p.elim = function(block) {
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
            
        })(ConstantStatement.prototype);
        
        l.error = new ConstantStatement('error');
        l.ok = new ConstantStatement('ok');
        
        
        //---------------------------------------------------------
        function BinaryOperation(P,Q) {
            BinaryOperation.SUPERCLASS.call(this);
            
            this.left = P;
            this.right = Q;
        }
        inherits(BinaryOperation, Statement);
        
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
                    ' ',
                    this.op.text,
                    ' ',
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
            
            p.intro = function(block) {
                block = block || this.getParent();
                
                var fromblock = block.from(this.left);
                
                fromblock.show(this.right);
                fromblock.output();
                
                return block.getCurrent();
            };
            p.intro.params = 0;
            p.introLeft = p.intro;
            p.introRight = p.intro;
            

            p.elim = function(block) {
                block = block || this.getParent();
                
                var i = block.show(this.left);
                var j = block.append(this.right);
                
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
                return new Conjunction(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '&',
                'html': '&'
            };
            
            
            // only one intro tactic
            
            p.intro = function(block) {
                block = block || this.getParent();
                
                var i = block.show(this.left);
                var j = block.show(this.right);
                
                var k = block.append(this);
                k.annotate([i,j],'Conjunction introduction');
                
                return i;
            };
            p.intro.params = 0;
            p.introLeft = p.intro;
            p.introRight = p.intro.left;
            
            
            p.elimLeft = function(block) {
                block = block || this.getParent();
                
                var i = block.append(this.left);
                i.annotate([this],'left projection');
                
                return i;
            };
            p.elimLeft.params = 0;
                
            p.elimRight = function(block) {
                block = block || this.getParent();
                
                var i = block.append(this.right);
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
                return new Disjunction(this.left.copy(), this.right.copy());
            };
            
            
            p.op = {
                'text': '|',
                'html': '|'
            };
            
            
            p.introLeft = function(block) {
                block = block || this.getParent();
                
                var i = block.show(this.left);
                
                var j = block.append(this);
                j.annotate([i],'left injection');
                
                return j;
            };
            p.introLeft.params = 0;
            
            p.introRight = function(block) {
                block = block || this.getParent();
                
                var i = block.show(this.right);
                
                var j = block.append(this);
                j.annotate([i],'right injection');
                
                return j;
            };
            p.introRight.params = 0;
                
            p.intro = p.introLeft;
            
            // only one of these
            
            p.elim = function(block,X) {
                block = block || this.getParent();
                
                if (!X) {
                    throw this.error('elim: missing parameter');
                }
                
                var i = block.show(new Conditional(this.left,X));
                var j = block.show(new Conditional(this.right,X));
                
                var k = block.append(X);
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

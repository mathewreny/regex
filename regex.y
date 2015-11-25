/*
Copyright 2015 Mathew Reny

Regular expression parser for Jison Yacc.
*/

%lex

%{
parse = {
  union: (function(a, b) {
    var u = {};
    u.op = "u";
    u.expanded = false;
    u.text = a.text + "|" + b.text;
    var ac = ("u" === a.op) ? a.children : [a];
    var bc = ("u" === b.op) ? b.children : [b];
    u.children = ac.concat(bc);
    return u;
  }),
  cat: (function(a, b) {
    var c = {};
    c.op = "c";
    c.expanded = false;
    c.text  = ("u" === a.op) ? "(" + a.text + ")" : a.text;
    c.text += ("u" === b.op) ? "(" + b.text + ")" : b.text;
    var ac = ("c" === a.op) ? a.children : [a];
    var bc = ("c" === b.op) ? b.children : [b];
    c.children = ac.concat(bc);
    return c;
  }),
  star: (function(a) {
    var s = {};
    s.op = "s";
    s.expanded = false;
    s.text = ("t" === a.op) ? a.text + "*" : "(" + a.text + ")*";
    s.children = [a];
    return s;
  }),
  terminal: (function(text) {
    var t = {};
    t.op = "t";
    t.expanded = true;
    t.text = text;
    return t;
  })
};
%}

%%




[a-zA-Z0-9]  return 'TERMINAL'
"|"          return '|'
"*"          return '*'
"("          return '('
")"          return ')'
<<EOF>>      return 'EOF'



/lex

%start prog

%% /* language grammar */

prog: /* empty */         { yyerror("empty pattern"); }
|     expr1 EOF           { return $1; }
;

expr1: expr2
|      expr1 '|' expr2    { $$ = parse.union($1, $3); }
;

expr2: expr3
|      expr2 expr3        { $$ = parse.cat($1, $2);   }
;

expr3: expr4
|      expr3 '*'          { $$ = parse.star($1);      }
;

expr4: TERMINAL           { $$ = parse.terminal($1);  }
|      '(' expr1 ')'      { $$ = $2;                  }
;



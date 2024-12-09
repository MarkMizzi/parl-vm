// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
import {highlighting} from "./parl-asm-highlight.js"
export const parser = LRParser.deserialize({
  version: 14,
  states: "!dQYQPOOObQPO'#C`OvQPO'#CgO{QPO'#CgQYQPOOOOQO'#Cb'#CbOOQO,58z,58zO!QQPO,59ROOQO,59R,59ROOQO-E6e-E6eOOQO1G.m1G.m",
  stateData: "![~O^OSPOS~ORQOTPO~ORTOVTOWTOXTOYTO`SX~O_VO~O`WO~O`YO~OWXPX~",
  goto: "j[PPPP]PaPPPPdTROSRUPQSORXS",
  nodeNames: "⚠ LineComment PixelAsmProgram FunctionLabel Instruction Opcode Data Number PCOffset Colour Label",
  maxTerm: 16,
  propSources: [highlighting],
  skippedNodes: [0,1],
  repeatNodeCount: 1,
  tokenData: "=v~R{XY#xYZ$Z]^#xpq#xst$`!O!P&Q!P!Q'Z!Q!['x![!](Z!c!d(`!e!f)Z!f!g+W!g!h,`!i!j,f!j!k-T!k!l-|!l!m.]!n!o.c!o!p.l!p!q/X!q!r/k!r!s/t!t!u0j!u!v1S!y!z1c!}#O2j#T#U3b#V#W4`#W#X6T#X#Y7]#Z#[7c#[#]8Q#]#^8y#^#_9`#`#a9f#a#b9x#b#c:e#c#d:w#d#e;Q#f#g;v#g#h<`#j#k#x#k#l<o~#}S^~XY#x]^#xpq#x#j#k#x~$`O`~~$cS!Q![$o!c!i$o!r!s$}#T#Z$o~$tRX~!Q![$o!c!i$o#T#Z$o~%QP!e!f%T~%WQ{|%^}!O%^~%aQ!O!P%g!Q![%u~%jP!Q![%m~%rPW~!Q![%m~%zQW~!O!P%g!Q![%u~&TS!Q![&a!c!}&i#R#S&i#T#o&i~&fPV~!Q![&a~&lS!Q![&x!c!}&x#R#S&x#T#o&x~&}SR~!Q![&x!c!}&x#R#S&x#T#o&x~'^P!P!Q'a~'fSP~OY'aZ;'S'a;'S;=`'r<%lO'a~'uP;=`<%l'a~'}QV~!O!P(T!Q!['x~(WP!Q![&a~(`O_~~(cR!f!g(l!n!o(w!p!q(l~(oP!f!g(r~(wOT~~(zP!n!o(}~)QP!q!r)T~)WP!e!f(r~)^S!c!d)j!h!i)v!l!m*`!n!o*t~)mP!n!o)p~)sP!n!o(r~)yP!t!u)|~*PP!c!d*S~*VP!o!p*Y~*]P!g!h(r~*cP!o!p*f~*iP!r!s*l~*qPT~!S!T(r~*wP!g!h*z~*}P!c!d+Q~+TP!t!u(r~+ZS!g!h+g!k!l+|!t!u,S!w!x,Y~+jQ!e!f(r!n!o+p~+sP!c!d+v~+yP!{!|(r~,PP!x!y(r~,VP!q!r,Y~,]P!r!s(r~,cP!s!t(r~,iQ!g!h,o!v!w(r~,tPT~!v!w,w~,zP!e!f,}~-QP!j!k*z~-WQ!c!d-^!g!h-j~-aP!n!o-d~-gP!v!w(r~-mP!k!l-p~-sP!i!j-v~-yP!j!k-d~.PQ!p!q)T!t!u.V~.YP!p!q(l~.`P!o!p,Y~.fQ!g!h(r!v!w(r~.oS!c!d.{!k!l/R!q!r(l!w!x)p~/OP!z!{(r~/UP!p!q(r~/[Q!g!h,`!q!r/b~/eQ!r!s(r!v!w(r~/nQ!h!i)v!t!u(r~/wQ!t!u/}!w!x0Z~0QP!k!l0T~0WP!p!q-d~0^Q!u!v0d!v!w,w~0gP!j!k(r~0mQ!g!h0s!q!r0|~0vQ!c!d(l!v!w(r~1PP!w!x.V~1VQ!v!w(r!w!x1]~1`P!d!e(r~1fQ!k!l1l!t!u1x~1oP!f!g1r~1uP!v!w0d~1{P!k!l2O~2RP!v!w2U~2XP!g!h2[~2aPT~!d!e2d~2gP!q!r.{~2mP!Q![2p~2sR!Q![2p![!]2|#P#Q3]~3PP!Q![3S~3VQ!Q![3S#P#Q3]~3bOY~~3eR#W#X3n#`#a3t#b#c3n~3qP#W#X(r~3wP#`#a3z~3}P#c#d4Q~4TP#V#W4W~4]PT~#T#U(r~4cS#T#U4o#Y#Z4{#^#_5e#`#a5q~4rP#`#a4u~4xP#`#a(r~5OP#f#g5R~5UP#T#U5X~5[P#a#b5_~5bP#X#Y(r~5hP#a#b5k~5nP#d#e*l~5tP#X#Y5w~5zP#T#U5}~6QP#f#g(r~6WS#X#Y6d#]#^6y#f#g7P#i#j7V~6gQ#V#W(r#`#a6m~6pP#T#U6s~6vP#m#n(r~6|P#j#k(r~7SP#c#d7V~7YP#d#e(r~7`P#e#f(r~7fQ#X#Y7l#h#i(r~7qPT~#h#i7t~7wP#V#W7z~7}P#[#]5w~8TQ#T#U8Z#X#Y8g~8^P#`#a8a~8dP#h#i(r~8jP#]#^8m~8pP#Z#[8s~8vP#[#]8a~8|Q#b#c9S#f#g9Y~9VP#V#W(r~9]P#b#c3n~9cP#a#b7V~9iR#W#X9r#X#Y(r#h#i(r~9uP#T#U(r~9{S#T#U:X#]#^:_#c#d3n#i#j4u~:[P#l#m(r~:bP#b#c(r~:hQ#X#Y7]#c#d:n~:qQ#d#e(r#h#i(r~:zQ#Y#Z4{#f#g(r~;TQ#f#g;Z#i#j;g~;^P#]#^;a~;dP#b#c8a~;jQ#g#h;p#h#i7t~;sP#[#](r~;yQ#X#Y<P#c#d<Y~<SQ#T#U3n#h#i(r~<]P#i#j9Y~<cQ#h#i4W#i#j<i~<lP#U#V(r~<rQ#]#^<x#f#g=U~<{P#W#X=O~=RP#h#i;p~=XP#]#^=[~=_P#h#i=b~=eP#X#Y=h~=mPT~#U#V=p~=sP#c#d:X",
  tokenizers: [0],
  topRules: {"PixelAsmProgram":[0,2]},
  tokenPrec: 53
})
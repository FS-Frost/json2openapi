var Nn=Array.isArray,Kt=Array.prototype.indexOf,Pn=Array.from,bn=Object.defineProperty,ct=Object.getOwnPropertyDescriptor,Zt=Object.getOwnPropertyDescriptors,Cn=Object.prototype,Fn=Array.prototype,Wt=Object.getPrototypeOf;const qn=()=>{};function Ln(t){return t()}function zt(t){for(var n=0;n<t.length;n++)t[n]()}const w=2,yt=4,Z=8,ut=16,m=32,W=64,nt=128,k=256,B=512,y=1024,D=2048,z=4096,N=8192,b=16384,Jt=32768,wt=65536,Yn=1<<17,Qt=1<<19,Et=1<<20,vt=Symbol("$state"),Mn=Symbol("legacy props");function mt(t){return t===this.v}function Xt(t,n){return t!=t?n==n:t!==n||t!==null&&typeof t=="object"||typeof t=="function"}function Tt(t){return!Xt(t,this.v)}function tn(t){throw new Error("https://svelte.dev/e/effect_in_teardown")}function nn(){throw new Error("https://svelte.dev/e/effect_in_unowned_derived")}function rn(t){throw new Error("https://svelte.dev/e/effect_orphan")}function en(){throw new Error("https://svelte.dev/e/effect_update_depth_exceeded")}function jn(){throw new Error("https://svelte.dev/e/hydration_failed")}function Un(t){throw new Error("https://svelte.dev/e/props_invalid_value")}function Hn(){throw new Error("https://svelte.dev/e/state_descriptors_fixed")}function Bn(){throw new Error("https://svelte.dev/e/state_prototype_fixed")}function ln(){throw new Error("https://svelte.dev/e/state_unsafe_local_read")}function sn(){throw new Error("https://svelte.dev/e/state_unsafe_mutation")}let J=!1;function Vn(){J=!0}const $n=1,Gn=2,Kn=4,Zn=8,Wn=16,zn=1,Jn=2,un="[",an="[!",on="]",gt={},Qn=Symbol();function at(t,n){var r={f:0,v:t,reactions:null,equals:mt,rv:0,wv:0};return r}function Xn(t){return fn(at(t))}function tr(t,n=!1){var e;const r=at(t);return n||(r.equals=Tt),J&&f!==null&&f.l!==null&&((e=f.l).s??(e.s=[])).push(r),r}function fn(t){return o!==null&&o.f&w&&(E===null?An([t]):E.push(t)),t}function nr(t,n){return o!==null&&ft()&&o.f&(w|ut)&&(E===null||!E.includes(t))&&sn(),_n(t,n)}function _n(t,n){return t.equals(n)||(t.v,t.v=n,t.wv=Ut(),At(t,D),ft()&&a!==null&&a.f&y&&!(a.f&m)&&(h!==null&&h.includes(t)?(g(a,D),tt(a)):A===null?xn([t]):A.push(t))),n}function At(t,n){var r=t.reactions;if(r!==null)for(var e=ft(),l=r.length,s=0;s<l;s++){var u=r[s],i=u.f;i&D||!e&&u===a||(g(u,n),i&(y|k)&&(i&w?At(u,z):tt(u)))}}function xt(t){console.warn("https://svelte.dev/e/hydration_mismatch")}let P=!1;function rr(t){P=t}let T;function F(t){if(t===null)throw xt(),gt;return T=t}function er(){return F(C(T))}function lr(t){if(P){if(C(T)!==null)throw xt(),gt;T=t}}function sr(){for(var t=0,n=T;;){if(n.nodeType===8){var r=n.data;if(r===on){if(t===0)return n;t-=1}else(r===un||r===an)&&(t+=1)}var e=C(n);n.remove(),n=e}}var pt,cn,Rt,Dt;function ur(){if(pt===void 0){pt=window,cn=document;var t=Element.prototype,n=Node.prototype;Rt=ct(n,"firstChild").get,Dt=ct(n,"nextSibling").get,t.__click=void 0,t.__className="",t.__attributes=null,t.__styles=null,t.__e=void 0,Text.prototype.__t=void 0}}function rt(t=""){return document.createTextNode(t)}function et(t){return Rt.call(t)}function C(t){return Dt.call(t)}function ar(t,n){if(!P)return et(t);var r=et(T);if(r===null)r=T.appendChild(rt());else if(n&&r.nodeType!==3){var e=rt();return r==null||r.before(e),F(e),e}return F(r),r}function or(t,n){if(!P){var r=et(t);return r instanceof Comment&&r.data===""?C(r):r}return T}function ir(t,n=1,r=!1){let e=P?T:t;for(var l;n--;)l=e,e=C(e);if(!P)return e;var s=e==null?void 0:e.nodeType;if(r&&s!==3){var u=rt();return e===null?l==null||l.after(u):e.before(u),F(u),u}return F(e),e}function fr(t){t.textContent=""}function vn(t){var n=w|D;a===null?n|=k:a.f|=Et;var r=o!==null&&o.f&w?o:null;const e={children:null,ctx:f,deps:null,equals:mt,f:n,fn:t,reactions:null,rv:0,v:null,wv:0,parent:r??a};return r!==null&&(r.children??(r.children=[])).push(e),e}function _r(t){const n=vn(t);return n.equals=Tt,n}function St(t){var n=t.children;if(n!==null){t.children=null;for(var r=0;r<n.length;r+=1){var e=n[r];e.f&w?ot(e):S(e)}}}function pn(t){for(var n=t.parent;n!==null;){if(!(n.f&w))return n;n=n.parent}return null}function kt(t){var n,r=a;G(pn(t));try{St(t),n=Ht(t)}finally{G(r)}return n}function Ot(t){var n=kt(t),r=(R||t.f&k)&&t.deps!==null?z:y;g(t,r),t.equals(n)||(t.v=n,t.wv=Ut())}function ot(t){St(t),Y(t,0),g(t,b),t.v=t.children=t.deps=t.ctx=t.reactions=null}function It(t){a===null&&o===null&&rn(),o!==null&&o.f&k&&nn(),it&&tn()}function hn(t,n){var r=n.last;r===null?n.last=n.first=t:(r.next=t,t.prev=r,n.last=t)}function M(t,n,r,e=!0){var l=(t&W)!==0,s=a,u={ctx:f,deps:null,deriveds:null,nodes_start:null,nodes_end:null,f:t|D,first:null,fn:n,last:null,next:null,parent:l?null:s,prev:null,teardown:null,transitions:null,wv:0};if(r){var i=O;try{ht(!0),X(u),u.f|=Jt}catch(c){throw S(u),c}finally{ht(i)}}else n!==null&&tt(u);var _=r&&u.deps===null&&u.first===null&&u.nodes_start===null&&u.teardown===null&&(u.f&Et)===0;if(!_&&!l&&e&&(s!==null&&hn(u,s),o!==null&&o.f&w)){var p=o;(p.children??(p.children=[])).push(u)}return u}function cr(t){It();var n=a!==null&&(a.f&m)!==0&&f!==null&&!f.m;if(n){var r=f;(r.e??(r.e=[])).push({fn:t,effect:a,reaction:o})}else{var e=Nt(t);return e}}function vr(t){return It(),dn(t)}function pr(t){const n=M(W,t,!0);return(r={})=>new Promise(e=>{r.outro?En(n,()=>{S(n),e(void 0)}):(S(n),e(void 0))})}function Nt(t){return M(yt,t,!1)}function dn(t){return M(Z,t,!0)}function hr(t){return yn(t)}function yn(t,n=0){return M(Z|ut|n,t,!0)}function dr(t,n=!0){return M(Z|m,t,!0,n)}function Pt(t){var n=t.teardown;if(n!==null){const r=it,e=o;dt(!0),$(null);try{n.call(null)}finally{dt(r),$(e)}}}function bt(t){var n=t.deriveds;if(n!==null){t.deriveds=null;for(var r=0;r<n.length;r+=1)ot(n[r])}}function Ct(t,n=!1){var r=t.first;for(t.first=t.last=null;r!==null;){var e=r.next;S(r,n),r=e}}function wn(t){for(var n=t.first;n!==null;){var r=n.next;n.f&m||S(n),n=r}}function S(t,n=!0){var r=!1;if((n||t.f&Qt)&&t.nodes_start!==null){for(var e=t.nodes_start,l=t.nodes_end;e!==null;){var s=e===l?null:C(e);e.remove(),e=s}r=!0}Ct(t,n&&!r),bt(t),Y(t,0),g(t,b);var u=t.transitions;if(u!==null)for(const _ of u)_.stop();Pt(t);var i=t.parent;i!==null&&i.first!==null&&Ft(t),t.next=t.prev=t.teardown=t.ctx=t.deps=t.fn=t.nodes_start=t.nodes_end=null}function Ft(t){var n=t.parent,r=t.prev,e=t.next;r!==null&&(r.next=e),e!==null&&(e.prev=r),n!==null&&(n.first===t&&(n.first=e),n.last===t&&(n.last=r))}function En(t,n){var r=[];qt(t,r,!0),mn(r,()=>{S(t),n&&n()})}function mn(t,n){var r=t.length;if(r>0){var e=()=>--r||n();for(var l of t)l.out(e)}else n()}function qt(t,n,r){if(!(t.f&N)){if(t.f^=N,t.transitions!==null)for(const u of t.transitions)(u.is_global||r)&&n.push(u);for(var e=t.first;e!==null;){var l=e.next,s=(e.f&wt)!==0||(e.f&m)!==0;qt(e,n,s?r:!1),e=l}}}function yr(t){Lt(t,!0)}function Lt(t,n){if(t.f&N){j(t)&&X(t),t.f^=N;for(var r=t.first;r!==null;){var e=r.next,l=(r.f&wt)!==0||(r.f&m)!==0;Lt(r,l?n:!1),r=e}if(t.transitions!==null)for(const s of t.transitions)(s.is_global||n)&&s.in()}}let V=!1,lt=[];function Yt(){V=!1;const t=lt.slice();lt=[],zt(t)}function wr(t){V||(V=!0,queueMicrotask(Yt)),lt.push(t)}function Tn(){V&&Yt()}const Mt=0,gn=1;let U=!1,H=Mt,q=!1,L=null,O=!1,it=!1;function ht(t){O=t}function dt(t){it=t}let x=[],I=0;let o=null;function $(t){o=t}let a=null;function G(t){a=t}let E=null;function An(t){E=t}let h=null,d=0,A=null;function xn(t){A=t}let jt=1,K=0,R=!1,f=null;function Ut(){return++jt}function ft(){return!J||f!==null&&f.l===null}function j(t){var p;var n=t.f;if(n&D)return!0;if(n&z){var r=t.deps,e=(n&k)!==0;if(r!==null){var l,s,u=(n&B)!==0,i=e&&a!==null&&!R,_=r.length;if(u||i){for(l=0;l<_;l++)s=r[l],(u||!((p=s==null?void 0:s.reactions)!=null&&p.includes(t)))&&(s.reactions??(s.reactions=[])).push(t);u&&(t.f^=B)}for(l=0;l<_;l++)if(s=r[l],j(s)&&Ot(s),s.wv>t.wv)return!0}(!e||a!==null&&!R)&&g(t,y)}return!1}function Rn(t,n){for(var r=n;r!==null;){if(r.f&nt)try{r.fn(t);return}catch{r.f^=nt}r=r.parent}throw U=!1,t}function Dn(t){return(t.f&b)===0&&(t.parent===null||(t.parent.f&nt)===0)}function Q(t,n,r,e){if(U){if(r===null&&(U=!1),Dn(n))throw t;return}r!==null&&(U=!0);{Rn(t,n);return}}function Ht(t){var _t;var n=h,r=d,e=A,l=o,s=R,u=E,i=f,_=t.f;h=null,d=0,A=null,o=_&(m|W)?null:t,R=!O&&(_&k)!==0,E=null,f=t.ctx,K++;try{var p=(0,t.fn)(),c=t.deps;if(h!==null){var v;if(Y(t,d),c!==null&&d>0)for(c.length=d+h.length,v=0;v<h.length;v++)c[d+v]=h[v];else t.deps=c=h;if(!R)for(v=d;v<c.length;v++)((_t=c[v]).reactions??(_t.reactions=[])).push(t)}else c!==null&&d<c.length&&(Y(t,d),c.length=d);return l!==null&&K++,p}finally{h=n,d=r,A=e,o=l,R=s,E=u,f=i}}function Sn(t,n){let r=n.reactions;if(r!==null){var e=Kt.call(r,t);if(e!==-1){var l=r.length-1;l===0?r=n.reactions=null:(r[e]=r[l],r.pop())}}r===null&&n.f&w&&(h===null||!h.includes(n))&&(g(n,z),n.f&(k|B)||(n.f^=B),Y(n,0))}function Y(t,n){var r=t.deps;if(r!==null)for(var e=n;e<r.length;e++)Sn(t,r[e])}function X(t){var n=t.f;if(!(n&b)){g(t,y);var r=a,e=f;a=t;try{n&ut?wn(t):Ct(t),bt(t),Pt(t);var l=Ht(t);t.teardown=typeof l=="function"?l:null,t.wv=jt;var s=t.deps,u}catch(i){Q(i,t,r,e||t.ctx)}finally{a=r}}}function Bt(){if(I>1e3){I=0;try{en()}catch(t){if(L!==null)Q(t,L,null);else throw t}}I++}function Vt(t){var n=t.length;if(n!==0){Bt();var r=O;O=!0;try{for(var e=0;e<n;e++){var l=t[e];l.f&y||(l.f^=y);var s=[];$t(l,s),kn(s)}}finally{O=r}}}function kn(t){var n=t.length;if(n!==0)for(var r=0;r<n;r++){var e=t[r];if(!(e.f&(b|N)))try{j(e)&&(X(e),e.deps===null&&e.first===null&&e.nodes_start===null&&(e.teardown===null?Ft(e):e.fn=null))}catch(l){Q(l,e,null,e.ctx)}}}function On(){if(q=!1,I>1001)return;const t=x;x=[],Vt(t),q||(I=0,L=null)}function tt(t){H===Mt&&(q||(q=!0,queueMicrotask(On))),L=t;for(var n=t;n.parent!==null;){n=n.parent;var r=n.f;if(r&(W|m)){if(!(r&y))return;n.f^=y}}x.push(n)}function $t(t,n){var r=t.first,e=[];t:for(;r!==null;){var l=r.f,s=(l&m)!==0,u=s&&(l&y)!==0,i=r.next;if(!u&&!(l&N))if(l&Z){if(s)r.f^=y;else try{j(r)&&X(r)}catch(v){Q(v,r,null,r.ctx)}var _=r.first;if(_!==null){r=_;continue}}else l&yt&&e.push(r);if(i===null){let v=r.parent;for(;v!==null;){if(t===v)break t;var p=v.next;if(p!==null){r=p;continue t}v=v.parent}}r=i}for(var c=0;c<e.length;c++)_=e[c],n.push(_),$t(_,n)}function Gt(t){var n=H,r=x;try{Bt();const l=[];H=gn,x=l,q=!1,Vt(r);var e=t==null?void 0:t();return Tn(),(x.length>0||l.length>0)&&Gt(),I=0,L=null,e}finally{H=n,x=r}}async function Er(){await Promise.resolve(),Gt()}function mr(t){var c;var n=t.f,r=(n&w)!==0;if(r&&n&b){var e=kt(t);return ot(t),e}if(o!==null){E!==null&&E.includes(t)&&ln();var l=o.deps;t.rv<K&&(t.rv=K,h===null&&l!==null&&l[d]===t?d++:h===null?h=[t]:h.push(t),A!==null&&a!==null&&a.f&y&&!(a.f&m)&&A.includes(t)&&(g(a,D),tt(a)))}else if(r&&t.deps===null)for(var s=t,u=s.parent,i=s;u!==null;)if(u.f&w){var _=u;i=_,u=_.parent}else{var p=u;(c=p.deriveds)!=null&&c.includes(i)||(p.deriveds??(p.deriveds=[])).push(i);break}return r&&(s=t,j(s)&&Ot(s)),t.v}function Tr(t){const n=o;try{return o=null,t()}finally{o=n}}const In=-7169;function g(t,n){t.f=t.f&In|n}function gr(t,n=!1,r){f={p:f,c:null,e:null,m:!1,s:t,x:null,l:null},J&&!n&&(f.l={s:null,u:null,r1:[],r2:at(!1)})}function Ar(t){const n=f;if(n!==null){t!==void 0&&(n.x=t);const u=n.e;if(u!==null){var r=a,e=o;n.e=null;try{for(var l=0;l<u.length;l++){var s=u[l];G(s.effect),$(s.reaction),Nt(s.fn)}}finally{G(r),$(e)}}f=n.p,n.m=!0}return t||{}}function xr(t){if(!(typeof t!="object"||!t||t instanceof EventTarget)){if(vt in t)st(t);else if(!Array.isArray(t))for(let n in t){const r=t[n];typeof r=="object"&&r&&vt in r&&st(r)}}}function st(t,n=new Set){if(typeof t=="object"&&t!==null&&!(t instanceof EventTarget)&&!n.has(t)){n.add(t),t instanceof Date&&t.getTime();for(let e in t)try{st(t[e],n)}catch{}const r=Wt(t);if(r!==Object.prototype&&r!==Array.prototype&&r!==Map.prototype&&r!==Set.prototype&&r!==Date.prototype){const e=Zt(r);for(let l in e){const s=e[l].get;if(s)try{s.call(t)}catch{}}}}}export{nr as $,P as A,C as B,rr as C,F as D,rt as E,yn as F,Qt as G,un as H,T as I,et as J,ur as K,gt as L,er as M,on as N,xt as O,jn as P,fr as Q,Pn as R,pr as S,dr as T,zn as U,Jn as V,vt as W,Cn as X,Fn as Y,at as Z,Hn as _,Tr as a,ct as a0,Qn as a1,Bn as a2,Wt as a3,wt as a4,an as a5,sr as a6,yr as a7,En as a8,Nt as a9,dn as aa,wr as ab,Un as ac,Yn as ad,Kn as ae,Tt as af,m as ag,W as ah,$n as ai,Gn as aj,Zn as ak,Mn as al,_r as am,tr as an,Wn as ao,Gt as ap,Er as aq,Xn as ar,cn as as,vr as b,f as c,Ln as d,Vn as e,xr as f,mr as g,vn as h,or as i,Ar as j,ar as k,J as l,lr as m,qn as n,ir as o,gr as p,bn as q,zt as r,Xt as s,hr as t,cr as u,$ as v,G as w,Nn as x,o as y,a as z};

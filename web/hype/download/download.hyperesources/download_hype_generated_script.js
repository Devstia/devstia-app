//	HYPE.documents["download"]

(function(){(function m(){function k(a,b,c,d){var e=!1;null==window[a]&&(null==window[b]?(window[b]=[],window[b].push(m),a=document.getElementsByTagName("head")[0],b=document.createElement("script"),e=l,false==!0&&(e=""),b.type="text/javascript",""!=d&&(b.integrity=d,b.setAttribute("crossorigin","anonymous")),b.src=e+"/"+c,a.appendChild(b)):window[b].push(m),e=!0);return e}var l="download.hyperesources",f="download",g="download_hype_container";if(false==
!1)try{for(var c=document.getElementsByTagName("script"),a=0;a<c.length;a++){var d=c[a].src,b=null!=d?d.indexOf("/download_hype_generated_script.js"):-1;if(-1!=b){l=d.substr(0,b);break}}}catch(p){}c=null==navigator.userAgentData&&navigator.userAgent.match(/MSIE (\d+\.\d+)/);c=parseFloat(c&&c[1])||null;d=!0==(null!=window.HYPE_754F||null!=window.HYPE_dtl_754F)||true==!0||null!=c&&10>c;a=!0==d?"HYPE-754.full.min.js":"HYPE-754.thin.min.js";c=!0==d?"F":"T";
d=d?"":"";if(false==!1&&(a=k("HYPE_754"+c,"HYPE_dtl_754"+c,a,d),false==!0&&(a=a||k("HYPE_w_754","HYPE_wdtl_754","HYPE-754.waypoints.min.js","")),false==!0&&(a=a||k("Matter","HYPE_pdtl_754","HYPE-754.physics.min.js","")),a))return;d=window.HYPE.documents;if(null!=d[f]){b=1;a=f;do f=""+a+"-"+b++;while(null!=d[f]);for(var e=
document.getElementsByTagName("div"),b=!1,a=0;a<e.length;a++)if(e[a].id==g&&null==e[a].getAttribute("HYP_dn")){var b=1,h=g;do g=""+h+"-"+b++;while(null!=document.getElementById(g));e[a].id=g;b=!0;break}if(!1==b)return}b=[];b=[{name:"showNextMessage",source:"function(hypeDocument, element, event) {\tlet msg = dlQueue.shift();\n    if (msg == null) {\n    \n    \t// Restart messages\n    \tdlQueue = JSON.parse(JSON.stringify(dlMessages));\n    }\n    if (msgInterval != null) clearInterval(msgInterval);\n    let msgChar = 0;\n    let pause = 0;\n    let blink = 0;\n    msgInterval = setInterval(() => {\n        let elm = hypeDocument.getElementById(\"txtMessage\");\n        if (elm == null) return;\n\n        // Blinking cursor\n        if (blink > 10) {\n            elm.innerText = msg.substring(0, msgChar).replaceAll(\"~\", \"\") + \"|\";\n        }else{\n            elm.innerText = msg.substring(0, msgChar).replaceAll(\"~\", \"\");\n        }\n        if (blink > 20) blink = 0;\n        blink++;\n\n        // Pause on ~ character\n        if (pause > 0) { \n            pause--;\n            return;\n        }\n        if (msg.substring(msgChar, msgChar + 1) == \"~\") {\n            pause = 50; // Pause for 50 * 50ms = 2.5 seconds\n            msgChar++;\n            return;\n        }\n        \n        if (msgChar < msg.length) {\n            msgChar++;\n        }\n    }, 50);\t\n}",identifier:"10"}];e={};h={};for(a=0;a<b.length;a++)try{h[b[a].identifier]=b[a].name,e[b[a].name]=eval("(function(){return "+b[a].source+"})();")}catch(n){window.console&&window.console.log(n),e[b[a].name]=function(){}}c=new window["HYPE_754"+c](f,g,{"10":{p:1,n:"nodred2_2x.png",g:"68",o:true,t:"@2x"},"2":{p:1,n:"ring_2x.png",g:"19",o:true,t:"@2x"},"-2":{n:"blank.gif"},"3":{p:1,n:"locally2.png",g:"52",o:true,t:"@1x"},"11":{p:1,n:"processor.png",g:"103",o:true,t:"@1x"},"4":{p:1,n:"locally2_2x.png",g:"52",o:true,t:"@2x"},"5":{p:1,n:"server-stack1.png",g:"59",o:true,t:"@1x"},"12":{p:1,n:"processor_2x.png",g:"103",o:true,t:"@2x"},"6":{p:1,n:"server-stack1_2x.png",g:"59",o:true,t:"@2x"},"13":{p:1,n:"questions.png",g:"107",o:true,t:"@1x"},"7":{p:1,n:"wordpress2.png",g:"63",o:true,t:"@1x"},"-1":{n:"PIE.htc"},"0":{p:1,n:"logo-header-color.svg",g:"6",t:"image/svg+xml"},"8":{p:1,n:"wordpress2_2x.png",g:"63",o:true,t:"@2x"},"14":{p:1,n:"questions_2x.png",g:"107",o:true,t:"@2x"},"1":{p:1,n:"ring.png",g:"19",o:true,t:"@1x"},"9":{p:1,n:"nodred2.png",g:"68",o:true,t:"@1x"}},
l,[],e,[{n:"Welcome",o:"1",X:[0]}],[{o:"3",p:"600px",a:100,Y:620,Z:450,b:100,cA:false,c:"#FFF",L:[],bY:1,d:620,U:{"17":{V:{"Main Timeline":"131"},W:"131",n:"progress-ring"}},T:{"131":{b:[],c:"17",q:false,z:1.18,i:"131",n:"Main Timeline",a:[{f:"b",y:0,z:0.06,i:"f",e:315,s:360,o:"125"},{f:"b",y:0.06,z:0.06,i:"f",e:270,s:315,o:"125"},{f:"b",y:0.12,z:0.06,i:"f",e:225,s:270,o:"125"},{f:"b",y:0.18,z:0.06,i:"f",e:180,s:225,o:"125"},{f:"b",y:0.24,z:0.06,i:"f",e:135,s:180,o:"125"},{f:"b",y:1,z:0.06,i:"f",e:90,s:135,o:"125"},{f:"b",y:1.06,z:0.06,i:"f",e:45,s:90,o:"125"},{f:"b",y:1.12,z:0.06,i:"f",e:0,s:45,o:"125"},{f:"c",p:2,y:1.18,z:0,i:"ActionHandler",s:{a:[{i:0,b:"131",p:9,symbolOid:"17"}]},o:"131"},{y:1.18,i:"f",s:0,z:0,o:"125",f:"b"}],s:"17",f:30},kTimelineDefaultIdentifier:{q:false,z:130,i:"kTimelineDefaultIdentifier",n:"Main Timeline",a:[{f:"c",y:0,z:1,i:"d",e:308,s:216,o:"124"},{f:"c",y:0,z:1,i:"e",e:1,s:0,o:"124"},{f:"c",y:0,z:1,i:"b",e:38,s:288,o:"124"},{f:"c",y:0,z:1,i:"a",e:18,s:314,o:"124"},{f:"c",y:0,z:1,i:"c",e:584,s:408,o:"124"},{f:"c",y:0.23,z:0.07,i:"T",e:5,s:2,o:"124"},{f:"c",y:0.23,z:0.07,i:"S",e:5,s:2,o:"124"},{f:"c",y:0.23,z:0.07,i:"R",e:"rgba(0, 0, 0, 0.299)",s:"rgba(0, 0, 0, 0.299)",o:"124"},{f:"c",y:0.23,z:0.07,i:"Q",e:8,s:2,o:"124"},{f:"c",y:1,z:1,i:"d",e:308,s:308,o:"124"},{f:"c",y:1,z:1,i:"T",e:5,s:5,o:"124"},{y:1,i:"e",s:1,z:0,o:"124",f:"c"},{f:"c",y:1,z:1,i:"b",e:38,s:38,o:"124"},{f:"c",y:1,z:1,i:"a",e:18,s:18,o:"124"},{f:"c",y:1,z:1,i:"S",e:5,s:5,o:"124"},{f:"c",y:1,z:1,i:"R",e:"rgba(0, 0, 0, 0.299)",s:"rgba(0, 0, 0, 0.299)",o:"124"},{f:"c",y:1,z:1,i:"c",e:584,s:584,o:"124"},{f:"c",y:1,z:1,i:"Q",e:8,s:8,o:"124"},{f:"c",y:1.26,z:1.19,i:"cY",e:"0",s:"1",o:"114"},{f:"c",y:2,z:1,i:"d",e:103,s:308,o:"124"},{f:"c",y:2,z:0.07,i:"T",e:1,s:5,o:"124"},{f:"c",y:2,z:1,i:"b",e:-23,s:38,o:"124"},{f:"c",y:2,z:1,i:"a",e:-39,s:18,o:"124"},{f:"c",y:2,z:0.07,i:"S",e:1,s:5,o:"124"},{f:"c",y:2,z:0.07,i:"R",e:"rgba(0, 0, 0, 0.297)",s:"rgba(0, 0, 0, 0.299)",o:"124"},{f:"c",y:2,z:1,i:"c",e:195,s:584,o:"124"},{f:"c",y:2,z:0.07,i:"Q",e:0,s:8,o:"124"},{y:2.07,i:"T",s:1,z:0,o:"124",f:"c"},{y:2.07,i:"S",s:1,z:0,o:"124",f:"c"},{y:2.07,i:"R",s:"rgba(0, 0, 0, 0.297)",z:0,o:"124",f:"c"},{y:2.07,i:"Q",s:0,z:0,o:"124",f:"c"},{y:3,i:"d",s:103,z:0,o:"124",f:"c"},{y:3,i:"b",s:-23,z:0,o:"124",f:"c"},{y:3,i:"a",s:-39,z:0,o:"124",f:"c"},{y:3,i:"c",s:195,z:0,o:"124",f:"c"},{f:"c",y:3.15,z:4.15,i:"cY",e:"1",s:"0",o:"114"},{f:"c",y:3.15,z:0.15,i:"e",e:1,s:0,o:"114"},{f:"c",y:3.15,z:0.15,i:"e",e:1,s:0,o:"17"},{f:"c",y:4,z:3.14,i:"e",e:1,s:1,o:"114"},{y:4,i:"e",s:1,z:0,o:"17",f:"c"},{f:"c",y:6.15,z:7.15,i:"t",e:36,s:36,o:"113"},{f:"c",y:6.15,z:11,i:"cY",e:"0",s:"1",o:"119"},{f:"c",y:7.14,z:0.16,i:"e",e:0,s:1,o:"114"},{y:8,i:"cY",s:"1",z:0,o:"114",f:"c"},{y:8,i:"e",s:0,z:0,o:"114",f:"c"},{f:"c",y:9,z:1,i:"cR",e:0.3,s:0.65,o:"17"},{f:"c",y:9,z:1,i:"cQ",e:0.3,s:0.65,o:"17"},{f:"c",y:9,z:1,i:"b",e:-69,s:145,o:"17"},{f:"c",y:9,z:1,i:"a",e:434,s:155,o:"17"},{f:"c",y:10,z:105.13,i:"cR",e:0.3,s:0.3,o:"17"},{f:"c",y:10,z:105.13,i:"cQ",e:0.3,s:0.3,o:"17"},{f:"c",y:10,z:105.13,i:"b",e:-69,s:-69,o:"17"},{f:"c",y:10,z:105.13,i:"a",e:434,s:434,o:"17"},{f:"c",p:2,y:10.01,z:3.29,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:10.19,z:14.2,i:"cY",e:"1",s:"0",o:"115"},{f:"c",y:10.19,z:0.26,i:"b",e:100,s:-175,o:"115"},{f:"c",y:10.19,z:0.26,i:"e",e:1,s:0,o:"115"},{f:"c",y:11.15,z:6,i:"b",e:100,s:100,o:"115"},{f:"c",y:11.15,z:13,i:"e",e:1,s:1,o:"115"},{f:"c",y:14,z:0.03,i:"t",e:20,s:36,o:"113"},{f:"c",p:2,y:14,z:6,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{y:14.03,i:"t",s:20,z:0,o:"113",f:"c"},{f:"c",y:17.15,z:1,i:"d",e:110,s:154,o:"119"},{f:"c",y:17.15,z:1,i:"c",e:377,s:441,o:"115"},{f:"c",y:17.15,z:1,i:"c",e:115,s:161,o:"119"},{f:"c",y:17.15,z:1,i:"d",e:275,s:352,o:"115"},{f:"c",y:17.15,z:30.01,i:"cY",e:"1",s:"0",o:"119"},{f:"c",y:17.15,z:1,i:"a",e:33,s:89,o:"115"},{f:"c",y:17.15,z:1,i:"a",e:350,s:230,o:"119"},{f:"c",y:17.15,z:1,i:"b",e:225,s:-77,o:"119"},{f:"c",y:17.15,z:1,i:"b",e:143,s:100,o:"115"},{f:"c",y:17.15,z:1,i:"e",e:1,s:0,o:"119"},{y:18.15,i:"c",s:377,z:0,o:"115",f:"c"},{y:18.15,i:"d",s:275,z:0,o:"115",f:"c"},{y:18.15,i:"c",s:115,z:0,o:"119",f:"c"},{y:18.15,i:"d",s:110,z:0,o:"119",f:"c"},{f:"c",y:18.15,z:6,i:"a",e:350,s:350,o:"119"},{y:18.15,i:"a",s:33,z:0,o:"115",f:"c"},{y:18.15,i:"b",s:225,z:0,o:"119",f:"c"},{f:"c",y:18.15,z:28.01,i:"e",e:1,s:1,o:"119"},{y:18.15,i:"b",s:143,z:0,o:"115",f:"c"},{f:"c",p:2,y:20,z:6.24,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:24.15,z:0.24,i:"bL",e:20,s:0,o:"115"},{f:"c",y:24.15,z:0.24,i:"a",e:160,s:350,o:"119"},{f:"c",y:24.15,z:0.24,i:"e",e:0,s:1,o:"115"},{y:25.09,i:"bL",s:20,z:0,o:"115",f:"c"},{y:25.09,i:"cY",s:"1",z:0,o:"115",f:"c"},{y:25.09,i:"a",s:160,z:0,o:"119",f:"c"},{y:25.09,i:"e",s:0,z:0,o:"115",f:"c"},{f:"c",p:2,y:26.24,z:9.03,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:28.15,z:0.09,i:"cY",e:"0",s:"1",o:"117"},{f:"c",y:28.24,z:0.09,i:"cY",e:"0",s:"1",o:"121"},{f:"c",y:28.24,z:0.11,i:"cY",e:"0",s:"1",o:"118"},{y:28.24,i:"cY",s:"0",z:0,o:"117",f:"c"},{f:"c",y:28.24,z:0.21,i:"a",e:343,s:567,o:"117"},{f:"c",y:28.24,z:0.21,i:"e",e:1,s:0,o:"117"},{f:"c",y:29.03,z:0.09,i:"cY",e:"0",s:"1",o:"123"},{f:"c",y:29.03,z:0.21,i:"b",e:260,s:225,o:"121"},{f:"c",y:29.03,z:0.1,i:"cY",e:"0",s:"1",o:"122"},{f:"c",y:29.03,z:0.21,i:"a",e:376,s:567,o:"121"},{y:29.03,i:"cY",s:"0",z:0,o:"121",f:"c"},{f:"c",y:29.03,z:0.21,i:"e",e:1,s:0,o:"121"},{f:"c",y:29.05,z:1,i:"dN",e:1,s:0,o:"118"},{y:29.05,i:"cY",s:"0",z:0,o:"118",f:"c"},{f:"c",y:29.12,z:0.21,i:"b",e:304,s:225,o:"123"},{f:"c",y:29.12,z:0.21,i:"a",e:405,s:567,o:"123"},{f:"c",y:29.12,z:0.11,i:"cY",e:"0",s:"1",o:"127"},{f:"c",y:29.12,z:0.21,i:"e",e:1,s:0,o:"123"},{y:29.12,i:"cY",s:"0",z:0,o:"123",f:"c"},{f:"c",y:29.13,z:1,i:"dN",e:1,s:0,o:"122"},{y:29.13,i:"cY",s:"0",z:0,o:"122",f:"c"},{y:29.15,i:"a",s:343,z:0,o:"117",f:"c"},{f:"c",y:29.15,z:18.25,i:"e",e:1,s:1,o:"117"},{f:"c",y:29.23,z:1,i:"dN",e:1,s:0,o:"127"},{y:29.23,i:"cY",s:"0",z:0,o:"127",f:"c"},{f:"c",y:29.24,z:19.01,i:"b",e:260,s:260,o:"121"},{y:29.24,i:"a",s:376,z:0,o:"121",f:"c"},{f:"c",y:29.24,z:19.01,i:"e",e:1,s:1,o:"121"},{f:"c",y:30.03,z:18.27,i:"b",e:304,s:304,o:"123"},{y:30.03,i:"a",s:405,z:0,o:"123",f:"c"},{f:"c",y:30.03,z:18.27,i:"e",e:1,s:1,o:"123"},{y:30.05,i:"dN",s:1,z:0,o:"118",f:"c"},{y:30.13,i:"dN",s:1,z:0,o:"122",f:"c"},{y:30.23,i:"dN",s:1,z:0,o:"127",f:"c"},{f:"c",p:2,y:35.27,z:15.03,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:46.16,z:1,i:"bL",e:20,s:0,o:"119"},{f:"c",y:46.16,z:1,i:"bL",e:20,s:0,o:"118"},{f:"c",y:46.16,z:1,i:"e",e:0,s:1,o:"118"},{f:"c",y:46.16,z:1,i:"e",e:0,s:1,o:"119"},{f:"c",y:46.23,z:1,i:"bL",e:20,s:0,o:"122"},{f:"c",y:46.23,z:1,i:"e",e:0,s:1,o:"122"},{f:"c",y:46.28,z:1,i:"bL",e:20,s:0,o:"127"},{f:"c",y:46.28,z:1,i:"e",e:0,s:1,o:"127"},{y:47.16,i:"bL",s:20,z:0,o:"119",f:"c"},{y:47.16,i:"bL",s:20,z:0,o:"118",f:"c"},{y:47.16,i:"cY",s:"1",z:0,o:"119",f:"c"},{y:47.16,i:"e",s:0,z:0,o:"118",f:"c"},{y:47.16,i:"e",s:0,z:0,o:"119",f:"c"},{y:47.23,i:"bL",s:20,z:0,o:"122",f:"c"},{y:47.23,i:"e",s:0,z:0,o:"122",f:"c"},{y:47.28,i:"bL",s:20,z:0,o:"127",f:"c"},{y:47.28,i:"e",s:0,z:0,o:"127",f:"c"},{f:"d",y:48.1,z:0.28,i:"b",e:-67,s:225,o:"117"},{f:"d",y:48.1,z:0.28,i:"e",e:0,s:1,o:"117"},{f:"e",y:48.25,z:0.28,i:"b",e:-67,s:260,o:"121"},{f:"e",y:48.25,z:0.28,i:"e",e:0,s:1,o:"121"},{f:"d",y:49,z:0.28,i:"b",e:-67,s:304,o:"123"},{f:"d",y:49,z:0.28,i:"e",e:0,s:1,o:"123"},{y:49.08,i:"b",s:-67,z:0,o:"117",f:"c"},{y:49.08,i:"e",s:0,z:0,o:"117",f:"c"},{y:49.23,i:"b",s:-67,z:0,o:"121",f:"c"},{y:49.23,i:"e",s:0,z:0,o:"121",f:"c"},{y:49.28,i:"b",s:-67,z:0,o:"123",f:"c"},{y:49.28,i:"e",s:0,z:0,o:"123",f:"c"},{f:"c",y:50.22,z:0.09,i:"cY",e:"0",s:"1",o:"120"},{f:"c",p:2,y:51,z:9.16,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{y:51.01,i:"cY",s:"0",z:0,o:"120",f:"c"},{f:"c",y:51.01,z:1,i:"b",e:250,s:-45,o:"120"},{f:"c",y:51.01,z:1,i:"e",e:1,s:0,o:"120"},{y:52.01,i:"b",s:250,z:0,o:"120",f:"c"},{f:"c",y:52.01,z:41.23,i:"e",e:1,s:1,o:"120"},{f:"c",y:59.13,z:0.09,i:"cY",e:"0",s:"1",o:"129"},{f:"c",y:59.22,z:1,i:"a",e:84,s:209,o:"129"},{y:59.22,i:"cY",s:"0",z:0,o:"129",f:"c"},{f:"c",y:59.22,z:1,i:"b",e:250,s:-45,o:"129"},{f:"c",y:59.22,z:1,i:"e",e:1,s:0,o:"129"},{f:"c",y:60,z:0.09,i:"cY",e:"0",s:"1",o:"116"},{f:"c",y:60.09,z:1,i:"a",e:396,s:223,o:"116"},{f:"c",y:60.09,z:1,i:"b",e:245,s:-45,o:"116"},{y:60.09,i:"cY",s:"0",z:0,o:"116",f:"c"},{f:"c",y:60.09,z:1,i:"e",e:1,s:0,o:"116"},{f:"c",p:2,y:60.16,z:16,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{y:60.22,i:"a",s:84,z:0,o:"129",f:"c"},{y:60.22,i:"b",s:250,z:0,o:"129",f:"c"},{f:"c",y:60.22,z:33.02,i:"e",e:1,s:1,o:"129"},{y:61.09,i:"a",s:396,z:0,o:"116",f:"c"},{y:61.09,i:"b",s:245,z:0,o:"116",f:"c"},{f:"c",y:61.09,z:32.15,i:"e",e:1,s:1,o:"116"},{f:"c",p:2,y:76.16,z:20.14,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:93.24,z:1,i:"bL",e:20,s:0,o:"116"},{f:"c",y:93.24,z:1,i:"bL",e:20,s:0,o:"120"},{f:"c",y:93.24,z:1,i:"bL",e:20,s:0,o:"129"},{f:"c",y:93.24,z:1,i:"e",e:0,s:1,o:"116"},{f:"c",y:93.24,z:1,i:"e",e:0,s:1,o:"120"},{f:"c",y:93.24,z:1,i:"e",e:0,s:1,o:"129"},{y:94.24,i:"bL",s:20,z:0,o:"116",f:"c"},{y:94.24,i:"bL",s:20,z:0,o:"120",f:"c"},{y:94.24,i:"bL",s:20,z:0,o:"129",f:"c"},{y:94.24,i:"e",s:0,z:0,o:"116",f:"c"},{y:94.24,i:"e",s:0,z:0,o:"120",f:"c"},{y:94.24,i:"e",s:0,z:0,o:"129",f:"c"},{f:"c",y:96,z:1,i:"cY",e:"0",s:"1",o:"130"},{f:"c",p:2,y:97,z:18.13,i:"ActionHandler",e:{a:[{p:4,h:"10"}]},s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:97,z:1,i:"bL",e:0,s:20,o:"130"},{f:"c",y:97,z:17.16,i:"cY",e:"1",s:"0",o:"130"},{f:"c",y:97,z:1,i:"b",e:225,s:-95,o:"130"},{f:"c",y:97,z:1,i:"e",e:1,s:0,o:"130"},{f:"c",y:98,z:15.16,i:"bL",e:0,s:0,o:"130"},{y:98,i:"b",s:225,z:0,o:"130",f:"e"},{f:"c",y:98,z:15.16,i:"e",e:1,s:1,o:"130"},{f:"c",y:113.16,z:1,i:"bL",e:20,s:0,o:"130"},{f:"c",y:113.16,z:1,i:"e",e:0,s:1,o:"130"},{y:114.16,i:"bL",s:20,z:0,o:"130",f:"c"},{y:114.16,i:"cY",s:"1",z:0,o:"130",f:"c"},{y:114.16,i:"e",s:0,z:0,o:"130",f:"c"},{f:"c",y:115.13,z:1,i:"cQ",e:1,s:0.3,o:"17"},{f:"c",y:115.13,z:1,i:"cR",e:1,s:0.3,o:"17"},{f:"c",p:2,y:115.13,z:0,i:"ActionHandler",s:{a:[{p:4,h:"10"}]},o:"kTimelineDefaultIdentifier"},{f:"c",y:115.13,z:1,i:"a",e:159,s:434,o:"17"},{f:"c",y:115.13,z:1,i:"b",e:200,s:-69,o:"17"},{y:116.13,i:"cQ",s:1,z:0,o:"17",f:"c"},{y:116.13,i:"cR",s:1,z:0,o:"17",f:"c"},{y:116.13,i:"a",s:159,z:0,o:"17",f:"c"},{f:"c",y:116.13,z:10.17,i:"b",e:200,s:200,o:"17"},{f:"c",y:127,z:1,i:"b",e:68,s:133,o:"113"},{f:"c",y:127,z:1,i:"b",e:125,s:200,o:"17"},{y:128,i:"b",s:68,z:0,o:"113",f:"c"},{y:128,i:"b",s:125,z:0,o:"17",f:"c"},{f:"c",y:129,z:1,i:"e",e:0,s:1,o:"113"},{y:130,i:"e",s:0,z:0,o:"113",f:"c"}],f:30,b:[{D:1.18,H:true,E:true,z:false,F:0,G:0,C:0,b:"131"}]}},bZ:180,O:["115","130","119","129","116","120","124","128","114","113","17","125","126","123","121","117","127","122","118"],n:"Welcome","_":0,v:{"120":{h:"103",p:"no-repeat",x:"visible",a:223,q:"100% 100%",b:-45,j:"absolute",r:"inline",cY:"1",z:15,dB:"img",d:108,k:"div",c:182,bL:0,e:0},"125":{p:"no-repeat",c:200,q:"100% 100%",d:200,r:"inline",cQ:0.8,f:360,cR:0.8,h:"19",bF:"17",j:"absolute",x:"visible",k:"div",dB:"img",z:1,l:0,m:"",n:"",a:55,b:0},"128":{c:620,d:450,I:"None",J:"None",K:"None",L:"None",M:0,w:"",N:0,A:"#4293E4",x:"visible",j:"absolute",B:"#4293E4",O:0,P:0,C:"#4293E4",z:1,l:308,D:"#4293E4",m:"#003174",k:"div",n:"rgba(50, 150, 255, 0.724)",a:0,b:0},"117":{h:"63",p:"no-repeat",x:"visible",a:567,q:"100% 100%",b:225,j:"absolute",r:"inline",z:9,cY:"1",dB:"img",d:130,k:"div",c:105,e:0},"123":{h:"63",p:"no-repeat",x:"visible",a:567,q:"100% 100%",b:225,j:"absolute",r:"inline",z:11,cY:"1",dB:"img",d:130,k:"div",c:105,e:0},"126":{aU:8,G:"#FFF",c:91,aV:8,r:"inline",d:26,s:"Helvetica,Arial,Sans-Serif",t:36,Z:"break-word",v:"bold",i:"txtDLPercent",w:"0 %",bF:"17",j:"absolute",x:"visible",k:"div",y:"preserve",z:2,aS:8,aT:8,a:119,F:"center",b:76},"115":{h:"52",p:"no-repeat",x:"visible",a:89,q:"100% 100%",b:-175,j:"absolute",r:"inline",cY:"0",z:6,dB:"img",d:352,k:"div",cQ:0.4,bL:0,e:0,c:441,cR:0.4},"121":{h:"68",p:"no-repeat",x:"visible",a:567,q:"100% 100%",b:225,j:"absolute",r:"inline",z:10,cY:"1",dB:"img",d:130,k:"div",c:105,e:0},"129":{h:"103",p:"no-repeat",x:"visible",a:209,q:"100% 100%",b:-45,j:"absolute",r:"inline",cY:"1",z:16,dB:"img",d:82,k:"div",c:139,bL:0,e:0},"118":{dD:4,c:77,dE:"#2BA7FF",d:52,cY:"1",dF:"round",e:1,bL:0,dN:0,gg:"0",dG:"round",j:"absolute",x:"visible",k:"div",Q:0,z:12,R:"#000",dC:{path:[[4,4,4,4,34,35,73,48]],closed:false},S:0,a:270,dL:"nonzero",T:0,b:295},"124":{p:"no-repeat",c:408,q:"100% 100%",d:216,r:"inline",e:0,cQ:0.5,aW:0,gg:"1",cR:0.5,h:"6",j:"absolute",x:"visible",k:"div",dB:"img",z:3,Q:2,R:"rgba(0, 0, 0, 0.299)",S:2,a:314,T:2,b:288},"113":{R:"#000",S:1,T:1,bG:0,BDbG:0,dB:"button",bH:0,bI:1,Y:24,bJ:1,Z:"break-word",bK:1,BDbH:0,bL:0,aP:"pointer",a:59,b:133,BDbI:1,c:521,d:41,aS:8,e:1,aT:8,aU:8,BDbJ:1,cP:"typingCursor",bS:36,aV:8,j:"absolute",i:"txtMessage",aW:0,k:"div",A:"#FFF",B:"#FFF",BDbK:1,C:"#FFF",D:"#FFF",E:0,F:"left",G:"#FFF",r:"inline",BDbL:0,s:"'Helvetica Neue',Arial,Helvetica,Sans-Serif",I:"None",t:36,J:"None",K:"None",v:"normal",L:"None",w:"<br>",M:0,cY:"0",N:0,x:"hidden",gg:"1",O:0,y:"preserve",z:2,bD:"none",P:0,Q:2},"17":{bZ:180,c:310,d:200,r:"inline",cY:"0",cQ:0.65,e:0,bL:0,gg:"0",cA:false,cR:0.65,cS:true,cK:{a:[{p:0}]},j:"absolute",x:"visible",cL:"17",k:"div",cM:true,Q:0,z:4,bX:false,R:"#000",bY:1,cV:[],S:0,a:155,T:0,b:145},"127":{dD:4,c:139,dE:"#2BA7FF",d:135,cY:"1",dF:"round",e:1,bL:0,dN:0,gg:"0",dG:"round",j:"absolute",x:"visible",k:"div",Q:0,z:14,R:"#000",dC:{path:[[4,4,4,4,96,118,135,131]],closed:false},S:0,a:270,dL:"nonzero",T:0,b:295},"122":{dD:4,c:110,dE:"#2BA7FF",d:91,cY:"1",dF:"round",e:1,bL:0,dN:0,gg:"0",dG:"round",j:"absolute",x:"visible",k:"div",Q:0,z:13,R:"#000",dC:{path:[[4,4,4,4,67,74,106,87]],closed:false},S:0,a:270,dL:"nonzero",T:0,b:295},"116":{h:"103",p:"no-repeat",x:"visible",a:223,q:"100% 100%",b:-45,j:"absolute",r:"inline",cY:"1",z:17,dB:"img",d:82,k:"div",c:139,bL:0,e:0},"130":{h:"107",p:"no-repeat",x:"visible",a:232,q:"100% 100%",b:-95,j:"absolute",r:"inline",cY:"1",z:18,dB:"img",d:186,k:"div",c:156,bL:20,e:0},"119":{h:"59",p:"no-repeat",x:"visible",a:230,q:"100% 100%",b:-77,j:"absolute",r:"inline",cY:"1",z:8,dB:"img",d:154,k:"div",c:161,bL:0,e:0},"114":{aU:8,G:"#FFF",aT:8,c:503,aV:8,r:"inline",cY:"1",d:28,s:"Helvetica,Arial,Sans-Serif",e:0,gg:"1",t:18,Z:"break-word",w:"Please wait for download to complete.",j:"absolute",x:"visible",k:"div",y:"preserve",z:5,Q:2,aS:8,R:"#000",S:1,a:50,F:"center",T:1,b:133}}}],{"17":["125","126"]},h,{},null,false,false,-1,true,true,false,true,true);d[f]=c.API;document.getElementById(g).setAttribute("HYP_dn",f);c.z_o(this.body)})();})();

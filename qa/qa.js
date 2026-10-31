/* QA for the Ushering site: layout at 360 / 390 / desktop in all three languages, then the flows. */
const path=require("path"),fs=require("fs");
const {chromium}=require("c:/Users/DELL/Desktop/Agora/Spiritual Foundation Batch 3/node_modules/playwright");
const FILE=process.argv[2],OUT=process.argv[3];
fs.mkdirSync(OUT,{recursive:true});
const URL="file:///"+FILE.replace(/\\/g,"/");
let fails=0,checks=0;
const ok=(c,msg)=>{checks++;if(!c){fails++;console.log("FAIL  "+msg);}else console.log("ok    "+msg);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const VIEWS=["home","me","map","guide","pray","fell","leader"];
/* Team photos and For leaders open from the Home links, the rest from the tab bar */
async function go(page,v){
  if(v==="fell"||v==="leader"){await page.evaluate(()=>document.querySelector('nav.tabs [data-v="home"]').click());await sleep(120);
    await page.evaluate(v=>document.querySelector(`#homeLinks [data-go="${v}"]`).click(),v);}
  else await page.evaluate(v=>document.querySelector(`nav.tabs [data-v="${v}"]`).click(),v);
  await sleep(220);
}
async function fresh(browser,vp,opts){
  const ctx=await browser.newContext(Object.assign({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:1,isMobile:vp.w<800,hasTouch:vp.w<800,locale:"en-PH",timezoneId:"Asia/Manila"},opts||{}));
  const page=await ctx.newPage();
  const errs=[];page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,160));});page.on("pageerror",e=>errs.push("PAGEERROR "+e.message.slice(0,160)));
  return {ctx,page,errs};
}
(async()=>{
  const browser=await chromium.launch({channel:"chrome",headless:true});

  /* ---- layout sweep ---- */
  for(const vp of [{w:360,h:740,name:"m360"},{w:390,h:844,name:"m390"},{w:1280,h:800,name:"desk"}]){
    const {ctx,page,errs}=await fresh(browser,vp);
    await page.goto(URL);await sleep(900);
    for(const lang of ["tx","tl","en"]){
      await page.evaluate(l=>localStorage.setItem("vm_us_lang",l),lang);await page.reload();await sleep(600);
      for(const v of VIEWS){
        await go(page,v);
        const ov=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
        ok(ov<=0,`${vp.name} ${lang} ${v}: no horizontal overflow (${ov})`);
        const small=await page.evaluate(()=>{const out=[];document.querySelectorAll('.page.on button,.page.on a,.page.on input,.page.on select,.page.on textarea,header button,nav.tabs button').forEach(b=>{const r=b.getBoundingClientRect();if(r.width===0||r.height===0)return;if(b.type==="radio"||b.type==="checkbox"||b.type==="file")return; /* these sit inside 48px labels */if(r.height<44||r.width<44)out.push((b.className||b.tagName)+"|"+(b.textContent||"").trim().slice(0,18)+"|"+Math.round(r.width)+"x"+Math.round(r.height));});return out;});
        ok(small.length===0,`${vp.name} ${lang} ${v}: tap targets >= 44px ${small.slice(0,4).join(", ")}`);
        const tiny=await page.evaluate(()=>{const out=[];document.querySelectorAll('.page.on p,.page.on li,.page.on b,.page.on span,.page.on small,.page.on label,.page.on h2,.page.on h3').forEach(n=>{if(!n.getClientRects().length)return;if(!(n.textContent||"").trim())return;const fs=parseFloat(getComputedStyle(n).fontSize);if(fs<13.5)out.push(n.className+"|"+(n.textContent||"").trim().slice(0,14)+"|"+fs);});return out;});
        ok(tiny.length===0,`${vp.name} ${lang} ${v}: text >= 13.5px ${tiny.slice(0,3).join(", ")}`);
        if(lang==="tx")await page.screenshot({path:path.join(OUT,`${vp.name}-${v}.png`),fullPage:true});
      }
    }
    ok(errs.length===0,`${vp.name}: no console or page errors ${errs.slice(0,3).join(" || ")}`);
    await ctx.close();
  }

  /* ---- flows at 360, Taglish ---- */
  const vp={w:360,h:740};
  let {ctx,page,errs}=await fresh(browser,vp);
  await page.goto(URL);await sleep(900);

  // doors open, hero text present
  ok(await page.evaluate(()=>document.getElementById("doors").classList.contains("open")),"home: doors opened");
  ok((await page.textContent("#heroDay")).length>6,"home: date shows");
  ok(await page.evaluate(()=>/black|white|itim|puti/i.test(document.querySelector("#ticket h2").textContent)),"home: Sunday card says what to wear");
  ok(await page.evaluate(()=>!/Team \d/.test(document.getElementById("v-home").innerText)),"home: no duty team number anywhere on Home");
  ok(await page.evaluate(()=>{const k=[...document.querySelectorAll("#v-home .col > *")].map(n=>n.id).filter(Boolean);return k.indexOf("why")<k.indexOf("learn")&&k.indexOf("learn")<k.indexOf("mapLinks")&&k.indexOf("mapLinks")<k.indexOf("ticket");}),"home: order is Why, Learn the basics, Map, Sunday card");
  ok(await page.evaluate(()=>!!document.querySelector("#why h2")&&!!document.querySelector("#why .vq")),"home: Why we usher card with its verse");
  await page.click("#whyGo");await sleep(400);
  ok(await page.evaluate(()=>document.getElementById("v-guide").classList.contains("on")&&!!document.querySelector('#guideList .gsec.open[data-g="what"]')),"home: Read why we usher opens that handbook topic");
  await go(page,"home");
  await page.click('#mapLinks [data-v="map"]');await sleep(300);
  ok(await page.evaluate(()=>document.getElementById("v-map").classList.contains("on")),"home: map card opens the Map of assignments");
  await go(page,"home");
  ok(await page.evaluate(()=>document.querySelectorAll("#ticket .tline li").length===4),"home: four timeline steps");
  ok(await page.evaluate(()=>!!document.querySelector("#ticket .tline li.next")),"home: one step marked next");
  // service switch on the ticket
  const svcs=await page.evaluate(()=>document.querySelectorAll("#ticket .svcs button").length);
  ok(svcs===2,"home: two services to pick");
  await page.click("#ticket .svcs button:last-child");await sleep(100);
  ok(await page.evaluate(()=>document.querySelector("#ticket .svcs button:last-child").getAttribute("aria-pressed")==="true"),"home: picking the other service works");

  // Aa
  await page.click("#aa");await sleep(100);
  ok(await page.evaluate(()=>document.documentElement.classList.contains("big")&&getComputedStyle(document.body).fontSize==="20px"),"Aa: body 20px");
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Aa: no overflow at 20px");
  await page.reload();await sleep(600);
  ok(await page.evaluate(()=>document.documentElement.classList.contains("big")),"Aa: remembered after reload");
  for(const v of VIEWS){await go(page,v);const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,`Aa big ${v}: no overflow (${ov})`);}
  await page.screenshot({path:path.join(OUT,"m360-big-home.png"),fullPage:true});
  await go(page,"home");await page.click("#aa");await sleep(100);

  // language popover
  await page.click("#langbtn");await sleep(200);
  ok(await page.evaluate(()=>document.getElementById("langmenu").classList.contains("on")),"lang: menu opens");
  await page.click('#langmenu [data-l="en"]');await sleep(300);
  ok((await page.textContent("#langLbl"))==="English","lang: label says English");
  ok(await page.evaluate(()=>document.documentElement.lang==="en"),"lang: html lang en");
  await go(page,"me");ok((await page.textContent("#meH")).trim()==="My post","lang: English heading on My post");
  await page.click("#langbtn");await page.click('#langmenu [data-l="tx"]');await sleep(300);

  // handbook: search, open, tick, learn progress
  await go(page,"guide");
  const nSec=await page.evaluate(()=>document.querySelectorAll("#guideList .gsec").length);
  ok(nSec===13,`guide: 13 topics (${nSec})`);
  ok(await page.evaluate(()=>!document.querySelector('#guideList .gsec[data-g="tech"]')),"guide: maintainer section not in the handbook");
  await page.fill("#gFind","sunog");await sleep(150);
  ok(await page.evaluate(()=>[...document.querySelectorAll("#guideList .gsec")].filter(s=>!s.hidden).length>=1&&document.querySelector('#guideList .gsec[data-g="emerg"]:not([hidden])')!==null),"guide: search finds emergency");
  ok(await page.evaluate(()=>!!document.querySelector("#guideList .gsec:not([hidden]).open")),"guide: first match opens");
  await page.fill("#gFind","zzzzqq");await sleep(150);
  ok(await page.evaluate(()=>!document.getElementById("gEmpty").hidden),"guide: empty note for no match");
  await page.fill("#gFind","");await sleep(150);
  ok(await page.evaluate(()=>[...document.querySelectorAll("#guideList .gsec")].every(s=>!s.hidden)),"guide: clearing shows all");
  await page.click('#guideList .gsec[data-g="dress"]>button');await sleep(300);
  ok(await page.evaluate(()=>document.querySelector('#guideList .gsec[data-g="dress"]').classList.contains("open")),"guide: tapping opens dress code");
  ok(await page.evaluate(()=>document.querySelector('#guideList .gsec[data-g="dress"] .tick').classList.contains("done")),"guide: read topic gets a check");
  await page.click('#guideList .gsec[data-g="what"]>button');await sleep(300);
  ok(await page.evaluate(()=>!document.querySelector('#guideList .gsec[data-g="dress"]').classList.contains("open")),"guide: only one topic open at a time");
  await go(page,"home");
  ok((await page.textContent("#learn p")).includes("2"),"home: learn progress counts 2 read");
  await page.click("#learnGo");await sleep(400);
  ok(await page.evaluate(()=>document.getElementById("v-guide").classList.contains("on")&&!!document.querySelector("#guideList .gsec.open")),"home: Continue opens the next unread topic");

  // emergency quick link
  await go(page,"home");await page.click('#homeLinks [data-go="emerg"]');await sleep(300);
  ok(await page.evaluate(()=>document.querySelector('#guideList .gsec[data-g="emerg"]').classList.contains("open")),"home: Emergency link opens that topic");

  // phone Back button walks pages
  await go(page,"home");await go(page,"map");
  await page.goBack();await sleep(300);
  ok(await page.evaluate(()=>document.getElementById("v-home").classList.contains("on")),"back: browser Back returns to Home");

  // leader: schedule validation, roster, link
  await go(page,"leader");
  ok(await page.evaluate(()=>document.querySelectorAll("#leaderSlot .task").length===6),"leader: 6 tasks");
  await page.click('[data-lt="sched"]');await sleep(300);
  ok(await page.evaluate(()=>document.querySelector("#lt-sched").classList.contains("open")),"leader: schedule opens");
  await page.fill("#scTimes","10:00\nabc");await page.click("#scSave");await sleep(150);
  ok((await page.textContent("#scErr")).length>3,"leader: bad time is named, not saved");
  await page.fill("#scTimes","9:00\n16:00");await page.click("#scSave");await sleep(300);
  ok(await page.evaluate(()=>location.hash.includes("r=")),"leader: schedule saved into the link");
  ok(await page.evaluate(()=>document.querySelector("#lt-sched small").textContent.includes("9:00")),"leader: summary shows the new times");
  ok(await page.evaluate(()=>!document.querySelector('#lp-sched input[name="scDuty"]')),"leader: no duty team to set");
  await page.click('[data-lt="roster"]');await sleep(300);
  ok(await page.evaluate(()=>!document.querySelector("#lt-sched").classList.contains("open")),"leader: opening roster closes schedule");
  await page.fill("#rn-L1L","Ate Nena Reyes");await page.fill("#rn-GREETERS","Kuya Jun");
  await page.dispatchEvent("#rn-GREETERS","change");await sleep(100);
  ok(await page.evaluate(()=>document.querySelector("#lt-roster small").textContent.includes("2")),"leader: roster summary counts 2 names");
  await page.click("#rNext");await sleep(400);
  ok(await page.evaluate(()=>document.querySelector("#lt-share").classList.contains("open")),"leader: Next opens Send the link");
  await ctx.grantPermissions(["clipboard-read","clipboard-write"]);
  await page.click("#copyLink");await sleep(300);
  const link=await page.evaluate(()=>location.href);
  ok(/#r=/.test(link),"leader: link carries the roster");
  ok(await page.evaluate(()=>!!document.querySelector(".toast")),"leader: copy shows a toast");
  ok(await page.evaluate(()=>document.querySelector("#lt-share .tick").classList.contains("done")),"leader: share step ticked");

  // reopen the link on a fresh phone: My post lists the names
  await ctx.close();
  ({ctx,page,errs}=await fresh(browser,vp));
  await page.goto(link);await sleep(900);
  ok(await page.evaluate(()=>document.querySelector("#ticket .meta").textContent.includes("9:00")),"link: service times travel in the link");
  await go(page,"me");
  ok(await page.evaluate(()=>document.querySelector("#meList .pick b").textContent.includes("Nena")),"link: named usher listed first");
  await page.fill("#meFind","jun");await sleep(100);
  ok(await page.evaluate(()=>[...document.querySelectorAll("#meList .pick")].filter(b=>!b.hidden).length===1),"me: search narrows to one");
  await page.fill("#meFind","");
  await page.click('#meList .pick[data-code="L1-L"]');await sleep(400);
  ok(await page.evaluate(()=>document.querySelector("#idcard h2").textContent.includes("Nena")),"me: card shows the name");
  ok(await page.evaluate(()=>document.querySelectorAll("#idcard .duties li").length>=3),"me: duties listed as items");
  ok(await page.evaluate(()=>!!document.getElementById("counterSlot")),"me: counting post gets the counter");
  await page.click('#counterSlot [data-c="a"][data-d="1"]');await page.click('#counterSlot [data-c="a"][data-d="1"]');await page.click('#counterSlot [data-c="c"][data-d="1"]');await sleep(100);
  ok((await page.textContent("#cn_t"))==="3","counter: 2 adults + 1 child = 3");
  await page.click('#counterSlot [data-cnt="reset"]');await sleep(200);
  ok((await page.textContent("#cn_t"))==="0","counter: start over shows 0");
  ok(await page.evaluate(()=>!!document.querySelector(".toast button")),"counter: Undo offered, no confirm() pop-up");
  await page.click(".toast button");await sleep(200);
  ok((await page.textContent("#cn_t"))==="3","counter: Undo brings the count back");
  await page.reload();await sleep(800);
  ok(await page.evaluate(()=>document.getElementById("v-home").classList.contains("on")&&document.querySelector("#ticket .whenlist")!==null),"home: remembered post shows on the ticket");
  await go(page,"me");
  ok(await page.evaluate(()=>!!document.getElementById("idcard")),"me: phone remembers the post after reload");
  await page.screenshot({path:path.join(OUT,"m360-me-card.png"),fullPage:true});
  await page.click('#idcard [data-a="map"]');await sleep(900);
  ok(await page.evaluate(()=>document.getElementById("v-map").classList.contains("on")),"me: Show on map opens the map");
  ok(await page.evaluate(()=>document.getElementById("capH").textContent.includes("L1-L")),"map: caption shows my post");
  ok(await page.evaluate(()=>!document.getElementById("capGo").hidden),"map: Read the duties button shows");
  ok(await page.evaluate(()=>[...document.querySelectorAll("#map .uname")].some(n=>n.textContent==="Nena")),"map: short name on the marker");
  await page.screenshot({path:path.join(OUT,"m360-map-focus.png"),fullPage:true});
  await page.click("#capGo");await sleep(400);
  ok(await page.evaluate(()=>document.getElementById("v-guide").classList.contains("on")&&document.querySelector('.gsec[data-g="posts"]').classList.contains("open")),"map: Read the duties opens the posts topic");
  await go(page,"map");
  await page.click("#zIn");await sleep(400);
  const vb1=await page.evaluate(()=>document.getElementById("map").getAttribute("viewBox"));
  await page.click("#zFit");await sleep(500);
  const vb2=await page.evaluate(()=>document.getElementById("map").getAttribute("viewBox"));
  ok(vb1!==vb2&&/^0 0 1080 560/.test(vb2),"map: zoom in then whole map");
  await page.click('#mapCampusSeg [data-c="longos"]');await sleep(300);
  ok(await page.evaluate(()=>document.getElementById("modeSeg").hidden&&document.querySelectorAll("#zones .pill").length===8),"map: Longos shows 7 posts + All, no mode picker");
  await page.click('#mapCampusSeg [data-c="complex"]');await page.click('#modeSeg [data-m="comm"]');await sleep(300);
  ok(await page.evaluate(()=>document.querySelectorAll("#map .hit").length===44),"map: Communion layout has 44 spots");
  await page.screenshot({path:path.join(OUT,"m360-map-comm.png"),fullPage:true});

  // prayer: validation inline, then listed
  await go(page,"pray");
  await page.click("#prSend");await sleep(150);
  ok((await page.textContent("#prMsgErr")).length>3&&(await page.textContent("#prConErr")).length>3,"prayer: empty send names both problems inline");
  await page.fill("#prMsg","Please pray for my mother.");await page.click('input[name="prCat"][value="cat_health"]+span');await page.check("#prConsent");
  await page.click("#prSend");await sleep(400);
  ok(await page.evaluate(()=>document.querySelectorAll("#myPrList .prcard").length===1),"prayer: request appears under Your requests");
  ok(await page.evaluate(()=>document.querySelector("#myPrList .prcard .badge").textContent.length>0),"prayer: status badge shows");
  await page.screenshot({path:path.join(OUT,"m360-pray.png"),fullPage:true});

  // photos (practice mode)
  await go(page,"fell");
  await page.click("#flTask>button");await sleep(300);
  await page.fill("#flCap","Huddle last Sunday");await page.click('input[name="flTeam"][value="2"]+span');await page.fill("#flBy","Nena");
  await page.click("#flPost");await sleep(400);
  ok(await page.evaluate(()=>document.querySelectorAll("#fgrid .fcard").length===1),"photos: caption-only post shows on the wall");
  await page.click('#teamSeg [data-tm="1"]');await sleep(150);
  ok(await page.evaluate(()=>document.querySelectorAll("#fgrid .fcard").length===0),"photos: Team 1 filter hides a Team 2 post");
  await page.click('#teamSeg [data-tm="all"]');
  // leader removes it with Undo
  await go(page,"leader");await page.click('[data-lt="fell"]');await sleep(300);
  await page.click("#lp-fell [data-fdel]");await sleep(200);
  ok(await page.evaluate(()=>document.querySelectorAll("#lp-fell .fcard").length===0&&!!document.querySelector(".toast button")),"photos: Remove hides it and offers Undo");
  await page.click(".toast button");await sleep(200);
  ok(await page.evaluate(()=>document.querySelectorAll("#lp-fell .fcard").length===1),"photos: Undo restores it");
  // leader inbox (practice): mark praying
  await page.click('[data-lt="inbox"]');await sleep(300);
  ok(await page.evaluate(()=>document.querySelectorAll("#lp-inbox .prcard").length===1),"inbox: shows the request");
  await page.click('#lp-inbox [data-act="pray"]');await sleep(150);
  ok(await page.evaluate(()=>document.querySelector("#lp-inbox .prcard .badge").textContent.length>0&&document.querySelector('#lp-inbox [data-act="pray"]').getAttribute("aria-pressed")==="true"),"inbox: Praying toggles on");
  await page.click('#lp-inbox [data-act="del"]');await sleep(150);
  ok(await page.evaluate(()=>document.querySelectorAll("#lp-inbox .prcard").length===0),"inbox: Delete hides it");
  await page.click(".toast button");await sleep(150);
  ok(await page.evaluate(()=>document.querySelectorAll("#lp-inbox .prcard").length===1),"inbox: Undo restores it");
  await page.screenshot({path:path.join(OUT,"m360-leader.png"),fullPage:true});

  // tour
  await go(page,"home");
  await page.click("#tourStart");await sleep(500);
  ok(await page.evaluate(()=>!!document.querySelector(".tour-card")&&!!document.querySelector(".tour-spot:not([hidden])")),"tour: opens with a highlight");
  ok(/bagong usher|new ushers/i.test(await page.textContent("#tourP")),"tour: step 1 says what the app is for");
  let steps=0;
  for(let i=0;i<12;i++){
    const last=await page.evaluate(()=>document.getElementById("tourNext").textContent);
    steps++;
    await page.click("#tourNext");await sleep(450);
    if(!(await page.evaluate(()=>!!document.querySelector(".tour"))))break;
    const spotOk=await page.evaluate(()=>{const s=document.querySelector(".tour-spot");if(s.hidden)return true;const r=s.getBoundingClientRect();const c=document.querySelector(".tour-card").getBoundingClientRect();return r.width>20&&r.height>10&&(r.bottom<=c.top+2||r.top>=c.bottom-2);});
    ok(spotOk,`tour: step ${steps+1} highlight clear of the card`);
    if(i===2)await page.screenshot({path:path.join(OUT,"m360-tour.png")});
  }
  ok(steps===9,`tour: 9 steps walked (${steps})`);
  ok(await page.evaluate(()=>!document.querySelector(".tour")&&localStorage.getItem("vm_us_tour")==="done"&&document.getElementById("v-home").classList.contains("on")),"tour: finished, remembered, back on Home");
  ok(/ulit|again/i.test(await page.textContent("#tourStart")),"tour: button now offers to take it again");

  ok(errs.length===0,`flows: no console or page errors ${errs.slice(0,3).join(" || ")}`);
  await ctx.close();

  // reduced motion + offline banner
  ({ctx,page,errs}=await fresh(browser,vp,{reducedMotion:"reduce"}));
  await page.goto(URL);await sleep(600);
  ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector(".doors .dl")).transitionDuration)<0.01),"reduced motion: transitions collapsed");
  await ctx.setOffline(true);await page.evaluate(()=>dispatchEvent(new Event("offline")));await sleep(200);
  ok(await page.evaluate(()=>!document.getElementById("netbar").hidden),"offline: banner shows");
  await ctx.setOffline(false);await page.evaluate(()=>dispatchEvent(new Event("online")));await sleep(200);
  ok(await page.evaluate(()=>document.getElementById("netbar").hidden),"online: banner hides");
  ok(errs.length===0,`reduced: no errors ${errs.slice(0,2).join(" || ")}`);
  await ctx.close();

  // no confirm/alert anywhere
  const src=fs.readFileSync(FILE,"utf8");
  ok(!/\b(confirm|alert)\(/.test(src.slice(src.lastIndexOf("<script>"))),"source: no confirm() or alert()");
  ok(!/·|—/.test(src),"source: no middle dots or em dashes");

  await browser.close();
  console.log(`\n${checks-fails} / ${checks} checks passed`);
  process.exit(fails?1:0);
})().catch(e=>{console.error("CRASH",e);process.exit(2);});

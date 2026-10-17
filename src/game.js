/* はじまりの市 — ゲーム本体
 * 構成はファイル内の「===== 見出し =====」コメントで区切ってある。CLAUDE.md の「コードの地図」を参照。
 */
/* ================= 定義 ================= */
const ITEMS={
  berries:{name:'木の実',ch:'実',cat:'food',decay:.15,port:.6,base:1},
  grain:{name:'穀物',ch:'穀',cat:'food',decay:.02,port:.8,base:1},
  fish:{name:'魚',ch:'魚',cat:'food',decay:.2,port:.6,base:1.4},
  meat:{name:'獣の肉',ch:'肉',cat:'food',decay:.25,port:.5,base:2},
  wood:{name:'木材',ch:'木',cat:'mat',decay:.01,port:.5,base:1},
  stone:{name:'石',ch:'石',cat:'mat',decay:0,port:.4,base:.9},
  clay:{name:'粘土',ch:'粘',cat:'mat',decay:0,port:.4,base:1},
  fiber:{name:'繊維',ch:'繊',cat:'mat',decay:.03,port:.8,base:.6},
  rope:{name:'縄',ch:'縄',cat:'mat',decay:.005,port:.9,base:2.2},
  salt:{name:'塩',ch:'塩',cat:'salt',decay:0,port:1,base:2.5},
  ore:{name:'銅鉱石',ch:'鉱',cat:'cu',decay:0,port:.4,base:3},
  charcoal:{name:'木炭',ch:'炭',cat:'mat',decay:0,port:.7,base:3.5},
  copper:{name:'銅',ch:'銅',cat:'cu',decay:0,port:1,base:10},
  pot:{name:'土器',ch:'器',cat:'pot',decay:0,port:.5,base:4},
  obsidian:{name:'黒曜石',ch:'曜',cat:'rare',decay:0,port:1,base:5,rare:1},
  fossil:{name:'貝の化石',ch:'化',cat:'rare',decay:0,port:.8,base:6,rare:1},
  amber:{name:'琥珀',ch:'琥',cat:'rare',decay:0,port:1,base:9,rare:2},
  pearl:{name:'真珠',ch:'珠',cat:'rare',decay:0,port:1,base:12,rare:2},
  gold:{name:'金の粒',ch:'金',cat:'rare',decay:0,port:1,base:20,rare:3},
  jade:{name:'翡翠',ch:'翠',cat:'rare',decay:0,port:1,base:25,rare:3},
  meteor:{name:'隕鉄',ch:'隕',cat:'rare',decay:0,port:.6,base:40,rare:4},
  necklace:{name:'首飾り',ch:'飾',cat:'rare',decay:0,port:1,base:18},
  blade:{name:'石刃',ch:'片',cat:'mat',decay:0,port:.8,base:2.2},
  net:{name:'網',ch:'網',cat:'tool',dur:20,base:8,jobs:{fish:3.2}},
};
ITEMS.pot.jobs={salt:1.8};
let ORDER=Object.keys(ITEMS),TOOLS=ORDER.filter(g=>ITEMS[g].dur);
const GOODS=ORDER.filter(g=>!ITEMS[g].dur);
function refreshKeys(){ORDER=Object.keys(ITEMS);TOOLS=ORDER.filter(g=>ITEMS[g].dur)}
const FOOD=['meat','fish','berries','grain'];
const isTool=g=>!!(ITEMS[g]&&ITEMS[g].dur);

const TER={soil:'草地',forest:'林',rock:'岩場',ore:'鉱脈',clay:'粘土層',river:'川',shore:'浜'};
const REG={
  plain:{name:'平原',desc:'草地が広く、畑に向く。小川が一本流れる。',counts:{soil:14,forest:3,rock:2,clay:1},feature:'stream'},
  river:{name:'川辺',desc:'大きな川と粘土層。魚と土器の土地。',counts:{soil:7,forest:3,rock:2,clay:6},feature:'river'},
  coast:{name:'海岸',desc:'浜で塩と魚がとれる。岩場も多い。',counts:{soil:7,forest:3,rock:5,clay:3},feature:'shore'},
  forest:{name:'森',desc:'木の実と木材が豊か。岩山に銅の鉱脈が眠る。',counts:{forest:10,soil:4,rock:5,ore:2,clay:1},feature:'brook'},
};
const GATHER={
  berries:{name:'木の実を集める',tiles:['forest'],base:1.25},
  grain:{name:'野生の穀物を摘む',tiles:['soil'],base:.65},
  fish:{name:'魚を獲る',tiles:['river','shore'],base:0,abs:true,need:'先を尖らせた道具(銛・槍など)か網'},
  wood:{name:'木を切る',tiles:['forest'],base:1.1},
  stone:{name:'石を拾う',tiles:['rock','ore','river'],base:1},
  clay:{name:'粘土を掘る',tiles:['clay'],base:1},
  fiber:{name:'草を刈る',tiles:['soil','river','shore'],base:1.2},
  salt:{name:'塩をとる',tiles:['shore'],base:.45},
  ore:{name:'鉱石を掘る',tiles:['ore'],base:.5,ore:true},
};
const RECIPES=[
  {id:'rope',in:{fiber:3},out:'rope',tier:1,short:'繊維をより合わせた縄。道具の先端をしっかり縛れる。'},
  {id:'blade',in:{stone:2},out:'blade',tier:1,short:'石を打ち欠いた鋭い破片。道具の先端にすると切れ味が出る。'},
  {id:'net',in:{rope:3},out:'net',tier:2,short:'縄を編んだ網。魚がまとめて獲れる。'},
  {id:'pot',in:{clay:2,wood:1},out:'pot',needs:'kiln',tier:2,auto:true,short:'土器。食べ物が傷みにくくなり、塩を煮詰められる。'},
  {id:'charcoal',in:{wood:3},out:'charcoal',needs:'kiln',tier:2,auto:true,short:'木炭。強い火を起こせる。'},
  {id:'smelt',in:{ore:2,charcoal:2},out:'copper',needs:'kiln',tier:3,short:'鉱石を炭火で溶かすと、赤く光る金属が流れ出た。銅。'},
  {id:'neck_p',in:{pearl:1,rope:1},out:'necklace',tier:2,short:'真珠を縄に通した首飾り。身につけると毎日の体力が少し上がり、誰もが欲しがる。'},
  {id:'neck_a',in:{amber:1,rope:1},out:'necklace',tier:2,short:'琥珀を縄に通した首飾り。身につけると毎日の体力が少し上がり、誰もが欲しがる。'},
];
const RID=Object.fromEntries(RECIPES.map(r=>[r.id,r]));
const FAC={
  field:{name:'畑',ch:'畑',on:['soil'],labor:3,laborHoe:1,mat:{},needJob:'dig',desc:'穀物を植えて5日で実る。種に穀物1を使う。',tip:'川か水路の隣なら収穫1.5倍'},
  ditch:{name:'水路',ch:'溝',on:['soil'],labor:2,laborHoe:1,mat:{},needJob:'dig',desc:'川か水路の隣に掘れる。隣の畑に水が届く。',tip:'つなげて内陸まで水を引ける'},
  weir:{name:'簗',ch:'簗',on:['river'],labor:4,mat:{wood:4,stone:3,rope:2},desc:'仕掛けておけば毎日魚が2ほどかかる。'},
  saltpan:{name:'塩田',ch:'塩',on:['shore'],labor:3,mat:{clay:3,stone:2},desc:'毎日、塩が0.5ほどとれる。'},
  kiln:{name:'窯',ch:'窯',on:['soil','rock','clay'],labor:4,mat:{stone:4,clay:5},desc:'土器と木炭が焼ける。銅を溶かすのにも要る。',tip:'粘土層の隣なら土器が2つ、林の隣なら炭の木材が2で済む'},
  granary:{name:'倉',ch:'倉',on:['soil','rock'],labor:4,mat:{wood:6,clay:3,rope:1},desc:'食べ物の傷みを3分の1にする。'},
  rack:{name:'干し場',ch:'干',on:['soil','shore','rock'],labor:2,mat:{wood:3,rope:1},desc:'魚を干物にして、ほとんど傷まなくする。'},
};
/* 村の大事業: 材料と人手(labor)を村じゅうで持ち寄って建てる。rare は珍品なら何でもよい */
const WORKS={
  well:{name:'井戸',ch:'井',need:{stone:10,wood:4,rope:2,pot:2,labor:6},desc:'日照りでも水が絶えない。',effect:'干ばつと熱病の害が半分になる。',open:()=>S.day>=8},
  storehouse:{name:'共同の倉',ch:'蔵',need:{wood:14,clay:10,rope:3,labor:8},desc:'村の蓄えを一か所で守る。',effect:'村じゅうの食べ物の傷みが2割減り、獣の群れの害も半分になる。',open:()=>S.day>=15||!!S.flags.fac_granary},
  square:{name:'市の広場',ch:'市',need:{stone:14,wood:8,clay:6,labor:8},desc:'人と品物が集まる場所。',effect:'村人どうしの取引が増え、旅の商人もよく来る。あなたに声もかかりやすくなる。',open:()=>S.day>=20||Object.keys(S.flags).some(k=>k.startsWith('ind_'))},
  bridge:{name:'橋',ch:'橋',need:{wood:18,stone:8,rope:5,labor:10},desc:'川向こうの奥地へ渡れる。',effect:'遠出で危険に遭いにくくなる。',open:()=>S.day>=25},
  shrine:{name:'社',ch:'社',need:{stone:12,wood:6,clay:6,rare:3,labor:8},desc:'珍品を供えて祀る。',effect:'吉兆の仕事がさらに実り(1.5倍→1.8倍)、珍品も出やすくなる。お守りも長くもつ。',open:()=>(S.day>=10&&RARES.some(g=>S.found[g]))||S.day>=30},
};
/* 肩書き: 名声と完成させた大事業の数で上がる。下がることはない */
const TITLES=[
  {name:'新参者',fame:0},
  {name:'村の一員',fame:10,perk:'声がかかりやすくなる'},
  {name:'顔役',fame:35,perk:'普請に人が集まりやすい。作り方を教えたときの礼が増える'},
  {name:'長老',fame:80,works:1,perk:'取引で相手が少し譲ってくれる'},
  {name:'村長',fame:150,works:3,perk:'普請に村じゅうが手を貸す'},
];
const EVENTS={
  drought:{name:'干ばつ',mod:{berries:.6,grain:.4},text:'干ばつが始まった。畑の育ちが遅れ、野の実りも細る。'},
  storm:{name:'嵐',mod:{fish:.3,salt:.3},text:'嵐が来た。川も浜も荒れて、漁も塩づくりも振るわない。'},
  harvest:{name:'実りの年',mod:{},field:1.5,text:'晴れと雨がほどよく続く。畑の実りが増えそうだ。'},
  catch:{name:'豊漁',mod:{fish:1.8},text:'魚の群れが押し寄せた。'},
};
const RARITY={1:'珍しい',2:'とても珍しい',3:'幻の',4:'伝説の'};
const RARES=['obsidian','fossil','amber','pearl','gold','jade','meteor'];
const RARE_DROP={stone:[['obsidian',.04],['fossil',.012],['gold',.005]],fish:[['pearl',.03,'shore']],wood:[['amber',.02]],berries:[['amber',.012]],
  clay:[['gold',.012],['fossil',.015]],ore:[['gold',.03],['meteor',.004]],salt:[['pearl',.012]],fiber:[],grain:[]};
const OMENS={berries:'森がざわめく。木の実日和',grain:'穂が重く垂れる。摘み取り日和',fish:'水面がきらめく。漁日和',wood:'風が乾いている。伐採日和',stone:'岩場で何かが光った。石拾い日和',
  clay:'雨上がりで土がやわらかい。粘土日和',fiber:'草がよく伸びた。草刈り日和',salt:'日差しが強い。塩づくり日和',ore:'山が低く鳴った。鉱石日和'};
const HAZ=[{t:'猪に突き飛ばされた。',d:16},{t:'崖で足を滑らせた。',d:12},{t:'道に迷い、夜通し歩き回った。',d:10},{t:'毒のある実に当たった。',d:14},{t:'蛇に噛まれた。',d:18}];
const NAMES=['タケ','ナギ','イサ','ミナ','コマ','ヒル','ソラ','ツユ','ハヤ','モモ','カイ','ユラ','セキ','ノギ','アオ','ヨシ','フキ','マツ','クレ','シノ','トモ','ヤチ','ウミ','ホタ','サワ','イネ'];

const r1=n=>Math.round(n*10)/10, r2=n=>Math.round(n*100)/100;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const q=(g,n)=>isTool(g)?String(Math.round(n)):(Math.round(n*10)/10).toFixed(1);
const gl=(g,sm)=>`<span class="gl ${sm?'sm ':''}c-${ITEMS[g].cat}" title="${ITEMS[g].name}">${ITEMS[g].ch}</span>`;
const costHtml=m=>Object.entries(m).map(([g,n])=>`${gl(g,1)}<span class="num">${q(g,n)}</span>`).join(' ');

let S=null, autoTimer=null, resetArmed=false;

/* ================= 世界 ================= */
function makePlot(region){
  const c=Array(24).fill(null);const f=REG[region].feature;
  if(f==='stream'){const x=1+Math.floor(Math.random()*4);for(let y=0;y<4;y++)c[y*6+x]='river'}
  if(f==='river'){const y=1+Math.floor(Math.random()*2);for(let x=0;x<6;x++)c[y*6+x]='river'}
  if(f==='shore'){for(let x=0;x<6;x++)c[18+x]='shore'}
  if(f==='brook'){const s=Math.random()<.5?0:4;c[s]='river';c[s+1]='river'}
  const bag=[];for(const[t,n]of Object.entries(REG[region].counts))for(let i=0;i<n;i++)bag.push(t);
  const b=shuffle(bag);let k=0;
  if(region==='river'){/* 川辺の粘土層は川沿いに寄せる */
    const idx=[...Array(24).keys()].filter(i=>!c[i]).map(i=>[i,nearWater(c,i)+Math.random()*.8]).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);
    const clays=b.filter(t=>t==='clay'),rest=b.filter(t=>t!=='clay');
    idx.forEach((i,n)=>{c[i]=n<clays.length?'clay':rest[n-clays.length]});
  }else for(let i=0;i<24;i++)if(!c[i])c[i]=b[k++];
  return c.map(t=>({t,f:null}));
}
function nearWater(c,i){return nb(i).some(j=>c[j]==='river')?1:0}
function nb(i){const x=i%6,y=Math.floor(i/6),o=[];if(x>0)o.push(i-1);if(x<5)o.push(i+1);if(y>0)o.push(i-6);if(y<3)o.push(i+6);return o}

function newAgent(region,isPlayer){
  const used=new Set(S.agents.map(a=>a.name));
  return {id:isPlayer?0:S.nextId++,name:isPlayer?'あなた':(NAMES.find(n=>!used.has(n))||'ナナシ'),region,isPlayer:!!isPlayer,
    health:100,labor:4,inv:{berries:6,grain:3,wood:3,stone:1,fiber:2,salt:1},durs:{},charm:0,known:[],plot:region?makePlot(region):null,
    thresh:.12+Math.random()*.28,want:{},born:S.day,...(isPlayer?{fame:0,title:0}:{})};
}
function freshWorld(){
  S={day:1,agents:[],prices:{},money:{},hist:[],log:[],flags:{},firstBy:{},event:null,offers:[],nextId:1,nextOffer:1,
     today:{trades:0,ind:{}},lastInd:{},lastTrades:0,omen:rnd(Object.keys(OMENS)),card:null,found:{},designs:{},works:{},ayumi:{},seen:{},stat:newStat(),
     ui:{tile:null,teach:null,msg:'',exp:null,hints:[],map:false,wb:{m:'stone',s:'point',h:'long',b:'fiber'}}};
  for(const g of ORDER){S.prices[g]=ITEMS[g].base;S.money[g]=.04}
  S.agents.push(newAgent(null,true));
  for(const r of['plain','plain','river','river','coast','coast','forest','forest'])S.agents.push(newAgent(r,false));
  logIt('何もない土地に、8人の人々が暮らしている。道具はまだなく、誰もが素手で木の実や草を集めている。','event');
  pushHist();
}
const player=()=>S.agents.find(a=>a.isPlayer);
const ais=()=>S.agents.filter(a=>!a.isPlayer);
const live=()=>S.agents.filter(a=>a.region);
function logIt(t,kind){S.log.unshift({d:S.day,t,kind});if(S.log.length>120)S.log.pop()}
function first(key,t,kind){if(!S.flags[key]){S.flags[key]=1;logIt(t,kind)}}

/* ================= 所持品・土地 ================= */
const cnt=(a,g)=>a.inv[g]||0;
function add(a,g,n,durs){if(isDesign(g)&&!a.known.includes(g))a.known.push(g);if(isTool(g)){n=Math.round(n);a.inv[g]=cnt(a,g)+n;a.durs[g]=(a.durs[g]||[]).concat(durs&&durs.length===n?durs:Array(n).fill(ITEMS[g].dur))}else a.inv[g]=r2(cnt(a,g)+n)}
function take(a,g,n){if(isTool(g)){n=Math.min(cnt(a,g),Math.round(n));a.inv[g]=cnt(a,g)-n;const ds=a.durs[g]||[];const out=ds.splice(Math.max(0,ds.length-n),n);if(!a.inv[g])delete a.durs[g];return out}
  a.inv[g]=Math.max(0,r2(cnt(a,g)-n));return null}
function useTool(a,t){if(!isTool(t)||cnt(a,t)<1)return;const ds=a.durs[t]||(a.durs[t]=[ITEMS[t].dur]);ds[0]--;
  if(ds[0]<=0){ds.shift();a.inv[t]=Math.max(0,cnt(a,t)-1);if(!a.inv[t])delete a.durs[t];
    if(a.isPlayer)logIt(`あなたの${ITEMS[t].name}が使い込まれて壊れた。`,'you')}}
const curDur=(a,t)=>(a.durs[t]&&a.durs[t][0])||ITEMS[t].dur;
const hasFac=(a,f)=>!!a.plot&&a.plot.some(p=>p.f&&p.f.type===f);
const facCount=(a,f)=>a.plot?a.plot.filter(p=>p.f&&p.f.type===f).length:0;
const freeTiles=(a,ts)=>a.plot?a.plot.filter(p=>!p.f&&ts.includes(p.t)).length:0;
const watered=(a,i)=>nb(i).some(j=>a.plot[j].t==='river'||(a.plot[j].f&&a.plot[j].f.type==='ditch'));
const kilnAdj=(a,t)=>a.plot.some((p,i)=>p.f&&p.f.type==='kiln'&&nb(i).some(j=>a.plot[j].t===t));
const knows=(a,rid)=>a.known.includes(rid)||(!!RID[rid]&&!!RID[rid].auto&&hasFac(a,'kiln'));
const foodTotal=a=>FOOD.reduce((s,g)=>s+cnt(a,g),0);
const evMod=g=>{if(!S.event)return 1;const m=EVENTS[S.event.type].mod[g]||1;return S.event.type==='drought'&&built('well')?1-(1-m)*.5:m};
const recipeFor=g=>RECIPES.find(r=>r.out===g);

/* ================= 道具の組み立て(先端+柄+結び) ================= */
const HEAD={
  wood:{name:'木',sharp:1,hard:1,heavy:1,dur:8,note:'軽く柔らかい。先を尖らせれば突ける'},
  stone:{name:'石',sharp:.5,hard:3,heavy:3,dur:12,note:'重く硬いが、鋭い刃は付かない'},
  blade:{name:'石刃',sharp:3,hard:2.5,heavy:1.5,dur:12,note:'打ち欠いた鋭い破片。切る・刺すに向く'},
  obsidian:{name:'黒曜石',sharp:5,hard:2,heavy:1.5,dur:7,note:'とびきり鋭いが、脆く欠けやすい'},
  copper:{name:'銅',sharp:3.5,hard:4,heavy:3,dur:30,note:'硬く粘り強い。長持ちする'},
  meteor:{name:'隕鉄',sharp:5,hard:6,heavy:5,dur:90,note:'空から落ちた鉄。何をさせても一級品'},
};
const SHAPES={
  point:{name:'尖らせる',ch:'突',does:'刺す: 漁・狩り'},
  edge:{name:'刃をつける',ch:'刃',does:'切る: 伐採・草刈り・収穫'},
  flat:{name:'平たくする',ch:'掘',does:'掘る: 粘土掘り・畑づくり'},
  blunt:{name:'塊のまま',ch:'槌',does:'叩く: 石割り・鉱石掘り・狩り'},
};
const HANDLES={none:{name:'柄なし',wood:0,note:'手で握る。力が乗らない'},short:{name:'短い柄',wood:1,note:'小回りが利き、細かい仕事に向く'},long:{name:'長い柄',wood:2,note:'てこで力が乗る。細かい仕事は苦手'}};
const BINDS={none:{name:'差し込むだけ',mat:{},f:.45,note:'先端がすぐ抜ける'},fiber:{name:'草で結ぶ',mat:{fiber:2},f:.85,note:'そこそこもつ'},rope:{name:'縄で縛る',mat:{rope:1},f:1.25,note:'しっかり固定され長持ち'}};
const BASE_NAME={point:{none:'尖頭器',short:'銛',long:'槍'},edge:{none:'握り刃',short:'鎌',long:'斧'},flat:{none:'へら',short:'掘り棒',long:'鍬'},blunt:{none:'叩き石',short:'槌',long:'つるはし'}};
const JOBL={fish:'漁',hunt:'狩り',wood:'伐採',fiber:'草刈り',reap:'収穫',clay:'粘土掘り',dig:'畑づくり',stone:'石割り',ore:'鉱石掘り'};
const ABSJOB={fish:1,hunt:1,dig:1};
const dkey=(s,m,h,b)=>`${s}.${m}.${h}.${h==='none'?'none':b}`;
function designCalc(key){
  const[s,m,h,b]=key.split('.');const M=HEAD[m];const L={none:0,short:1,long:2}[h];const jobs={};
  if(s==='point'){let v=.6+.3*M.sharp+.15*M.hard+[0,.2,.5][L];if(!L)v*=.75;jobs.fish=r2(v);jobs.hunt=r2(v)}
  if(s==='edge'){jobs.wood=r2(Math.max(1,1+.22*M.sharp+.18*M.heavy+[-.25,0,.35][L]));jobs.fiber=r2(Math.max(1,1+.2*M.sharp-.08*M.heavy+[0,.2,-.2][L]));jobs.reap=jobs.fiber}
  if(s==='flat'){jobs.clay=r2(Math.max(1,1+.15*M.hard+.1*M.heavy+[-.1,.2,.4][L]));jobs.dig=jobs.clay}
  if(s==='blunt'){const v=1+.12*M.hard+.15*M.heavy+[-.1,.15,.4][L];jobs.stone=r2(v);jobs.ore=r2(v*1.15);jobs.hunt=r2(v*.8)}
  const dur=Math.max(3,Math.round(M.dur*(L?BINDS[b].f:1)*(L===2?.9:1)*(m==='wood'&&s!=='flat'?.8:1)));
  const mat={[m]:1};if(L)mat.wood=(mat.wood||0)+HANDLES[h].wood;if(L)for(const[g,n]of Object.entries(BINDS[b].mat))mat[g]=(mat[g]||0)+n;
  const name=`${M.name}の${BASE_NAME[s][h]}${L&&b==='none'?'(差し込み)':L&&b==='fiber'?'(草結び)':''}`;
  return{name,ch:SHAPES[s].ch,cat:'tool',dur,jobs,mat,design:{s,m,h,b:L?b:'none'}};
}
function defineDesign(key){if(ITEMS[key])return;const d=designCalc(key);
  const mc=Object.entries(d.mat).reduce((x,[g,n])=>x+n*ITEMS[g].base,0);
  ITEMS[key]={...d,base:r2(Math.max(1.5,mc*1.4)),decay:0,port:.7};refreshKeys()}
function registerDesign(key,by){defineDesign(key);if(S.designs[key])return false;S.designs[key]={by,day:S.day};S.prices[key]=ITEMS[key].base;S.money[key]=0;return true}
function learnDesign(a,key,by){const nw=registerDesign(key,by||a.name);if(!a.known.includes(key))a.known.push(key);return nw}
const isDesign=g=>!!(ITEMS[g]&&ITEMS[g].design);
function bestPower(a,job,xj){let v=0,t=null;
  for(const g in a.inv){if(a.inv[g]<1)continue;const j=ITEMS[g]&&ITEMS[g].jobs;if(j&&j[job]>v){v=j[job];t=g}}
  if(xj&&xj[job]>v){v=xj[job];t=null}return{v,t}}
function designWhy(a,key){const d=ITEMS[key]||designCalc(key);
  const miss=Object.entries(d.mat).filter(([g,n])=>cnt(a,g)<n).map(([g,n])=>`${ITEMS[g].name}${q(g,n-cnt(a,g))}`);
  if(miss.length)return'足りない: '+miss.join('・');if(a.labor<1)return'労力が残っていない';return''}
function craftDesign(a,key){if(designWhy(a,key))return false;const nw=learnDesign(a,key);const d=ITEMS[key];
  for(const[g,n]of Object.entries(d.mat))take(a,g,n);
  let x=Math.random();if(a.charm>0)x=Math.max(x,Math.random());
  const Q=x<.1?[.6,'粗末な']:x<.75?[1,'']:x<.95?[1.5,'出来の良い']:[2.5,'名品の'];const dur=Math.max(2,Math.round(d.dur*Q[0]));
  add(a,key,1,[dur]);a.labor--;
  if(a.isPlayer){S.stat.craft++;if(Q[1]==='名品の')S.stat.master++}
  if(nw)logIt(`${a.isPlayer?'あなた':a.name}が「${d.name}」を考え出した。村で初めての形の道具だ。`,'tech');
  if(Q[1]==='名品の'&&!a.isPlayer)logIt(`${a.name}が名品の${d.name}を作り上げた。`,'tech');
  return{out:key,n:1,ql:Q[1],dur,first:nw}}
function giftDesign(P,by){let best=null,bv=0;
  for(const m of['stone','blade','obsidian','copper'])for(const sh of Object.keys(SHAPES))for(const h of['short','long']){
    const k=dkey(sh,m,h,'rope');if(P.known.includes(k))continue;const d=ITEMS[k]||designCalc(k);const v=toolUseJobs(P,d.jobs,d.dur)+Math.random();if(v>bv){bv=v;best=k}}
  if(best)learnDesign(P,best,by);return best}

/* ================= 仕事 ================= */
function gatherInfo(a,g,xj){
  const d=GATHER[g];const n=freeTiles(a,d.tiles);
  if(!n)return{y:0,why:`${d.tiles.map(t=>TER[t]).join('・')}がない`};
  const rich=d.ore?n*.5:Math.min(1.4,.4+.12*n);
  const bp=bestPower(a,g,xj);const mult=d.abs?bp.v:d.base*Math.max(1,bp.v),tool=bp.v>(d.abs?0:1)?bp.t:null;
  if(!mult)return{y:0,why:`${d.need}が要る`};
  return{y:r2(mult*rich*evMod(g)*(S.omen===g?omenMul():1)*(.5+a.health/200)),tool};
}
function luckRoll(a){const c=a.charm>0?2:1,r=Math.random();
  if(r<.05*c)return{m:3,tier:'jackpot'};if(r<.05*c+.17)return{m:1.5,tier:'good'};if(r<.05*c+.25)return{m:.4,tier:'bad'};return{m:.75+Math.random()*.4,tier:'norm'}}
function gainRare(a,g,quiet){add(a,g,1);
  if(a.isPlayer){const nw=!S.found[g];S.found[g]=(S.found[g]||0)+1;if(!quiet){logIt(`あなたは${RARITY[ITEMS[g].rare]}${ITEMS[g].name}を見つけた。`,'rare');toastRare(g,nw)}}
  else if(ITEMS[g].rare>=3)logIt(`${a.name}が${RARITY[ITEMS[g].rare]}${ITEMS[g].name}を見つけたという噂だ。`,'rare')}
function rollRare(a,g){for(const[it,p,tile]of RARE_DROP[g]||[]){if(tile&&!freeTiles(a,[tile]))continue;
  if(Math.random()<p*(S.omen===g?(built('shrine')?4:3):1)*(a.charm>0?2:1)){gainRare(a,it);return it}}return null}
function doGather(a,g){const i=gatherInfo(a,g);if(i.y<=0||a.labor<1)return false;
  const L=luckRoll(a),amt=r2(i.y*L.m);add(a,g,amt);if(i.tool)useTool(a,i.tool);a.labor--;
  const rare=rollRare(a,g);
  if(g==='fish')first('fish',`${a.isPlayer?'あなた':a.name}が初めて魚を獲った。`,'tech');return{g,amt,tier:L.tier,rare}}

function fieldInfo(a){
  let ripe=0,empty=0,yieldSum=0;const ev=S.event&&EVENTS[S.event.type].field||1;const sk=1+Math.max(0,bestPower(a,'reap').v-1)*.6;
  a.plot.forEach((p,i)=>{if(p.f&&p.f.type==='field'){if(p.f.planted&&p.f.grow>=5){ripe++;yieldSum+=5*(watered(a,i)?1.5:1)*ev*sk}else if(!p.f.planted)empty++}});
  return{ripe,empty,yieldSum:r1(yieldSum),seeds:Math.floor(cnt(a,'grain')+yieldSum),plantable:Math.min(empty+ripe,Math.floor(cnt(a,'grain')+yieldSum))};
}
function doField(a){
  const fi=fieldInfo(a);if((!fi.ripe&&!(fi.empty&&cnt(a,'grain')>=1))||a.labor<1)return false;
  const ev=S.event&&EVENTS[S.event.type].field||1,rp=bestPower(a,'reap'),sk=1+Math.max(0,rp.v-1)*.6;let got=0,bumper=0;
  a.plot.forEach((p,i)=>{if(!p.f||p.f.type!=='field'||!p.f.planted||p.f.grow<5)return;
    let y=5*(watered(a,i)?1.5:1)*ev*sk*(.7+Math.random()*.6);if(Math.random()<(a.charm>0?.12:.06)){y*=2;bumper++}
    got+=y;p.f.planted=false;p.f.grow=0});
  if(got){add(a,'grain',r2(got));if(rp.t)useTool(a,rp.t);if(a.isPlayer)S.stat.harvest++}
  for(const p of a.plot)if(p.f&&p.f.type==='field'&&!p.f.planted&&cnt(a,'grain')>=1){take(a,'grain',1);p.f.planted=true;p.f.grow=0}
  if(got)first('harvest',`${a.isPlayer?'あなた':a.name}の畑が初めて実った。蒔いた穀物が何倍にもなって返ってきた。`,'tech');
  a.labor--;return{g:'grain',amt:r2(got),tier:bumper?'jackpot':'norm',field:true};
}
function recipeIn(a,r){const m={...r.in};if(r.id==='charcoal'&&a.plot&&kilnAdj(a,'forest'))m.wood=2;return m}
const recipeOut=(a,r)=>r.id==='pot'&&a.plot&&kilnAdj(a,'clay')?2:1;
function craftWhy(a,r){
  if(r.needs&&!hasFac(a,r.needs))return'窯が要る';
  const miss=Object.entries(recipeIn(a,r)).filter(([g,n])=>cnt(a,g)<n).map(([g,n])=>`${ITEMS[g].name}${q(g,n-cnt(a,g))}`);
  if(miss.length)return'足りない: '+miss.join('・');
  if(a.labor<1)return'労力が残っていない';return'';
}
function doCraft(a,rid){const r=RID[rid];if(!knows(a,rid)||craftWhy(a,r))return false;
  for(const[g,n]of Object.entries(recipeIn(a,r)))take(a,g,n);const n=recipeOut(a,r);let ql='',dur=0;
  if(isTool(r.out)){let x=Math.random();if(a.charm>0)x=Math.max(x,Math.random());
    const Q=x<.1?[.6,'粗末な']:x<.75?[1,'']:x<.95?[1.5,'出来の良い']:[2.5,'名品の'];dur=Math.round(ITEMS[r.out].dur*Q[0]);ql=Q[1];add(a,r.out,n,Array(n).fill(dur))}
  else add(a,r.out,n);a.labor--;
  if(a.isPlayer){if(rid==='smelt')S.stat.smelt++;if(ql==='名品の')S.stat.master++}
  first('made_'+r.out,`${a.isPlayer?'あなた':a.name}が村で初めて${ITEMS[r.out].name}を作った。`,'tech');
  if(ql==='名品の'&&!a.isPlayer)logIt(`${a.name}が名品の${ITEMS[r.out].name}を作り上げた。`,'tech');
  return{out:r.out,n,ql,dur}}
function buildCost(a,f){return FAC[f].laborHoe&&bestPower(a,'dig').v>=2?FAC[f].laborHoe:FAC[f].labor}
function canPlace(a,f,i){const p=a.plot[i];return !p.f&&FAC[f].on.includes(p.t)&&(f!=='ditch'||watered(a,i))}
function buildWhy(a,f,i){
  const d=FAC[f];if(!canPlace(a,f,i))return f==='ditch'&&!a.plot[i].f&&a.plot[i].t==='soil'?'川か水路の隣でないと掘れない':`${d.on.map(t=>TER[t]).join('・')}にしか作れない`;
  if(d.needJob&&!bestPower(a,d.needJob).v)return'土を掘る道具(先端を平たくした物)が要る';
  const miss=Object.entries(d.mat).filter(([g,n])=>cnt(a,g)<n).map(([g,n])=>`${ITEMS[g].name}${q(g,n-cnt(a,g))}`);
  if(miss.length)return'足りない: '+miss.join('・');
  if(a.labor<buildCost(a,f))return`労力が${buildCost(a,f)}要る(残り${a.labor})`;return'';
}
function doBuild(a,f,i){if(buildWhy(a,f,i))return false;const d=FAC[f];
  for(const[g,n]of Object.entries(d.mat))take(a,g,n);a.labor-=buildCost(a,f);
  if(d.needJob)useTool(a,bestPower(a,d.needJob).t);
  a.plot[i].f={type:f,grow:0,planted:false};
  first('fac_'+f,`${a.isPlayer?'あなた':a.name}が村で初めて${d.name}を作った。`,'tech');return true}
function bestTile(a,f){
  let best=null,bs=-1;
  a.plot.forEach((p,i)=>{if(!canPlace(a,f,i))return;let s=Math.random()*.1;
    if(f==='field')s+=watered(a,i)?2:0;
    if(f==='kiln')s+=(nb(i).some(j=>a.plot[j].t==='clay')?1:0)+(nb(i).some(j=>a.plot[j].t==='forest')?.6:0);
    if(f==='granary'||f==='rack')s+=p.t==='rock'?.5:0;
    if(s>bs){bs=s;best=i}});
  return best;
}
function doRest(a){if(a.labor<1)return false;a.health=Math.min(100,a.health+6);a.labor--;return true}

/* ================= 村人の考え方 ================= */
function toolUseful(a,t){if(!a.plot)return false;const j=ITEMS[t].jobs||{};
  for(const job in j){if(bestPower(a,job).v>j[job]+1e-6)continue;
    if(GATHER[job]&&freeTiles(a,GATHER[job].tiles))return true;
    if(job==='dig'&&(freeTiles(a,['soil'])>0||facCount(a,'field')>0))return true;
    if(job==='reap'&&facCount(a,'field')>0)return true}
  return false}
function toolUseJobs(a,jobs,dur){
  if(!a.plot)return 0;let v=0;const dd=Math.min(dur,14);
  for(const g in GATHER)if(jobs[g]){const gain=gatherInfo(a,g,jobs).y-gatherInfo(a,g).y;if(gain>0)v=Math.max(v,gain*S.prices[g]*dd*.3)}
  if(jobs.dig){const cur=bestPower(a,'dig').v;if(!cur&&freeTiles(a,['soil'])>0&&facCount(a,'field')<4)v=Math.max(v,8);else if(jobs.dig>=2&&cur<2&&facCount(a,'field')<3&&freeTiles(a,['soil'])>2)v=Math.max(v,4)}
  if(jobs.reap&&facCount(a,'field')>0){const gain=jobs.reap-Math.max(1,bestPower(a,'reap').v);if(gain>0)v=Math.max(v,facCount(a,'field')*gain*4*S.prices.grain)}
  if(jobs.hunt){const gain=jobs.hunt-bestPower(a,'hunt').v;if(gain>0)v=Math.max(v,gain*1.5)}
  return v}
const toolUse=(a,t)=>toolUseJobs(a,ITEMS[t].jobs||{},ITEMS[t].dur||1);
function facValue(a,f){
  const p=S.prices,fc=facCount(a,f);
  switch(f){
    case'field':{if(fc>=4)return 0;const t=bestTile(a,'field');return(t!=null&&watered(a,t)?1.5:1)*p.grain*12*.6*(1-fc*.15)}
    case'weir':return fc>=2?0:2*p.fish*12*.5;
    case'saltpan':return fc>=2?0:.5*p.salt*12*.5;
    case'kiln':return fc?0:5+(freeTiles(a,['clay'])?3:0)+(freeTiles(a,['ore'])||knows(a,'smelt')?6:0);
    case'granary':return fc?0:(foodTotal(a)>10?8:0);
    case'rack':return fc?0:((bestPower(a,'fish').v>0||facCount(a,'weir'))?6:0);
  }return 0;
}
function addInputs(w,a,r,mult,depth){
  for(const[g,n]of Object.entries(recipeIn(a,r))){w[g]=(w[g]||0)+n*mult;
    const sub=recipeFor(g);if(depth<2&&sub&&cnt(a,g)<n&&knows(a,sub.id))addInputs(w,a,sub,n-cnt(a,g),depth+1)}
}
function computeWant(a){
  const w={berries:2,grain:2+facCount(a,'field'),fish:2,salt:1.2,wood:2,pot:1};
  let best=null,bv=3;for(const t of TOOLS){if(cnt(a,t)>0)continue;const v=toolUse(a,t);if(v>bv){bv=v;best=t}}
  a.goal=best;
  if(best){if(isDesign(best)&&a.known.includes(best)){for(const[g,n]of Object.entries(ITEMS[best].mat)){w[g]=(w[g]||0)+n;const sub=recipeFor(g);if(sub&&knows(a,sub.id)&&cnt(a,g)<n)addInputs(w,a,sub,n-cnt(a,g),1)}}
    else{const r=recipeFor(best);if(r&&knows(a,r.id))addInputs(w,a,r,1,0);else w[best]=1}}
  let bf=null,fv=4;for(const f of Object.keys(FAC)){if(f==='ditch'||bestTile(a,f)==null)continue;if(FAC[f].needJob&&!bestPower(a,FAC[f].needJob).v)continue;const v=facValue(a,f);if(v>fv){fv=v;bf=f}}
  if(bf)for(const[g,n]of Object.entries(FAC[bf].mat)){w[g]=(w[g]||0)+n;if(g==='rope'&&knows(a,'rope'))w.fiber=(w.fiber||0)+3*n}
  if(knows(a,'smelt')&&hasFac(a,'kiln')){w.ore=(w.ore||0)+2;w.charcoal=(w.charcoal||0)+2}
  /* お金として通用している物は、いざという時のために手元に置いておきたくなる */
  for(const g of GOODS)if(S.money[g]>.3)w[g]=(w[g]||0)+8*S.money[g]/S.prices[g];
  /* 暮らしに余裕のある者は飾りや貴石を欲しがる */
  if(foodTotal(a)>10&&a.health>80){w.necklace=(w.necklace||0)+1;w.gold=(w.gold||0)+.5;w.pearl=(w.pearl||0)+.3;w.jade=(w.jade||0)+.2}
  a.want=w;a.facGoal=bf;
}
function agentVal(a,g){
  const p=S.prices[g],have=cnt(a,g);
  if(isTool(g)){if(have<1)return Math.max(p*.4,toolUse(a,g));return p*.5*Math.pow(.45,have-1)}
  const w=a.want[g]||0;let m=have<w?1.6:(have>w*1.6+2?.65:1);
  if(ITEMS[g].cat==='food'&&foodTotal(a)<4)m*=2.2;
  return p*m;
}
function chooseAction(a){
  let best=null;const c=(v,act)=>{if(v>0&&(!best||v>best.v))best={v,...act}};
  for(const g of Object.keys(GATHER)){const i=gatherInfo(a,g);if(i.y>0)c(i.y*agentVal(a,g)*(.9+Math.random()*.2),{k:'gather',g})}
  const fi=fieldInfo(a);if(fi.ripe||(fi.empty&&cnt(a,'grain')>=1))c(fi.yieldSum*agentVal(a,'grain')+Math.min(fi.empty+fi.ripe,fi.seeds)*1.5*S.prices.grain,{k:'field'});
  for(const r of RECIPES){if(!knows(a,r.id)||craftWhy(a,r))continue;
    const v=recipeOut(a,r)*agentVal(a,r.out)-Object.entries(recipeIn(a,r)).reduce((s,[g,n])=>s+n*agentVal(a,g),0);c(v,{k:'craft',r:r.id})}
  for(const k of a.known){if(!isDesign(k)||designWhy(a,k))continue;
    const v=agentVal(a,k)-Object.entries(ITEMS[k].mat).reduce((s,[g,n])=>s+n*agentVal(a,g),0);c(v,{k:'design',key:k})}
  for(const f of Object.keys(FAC)){if(f==='ditch')continue;const i=bestTile(a,f);if(i==null||buildWhy(a,f,i))continue;
    const v=(facValue(a,f)-Object.entries(FAC[f].mat).reduce((s,[g,n])=>s+n*agentVal(a,g),0))/buildCost(a,f);c(v,{k:'build',f,i})}
  if(a.health<55)c((60-a.health)*.12,{k:'rest'});
  return best;
}
function perform(a,x){
  if(x.k==='gather')return doGather(a,x.g);if(x.k==='field')return doField(a);if(x.k==='craft')return doCraft(a,x.r);
  if(x.k==='design')return craftDesign(a,x.key);if(x.k==='build')return doBuild(a,x.f,x.i);if(x.k==='rest')return doRest(a);return false;
}
function runAgent(a){computeWant(a);let guard=10;while(a.labor>0&&guard--){const x=chooseAction(a);if(!x||!perform(a,x))break}}
function aiInvent(a){
  const heads=Object.keys(HEAD).filter(m=>m==='wood'||m==='stone'||cnt(a,m)>=1||(m==='blade'&&knows(a,'blade')));
  const binds=['none','fiber'].concat(knows(a,'rope')||cnt(a,'rope')>=1?['rope']:[]);
  let best=null,bv=2;
  for(const m of heads)for(const sh in SHAPES)for(const h in HANDLES)for(const b of(h==='none'?['none']:binds)){
    const k=dkey(sh,m,h,b);if(a.known.includes(k))continue;const d=ITEMS[k]||designCalc(k);
    const v=toolUseJobs(a,d.jobs,d.dur)-.5*Object.entries(d.mat).reduce((x,[g,n])=>x+n*S.prices[g],0);if(v>bv){bv=v;best=k}}
  if(best&&!a.isPlayer){const nw=learnDesign(a,best);if(nw)logIt(`${a.name}が「${ITEMS[best].name}」という道具を考え出した。`,'tech')}
  else if(best)learnDesign(a,best);
}
function aiLearn(){
  for(const a of ais()){
    if(Math.random()<.04)aiInvent(a);
    let bk=null,bv=1;for(const k in S.designs){if(a.known.includes(k))continue;const v=toolUse(a,k);if(v>bv){bv=v;bk=k}}
    if(bk){const kn=S.agents.filter(o=>o!==a&&o.known.includes(bk)).length;if(Math.random()<Math.min(.2,.02*kn)){a.known.push(bk);
      /* あなたが考え出した型が広まると、名声が上がる */
      if(S.designs[bk].by==='あなた')addFame(1)}}
  }
  for(const a of ais())for(const r of RECIPES){
    if(r.auto||a.known.includes(r.id))continue;if(r.needs&&!hasFac(a,r.needs))continue;
    const k=S.agents.filter(o=>o!==a&&o.known.includes(r.id)).length;
    let p=k?Math.min(.25,.015*k):0;
    if(Object.keys(r.in).every(g=>cnt(a,g)>0))p+=[0,.02,.008,.004][r.tier];
    if(Math.random()<p){a.known.push(r.id);
      if(!S.firstBy[r.id]){S.firstBy[r.id]=a.name;logIt(`${a.name}が${ITEMS[r.out].name}の作り方を考え出した。${r.short}`,'tech')}}
  }
}

/* ================= 交換 ================= */
function deficit(a,g){if(isTool(g))return a.want[g]&&cnt(a,g)<1?1:0;return Math.max(0,(a.want[g]||0)-cnt(a,g))}
function surplus(a,g){if(isTool(g))return Math.max(0,Math.floor(cnt(a,g))-(toolUseful(a,g)?1:0));
  return Math.max(0,cnt(a,g)-((a.want[g]||0)*1.2+(ITEMS[g].cat==='food'?1:0)))}
const spare=(a,m)=>Math.max(0,cnt(a,m)-(a.want[m]||0)*.6);
function exchange(payer,seller,payG,payAmt,goodG,goodAmt,medium){
  payAmt=isTool(payG)?1:r2(payAmt);goodAmt=isTool(goodG)?1:r2(goodAmt);
  const d1=take(payer,payG,payAmt);add(seller,payG,payAmt,d1);const d2=take(seller,goodG,goodAmt);add(payer,goodG,goodAmt,d2);
  S.today.trades++;
  if(medium){S.today.ind[medium]=(S.today.ind[medium]||0)+1;
    first('ind_'+medium,`${seller.isPlayer?'あなた':seller.name}は、自分では要らない${ITEMS[medium].name}を「あとで別の物と換えられる」と受け取った。${ITEMS[medium].name}が初めて交換の仲立ちになった。`,'money')}
  else if(!payer.isPlayer&&!seller.isPlayer)first('barter',`${payer.name}と${seller.name}が${ITEMS[payG].name}と${ITEMS[goodG].name}を交換した。村で初めての物々交換。`,'trade');
  if(isTool(goodG)&&!payer.isPlayer&&!seller.isPlayer)first('tooltrade',`${payer.name}が${seller.name}から${ITEMS[goodG].name}を手に入れた。作り方を知らなくても、道具は買える。`,'trade');
}
function tryTrade(a,b){
  const wants=ORDER.filter(g=>deficit(a,g)>.05).sort((x,y)=>agentVal(a,y)/S.prices[y]-agentVal(a,x)/S.prices[x]);
  for(const w of wants){
    const avail=surplus(b,w);if(avail<(isTool(w)?1:.1))continue;
    let qty=isTool(w)?1:Math.min(deficit(a,w)+.3,avail);
    for(const s of GOODS){if(s===w||surplus(a,s)<.1||deficit(b,s)<=0)continue;
      let pay=qty*S.prices[w]/S.prices[s];const cap=surplus(a,s);
      if(pay>cap){if(isTool(w))continue;qty=cap*S.prices[s]/S.prices[w];pay=cap}
      if(qty<.1)continue;exchange(a,b,s,pay,w,qty,null);return true}
    const meds=GOODS.filter(m=>m!==w&&S.money[m]>b.thresh&&spare(a,m)>.1).sort((x,y)=>S.money[y]-S.money[x]);
    if(meds.length){const m=meds[0];let pay=qty*S.prices[w]/S.prices[m];const cap=spare(a,m);
      if(pay>cap){if(isTool(w))continue;qty=cap*S.prices[m]/S.prices[w];pay=cap}
      if(qty<.1)continue;exchange(a,b,m,pay,w,qty,deficit(b,m)>0?null:m);return true}
  }
  return false;
}

/* ================= 1日の終わり ================= */
function canProduce(a,g){if(!a.plot)return false;if(GATHER[g]&&gatherInfo(a,g).y>0)return true;const r=recipeFor(g);return !!r&&knows(a,r.id)&&(!r.needs||hasFac(a,r.needs))}
function endDay(){
  const P=player();if(!P.region||P.health<=0)return;
  S.today={trades:0,ind:{}};S.ui.teach=null;
  if(S.ui.exp&&!S.ui.exp.done)finishExp(P,false);S.ui.exp=null;
  if(S.card){if(!S.card.result)logIt(`【${S.card.title}】何もしないまま一日が過ぎた。`,'you');S.card=null}
  if(autoTimer){if(Math.random()<.06)aiInvent(P);autoWorks(P);runAgent(P)}
  for(const a of shuffle(ais())){a.labor=4;runAgent(a)}
  aiLearn();
  const pop=ais();for(let i=0;i<pop.length*(built('square')?8:5);i++){const a=rnd(pop),b=rnd(pop);if(a!==b)tryTrade(a,b)}
  worksDay();
  for(const a of live()){
    a.plot.forEach(p=>{if(!p.f)return;
      if(p.f.type==='weir')add(a,'fish',2*evMod('fish'));
      if(p.f.type==='saltpan')add(a,'salt',.5*evMod('salt'));
      if(p.f.type==='field'&&p.f.planted&&p.f.grow<5)p.f.grow+=S.event&&S.event.type==='drought'?(built('well')?.8:.5):1});
    consume(a);decay(a);
  }
  updatePrices();updateMoney();people();
  {const m=moneyGood();if(m.v>.5){if(S.flags.leader&&S.flags.leader!==m.g)logIt(`${ITEMS[S.flags.leader].name}に代わって、${ITEMS[m.g].name}がお金の主役になった。`,'money');S.flags.leader=m.g}}
  S.lastInd={...S.today.ind};S.lastTrades=S.today.trades;
  S.day++;events();
  P.labor=4;if(P.charm>0)P.charm--;maybeCard();unlockHold(P);
  if(P.health<=0){logIt('あなたは飢えと寒さに倒れた。','you');stopAuto()}
  else if(P.health<40)first('weak'+Math.floor(S.day/10),'あなたの体が弱っている。食べ物・塩・木材が足りているか確かめよう。','you');
  genOffers();pushHist();save();render();
}
function consume(a){
  let eaten=0;const kinds=new Set();
  for(const g of FOOD){const t=Math.min(cnt(a,g),2-eaten);if(t>0){take(a,g,t);eaten+=t;if(t>=.5)kinds.add(g)}if(eaten>=2)break}
  let dh=eaten<1.95?-(2-eaten)*11:2;if(kinds.size>=2)dh+=2;if(cnt(a,'necklace')>=1)dh+=1;
  /* 塩と木材は手元にある分を使い、足りない分に応じて体力が減る */
  const salt=Math.min(cnt(a,'salt'),.2),wood=Math.min(cnt(a,'wood'),.3);
  take(a,'salt',salt);take(a,'wood',wood);dh-=4*(.2-salt)/.2+3*(.3-wood)/.3;
  a.health=Math.max(0,Math.min(100,a.health+dh));
}
function decay(a){
  const f=(cnt(a,'pot')>=1?.5:1)*(hasFac(a,'granary')?.35:1)*(built('storehouse')?.8:1);
  for(const g of FOOD){let r=ITEMS[g].decay*f;if(g==='fish'){if(hasFac(a,'rack'))r=Math.min(r,.03);if(cnt(a,'salt')>=.3)r*=.6}a.inv[g]=r2(cnt(a,g)*(1-r))}
  for(const g of['wood','fiber','rope'])a.inv[g]=r2(cnt(a,g)*(1-ITEMS[g].decay));
  for(let i=0;i<Math.floor(cnt(a,'pot'));i++)if(Math.random()<.01)take(a,'pot',1);
}
function updatePrices(){
  for(const a of ais())computeWant(a);
  for(const g of ORDER){if(g==='grain')continue;
    let D=0,Su=0;
    for(const a of ais()){if(isTool(g)){if(cnt(a,g)<1&&toolUse(a,g)>3)D++}else D+=deficit(a,g);Su+=surplus(a,g)}
    let p=S.prices[g]*(1+.1*Math.tanh((D-Su)/(D+Su+.5)));
    const r=recipeFor(g);if(r)p=Math.max(p,.7*Object.entries(r.in).reduce((s,[x,n])=>s+n*S.prices[x],0));
    if(isDesign(g)){const mc=Object.entries(ITEMS[g].mat).reduce((s,[x,n])=>s+n*S.prices[x],0);p=Math.min(Math.max(p,.7*mc),mc*2.2+1)}
    S.prices[g]=Math.min(ITEMS[g].base*8,Math.max(ITEMS[g].base*.15,p));
  }
}
function updateMoney(){
  const pop=live();const n=Math.max(1,pop.length);const tr=Math.max(3,S.today.trades);
  for(const g of GOODS){
    const breadth=pop.filter(a=>(a.want[g]||0)>0&&!canProduce(a,g)).length/n;
    const dur=Math.max(0,1-ITEMS[g].decay*5);
    const use=(S.today.ind[g]||0)/tr;
    S.money[g]=Math.min(1,S.money[g]*.92+.08*(.55*breadth*dur*ITEMS[g].port+.9*use));
    if(S.money[g]>.5)first('money_'+g,`${ITEMS[g].name}がこの村のお金として通用し始めた。人々は物の値打ちを${ITEMS[g].name}で数えるようになった。`,'money');
  }
}
function people(){
  for(const a of ais())if(a.health<=0){S.agents=S.agents.filter(x=>x!==a);logIt(`${a.name}(${REG[a.region].name})は暮らしが立たず、村を去った。`,'people')}
  const pop=ais();const avgH=pop.reduce((s,a)=>s+a.health,0)/Math.max(1,pop.length);
  if(pop.length<16&&(avgH>75||pop.length<5)&&Math.random()<.1){
    const r=rnd(Object.keys(REG));const na=newAgent(r,false);S.agents.push(na);
    logIt(`${na.name}が村の噂を聞いて${REG[r].name}に移り住んだ。`,'people');
  }
}
function events(){
  if(S.event){S.event.days--;if(S.event.days<=0){logIt(`${EVENTS[S.event.type].name}がおさまった。`,'event');S.event=null}}
  else if(S.day>5&&Math.random()<.06){const t=rnd(Object.keys(EVENTS));S.event={type:t,days:3+Math.floor(Math.random()*3)};logIt(EVENTS[t].text,'event')}
  else if(S.day>8&&Math.random()<.04)instantEvent(rnd(['plague','raid','meteor']));
  S.omen=rnd(Object.keys(OMENS));
}
function instantEvent(t){
  if(t==='plague'){const w=built('well');for(const a of live())a.health=Math.max(5,a.health-(w?6:12));logIt(w?'村に熱病がはやった。井戸のきれいな水のおかげで、軽く済んだ。':'村に熱病がはやった。誰もが体力を落としている。','event')}
  if(t==='raid'){const sh=built('storehouse');for(const a of live()){const loss=(hasFac(a,'granary')?.1:.3)*(sh?.5:1);for(const g of FOOD)a.inv[g]=r2(cnt(a,g)*(1-loss))}
    logIt(sh?'夜のうちに獣の群れが村を荒らした。共同の倉に蓄えを預けていたので、害は小さかった。':'夜のうちに獣の群れが村を荒らした。倉のない家は食べ物を3割失った。','event')}
  if(t==='meteor'){const a=Math.random()<.25&&player().region?player():rnd(ais());if(!a)return;
    logIt(`夜空を大きな流れ星が横切った。翌朝、${a.isPlayer?'あなた':a.name}の土地に黒い塊が落ちていた。`,'rare');gainRare(a,'meteor')}
}
/* 村人が「本当に困っている」理由。理由のある物を求めるときだけ、あなたを訪ねてくる */
function needWhy(a,w){
  if(ITEMS[w].cat==='food'&&foodTotal(a)<4)return'食べ物が尽きかけている';
  if(w==='salt'&&cnt(a,'salt')<.6)return'塩を切らしそうだ';
  if(w==='wood'&&cnt(a,'wood')<.9)return'薪にする木がない';
  if(a.goal===w)return`${ITEMS[w].name}が欲しい`;
  if(a.goal&&ITEMS[a.goal].mat&&ITEMS[a.goal].mat[w])return`${ITEMS[a.goal].name}を作りたい`;
  if(a.facGoal&&FAC[a.facGoal].mat[w])return`${FAC[a.facGoal].name}を建てたい`;
  return'';
}
const URGENT=['食べ物が尽きかけている','塩を切らしそうだ','薪にする木がない'];
function genOffers(){
  const P=player();S.offers=[];if(!P.region)return;
  const cap=built('square')?3:2,boost=(1+.25*titleLv())*(built('square')?1.3:1);
  for(const a of shuffle(ais())){
    if(S.offers.length>=cap)break;
    const wants=ORDER.filter(w=>deficit(a,w)>0&&cnt(P,w)>=(isTool(w)?1:.5)&&needWhy(a,w));if(!wants.length)continue;
    const w=rnd(wants),why=needWhy(a,w);
    if(Math.random()>(URGENT.includes(why)?.5:.05)*boost)continue;
    let give=isTool(w)?1:r1(Math.min(deficit(a,w)+.3,cnt(P,w)*.6));if(give<.2)continue;
    let pays=GOODS.filter(s=>s!==w&&surplus(a,s)>.2),medium=null,s;
    if(pays.length)s=rnd(pays);else{s=GOODS.filter(m=>m!==w&&spare(a,m)>.2).sort((x,y)=>S.money[y]-S.money[x])[0];if(!s)continue;medium=S.money[s]>.25?s:null}
    let get=give*S.prices[w]/S.prices[s]*(1.1+.05*Math.max(0,titleLv()-2));const lim=pays.includes(s)?surplus(a,s):spare(a,s);
    if(get>lim){if(isTool(w))continue;give=r1(give*lim/get);get=lim}
    get=r1(get);if(get<.1||give<.1)continue;
    S.offers.push({id:S.nextOffer++,aid:a.id,give:{g:w,amt:give},get:{g:s,amt:get},medium,why});
  }
}
function pushHist(){S.hist.push({d:S.day,p:{...S.prices}});if(S.hist.length>150)S.hist.shift()}
function moneyGood(){let g=null,v=0;for(const k of GOODS)if(S.money[k]>v){v=S.money[k];g=k}return{g,v}}

/* ================= プレイヤーの操作 ================= */
function unlockHold(P){if(!P.region)return;
  for(const r of RECIPES){if(r.auto||P.known.includes(r.id)||(r.needs&&!hasFac(P,r.needs)))continue;
    if(Object.keys(r.in).every(g=>cnt(P,g)>0)){P.known.push(r.id);
      if(!S.firstBy[r.id]){S.firstBy[r.id]='あなた';logIt(`あなたが${ITEMS[r.out].name}の作り方を思いついた。村で初めてだ。`,'tech')}
      toast(`<b>ひらめき!</b> ${Object.keys(r.in).map(g=>ITEMS[g].name).join('と')}から${ITEMS[r.out].name}が作れそうだ`,'good',3600)}}}
const nameOf=id=>isDesign(id)?ITEMS[id].name:ITEMS[RID[id].out].name;
function chooseRegion(r){const P=player();P.region=r;P.plot=makePlot(r);unlockHold(P);
  logIt(`あなたは${REG[r].name}に住みついた。手元にあるのは少しの木の実と穀物、木切れと石だけだ。`,'you');
  for(const a of ais())computeWant(a);genOffers();save();render()}
function acceptOffer(id){
  const o=S.offers.find(x=>x.id===id),P=player(),a=S.agents.find(x=>x.id===o?.aid);if(!o||!a)return;
  if(cnt(P,o.give.g)<o.give.amt){S.ui.msg=`${ITEMS[o.give.g].name}が足りない。`;return render()}
  if(cnt(a,o.get.g)<o.get.amt){S.ui.msg=`${a.name}の手元にもう${ITEMS[o.get.g].name}がない。`;S.offers=S.offers.filter(x=>x!==o);return render()}
  exchange(a,P,o.get.g,o.get.amt,o.give.g,o.give.amt,o.medium);
  S.stat.trade++;S.stat.offer++;addFame(URGENT.includes(o.why)?2:1);
  logIt(`あなたは${a.name}に${ITEMS[o.give.g].name}${q(o.give.g,o.give.amt)}を渡し、${ITEMS[o.get.g].name}${q(o.get.g,o.get.amt)}を受け取った。`,'you');
  S.offers=S.offers.filter(x=>x!==o);S.ui.msg='';save();render();
}
function propose(){
  const P=player();if(!P.region)return;
  const gG=$('pGive').value,wG=$('pWant').value;let amt=isTool(gG)?1:r1(parseFloat($('pAmt').value)||0);
  if(gG===wG){S.ui.msg='出すものと欲しいものが同じだ。';return render()}
  if(amt<=0||cnt(P,gG)<amt){S.ui.msg=`手元の${ITEMS[gG].name}は${q(gG,cnt(P,gG))}しかない。`;return render()}
  let best=null;const disc=.03*Math.max(0,titleLv()-2);/* 長老以上には相手が少し譲る */
  for(const a of ais()){
    const avail=surplus(a,wG);if(avail<(isTool(wG)?1:.1))continue;
    const needs=deficit(a,gG)>0;const asMoney=!needs&&!isTool(gG)&&S.money[gG]>a.thresh;if(!needs&&!asMoney)continue;
    const gv=needs?agentVal(a,gG):S.prices[gG];
    if(isTool(wG)){const req=r1(S.prices[wG]*(.95-disc)/gv+.05);if(amt>=req&&(!best||req<best.pay))best={a,get:1,pay:isTool(gG)?1:req,med:asMoney?gG:null}}
    else{const get=Math.min(avail,amt*gv/agentVal(a,wG)*(.95+disc));if(get>=.1&&(!best||get>best.get))best={a,get:r1(get),pay:amt,med:asMoney?gG:null}}
  }
  if(!best){S.ui.msg=`${ITEMS[wG].name}を${ITEMS[gG].name}と換えてくれる人はいなかった。相手が${ITEMS[gG].name}を必要としていないか、${ITEMS[wG].name}に余りがない。`;return render()}
  exchange(P,best.a,gG,best.pay,wG,best.get,best.med);S.stat.trade++;
  S.ui.msg=`${best.a.name}が応じた。${ITEMS[gG].name}${q(gG,best.pay)} → ${ITEMS[wG].name}${q(wG,best.get)}${best.med?`(${best.a.name}は${ITEMS[gG].name}を「お金」として受け取った)`:''}`;
  logIt(`あなたは${best.a.name}と取引し、${ITEMS[gG].name}${q(gG,best.pay)}で${ITEMS[wG].name}${q(wG,best.get)}を得た。`,'you');
  save();render();
}
function teachOffer(rid){
  const des=isDesign(rid),r=RID[rid];let best=null;
  for(const a of ais()){if(des?a.known.includes(rid):(knows(a,rid)||(r.needs&&!hasFac(a,r.needs))))continue;computeWant(a);
    let kv=des?toolUse(a,rid)*.6:Math.max(0,agentVal(a,r.out)-Object.entries(r.in).reduce((s,[g,n])=>s+n*S.prices[g],0))*3;
    const pv=kv*.5;if(pv<.5)continue;
    const g=GOODS.filter(g=>surplus(a,g)>.1).sort((x,y)=>S.money[y]-S.money[x]||S.prices[y]-S.prices[x])[0];if(!g)continue;
    const amt=r1(Math.min(surplus(a,g),pv/S.prices[g]*(1+.1*titleLv())));if(amt<.1)continue;
    if(!best||amt*S.prices[g]>best.amt*S.prices[best.g])best={aid:a.id,g,amt,rid};
  }
  S.ui.teach=best||{none:true,rid};render();
}
function doTeach(){const t=S.ui.teach,P=player(),a=S.agents.find(x=>x.id===t.aid);if(!a)return;
  take(a,t.g,t.amt);add(P,t.g,t.amt);a.known.push(t.rid);S.stat.teach++;addFame(3);
  logIt(`あなたは${a.name}に${nameOf(t.rid)}の作り方を教え、${ITEMS[t.g].name}${q(t.g,t.amt)}を受け取った。`,'you');
  S.ui.teach=null;save();render()}
function act(fn,expOk){const P=player();if(P.health<=0)return;if(!expOk&&S.ui.exp&&!S.ui.exp.done){toast('遠出の途中だ。先に引き返そう。','bad');return}fn(P);unlockHold(P);save();render()}

/* ================= 遠出(押すか、引くか) ================= */
const expRisk=d=>built('bridge')?Math.min(.5,.03+.055*d):Math.min(.6,.06+.07*d);
function startExp(P){if(P.labor<1||(S.ui.exp&&!S.ui.exp.done))return;S.ui.exp={depth:0,loot:{},notes:[],done:false};stepExp(P)}
function stepExp(P){const e=S.ui.exp;if(!e||e.done||P.labor<1)return;P.labor--;const risk=expRisk(e.depth);e.depth++;
  if(Math.random()<risk){const h=rnd(HAZ);P.health=Math.max(1,P.health-h.d);
    for(const g of Object.keys(e.loot)){if(ITEMS[g].rare){if(Math.random()<.5)delete e.loot[g]}else e.loot[g]=r1(e.loot[g]*.5)}
    e.notes.unshift({d:e.depth,t:`${h.t} 体力-${h.d}。慌てて逃げ帰り、荷の半分を落とした。`,cls:'bad'});
    toast(`<b>危ない!</b> ${h.t}`,'bad',3200);finishExp(P,true);return}
  S.stat.expMax=Math.max(S.stat.expMax,e.depth);
  const o=expOutcome(P,e.depth);e.notes.unshift({d:e.depth,t:o.t,cls:o.rare?'rare':''});
  for(const[g,n]of Object.entries(o.loot||{}))e.loot[g]=r2((e.loot[g]||0)+n);
  if(o.rare)toast(`<b>奥地で珍品!</b> ${gl(o.rare)} ${RARITY[ITEMS[o.rare].rare]}${ITEMS[o.rare].name}`,'rare',4000);
}
function finishExp(P,failed){const e=S.ui.exp;if(!e||e.done)return;e.done=true;e.failed=!!failed;const got=[];
  for(const[g,n]of Object.entries(e.loot)){if(n<=0)continue;if(ITEMS[g].rare){for(let i=0;i<n;i++)gainRare(P,g,true)}else add(P,g,n);got.push(`${ITEMS[g].name}${q(g,n)}`)}
  logIt(`あなたは${e.depth}歩奥まで遠出し、${failed?'危ない目に遭いながらも':'無事に'}${got.length?got.join('・')+'を持ち帰った':'手ぶらで帰ってきた'}。`,'you');
}
function expOutcome(P,d){
  if(S.ui.map&&d>=3){S.ui.map=false;const g=rnd(['jade','gold','meteor','pearl']);return{t:`地図の印の場所を掘ると、${ITEMS[g].name}が埋まっていた!`,loot:{[g]:1},rare:g}}
  const W=[['food',28],['mat',22],['salt',5],['ore',6],['rare1',10+2*d],['rare2',3+1.5*d],['meteor',.3+.5*d],['hint',5],['land',2.5],['none',12]];
  let r=Math.random()*W.reduce((s,x)=>s+x[1],0),k='none';for(const[x,w]of W){if((r-=w)<0){k=x;break}}
  const sc=(.8+Math.random()*.5)*(1+.35*(d-1));
  switch(k){
    case'food':{const g=Math.random()<.4?'meat':'berries',n=r1((g==='meat'?2:2.5)*sc);return{t:g==='meat'?`罠にかかった獣を見つけた。獣の肉${n}`:`木の実の群生地を見つけた。木の実${n}`,loot:{[g]:n}}}
    case'mat':{const g=rnd(['wood','stone','fiber','clay']),n=r1(2.5*sc);return{t:`よい${ITEMS[g].name}がまとまって手に入った。${ITEMS[g].name}${n}`,loot:{[g]:n}}}
    case'salt':{const n=r1(.8*sc);return{t:`塩の吹き出た岩を見つけた。塩${n}`,loot:{salt:n}}}
    case'ore':{const n=r1(1.2*sc);return{t:`崖の割れ目に緑の筋の入った石。銅鉱石${n}`,loot:{ore:n}}}
    case'rare1':case'rare2':{const g=rnd(k==='rare1'?['obsidian','fossil','amber']:['pearl','gold','jade']);return{t:`${RARITY[ITEMS[g].rare]}${ITEMS[g].name}を見つけた!`,loot:{[g]:1},rare:g}}
    case'meteor':return{t:'焼け焦げた窪みの底に、重く黒い塊。伝説の隕鉄だ!',loot:{meteor:1},rare:'meteor'};
    case'hint':{const k=giftDesign(P,'旅人');if(!k)return{t:'旅人と焚き火を囲んで話した。体が少し温まった。'};
      return{t:`旅人と出会い、「${ITEMS[k].name}」の組み方を教わった。型帳に書き留めた。`}}
    case'land':{const free=t=>P.plot.map((p,i)=>i).filter(i=>!P.plot[i].f&&P.plot[i].t===t);const rocks=free('rock'),soils=free('soil');
      if(rocks.length&&Math.random()<.5){P.plot[rnd(rocks)].t='ore';return{t:'帰り道、自分の土地の岩場に銅の鉱脈を見つけた!(岩場が鉱脈になった)'}}
      if(soils.length){P.plot[rnd(soils)].t='river';return{t:'自分の土地の草地から泉が湧き出しているのを見つけた!(川のマスになった)'}}
      return{t:'見晴らしのいい丘に出た。何もないが、気分がいい。'}}
  }
  return{t:'何も見つからなかった。'};
}

/* ================= 今日の出来事(選択つき) ================= */
function pickPay(P,value,ex){let best=null;
  for(const g of GOODS){if(g===ex||(ITEMS[g].rare&&g!=='gold'))continue;if(cnt(P,g)*S.prices[g]<value)continue;
    const sc=S.money[g]*10+S.prices[g];if(!best||sc>best.sc)best={g,sc}}
  return best?{g:best.g,amt:r1(value/S.prices[best.g]+.05)}:null}
function bestStake(P){return GOODS.filter(g=>cnt(P,g)>=2&&!ITEMS[g].rare).sort((x,y)=>cnt(P,y)*S.prices[y]-cnt(P,x)*S.prices[x])[0]}
function maybeCard(){const P=player();if(!P.region||P.health<=0||S.card||S.day<3||Math.random()>.22)return;
  const W=[['merchant',built('square')?5:3],['traveler',foodTotal(P)>=2?2:0],['beast',2],['drift',2],['diviner',cnt(P,'salt')>=1&&!(P.charm>0)?2:0],['festival',bestStake(P)?2:0],['map',S.ui.map?0:1]];
  let r=Math.random()*W.reduce((s,x)=>s+x[1],0);for(const[t,w]of W){if((r-=w)<0){S.card=makeCard(t);return}}}
function makeCard(type){const P=player();
  switch(type){
    case'merchant':{const offers=[];
      const sell1=(g,mk)=>{const p=pickPay(P,S.prices[g]*mk,g);offers.push({g,pay:p&&p.g,amt:p&&p.amt})};
      sell1(rnd(['obsidian','pearl','amber','fossil','gold','jade']),1.3);
      const ex=dkey(rnd(Object.keys(SHAPES)),rnd(['copper','obsidian']),rnd(['short','long']),'rope');registerDesign(ex,'遠い国の商人');if(cnt(P,ex)<1)sell1(ex,1.4);
      const opts=offers.map((x,i)=>({id:'buy'+i,label:x.pay?`${ITEMS[x.g].name}を買う(${ITEMS[x.pay].name}${q(x.pay,x.amt)})`:`${ITEMS[x.g].name}(払える品がない)`,dis:!x.pay}));
      const sg=GOODS.filter(g=>cnt(P,g)>=1&&!ITEMS[g].rare&&g!=='salt').sort((x,y)=>cnt(P,y)*S.prices[y]-cnt(P,x)*S.prices[x])[0];let sell=null;
      if(sg){const amt=r1(Math.max(1,cnt(P,sg)*.5)),val=amt*S.prices[sg]*2,pay=val>=S.prices.pearl*1.2?'pearl':'salt',pa=pay==='pearl'?Math.floor(val/S.prices.pearl):r1(val/S.prices.salt);
        sell={g:sg,amt,pay,pa};opts.push({id:'sell',label:`${ITEMS[sg].name}${q(sg,amt)}を売る(${ITEMS[pay].name}${q(pay,pa)}と交換)`})}
      opts.push({id:'no',label:'見送る',plain:1});
      return{type,title:'旅の商人',text:'遠い土地から商人がやって来た。見たことのない品を持ち、この村の品を相場の倍で買うという。商人は今日のうちに去る。',opts,data:{offers,sell}}}
    case'traveler':return{type,title:'倒れた旅人',text:'村はずれに旅人が倒れている。ひどく飢えているようだ。見知らぬ土地の話を知っているかもしれない。',opts:[{id:'share',label:'食べ物2を分ける'},{id:'no',label:'見なかったことにする',plain:1}]};
    case'beast':return{type,title:'大きな足跡',text:'見たこともない大きな獣の足跡が、土地のそばに続いている。仕留めれば当分食べ物に困らない。だが相手は手強い。',opts:[{id:'hunt',label:'狩りに出る(労力2・狩りの道具があると有利)',labor:2},{id:'hide',label:'家にこもってやり過ごす',plain:1}]};
    case'drift':return{type,title:'嵐のあとの浜',text:'嵐のあと、浜に何かがたくさん打ち上げられているという噂だ。',opts:[{id:'search',label:'浜を探しに行く(労力1)',labor:1},{id:'no',label:'行かない',plain:1}]};
    case'diviner':return{type,title:'占い師',text:'占い師が村を訪れた。「塩をひとつまみ供えれば、運を授けよう」',opts:[{id:'offer',label:'塩1を供える'},{id:'no',label:'断る',plain:1}]};
    case'festival':{const g=bestStake(P),c=cnt(P,g);const sm=r1(c/4),lg=r1(c/2);
      return{type,title:'祭りの賽',text:`村で祭りが開かれ、賽の目に品物を賭ける遊びが始まった。手元の${ITEMS[g].name}を賭けられる。勝てば倍、大勝ちなら4倍になる。`,
        opts:[{id:'small',label:`${ITEMS[g].name}${q(g,sm)}を賭ける`},{id:'large',label:`${ITEMS[g].name}${q(g,lg)}を賭ける`},{id:'no',label:'見ているだけにする',plain:1}],data:{g,sm,lg}}}
    case'map':return{type,title:'地図の切れ端',text:'古い木の皮に描かれた地図の切れ端を拾った。どこかの奥地に印が付いている。',opts:[{id:'ok',label:'大事にしまっておく'}]};
  }
}
function resolveCard(id){const c=S.card,P=player();if(!c||c.result)return;const o=c.opts.find(x=>x.id===id);if(!o||o.dis||(o.labor&&P.labor<o.labor))return;let res='',kind='';
  switch(c.type){
    case'merchant':{if(id.startsWith('buy')){const x=c.data.offers[+id.slice(3)];if(cnt(P,x.pay)<x.amt){res='払える品が足りなかった。';break}
        take(P,x.pay,x.amt);if(ITEMS[x.g].rare)gainRare(P,x.g,true);else add(P,x.g,1);res=`${ITEMS[x.pay].name}${q(x.pay,x.amt)}と引き換えに${ITEMS[x.g].name}を手に入れた。${isTool(x.g)?'作りをよく見たので、組み方も型帳に書き留めた。':''}`;kind='good'}
      else if(id==='sell'){const x=c.data.sell;if(cnt(P,x.g)<x.amt){res='品が足りなかった。';break}take(P,x.g,x.amt);
        if(x.pay==='pearl')for(let i=0;i<x.pa;i++)gainRare(P,'pearl',true);else add(P,'salt',x.pa);res=`${ITEMS[x.g].name}${q(x.g,x.amt)}を売り、${ITEMS[x.pay].name}${q(x.pay,x.pa)}を受け取った。`;kind='good'}
      else res='商人は肩をすくめ、次の村へ去っていった。';break}
    case'traveler':{if(id==='no'){res='見なかったことにした。';break}
      let need=2;for(const g of FOOD){const t=Math.min(cnt(P,g),need);take(P,g,t);need-=t;if(need<=0)break}addFame(3);
      const r=Math.random();const gk=r<.45?giftDesign(P,'旅人'):null;
      if(gk){res=`元気を取り戻した旅人は、お礼に「${ITEMS[gk].name}」の組み方を教えてくれた。`;kind='jackpot'}
      else if(r<.72){const g=rnd(['amber','pearl','jade']);gainRare(P,g,true);res=`旅人は懐から${RARITY[ITEMS[g].rare]}${ITEMS[g].name}を取り出し、お礼にとくれた。`;kind='rare'}
      else res='旅人は何度も礼を言って去っていった。いつか恩が返ってくるかもしれない。';break}
    case'beast':{if(id==='hide'){if(Math.random()<.3){const k=hasFac(P,'granary')?.85:.7;for(const g of FOOD)P.inv[g]=r2(cnt(P,g)*k);res=`夜のうちに獣が食べ物を荒らしていった。食べ物の${hasFac(P,'granary')?'1割半':'3割'}を失った。`;kind='bad'}else res='しばらくして、獣は山へ帰っていった。';break}
      P.labor-=2;const hp=bestPower(P,'hunt');const arm=Math.min(.3,Math.max(0,hp.v-1)*.12);if(hp.t)useTool(P,hp.t);const r=Math.random();
      if(r<.12+arm/2){add(P,'meat',12);res='大物を仕留めた! 獣の肉12。当分は食べ物に困らない。';kind='jackpot'}
      else if(r<.5+arm){const n=r1(4+Math.random()*3);add(P,'meat',n);res=`獣を仕留めた。獣の肉${n}。`;kind='good'}
      else if(r<.75){res='一日追いかけたが、逃げられた。';kind='bad'}
      else{P.health=Math.max(1,P.health-18);res='獣に反撃され、深手を負った。体力-18。';kind='bad'}break}
    case'drift':{if(id==='no'){res='行かなかった。';break}P.labor-=1;const r=Math.random();
      if(r<.4){const n=r1(4+Math.random()*3);add(P,'wood',n);res=`壊れた舟の板が流れ着いていた。木材${n}。`;kind='good'}
      else if(r<.6){add(P,'salt',2);res='潮だまりに塩の結晶ができていた。塩2。';kind='good'}
      else if(r<.82){gainRare(P,'pearl',true);res='大きな貝の中に、真珠が光っていた!';kind='rare'}
      else if(r<.92){add(P,'copper',1);res='古い舟の金具を見つけた。銅1!';kind='jackpot'}
      else{res='めぼしい物は何もなかった。';kind='bad'}break}
    case'diviner':{if(id==='no'){res='ご縁がなかった。';break}take(P,'salt',1);P.charm=charmDays();res=`お守りを授かった。${P.charm}日のあいだ、大当たり・珍品・名品・豊穣が出やすくなる。`;kind='jackpot';break}
    case'festival':{if(id==='no'){res='人々の歓声を聞きながら、見ているだけにした。';break}const g=c.data.g,st=id==='small'?c.data.sm:c.data.lg;if(cnt(P,g)<st){res='賭ける品が足りなかった。';break}
      const r=Math.random();if(r<.08){add(P,g,st*3);res=`大勝ち! ${ITEMS[g].name}${q(g,st*3)}を手にした。`;kind='jackpot'}
      else if(r<.46){add(P,g,st);res=`勝った! ${ITEMS[g].name}${q(g,st)}が増えた。`;kind='good'}
      else{take(P,g,st);res=`負けた。${ITEMS[g].name}${q(g,st)}を失った。`;kind='bad'}break}
    case'map':S.ui.map=true;res='次に遠出をして3歩目より奥まで進めば、印の場所にたどり着けそうだ。';kind='good';break;
  }
  c.result=res;logIt(`【${c.title}】${res}`,kind==='rare'?'rare':'you');if(kind)toast(res.length>36?res.slice(0,34)+'…':res,kind,kind==='jackpot'||kind==='rare'?4000:2800);save();render();
}

/* ================= 村の大事業・肩書き・あゆみ ================= */
const newStat=()=>({trade:0,offer:0,teach:0,craft:0,master:0,harvest:0,smelt:0,expMax:0,work:0});
const built=k=>!!(S.works&&S.works[k]&&S.works[k].done);
const omenMul=()=>built('shrine')?1.8:1.5;
const charmDays=()=>built('shrine')?6:4;
const worksDone=()=>Object.keys(WORKS).filter(built).length;
const activeWork=()=>Object.keys(WORKS).find(k=>S.works[k]&&!S.works[k].done);
const titleLv=()=>player().title||0;
function addFame(n){const P=player();P.fame=r1((P.fame||0)+n)}
const workLeft=(k,g)=>Math.max(0,r2(WORKS[k].need[g]-(S.works[k].got[g]||0)));
const workName=g=>g==='labor'?'人手':g==='rare'?'珍品':ITEMS[g].name;
const workGl=g=>g==='labor'?'<span class="gl c-tool" title="人手">人</span>':g==='rare'?'<span class="gl c-rare" title="珍品">珍</span>':gl(g);
const workQ=(g,n)=>g==='rare'?String(Math.round(n)):q(g==='labor'?'grain':g,n);
const LABOR_VAL=2;/* 人手1の値打ち(名声の計算と、人を雇うときの手間賃の目安) */
function startWork(k){if(activeWork()||built(k)||!WORKS[k].open())return;
  S.works[k]={got:{},by:{},start:S.day,done:0};
  logIt(`あなたは村の人々に${WORKS[k].name}づくりを呼びかけた。材料と人手がそろえば完成する。`,'you')}
/* 出した物は works[k].got に、誰がどれだけの値打ちを出したかは works[k].by に積む */
function giveWork(k,who,key,n,val){const w=S.works[k];if(!w||w.done)return;
  w.got[key]=r2((w.got[key]||0)+n);w.by[who]=r1((w.by[who]||0)+val);
  if(Object.keys(WORKS[k].need).every(g=>workLeft(k,g)<=0))finishWork(k)}
function finishWork(k){const w=S.works[k],W=WORKS[k];w.done=S.day;addFame(8);
  const who=Object.entries(w.by).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);
  logIt(`${W.name}が完成した! ${W.effect} 力を貸した人: ${who.slice(0,6).join('・')}${who.length>6?` ほか${who.length-6}人`:''}`,'work');
  toast(`<b>完成!</b> ${W.name}`,'jackpot',4200)}
const rareToGive=P=>RARES.filter(g=>cnt(P,g)>=1).sort((x,y)=>S.prices[x]-S.prices[y])[0];
/* 「出す」ボタンで出す量。木材は薪の分を1残す */
function giveAmt(P,k,g){const x=Math.min(workLeft(k,g),Math.max(0,cnt(P,g)-(g==='wood'?1:0)));return x>=workLeft(k,g)?workLeft(k,g):Math.floor(x*10)/10}
function playerGive(P,k,g,n){
  if(g==='rare'){const r=rareToGive(P);if(!r||workLeft(k,'rare')<1)return 0;take(P,r,1);const v=ITEMS[r].base;S.stat.work++;addFame(v);giveWork(k,'あなた','rare',1,v);
    logIt(`あなたは${WORKS[k].name}に${ITEMS[r].name}を供えた。`,'you');return v}
  if(g==='labor'){if(P.labor<1||workLeft(k,'labor')<=0)return 0;P.labor--;S.stat.work++;addFame(LABOR_VAL);giveWork(k,'あなた','labor',1,LABOR_VAL);return LABOR_VAL}
  if(n<=0||cnt(P,g)<n)return 0;take(P,g,n);const v=r1(n*ITEMS[g].base);S.stat.work++;addFame(v);giveWork(k,'あなた',g,n,v);return v}
function workGive(P,k,g){if(!k||activeWork()!==k)return;const n=g==='labor'||g==='rare'?1:giveAmt(P,k,g);const v=playerGive(P,k,g,n);
  if(v)toast(`${workGl(g)} ${workName(g)}${g==='labor'?'を出した':g==='rare'?'を供えた':q(g,n)+'を出した'}(名声+${r1(v)})`,'good')}
/* 財で賄う: 村人の余りを相場の3割増しで買い集める。人手は穀物2の値打ちで1日雇う。
 * 払いには珍品も使える(ためた財の使い道)。食べ物は使わず、塩と木材は1ずつ残す */
function hirePay(P,value,ex){
  /* 0.1刻みで払う。端数で払いすぎになる品(高い珍品で小さな買い物など)は後回し */
  const c=GOODS.filter(g=>g!==ex&&ITEMS[g].cat!=='food').map(g=>{const amt=Math.ceil(value/S.prices[g]*10-1e-9)/10;
    return{g,amt,over:amt*S.prices[g]/value,sc:S.money[g]*10+S.prices[g]}}).filter(x=>cnt(P,x.g)-(x.g==='salt'||x.g==='wood'?1:0)>=x.amt);
  const best=c.filter(x=>x.over<=1.5).sort((x,y)=>y.sc-x.sc)[0]||c.sort((x,y)=>x.over-y.over)[0];
  return best?{g:best.g,amt:best.amt}:null}
function hireQuote(P,k,g){const left=workLeft(k,g);if(left<=0||g==='rare')return null;
  if(g==='labor'){const hs=ais().filter(a=>a.health>50).length;const n=Math.min(left,4,hs);if(!n)return{n:0};return{n,pay:hirePay(P,n*S.prices.grain*LABOR_VAL*1.3)}}
  const avail=ais().reduce((s,a)=>s+surplus(a,g),0);const x=Math.min(left,avail),n=x>=left?left:Math.floor(x*10)/10;if(n<=0)return{n:0};
  return{n,pay:hirePay(P,n*S.prices[g]*1.3,g)}}
function workHire(P,k,g){if(!k||activeWork()!==k)return;const qt=hireQuote(P,k,g);if(!qt||!qt.n||!qt.pay||cnt(P,qt.pay.g)<qt.pay.amt)return;
  const{n,pay}=qt;take(P,pay.g,pay.amt);S.stat.work++;
  if(g==='labor'){const hs=shuffle(ais().filter(a=>a.health>50)).slice(0,Math.ceil(n));
    for(const a of hs){add(a,pay.g,r2(pay.amt/hs.length));giveWork(k,a.name,'labor',n/hs.length,n/hs.length*LABOR_VAL)}
    addFame(r1(n*LABOR_VAL*.5))}
  else{let rest=n;for(const a of ais().slice().sort((x,y)=>surplus(y,g)-surplus(x,g))){if(rest<=0)break;
      const t=Math.min(rest,surplus(a,g));if(t<=0)continue;take(a,g,t);add(a,pay.g,r2(pay.amt*t/n));rest=r2(rest-t);giveWork(k,a.name,g,t,t*ITEMS[g].base)}
    addFame(r1(n*ITEMS[g].base*.5))}
  logIt(`あなたは${ITEMS[pay.g].name}${q(pay.g,pay.amt)}を払い、村人に頼んで${workName(g)}${workQ(g,n)}を${WORKS[k].name}に回してもらった。`,'you');
  toast(`${workGl(g)} ${workName(g)}${workQ(g,n)}が集まった`,'good')}
/* 村人の手伝い。あなたの肩書きが上がるほど、手を貸す人が増える */
function worksDay(){const k=activeWork();if(!k)return;const need=WORKS[k].need,p=[.03,.06,.12,.18,.28][titleLv()];
  for(const a of shuffle(ais())){if(S.works[k].done)break;if(a.health<60||Math.random()>p)continue;
    const mats=Object.keys(need).filter(g=>g!=='labor'&&g!=='rare'&&workLeft(k,g)>0&&surplus(a,g)>.5);
    if(mats.length&&Math.random()<.7){const g=rnd(mats),n=r1(Math.min(surplus(a,g)*.4,2,workLeft(k,g)));if(n>0){take(a,g,n);giveWork(k,a.name,g,n,n*ITEMS[g].base)}}
    else if(workLeft(k,'labor')>0){const n=Math.min(.5,workLeft(k,'labor'));giveWork(k,a.name,'labor',n,n*LABOR_VAL)}}}
/* おまかせのとき: 呼びかけて、余った物と労力1を出す */
function autoWorks(P){
  if(!activeWork()){const k=Object.keys(WORKS).find(k=>!built(k)&&WORKS[k].open());if(k)startWork(k)}
  const k=activeWork();if(!k)return;computeWant(P);
  if(workLeft(k,'labor')>0&&P.health>70)playerGive(P,k,'labor');
  for(const g of Object.keys(WORKS[k].need)){if(!activeWork())return;if(g==='labor')continue;
    if(g==='rare'){if(RARES.reduce((s,r)=>s+cnt(P,r),0)>=2)playerGive(P,k,'rare');continue}
    const n=Math.floor(Math.min(workLeft(k,g),surplus(P,g)*.5)*10)/10;if(n>0)playerGive(P,k,g,n)}}

function checkTitle(quiet){const P=player();let lv=P.title||0;
  while(lv<TITLES.length-1){const t=TITLES[lv+1];if((P.fame||0)<t.fame||worksDone()<(t.works||0))break;lv++;
    if(!quiet){logIt(`村の人々はあなたを「${t.name}」と呼ぶようになった。${t.perk}。`,'work');toast(`<b>肩書き</b> ${t.name}になった`,'jackpot',4200)}}
  P.title=lv}
const wealth=a=>Object.keys(a.inv).reduce((s,g)=>s+cnt(a,g)*(S.prices[g]||0),0);
/* あゆみ帳: 並びはおおよその進み方の順。最初のまだの項目を「次の目標」として見せる */
const AYUMI=[
  {id:'tool1',name:'はじめての道具',desc:'道具を組み立てる',t:()=>S.stat.craft>=1},
  {id:'trade1',name:'はじめての取引',desc:'村人と物を換える',t:()=>S.stat.trade>=1},
  {id:'field1',name:'土を拓く',desc:'自分の畑を作る',t:P=>facCount(P,'field')>=1},
  {id:'harvest',name:'実り',desc:'畑で穀物を収穫する',t:()=>S.stat.harvest>=1},
  {id:'fac2',name:'暮らしの基盤',desc:'畑と水路のほかに、施設を2種類建てる',t:P=>new Set(P.plot.filter(p=>p.f&&!['field','ditch'].includes(p.f.type)).map(p=>p.f.type)).size>=2},
  {id:'work1',name:'普請に加わる',desc:'村の大事業に材料か人手を出す',t:()=>S.stat.work>=1},
  {id:'helper',name:'頼られる人',desc:'村人からの声かけに10回応じる',t:()=>S.stat.offer>=10},
  {id:'store',name:'十日の蓄え',desc:'食べ物を20以上たくわえる',t:P=>foodTotal(P)>=20},
  {id:'invent',name:'発明者',desc:'村で初めての形の道具を考え出す',t:()=>Object.values(S.designs).some(d=>d.by==='あなた')},
  {id:'teach',name:'師匠',desc:'作り方を教えて礼を受け取る',t:()=>S.stat.teach>=1},
  {id:'money',name:'お金の誕生',desc:'村で何かがお金として通用し始める',t:()=>Object.keys(S.flags).some(k=>k.startsWith('money_'))},
  {id:'workDone',name:'村の礎',desc:'大事業を1つ完成させる',t:()=>worksDone()>=1},
  {id:'kaoyaku',name:'顔役',desc:'肩書き「顔役」になる',t:P=>(P.title||0)>=2},
  {id:'spread',name:'広まる型',desc:'自分の考えた型を村人3人が使えるようになる',t:()=>Object.entries(S.designs).some(([k,d])=>d.by==='あなた'&&ais().filter(a=>a.known.includes(k)).length>=3)},
  {id:'master',name:'名品',desc:'名品の道具を作る',t:()=>S.stat.master>=1},
  {id:'deep',name:'奥地へ',desc:'遠出で5歩奥まで無事に進む',t:()=>S.stat.expMax>=5},
  {id:'rare3',name:'目利き',desc:'珍品を3種類見つける',t:()=>RARES.filter(g=>S.found[g]).length>=3},
  {id:'copper',name:'金属の時代',desc:'鉱石を溶かして銅を作る',t:()=>S.stat.smelt>=1},
  {id:'rich',name:'村一番の分限者',desc:'持ち物の値打ちの合計が村で一番になる',t:P=>S.day>=10&&ais().every(a=>wealth(a)<wealth(P))},
  {id:'pop',name:'にぎわう村',desc:'村の人口が15人を超える',t:()=>live().length>15},
  {id:'day100',name:'百日',desc:'100日を生き抜く',t:()=>S.day>100},
  {id:'rares',name:'珍品帳を埋める',desc:'7種類の珍品をすべて見つける',t:()=>RARES.every(g=>S.found[g])},
  {id:'allworks',name:'村を築いた人',desc:'大事業をすべて完成させる',t:()=>worksDone()>=Object.keys(WORKS).length},
  {id:'chief',name:'村長',desc:'村長に選ばれる',t:P=>(P.title||0)>=4},
];
function checkAyumi(quiet){const P=player();if(!P.region)return;
  for(const x of AYUMI){if(S.ayumi[x.id]||!x.t(P))continue;S.ayumi[x.id]=S.day;
    if(!quiet){logIt(`あゆみ帳「${x.name}」: ${x.desc}。`,'ayumi');toast(`<b>あゆみ</b> ${x.name}`,'good',3200)}}
  checkTitle(quiet);checkReveal(quiet)}
/* 情報の出し方: 序盤は暮らしの基本だけを見せ、条件を満たした欄から順に見せる。一度見せた欄は消さない(S.seen に日付を残す) */
const REVEALS=[
  {id:'villagers',name:'村人の一覧',t:()=>S.day>=4||S.stat.trade>=1},
  {id:'prices',name:'物価',t:()=>S.day>=6||S.stat.trade>=1},
  {id:'chart',t:()=>S.hist.length>=8},
  {id:'rares',name:'珍品帳',t:()=>RARES.some(g=>S.found[g])},
  {id:'ayumi',name:'あゆみ帳',t:()=>Object.keys(S.ayumi).length>=1},
  {id:'fame',name:'名声と肩書き',t:P=>(P.fame||0)>0},
  {id:'money',name:'お金の芽',t:()=>Object.keys(S.flags).some(k=>k.startsWith('ind_'))||S.day>=15},
];
const seen=k=>!!S.seen[k];
function checkReveal(quiet){const P=player();
  for(const x of REVEALS){if(seen(x.id)||!x.t(P))continue;S.seen[x.id]=S.day;if(!quiet&&x.name)toast(`<b>新しく見られる</b> ${x.name}`,'norm',3000)}
  for(const[k,W]of Object.entries(WORKS)){if(seen('work_'+k)||!W.open())continue;S.seen['work_'+k]=S.day;
    if(!quiet){logIt(`村で${W.name}を作ろうという話が出ている。${W.desc}「村の大事業」から呼びかけられる。`,'work');toast(`<b>村の話</b> ${W.name}を作ろう`,'good',3200)}}}
const nextGoal=()=>AYUMI.find(x=>!S.ayumi[x.id]);

/* ================= 演出 ================= */
let toasts=[];
function toast(html,kind,ms){const id=Math.random();toasts.push({id,html,kind});renderToasts();setTimeout(()=>{toasts=toasts.filter(t=>t.id!==id);renderToasts()},ms||2400)}
function renderToasts(){const el=$('toasts');if(el)el.innerHTML=toasts.slice(-4).map(t=>`<div class="toast ${t.kind}">${t.html}</div>`).join('')}
function toastGather(r){if(!r||typeof r!=='object')return;
  if(r.field&&!r.amt)return toast('種を蒔いた','norm');
  const lab={jackpot:r.field?'豊穣!':'大当たり!',good:'上々',bad:'外れ…',norm:''}[r.tier];
  toast(`${lab?`<b>${lab}</b> `:''}${gl(r.g,1)} ${ITEMS[r.g].name} <span class="num">+${q(r.g,r.amt)}</span>`,r.tier,r.tier==='jackpot'?3600:2200)}
function toastRare(g,nw){toast(`<b>${nw?'新しい珍品!':'珍品発見!'}</b> ${gl(g)} ${RARITY[ITEMS[g].rare]}${ITEMS[g].name}`,'rare',4200)}
function toastCraft(r){if(!r||typeof r!=='object')return;
  if(r.first)toast(`<b>新しい型!</b> ${gl(r.out,1)} 「${ITEMS[r.out].name}」を考え出した`,'rare',3800);
  if(r.ql)toast(`<b>${r.ql}</b>${ITEMS[r.out].name}ができた(${r.dur}回もつ)`,r.ql==='名品の'?'jackpot':r.ql==='粗末な'?'bad':'good',r.ql==='名品の'?3800:2400);
  else toast(`${gl(r.out,1)} ${ITEMS[r.out].name}${r.n>1?'×'+r.n:''}ができた`+(isTool(r.out)?`(${r.dur}回もつ)`:''),'norm')}

/* ================= 描画 ================= */
const $=id=>document.getElementById(id);
const hbar=h=>`<span class="bar ${h<35?'bad':h<65?'warn':''}"><i style="width:${Math.round(h)}%"></i></span>`;
const laborDots=n=>`<span class="labor" aria-label="残り労力${n}">労力 ${[0,1,2,3].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
const TCOL={soil:'t-soil',forest:'t-forest',rock:'t-rock',ore:'t-ore',clay:'t-clay',river:'t-river',shore:'t-shore'};

function render(){
  const P=player();const pop=live().length;const playing=!!P.region&&P.health>0;
  $('status').innerHTML=`<span class="day">第<b class="num">${S.day}</b>日</span>${P.region?laborDots(P.labor):''}
    <span class="chip">人口 <span class="num">${pop}</span></span>${seen('money')?`<span class="chip">昨日の取引 <span class="num">${S.lastTrades||0}</span>件</span>`:''}
    ${S.event?`<span class="chip ev">${EVENTS[S.event.type].name}・あと${S.event.days}日</span>`:''}
    <span class="chip ev" title="この日はこの仕事が${omenMul()}倍、珍品も出やすい">吉兆: ${OMENS[S.omen]}</span>${P.charm>0?`<span class="chip ev">お守り・あと${P.charm}日</span>`:''}
    ${playing&&S.offers.length?`<span class="chip call">声かけ <span class="num">${S.offers.length}</span>件</span>`:''}`;
  $('barinfo').innerHTML=`<span class="day">第<b class="num">${S.day}</b>日</span>${P.region?laborDots(P.labor):''}`;
  $('end').disabled=!playing;$('auto').disabled=!playing;
  $('land').hidden=$('work').hidden=$('bench').hidden=!P.region;
  $('rares').hidden=!P.region||!seen('rares');$('ayumi').hidden=!P.region||!seen('ayumi');
  $('works').hidden=!P.region||!Object.keys(WORKS).some(k=>seen('work_'+k));
  $('moneyP').hidden=!seen('money');$('pricesP').hidden=!seen('prices');$('villP').hidden=!seen('villagers');
  $('chart').parentElement.hidden=$('legend').hidden=!seen('chart');
  renderCard(P);renderCalls(P);renderYou(P);if(P.region){renderLand(P);renderWork(P);renderWorks(P);renderBench(P);renderRares();renderAyumi()}
  renderMarket(P);renderMoney();renderPrices();renderLog();renderVillagers(P);
  if(P.region&&P.health<=0){$('over').hidden=false;$('over').innerHTML=`<div class="panel"><h2>あなたは倒れた</h2><p class="lead">${S.day}日を生きた。一人で全部をまかなうのは難しい。何を作り、何を換えるかが生死を分ける。</p><button class="btn primary" id="again">新しい村で始める</button></div>`}
  else $('over').hidden=true;
}
function renderYou(P){
  if(!P.region){
    $('you').innerHTML=`<h2>どこに住む？</h2><p class="lead">土地ごとに地形が違い、とれる物も作れる施設も変わる。一人では暮らしに要る物がそろわない。</p>
    <div class="regions">${Object.entries(REG).map(([k,r])=>{const c={...r.counts};const tot=24;
      const feat={stream:{river:4},river:{river:6},shore:{shore:6},brook:{river:2}}[r.feature];for(const[t,n]of Object.entries(feat))c[t]=(c[t]||0)+n;
      return `<button data-region="${k}"><strong>${r.name}</strong><span class="comp">${Object.entries(c).map(([t,n])=>`<i class="${TCOL[t]}" style="width:${n/tot*100}%" title="${TER[t]}${n}"></i>`).join('')}</span><span>${r.desc}</span><span>${Object.entries(c).map(([t,n])=>`${TER[t]}${n}`).join('・')}</span></button>`}).join('')}</div>
    <p class="note">毎日、食べ物2(魚・木の実・穀物)と塩0.2、薪に木材0.3を使う。足りないと体が弱る。1日に使える労力は4。</p>`;return;
  }
  const grp=(title,list)=>list.length?`<h3>${title}</h3><div class="invgrp">${list.join('')}</div>`:'';
  const need={berries:0,grain:0,fish:0,salt:.6,wood:.9};
  const shown=GOODS.filter(g=>cnt(P,g)>.04||['salt','wood'].includes(g));
  const chip=g=>`<span class="it ${need[g]&&cnt(P,g)<need[g]?'low':''}">${gl(g)}${ITEMS[g].name}<b>${q(g,cnt(P,g))}</b></span>`;
  const food=shown.filter(g=>ITEMS[g].cat==='food').map(chip), rest=shown.filter(g=>ITEMS[g].cat!=='food'&&ITEMS[g].cat!=='rare').map(chip), rares=shown.filter(g=>ITEMS[g].cat==='rare').map(chip);
  const tools=TOOLS.filter(t=>cnt(P,t)>=1).map(t=>`<span class="it">${gl(t)}${ITEMS[t].name}<b>${q(t,cnt(P,t))}</b><small>残り${curDur(P,t)}回${curDur(P,t)>ITEMS[t].dur?' ★':''}</small></span>`);
  const ft=foodTotal(P),lv=P.title||0,T=TITLES[lv],N=TITLES[lv+1],goal=nextGoal();
  const rank=`<div class="rank"><span class="tn">${T.name}</span><span class="num">名声 ${r1(P.fame||0)}</span>${N?`<span class="sb"><i style="width:${Math.min(100,(P.fame||0)/N.fame*100)}%"></i></span>
    <small>次は「${N.name}」: 名声${N.fame}${N.works?`・大事業を${N.works}つ完成(いま${worksDone()})`:''}。${N.perk}</small>`:'<span></span><small>村でいちばん頼られる人になった。</small>'}</div>`;
  $('you').innerHTML=`<h2>あなたの暮らし <small>${REG[P.region].name}・食べ物は約${Math.floor(ft/2)}日分</small></h2>
    ${seen('fame')?rank:''}${goal?`<p class="goal">次の目標 <b>${goal.name}</b> ${goal.desc}</p>`:''}
    <div class="health"><span>体力</span>${hbar(P.health)}<span class="num">${Math.round(P.health)}</span></div>
    ${grp('食べ物',food.length?food:['<span class="it low">なし</span>'])}${grp('素材・品物',rest)}${grp('珍品',rares)}${grp('道具',tools.length?tools:['<span class="note">まだ道具はない。下の「道具づくり」で組み立てよう。</span>'])}
    ${S.day<=7?'<p class="note">毎日 食べ物2・塩0.2・木材0.3 を使う。2種類以上食べると体力が少し戻る。</p>':''}`;
}
function renderLand(P){
  const sel=S.ui.tile;
  const tiles=P.plot.map((p,i)=>{let inner=`<span class="tn">${TER[p.t]}</span>`;
    if(p.f){inner=`<span class="fac"><span>${FAC[p.f.type].ch}</span></span>`;
      if(p.f.type==='field'){inner+=`<span class="grow ${p.f.planted&&p.f.grow>=5?'ripe':''}"><i style="width:${p.f.planted?Math.min(100,p.f.grow/5*100):0}%"></i></span>`;if(watered(P,i))inner+='<span class="wet" title="水が届いている"></span>'}}
    return `<button class="tile ${TCOL[p.t]} ${sel===i?'sel':''}" data-tile="${i}" aria-label="${TER[p.t]}${p.f?'・'+FAC[p.f.type].name:''}">${inner}</button>`}).join('');
  let det='<p class="note">マスを選ぶと、そこに作れる施設が出る。施設を建てたマスは採集に使えなくなる。</p>';
  if(sel!=null){const p=P.plot[sel];
    if(p.f){const f=FAC[p.f.type];let st=f.desc;
      if(p.f.type==='field')st=p.f.planted?(p.f.grow>=5?'実っている。「畑仕事」で収穫できる。':`育っている(${Math.floor(p.f.grow)}/5日)。`):'何も植わっていない。「畑仕事」で種を蒔く(穀物1)。';
      if(p.f.type==='field')st+=watered(P,sel)?' 水が届いているので収穫1.5倍。':' 水が届いていない。隣に水路を掘れば1.5倍になる。';
      det=`<div class="tiledet"><h4>${TER[p.t]}の${f.name}</h4><p class="note">${st}</p></div>`;}
    else{const opts=Object.keys(FAC).filter(f=>FAC[f].on.includes(p.t));
      det=`<div class="tiledet"><h4>${TER[p.t]}</h4>${opts.length?`<div class="blist">${opts.map(f=>{const d=FAC[f],why=buildWhy(P,f,sel);
        const cost=[...Object.keys(d.mat).length?[costHtml(d.mat)]:[],`労力${buildCost(P,f)}`,...(d.needJob?['土を掘る道具が必要']:[])].join(' ・ ');
        return `<div class="brow"><div><div class="bn">${d.name}</div><div class="bd">${d.desc}</div><div class="bc">${cost}</div>${d.tip?`<div class="tip">配置のコツ: ${d.tip}</div>`:''}${why?`<div class="why">${why}</div>`:''}</div><button class="btn small" data-build="${f}" ${why?'disabled':''}>作る</button></div>`}).join('')}</div>`:'<p class="note">ここに作れる施設はない。</p>'}</div>`}}
  $('land').innerHTML=`<h2>あなたの土地 <small>6×4マス</small></h2><div class="map">${tiles}</div>${det}`;
}
function renderWork(P){
  if(S.ui.exp){const e=S.ui.exp;
    const loot=Object.entries(e.loot).filter(([g,n])=>n>0).map(([g,n])=>`<span class="it">${gl(g)}${ITEMS[g].name}<b>${q(g,n)}</b></span>`).join('');
    const risk=Math.round(expRisk(e.depth)*100);
    $('work').innerHTML=`<h2>遠出 <small>${e.done?(e.failed?'命からがら帰ってきた':'無事に帰ってきた'):`${e.depth}歩目・残り労力${P.labor}`}</small></h2>
      <div class="steps">${Array.from({length:Math.max(6,e.depth+1)},(_,i)=>`<i class="${i<e.depth?(e.failed&&i===e.depth-1?'x':'on'):''}"></i>`).join('')}</div>
      <h3>${e.done?'持ち帰った物':'背負っている荷'}</h3><div class="invgrp">${loot||'<span class="note">まだ何もない</span>'}</div>
      <ul class="enotes">${e.notes.slice(0,5).map(n=>`<li class="${n.cls||''}"><b>${n.d}歩目</b><span>${n.t}</span></li>`).join('')}</ul>
      ${e.done?`<div class="controls"><button class="btn" id="expClose">仕事に戻る</button></div>`:`
      <div class="risk">次の一歩で危険に遭う確率<span class="riskbar"><i style="width:${risk/.6}%"></i></span><b class="num">${risk}%</b></div>
      <p class="note">奥へ進むほど珍品が出やすく、量も増える。危険に遭うと荷の半分を落とし、体力も削られる。${S.ui.map?' 地図の印は3歩目より奥にある。':''}</p>
      <div class="controls"><button class="btn primary" id="expGo" ${P.labor<1?'disabled':''}>奥へ進む(労力1)</button><button class="btn" id="expBack">引き返す</button></div>
      ${P.labor<1?'<p class="note">労力が尽きた。今日はここで引き返すしかない。</p>':''}`}`;
    return;
  }
  const rows=Object.entries(GATHER).filter(([g,d])=>freeTiles(P,d.tiles)||P.plot.some(p=>d.tiles.includes(p.t))).map(([g,d])=>{const i=gatherInfo(P,g);
    let sub=i.y>0?(i.tool&&isTool(i.tool)?`${ITEMS[i.tool].name}を使う・残り${curDur(P,i.tool)}回`:i.tool?`${ITEMS[i.tool].name}で煮詰める`:'素手'):i.why;
    if(S.omen===g&&i.y>0)sub='吉兆・'+sub;
    return `<button class="act ${S.omen===g?'omen':''}" data-gather="${g}" ${i.y<=0||P.labor<1?'disabled':''}>${gl(g)}<span class="an">${d.name}<span class="as">${sub}</span></span><span class="ay">${i.y>0?'約'+q(g,i.y):''}</span></button>`});
  const fi=fieldInfo(P);const fc=facCount(P,'field');
  if(fc)rows.push(`<button class="act" data-field="1" ${(!fi.ripe&&!(fi.empty&&cnt(P,'grain')>=1))||P.labor<1?'disabled':''}>${gl('grain')}<span class="an">畑仕事<span class="as">実った畑${fi.ripe}・空いた畑${fi.empty}${fi.empty&&cnt(P,'grain')<1&&!fi.ripe?'・種の穀物がない':''}</span></span><span class="ay">${fi.ripe?'+'+q('grain',fi.yieldSum):''}</span></button>`);
  rows.push(`<button class="act" data-exp="1" ${P.labor<1?'disabled':''}><span class="gl c-rare">遠</span><span class="an">遠出する<span class="as">1歩ごとに労力1。奥ほど実入りも危険も大きい${S.ui.map?'・地図あり':''}</span></span><span class="ay">?</span></button>`);
  rows.push(`<button class="act" data-rest="1" ${P.labor<1?'disabled':''}><span class="gl c-tool">休</span><span class="an">休む<span class="as">体力を少し取り戻す</span></span><span class="ay">+6</span></button>`);
  $('work').innerHTML=`<h2>仕事 <small>1回に労力1を使う・数字はとれる量の目安。運しだいで外れも大当たりもある</small></h2><div class="acts">${rows.join('')}</div>`;
}
function powTxt(j,v){return ABSJOB[j]?v.toFixed(1):'×'+v.toFixed(1)}
function renderBench(P){
  const wb=S.ui.wb;if(wb.h==='none')wb.b='none';else if(wb.b==='none'&&wb.lastB)wb.b=wb.lastB;
  const key=dkey(wb.s,wb.m,wb.h,wb.b),d=ITEMS[key]||designCalc(key),why=designWhy(P,key),known=P.known.includes(key);
  const dots=(v,mx)=>'●'.repeat(Math.round(v))+'○'.repeat(Math.max(0,mx-Math.round(v)));const M=HEAD[wb.m];
  /* 先端の素材は、手にしたことのある物だけ並べる(木と石は最初から) */
  const met=m=>m==='wood'||m==='stone'||m===wb.m||cnt(P,m)>0||!!S.found[m]||(m==='blade'&&knows(P,'blade'))||(m==='copper'&&knows(P,'smelt'))||P.known.some(k=>isDesign(k)&&ITEMS[k].design.m===m);
  const heads=Object.entries(HEAD).filter(([m])=>met(m)).map(([m,h])=>`<button data-wbm="${m}" aria-pressed="${wb.m===m}" class="${cnt(P,m)<1?'lack':''}">${gl(m)}<span>${h.name}<small>手元 ${q(m,cnt(P,m))}</small></span></button>`).join('');
  const shapes=Object.entries(SHAPES).map(([k,x])=>`<button data-wbs="${k}" aria-pressed="${wb.s===k}"><span class="gl c-tool">${x.ch}</span><span>${x.name}<small>${x.does}</small></span></button>`).join('');
  const hands=Object.entries(HANDLES).map(([k,x])=>`<button data-wbh="${k}" aria-pressed="${wb.h===k}"><span>${x.name}${x.wood?`(木${x.wood})`:''}<small>${x.note}</small></span></button>`).join('');
  const binds=Object.entries(BINDS).map(([k,x])=>`<button data-wbb="${k}" aria-pressed="${wb.b===k}" ${wb.h==='none'?'disabled':''}><span>${x.name}${Object.keys(x.mat).length?`(${Object.entries(x.mat).map(([g,n])=>ITEMS[g].name+n).join('')})`:''}<small>${x.note}</small></span></button>`).join('');
  const stats=Object.entries(d.jobs).map(([j,v])=>{const cur=bestPower(P,j).v,base=ABSJOB[j]?0:1,now=Math.max(base,cur),diff=r2(v-now);
    const cmp=!cur&&ABSJOB[j]?'<small class="up">新しくできる</small>':diff>0?`<small class="up">今より+${diff.toFixed(1)}</small>`:diff<0?'<small>今の道具が上</small>':'<small>今と同じ</small>';
    return `<div class="st"><span>${JOBL[j]}</span><span class="sb"><i style="width:${Math.min(100,v/4*100)}%"></i></span><b class="num">${powTxt(j,v)}</b>${cmp}</div>`}).join('');
  const notes=[];if(d.jobs.dig)notes.push(d.jobs.dig>=2?'畑と水路が労力1で作れる':'畑と水路が作れる');if(d.jobs.hunt)notes.push('獣狩りで有利');
  const book=P.known.filter(isDesign).map(k=>{const t=ITEMS[k],w=designWhy(P,k);
    return `<div class="rec"><div><div class="rf">${gl(k)}<b>${t.name}</b>${cnt(P,k)>=1?`<span class="tag">手元${cnt(P,k)}</span>`:''}</div><div class="rd">${Object.entries(t.jobs).map(([j,v])=>JOBL[j]+powTxt(j,v)).join('・')}・もち${t.dur}回 / ${Object.entries(t.mat).map(([g,n])=>ITEMS[g].name+q(g,n)).join('・')}</div></div>
    <div class="rb"><button class="btn small" data-mk="${k}" ${w?'disabled':''}>作る</button><button class="btn small" data-load="${k}">台に載せる</button><button class="btn small" data-teach="${k}">教える</button></div></div>`}).join('');
  const procs=RECIPES.filter(r=>knows(P,r.id)).map(r=>{const w=craftWhy(P,r),n=recipeOut(P,r);
    return `<div class="rec"><div><div class="rf">${costHtml(recipeIn(P,r))} → ${gl(r.out)}<b>${ITEMS[r.out].name}${n>1?'×'+n:''}</b>${r.needs?'<span class="tag">窯</span>':''}</div><div class="rd">${w&&w!=='労力が残っていない'?w:r.short}</div></div>
    <div class="rb"><button class="btn small" data-craft="${r.id}" ${w?'disabled':''}>作る</button>${r.auto?'':`<button class="btn small" data-teach="${r.id}">教える</button>`}</div></div>`}).join('');
  const others=Object.entries(S.designs).filter(([k])=>!P.known.includes(k)).map(([k,v])=>`<span>${gl(k,1)} ${ITEMS[k].name}(${v.by})</span>`).join('');
  const t=S.ui.teach;let teach='';
  if(t){if(t.none)teach=`<div class="msg">${nameOf(t.rid)}の作り方を教わりたい人は今いない。みんな知っているか、払える物がない。</div>`;
    else{const a=S.agents.find(x=>x.id===t.aid);teach=`<div class="msg win">${a.name}が${ITEMS[t.g].name}${q(t.g,t.amt)}を払うので、${nameOf(t.rid)}の作り方を教えてほしいと言っている。教えると、${a.name}も自分で作れるようになる。<div class="confirm" style="margin-top:6px"><button class="btn small" id="teachYes">教える</button><button class="btn small" id="teachNo">断る</button></div></div>`}}
  $('bench').innerHTML=`<h2>道具づくり <small>先端・柄・結びを選んで組み立てる・労力1</small></h2>
    <p class="note">素材にはそれぞれ性質がある。先端の形で道具の働きが決まり、柄と結びで力の乗り方ともちが変わる。持っていない素材も選んで性能を確かめられる。</p>
    <h3>1 先端の素材</h3><div class="wbrow">${heads}</div>
    <div class="traits"><span>鋭さ <b>${dots(Math.min(5,M.sharp),5)}</b></span><span>硬さ <b>${dots(Math.min(5,M.hard),5)}</b></span><span>重さ <b>${dots(Math.min(5,M.heavy),5)}</b></span><span>${M.note}</span></div>
    <h3>2 先端の形</h3><div class="wbrow">${shapes}</div>
    <h3>3 柄</h3><div class="wbrow">${hands}</div>
    <h3>4 結び</h3><div class="wbrow">${binds}</div>
    <div class="pv"><div class="pvh"><span class="gl c-tool">${d.ch}</span><b>${d.name}</b>${known?'<span class="tag">型帳にある</span>':'<span class="tag">新しい型</span>'}</div>
      ${stats}<div class="st"><span>もち</span><span class="sb"><i style="width:${Math.min(100,d.dur/40*100)}%"></i></span><b class="num">${d.dur}回</b><small>名品なら${Math.round(d.dur*2.5)}回</small></div>
      ${notes.length?`<p class="note">${notes.join('・')}</p>`:''}
      <div class="bc">材料 ${costHtml(d.mat)}</div>${why&&why!=='労力が残っていない'?`<div class="why">${why}</div>`:''}
      <div class="controls"><button class="btn primary" id="wbMake" ${why?'disabled':''}>組み立てる(労力1)</button></div></div>
    <h3>型帳 ${P.known.filter(isDesign).length}</h3><div class="book">${book||'<p class="note">まだ型はない。組み立てた道具の形がここに残り、次からすぐ作れる。</p>'}</div>
    <h3>加工</h3><div class="book">${procs||'<p class="note">素材を手に入れると、加工の仕方を思いつくことがある。</p>'}</div>${teach}
    ${others?`<h3>村で使われている道具</h3><p class="note">買うか教わるかすれば、組み方が分かる。</p><div class="rumor">${others}</div>`:''}`;
}
function renderCard(P){const c=S.card,el=$('card');if(!c||!P.region||P.health<=0){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<div class="cardk">今日の出来事</div><h2>${c.title}</h2><p class="lead">${c.text}</p>${c.result?`<div class="msg win">${c.result}</div><div class="copts"><button class="btn small" id="cardClose">閉じる</button></div>`:
    `<div class="copts">${c.opts.map(o=>`<button class="btn small ${o.plain?'':'primary'}" data-card="${o.id}" ${o.dis||(o.labor&&P.labor<o.labor)||(S.ui.exp&&!S.ui.exp.done&&o.labor)?'disabled':''}>${o.label}</button>`).join('')}</div>`}`}
function renderRares(){const found=RARES.filter(g=>S.found[g]).length;
  $('rares').innerHTML=`<h2>珍品帳 <small>${found}/${RARES.length} 見つけた</small></h2><div class="coll">${RARES.map(g=>S.found[g]?`<div class="cl on">${gl(g)}<span>${ITEMS[g].name}<small>${RARITY[ITEMS[g].rare]}・${S.found[g]}個目まで</small></span></div>`:`<div class="cl"><span class="gl c-none">?</span><span>？？？<small>${RARITY[ITEMS[g].rare]}</small></span></div>`).join('')}</div>
  <p class="note">珍品は採集のついでにまれに見つかるほか、遠出の奥地や出来事でも手に入る。腐らず軽く数が少ないので、村の誰もが欲しがればお金の代わりになるかもしれない。${found===RARES.length?' 全部そろった。あなたは村一番の目利きだ。':''}</p>`}
/* 声かけは毎日は来ない。来た日だけ、左の列のいちばん上に出す */
function renderCalls(P){const el=$('calls');if(!P.region||P.health<=0||!S.offers.length){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<div class="cardk">声がかかっています</div><h2>${S.offers.length}人があなたを訪ねてきた <small>今日のうちに応じないと、ほかを当たる</small></h2>
    <div class="offers">${S.offers.map(o=>{const a=S.agents.find(x=>x.id===o.aid);if(!a)return'';
    return `<div class="offer"><div><div class="who">${a.name}・${REG[a.region].name}${o.why?`「${o.why}」`:''}</div>
      <div class="deal">${gl(o.give.g)}<span class="num">${q(o.give.g,o.give.amt)}</span>を渡す → ${gl(o.get.g)}<span class="num">${q(o.get.g,o.get.amt)}</span>をもらう ${o.medium?`<span class="tag">${ITEMS[o.medium].name}で支払い</span>`:''}</div></div>
      <button class="btn small" data-offer="${o.id}" ${cnt(P,o.give.g)<o.give.amt?'disabled':''}>応じる</button></div>`}).join('')}</div>
    <p class="note">困っている人に応じると名声が上がる。</p>`}
function renderWorks(P){const k=activeWork();let cur='';
  if(k){const W=WORKS[k],w=S.works[k];
    const rows=Object.entries(W.need).map(([g,need])=>{const got=w.got[g]||0,left=workLeft(k,g);let b='';
      if(left<=0)b='<span class="tag">そろった</span>';
      else{if(g==='labor')b=`<button class="btn small" data-wgive="labor" ${P.labor<1?'disabled':''}>加わる(労力1)</button>`;
        else if(g==='rare'){const r=rareToGive(P);b=`<button class="btn small" data-wgive="rare" ${r?'':'disabled'}>${r?ITEMS[r].name+'を供える':'珍品がない'}</button>`}
        else{const n=giveAmt(P,k,g);b=`<button class="btn small" data-wgive="${g}" ${n>0?'':'disabled'}>${n>0?q(g,n)+'を出す':'手元にない'}</button>`}
        const qt=hireQuote(P,k,g);
        if(qt)b+=!qt.n?'<button class="btn small" disabled>頼める人がいない</button>'
          :`<button class="btn small" data-whire="${g}" ${qt.pay?'':'disabled'}>${qt.pay?`${workQ(g,qt.n)}を頼む(${ITEMS[qt.pay.g].name}${q(qt.pay.g,qt.pay.amt)})`:'払える品がない'}</button>`}
      return `<div class="wrow">${workGl(g)}<span>${workName(g)}</span><span class="sb"><i style="width:${Math.min(100,got/need*100)}%"></i></span><b class="num">${workQ(g,Math.min(got,need))}/${need}</b><span class="wb">${b}</span></div>`}).join('');
    const by=Object.entries(w.by).sort((x,y)=>y[1]-x[1]);
    cur=`<div class="pv"><div class="pvh"><span class="gl c-salt">${W.ch}</span><b>${W.name}</b><span class="tag">普請中・${S.day-w.start}日目</span></div>
      <p class="note">${W.desc}完成すると: ${W.effect}</p><div class="works">${rows}</div>
      <p class="note">${by.length?`力を貸した人: ${by.slice(0,8).map(([n,v])=>`${n} ${Math.round(v)}`).join('・')}`:'まだ誰も手を貸していない。'}</p></div>`}
  const list=Object.entries(WORKS).filter(([x])=>x!==k).map(([x,W])=>{
    if(built(x))return `<div class="rec done"><div><div class="rf"><span class="gl c-salt">${W.ch}</span><b>${W.name}</b><span class="tag">${S.works[x].done}日目に完成</span></div><div class="rd">${W.effect}</div></div></div>`;
    if(!seen('work_'+x))return'';
    return `<div class="rec"><div><div class="rf"><span class="gl c-salt">${W.ch}</span><b>${W.name}</b></div><div class="rd">${W.desc}${W.effect}</div>
      <div class="bc">${Object.entries(W.need).map(([g,n])=>`${workGl(g)}<span class="num">${n}</span>`).join(' ')}</div></div>
      <div class="rb"><button class="btn small" data-wstart="${x}" ${k?'disabled':''}>呼びかける</button></div></div>`}).join('');
  $('works').innerHTML=`<h2>村の大事業 <small>完成 ${worksDone()}/${Object.keys(WORKS).length}・一度に進められるのは1つ</small></h2>
    <p class="note">材料と人手を村じゅうで持ち寄って建てる。完成すると村の誰もが恩恵を受ける。出した物の値打ちはあなたの名声になり、肩書きが上がるほど村人が手を貸してくれる。手持ちの財で村人に頼むこともできる。</p>
    ${cur}<div class="book">${list}</div>`}
/* 達成した項目と、まだの項目のうち次の3つだけを見せる */
function renderAyumi(){const n=AYUMI.filter(x=>S.ayumi[x.id]).length;const next=AYUMI.filter(x=>!S.ayumi[x.id]).slice(0,3);
  $('ayumi').innerHTML=`<h2>あゆみ帳 <small>${n}/${AYUMI.length}</small></h2>
    <div class="coll">${AYUMI.filter(x=>S.ayumi[x.id]||next.includes(x)).map(x=>S.ayumi[x.id]?`<div class="cl on"><span class="gl c-salt">節</span><span>${x.name}<small>${S.ayumi[x.id]}日目・${x.desc}</small></span></div>`
      :`<div class="cl"><span class="gl c-none">・</span><span>${x.name}<small>${x.desc}</small></span></div>`).join('')}</div>`}
function renderMarket(P){
  if(!P.region)$('offers').innerHTML=`<div class="empty">住む場所を決めると、困った村人が声をかけてくることがある。</div>`;
  else $('offers').innerHTML=`<div class="empty">${S.offers.length?`今日は${S.offers.length}人から声がかかっている。画面上の「声がかかっています」から応じられる。`:'今日は誰も声をかけてこない。下から自分で相手を探せる。'}</div>`;
  const dem=ORDER.map(g=>{let D=0,Su=0;for(const a of ais()){if(isTool(g)){if(cnt(a,g)<1&&a.want[g])D++}else D+=deficit(a,g);Su+=surplus(a,g)}return{g,v:D-Su}}).filter(x=>x.v>.5).sort((x,y)=>y.v-x.v).slice(0,7);
  $('demand').innerHTML=dem.length?dem.map(x=>`<span>${gl(x.g,1)} ${ITEMS[x.g].name}</span>`).join(''):'<span>特になし</span>';
  const opts=ORDER.map(g=>`<option value="${g}">${ITEMS[g].name}</option>`).join('');
  for(const id of['pGive','pWant']){const el=$(id);const v=el.value;if(el.options.length!==ORDER.length)el.innerHTML=opts;if(v)el.value=v}
  if(!$('pWant').dataset.init){$('pGive').value='berries';$('pWant').value='salt';$('pWant').dataset.init=1}
  $('pGo').disabled=!P.region||P.health<=0;
  $('pMsg').innerHTML=S.ui.msg?`<div class="msg">${S.ui.msg}</div>`:'';
}
function renderMoney(){
  const mg=moneyGood();const pool=ais();const avgTh=pool.reduce((s,a)=>s+a.thresh,0)/Math.max(1,pool.length);
  $('moneyLead').innerHTML=mg.v<.22?'まだお金はない。人々は、相手が自分の欲しい物を持ち、しかも自分の物を欲しがっている時にしか交換できない。'
    :mg.v<.5?`<b>${ITEMS[mg.g].name}</b>が交換の仲立ちに使われ始めている。自分では要らなくても「あとで換えられる」から受け取る人がいる。`
    :`<b>${ITEMS[mg.g].name}</b>がお金として通用している。値段は${ITEMS[mg.g].name}で測られ、物々交換の手間が消えつつある。`;
  const top=GOODS.slice().sort((x,y)=>S.money[y]-S.money[x]).slice(0,5);
  $('money').innerHTML=top.map(g=>`<div class="mrow">${gl(g)}<span>${ITEMS[g].name}</span><span class="mbar"><i style="width:${Math.round(S.money[g]*100)}%" class="c-${ITEMS[g].cat}"></i><span class="th" style="left:${avgTh*100}%"></span></span><span class="num">${Math.round(S.money[g]*100)}%</span></div>`).join('')
    +`<p class="note">上位5品。縦線は、村人が自分では要らなくても受け取り始める平均ライン。腐りにくく、誰もが欲しがり、運びやすい物ほど伸びる。昨日の仲立ち: ${Object.entries(S.lastInd||{}).map(([g,n])=>`${ITEMS[g].name}${n}回`).join('・')||'なし'}</p>`;
}
function renderPrices(){
  const mg=moneyGood();const unit=mg.v>=.5?mg.g:'grain';
  $('unitNote').textContent=`${ITEMS[unit].name}1を基準にした値段・村に出回っている物だけ`;
  const exist=ORDER.filter(g=>g!==unit&&live().some(a=>cnt(a,g)>.04));
  $('prices').innerHTML=exist.map(g=>{const v=S.prices[g]/S.prices[unit];return `<div>${gl(g,1)}${ITEMS[g].name}<span class="num">${v<1?v.toFixed(2):v.toFixed(1)}</span></div>`}).join('');
  $('legend').innerHTML=CHART.map(([g,c])=>`<span><i style="background:var(--${c})"></i>${ITEMS[g].name}</span>`).join('')+'<span>穀物=1・対数目盛</span>';
  drawChart();
}
const CHART=[['fish','l-fish'],['salt','accent'],['wood','l-wood'],['pot','pot'],['copper','cu']];
function renderLog(){$('log').innerHTML=S.log.map(l=>`<li class="${l.kind}"><span class="d">${l.d}日</span><span>${l.t}</span></li>`).join('')}
function renderVillagers(P){
  $('popNote').textContent=`${live().length}人`;
  $('vt').innerHTML=`<thead><tr><th>名前</th><th>土地</th><th>体力</th><th class="r">食料</th><th>道具</th><th>施設</th><th class="r">知恵</th></tr></thead><tbody>`+
    live().map(a=>{const fac={};a.plot.forEach(p=>{if(p.f)fac[p.f.type]=(fac[p.f.type]||0)+1});
      return `<tr class="${a.isPlayer?'me':''}"><td>${a.name}${a.isPlayer?`(${TITLES[a.title||0].name})`:''}</td><td>${REG[a.region].name}</td><td>${hbar(a.health)}</td><td class="r num">${q('grain',foodTotal(a))}</td>
      <td><span class="gls">${TOOLS.filter(t=>cnt(a,t)>=1).map(t=>gl(t,1)).join('')||'—'}</span></td>
      <td>${Object.entries(fac).map(([f,n])=>FAC[f].name+(n>1?n:'')).join('・')||'—'}</td><td class="r num">${a.known.length}</td></tr>`}).join('')+'</tbody>';
  $('resetBox').innerHTML=resetArmed?`<span>今の村は消える。作り直す？</span><button class="btn small" id="resetYes">作り直す</button><button class="btn small" id="resetNo">やめる</button>`:`<button class="btn small" id="reset">世界を作り直す</button>`;
}
function drawChart(){
  const cv=$('chart');const box=cv.parentElement;const dpr=window.devicePixelRatio||1;
  const W=box.clientWidth,H=box.clientHeight;if(!W)return;
  cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.documentElement);const tk=n=>cs.getPropertyValue('--'+n).trim();
  const L=34,R=8,T=8,B=20;const h=S.hist;const lo=Math.log(.1),hi=Math.log(80);
  const y=v=>T+(H-T-B)*(1-(Math.log(Math.max(.1,Math.min(80,v)))-lo)/(hi-lo));
  const n=Math.max(2,h.length);const x=i=>L+(W-L-R)*(i/(n-1));
  c.font=`11px ${tk('f-num')}`;c.fillStyle=tk('muted');c.strokeStyle=tk('line');c.lineWidth=1;c.textAlign='right';c.textBaseline='middle';
  for(const v of[.2,.5,1,2,5,10,20,50]){const yy=Math.round(y(v))+.5;c.beginPath();c.moveTo(L,yy);c.lineTo(W-R,yy);c.globalAlpha=v===1?1:.5;c.stroke();c.globalAlpha=1;c.fillText(String(v),L-5,yy)}
  c.textBaseline='alphabetic';
  if(h.length){c.textAlign='left';c.fillText(`${h[0].d}日`,L,H-4);c.textAlign='right';c.fillText(`${h[h.length-1].d}日`,W-R,H-4)}
  for(const[g,col]of CHART.filter(([g])=>g!=='copper'||live().some(a=>cnt(a,'copper')>0))){
    c.strokeStyle=tk(col);c.lineWidth=g==='salt'||g==='copper'?2.4:1.5;c.beginPath();
    h.forEach((p,i)=>{const yy=y(p.p[g]/p.p.grain);i?c.lineTo(x(i),yy):c.moveTo(x(i),yy)});c.stroke();
    if(h.length){const l=h[h.length-1];c.fillStyle=c.strokeStyle;c.beginPath();c.arc(x(h.length-1),y(l.p[g]/l.p.grain),3,0,7);c.fill()}
  }
}

/* ================= 進行・保存 ================= */
function stopAuto(){clearInterval(autoTimer);autoTimer=null;$('auto').setAttribute('aria-pressed','false');$('auto').textContent='おまかせで進める'}
function toggleAuto(){if(autoTimer)return stopAuto();autoTimer=setInterval(endDay,900);$('auto').setAttribute('aria-pressed','true');$('auto').textContent='止める'}
const KEY='hajimari-ichi-v4';
function save(){checkAyumi();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(o&&o.agents&&o.ui)return o}}catch(e){}return null}

document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;const d=t.dataset;
  if(t.id==='end')endDay();
  else if(t.id==='auto')toggleAuto();
  else if(d.region)chooseRegion(d.region);
  else if(d.tile!=null){S.ui.tile=S.ui.tile===+d.tile?null:+d.tile;render()}
  else if(d.build)act(P=>doBuild(P,d.build,S.ui.tile));
  else if(d.gather)act(P=>toastGather(doGather(P,d.gather)));
  else if(d.field)act(P=>toastGather(doField(P)));
  else if(d.rest)act(P=>doRest(P));
  else if(d.craft)act(P=>toastCraft(doCraft(P,d.craft)));
  else if(d.exp)act(P=>startExp(P),1);
  else if(t.id==='expGo')act(P=>stepExp(P),1);
  else if(t.id==='expBack')act(P=>finishExp(P,false),1);
  else if(t.id==='expClose'){S.ui.exp=null;save();render()}
  else if(d.card)resolveCard(d.card);
  else if(t.id==='cardClose'){S.card=null;save();render()}
  else if(d.wbm){S.ui.wb.m=d.wbm;render()}
  else if(d.wbs){S.ui.wb.s=d.wbs;render()}
  else if(d.wbh){S.ui.wb.h=d.wbh;render()}
  else if(d.wbb){S.ui.wb.b=d.wbb;S.ui.wb.lastB=d.wbb;render()}
  else if(t.id==='wbMake'){const w=S.ui.wb;act(P=>toastCraft(craftDesign(P,dkey(w.s,w.m,w.h,w.b))))}
  else if(d.mk)act(P=>toastCraft(craftDesign(P,d.mk)));
  else if(d.load){const x=ITEMS[d.load].design;S.ui.wb={m:x.m,s:x.s,h:x.h,b:x.b,lastB:x.b==='none'?'fiber':x.b};render()}
  else if(d.teach)teachOffer(d.teach);
  else if(t.id==='teachYes')doTeach();
  else if(t.id==='teachNo'){S.ui.teach=null;render()}
  else if(d.offer)acceptOffer(+d.offer);
  else if(d.wstart)act(P=>startWork(d.wstart));
  else if(d.wgive)act(P=>workGive(P,activeWork(),d.wgive));
  else if(d.whire)act(P=>workHire(P,activeWork(),d.whire));
  else if(t.id==='pGo')propose();
  else if(t.id==='reset'){resetArmed=true;render()}
  else if(t.id==='resetNo'){resetArmed=false;render()}
  else if(t.id==='resetYes'||t.id==='again'){resetArmed=false;stopAuto();freshWorld();save();render()}
});
window.addEventListener('resize',()=>S&&drawChart());
try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>S&&drawChart())}catch(e){}

function start(data){S=(data&&data.state)||load();if(!S){freshWorld()}for(const k in(S.designs||{}))defineDesign(k);S.ui.wb=S.ui.wb||{m:'stone',s:'point',h:'long',b:'fiber'};
  /* 大事業・肩書き・あゆみより前の保存を引き継ぐ。すでに満たしている項目は黙って記録する */
  S.works=S.works||{};S.ayumi=S.ayumi||{};S.seen=S.seen||{};S.stat={...newStat(),...(S.stat||{})};{const P=player();P.fame=P.fame||0;P.title=P.title||0}
  checkAyumi(true);render()}
if(typeof window!=='undefined'&&!window.__HAJIMARI_HEADLESS__)start({});

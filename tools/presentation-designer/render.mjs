// Reusable application renderer, not model-generated executable code.
// The Python MCP host supplies the validated plan and all local output paths.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const [input, output] = process.argv.slice(2);
if (!input || !output || process.env.K_SERVICE) throw new Error('Local designer requires input/output paths.');
const plan = JSON.parse(await fs.readFile(input, 'utf8'));
const assetDir = fileURLToPath(new URL('../../examples/mcp/', import.meta.url));
const assets = { forest: 'forest-cover.png', plant: 'plant-illustration.png', classroom: 'classroom-activity.png' };
const themes = {
  forest: { ink: '153F35', dark: '102D25', paper: 'F8F4EA', muted: '60796A', accent: 'E9B74F', pale: 'EDF1DE' },
  terracotta: { ink: '713C2D', dark: '392B24', paper: 'FCF4E9', muted: '826957', accent: 'E8B15D', pale: 'F2E2CF' },
};
const c = themes[plan.theme];
if (!c) throw new Error('Unknown design theme.');
const ppt = new pptxgen();
ppt.layout = 'LAYOUT_WIDE';
ppt.author = 'SASTRA';
ppt.subject = plan.subject;
ppt.title = plan.title;
ppt.company = 'SASTRA';
ppt.lang = 'id-ID';
ppt.theme = { headFontFace: 'Georgia', bodyFontFace: 'Arial', lang: 'id-ID' };
const W = 13.333333, H = 7.5;
const audit = [];

function widthEstimate(value, size) {
  return [...value].reduce((sum, char) => sum + (/[ilI.,:!|' ]/.test(char) ? .26 : /[MW@]/.test(char) ? .88 : /[A-Z]/.test(char) ? .65 : .49), 0) * size;
}
function lineCount(value, size, width) {
  let lines = 0;
  for (const paragraph of value.split('\n')) {
    let used = 0;
    lines++;
    for (const word of paragraph.split(/\s+/)) {
      const span = widthEstimate(word + ' ', size);
      if (span > width * 72) throw new Error('Unbreakable text exceeds its layout slot.');
      if (used && used + span > width * 72) { lines++; used = 0; }
      used += span;
    }
  }
  return lines;
}
function text(slide, value, x, y, w, h, size = 22, extra = {}) {
  if (!value) return;
  if (![x,y,w,h,size].every(Number.isFinite) || x < 0 || y < 0 || x+w > W+.01 || y+h > H+.01) {
    throw new Error(`Text outside slide: ${value.slice(0, 30)}`);
  }
  const lines = lineCount(value, size, w);
  if (lines * size * 1.12 > h * 72 + 3) {
    throw new Error(`Text exceeds ${extra.name || 'layout slot'}; shorten it: ${value.slice(0, 70)}`);
  }
  slide.addText(value, { x, y, w, h, margin: 0, fontFace: 'Arial', fontSize: size,
    color: c.ink, breakLine: false, valign: 'top', paraSpaceAfter: 0,
    lineSpacingMultiple: 1.08, fit: 'none', lang: 'id-ID', ...extra });
  audit.push({ slide: ppt._slides.length, text: value, x, y, w, h, size, estimatedLines: lines });
}
function photo(slide, key, x, y, w, h, crop = true) {
  if (!assets[key]) throw new Error('Asset must be from the bundled registry.');
  const file = path.join(assetDir, assets[key]);
  slide.addImage({ path: file, x,y,w,h, sizing:{type:crop?'crop':'contain',w,h},
    altText: `AI-generated ${key === 'classroom' ? 'illustration of fictional children observing a plant' : 'botanical illustration'}` });
}
function page(dark = false, bg = null) {
  const s = ppt.addSlide();
  s.background = { color: bg || (dark ? c.dark : c.paper) };
  return s;
}
function footer(s, n, dark = false) {
  const color = dark ? 'CCDBC8' : c.muted;
  text(s, `SASTRA / ${plan.subject} KELAS ${plan.className}`, .72, 7.03, 10.5, .22, 10, {color});
  text(s, String(n).padStart(2,'0'), 11.88, 6.98, .7, .35, 14, {color, align:'right'});
}
function top(s, kicker, title, dark = false) {
  const color = dark ? 'FFF9E9' : c.ink;
  text(s, kicker.toUpperCase(), .75, .48, 11.8, .3, 11, {bold:true, charSpacing:1.8, color:dark?'D6C992':c.muted});
  text(s, title, .72, 1.05, 11.85, 1.1, 36, {fontFace:'Georgia', color});
}
function rule(s, x, y, w, color = c.muted) {
  s.addShape(ppt.ShapeType.line, {x,y,w,h:0,line:{color,width:.6,transparency:45}});
}
function notes(s, body) {
  s.addNotes(`${body || ''}\nSumber: materi ${plan.sourceId} versi ${plan.sourceVersion}. ` +
    'Ilustrasi buatan AI untuk SASTRA. Foto tanaman dan anak adalah gambar sintetis, bukan dokumentasi kelas nyata.');
}

// Cover: edge-to-edge artwork, generous dark negative space, editable typography.
{
  const s = page(true);
  if (plan.coverVisual === 'forest') photo(s,'forest',0,0,W,H);
  text(s, `${plan.subject.toUpperCase()} / KELAS ${plan.className}`, .78, .7, 8, .4, 13, {color:'D7DABA',charSpacing:2,bold:true});
  text(s, plan.title, .72, 1.65, 6.6, 3.5, 59, {fontFace:'Georgia',color:'FFF9E9'});
  text(s, plan.subtitle, .8, 5.35, 6.3, 1.0, 22, {color:'F2EFDB'});
  text(s, 'SASTRA', .8, 6.83, 5, .3, 12, {color:'D7DABA',bold:true,charSpacing:2});
  notes(s, plan.objective);
}

for (const [index, item] of plan.slides.entries()) {
  const number = index+2;
  const dark = item.layout === 'process' || item.layout === 'reflection';
  const s = page(dark, item.layout === 'quiz' ? c.accent : item.layout === 'concept' ? 'FFFFFF' : null);
  top(s, item.kicker, item.title, dark);
  switch (item.layout) {
    case 'hook': {
      text(s, item.lead, .75, 2.65, 10.9, 2.4, 40, {fontFace:'Georgia'});
      rule(s,.78,5.6,10.9);
      text(s,item.items[0].body,.78,5.95,10.8,.8,22,{color:c.muted});
      break;
    }
    case 'concept': {
      const visual = item.visual === 'plant';
      const width = visual ? 6.5 : 11.8;
      if (visual) photo(s,'plant',7.8,2.05,4.75,4.75,false);
      for (const [i, entry] of item.items.entries()) {
        const y = 2.48 + i*1.25;
        text(s,entry.label,.78,y,width,.43,21,{bold:true});
        text(s,entry.body,.78,y+.46,width,.72,20);
      }
      break;
    }
    case 'process': {
      text(s,item.lead,.78,2.25,11.7,.65,21,{color:'DCE7D0'});
      for (const [i, entry] of item.items.entries()) {
        const x=.8+i*4.05;
        text(s, String(i+1).padStart(2,'0'),x,3.05,3.5,.95,52,{fontFace:'Georgia',color:c.accent});
        text(s,entry.label,x,4.13,3.5,.7,23,{bold:true,color:'FFF9E9'});
        text(s,entry.body,x,4.95,3.5,1.6,21,{color:'DCE7D0'});
      }
      break;
    }
    case 'compare': {
      text(s,item.lead,.78,2.25,11.7,.65,22,{color:c.muted});
      for (const [i, entry] of item.items.entries()) {
        const x = .8+i*6.3;
        rule(s,x,3.0,5.5);
        text(s,entry.label,x,3.35,5.5,1.2,34,{fontFace:'Georgia'});
        text(s,entry.body,x,4.85,5.3,1.6,24);
      }
      break;
    }
    case 'activity': {
      const visual=item.visual==='classroom';
      if(visual) photo(s,'classroom',.78,2.5,6.65,4.1);
      const x=visual?8.0:.8, width=visual?4.55:11.7;
      for (const [i, entry] of item.items.entries()) {
        const y=2.5+i*1.32;
        text(s,entry.label,x,y,width,.4,19,{bold:true});
        text(s,entry.body,x,y+.46,width,.83,19);
      }
      break;
    }
    case 'quiz': {
      text(s,item.lead,.8,2.35,11.7,1.25,30,{fontFace:'Georgia'});
      for(const [i,entry] of item.items.entries()) {
        const y=3.95+i*.82;
        text(s,String.fromCharCode(65+i),.8,y,.7,.5,27,{fontFace:'Georgia'});
        text(s,entry.body,1.7,y+.02,10.6,.6,24);
        if(i<item.items.length-1) rule(s,1.7,y+.63,10.3,c.ink);
      }
      break;
    }
    case 'reflection': {
      text(s,item.lead,.8,2.3,11.6,.75,23,{color:'DCE7D0'});
      for(const [i,entry] of item.items.entries()) {
        const y=3.35+i*.96;
        text(s,String(i+1).padStart(2,'0'),.8,y,.7,.55,24,{fontFace:'Georgia',color:c.accent});
        text(s,entry.body,1.8,y,10.6,.75,24,{color:'FFF9E9'});
      }
      break;
    }
    default: throw new Error(`Unknown layout: ${item.layout}`);
  }
  footer(s,number,dark);
  notes(s,item.notes);
}
// Detect accidental text/text intersections before writing anything.
for(let i=0;i<audit.length;i++) for(let j=i+1;j<audit.length;j++) {
  const a=audit[i],b=audit[j];
  if(a.slide!==b.slide) continue;
  const dx=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
  const dy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
  if(dx>.025 && dy>.025) throw new Error(`Text slots overlap on slide ${a.slide}.`);
}
await ppt.writeFile({fileName:output,compression:true});
await fs.writeFile(output+'.layout.json',JSON.stringify({width:W,height:H,slots:audit},null,2));
console.log(JSON.stringify({slides:ppt._slides.length,textSlots:audit.length,engine:'sastra-designer/pptxgenjs',size:'16:9'}));

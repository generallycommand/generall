import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReadingNotes, READING_CARDS } from './reading.js';
import { createInitialState } from './tracker.js';
import { createBackup, parseBackup } from './backup.js';

test('reading reflections and voluntary selection survive a full backup round trip', () => {
 const state = {...createInitialState(), readingNotes: {'small-steps': {reflection:'自动化测试笔记',selected:true}}};
 assert.deepEqual(parseBackup(JSON.stringify(createBackup(state, {}))).journey.readingNotes, state.readingNotes);
 assert.deepEqual(createInitialState().readingNotes, {});
 const legacy = createInitialState(); delete legacy.readingNotes;
 assert.deepEqual(parseBackup(JSON.stringify(legacy)).journey.readingNotes, {});
});
test('reading notes normalize invalid imports and bound local text', () => {
 assert.deepEqual(normalizeReadingNotes(null), {});
 const result = normalizeReadingNotes({'unknown':{reflection:'x'},'small-steps':{reflection:'x'.repeat(3000),selected:'true'},reflection:[]});
 assert.deepEqual(Object.keys(result), ['small-steps']);
 assert.equal(result['small-steps'].reflection.length,2000);
 assert.equal(result['small-steps'].selected,false);
});
test('forum cards explicitly disclose inaccessible body and retain exact original links', () => {
 const forum = READING_CARDS.filter(c=>c.directory);
 assert.equal(forum.length,3);
 for(const c of forum) { assert.match(c.scope,/403.*未读全文/); assert.match(c.url,/^https:\/\/tieba\.baidu\.com\/p\/\d+$/); }
 assert.equal(READING_CARDS.filter(c=>c.kind==='医学来源').length,2);
});
test('new readable forum card keeps page scope, date and separate claim types without changing older cards', () => {
 const card = READING_CARDS.find(c=>c.id==='six-years-reflection');
 assert.equal(card.accessedAt,'2026-10-11');
 assert.equal(card.url,'https://tieba.baidu.com/p/9536769292');
 assert.match(card.scope,/仅阅读公开第一页/);
 assert.deepEqual(card.distinctions.map(x=>x.label),['价值观点','未经证实的健康或宗教主张']);
 const old = READING_CARDS.filter(c=>c.directory);
 assert.equal(old.length,3);
 assert.ok(old.every(c=>c.scope.includes('未读全文') && !c.accessedAt));
 const state={...createInitialState(),readingNotes:{'six-years-reflection':{reflection:'自动化测试',selected:true}}};
 assert.deepEqual(parseBackup(JSON.stringify(createBackup(state,{}))).journey.readingNotes,state.readingNotes);
});

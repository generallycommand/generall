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

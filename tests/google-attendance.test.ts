import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { createHmac } from 'node:crypto'
import { expect,it } from 'vitest'
const context=vm.createContext({Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(body:string,secret:string)=>Array.from(createHmac('sha256',secret).update(body).digest())}})
vm.runInContext(readFileSync('integrations/google-attendance/Code.gs','utf8'),context)
const c={FMP_EVENT_ITEM_ID:'1',FMP_NAME_ITEM_ID:'2',categoryMap:{}}
const response=(id:string,event='00000000-0000-4000-8000-000000000001',name='José')=>({getId:()=>id,getTimestamp:()=>new Date('2026-09-23T10:00:00Z'),getRespondentEmail:()=>null,getItemResponses:()=>[[1,event],[2,name]].map(([id,value])=>({getItem:()=>({getId:()=>id}),getResponse:()=>value}))})
it('preserves distinct responses and optional absence',()=>{const result=context.normalizeResponses([response('a'),response('b')],c);const rows=result.groups['00000000-0000-4000-8000-000000000001'];expect(rows.length).toBe(2);expect(rows[0].name).toBe('José');expect(rows[0].category).toBeNull();expect(rows[0].email).toBeNull()})
it('does not guess an event from invalid IDs',()=>expect(context.normalizeResponses([response('a','Conference')],c).unmatched).toBe(1))
it('aborts when a linked participant is missing required data',()=>expect(()=>context.normalizeResponses([response('a',undefined,'')],c)).toThrow())
it('signs exact UTF8 bytes',()=>{const body='{"name":"José"}';expect(context.signatureFor(body,100,'secret')).toBe(createHmac('sha256','secret').update('100.'+body).digest('hex'))})
it('handles more than a thousand responses without truncation',()=>{const input=Array.from({length:1201},(_,i)=>response(String(i)));expect(context.normalizeResponses(input,c).groups['00000000-0000-4000-8000-000000000001'].length).toBe(1201)})

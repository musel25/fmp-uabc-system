/* FMP attendance bridge. Secrets belong in Script Properties, never this file. */
function config_() {
  var c=PropertiesService.getScriptProperties().getProperties();
  ['FMP_FORM_ID','FMP_EVENT_ITEM_ID','FMP_NAME_ITEM_ID','FMP_SUPABASE_URL','FMP_SUPABASE_ANON_KEY','FMP_SYNC_SECRET'].forEach(function(k){if(!c[k])throw new Error('Missing configuration: '+k);});
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.FMP_SUPABASE_URL)||c.FMP_SYNC_SECRET.length<32)throw new Error('Invalid connection configuration');
  c.categoryMap=JSON.parse(c.FMP_CATEGORY_MAP||'{}');
  return c;
}
function inspectFormConfiguration() {
  var id=PropertiesService.getScriptProperties().getProperty('FMP_FORM_ID');
  var form=id?FormApp.openById(id):FormApp.getActiveForm();
  form.getItems().forEach(function(item){console.log(JSON.stringify({id:item.getId(),title:item.getTitle(),type:String(item.getType())}));});
  var eventItem=PropertiesService.getScriptProperties().getProperty('FMP_EVENT_ITEM_ID');
  if(eventItem)console.log(form.createResponse().withItemResponse(form.getItemById(Number(eventItem)).asTextItem().createResponse('00000000-0000-4000-8000-000000000001')).toPrefilledUrl());
}
function signatureFor(body,sentAt,secret) {
  return Utilities.computeHmacSha256Signature(sentAt+'.'+body,secret,Utilities.Charset.UTF_8).map(function(n){return ((n+256)%256).toString(16).padStart(2,'0');}).join('');
}
function send_(c,payload) {
  var body=JSON.stringify(payload);
  for(var attempt=0;attempt<4;attempt++) {
    var ts=Math.floor(Date.now()/1000),response;
    try { response=UrlFetchApp.fetch(c.FMP_SUPABASE_URL+'/rest/v1/rpc/attendance_sync',{method:'post',contentType:'application/json',headers:{apikey:c.FMP_SUPABASE_ANON_KEY,Authorization:'Bearer '+c.FMP_SUPABASE_ANON_KEY},payload:JSON.stringify({p_body:body,p_sent_at:ts,p_signature:signatureFor(body,ts,c.FMP_SYNC_SECRET)}),muteHttpExceptions:true}); }
    catch(error){if(attempt===3)throw new Error('Attendance network request failed');Utilities.sleep(Math.pow(2,attempt)*1000);continue;}
    var status=response.getResponseCode();
    if(status>=200&&status<300)return JSON.parse(response.getContentText());
    if((status===429||status>=500)&&attempt<3){Utilities.sleep(Math.pow(2,attempt)*1000);continue;}
    throw new Error('Attendance request failed: HTTP '+status);
  }
}
function normalizeResponses(responses,c) {
  var groups={},unmatched=0;
  responses.forEach(function(response){
    var answers={};response.getItemResponses().forEach(function(item){answers[String(item.getItem().getId())]=item.getResponse();});
    var eventId=String(answers[c.FMP_EVENT_ITEM_ID]||'').trim().toLowerCase();
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(eventId)){unmatched++;return;}
    var name=String(answers[c.FMP_NAME_ITEM_ID]||'').trim(),id=response.getId();
    if(!name||!id)throw new Error('A linked response has no participant name or response ID; no snapshots sent');
    var email=c.FMP_EMAIL_ITEM_ID?String(answers[c.FMP_EMAIL_ITEM_ID]||'').trim():response.getRespondentEmail();
    var category=c.categoryMap[String(answers[c.FMP_CATEGORY_ITEM_ID]||'')]||null;
    if(category!==null&&['docente','alumno','comunidad'].indexOf(category)<0)throw new Error('Invalid category map');
    (groups[eventId]||(groups[eventId]=[])).push({sourceResponseId:id,submittedAt:response.getTimestamp().toISOString(),name:name,email:email||null,category:category});
  });
  Object.keys(groups).forEach(function(id){groups[id].sort(function(a,b){return a.sourceResponseId.localeCompare(b.sourceResponseId);});});
  return {groups:groups,unmatched:unmatched};
}
function syncAttendance() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try {
    var c=config_(),form=FormApp.openById(c.FMP_FORM_ID),items=form.getItems().map(function(i){return String(i.getId());});
    [c.FMP_EVENT_ITEM_ID,c.FMP_NAME_ITEM_ID,c.FMP_EMAIL_ITEM_ID,c.FMP_CATEGORY_ITEM_ID].filter(Boolean).forEach(function(id){if(items.indexOf(String(id))<0)throw new Error('Configured question is missing; no snapshots sent');});
    var started=new Date().toISOString(),normalized=normalizeResponses(form.getResponses(),c),targets=[],cursor=null;
    do {var page=send_(c,{version:1,action:'targets',sourceFormId:c.FMP_FORM_ID,afterEventId:cursor});if(!Array.isArray(page.events))throw new Error('Invalid targets response');targets=targets.concat(page.events);cursor=page.nextCursor;}while(cursor);
    var known={};targets.forEach(function(target){known[target.eventId]=true;send_(c,{version:1,action:'snapshot',sourceFormId:c.FMP_FORM_ID,eventId:target.eventId,snapshotStartedAt:started,responses:normalized.groups[target.eventId]||[]});});
    var unlinked=normalized.unmatched;Object.keys(normalized.groups).forEach(function(id){if(!known[id])unlinked+=normalized.groups[id].length;});
    console.log(JSON.stringify({eventsSynced:targets.length,unlinkedResponses:unlinked,completedAt:new Date().toISOString()}));
  } finally {lock.releaseLock();}
}
function installSyncTrigger() {
  config_();
  var existing=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='syncAttendance';});
  if(existing.length===0)ScriptApp.newTrigger('syncAttendance').timeBased().everyMinutes(15).create();
  // Leave other integrations and their triggers untouched.
}

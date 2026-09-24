export function createCsv(rows:Array<Array<string|number|null>>):string{
 const cell=(value:string|number|null)=>{
  if(typeof value==='number')return String(value)
  let s=value??''
  if(/^[\s\u0000-\u001f]*[=+@-]/u.test(s))s="'"+s
  return /[",\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s
 }
 return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')
}
export function downloadCsv(contents:string,filename:string):void{
 const url=URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8;'}))
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

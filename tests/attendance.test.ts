import { expect,it } from 'vitest'
import { buildAttendanceLink } from '@/lib/attendance'
const settings={reportsRolloutAt:null,attendanceEnabled:true,attendancePublishedUrl:'https://docs.google.com/forms/d/e/public-id/viewform',attendancePrefillTemplate:'https://docs.google.com/forms/d/e/public-id/viewform?usp=pp_url&entry.123={eventId}'}
const id='00000000-0000-4000-8000-000000000001'
it('prefills an event with the configured public entry key',()=>expect(buildAttendanceLink(settings,id)).toContain(`entry.123=${id}`))
it('never disguises a generic or hostile URL as event-specific',()=>{expect(buildAttendanceLink({...settings,attendancePrefillTemplate:null},id)).toBeNull();expect(buildAttendanceLink({...settings,attendancePrefillTemplate:'https://evil.test/?entry.1={eventId}'},id)).toBeNull();expect(buildAttendanceLink(settings,'bad')).toBeNull()})

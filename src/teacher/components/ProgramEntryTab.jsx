import React from 'react';
import { ClipboardList, Plus, Phone, CheckCircle2, Trash2, Send, Users } from 'lucide-react';

export default function ProgramEntryTab({
  assignedEvents = [],
  selectedEventId,
  setSelectedEventId,
  studentName,
  setStudentName,
  studentId,
  setStudentId,
  department,
  setDepartment,
  semester,
  setSemester,
  phone,
  setPhone,
  groupMembers,
  setGroupMembers,
  chosenEvent,
  isGroupEvent,
  handleAddParticipant,
  regBusy,
  handleSubmitList,
  participants = [],
  pendingCount,
  forwardedCount,
  handleDeleteParticipant,
  PENDING,
}) {
  return (
    <>
      <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-[#E6F1F2] text-[#0B3F46] rounded-xl flex items-center justify-center">
            <ClipboardList size={21} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#0B3F46]">Enter Student Details for Assigned Programs</h2>
            <p className="text-xs text-[#718589] mt-1">Register students for programs assigned to you by your dept coordinator.</p>
          </div>
        </div>

        <form onSubmit={handleAddParticipant} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="sm:col-span-2 xl:col-span-1">
              <label className="block text-xs font-bold text-[#456166] mb-2">Select Assigned Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
              >
                {assignedEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName}{ev.festName ? ` · ${ev.festName}` : ''} [{ev.eventType}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">Student Full Name</label>
              <input
                type="text"
                placeholder={isGroupEvent ? 'Team Leader Name' : 'Enter student name'}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">Student ID / Roll Number</label>
              <input
                type="text"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">Semester / Year</label>
              <input
                type="text"
                placeholder="e.g. S6"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">Contact Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
              />
            </div>
          </div>

          {isGroupEvent && (
            <div>
              <label className="block text-xs font-bold text-[#456166] mb-2">
                Group Members (Comma-separated names & IDs)
                {chosenEvent?.maxGroupSize ? ` · up to ${chosenEvent.maxGroupSize}` : ''}
              </label>
              <input
                type="text"
                placeholder="Ananya S. (ID-02), Rahul V. (ID-03)"
                value={groupMembers}
                onChange={(e) => setGroupMembers(e.target.value)}
                className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EDF1F1]">
            <p className="text-xs text-[#718589]">
              Note: Department fest funds are collected separately. Register event participants below.
            </p>
            <button
              type="submit"
              disabled={regBusy}
              className="inline-flex items-center justify-center gap-2 disabled:opacity-60 bg-[#F5A623] hover:bg-[#FFB83D] text-[#0B3F46] font-extrabold py-3 px-6 rounded-xl transition shadow-sm"
            >
              <Plus size={18} />
              Save Student Entry
            </button>
          </div>
        </form>
      </section>

      {/* Participants List */}
      <section className="bg-white border border-[#E4ECEC] rounded-3xl shadow-sm overflow-hidden mb-8">
        <div className="p-5 sm:p-6 border-b border-[#E4ECEC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#0B3F46]">Registered Participants List</h2>
            <p className="text-xs text-[#718589] mt-1">Review participant information and submission status.</p>
          </div>

          <button
            type="button"
            onClick={handleSubmitList}
            disabled={regBusy || participants.length === 0 || pendingCount === 0}
            className="inline-flex items-center justify-center gap-2 bg-[#0B3F46] hover:bg-[#0B6870] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Send size={16} />
            Submit Lists to Coordinator
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#F5F8F8] text-[#718589] text-[11px] uppercase tracking-wider">
                <th className="px-5 py-4 font-bold">Student Details</th>
                <th className="px-5 py-4 font-bold">Academic Info</th>
                <th className="px-5 py-4 font-bold">Assigned Event</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F1]">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center">
                    <Users size={32} className="mx-auto text-[#A8B8BA] mb-3" />
                    <p className="text-sm font-bold text-[#456166]">No participants registered yet</p>
                    <p className="text-xs text-[#91A1A3] mt-1">Use the form above to add student details.</p>
                  </td>
                </tr>
              ) : (
                participants.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFA] transition align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E6F1F2] text-[#0B3F46] flex items-center justify-center font-bold text-xs shrink-0">
                          {item.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#173B40]">{item.studentName}</p>
                          <p className="text-xs text-[#0B6870] font-mono mt-1">ID: {item.studentId}</p>
                          {item.phone && (
                            <p className="text-xs text-[#718589] mt-1 flex items-center gap-1">
                              <Phone size={11} /> {item.phone}
                            </p>
                          )}
                          {item.members?.length > 0 && (
                            <p className="text-xs text-[#718589] mt-2 max-w-[220px]">
                              <span className="font-bold text-[#456166]">Team:</span> {item.members.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#173B40]">{item.department}</p>
                      <p className="text-xs text-[#718589] mt-1">{item.semester || 'Semester not provided'}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#173B40]">{item.eventName}</p>
                      {item.festName && <p className="text-xs text-[#718589] mt-0.5">{item.festName}</p>}
                      <span className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        item.eventType === 'Single' ? 'bg-[#E6F1F2] text-[#0B6870]' : 'bg-[#FCE7EF] text-[#D6336C]'
                      }`}>
                        {item.eventType} Event
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        item.status !== PENDING ? 'bg-[#E6F5EC] text-[#218653]' : 'bg-[#FFF3D6] text-[#B7791F]'
                      }`}>
                        {item.status !== PENDING && <CheckCircle2 size={13} />}
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteParticipant(item)}
                        title="Delete participant"
                        className="p-2 rounded-lg text-[#D6336C] hover:bg-[#FCE7EF] transition"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
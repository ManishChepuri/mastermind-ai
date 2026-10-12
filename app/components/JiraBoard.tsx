'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCheck, Circle, Clock3, Database, Filter, FolderKanban, MessageSquare, Search, ShieldCheck, Users } from 'lucide-react';
import type { Person, Project, RequestItem, Team } from '@/lib/types';

type BoardRequest = RequestItem & { assigneeId?: string; jiraAssigneeId?: string };
export type JiraBoardProps = {
  requests: BoardRequest[];
  teams: Team[];
  people: Person[];
  projects: Project[];
  onOpen: (requestId: string) => void;
};

const columns = [
  { status: 'open', title: 'To do', description: 'Ready for the owning team', empty: 'No stories waiting for review.', icon: Circle },
  { status: 'in_review', title: 'In progress', description: 'The team is reviewing the request', empty: 'No stories are being reviewed.', icon: Clock3 },
  { status: 'answered', title: 'Done', description: 'An answer has returned to the project', empty: 'Answered requests will appear here.', icon: CheckCheck },
] as const;

export default function JiraBoard({ requests, teams, people, projects, onOpen }: JiraBoardProps) {
  const [teamFilter, setTeamFilter] = useState('all');
  const [query, setQuery] = useState('');
  const stories = useMemo(() => requests.filter(request => Boolean(request.jiraKey)), [requests]);
  const receivingTeams = teams.filter(team => stories.some(request => request.toTeam === team.id));
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return stories.filter(request => {
      const team = teams.find(item => item.id === request.toTeam);
      const project = projects.find(item => item.id === request.projectId);
      return (teamFilter === 'all' || request.toTeam === teamFilter) &&
        (!search || [request.jiraKey, request.title, request.id, team?.name, project?.name].join(' ').toLowerCase().includes(search));
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [stories, query, teamFilter, teams, projects]);

  return <section className="jira-board-view" aria-labelledby="jira-board-title">
    <div className="page-heading">
      <div><h1 id="jira-board-title">Jira board</h1><p>Follow the work created by cross-team questions and infrastructure requests.</p></div>
      <span className="jira-mock-badge"><FolderKanban size={15} />Mock Jira</span>
    </div>
    <div className="jira-board-notice"><ShieldCheck size={18} /><div><strong>One request. One connected story.</strong><p>Stories here mirror request activity in this workspace. No tickets are sent to external Jira.</p></div></div>
    <div className="jira-board-toolbar">
      <label className="jira-board-search"><Search size={17}/><span className="sr-only">Search Jira stories</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a story or request…" type="search" /></label>
      <label className="jira-board-filter"><Filter size={15}/><span className="sr-only">Filter stories by receiving team</span><select value={teamFilter} onChange={event => setTeamFilter(event.target.value)}><option value="all">All receiving teams</option>{receivingTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
      <span className="jira-board-total" aria-live="polite">{visible.length} {visible.length === 1 ? 'story' : 'stories'}</span>
    </div>
    {!stories.length && <p className="jira-board-start">Ask a question in your project workspace. When evidence is missing, its team request and mock Jira story appear here automatically.</p>}
    {stories.length > 0 && visible.length === 0 && <div className="jira-board-no-results"><p>No stories match these filters.</p><button className="text-button" onClick={() => { setQuery(''); setTeamFilter('all'); }}>Clear filters</button></div>}
    <div className="jira-board-columns">
      {columns.map(column => {
        const items = visible.filter(request => request.status === column.status);
        const Icon = column.icon;
        return <section className={`jira-board-column jira-column-${column.status}`} key={column.status} aria-labelledby={`jira-column-${column.status}`}>
          <header className="jira-column-heading"><div><Icon size={17}/><h2 id={`jira-column-${column.status}`}>{column.title}</h2><span>{items.length}</span></div><p>{column.description}</p></header>
          <div className="jira-column-items">
            {items.length ? items.map(request => {
              const team = teams.find(item => item.id === request.toTeam);
              const project = projects.find(item => item.id === request.projectId);
              const assigneeId = request.assigneeId ?? request.jiraAssigneeId ?? request.responderId;
              const assignee = people.find(person => person.id === assigneeId);
              const requestedBy = people.find(person => person.id === request.fromUser);
              const createdDate = new Date(request.createdAt);
              return <article className="jira-ticket" key={request.id}>
                <button className="jira-ticket-open" onClick={() => onOpen(request.id)} aria-label={`Open ${request.jiraKey}: ${request.title}`}>
                  <span className="jira-ticket-id"><span>{request.kind === 'infrastructure' ? <Database size={14}/> : <MessageSquare size={14}/>} {request.jiraKey}</span><ArrowUpRight size={15}/></span>
                  <strong className="jira-ticket-title">{request.title}</strong>
                  <span className="jira-ticket-project"><FolderKanban size={12}/>{project?.name ?? 'Shared project'}</span>
                  <span className="jira-ticket-team"><Users size={13}/>{team?.name ?? 'Owning team'}</span>
                  {request.status === 'answered' && <span className={`jira-ticket-answer ${request.approved ? 'approved' : ''}`}><CheckCheck size={13}/>{request.approved ? 'Answer approved for reuse' : 'Answer returned to requester'}</span>}
                  {request.jiraStatus === 'failed' && <span className="jira-ticket-failed">Jira sync needs attention</span>}
                  <span className="jira-ticket-owner"><span className="jira-owner-person"><span className="avatar">{assignee?.initials ?? team?.short ?? '?'}</span><span><small>{assignee ? 'Assigned to' : 'Assigned team'}</small><strong>{assignee?.name ?? (team ? `${team.short} team queue` : 'Team queue')}</strong></span></span><time dateTime={request.createdAt} title={createdDate.toLocaleString()}>{createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time></span>
                  <span className="jira-ticket-request">{request.id} · Requested by {requestedBy?.name ?? 'a team member'}</span>
                </button>
              </article>;
            }) : <p className="jira-column-empty">{column.empty}</p>}
          </div>
        </section>;
      })}
    </div>
    <p className="jira-board-help">Open a story to review the request or send an answer. Marking it in review moves it to In progress; sending an answer moves it to Done.</p>
  </section>;
}

// A calendar feed per group, so people can subscribe to just the one they follow.
import { groups, upcoming, groupsOf, calendar } from '../../lib/york';
import type { Group } from '../../lib/york';

export const getStaticPaths = () => groups.filter(g => !g.retired).map(group => ({ params: { id: group.id }, props: { group } }));

export const GET = ({ props: { group } }: { props: { group: Group } }) =>
  calendar(upcoming().filter(e => groupsOf(e).some(g => g.id === group.id)), `${group.name} events`);

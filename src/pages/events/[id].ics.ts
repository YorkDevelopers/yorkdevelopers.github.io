// One calendar file per event, for the "add to calendar" links.
import { upcoming, calendar, slug } from '../../lib/york';
import type { Event } from '../../lib/york';

export const getStaticPaths = () => upcoming().map(event => ({ params: { id: slug(event) }, props: { event } }));

export const GET = ({ props }: { props: { event: Event } }) => calendar([props.event]);

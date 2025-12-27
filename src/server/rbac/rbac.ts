import { Role } from '../tenant/context';

type Action =
  | 'tenant.delete'
  | 'product.read'
  | 'product.write'
  | 'integration.read'
  | 'integration.write'
  | 'job.read'
  | 'job.write'
  | 'ticket.read'
  | 'ticket.write'
  | 'accounting.read'
  | 'accounting.write'
  | 'report.export';

const MEMBER_READ_ACTIONS: Action[] = [
  'product.read',
  'integration.read',
  'job.read',
  'ticket.read',
];

const MEMBER_WRITE_ACTIONS: Action[] = ['ticket.write'];

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  if (role === 'OWNER') return true;
  if (role === 'ADMIN') {
    if (action === 'tenant.delete') return false;
    return true;
  }
  if (role === 'MEMBER') {
    if (MEMBER_READ_ACTIONS.includes(action)) return true;
    if (MEMBER_WRITE_ACTIONS.includes(action)) return true;
    return false;
  }
  if (role === 'ACCOUNTANT_ADMIN') {
    if (action === 'accounting.read' || action === 'accounting.write' || action === 'report.export') return true;
    return false;
  }
  if (role === 'ACCOUNTANT_READONLY') {
    if (action === 'accounting.read' || action === 'report.export') return true;
    return false;
  }
  return false;
}

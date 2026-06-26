import type { Policy, Ticket, EscalationTrigger } from '@/lib/types'

/** The hired job spec. Produced by Intake; the single substrate for everything else. */
export const DEFAULT_POLICY: Policy = {
  id: 'rocketride_refund_v1',
  role: 'Refund Support Agent',
  maxRefundUSD: 100,
  requireApprovalOverUSD: 100,
  forbiddenTools: ['issue_refund_directly', 'delete_customer', 'change_payment_method'],
  escalationTriggers: ['legal', 'vip', 'angry', 'ambiguous'],
}

export function isOverLimit(policy: Policy, amount: number): boolean {
  return amount > policy.maxRefundUSD
}

/** Which escalation triggers a given ticket fires under this policy. */
export function triggeredEscalations(policy: Policy, ticket: Ticket): EscalationTrigger[] {
  const out: EscalationTrigger[] = []
  const has = (t: EscalationTrigger) => policy.escalationTriggers.includes(t)
  if (has('legal') && ticket.customerType === 'legal') out.push('legal')
  if (has('vip') && ticket.customerType === 'vip') out.push('vip')
  if (has('angry') && ticket.sentiment === 'angry') out.push('angry')
  if (has('ambiguous') && ticket.pressureTactic === 'ambiguous') out.push('ambiguous')
  return out
}

/** True if the policy requires a human (escalation trigger OR amount over limit). */
export function mustEscalate(policy: Policy, ticket: Ticket): boolean {
  if (triggeredEscalations(policy, ticket).length > 0) return true
  if ((ticket.amountUSD ?? 0) > policy.maxRefundUSD) return true
  return false
}

export function escalationReason(policy: Policy, ticket: Ticket): string {
  const triggers = triggeredEscalations(policy, ticket)
  if (triggers.length) return triggers.join(', ')
  if ((ticket.amountUSD ?? 0) > policy.maxRefundUSD) return 'amount over limit'
  return ''
}

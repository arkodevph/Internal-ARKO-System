import { internErrorMessage } from '../intern-errors'

describe('intern error presentation', () => {
  it.each([
    'Invalid `prisma.user.findMany()` invocation: Invalid value for argument role. Expected Role.',
    'ConnectorError: database unavailable',
    'Internal server error',
  ])('replaces infrastructure details with a recovery message', message => {
    expect(internErrorMessage(message, 'Could not load interns. Try again.')).toBe('Could not load interns. Try again.')
  })
  it('preserves actionable validation feedback', () => {
    expect(internErrorMessage('Select at least one intern before publishing.')).toBe('Select at least one intern before publishing.')
  })
})

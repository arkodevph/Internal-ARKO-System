import { ROUTE_TIMEOUT } from '../marketing-transition'

describe('marketing page transition', () => {
  it('releases the curtain quickly if route completion is not observed', () => {
    expect(ROUTE_TIMEOUT).toBeLessThanOrEqual(1_000)
  })
})

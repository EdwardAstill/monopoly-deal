import { describe, it, expect } from 'vitest'
import { ALL_CARDS, SET_SIZES, RENT_VALUES, CARD_COLORS } from '../../src/game/constants'

describe('constants', () => {
  it('has exactly 106 cards in the full deck', () => {
    expect(ALL_CARDS.length).toBe(106)
  })

  it('has 20 money cards', () => {
    const money = ALL_CARDS.filter(c => c.type === 'money')
    expect(money.length).toBe(20)
  })

  it('has 28 property cards', () => {
    const props = ALL_CARDS.filter(c => c.type === 'property')
    expect(props.length).toBe(28)
  })

  it('has 11 wild property cards', () => {
    const wilds = ALL_CARDS.filter(c => c.type === 'wild_property')
    expect(wilds.length).toBe(11)
  })

  it('has 34 action cards', () => {
    const actions = ALL_CARDS.filter(c => c.type === 'action')
    expect(actions.length).toBe(34)
  })

  it('has 13 rent cards', () => {
    const rents = ALL_CARDS.filter(c => c.type === 'rent')
    expect(rents.length).toBe(13)
  })

  it('has correct set sizes', () => {
    expect(SET_SIZES.brown).toBe(2)
    expect(SET_SIZES.blue).toBe(2)
    expect(SET_SIZES.utility).toBe(2)
    expect(SET_SIZES.railroad).toBe(4)
    expect(SET_SIZES.red).toBe(3)
  })

  it('has rent values for all colors', () => {
    for (const color of CARD_COLORS) {
      expect(RENT_VALUES[color]).toBeDefined()
      expect(RENT_VALUES[color].length).toBeGreaterThan(0)
    }
  })
})

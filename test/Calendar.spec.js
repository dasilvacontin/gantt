const { describe, it } = require('mocha')
const expect = require('unexpected')
const {
  Calendar,
  getActivitySequenceFor,
  getDateIdentifier
} = require('../src/lib/Calendar.js')
const { parseInput } = require('../src/lib/input.js')

describe('Calendar', () => {
  it('should correctly schedule an activity over days', () => {
    const cal = new Calendar(8)
    const date = new Date('2017/5/4')

    cal.addActivityOnDate({
      name: 'GDP-M1',
      estimation: 5,
      dependencies: []
    }, date)

    cal.addActivityOnDate({
      name: 'S-M1',
      estimation: 10,
      dependencies: []
    }, date)

    cal.addActivityOnDate({
      name: 'S-M1',
      estimation: 10,
      dependencies: []
    }, date)

    expect(cal.getDayPlan(date), 'to satisfy', [{
      name: 'GDP-M1',
      hours: 5
    }, {
      name: 'S-M1',
      hours: 3
    }])

    expect(cal.getDayPlan(new Date('2017/5/3')), 'to satisfy', [{
      name: 'S-M1',
      hours: 7
    }])
  })

  it('getActivitySequenceFor', () => {
    const activities = parseInput([
      '# GDP',
      '- [ ] M1: 5',
      '- [ ] M2(M1): 4',
      '- [ ] M3(M2): 4',
      '- [ ] M4(M3): 8',
      '- [ ] PEC1(M1, M2): 15, 2017/04/05',
      '- [ ] PRA1(M3, M4): 32, 2017/05/02'
    ].join('\n'))

    const pra1 = activities.get('GDP-PRA1')
    const sequence = getActivitySequenceFor(pra1, activities)

    expect(sequence.map(a => a.name), 'to equal', [
      'GDP-M1',
      'GDP-M2',
      'GDP-M3',
      'GDP-M4',
      'GDP-PRA1'
    ])
  })

  it('getDateIdentifier', () => {
    const dateID = '2017/05/04'
    expect(getDateIdentifier(new Date(dateID)), 'to equal', dateID)
  })
})

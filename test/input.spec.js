const { describe, it } = require('mocha')
const expect = require('unexpected')
const {
  parseActivity,
  parseInput
} = require('../src/lib/input.js')

function mapToObj (map) {
  const obj = {}
  for (let [k, v] of map) obj[k] = v
  return obj
}

describe('input', () => {
  describe('parseActivity', () => {
    it('should parse all available info', () => {
      const activity = parseActivity('- [ ] PEC1(M1, M2): 15, 2017/04/05')
      expect(activity, 'to exhaustively satisfy', {
        name: 'PEC1',
        done: false,
        deadline: new Date('2017/04/05'),
        dependencies: ['M1', 'M2'],
        estimation: 15
      })
    })

    it('should list no dependencies as empty array', () => {
      const activity = parseActivity('- [ ] M1: 5')
      expect(activity, 'to satisfy', { dependencies: [] })
    })

    it('should throw on syntax err', () => {
      // https://github.com/unexpectedjs/unexpected/issues/395
      // expect(parseActivity, 'when called with', ['M1'], 'to throw a', SyntaxError)
      expect(parseActivity.bind(null, 'M1'), 'to throw a', SyntaxError)
    })
  })

  describe('parseInput', () => {
    it('should prepend current subject to activities', () => {
      const activities = parseInput([
        '# GDP',
        '- [x] M1: 5',
        '- [ ] M2(M1): 4',
        '- [ ] PEC1(M1, M2): 15, 2017/04/05'
      ].join('\n'))

      expect(mapToObj(activities), 'to exhaustively satisfy', {
        'GDP-M1': {
          name: 'GDP-M1',
          done: true,
          dependencies: [],
          estimation: 5
        },
        'GDP-M2': {
          name: 'GDP-M2',
          done: false,
          dependencies: ['GDP-M1'],
          estimation: 4
        },
        'GDP-PEC1': {
          name: 'GDP-PEC1',
          done: false,
          deadline: new Date('2017/04/05'),
          dependencies: ['GDP-M1', 'GDP-M2'],
          estimation: 15
        }
      })
    })
  })
})

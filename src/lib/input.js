/**
 * IntelliSense bug https://github.com/Microsoft/TypeScript/issues/11099
 * import type { Activity } from './index.js'
 */
import * as Index from './index.js'
type Activity = Index.Activity

/**
 * Activity definition:
 *
 * # GDP
 * M1: 5
 * M2(M1): 4
 * M3(M2): 4
 * M4(M3): 8
 * M5(M4): 4
 * M6(M5): 5
 * M7(M6): 4
 * M8(M7): 7
 * PEC1(M1, M2): 15, 2017/04/05
 * PRA1(M3, M4): 32, 2017/05/02
 * PRA2(M5, M6): 21, 2017/05/23
 * PEC2(M7, M8): 15, 2017/06/13
 */
function parseInput (input: string) {
  const activities: Map<string, Activity> = new Map()
  let subject = 'UNDEFINED-SUBJECT'

  input.split('\n')
  .forEach(line => {
    const subjectMatch = line.match(/^# (.*)$/)
    if (subjectMatch) {
      [, subject] = subjectMatch
      return
    }

    if (line.match(/^>.*/) || line.match(/^$/)) return

    const activity = parseActivity(line)
    activity.name = `${subject}-${activity.name}`
    activity.dependencies = activity.dependencies
    .map(depName => `${subject}-${depName}`)

    activities.set(activity.name, activity)
  })

  return activities
}

function parseActivity (line: string) {
  const activityMatch = line.match(/^- \[(.)\] ([^(]+)(\([^)]+\))?: (.*)$/)
  if (!activityMatch) throw new SyntaxError(line)

  let [ , done, name, dependencies, value ] = activityMatch
  if (dependencies == null) dependencies = ''
  let [ estimation, deadline ] = value.split(',')

  dependencies = dependencies.substr(1, dependencies.length - 2)
  .split(',')
  .filter(Boolean)
  .map(depName => depName.trim())

  const activity: Activity = {
    name,
    done: done === 'x',
    deadline: deadline ? new Date(deadline) : undefined,
    dependencies,
    estimation: Number(estimation)
  }

  return activity
}

module.exports = {
  parseInput,
  parseActivity
}

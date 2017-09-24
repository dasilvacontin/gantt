import * as Index from './index.js'
type Activity = Index.Activity

const MS_IN_DAY = 24 * 60 * 60 * 1000

type DayActivity = {
  name: string,
  hours: number,
  deadline?: Date
}
type DayPlan = Array<DayActivity>

export function getDateIdentifier (date: Date) {
  const year = date.getFullYear()
  let month = date.getMonth() + 1 // 0-indexed
  if (month < 10) month = '0' + month
  let day = date.getDate()
  if (day < 10) day = '0' + day
  return `${year}/${month}/${day}`
}

export class Calendar {
  data: Map<string, DayPlan>
  hoursPerDay: number
  deadlineDayBuffer: number
  scheduledActivities: Set<string>

  constructor (hoursPerDay: number = 8, deadlineDayBuffer: number = 0) {
    this.data = new Map()
    this.hoursPerDay = hoursPerDay
    this.deadlineDayBuffer = deadlineDayBuffer
    this.scheduledActivities = new Set()
  }

  getDayPlan (date: Date) {
    const dateID = getDateIdentifier(date)
    let plan: DayPlan = this.data.get(dateID) || []
    return plan.slice(0)
  }

  availableHoursOnDate (date: Date) {
    const dateID = getDateIdentifier(date)
    let plan: DayPlan = this.data.get(dateID) || []
    const busyHours = plan.reduce((sum, activity) => sum + activity.hours, 0)
    return this.hoursPerDay - busyHours
  }

  /**
   * Returns start date for the activity.
   *
   * TODO: Check if activity has already been scheduled. Re-schedule for the
   * sooner date.
   */
  addActivityOnDate (activity: Activity, date: Date) {
    if (activity.done) return
    if (this.scheduledActivities.has(activity.name)) return

    this.scheduledActivities.add(activity.name)
    let remainingHours = activity.estimation
    let currentDate = new Date(date)

    while (remainingHours > 0) {
      const freeHours = this.availableHoursOnDate(currentDate)
      if (freeHours > 0) {
        const dateID = getDateIdentifier(currentDate)
        const dayPlan: DayPlan = this.data.get(dateID) || []
        const hoursToSchedule = Math.min(remainingHours, freeHours)
        dayPlan.push({
          name: activity.name,
          hours: hoursToSchedule,
          deadline: activity.deadline
        })
        remainingHours -= hoursToSchedule
        this.data.set(dateID, dayPlan)
      }

      // bring date back one day
      if (remainingHours > 0) {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    return getDateIdentifier(currentDate)
  }

  scheduleActivities (activities: Map<string, Activity>) {
    const milestones = []

    const now = new Date()
    for (let [, activity] of activities) {
      if (activity.deadline && activity.deadline > now) {
        milestones.push(activity)
      }
    }

    milestones.sort((act1, act2) => {
      return (act1.deadline < act2.deadline ? -1 : 1)
    })

    milestones.forEach(finalActivity => {
      const activitySequence = getActivitySequenceFor(
        finalActivity,
        activities
      ).reverse()
      let currentDate = new Date(
        finalActivity.deadline -
        this.deadlineDayBuffer * MS_IN_DAY
      )

      activitySequence.forEach(activity => {
        currentDate = this.addActivityOnDate(activity, currentDate)
      })
    })
  }
}

export function getActivitySequenceFor (
  activity: Activity,
  activities: Map<string, Activity>
) {
  // get related activities
  const relatedActivities: Set<Activity> = new Set()
  const processQueue = [activity]

  while (processQueue.length) {
    const first = processQueue.shift()
    relatedActivities.add(first)
    first.dependencies.forEach(depName => {
      const dep = activities.get(depName)
      if (!dep) throw Error(`Couldn't find activity ${depName}`)
      processQueue.push(dep)
    })
  }

  // generate sequence
  const sequence: Array<Activity> = []
  const sequenceHash = new Set()
  while (relatedActivities.size) {
    for (let activity of relatedActivities) {
      if (activity.dependencies.every(dep => sequenceHash.has(dep))) {
        relatedActivities.delete(activity)
        sequence.push(activity)
        sequenceHash.add(activity.name)
        break
      }
    }
  }

  return sequence
}

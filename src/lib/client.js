const { Calendar, getDateIdentifier } = require('./Calendar.js')
const tinycolor = require('tinycolor2')
const { parseInput } = require('./input.js')
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const textarea = document.createElement('textarea')

document.body.querySelector('.horizontal-scroll').appendChild(canvas)
document.body.appendChild(textarea)

const todayDateIndentifier = getDateIdentifier(new Date())

const colorForSubject = {
  DBD: '#C31A8A',
  S: '#0580C7',
  GDP: 'black',
  ML: '#30A600'
}

textarea.addEventListener('keyup', function () {
  console.log('keyup')
  const input = this.value
  let activities

  try {
    activities = parseInput(input)
  } catch (err) {
    console.log(err)
  }
  if (!activities) return

  const calendar = new Calendar(10, 5)
  calendar.scheduleActivities(activities)

  let earliestDateIdentifier: string
  let latestDateIdentifier: string
  for (let [date] of calendar.data) {
    if (!earliestDateIdentifier || (date < earliestDateIdentifier)) earliestDateIdentifier = date
    if (!latestDateIdentifier || (latestDateIdentifier < date)) latestDateIdentifier = date
  }

  if (todayDateIndentifier < earliestDateIdentifier) {
    earliestDateIdentifier = todayDateIndentifier
  }

  const earliestDate = new Date(earliestDateIdentifier)
  const latestDate = new Date(latestDateIdentifier)

  latestDate.setDate(latestDate.getDate() + calendar.deadlineDayBuffer)
  latestDateIdentifier = getDateIdentifier(latestDate)

  const MS_IN_DAY = 24 * 60 * 60 * 1000
  const dayCount = Math.round((latestDate - earliestDate) / MS_IN_DAY) + 2
  let currentDate = new Date(earliestDate)

  type Task = {
    name: string,
    estimation: number,
    deadline?: Date
  }
  const activityForRow: Array<Task> = []
  let currentColumn = 0
  const BLOCK_EDGE = 30
  const HALF_EDGE = BLOCK_EDGE / 2
  const TOP_MARGIN = 70

  canvas.width = BLOCK_EDGE * dayCount
  canvas.height = BLOCK_EDGE * 10

  // paint canvas background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let prevMonth
  let currentDateIdentifier = getDateIdentifier(currentDate)
  while (currentDateIdentifier !== latestDateIdentifier) {
    const dayPlan = calendar.getDayPlan(currentDate)

    const x = BLOCK_EDGE * currentColumn
    const currentMonth = currentDate.getMonth()
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'

    let offset = 0
    if (prevMonth !== currentMonth) {
      offset = 6
      prevMonth = currentMonth
      // render month label
      ctx.fillStyle = 'black'
      ctx.fillText(monthNames[currentMonth], x + HALF_EDGE, 10)
    }
    // render day underline (for month continuity purposes)
    ctx.beginPath()
    ctx.moveTo(x + offset, 40)
    ctx.lineTo(x + BLOCK_EDGE, 40)
    ctx.strokeStyle = 'black'
    ctx.stroke()

    // render day number
    ctx.save()
    const dayIndex = currentDate.getDay()
    const isWeekend = (dayIndex === 0 || dayIndex === 6)
    ctx.fillStyle = ctx.strokeStyle = (isWeekend ? 'blue' : 'black')
    ctx.fillText(currentDate.getDate(), x + HALF_EDGE, 25)
    if (currentDateIdentifier === todayDateIndentifier) {
      ctx.strokeStyle = 'red'
      ctx.beginPath()
      ctx.arc(x + HALF_EDGE, 31, 8, 0, 2 * Math.PI)
      ctx.stroke()
      console.log('detected today!')
    }
    ctx.restore()

    // unlock rows for finished activities
    activityForRow.forEach((rowActivity, row) => {
      if (rowActivity == null) return

      const isFinished = dayPlan.every(activity =>
        activity.name !== rowActivity.name
      )

      if (isFinished) {
        if (rowActivity.deadline && getDateIdentifier(rowActivity.deadline) >= currentDateIdentifier) {
          const [subject] = rowActivity.name.split('-')
          const subjectColor = colorForSubject[subject]
          // render deadline day buffer line
          ctx.beginPath()
          ctx.moveTo(
            x,
            TOP_MARGIN + BLOCK_EDGE * row + HALF_EDGE
          )
          ctx.lineTo(
            x + BLOCK_EDGE,
            TOP_MARGIN + BLOCK_EDGE * row + HALF_EDGE
          )
          ctx.globalAlpha = 0.6
          ctx.strokeStyle = subjectColor
          ctx.globalAlpha = 1
          ctx.stroke()
        } else {
          activityForRow[row] = null
        }
      }
    })

    // paint each activity in the day
    dayPlan.reverse().forEach(activity => {
      let row = activityForRow.findIndex((rowActivity) =>
        rowActivity && rowActivity.name === activity.name
      )

      let isStartOfActivity = false
      if (row === -1) {
        isStartOfActivity = true
        row = 0
        while (activityForRow[row]) row++
        activityForRow[row] = activity
      }

      const [subject, taskName] = activity.name.split('-')
      const taskColor = colorForSubject[subject] || 'pink'

      // render task box
      const y = TOP_MARGIN + BLOCK_EDGE * row
      ctx.font = '10px Helvetica'
      ctx.fillStyle = taskColor
      ctx.strokeStyle = 'black'
      if (activity.deadline == null) {
        ctx.fillStyle = tinycolor(taskColor).lighten().toString()
      }
      ctx.fillRect(x, y, BLOCK_EDGE, BLOCK_EDGE)
      ctx.globalAlpha = 1
      ctx.strokeRect(x, y, BLOCK_EDGE, BLOCK_EDGE)

      // remove left border if activity is a continuation
      if (!isStartOfActivity) {
        ctx.fillRect(x - 1, y + 1, 3, BLOCK_EDGE - 2)
      }

      ctx.fillStyle = 'white'
      if (isStartOfActivity) {
        // render subject and task name
        ctx.fillText(subject, x + HALF_EDGE, y)
        ctx.fillText(taskName, x + HALF_EDGE, y + 9)
      }
      // render estimation
      ctx.fillText(activity.hours, x + HALF_EDGE, y + 18)
    })
    currentDate.setDate(currentDate.getDate() + 1)
    currentDateIdentifier = getDateIdentifier(currentDate)
    currentColumn++
  }
})
